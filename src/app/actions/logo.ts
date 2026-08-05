"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateClientLogo(clientId: string, logoUrl: string) {
  if (!clientId || !logoUrl) {
    throw new Error("Cliente e imagem são obrigatórios.");
  }

  await prisma.client.update({
    where: { id: clientId },
    data: { logoUrl },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}
