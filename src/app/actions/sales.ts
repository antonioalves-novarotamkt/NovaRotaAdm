"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createClientSale(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const month = String(formData.get("month") || "");
  const platform = String(formData.get("platform") || "").trim();
  const totalValue = Number(formData.get("totalValue") || 0);
  const salesCount = Number(formData.get("salesCount") || 0);

  if (!clientId || !month) {
    throw new Error("Cliente e mês são obrigatórios.");
  }

  await prisma.clientSale.create({
    data: {
      clientId,
      month: new Date(`${month}-01T00:00:00.000Z`),
      platform: platform || null,
      totalValue,
      salesCount,
    },
  });

  revalidatePath("/vendas");
}

export async function deleteClientSale(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.clientSale.delete({ where: { id } });
  revalidatePath("/vendas");
}
