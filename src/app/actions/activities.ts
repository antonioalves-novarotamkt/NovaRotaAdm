"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createActivity(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dateStr = String(formData.get("date") || "");

  if (!clientId || !description) {
    throw new Error("Cliente e descrição são obrigatórios.");
  }

  await prisma.clientActivity.create({
    data: {
      clientId,
      description,
      date: dateStr ? new Date(dateStr) : new Date(),
    },
  });

  revalidatePath(`/clientes/${clientId}`);
}
