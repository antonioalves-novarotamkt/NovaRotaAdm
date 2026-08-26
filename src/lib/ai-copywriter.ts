import type { LeadAnalysisSection } from "@/lib/lead-analysis";

interface LeadInfo {
  name: string;
  company: string | null;
}

// Reescreve as seções de análise (anotações internas da agência) num texto
// único, persuasivo e em português, pronto para enviar ao cliente. Não usa
// SDK — só fetch direto na API da Anthropic, pra não adicionar dependência.
export async function generateClientPitch(
  lead: LeadInfo,
  sections: LeadAnalysisSection[],
  agencyName: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada. Adicione a chave da Anthropic nas variáveis de ambiente para gerar a versão para o cliente."
    );
  }

  const displayName = lead.company || lead.name;
  const notesBlock = sections
    .filter((s) => s.title.trim() || s.content.trim())
    .map((s) => `${s.title}:\n${s.content}`)
    .join("\n\n");

  if (!notesBlock.trim()) {
    throw new Error("Escreva ao menos uma seção de análise antes de gerar a versão para o cliente.");
  }

  const prompt = `Você é copywriter da agência de marketing "${agencyName}". Abaixo estão anotações internas, cruas, sobre uma análise que a agência fez do negócio "${displayName}" (pontos fracos e oportunidades identificadas em redes sociais, site, apps de delivery, etc.).

Reescreva essas anotações como um texto único, corrido, em português do Brasil, para enviar diretamente ao cliente (ex: por WhatsApp). O objetivo é despertar interesse e vender uma reunião ou proposta com a agência — sem inventar dados que não estão nas anotações, sem exagerar números, sem soar genérico ou robótico. Tom: consultivo, direto, confiante, próximo — não formal demais. Comece cumprimentando e mencionando que analisou o negócio; termine convidando para uma conversa. Não use markdown, apenas texto simples (pode usar quebras de linha).

Anotações internas:
${notesBlock}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 2048,
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
