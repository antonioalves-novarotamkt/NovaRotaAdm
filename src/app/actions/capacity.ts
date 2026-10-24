"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseCapacityConfig, type CapacityConfig } from "@/lib/capacity";

export async function saveCapacityConfig(config: CapacityConfig) {
  // Passa pelo mesmo filtro da leitura, para não gravar número inválido.
  const clean = parseCapacityConfig(JSON.stringify(config));
  const capacityConfig = JSON.stringify(clean);
  await prisma.agencySettings.upsert({
    where: { id: "singleton" },
    update: { capacityConfig },
    create: { id: "singleton", capacityConfig },
  });
  revalidatePath("/capacidade");
  return clean;
}

/** Horas por mês do cliente. null volta para a estimativa pelo escopo. */
export async function setClientMonthlyHours(clientId: string, hours: number | null) {
  if (!clientId) throw new Error("Cliente inválido.");
  const monthlyHours = hours == null || !Number.isFinite(hours) || hours < 0 ? null : Math.round(hours * 10) / 10;
  await prisma.client.update({ where: { id: clientId }, data: { monthlyHours } });
  revalidatePath("/capacidade");
  return monthlyHours;
}
