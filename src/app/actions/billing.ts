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

export async function registerScheduledPayment(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client || !client.nextBillingDate || !client.contractValue) {
    throw new Error("Cliente sem recebimento programado.");
  }

  const pendingInvoice = await prisma.invoice.findFirst({
    where: {
      clientId,
      dueDate: client.nextBillingDate,
      status: { in: ["PENDING", "OVERDUE"] },
    },
  });

  if (pendingInvoice) {
    await prisma.invoice.update({
      where: { id: pendingInvoice.id },
      data: { status: "PAID", paidAt: new Date() },
    });
  } else {
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
  }

  const dayAfter = new Date(client.nextBillingDate);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const nextBillingDate = computeNextBillingDate(
    {
      frequency: client.billingFrequency,
      dayOfWeek: client.billingDayOfWeek,
      dayOfMonth1: client.billingDayOfMonth1,
      dayOfMonth2: client.billingDayOfMonth2,
    },
    dayAfter
  );

  await prisma.client.update({
    where: { id: clientId },
    data: { nextBillingDate },
  });

  await syncScheduledInvoices();

  revalidatePath("/financeiro");
}
