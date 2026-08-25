"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ContractStatus, BillingFrequency } from "@prisma/client";
import { computeNextBillingDate } from "@/lib/billing";
import { syncScheduledInvoices } from "@/lib/scheduled-invoices";

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

// O dia/frequência de cobrança do contrato so' controlava o texto do contrato —
// quem realmente gera as faturas e' a configuração de cobrança do Cliente, editada
// em uma tela separada. Sem essa sincronização, mudar o vencimento no contrato não
// tinha efeito nenhum na fatura de verdade, o que confundia (dia configurado no
// contrato != dia que aparecia na fatura).
async function syncClientBillingFromContract(
  clientId: string,
  value: number,
  billing: ReturnType<typeof readBillingFields>
) {
  const nextBillingDate = computeNextBillingDate({
    frequency: billing.billingFrequency,
    dayOfWeek: billing.billingDayOfWeek,
    dayOfMonth1: billing.billingDayOfMonth1,
    dayOfMonth2: billing.billingDayOfMonth2,
  });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      billingFrequency: billing.billingFrequency,
      billingDayOfWeek: billing.billingDayOfWeek,
      billingDayOfMonth1: billing.billingDayOfMonth1,
      billingDayOfMonth2: billing.billingDayOfMonth2,
      nextBillingDate,
      contractValue: value,
    },
  });

  // Uma fatura programada (ainda não paga) que aponta pro vencimento antigo fica
  // órfã quando o dia de cobrança muda — corrige a data dela em vez de deixar
  // duplicar com a nova fatura que syncScheduledInvoices vai gerar. Não inclui
  // PARTIALLY_PAID de propósito: sobrescrever amount/total aqui corromperia a
  // relação com os pagamentos parciais já registrados nela.
  if (nextBillingDate) {
    const stalePending = await prisma.invoice.findFirst({
      where: {
        clientId,
        status: { in: ["PENDING", "OVERDUE"] },
        description: "Recebimento programado",
        dueDate: { not: nextBillingDate },
      },
      orderBy: { dueDate: "desc" },
    });
    if (stalePending) {
      await prisma.invoice.update({
        where: { id: stalePending.id },
        data: { dueDate: nextBillingDate, amount: value, total: value, status: "PENDING" },
      });
    }
  }

  await syncScheduledInvoices();
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
  const storiesPerWeekRaw = String(formData.get("storiesPerWeek") || "");
  const reelsPerWeekRaw = String(formData.get("reelsPerWeek") || "");
  const socialNetworksCountRaw = String(formData.get("socialNetworksCount") || "");
  const includesGoogleAds = formData.get("includesGoogleAds") === "on";
  const includesMenuMgmt = formData.get("includesMenuMgmt") === "on";
  const menuPlatformsRaw = String(formData.get("menuPlatforms") || "");
  const includesWebsiteCreation = formData.get("includesWebsiteCreation") === "on";

  if (!title || !clientId || !startDate) {
    throw new Error("Título, cliente e data de início são obrigatórios.");
  }

  const billingFields = readBillingFields(formData);

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
      ...billingFields,
      includesSocialMedia,
      postsPerWeek: postsPerWeekRaw ? Number(postsPerWeekRaw) : null,
      storiesPerWeek: storiesPerWeekRaw ? Number(storiesPerWeekRaw) : null,
      reelsPerWeek: reelsPerWeekRaw ? Number(reelsPerWeekRaw) : null,
      socialNetworksCount: socialNetworksCountRaw ? Number(socialNetworksCountRaw) : null,
      includesGoogleAds,
      includesMenuMgmt,
      menuPlatforms: menuPlatformsRaw || null,
      includesWebsiteCreation,
    },
  });

  await syncClientBillingFromContract(clientId, value, billingFields);

  revalidatePath("/contratos");
  revalidatePath("/financeiro");
  revalidatePath(`/clientes/${clientId}`);
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
  const adjustmentReason = String(formData.get("adjustmentReason") || "").trim();

  const includesSocialMedia = formData.get("includesSocialMedia") === "on";
  const postsPerWeekRaw = String(formData.get("postsPerWeek") || "");
  const storiesPerWeekRaw = String(formData.get("storiesPerWeek") || "");
  const reelsPerWeekRaw = String(formData.get("reelsPerWeek") || "");
  const socialNetworksCountRaw = String(formData.get("socialNetworksCount") || "");
  const includesGoogleAds = formData.get("includesGoogleAds") === "on";
  const includesMenuMgmt = formData.get("includesMenuMgmt") === "on";
  const menuPlatformsRaw = String(formData.get("menuPlatforms") || "");
  const includesWebsiteCreation = formData.get("includesWebsiteCreation") === "on";

  if (!id || !title || !startDate) {
    throw new Error("Título e data de início são obrigatórios.");
  }

  const existing = await prisma.contract.findUnique({ where: { id }, select: { value: true, clientId: true } });
  const billingFields = readBillingFields(formData);

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
      ...billingFields,
      includesSocialMedia,
      postsPerWeek: postsPerWeekRaw ? Number(postsPerWeekRaw) : null,
      storiesPerWeek: storiesPerWeekRaw ? Number(storiesPerWeekRaw) : null,
      reelsPerWeek: reelsPerWeekRaw ? Number(reelsPerWeekRaw) : null,
      socialNetworksCount: socialNetworksCountRaw ? Number(socialNetworksCountRaw) : null,
      includesGoogleAds,
      includesMenuMgmt,
      menuPlatforms: menuPlatformsRaw || null,
      includesWebsiteCreation,
    },
  });

  if (existing && existing.value !== value) {
    await prisma.contractAdjustment.create({
      data: {
        contractId: id,
        previousValue: existing.value,
        newValue: value,
        reason: adjustmentReason || null,
      },
    });
  }

  if (existing) {
    await syncClientBillingFromContract(existing.clientId, value, billingFields);
    revalidatePath(`/clientes/${existing.clientId}`);
  }

  revalidatePath("/contratos");
  revalidatePath(`/contratos/${id}`);
  revalidatePath("/financeiro");
}
