const API_BASE = "https://api.aisa.one/apis/v1";

/**
 * Dominios que NAO configuram site proprio (redes sociais, agregadores de link,
 * diretorios e guias). Mesma lista usada na skill de prospeccao original.
 */
const NON_WEBSITE_DOMAINS = [
  "instagram.com", "facebook.com", "fb.com", "linkedin.com", "tiktok.com", "youtube.com", "twitter.com", "x.com",
  "linktr.ee", "beacons.ai", "heylink.me", "taplink.cc", "lnk.bio", "campsite.bio", "bio.site", "link.tree", "linkbio.co",
  "apontador.com.br", "guiamais.com.br", "telelistas.net", "econodata.com.br", "solutudo.com.br", "consultacnpj.com",
  "cnpj.biz", "situacaocadastral.info", "casadosdados.com.br", "encontrateresina.com", "encontrafortaleza.com",
  "encontrasaopaulo.com", "salaodebeleza.org", "acharesteticas.com.br",
  "tripadvisor.com.br", "tripadvisor.com", "ifood.com.br", "kekanto.com.br", "rappi.com.br", "pedidosja.com.br", "deliverydireto.com.br",
  "trinks.com", "booksy.com", "avec.com.br", "google.com/maps", "maps.google.com", "wa.me",
];

const GENERIC_NAMES = new Set([
  "salão de beleza", "salao de beleza", "salão", "salao", "barbearia",
  "restaurante", "lanchonete", "pizzaria", "clínica", "clinica",
  "consultório", "consultorio", "mercado", "padaria", "academia", "loja",
  "estética", "estetica", "pet shop", "petshop", "escritório", "escritorio",
  "oficina", "farmácia", "farmacia", "hotel", "pousada", "agência", "agencia",
]);

export type FiltroSite = "todos" | "sem-site" | "com-site";

export interface AisaLead {
  nome: string;
  categoria: string;
  endereco: string;
  telefone: string;
  whatsappLink: string;
  temWhatsapp: boolean;
  instagramUrl: string;
  linkedinUrl: string;
  temSiteProprio: boolean;
  siteUrl: string;
  tipoSite: string;
  nota: number | null;
  numeroAvaliacoes: number | null;
  googleMapsUrl: string;
}

interface BuscarLeadsParams {
  nicho: string;
  cidade: string;
  bairro?: string;
  quantidade?: number;
  filtroSite?: FiltroSite;
  apiKey: string;
}

function buildPrompt(nicho: string, cidade: string, bairro: string, quantidade: number): { system: string; user: string } {
  const local = bairro ? `${bairro}, ${cidade}` : cidade;
  const pedirQuantidade = Math.min(Math.max(quantidade * 2, quantidade + 10), 40);

  const system =
    "Você é um assistente sênior de inteligência comercial e prospecção de clientes locais no Brasil. " +
    "Sua missão é pesquisar e cruzar dados de 3 fontes essenciais: 1. GOOGLE MAPS, 2. INSTAGRAM e 3. LINKEDIN.\n\n" +
    "REQUISITO CRÍTICO DE CONTATO:\n" +
    "- Sempre que identificar uma empresa, extraia o telefone/celular/WhatsApp comercial com DDD (do Maps, Instagram ou LinkedIn).\n" +
    "- Extraia perfil do Instagram (@handle ou link) e o link divulgado na bio/site.\n" +
    "- Classifique 'tem_site_proprio: false' se a empresa utilizar apenas Instagram, LinkedIn, Linktree, Bio.site, guias ou diretórios; " +
    "e 'tem_site_proprio: true' SOMENTE se possuir domínio web próprio exclusivo.\n\n" +
    "Responda estruturando os estabelecimentos encontrados no formato de array JSON.";

  const user =
    `Pesquise e liste de ${quantidade} a ${pedirQuantidade} empresas, corretoras, consultorias, escritórios e estabelecimentos comerciais de ${nicho} em ${local}.\n` +
    `Para cada empresa encontrada na região de ${cidade}, inclua telefone/celular/WhatsApp comercial com DDD, endereço completo com bairro, link do site e redes sociais.\n\n` +
    "Estruture os estabelecimentos encontrados no seguinte formato JSON:\n" +
    "```json\n[\n  {\n" +
    '    "nome": "Nome da Empresa",\n' +
    `    "categoria": "${nicho}",\n` +
    `    "endereco": "Endereço em ${cidade}",\n` +
    '    "telefone_whatsapp": "Telefone com DDD",\n' +
    '    "instagram_url": "https://instagram.com/...",\n' +
    '    "linkedin_url": "https://linkedin.com/...",\n' +
    '    "site_url": "https://...",\n' +
    '    "tem_site_proprio": true,\n' +
    '    "nota": 4.8,\n' +
    '    "numero_avaliacoes": 50,\n' +
    '    "google_maps_url": ""\n  }\n]\n```';

  return { system, user };
}

async function callAisa(model: string, system: string, user: string, apiKey: string): Promise<string> {
  const url = `${API_BASE}/perplexity/${model}`;
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error(
          `Erro HTTP ${response.status} ao chamar a API da AIsa. Detalhe: ${detail.slice(0, 300)}. ` +
            "Verifique se a chave AISA_API_KEY está correta e ativa."
        );
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content ?? data?.content;
      if (!content) {
        throw new Error("Não foi possível localizar o texto da resposta no JSON retornado pela API da AIsa.");
      }
      return content as string;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt >= maxRetries) break;
    }
  }
  throw lastError ?? new Error("Falha inesperada ao chamar a API da AIsa.");
}

function coerceToLeadList(parsed: unknown): Record<string, unknown>[] {
  function flatten(x: unknown): Record<string, unknown>[] {
    if (Array.isArray(x)) return x.flatMap(flatten);
    if (x && typeof x === "object") return [x as Record<string, unknown>];
    return [];
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if ("nome" in obj) return [obj];
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) return flatten(value);
    }
    return [];
  }
  return flatten(parsed);
}

function extractJsonArray(text: string): Record<string, unknown>[] {
  const tryParse = (candidate: string): Record<string, unknown>[] | null => {
    if (!candidate) return null;
    const cleaned = candidate.replace(/,\s*([\]}])/g, "$1").replace(/\[\d+\]/g, "");
    try {
      return coerceToLeadList(JSON.parse(cleaned));
    } catch {
      try {
        return coerceToLeadList(JSON.parse(candidate));
      } catch {
        return null;
      }
    }
  };

  const mdMatches = Array.from(text.matchAll(/```(?:json)?\s*([[{][\s\S]*?[\]}])\s*```/gi));
  for (const m of mdMatches) {
    const res = tryParse(m[1]);
    if (res && res.length) return res;
  }

  const startBracket = text.indexOf("[");
  const endBracket = text.lastIndexOf("]");
  if (startBracket !== -1 && endBracket > startBracket) {
    const res = tryParse(text.slice(startBracket, endBracket + 1));
    if (res && res.length) return res;
  }

  const startBrace = text.indexOf("{");
  const endBrace = text.lastIndexOf("}");
  if (startBrace !== -1 && endBrace > startBrace) {
    const res = tryParse(text.slice(startBrace, endBrace + 1));
    if (res && res.length) return res;
  }

  return [];
}

function isGenericName(nome: string, categoria: string, nicho: string): boolean {
  const n = String(nome || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!n) return true;
  if (GENERIC_NAMES.has(n)) return true;
  for (const base of [categoria, nicho]) {
    const b = String(base || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (b && n === b) return true;
  }
  return false;
}

function classifySite(
  rawSiteUrl: string,
  temSiteProprioFlag: unknown,
  instagramUrl: string,
  linkedinUrl: string
): { temSiteProprio: boolean; siteUrl: string; tipoSite: string } {
  const url = String(rawSiteUrl || "").trim().toLowerCase();

  if (!url || ["none", "null", "false", "—", "-"].includes(url)) {
    if (instagramUrl) return { temSiteProprio: false, siteUrl: "", tipoSite: "Sem site (apenas Instagram)" };
    if (linkedinUrl) return { temSiteProprio: false, siteUrl: "", tipoSite: "Sem site (apenas LinkedIn)" };
    return { temSiteProprio: false, siteUrl: "", tipoSite: "Sem site próprio" };
  }

  for (const d of NON_WEBSITE_DOMAINS) {
    if (url.includes(d)) {
      if (["linktr.ee", "beacons", "taplink", "lnk.bio"].some((x) => url.includes(x))) {
        return { temSiteProprio: false, siteUrl: rawSiteUrl, tipoSite: "Sem site (Linktree / Agregador)" };
      }
      if (url.includes("instagram.com")) {
        return { temSiteProprio: false, siteUrl: rawSiteUrl, tipoSite: "Sem site (apenas Instagram)" };
      }
      if (url.includes("linkedin.com")) {
        return { temSiteProprio: false, siteUrl: rawSiteUrl, tipoSite: "Sem site (apenas LinkedIn)" };
      }
      if (["ifood", "tripadvisor", "kekanto", "delivery"].some((x) => url.includes(x))) {
        return { temSiteProprio: false, siteUrl: rawSiteUrl, tipoSite: "Sem site (Guia / Delivery / TripAdvisor)" };
      }
      if (["trinks", "booksy", "avec"].some((x) => url.includes(x))) {
        return { temSiteProprio: false, siteUrl: rawSiteUrl, tipoSite: "Sem site (App de Agendamento)" };
      }
      return { temSiteProprio: false, siteUrl: rawSiteUrl, tipoSite: "Sem site (Diretório / Guia Comercial)" };
    }
  }

  if (temSiteProprioFlag === false || ["false", "0", "nao", "não"].includes(String(temSiteProprioFlag).toLowerCase())) {
    return { temSiteProprio: false, siteUrl: rawSiteUrl, tipoSite: "Sem site próprio" };
  }

  return { temSiteProprio: true, siteUrl: rawSiteUrl, tipoSite: "Com site próprio" };
}

function normalizeWhatsapp(raw: unknown): { telefoneRaw: string; whatsappLink: string } {
  if (!raw) return { telefoneRaw: "", whatsappLink: "" };
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return { telefoneRaw: String(raw), whatsappLink: "" };
  if (digits.length === 10 || digits.length === 11) digits = "55" + digits;
  return { telefoneRaw: String(raw), whatsappLink: `https://wa.me/${digits}` };
}

async function fetchInstagramProfile(
  handleOrUrl: string,
  apiKey: string
): Promise<{ biografia?: string; linkBio?: string; telefoneInstagram?: string; seguidores?: number } | null> {
  if (!handleOrUrl || !apiKey) return null;
  let handle = handleOrUrl.trim().replace(/\/$/, "");
  if (handle.includes("instagram.com/")) {
    handle = handle.split("instagram.com/")[1].split("/")[0].split("?")[0];
  }
  handle = handle.replace(/^@/, "").trim();
  if (!handle || handle.includes("/") || handle.length > 35) return null;

  try {
    const response = await fetch(`${API_BASE}/instagram/profile?handle=${encodeURIComponent(handle)}`, {
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    });
    if (!response.ok) return null;
    const data = await response.json();
    const user = data?.data?.user;
    if (!user) return null;

    const bio: string = user.biography || "";
    const bioLinks = user.bio_links;
    let extUrl = "";
    if (Array.isArray(bioLinks) && bioLinks.length > 0) extUrl = bioLinks[0]?.url || "";
    else if (user.external_url) extUrl = user.external_url;

    let phone: string = user.public_phone_number || user.contact_phone_number || "";
    if (!phone && bio) {
      const bioPhones = extractPhonesFromText(bio);
      if (bioPhones.length) phone = bioPhones[0];
    }

    return {
      biografia: bio,
      linkBio: extUrl,
      telefoneInstagram: phone,
      seguidores: user.follower_count,
    };
  } catch {
    return null;
  }
}

function extractPhonesFromText(text: string): string[] {
  if (!text) return [];
  const waLinks = Array.from(text.matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=|whatsapp:\/\/send\?phone=)(\d{10,13})/gi));
  if (waLinks.length) return [waLinks[0][1]];

  const matches = Array.from(text.matchAll(/(?:\+?55\s?)?(?:\(?([1-9]{2})\)?\s?)?(?:(9\s?\d{4})[-\s]?(\d{4})|(\d{4})[-\s]?(\d{4}))/g));
  const results: string[] = [];
  for (const m of matches) {
    const raw = m.slice(1).filter(Boolean).join("");
    const digits = raw.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) results.push(digits);
    else if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) results.push(digits.slice(2));
  }
  return results;
}

function dedupKey(lead: AisaLead): string {
  if (lead.instagramUrl) return `ig:${lead.instagramUrl.toLowerCase().replace(/\/$/, "")}`;
  if (lead.linkedinUrl) return `li:${lead.linkedinUrl.toLowerCase().replace(/\/$/, "")}`;
  if (lead.telefone) return `tel:${lead.telefone.replace(/\D/g, "")}`;
  return `ne:${lead.nome.toLowerCase()}:${lead.endereco.toLowerCase()}`;
}

async function normalizeLead(item: Record<string, unknown>, apiKey: string): Promise<AisaLead> {
  const nome = String(item.nome || "").trim();
  const rawTel = item.telefone_whatsapp || item.telefone || item.whatsapp || item.contato || item.phone;
  let { telefoneRaw, whatsappLink } = normalizeWhatsapp(rawTel);

  let nota: number | null = null;
  if (item.nota != null) {
    const n = Number(item.nota);
    if (!Number.isNaN(n)) nota = Math.round(n * 10) / 10;
  }
  let numeroAvaliacoes: number | null = null;
  if (item.numero_avaliacoes != null) {
    const n = Number(item.numero_avaliacoes);
    if (!Number.isNaN(n)) numeroAvaliacoes = Math.trunc(n);
  }

  let rawIg = String(item.instagram_url || item.instagram || item.perfil_instagram || item.ig || "").trim();
  if (rawIg && !rawIg.startsWith("http") && !rawIg.includes("/")) {
    rawIg = `https://instagram.com/${rawIg.replace(/^@/, "")}`;
  }

  let rawLi = String(item.linkedin_url || item.linkedin || item.perfil_linkedin || "").trim();
  if (rawLi && !rawLi.startsWith("http") && !rawLi.includes("/")) {
    rawLi = `https://www.linkedin.com/company/${rawLi.replace(/^@/, "")}`;
  }

  let rawSiteUrl = String(item.site_url || item.site || item.website || "").trim();
  const temSiteFlag = item.tem_site_proprio ?? item.tem_site;

  if (rawIg && apiKey && (!rawSiteUrl || !telefoneRaw)) {
    const igData = await fetchInstagramProfile(rawIg, apiKey);
    if (igData) {
      if (!rawSiteUrl && igData.linkBio) rawSiteUrl = igData.linkBio;
      if (!telefoneRaw && igData.telefoneInstagram) {
        const normalized = normalizeWhatsapp(igData.telefoneInstagram);
        telefoneRaw = normalized.telefoneRaw;
        whatsappLink = normalized.whatsappLink;
      }
    }
  }

  if (!whatsappLink && rawSiteUrl && ["wa.me", "api.whatsapp.com", "wa.link"].some((d) => rawSiteUrl.includes(d))) {
    whatsappLink = rawSiteUrl;
    if (!telefoneRaw) telefoneRaw = "WhatsApp Direto";
  }

  const { temSiteProprio, siteUrl, tipoSite } = classifySite(rawSiteUrl, temSiteFlag, rawIg, rawLi);

  return {
    nome,
    categoria: String(item.categoria || "").trim(),
    endereco: String(item.endereco || "").trim(),
    telefone: telefoneRaw,
    whatsappLink,
    temWhatsapp: Boolean(whatsappLink),
    instagramUrl: rawIg,
    linkedinUrl: rawLi,
    temSiteProprio,
    siteUrl,
    tipoSite,
    nota,
    numeroAvaliacoes,
    googleMapsUrl: String(item.google_maps_url || "").trim(),
  };
}

export async function searchAisaLeads({
  nicho,
  cidade,
  bairro = "",
  quantidade = 20,
  filtroSite = "todos",
  apiKey,
}: BuscarLeadsParams): Promise<AisaLead[]> {
  if (!apiKey) {
    throw new Error("AISA_API_KEY não configurada. Adicione a chave da AIsa nas variáveis de ambiente.");
  }

  const quantidadeFinal = Math.min(Math.max(quantidade, 1), 40);
  const { system, user } = buildPrompt(nicho, cidade, bairro, quantidadeFinal);
  const content = await callAisa("sonar-pro", system, user, apiKey);
  const rawItems = extractJsonArray(content);

  if (!rawItems.length) {
    throw new Error(
      "A busca não encontrou nenhum estabelecimento no formato esperado. Tente outro bairro ou nicho."
    );
  }

  const comNomeReal = rawItems.filter(
    (item) => item.nome && !isGenericName(String(item.nome), String(item.categoria || ""), nicho)
  );

  for (const item of comNomeReal) {
    if (!item.google_maps_url) {
      const query = `${item.nome || ""} ${item.endereco || ""} ${cidade}`.trim();
      item.google_maps_url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
  }

  const normalizados = await Promise.all(comNomeReal.map((item) => normalizeLead(item, apiKey)));

  const dedup = new Map<string, AisaLead>();
  for (const lead of normalizados) dedup.set(dedupKey(lead), lead);
  const unicos = Array.from(dedup.values());

  if (filtroSite === "sem-site") return unicos.filter((l) => !l.temSiteProprio);
  if (filtroSite === "com-site") return unicos.filter((l) => l.temSiteProprio);
  return unicos;
}
