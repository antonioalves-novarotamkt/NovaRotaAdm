"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { BillingFrequency } from "@prisma/client";
import { computeNextBillingDate } from "@/lib/billing";
import { syncScheduledInvoices, createInvoiceWithUniqueNumber } from "@/lib/scheduled-invoices";
import { registerInvoicePayment } from "@/lib/payments";

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

export async function registerScheduledPayment(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const paidAtRaw = String(formData.get("paidAt") || "");
  const paidAt = paidAtRaw ? new Date(`${paidAtRaw}T00:00:00.000Z`) : new Date();
  const amountRaw = String(formData.get("amount") || "");

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || !client.nextBillingDate || !client.contractValue) {
    throw new Error("Cliente sem recebimento programado.");
  }

  let pendingInvoice = await prisma.invoice.findFirst({
    where: {
      clientId,
      dueDate: client.nextBillingDate,
      status: { in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] },
    },
  });

  if (!pendingInvoice) {
    pendingInvoice = await createInvoiceWithUniqueNumber({
      clientId,
      amount: client.contractValue,
      tax: 0,
      total: client.contractValue,
      status: "PENDING",
      dueDate: client.nextBillingDate,
      description: "Recebimento programado",
    });
  }

  const amount = amountRaw ? Number(amountRaw) : pendingInvoice.total;
  // registerInvoicePayment já cuida de avançar o próximo vencimento quando
  // essa fatura for a cobrança programada vigente e fechar 100% — mesma
  // regra aplicada não importa por qual tela a baixa é dada.
  await registerInvoicePayment(pendingInvoice.id, amount, paidAt);

  revalidatePath("/financeiro");
}
