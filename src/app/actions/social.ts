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

export async function logSocialMetric(formData: FormData) {
  const socialAccountId = String(formData.get("socialAccountId") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const monthStr = String(formData.get("month") || "");
  const followers = Number(formData.get("followers") || 0);
  const reachRaw = String(formData.get("reach") || "");
  const engagementRateRaw = String(formData.get("engagementRate") || "");

  if (!socialAccountId || !monthStr) {
    throw new Error("Conta e mês são obrigatórios.");
  }

  const month = new Date(`${monthStr}-01T00:00:00.000Z`);

  await prisma.socialMetric.upsert({
    where: { socialAccountId_month: { socialAccountId, month } },
    update: {
      followers,
      reach: reachRaw ? Number(reachRaw) : null,
      engagementRate: engagementRateRaw ? Number(engagementRateRaw) : null,
    },
    create: {
      socialAccountId,
      month,
      followers,
      reach: reachRaw ? Number(reachRaw) : null,
      engagementRate: engagementRateRaw ? Number(engagementRateRaw) : null,
    },
  });

  revalidatePath(`/clientes/${clientId}`);
}
