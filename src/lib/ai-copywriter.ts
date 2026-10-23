import type { LeadAnalysisSection } from "@/lib/lead-analysis";

interface LeadInfo {
  name: string;
  company: string | null;
}

async function callAnthropic(prompt: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Adicione a chave da Anthropic nas variáveis de ambiente para gerar os textos."
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erro ao gerar texto com a Anthropic (${response.status}): ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();

  // A resposta pode trazer outros tipos de bloco antes do texto (ex: um
  // bloco de "thinking"), então procura por todos os blocos de texto em vez
  // de assumir que o primeiro item da lista já é o texto.
  const contentBlocks: Array<{ type?: string; text?: string }> = Array.isArray(data?.content) ? data.content : [];
  const text = contentBlocks
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) {
    const blockTypes = contentBlocks.map((b) => b?.type).join(", ") || "nenhum";
    throw new Error(
      `A API da Anthropic não retornou texto (motivo: ${data?.stop_reason ?? "desconhecido"}, blocos recebidos: ${blockTypes}).`
    );
  }

  return text;
}

function notesBlockFrom(sections: LeadAnalysisSection[]): string {
  return sections
    .filter((s) => s.title.trim() || s.content.trim())
    .map((s) => `${s.title}:\n${s.content}`)
    .join("\n\n");
}

// Texto técnico para o relatório (PDF): analisa as anotações da agência de
// forma estruturada, por seção — não usa SDK, só fetch direto na API da
// Anthropic, pra não adicionar dependência.
export async function generateReportText(
  lead: LeadInfo,
  sections: LeadAnalysisSection[],
  agencyName: string
): Promise<string> {
  const displayName = lead.company || lead.name;
  const notesBlock = notesBlockFrom(sections);

  if (!notesBlock.trim()) {
    throw new Error("Escreva ao menos uma seção de análise antes de gerar os textos.");
  }

  const prompt = `Você é analista de marketing da agência "${agencyName}", escrevendo a seção de análise de um relatório técnico em PDF sobre o negócio "${displayName}".

Abaixo estão anotações internas, cruas, feitas pela agência (pontos observados em redes sociais, site, apps de delivery, Google, etc.). Reescreva-as como um texto técnico e analítico, em português do Brasil, organizado por tópico (mantenha os títulos das seções que fizerem sentido, ex: "Redes Sociais", "Site", "Google"). Para cada tópico: descreva o que foi observado e explique o porquê aquilo importa (o impacto no negócio), com tom consultivo e profissional — não é uma mensagem de venda, é a análise de fato, para o cliente entender o diagnóstico. Não invente dados, números ou fatos que não estão nas anotações. Não use markdown (sem #, sem **); use apenas texto simples com quebras de linha separando os tópicos, e o nome do tópico em uma linha isolada antes do parágrafo correspondente.

Anotações internas:
${notesBlock}`;

  return callAnthropic(prompt, 2048);
}

// Gera um rascunho das seções de análise (dores + o que a agência pode
// fazer) a partir dos dados já levantados na prospecção (lead.notes: site,
// redes sociais, nota no Google, etc. — ver buildAisaNotes em
// actions/prospeccao.ts). Não salva nada sozinho: o rascunho volta pro
// editor pra equipe revisar/ajustar antes de salvar, igual já acontece com
// uma seção escrita à mão.
export async function generateAnalysisDraft(
  lead: LeadInfo,
  rawNotes: string,
  agencyName: string
): Promise<LeadAnalysisSection[]> {
  const displayName = lead.company || lead.name;

  if (!rawNotes.trim()) {
    throw new Error("Esse lead não tem dados de prospecção suficientes para gerar uma análise automática.");
  }

  const prompt = `Você é consultor de marketing digital da agência "${agencyName}", preparando uma análise comercial do negócio "${displayName}" para uma proposta.

Dados levantados na prospecção (busca automática em Google Maps/Instagram/site — pode estar incompleto):
${rawNotes}

Com base SOMENTE nesses dados (nunca invente números, avaliações ou fatos que não estão aí), identifique as principais dores/oportunidades perdidas desse negócio e o que a agência poderia fazer a respeito. Gere de 2 a 4 seções, cada uma sobre um tema diferente que tenha informação suficiente nos dados acima (ex: "Site", "Redes Sociais", "Google", "Presença Online") — não crie seção para um tema sem nenhum dado correspondente.

Para cada seção, escreva um parágrafo curto (3 a 5 frases) que: (1) diga o que foi observado, usando os dados específicos fornecidos (nome, nota, se tem site, etc.) sempre que possível; (2) explique por que isso custa clientes/vendas pro negócio; (3) aponte o que a agência poderia fazer pra resolver. Tom consultivo e direto, português do Brasil, sem soar genérico ou robótico.

Responda APENAS com um array JSON nesse formato exato, sem nenhum texto antes ou depois, sem markdown:
[{"title": "Nome da seção", "content": "Parágrafo da análise..."}]`;

  const raw = await callAnthropic(prompt, 2048);

  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("A IA não retornou a análise no formato esperado. Tente novamente.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw new Error("A IA não retornou a análise no formato esperado. Tente novamente.");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("A IA não retornou a análise no formato esperado. Tente novamente.");
  }

  const sections = parsed
    .map((item) => ({
      title: typeof item?.title === "string" ? item.title.trim() : "",
      content: typeof item?.content === "string" ? item.content.trim() : "",
    }))
    .filter((s) => s.title && s.content);

  if (!sections.length) {
    throw new Error("A IA não encontrou dados suficientes para montar uma análise. Complete os dados do lead e tente de novo.");
  }

  return sections;
}

// Texto curto para a primeira abordagem no WhatsApp — não é a análise em
// si, é um gancho direto para o cliente querer receber o PDF da análise.
export async function generateWhatsappTeaser(lead: LeadInfo, agencyName: string): Promise<string> {
  const displayName = lead.company || lead.name;

  const prompt = `Você é da agência de marketing "${agencyName}" e vai mandar a primeira mensagem de WhatsApp para o negócio "${displayName}", que ainda não é cliente.

A agência já fez uma análise completa (site, redes sociais, Google, etc.) e vai enviar o PDF dessa análise em seguida — mas SÓ depois que o dono demonstrar interesse. Escreva uma mensagem curta (2 a 4 frases), direta, em português do Brasil, que desperte curiosidade sem entregar o conteúdo da análise — sem listar os pontos encontrados, sem citar números específicos. Mencione que a agência analisou o negócio dele e encontrou pontos que podem estar custando clientes/vendas, e pergunte se ele quer receber a análise completa em PDF. Tom direto, humano, sem parecer robô nem spam. Não use markdown, apenas texto simples.`;

  return callAnthropic(prompt, 512);
}
