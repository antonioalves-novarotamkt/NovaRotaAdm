"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";
import { sendMonthlyReportEmail } from "@/lib/mailer";

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const platformLabel: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  TWITTER: "X / Twitter",
  OTHER: "Outra",
};

const pt = (value: number) => value.toLocaleString("pt-BR");

function section(title: string, rows: string[]): string {
  if (rows.length === 0) return "";
  return `
    <div style="margin-top: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <p style="font-weight: 600; color: #1e293b; margin: 0 0 10px;">${title}</p>
      ${rows.join("")}
    </div>
  `;
}

function row(label: string, value: string): string {
  return `<p style="color: #475569; font-size: 13px; margin: 4px 0;">${label}: <strong style="color:#1e293b;">${value}</strong></p>`;
}

export async function sendClientReportEmail(clientId: string, month: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Não autenticado.");

  const monthDate = new Date(`${month}-01T00:00:00.000Z`);
  const prevMonthDate = new Date(monthDate);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const nextMonthDate = new Date(monthDate);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const [client, agency] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        socialAccounts: { include: { metrics: { where: { month: { in: [monthDate, prevMonthDate] } } } } },
      },
    }),
    getAgencySettings(),
  ]);
  if (!client) throw new Error("Cliente não encontrado.");
  if (!client.email) throw new Error("Cliente não tem email cadastrado.");

  const activities = await prisma.clientActivity.findMany({ where: { clientId, date: { gte: monthDate, lt: nextMonthDate } } });

  const monthLabel = `${monthNames[monthDate.getMonth()]} de ${monthDate.getFullYear()}`;

  const sections: string[] = [];

  if (client.socialAccounts.length > 0) {
    const rows = client.socialAccounts.map((account) => {
      const current = account.metrics.find((m) => new Date(m.month).getTime() === monthDate.getTime());
      const previous = account.metrics.find((m) => new Date(m.month).getTime() === prevMonthDate.getTime());
      const growth = current && previous ? current.followers - previous.followers : null;
      const growthText = growth != null ? ` (${growth >= 0 ? "+" : ""}${pt(growth)} no mês)` : "";
      return row(
        `${platformLabel[account.platform] || account.platform} · ${account.handle}`,
        `${current ? pt(current.followers) : "—"} seguidores${growthText}`
      );
    });
    sections.push(section("Redes Sociais", rows));
  }

  if (activities.length > 0) {
    sections.push(
      section(
        `Atividades Realizadas (${activities.length})`,
        activities.map((a) => `<p style="color:#475569;font-size:13px;margin:4px 0;">• ${a.description}</p>`)
      )
    );
  }

  const bodyHtml =
    sections.length > 0
      ? sections.join("")
      : `<p style="color:#94a3b8;font-size:13px;">Nenhum dado registrado para este mês.</p>`;

  await sendMonthlyReportEmail(client.email, {
    clientName: client.company || client.name,
    agencyName: agency.name,
    monthLabel,
    bodyHtml,
  });

  return { ok: true };
}
