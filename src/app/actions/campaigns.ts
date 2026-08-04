"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { CampaignStatus } from "@prisma/client";

export async function createCampaignMetric(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const platform = String(formData.get("platform") || "Google Ads").trim();
  const status = String(formData.get("status") || "ACTIVE") as CampaignStatus;
  const dateStr = String(formData.get("date") || "");
  const impressions = Number(formData.get("impressions") || 0);
  const clicks = Number(formData.get("clicks") || 0);
  const conversions = Number(formData.get("conversions") || 0);
  const spend = Number(formData.get("spend") || 0);
  const revenue = Number(formData.get("revenue") || 0);

  if (!clientId || !dateStr) {
    throw new Error("Cliente e data são obrigatórios.");
  }

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const roas = spend > 0 ? revenue / spend : 0;

  await prisma.campaignMetric.create({
    data: {
      clientId,
      name: name || null,
      platform,
      status,
      date: new Date(dateStr),
      impressions,
      clicks,
      conversions,
      spend,
      revenue,
      ctr,
      cpc,
      roas,
    },
  });

  revalidatePath("/metricas");
  redirect("/metricas");
}
