"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ClientStatus } from "@prisma/client";

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const status = String(formData.get("status") || "PROSPECT") as ClientStatus;
  const contractValueRaw = String(formData.get("contractValue") || "");
  const contractValue = contractValueRaw ? Number(contractValueRaw) : undefined;

  if (!name || !email) {
    throw new Error("Nome e email são obrigatórios.");
  }

  await prisma.client.create({
    data: {
      name,
      email,
      company: company || null,
      phone: phone || null,
      website: website || null,
      city: city || null,
      state: state || null,
      status,
      contractValue,
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function updateClient(formData: FormData) {
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const status = String(formData.get("status") || "ACTIVE") as ClientStatus;
  const notes = String(formData.get("notes") || "").trim();
  const contractValueRaw = String(formData.get("contractValue") || "");
  const clientSinceRaw = String(formData.get("clientSince") || "");

  const includesSocialMedia = formData.get("includesSocialMedia") === "on";
  const postsPerWeekRaw = String(formData.get("postsPerWeek") || "");
  const storiesPerWeekRaw = String(formData.get("storiesPerWeek") || "");
  const reelsPerWeekRaw = String(formData.get("reelsPerWeek") || "");
  const socialNetworksCountRaw = String(formData.get("socialNetworksCount") || "");
  const includesGoogleAds = formData.get("includesGoogleAds") === "on";
  const includesMenuMgmt = formData.get("includesMenuMgmt") === "on";
  const menuPlatforms = String(formData.get("menuPlatforms") || "");
  const includesWebsiteCreation = formData.get("includesWebsiteCreation") === "on";

  if (!id || !name || !email) {
    throw new Error("Nome e email são obrigatórios.");
  }

  await prisma.client.update({
    where: { id },
    data: {
      name,
      email,
      company: company || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      city: city || null,
      state: state || null,
      status,
      notes: notes || null,
      contractValue: contractValueRaw ? Number(contractValueRaw) : null,
      clientSince: clientSinceRaw ? new Date(`${clientSinceRaw}T00:00:00.000Z`) : null,
      includesSocialMedia,
      postsPerWeek: postsPerWeekRaw ? Number(postsPerWeekRaw) : null,
      storiesPerWeek: storiesPerWeekRaw ? Number(storiesPerWeekRaw) : null,
      reelsPerWeek: reelsPerWeekRaw ? Number(reelsPerWeekRaw) : null,
      socialNetworksCount: socialNetworksCountRaw ? Number(socialNetworksCountRaw) : null,
      includesGoogleAds,
      includesMenuMgmt,
      menuPlatforms: menuPlatforms || null,
      includesWebsiteCreation,
    },
  });

  revalidatePath(`/clientes/${id}`);
  revalidatePath("/clientes");
}
