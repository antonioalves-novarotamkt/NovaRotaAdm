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

export type WorkItemInput = { name: string; quantity: number; minutes: number };

function cleanItem(i: WorkItemInput) {
  const name = String(i.name || "").trim().slice(0, 80);
  if (!name) throw new Error("Dê um nome para o material.");
  const n = (v: unknown) => {
    const x = Number(v);
    return Number.isFinite(x) && x >= 0 ? Math.round(x * 100) / 100 : 0;
  };
  return { name, quantity: n(i.quantity), minutes: n(i.minutes) };
}

/** Adiciona uma ou mais atividades ao cliente. As horas dele passam a ser a soma delas. */
export async function addWorkItems(clientId: string, items: WorkItemInput[]) {
  if (!clientId || !items.length) throw new Error("Nada para adicionar.");
  const last = await prisma.clientWorkItem.findFirst({ where: { clientId }, orderBy: { sort: "desc" }, select: { sort: true } });
  let sort = (last?.sort ?? -1) + 1;
  const created = [];
  for (const item of items) {
    created.push(
      await prisma.clientWorkItem.create({
        data: { clientId, ...cleanItem(item), sort: sort++ },
        select: { id: true, name: true, quantity: true, minutes: true },
      })
    );
  }
  revalidatePath("/capacidade");
  return created;
}

export async function updateWorkItem(id: string, item: WorkItemInput) {
  if (!id) throw new Error("Atividade inválida.");
  const data = cleanItem(item);
  await prisma.clientWorkItem.update({ where: { id }, data });
  revalidatePath("/capacidade");
  return data;
}

export async function deleteWorkItem(id: string) {
  if (!id) return;
  await prisma.clientWorkItem.delete({ where: { id } });
  revalidatePath("/capacidade");
}
