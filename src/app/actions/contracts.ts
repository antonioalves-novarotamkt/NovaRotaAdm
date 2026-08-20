"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ContractStatus, BillingFrequency } from "@prisma/client";
import { generateContractText, type ContractServiceConfig } from "@/lib/contract-template";
import { billingScheduleText } from "@/lib/billing";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getAgencySettings } from "@/app/actions/agency";

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

function readServiceFields(formData: FormData) {
  const postsPerWeekRaw = String(formData.get("postsPerWeek") || "");
  const reelsPerWeekRaw = String(formData.get("reelsPerWeek") || "");
  const socialNetworksCountRaw = String(formData.get("socialNetworksCount") || "");
  const menuPlatformsRaw = String(formData.get("menuPlatforms") || "");

  return {
    includesSocialMedia: formData.get("includesSocialMedia") === "on",
    postsPerWeek: postsPerWeekRaw ? Number(postsPerWeekRaw) : null,
    reelsPerWeek: reelsPerWeekRaw ? Number(reelsPerWeekRaw) : null,
    socialNetworksCount: socialNetworksCountRaw ? Number(socialNetworksCountRaw) : null,
    includesGoogleAds: formData.get("includesGoogleAds") === "on",
    includesMenuMgmt: formData.get("includesMenuMgmt") === "on",
    menuPlatforms: menuPlatformsRaw || null,
  };
}

function toServiceConfig(services: ReturnType<typeof readServiceFields>): ContractServiceConfig {
  return {
    includesSocialMedia: services.includesSocialMedia,
    postsPerWeek: services.postsPerWeek ?? undefined,
    reelsPerWeek: services.reelsPerWeek ?? undefined,
    socialNetworksCount: services.socialNetworksCount ?? undefined,
    includesGoogleAds: services.includesGoogleAds,
    includesMenuMgmt: services.includesMenuMgmt,
    menuPlatforms: services.menuPlatforms ? services.menuPlatforms.split(",").filter(Boolean) : undefined,
  };
}

/**
 * Garante que os servicos marcados no formulario sempre acabem refletidos no texto do
 * contrato, mesmo que o usuario esqueca de clicar em "Gerar/Atualizar Texto do Contrato".
 * So gera automaticamente quando o campo de texto vier vazio, para nao sobrescrever edicoes
 * manuais que o usuario tenha feito no texto.
 */
async function resolveContractContent(params: {
  submittedContent: string;
  clientCompany: string;
  clientName: string;
  value: number;
  billing: ReturnType<typeof readBillingFields>;
  startDate: Date;
  services: ReturnType<typeof readServiceFields>;
}): Promise<string | null> {
  if (params.submittedContent) return params.submittedContent;

  const agency = await getAgencySettings();

  return generateContractText({
    clienteEmpresa: params.clientCompany || params.clientName,
    agencia: agency.name,
    valor: formatCurrency(params.value),
    scheduleText: billingScheduleText({
      frequency: params.billing.billingFrequency,
      dayOfWeek: params.billing.billingDayOfWeek,
      dayOfMonth1: params.billing.billingDayOfMonth1,
      dayOfMonth2: params.billing.billingDayOfMonth2,
    }),
    dataAssinatura: formatDate(params.startDate),
    services: toServiceConfig(params.services),
  });
}

export async function createContract(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const value = Number(formData.get("value") || 0);
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");
  const status = String(formData.get("status") || "ACTIVE") as ContractStatus;
  const notes = String(formData.get("notes") || "").trim();
  const submittedContent = String(formData.get("content") || "").trim();

  const billing = readBillingFields(formData);
  const services = readServiceFields(formData);

  if (!title || !clientId || !startDate) {
    throw new Error("Título, cliente e data de início são obrigatórios.");
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true, company: true },
  });
  if (!client) {
    throw new Error("Cliente não encontrado.");
  }

  const content = await resolveContractContent({
    submittedContent,
    clientCompany: client.company || "",
    clientName: client.name,
    value,
    billing,
    startDate: new Date(startDate),
    services,
  });

  await prisma.contract.create({
    data: {
      title,
      clientId,
      value,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      notes: notes || null,
      content,
      ...billing,
      ...services,
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
  const submittedContent = String(formData.get("content") || "").trim();

  const billing = readBillingFields(formData);
  const services = readServiceFields(formData);

  if (!id || !title || !startDate) {
    throw new Error("Título e data de início são obrigatórios.");
  }

  const existing = await prisma.contract.findUnique({
    where: { id },
    select: { client: { select: { name: true, company: true } } },
  });
  if (!existing) {
    throw new Error("Contrato não encontrado.");
  }

  const content = await resolveContractContent({
    submittedContent,
    clientCompany: existing.client.company || "",
    clientName: existing.client.name,
    value,
    billing,
    startDate: new Date(startDate),
    services,
  });

  await prisma.contract.update({
    where: { id },
    data: {
      title,
      value,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      notes: notes || null,
      content,
      ...billing,
      ...services,
    },
  });

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
}
