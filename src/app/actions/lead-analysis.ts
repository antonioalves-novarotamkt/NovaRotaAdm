"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface LeadAnalysisSectionInput {
  title: string;
  content: string;
}

// Substitui todas as seções do lead pelas enviadas — mais simples do que
// tentar casar itens existentes por id, e o editor sempre envia a lista
// completa (inclusão, edição e remoção de seções ao mesmo tempo).
export async function saveLeadAnalysis(leadId: string, sections: LeadAnalysisSectionInput[]) {
  if (!leadId) throw new Error("Lead inválido.");

  const cleaned = sections
    .map((s) => ({ title: s.title.trim(), content: s.content.trim() }))
    .filter((s) => s.title || s.content);

  await prisma.$transaction([
    prisma.leadAnalysisItem.deleteMany({ where: { leadId } }),
    ...(cleaned.length
      ? [
          prisma.leadAnalysisItem.createMany({
            data: cleaned.map((s, i) => ({ leadId, title: s.title, content: s.content, order: i })),
          }),
        ]
      : []),
  ]);

  revalidatePath("/funil");
  revalidatePath(`/funil/${leadId}/analise`);
  revalidatePath(`/funil/${leadId}/relatorio`);
}
