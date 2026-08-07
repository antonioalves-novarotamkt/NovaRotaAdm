"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchPlaces, type PlaceResult } from "@/lib/google-places";

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
