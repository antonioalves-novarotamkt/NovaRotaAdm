import type { TaskStatus, TaskType } from "@prisma/client";

export const taskTypeLabel: Record<TaskType, string> = {
  BLOG: "Texto de Blog",
  SITE_UPDATE: "Atualização de Site",
  OTHER: "Outra",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Produção",
  REVIEW: "Aguardando Aprovação",
  APPROVED: "Aprovado",
  REJECTED: "Correção",
};

// Ordem das colunas do quadro — do início do fluxo até o fim. "Correção"
// fica antes de "Aguardando Aprovação" porque é de lá que os cards
// reprovados voltam, depois de ajustados.
export const TASK_STATUS_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REJECTED", "REVIEW", "APPROVED"];
