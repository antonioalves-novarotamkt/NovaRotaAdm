"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchAisaLeads, type AisaLead, type FiltroSite, type AisaFonte, AISA_FONTES_PADRAO } from "@/lib/aisa-prospect";

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

export async function searchAndImportLeadsAisa(
  nicho: string,
  cidade: string,
  bairro: string,
  filtroSite: FiltroSite,
  fontes: AisaFonte[] = AISA_FONTES_PADRAO
) {
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

  let imported = 0;
  const results: AisaProspectResult[] = [];

  for (const lead of leads) {
    const phoneDigits = lead.telefone.replace(/\D/g, "");
    const nomeNormalizado = normalizeName(lead.nome);
    const alreadyLead =
      (Boolean(phoneDigits) && existingPhones.has(phoneDigits)) || existingNames.has(nomeNormalizado);

    if (!alreadyLead) {
      await prisma.lead.create({
        data: {
          name: lead.nome,
          company: lead.nome,
          phone: lead.telefone && lead.telefone !== "WhatsApp Direto" ? lead.telefone : null,
          source: "Google Maps + Instagram (AIsa)",
          notes: buildAisaNotes(lead),
          instagramHandle: lead.instagramUrl || null,
        },
      });
      imported++;
      if (phoneDigits) existingPhones.add(phoneDigits);
      existingNames.add(nomeNormalizado);
    }

    results.push({ ...lead, alreadyLead });
  }

  results.sort((a, b) => {
    const aNoSite = a.temSiteProprio ? 1 : 0;
    const bNoSite = b.temSiteProprio ? 1 : 0;
    return aNoSite - bNoSite;
  });

  revalidatePath("/funil");

  return { results, imported, total: leads.length };
}
