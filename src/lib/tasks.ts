import type { TaskStatus, TaskType } from "@prisma/client";

export const taskTypeLabel: Record<TaskType, string> = {
  POST: "Post",
  STORY: "Story",
  BLOG: "Texto de Blog",
  SITE_UPDATE: "Atualização de Site",
  OTHER: "Outra",
};

export const taskStatusLabel: Record<TaskStatus, string> = {
  TODO: "A Fazer",
  IN_PROGRESS: "Em Produção",
  REVIEW: "Aguardando Aprovação",
  APPROVED: "Agendamento",
  POSTED: "Postado",
  REJECTED: "Correção",
};

// Ordem das colunas do quadro — do início do fluxo até o fim. Ao aprovar,
// o card vai direto pra "Agendamento" (onde entram as datas de cada
// post/story do lote); ao reprovar, vai pra "Correção", de onde pode
// voltar pra "Aguardando Aprovação" depois de ajustado.
export const TASK_STATUS_COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "APPROVED", "POSTED", "REJECTED"];

// Tipos de conteúdo com data (post/story) que entram no calendário do Dashboard
// quando aprovados — os demais (blog, site, outra) só viram atividade no relatório.
export const CALENDAR_TASK_TYPES: TaskType[] = ["POST", "STORY"];
