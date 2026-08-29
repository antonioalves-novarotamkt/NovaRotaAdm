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

// Marca o lote inteiro como postado — feito manualmente por quem publica,
// não é automático mesmo que todos os agendamentos já tenham passado.
export async function moveToPosted(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Tarefa inválida.");

  const task = await prisma.task.update({
    where: { id },
    data: { status: "POSTED", postedAt: new Date() },
  });

  revalidateBoard(task.clientId);
}

export async function deleteTask(formData: FormData) {
  const id = String(formData.get("id") || "");
  const task = await prisma.task.delete({ where: { id } });
  revalidateBoard(task.clientId);
}

// Adiciona uma nova entrada no histórico de atualizações da tarefa — não
// sobrescreve as anteriores, cada mudança/observação vira um registro novo.
export async function addTaskUpdate(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const content = String(formData.get("content") || "").trim();
  if (!taskId || !content) throw new Error("Escreva algo para registrar a atualização.");

  const session = await getServerSession(authOptions);
  const authorId = (session?.user as { id?: string } | undefined)?.id;

  const task = await prisma.taskUpdate.create({
    data: { taskId, content, authorId: authorId || null },
    include: { task: { select: { clientId: true } } },
  });

  revalidateBoard(task.task.clientId);
}

// Agenda um post/story dentro do card — um card de Agendamento costuma ser
// um lote inteiro, então cada item do lote entra como um registro separado
// em vez de um campo único de data na tarefa.
export async function addScheduledPost(formData: FormData) {
  const taskId = String(formData.get("taskId") || "");
  const scheduledAtRaw = String(formData.get("scheduledAt") || "");
  const label = String(formData.get("label") || "").trim();
  if (!taskId || !scheduledAtRaw) throw new Error("Informe a data e hora do agendamento.");

  const post = await prisma.scheduledPost.create({
    data: { taskId, scheduledAt: new Date(scheduledAtRaw), label: label || null },
    include: { task: { select: { clientId: true } } },
  });

  revalidateBoard(post.task.clientId);
}

export async function deleteScheduledPost(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const post = await prisma.scheduledPost.delete({
    where: { id },
    include: { task: { select: { clientId: true } } },
  });

  revalidateBoard(post.task.clientId);
}
