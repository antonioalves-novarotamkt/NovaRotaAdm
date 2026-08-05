"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createClientPost(input: {
  clientId: string;
  month: string; // YYYY-MM
  imageUrl: string;
  caption?: string;
  postDate?: string;
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
    },
  });

  revalidatePath("/projetos");
}

export async function deleteClientPost(id: string) {
  await prisma.clientPost.delete({ where: { id } });
  revalidatePath("/projetos");
}

export async function updatePostMetrics(formData: FormData) {
  const id = String(formData.get("id") || "");
  const viewsRaw = String(formData.get("views") || "");
  const likesRaw = String(formData.get("likes") || "");
  const sharesRaw = String(formData.get("shares") || "");

  if (!id) {
    throw new Error("Post não encontrado.");
  }

  await prisma.clientPost.update({
    where: { id },
    data: {
      views: viewsRaw ? Number(viewsRaw) : null,
      likes: likesRaw ? Number(likesRaw) : null,
      shares: sharesRaw ? Number(sharesRaw) : null,
    },
  });

  revalidatePath("/projetos");
}
