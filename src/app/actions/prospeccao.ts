"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { searchAisaLeads, AisaTimeoutError, type AisaLead, type FiltroSite, type AisaFonte, AISA_FONTES_PADRAO } from "@/lib/aisa-prospect";

export interface AisaProspectResult extends AisaLead {
  alreadyLead: boolean;
}

// Uma linha por informação (chave: valor), para que a UI do Funil consiga
// extrair de volta os links (Google Maps, Site, Instagram, LinkedIn) e
// exibi-los como links clicáveis separados em vez de um texto corrido.
function buildAisaNotes(lead: AisaLead): string {
  const parts: string[] = [];
  if (lead.categoria) parts.push(`Categoria: ${lead.categoria}`);
  if (lead.endereco) parts.push(`Endereço: ${lead.endereco}`);
  parts.push(lead.temSiteProprio ? `Site: ${lead.siteUrl}` : `Site: ${lead.tipoSite}`);
  if (lead.email) parts.push(`Email: ${lead.email}`);
  if (lead.instagramUrl) parts.push(`Instagram: ${lead.instagramUrl}`);
  if (lead.facebookUrl) parts.push(`Facebook: ${lead.facebookUrl}`);
  if (lead.linkedinUrl) parts.push(`LinkedIn: ${lead.linkedinUrl}`);
  if (lead.nota != null) {
    parts.push(`Nota Maps: ${lead.nota}${lead.numeroAvaliacoes != null ? ` (${lead.numeroAvaliacoes} avaliações)` : ""}`);
  }
  if (lead.googleMapsUrl) parts.push(`Google Maps: ${lead.googleMapsUrl}`);
  return parts.join("\n");
}

export type AisaSearchResponse =
  | { ok: true; results: AisaProspectResult[]; imported: number; total: number }
  | { ok: false; error: string };

// A pagina /prospeccao tem maxDuration = 60s na Vercel. A busca para alguns
// segundos antes disso para sempre conseguir responder com uma mensagem clara.
const LIMITE_BUSCA_MS = 55000;

// Erros lancados por uma server action chegam ao navegador mascarados em producao,
// entao a busca devolve { ok: false, error } com a mensagem pronta para a tela.
export async function searchAndImportLeadsAisa(
  nicho: string,
  cidade: string,
  bairro: string,
  filtroSite: FiltroSite,
  fontes: AisaFonte[] = AISA_FONTES_PADRAO
): Promise<AisaSearchResponse> {
  const deadline = Date.now() + LIMITE_BUSCA_MS;
  try {
    return await buscarEImportar(nicho, cidade, bairro, filtroSite, fontes, deadline);
  } catch (err) {
    if (err instanceof AisaTimeoutError) {
      return {
        ok: false,
        error:
          "A busca demorou mais que o limite do servidor e foi interrompida. " +
          "Tente de novo marcando menos fontes (por exemplo só Google Maps e Telefone) ou sem o bairro.",
      };
    }
    console.error("[prospeccao] erro na busca AIsa:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erro inesperado ao buscar." };
  }
}

async function buscarEImportar(
  nicho: string,
  cidade: string,
  bairro: string,
  filtroSite: FiltroSite,
  fontes: AisaFonte[],
  deadline: number
): Promise<AisaSearchResponse> {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autenticado.");

  if (!nicho.trim() || !cidade.trim()) {
    throw new Error("Nicho e cidade são obrigatórios.");
  }
  if (!fontes.length) {
    throw new Error("Selecione ao menos uma fonte de busca.");
  }

  const apiKey = process.env.AISA_API_KEY;
  if (!apiKey) {
    throw new Error(
      "AISA_API_KEY não configurada. Adicione a chave da AIsa nas variáveis de ambiente para usar essa busca."
    );
  }

  const leads = await searchAisaLeads({
    nicho: nicho.trim(),
    cidade: cidade.trim(),
    bairro: bairro.trim(),
    filtroSite,
    fontes,
    apiKey,
    deadline,
  });

  // Todo lead ja cadastrado entra no dedup, independente do estagio no funil —
  // um lead marcado "Perdido"/"Não apto" continua contando como ja prospectado
  // e nao volta a aparecer como novo em buscas futuras.
  const existingLeads = await prisma.lead.findMany({
    select: { phone: true, name: true, company: true },
  });
  const existingPhones = new Set(existingLeads.map((l) => (l.phone || "").replace(/\D/g, "")).filter(Boolean));
  const normalizeName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const existingNames = new Set(
    existingLeads.map((l) => normalizeName(l.company || l.name)).filter(Boolean)
  );

  const novos: Prisma.LeadCreateManyInput[] = [];
  const results: AisaProspectResult[] = [];

  for (const lead of leads) {
    const phoneDigits = lead.telefone.replace(/\D/g, "");
    const nomeNormalizado = normalizeName(lead.nome);
    const alreadyLead =
      (Boolean(phoneDigits) && existingPhones.has(phoneDigits)) || existingNames.has(nomeNormalizado);

    if (!alreadyLead) {
      novos.push({
        name: lead.nome,
        company: lead.nome,
        phone: lead.telefone && lead.telefone !== "WhatsApp Direto" ? lead.telefone : null,
        source: "Google Maps + Instagram (AIsa)",
        notes: buildAisaNotes(lead),
        instagramHandle: lead.instagramUrl || null,
      });
      if (phoneDigits) existingPhones.add(phoneDigits);
      existingNames.add(nomeNormalizado);
    }

    results.push({ ...lead, alreadyLead });
  }

  // Um unico insert em vez de um por lead, para nao gastar o tempo da funcao.
  const imported = novos.length ? (await prisma.lead.createMany({ data: novos })).count : 0;

  results.sort((a, b) => {
    const aNoSite = a.temSiteProprio ? 1 : 0;
    const bNoSite = b.temSiteProprio ? 1 : 0;
    return aNoSite - bNoSite;
  });

  revalidatePath("/funil");

  return { ok: true, results, imported, total: leads.length };
}
