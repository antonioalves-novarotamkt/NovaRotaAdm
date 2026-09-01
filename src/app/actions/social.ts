"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { SocialPlatform } from "@prisma/client";
import { fetchInstagramFollowerCount } from "@/lib/aisa-social";

export async function createSocialAccount(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const platform = String(formData.get("platform") || "OTHER") as SocialPlatform;
  const handle = String(formData.get("handle") || "").trim();
  const url = String(formData.get("url") || "").trim();

  if (!clientId || !handle) {
    throw new Error("Cliente e usuário/handle são obrigatórios.");
  }

  await prisma.socialAccount.create({
    data: { clientId, platform, handle, url: url || null },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/analises");
}

// Apaga a conta e as métricas registradas nela junto (onDelete: Cascade no
// schema) — útil pra corrigir um cadastro duplicado ou errado.
export async function deleteSocialAccount(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const account = await prisma.socialAccount.delete({ where: { id } });

  revalidatePath(`/clientes/${account.clientId}`);
  revalidatePath(`/clientes/${account.clientId}/relatorio`);
  revalidatePath("/analises");
}

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) || "");
  return raw ? Number(raw) : null;
}

export async function logSocialMetric(formData: FormData) {
  const socialAccountId = String(formData.get("socialAccountId") || "").trim();
  const clientId = String(formData.get("clientId") || "").trim();
  const monthStr = String(formData.get("month") || "");
  const followers = Number(formData.get("followers") || 0);

  if (!socialAccountId || !monthStr) {
    throw new Error("Conta e mês são obrigatórios.");
  }

  const month = new Date(`${monthStr}-01T00:00:00.000Z`);

  const data = {
    followers,
    reach: optionalNumber(formData, "reach"),
    engagementRate: optionalNumber(formData, "engagementRate"),
    totalViews: optionalNumber(formData, "totalViews"),
    followerViewsPct: optionalNumber(formData, "followerViewsPct"),
    nonFollowerViewsPct: optionalNumber(formData, "nonFollowerViewsPct"),
    profileVisits: optionalNumber(formData, "profileVisits"),
    linkTaps: optionalNumber(formData, "linkTaps"),
    addressTaps: optionalNumber(formData, "addressTaps"),
  };

  await prisma.socialMetric.upsert({
    where: { socialAccountId_month: { socialAccountId, month } },
    update: data,
    create: { socialAccountId, month, ...data },
  });

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/clientes/${clientId}/relatorio`);
  revalidatePath("/analises");
}

export async function deleteSocialMetric(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.socialMetric.delete({ where: { id } });
  revalidatePath("/analises");
}

// Busca o numero de seguidores atual no Instagram e grava direto no mes
// corrente — sobrescreve o que ja estiver la, mesmo comportamento do
// "sempre atualizar" combinado pros posts.
//
// Retorna um objeto em vez de lançar erro: em produção, o Next.js apaga a
// mensagem de erros lançados (throw) em Server Actions e mostra só um aviso
// genérico com digest — retornar o erro como dado preserva a mensagem real
// para exibir na tela.
export async function refreshFollowerCount(
  formData: FormData
): Promise<{ ok: true; followers: number } | { ok: false; error: string }> {
  const socialAccountId = String(formData.get("socialAccountId") || "");
  const clientId = String(formData.get("clientId") || "");
  if (!socialAccountId) return { ok: false, error: "Conta social não informada." };

  try {
    const account = await prisma.socialAccount.findUnique({ where: { id: socialAccountId } });
    if (!account) return { ok: false, error: "Conta não encontrada." };
    if (account.platform !== "INSTAGRAM") {
      return { ok: false, error: "Atualização automática só funciona com contas do Instagram por enquanto." };
    }

    const apiKey = process.env.AISA_API_KEY;
    if (!apiKey) {
      return { ok: false, error: "AISA_API_KEY não configurada nas variáveis de ambiente." };
    }

    const followers = await fetchInstagramFollowerCount(account.handle, apiKey);

    const now = new Date();
    const month = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));

    await prisma.socialMetric.upsert({
      where: { socialAccountId_month: { socialAccountId, month } },
      update: { followers },
      create: { socialAccountId, month, followers },
    });

    revalidatePath(`/clientes/${clientId}`);
    revalidatePath(`/clientes/${clientId}/relatorio`);
    revalidatePath("/analises");

    return { ok: true, followers };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao atualizar seguidores." };
  }
}
