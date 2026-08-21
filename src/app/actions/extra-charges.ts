"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createInvoiceWithUniqueNumber } from "@/lib/scheduled-invoices";

export async function createExtraCharge(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const dateRaw = String(formData.get("receivedDate") || "");

  if (!clientId || !description || !amount || !dateRaw) {
    throw new Error("Cliente, descrição, valor e data são obrigatórios.");
  }

  const date = new Date(`${dateRaw}T00:00:00.000Z`);

  await createInvoiceWithUniqueNumber({
    clientId,
    amount,
    tax: 0,
    total: amount,
    status: "PENDING",
    issueDate: new Date(),
    dueDate: date,
    description,
  });

  revalidatePath("/financeiro");
}

export async function markExtraChargePaid(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const paidAtRaw = String(formData.get("paidAt") || "");
  const paidAt = paidAtRaw ? new Date(`${paidAtRaw}T00:00:00.000Z`) : new Date();
  await prisma.invoice.update({
    where: { id },
    data: { status: "PAID", paidAt },
  });
  revalidatePath("/financeiro");
}

export async function deleteExtraCharge(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/financeiro");
}
