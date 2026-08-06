"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) || "");
  return raw ? Number(raw) : null;
}

export async function logWebsiteMetric(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const monthStr = String(formData.get("month") || "");

  if (!clientId || !monthStr) {
    throw new Error("Cliente e mês são obrigatórios.");
  }

  const month = new Date(`${monthStr}-01T00:00:00.000Z`);

  const data = {
    pageViews: optionalNumber(formData, "pageViews"),
    totalUsers: optionalNumber(formData, "totalUsers"),
    newUsers: optionalNumber(formData, "newUsers"),
  };

  await prisma.websiteMetric.upsert({
    where: { clientId_month: { clientId, month } },
    update: data,
    create: { clientId, month, ...data },
  });

  revalidatePath("/analises");
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/clientes/${clientId}/relatorio`);
}

export async function deleteWebsiteMetric(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.websiteMetric.delete({ where: { id } });
  revalidatePath("/analises");
}
