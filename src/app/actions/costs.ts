"use server";

import { revalidatePath } from "next/cache";
import { CostCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createOperationalCost(formData: FormData) {
  const category = String(formData.get("category") || "");
  const description = String(formData.get("description") || "").trim();
  const month = String(formData.get("month") || "");
  const amount = Number(formData.get("amount") || 0);
  const recurring = formData.get("recurring") === "on";

  if (!category || !description || !month) {
    throw new Error("Categoria, descrição e mês são obrigatórios.");
  }

  await prisma.operationalCost.create({
    data: {
      category: category as CostCategory,
      description,
      month: new Date(`${month}-01T00:00:00.000Z`),
      amount,
      recurring,
    },
  });

  revalidatePath("/custos");
  revalidatePath("/dashboard");
}

export async function deleteOperationalCost(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const cost = await prisma.operationalCost.findUnique({ where: { id } });
  if (cost?.recurring) {
    // Um custo recorrente removido também para de se repetir nos próximos
    // meses — senão a sincronização mensal ia lançar ele de novo sozinha.
    // Os lançamentos de meses passados dessa série continuam intactos, só
    // deixam de ser "ativos" pra fins de repetição futura.
    await prisma.operationalCost.updateMany({
      where: { category: cost.category, description: cost.description, recurring: true },
      data: { recurring: false },
    });
  }

  await prisma.operationalCost.delete({ where: { id } });
  revalidatePath("/custos");
  revalidatePath("/dashboard");
}
