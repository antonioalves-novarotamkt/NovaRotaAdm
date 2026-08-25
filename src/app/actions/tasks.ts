"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskTypeLabel } from "@/lib/tasks";
import type { TaskStatus, TaskType, Priority } from "@prisma/client";

async function requireApprover() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new Error("Só administradores ou gerentes podem aprovar ou reprovar tarefas.");
  }
}

function revalidateBoard(clientId: string) {
  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/atividades");
}

export async function createTask(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "OTHER") as TaskType;
  const description = String(formData.get("description") || "").trim();
  const assigneeId = String(formData.get("assigneeId") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "");
  const contentUrl = String(formData.get("contentUrl") || "").trim();
  const priority = String(formData.get("priority") || "MEDIUM") as Priority;

  if (!clientId || !title) {
    throw new Error("Cliente e título são obrigatórios.");
  }

  await prisma.task.create({
    data: {
      clientId,
      title,
      type,
      description: description || null,
      assigneeId: assigneeId || null,
      dueDate: dueDateRaw ? new Date(`${dueDateRaw}T00:00:00.000Z`) : null,
      contentUrl: contentUrl || null,
      priority,
    },
  });

  revalidateBoard(clientId);
}

export async function updateTaskDetails(formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "OTHER") as TaskType;
  const description = String(formData.get("description") || "").trim();
  const assigneeId = String(formData.get("assigneeId") || "").trim();
  const dueDateRaw = String(formData.get("dueDate") || "");
  const contentUrl = String(formData.get("contentUrl") || "").trim();
  const priority = String(formData.get("priority") || "MEDIUM") as Priority;

  if (!id || !title) {
    throw new Error("Título é obrigatório.");
  }

  const task = await prisma.task.update({
    where: { id },
    data: {
      title,
      type,
      description: description || null,
      assigneeId: assigneeId || null,
      dueDate: dueDateRaw ? new Date(`${dueDateRaw}T00:00:00.000Z`) : null,
      contentUrl: contentUrl || null,
      priority,
    },
  });

  revalidateBoard(task.clientId);
}

// Move o card entre colunas do fluxo normal (A Fazer / Em Produção / Aguardando
// Aprovação) — qualquer pessoa da equipe pode mover. Aprovar ou reprovar tem
// suas próprias actions, restritas a quem pode dar a palavra final.
export async function moveTask(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as TaskStatus;

  if (!id || (status !== "TODO" && status !== "IN_PROGRESS" && status !== "REVIEW")) {
    throw new Error("Status inválido.");
  }

  const task = await prisma.task.update({ where: { id }, data: { status } });
  revalidateBoard(task.clientId);
}

export async function approveTask(formData: FormData) {
  await requireApprover();

  const id = String(formData.get("id") || "");
  const task = await prisma.task.findUnique({ where: { id }, include: { client: true } });
  if (!task) throw new Error("Tarefa não encontrada.");

  await prisma.$transaction([
    prisma.task.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date(), reviewNote: null },
    }),
    prisma.clientActivity.create({
      data: {
        clientId: task.clientId,
        date: task.dueDate || new Date(),
        description: `${taskTypeLabel[task.type]} aprovado: ${task.title}`,
      },
    }),
  ]);

  revalidateBoard(task.clientId);
}

export async function rejectTask(formData: FormData) {
  await requireApprover();

  const id = String(formData.get("id") || "");
  const reviewNote = String(formData.get("reviewNote") || "").trim();
  const task = await prisma.task.update({
    where: { id },
    data: { status: "REJECTED", reviewNote: reviewNote || null },
  });

  revalidateBoard(task.clientId);
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") || "");
  const task = await prisma.task.delete({ where: { id } });
  revalidateBoard(task.clientId);
}
