"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function getAgencySettings() {
  return prisma.agencySettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}

export async function updateAgencyLogo(logoUrl: string) {
  if (!logoUrl) {
    throw new Error("Imagem é obrigatória.");
  }

  await prisma.agencySettings.upsert({
    where: { id: "singleton" },
    update: { logoUrl },
    create: { id: "singleton", logoUrl },
  });

  revalidatePath("/", "layout");
}

export async function updateAgencyAppIcon(appIconUrl: string) {
  if (!appIconUrl) {
    throw new Error("Imagem é obrigatória.");
  }

  await prisma.agencySettings.upsert({
    where: { id: "singleton" },
    update: { appIconUrl },
    create: { id: "singleton", appIconUrl },
  });

  revalidatePath("/", "layout");
}

export async function updateAgencyName(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) {
    throw new Error("Nome é obrigatório.");
  }

  await prisma.agencySettings.upsert({
    where: { id: "singleton" },
    update: { name },
    create: { id: "singleton", name },
  });

  revalidatePath("/", "layout");
}
