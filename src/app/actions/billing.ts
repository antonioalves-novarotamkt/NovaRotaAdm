"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { BillingFrequency } from "@prisma/client";
import { computeNextBillingDate } from "@/lib/billing";
import { syncScheduledInvoices } from "@/lib/scheduled-invoices";

export async function updateClientBilling(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const billingFrequency = String(formData.get("billingFrequency") || "NONE") as BillingFrequency;
  const contractValueRaw = String(formData.get("contractValue") || "");
  const dayOfWeekRaw = String(formData.get("billingDayOfWeek") || "");
  const dayOfMonth1Raw = String(formData.get("billingDayOfMonth1") || "");
  const dayOfMonth2Raw = String(formData.get("billingDayOfMonth2") || "");

  if (!clientId) {
    throw new Error("Cliente é obrigatório.");
  }

  const billingDayOfWeek = dayOfWeekRaw ? Number(dayOfWeekRaw) : null;
  const billingDayOfMonth1 = dayOfMonth1Raw ? Number(dayOfMonth1Raw) : null;
  const billingDayOfMonth2 = dayOfMonth2Raw ? Number(dayOfMonth2Raw) : null;

  const nextBillingDate = computeNextBillingDate({
    frequency: billingFrequency,
    dayOfWeek: billingDayOfWeek,
    dayOfMonth1: billingDayOfMonth1,
    dayOfMonth2: billingDayOfMonth2,
  });

  await prisma.client.update({
    where: { id: clientId },
    data: {
      billingFrequency,
      billingDayOfWeek,
      billingDayOfMonth1,
      billingDayOfMonth2,
      nextBillingDate,
      contractValue: contractValueRaw ? Number(contractValueRaw) : null,
    },
  });

  await syncScheduledInvoices();

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/financeiro");
}
