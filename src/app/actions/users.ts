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
