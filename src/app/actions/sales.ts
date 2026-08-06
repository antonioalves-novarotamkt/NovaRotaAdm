"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createClientSale(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const month = String(formData.get("month") || "");
  const platform = String(formData.get("platform") || "").trim();
  const grossValue = Number(formData.get("grossValue") || 0);
  const netValueRaw = String(formData.get("netValue") || "");
  const salesCount = Number(formData.get("salesCount") || 0);

  if (!clientId || !month) {
    throw new Error("Cliente e mês são obrigatórios.");
  }

  await prisma.clientSale.create({
    data: {
      clientId,
      month: new Date(`${month}-01T00:00:00.000Z`),
      platform: platform || null,
      grossValue,
      netValue: netValueRaw ? Number(netValueRaw) : null,
      salesCount,
    },
  });

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
}

export async function updateClientSale(formData: FormData) {
  const id = String(formData.get("id") || "");
  const platform = String(formData.get("platform") || "").trim();
  const grossValue = Number(formData.get("grossValue") || 0);
  const netValueRaw = String(formData.get("netValue") || "");
  const salesCount = Number(formData.get("salesCount") || 0);

  if (!id) return;

  await prisma.clientSale.update({
    where: { id },
    data: {
      platform: platform || null,
      grossValue,
      netValue: netValueRaw ? Number(netValueRaw) : null,
      salesCount,
    },
  });

  revalidatePath("/vendas");
  revalidatePath("/dashboard");
}

export async function deleteClientSale(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.clientSale.delete({ where: { id } });
  revalidatePath("/vendas");
  revalidatePath("/dashboard");
}
