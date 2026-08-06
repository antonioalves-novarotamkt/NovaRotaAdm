"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createExtraCharge(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const receivedDateRaw = String(formData.get("receivedDate") || "");

  if (!clientId || !description || !amount || !receivedDateRaw) {
    throw new Error("Cliente, descrição, valor e data de recebimento são obrigatórios.");
  }

  const receivedDate = new Date(`${receivedDateRaw}T00:00:00.000Z`);
  const count = await prisma.invoice.count();
  const number = `NF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  await prisma.invoice.create({
    data: {
      number,
      clientId,
      amount,
      tax: 0,
      total: amount,
      status: "PAID",
      issueDate: receivedDate,
      dueDate: receivedDate,
      paidAt: receivedDate,
      description,
    },
  });

  revalidatePath("/financeiro");
}

export async function deleteExtraCharge(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.invoice.delete({ where: { id } });
  revalidatePath("/financeiro");
}
