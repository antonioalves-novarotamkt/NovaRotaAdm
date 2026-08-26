"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeadStage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function createLead(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const source = String(formData.get("source") || "").trim();
  const valueRaw = String(formData.get("value") || "");
  const notes = String(formData.get("notes") || "").trim();
  const instagramHandle = String(formData.get("instagramHandle") || "").trim();

  if (!name) {
    throw new Error("Nome é obrigatório.");
  }

  await prisma.lead.create({
    data: {
      name,
      company: company || null,
      email: email || null,
      phone: phone || null,
      source: source || null,
      value: valueRaw ? Number(valueRaw) : null,
      notes: notes || null,
      instagramHandle: instagramHandle || null,
    },
  });

  revalidatePath("/funil");
}

export async function updateLeadStage(formData: FormData) {
  const id = String(formData.get("id") || "");
  const stage = String(formData.get("stage") || "") as LeadStage;
  const lostReasonRaw = formData.get("lostReason");
  if (!id || !stage) return;

  await prisma.lead.update({
    where: { id },
    data: {
      stage,
      // So sobrescreve o motivo quando o campo veio no formulario (ex: ao mover
      // para "Perdido"); mudar para outro estagio nao apaga um motivo anterior.
      ...(lostReasonRaw != null ? { lostReason: String(lostReasonRaw).trim() || null } : {}),
    },
  });

  revalidatePath("/funil");
}

export async function deleteLead(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.lead.delete({ where: { id } });
  revalidatePath("/funil");
}

export async function convertLeadToClient(formData: FormData) {
  const id = String(formData.get("id") || "");
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) throw new Error("Lead não encontrado.");
  if (!lead.email) throw new Error("Preencha o e-mail do lead antes de converter em cliente.");

  const client = await prisma.client.create({
    data: {
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      contractValue: lead.value,
      notes: lead.notes,
      status: "ACTIVE",
    },
  });

  await prisma.lead.update({
    where: { id },
    data: { stage: "WON", convertedClientId: client.id },
  });

  revalidatePath("/funil");
  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
}
