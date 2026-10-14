"use server";

import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskHasCaption, CLIENT_APPROVAL_TASK_TYPES } from "@/lib/tasks";
import { overallApprovalOutcome } from "@/lib/task-approval";
import type { MediaKind } from "@prisma/client";

function revalidateBoard(clientId: string) {
  revalidatePath("/tarefas");
  revalidatePath("/dashboard");
  revalidatePath(`/clientes/${clientId}`);
}

async function currentUserName(): Promise<string> {
  const session = await getServerSession(authOptions);
  const user = session?.user as { name?: string | null; email?: string | null } | undefined;
  return user?.name || user?.email || "Equipe";
}

// Gera (ou substitui) o link de aprovação do cliente — igual ao sistema
// antigo em PHP, trocar o link invalida o anterior na hora.
export async function regenerateClientApprovalLink(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  if (!clientId) throw new Error("Cliente é obrigatório.");

  const token = `${randomBytes(16).toString("hex")}`;
  await prisma.client.update({ where: { id: clientId }, data: { approvalToken: token } });

  revalidatePath(`/clientes/${clientId}`);
}

// Anexa um arquivo já enviado (via /api/upload) como mídia da peça. Troca de
// arquivo depois que a arte já tinha sido revisada volta o status pra
// pendente e registra a nova versão na conversa — igual ao sistema antigo.
export async function addTaskMedia(formData: FormData) {
  const taskId = String(formData.get("taskId") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const kind = String(formData.get("kind") || "IMAGE") as MediaKind;
  if (!taskId || !url) throw new Error("Arquivo é obrigatório.");

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { clientId: true, artStatus: true } });
  if (!task) throw new Error("Tarefa não encontrada.");

  const hadMediaBefore = (await prisma.taskMedia.count({ where: { taskId } })) > 0;
  const sort = await prisma.taskMedia.count({ where: { taskId } });

  await prisma.taskMedia.create({ data: { taskId, url, kind, sort } });

  if (hadMediaBefore && task.artStatus !== "PENDING") {
    const author = await currentUserName();
    await prisma.$transaction([
      prisma.task.update({ where: { id: taskId }, data: { artStatus: "PENDING" } }),
      prisma.taskComment.create({
        data: { taskId, author, role: "AGENCY", part: "ART", kind: "VERSION", text: "" },
      }),
    ]);
  }

  revalidateBoard(task.clientId);
}

export async function deleteTaskMedia(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  const media = await prisma.taskMedia.delete({
    where: { id },
    include: { task: { select: { id: true, clientId: true, artStatus: true } } },
  });

  if (media.task.artStatus !== "PENDING") {
    const author = await currentUserName();
    await prisma.$transaction([
      prisma.task.update({ where: { id: media.task.id }, data: { artStatus: "PENDING" } }),
      prisma.taskComment.create({
        data: { taskId: media.task.id, author, role: "AGENCY", part: "ART", kind: "VERSION", text: "" },
      }),
    ]);
  }

  revalidateBoard(media.task.clientId);
}

// Legenda editada pela equipe — trocar o texto depois que já tinha sido
// revisada volta o captionStatus pra pendente, igual à arte.
export async function updateTaskCaption(formData: FormData) {
  const taskId = String(formData.get("taskId") || "").trim();
  const caption = String(formData.get("caption") || "");
  if (!taskId) throw new Error("Tarefa inválida.");

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { clientId: true, caption: true, captionStatus: true } });
  if (!task) throw new Error("Tarefa não encontrada.");

  const changed = (task.caption || "") !== caption;
  const data: { caption: string; captionStatus?: "PENDING" } = { caption };
  if (changed && task.caption && task.captionStatus !== "PENDING") {
    data.captionStatus = "PENDING";
  }

  await prisma.task.update({ where: { id: taskId }, data });

  if (changed && task.caption && task.captionStatus !== "PENDING") {
    const author = await currentUserName();
    await prisma.taskComment.create({
      data: { taskId, author, role: "AGENCY", part: "CAPTION", kind: "VERSION", text: "" },
    });
  }

  revalidateBoard(task.clientId);
}

// Manda a peça pra aprovação do cliente — precisa ter arte (ao menos um
// arquivo) pra fazer sentido o cliente olhar. É aqui, e não no moveTask
// genérico, que posts/reels/stories entram em "Aguardando Aprovação", já
// que agora essa coluna significa aprovação do CLIENTE, não da equipe.
export async function sendTaskForClientApproval(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  if (!id) throw new Error("Tarefa inválida.");

  const task = await prisma.task.findUnique({
    where: { id },
    include: { client: { select: { id: true, approvalToken: true } }, media: true },
  });
  if (!task) throw new Error("Tarefa não encontrada.");
  if (!CLIENT_APPROVAL_TASK_TYPES.includes(task.type)) {
    throw new Error("Esse tipo de tarefa usa a aprovação interna, não a do cliente.");
  }
  if (task.media.length === 0) {
    throw new Error("Envie ao menos um arquivo (arte) antes de mandar pra aprovação do cliente.");
  }

  const updates: Promise<unknown>[] = [
    prisma.task.update({
      where: { id },
      data: { status: "REVIEW", artStatus: "PENDING", captionStatus: taskHasCaption(task.type) ? "PENDING" : "APPROVED" },
    }),
  ];
  if (!task.client.approvalToken) {
    updates.push(
      prisma.client.update({
        where: { id: task.client.id },
        data: { approvalToken: randomBytes(16).toString("hex") },
      })
    );
  }
  await Promise.all(updates);

  revalidateBoard(task.clientId);
}

// Resposta da equipe num comentário do cliente (ex: explicando o ajuste que
// foi feito) — aparece tanto pra equipe quanto de volta pro cliente.
export async function addAgencyComment(formData: FormData) {
  const taskId = String(formData.get("taskId") || "").trim();
  const text = String(formData.get("text") || "").trim();
  if (!taskId || !text) throw new Error("Escreva algo antes de enviar.");

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { clientId: true } });
  if (!task) throw new Error("Tarefa não encontrada.");

  const author = await currentUserName();
  await prisma.taskComment.create({
    data: { taskId, author, role: "AGENCY", part: "GENERAL", kind: "COMMENT", text },
  });

  revalidateBoard(task.clientId);
}

/* ================= AÇÕES PÚBLICAS (link do cliente, sem login) ================= */

async function clientByToken(token: string) {
  if (!token) return null;
  return prisma.client.findUnique({ where: { approvalToken: token } });
}

async function taskVisibleToClient(taskId: string, clientId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, clientId, status: { in: ["REVIEW", "APPROVED", "REJECTED", "POSTED"] } },
    include: { media: true },
  });
  if (!task || task.media.length === 0) return null;
  return task;
}

// Decisão do cliente numa parte da peça (arte ou legenda): aprova ou pede
// ajuste com uma explicação. Recalcula o status geral da tarefa — se tudo
// que a peça precisa está aprovado, avança pra Agendamento; se qualquer
// parte pediu ajuste, volta pra Correção.
export async function clientReviewPart(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const taskId = String(formData.get("taskId") || "").trim();
  const part = String(formData.get("part") || "") as "ART" | "CAPTION";
  const decision = String(formData.get("decision") || "") as "APPROVED" | "CHANGES_REQUESTED";
  const author = String(formData.get("author") || "").trim();
  const text = String(formData.get("text") || "").trim();

  const client = await clientByToken(token);
  if (!client) throw new Error("Link inválido.");
  if (part !== "ART" && part !== "CAPTION") throw new Error("Parte inválida.");
  if (decision !== "APPROVED" && decision !== "CHANGES_REQUESTED") throw new Error("Decisão inválida.");
  if (!author) throw new Error("Informe seu nome antes de aprovar.");
  if (decision === "CHANGES_REQUESTED" && !text) throw new Error("Descreva o ajuste que você quer.");

  const task = await taskVisibleToClient(taskId, client.id);
  if (!task) throw new Error("Peça não encontrada.");
  if (task.status !== "REVIEW") throw new Error("Essa peça não está mais esperando sua aprovação.");
  if (part === "CAPTION" && !taskHasCaption(task.type)) throw new Error("Esse tipo de peça não tem legenda.");

  const artStatus = part === "ART" ? decision : task.artStatus;
  const captionStatus = part === "CAPTION" ? decision : task.captionStatus;
  const outcome = overallApprovalOutcome(task.type, artStatus, captionStatus);

  await prisma.$transaction([
    prisma.task.update({
      where: { id: task.id },
      data: {
        artStatus,
        captionStatus,
        status: outcome === "APPROVED" ? "APPROVED" : outcome === "CHANGES_REQUESTED" ? "REJECTED" : task.status,
        approvedAt: outcome === "APPROVED" ? new Date() : task.approvedAt,
      },
    }),
    prisma.taskComment.create({
      data: {
        taskId: task.id,
        author,
        role: "CLIENT",
        part,
        kind: decision === "APPROVED" ? "APPROVED" : "CHANGES_REQUESTED",
        text,
      },
    }),
  ]);

  revalidatePath(`/aprovacao/${token}`);
  revalidateBoard(task.clientId);
}

export async function clientGeneralComment(formData: FormData) {
  const token = String(formData.get("token") || "").trim();
  const taskId = String(formData.get("taskId") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const text = String(formData.get("text") || "").trim();

  const client = await clientByToken(token);
  if (!client) throw new Error("Link inválido.");
  if (!author) throw new Error("Informe seu nome antes de comentar.");
  if (!text) throw new Error("Escreva o comentário antes de enviar.");

  const task = await taskVisibleToClient(taskId, client.id);
  if (!task) throw new Error("Peça não encontrada.");

  await prisma.taskComment.create({
    data: { taskId: task.id, author, role: "CLIENT", part: "GENERAL", kind: "COMMENT", text },
  });

  revalidatePath(`/aprovacao/${token}`);
  revalidateBoard(task.clientId);
}
