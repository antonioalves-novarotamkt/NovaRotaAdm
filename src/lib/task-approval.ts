import type { ApprovalStatus, TaskType } from "@prisma/client";
import { taskHasCaption } from "@/lib/tasks";

// Decide se, com o estado atual de arte/legenda, a peça já pode avançar
// pro card de Agendamento, precisa voltar pra Correção, ou ainda está
// esperando o cliente decidir.
export function overallApprovalOutcome(
  type: TaskType,
  artStatus: ApprovalStatus,
  captionStatus: ApprovalStatus
): "APPROVED" | "CHANGES_REQUESTED" | "PENDING" {
  const parts = taskHasCaption(type) ? [artStatus, captionStatus] : [artStatus];
  if (parts.includes("CHANGES_REQUESTED")) return "CHANGES_REQUESTED";
  if (parts.every((p) => p === "APPROVED")) return "APPROVED";
  return "PENDING";
}

export const approvalStatusLabel: Record<ApprovalStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  CHANGES_REQUESTED: "Ajuste pedido",
};
