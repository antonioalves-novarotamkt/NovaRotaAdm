"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { BillingFrequency } from "@prisma/client";

export async function updateClientBilling(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const billingFrequency = String(formData.get("billingFrequency") || "NONE") as BillingFrequency;
  const nextBillingDateStr = String(formData.get("nextBillingDate") || "");
  const contractValueRaw = String(formData.get("contractValue") || "");

  if (!clientId) {
    throw new Error("Cliente é obrigatório.");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: {
      billingFrequency,
      nextBillingDate: nextBillingDateStr ? new Date(nextBillingDateStr) : null,
      contractValue: contractValueRaw ? Number(contractValueRaw) : null,
    },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/financeiro");
}

function advanceDate(date: Date, frequency: BillingFrequency): Date {
  const next = new Date(date);
  if (frequency === "WEEKLY") next.setDate(next.getDate() + 7);
  else if (frequency === "BIWEEKLY") next.setDate(next.getDate() + 14);
  else if (frequency === "MONTHLY") next.setMonth(next.getMonth() + 1);
  return next;
}

export async function registerScheduledPayment(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || !client.nextBillingDate || !client.contractValue) {
    throw new Error("Cliente sem recebimento programado.");
  }

  const count = await prisma.invoice.count();
  const number = `NF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  await prisma.invoice.create({
    data: {
      number,
      clientId,
      amount: client.contractValue,
      tax: 0,
      total: client.contractValue,
      status: "PAID",
      dueDate: client.nextBillingDate,
      paidAt: new Date(),
      description: "Recebimento programado",
    },
  });

  await prisma.client.update({
    where: { id: clientId },
    data: { nextBillingDate: advanceDate(client.nextBillingDate, client.billingFrequency) },
  });

  revalidatePath("/financeiro");
}
