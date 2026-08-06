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

function optionalNumber(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) || "");
  return raw ? Number(raw) : null;
}

export async function updatePostMetrics(formData: FormData) {
  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Post não encontrado.");
  }

  await prisma.clientPost.update({
    where: { id },
    data: {
      instagramViews: optionalNumber(formData, "instagramViews"),
      instagramLikes: optionalNumber(formData, "instagramLikes"),
      instagramShares: optionalNumber(formData, "instagramShares"),
      facebookViews: optionalNumber(formData, "facebookViews"),
      facebookLikes: optionalNumber(formData, "facebookLikes"),
      facebookShares: optionalNumber(formData, "facebookShares"),
    },
  });

  revalidatePath("/projetos");
  revalidatePath("/clientes");
}
