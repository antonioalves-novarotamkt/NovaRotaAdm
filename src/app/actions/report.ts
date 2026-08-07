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

const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
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

  const [activities, posts, campaigns, sales, websiteMetric] = await Promise.all([
    prisma.clientActivity.findMany({ where: { clientId, date: { gte: monthDate, lt: nextMonthDate } } }),
    prisma.clientPost.findMany({ where: { clientId, month: monthDate } }),
    prisma.campaignMetric.findMany({ where: { clientId, date: { gte: monthDate, lt: nextMonthDate } } }),
    prisma.clientSale.findMany({ where: { clientId, month: monthDate } }),
    prisma.websiteMetric.findFirst({ where: { clientId, month: monthDate } }),
  ]);

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

  if (websiteMetric) {
    sections.push(
      section("Site", [
        row("Visualizações", websiteMetric.pageViews != null ? pt(websiteMetric.pageViews) : "—"),
        row("Total de Usuários", websiteMetric.totalUsers != null ? pt(websiteMetric.totalUsers) : "—"),
        row("Novos Usuários", websiteMetric.newUsers != null ? pt(websiteMetric.newUsers) : "—"),
      ])
    );
  }

  if (posts.length > 0) {
    const totalViews = posts.reduce((s, p) => s + (p.instagramViews || 0) + (p.facebookViews || 0), 0);
    const totalLikes = posts.reduce((s, p) => s + (p.instagramLikes || 0) + (p.facebookLikes || 0), 0);
    const totalShares = posts.reduce((s, p) => s + (p.instagramShares || 0) + (p.facebookShares || 0), 0);
    sections.push(
      section(`Posts do Mês (${posts.length})`, [
        row("Visualizações", pt(totalViews)),
        row("Curtidas", pt(totalLikes)),
        row("Compartilhamentos", pt(totalShares)),
      ])
    );
  }

  if (campaigns.length > 0) {
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
    const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
    const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
    sections.push(
      section("Campanhas Pagas", [
        row("Investimento", brl(totalSpend)),
        row("Impressões", pt(totalImpressions)),
        row("Cliques", pt(totalClicks)),
        row("Conversões", pt(totalConversions)),
      ])
    );
  }

  if (sales.length > 0) {
    const totalGross = sales.reduce((s, sale) => s + sale.grossValue, 0);
    const totalCount = sales.reduce((s, sale) => s + sale.salesCount, 0);
    const salesWithNet = sales.filter((s) => s.netValue != null);
    const rows = [
      row("Total Bruto de Vendas", brl(totalGross)),
      row("Nº de Vendas", pt(totalCount)),
      row("Ticket Médio", brl(totalCount > 0 ? totalGross / totalCount : 0)),
    ];
    if (salesWithNet.length > 0) {
      const totalNet = salesWithNet.reduce((s, sale) => s + (sale.netValue as number), 0);
      const totalLoss = salesWithNet.reduce((s, sale) => s + (sale.grossValue - (sale.netValue as number)), 0);
      rows.push(row("Ganho Líquido", brl(totalNet)));
      rows.push(row("Perdas (taxas/promoções/entregas)", brl(totalLoss)));
    }
    sections.push(section("Vendas do Mês", rows));
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
