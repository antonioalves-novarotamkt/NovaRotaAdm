"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchPlaces, type PlaceResult } from "@/lib/google-places";
import { searchAisaLeads, type AisaLead, type FiltroSite } from "@/lib/aisa-prospect";

export interface ProspectResult extends PlaceResult {
  alreadyLead: boolean;
}

export async function searchAndImportLeads(category: string, city: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autenticado.");

  if (!category.trim() || !city.trim()) {
    throw new Error("Categoria e cidade são obrigatórias.");
  }

  const places = await searchPlaces(category.trim(), city.trim());

  const existing = await prisma.lead.findMany({
    where: { googlePlaceId: { in: places.map((p) => p.id) } },
    select: { googlePlaceId: true },
  });
  const existingIds = new Set(existing.map((e) => e.googlePlaceId));

  let imported = 0;
  const results: ProspectResult[] = [];

  for (const place of places) {
    const alreadyLead = existingIds.has(place.id);
    if (!alreadyLead) {
      const notesParts = [place.address ? `Endereço: ${place.address}` : null, place.website ? null : "Sem site cadastrado no Google"].filter(
        Boolean
      );
      await prisma.lead.create({
        data: {
          name: place.name,
          company: place.name,
          phone: place.phone,
          source: "Google Maps",
          notes: notesParts.length > 0 ? notesParts.join(" · ") : null,
          googlePlaceId: place.id,
        },
      });
      imported++;
    }
    results.push({ ...place, alreadyLead });
  }

  // Businesses without a website first — higher priority prospects
  results.sort((a, b) => {
    const aNoWebsite = a.website ? 1 : 0;
    const bNoWebsite = b.website ? 1 : 0;
    return aNoWebsite - bNoWebsite;
  });

  revalidatePath("/funil");

  return { results, imported, total: places.length };
}

export interface AisaProspectResult extends AisaLead {
  alreadyLead: boolean;
}

function buildAisaNotes(lead: AisaLead): string {
  const parts: string[] = [];
  if (lead.categoria) parts.push(`Categoria: ${lead.categoria}`);
  if (lead.endereco) parts.push(`Endereço: ${lead.endereco}`);
  parts.push(lead.temSiteProprio ? `Site: ${lead.siteUrl}` : lead.tipoSite);
  if (lead.instagramUrl) parts.push(`Instagram: ${lead.instagramUrl}`);
  if (lead.linkedinUrl) parts.push(`LinkedIn: ${lead.linkedinUrl}`);
  if (lead.nota != null) {
    parts.push(`Nota Maps: ${lead.nota}${lead.numeroAvaliacoes != null ? ` (${lead.numeroAvaliacoes} avaliações)` : ""}`);
  }
  if (lead.googleMapsUrl) parts.push(`Google Maps: ${lead.googleMapsUrl}`);
  return parts.join(" · ");
}

export async function searchAndImportLeadsAisa(
  nicho: string,
  cidade: string,
  bairro: string,
  filtroSite: FiltroSite
) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autenticado.");

  if (!nicho.trim() || !cidade.trim()) {
    throw new Error("Nicho e cidade são obrigatórios.");
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
    apiKey,
  });

  const existingLeads = await prisma.lead.findMany({
    where: { phone: { not: null } },
    select: { phone: true },
  });
  const existingPhones = new Set(existingLeads.map((l) => (l.phone || "").replace(/\D/g, "")).filter(Boolean));

  let imported = 0;
  const results: AisaProspectResult[] = [];

  for (const lead of leads) {
    const phoneDigits = lead.telefone.replace(/\D/g, "");
    const alreadyLead = Boolean(phoneDigits) && existingPhones.has(phoneDigits);

    if (!alreadyLead) {
      await prisma.lead.create({
        data: {
          name: lead.nome,
          company: lead.nome,
          phone: lead.telefone && lead.telefone !== "WhatsApp Direto" ? lead.telefone : null,
          source: "Google Maps + Instagram (AIsa)",
          notes: buildAisaNotes(lead),
        },
      });
      imported++;
      if (phoneDigits) existingPhones.add(phoneDigits);
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
