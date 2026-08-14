"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ContractStatus, BillingFrequency } from "@prisma/client";

function readBillingFields(formData: FormData) {
  const billingFrequency = String(formData.get("billingFrequency") || "MONTHLY") as BillingFrequency;
  const billingDayOfWeekRaw = String(formData.get("billingDayOfWeek") || "");
  const billingDayOfMonth1Raw = String(formData.get("billingDayOfMonth1") || "");
  const billingDayOfMonth2Raw = String(formData.get("billingDayOfMonth2") || "");

  return {
    billingFrequency,
    billingDayOfWeek: billingDayOfWeekRaw ? Number(billingDayOfWeekRaw) : null,
    billingDayOfMonth1: billingDayOfMonth1Raw ? Number(billingDayOfMonth1Raw) : null,
    billingDayOfMonth2: billingDayOfMonth2Raw ? Number(billingDayOfMonth2Raw) : null,
  };
}

export async function createContract(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const value = Number(formData.get("value") || 0);
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");
  const status = String(formData.get("status") || "ACTIVE") as ContractStatus;
  const notes = String(formData.get("notes") || "").trim();
  const content = String(formData.get("content") || "").trim();

  const includesSocialMedia = formData.get("includesSocialMedia") === "on";
  const postsPerWeekRaw = String(formData.get("postsPerWeek") || "");
  const reelsPerWeekRaw = String(formData.get("reelsPerWeek") || "");
  const socialNetworksCountRaw = String(formData.get("socialNetworksCount") || "");
  const includesGoogleAds = formData.get("includesGoogleAds") === "on";
  const includesMenuMgmt = formData.get("includesMenuMgmt") === "on";
  const menuPlatformsRaw = String(formData.get("menuPlatforms") || "");

  if (!title || !clientId || !startDate) {
    throw new Error("Título, cliente e data de início são obrigatórios.");
  }

  await prisma.contract.create({
    data: {
      title,
      clientId,
      value,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      notes: notes || null,
      content: content || null,
      ...readBillingFields(formData),
      includesSocialMedia,
      postsPerWeek: postsPerWeekRaw ? Number(postsPerWeekRaw) : null,
      reelsPerWeek: reelsPerWeekRaw ? Number(reelsPerWeekRaw) : null,
      socialNetworksCount: socialNetworksCountRaw ? Number(socialNetworksCountRaw) : null,
      includesGoogleAds,
      includesMenuMgmt,
      menuPlatforms: menuPlatformsRaw || null,
    },
  });

  revalidatePath("/contratos");
  redirect("/contratos");
}

export async function updateContract(formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const value = Number(formData.get("value") || 0);
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");
  const status = String(formData.get("status") || "ACTIVE") as ContractStatus;
  const notes = String(formData.get("notes") || "").trim();
  const content = String(formData.get("content") || "").trim();

  const includesSocialMedia = formData.get("includesSocialMedia") === "on";
  const postsPerWeekRaw = String(formData.get("postsPerWeek") || "");
  const reelsPerWeekRaw = String(formData.get("reelsPerWeek") || "");
  const socialNetworksCountRaw = String(formData.get("socialNetworksCount") || "");
  const includesGoogleAds = formData.get("includesGoogleAds") === "on";
  const includesMenuMgmt = formData.get("includesMenuMgmt") === "on";
  const menuPlatformsRaw = String(formData.get("menuPlatforms") || "");

  if (!id || !title || !startDate) {
    throw new Error("Título e data de início são obrigatórios.");
  }

  await prisma.contract.update({
    where: { id },
    data: {
      title,
      value,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      notes: notes || null,
      content: content || null,
      ...readBillingFields(formData),
      includesSocialMedia,
      postsPerWeek: postsPerWeekRaw ? Number(postsPerWeekRaw) : null,
      reelsPerWeek: reelsPerWeekRaw ? Number(reelsPerWeekRaw) : null,
      socialNetworksCount: socialNetworksCountRaw ? Number(socialNetworksCountRaw) : null,
      includesGoogleAds,
      includesMenuMgmt,
      menuPlatforms: menuPlatformsRaw || null,
    },
  });

  revalidatePath("/contratos");
}
