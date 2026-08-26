"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateClientPitch } from "@/lib/ai-copywriter";
import { getAgencySettings } from "@/app/actions/agency";

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

// Chama a IA pra reescrever as seções (anotações internas) como um texto
// único de venda, e salva no lead pra não precisar gerar de novo a cada
// visita à página — só quando o usuário clicar em gerar/regenerar.
export async function generateAndSaveClientPitch(leadId: string) {
  if (!leadId) throw new Error("Lead inválido.");

  const [lead, agency] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: leadId },
      include: { analysisItems: { orderBy: { order: "asc" } } },
    }),
    getAgencySettings(),
  ]);
  if (!lead) throw new Error("Lead não encontrado.");

  const pitch = await generateClientPitch(lead, lead.analysisItems, agency.name);

  await prisma.lead.update({ where: { id: leadId }, data: { clientPitchText: pitch } });

  revalidatePath(`/funil/${leadId}/relatorio`);

  return pitch;
}

export async function updateClientPitch(leadId: string, text: string) {
  if (!leadId) throw new Error("Lead inválido.");
  await prisma.lead.update({ where: { id: leadId }, data: { clientPitchText: text.trim() || null } });
  revalidatePath(`/funil/${leadId}/relatorio`);
}
