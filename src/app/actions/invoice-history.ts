"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateInvoicePaidDate(formData: FormData) {
  const id = String(formData.get("id") || "");
  const paidAtRaw = String(formData.get("paidAt") || "");
  if (!id || !paidAtRaw) {
    throw new Error("Data é obrigatória.");
  }
  const paidAt = new Date(`${paidAtRaw}T00:00:00.000Z`);
  await prisma.invoice.update({
    where: { id },
    data: { paidAt },
  });
  revalidatePath("/financeiro");
}
