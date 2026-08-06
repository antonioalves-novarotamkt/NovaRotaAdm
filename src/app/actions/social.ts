"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@prisma/client";

export async function createSocialAccount(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const platform = String(formData.get("platform") || "OTHER") as SocialPlatform;
  const handle = String(formData.get("handle") || "").trim();
  const url = String(formData.get("url") || "").trim();

  if (!clientId || !handle) {
    throw new Error("Cliente e usuário/handle são obrigatórios.");
  }

  await prisma.socialAccount.create({
    data: { clientId, platform, handle, url: url || null },
  });

  revalidatePath(`/clientes/${clientId}`);
}

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) || "");
  return raw ? Number(raw) : null;
}

export async function logSocialMetric(formData: FormData) {
  const socialAccountId = String(formData.get("socialAccountId") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const monthStr = String(formData.get("month") || "");
  const followers = Number(formData.get("followers") || 0);

  if (!socialAccountId || !monthStr) {
    throw new Error("Conta e mês são obrigatórios.");
  }

  const month = new Date(`${monthStr}-01T00:00:00.000Z`);

  const data = {
    followers,
    reach: optionalNumber(formData, "reach"),
    engagementRate: optionalNumber(formData, "engagementRate"),
    totalViews: optionalNumber(formData, "totalViews"),
    followerViewsPct: optionalNumber(formData, "followerViewsPct"),
    nonFollowerViewsPct: optionalNumber(formData, "nonFollowerViewsPct"),
    profileVisits: optionalNumber(formData, "profileVisits"),
    linkTaps: optionalNumber(formData, "linkTaps"),
    addressTaps: optionalNumber(formData, "addressTaps"),
  };

  await prisma.socialMetric.upsert({
    where: { socialAccountId_month: { socialAccountId, month } },
    update: data,
    create: { socialAccountId, month, ...data },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/clientes/${clientId}/relatorio`);
  revalidatePath("/analises");
}

export async function deleteSocialMetric(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.socialMetric.delete({ where: { id } });
  revalidatePath("/analises");
}
