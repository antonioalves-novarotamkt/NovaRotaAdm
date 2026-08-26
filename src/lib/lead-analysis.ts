export interface LeadAnalysisSection {
  title: string;
  content: string;
}

interface LeadInfo {
  name: string;
  company: string | null;
}

// Texto por template (sem IA) — concatena as seções escritas à mão pela
// agência num texto pronto para colar no WhatsApp.
export function buildWhatsappAnalysisText(
  lead: LeadInfo,
  sections: LeadAnalysisSection[],
  agencyName: string
): string {
  const displayName = lead.company || lead.name;
  const lines: string[] = [];

  lines.push(`Olá! Aqui é da ${agencyName}. 👋`);
  lines.push("");
  lines.push(`Fizemos uma análise rápida do ${displayName} e encontramos algumas oportunidades:`);

  for (const section of sections) {
    if (!section.title.trim() && !section.content.trim()) continue;
    lines.push("");
    lines.push(`*${section.title}*`);
    lines.push(section.content);
  }

  lines.push("");
  lines.push("Podemos marcar uma conversa rápida para falar sobre isso?");

  return lines.join("\n");
}
