"use server";

import { revalidatePath } from "next/cache";
import { CostCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createOperationalCost(formData: FormData) {
  const category = String(formData.get("category") || "");
  const description = String(formData.get("description") || "").trim();
  const month = String(formData.get("month") || "");
  const amount = Number(formData.get("amount") || 0);

  if (!category || !description || !month) {
    throw new Error("Categoria, descrição e mês são obrigatórios.");
  }

  await prisma.operationalCost.create({
    data: {
      category: category as CostCategory,
      description,
      month: new Date(`${month}-01T00:00:00.000Z`),
      amount,
    },
  });

  revalidatePath("/custos");
  revalidatePath("/dashboard");
}

export async function deleteOperationalCost(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.operationalCost.delete({ where: { id } });
  revalidatePath("/custos");
  revalidatePath("/dashboard");
}
