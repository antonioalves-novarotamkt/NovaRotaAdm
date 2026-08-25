"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchInstagramPostMetrics } from "@/lib/aisa-social";

export async function createClientPost(input: {
  clientId: string;
  month: string; // YYYY-MM
  imageUrl: string;
  caption?: string;
  postDate?: string;
  postUrl?: string;
}) {
  if (!input.clientId || !input.month || !input.imageUrl) {
    throw new Error("Cliente, mês e imagem são obrigatórios.");
  }

  await prisma.clientPost.create({
    data: {
      clientId: input.clientId,
      month: new Date(`${input.month}-01T00:00:00.000Z`),
      imageUrl: input.imageUrl,
      caption: input.caption || null,
      postDate: input.postDate ? new Date(input.postDate) : null,
      postUrl: input.postUrl || null,
    },
  });

  revalidatePath("/projetos");
}

export async function deleteClientPost(id: string) {
  await prisma.clientPost.delete({ where: { id } });
  revalidatePath("/projetos");
}

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) || "");
  return raw ? Number(raw) : null;
}

export async function updatePostMetrics(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Post não encontrado.");
  }

  const postUrl = String(formData.get("postUrl") || "").trim();

  await prisma.clientPost.update({
    where: { id },
    data: {
      postUrl: postUrl || null,
      instagramViews: optionalNumber(formData, "instagramViews"),
      instagramLikes: optionalNumber(formData, "instagramLikes"),
      instagramComments: optionalNumber(formData, "instagramComments"),
      instagramShares: optionalNumber(formData, "instagramShares"),
      facebookViews: optionalNumber(formData, "facebookViews"),
      facebookLikes: optionalNumber(formData, "facebookLikes"),
      facebookShares: optionalNumber(formData, "facebookShares"),
    },
  });

  revalidatePath("/projetos");
  revalidatePath("/clientes");
}

// Busca curtidas/comentarios/views direto no Instagram pelo link salvo e
// sobrescreve o que estiver no post — mesmo comportamento pedido pro fluxo
// manual: o numero mais recente sempre vence, sem precisar editar na mao.
export async function refreshPostMetrics(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) {
    throw new Error("Post não encontrado.");
  }

  const post = await prisma.clientPost.findUnique({ where: { id } });
  if (!post) {
    throw new Error("Post não encontrado.");
  }
  if (!post.postUrl) {
    throw new Error("Esse post não tem um link salvo. Edite o post e adicione o link do Instagram primeiro.");
  }
  if (!post.postUrl.includes("instagram.com")) {
    throw new Error("Atualização automática só funciona com links do Instagram por enquanto.");
  }

  const apiKey = process.env.AISA_API_KEY;
  if (!apiKey) {
    throw new Error("AISA_API_KEY não configurada nas variáveis de ambiente.");
  }

  const metrics = await fetchInstagramPostMetrics(post.postUrl, apiKey);

  await prisma.clientPost.update({
    where: { id },
    data: {
      instagramLikes: metrics.likes,
      instagramComments: metrics.comments,
      instagramViews: metrics.views,
    },
  });

  revalidatePath("/projetos");
  revalidatePath("/clientes");
}
