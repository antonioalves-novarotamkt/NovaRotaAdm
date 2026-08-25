"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN") {
    throw new Error("Apenas administradores podem gerenciar usuários.");
  }
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "USER") as Role;

  if (!name || !email || password.length < 6) {
    throw new Error("Nome, email e senha (mín. 6 caracteres) são obrigatórios.");
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, password: hash, role },
  });

  revalidatePath("/configuracoes");
}

export async function updateUserRole(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("userId") || "");
  const role = String(formData.get("role") || "USER") as Role;

  await prisma.user.update({ where: { id: userId }, data: { role } });

  revalidatePath("/configuracoes");
}

export async function updateOwnProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Não autenticado.");

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Nome é obrigatório.");

  await prisma.user.update({ where: { id: userId }, data: { name } });

  revalidatePath("/configuracoes");
}

export async function updateOwnAvatar(imageUrl: string) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Não autenticado.");
  if (!imageUrl) throw new Error("Imagem é obrigatória.");

  await prisma.user.update({ where: { id: userId }, data: { image: imageUrl } });

  revalidatePath("/configuracoes");
}

export async function updateOwnPassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) throw new Error("Não autenticado.");

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (newPassword.length < 6) {
    throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  }
  if (newPassword !== confirmPassword) {
    throw new Error("As senhas não coincidem.");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.password) {
    throw new Error("Usuário sem senha configurada.");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new Error("Senha atual incorreta.");
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("userId") || "");
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  if (userId === currentUserId) {
    throw new Error("Você não pode remover seu próprio usuário.");
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/configuracoes");
}
