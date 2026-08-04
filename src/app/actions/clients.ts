"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { ClientStatus } from "@prisma/client";

export async function createClient(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const website = String(formData.get("website") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim();
  const status = String(formData.get("status") || "PROSPECT") as ClientStatus;
  const contractValueRaw = String(formData.get("contractValue") || "");
  const contractValue = contractValueRaw ? Number(contractValueRaw) : undefined;

  if (!name || !email) {
    throw new Error("Nome e email são obrigatórios.");
  }

  await prisma.client.create({
    data: {
      name,
      email,
      company: company || null,
      phone: phone || null,
      website: website || null,
      city: city || null,
      state: state || null,
      status,
      contractValue,
    },
  });

  revalidatePath("/clientes");
  redirect("/clientes");
}
