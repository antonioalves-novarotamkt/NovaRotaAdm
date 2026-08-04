"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ContractStatus } from "@prisma/client";

export async function createContract(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const value = Number(formData.get("value") || 0);
  const startDate = String(formData.get("startDate") || "");
  const endDate = String(formData.get("endDate") || "");
  const status = String(formData.get("status") || "ACTIVE") as ContractStatus;
  const notes = String(formData.get("notes") || "").trim();

  if (!title || !clientId || !startDate) {
    throw new Error("Título, cliente e data de início são obrigatórios.");
  }

  await prisma.contract.create({
    data: {
      title,
      clientId,
      value,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      status,
      notes: notes || null,
    },
  });

  revalidatePath("/contratos");
  redirect("/contratos");
}
