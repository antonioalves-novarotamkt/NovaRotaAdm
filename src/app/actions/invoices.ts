"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { InvoiceStatus } from "@prisma/client";

export async function createInvoice(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const tax = Number(formData.get("tax") || 0);
  const dueDate = String(formData.get("dueDate") || "");
  const status = String(formData.get("status") || "PENDING") as InvoiceStatus;
  const description = String(formData.get("description") || "").trim();

  if (!clientId || !amount || !dueDate) {
    throw new Error("Cliente, valor e vencimento são obrigatórios.");
  }

  const count = await prisma.invoice.count();
  const number = `NF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

  await prisma.invoice.create({
    data: {
      number,
      clientId,
      amount,
      tax,
      total: amount + tax,
      status,
      dueDate: new Date(dueDate),
      paidAt: status === "PAID" ? new Date() : null,
      description: description || null,
    },
  });

  revalidatePath("/financeiro");
  redirect("/financeiro");
}
