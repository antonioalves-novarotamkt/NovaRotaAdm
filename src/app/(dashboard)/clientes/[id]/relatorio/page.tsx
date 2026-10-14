import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/contracts/PrintButton";
import { SendReportEmailButton } from "@/components/clientes/SendReportEmailButton";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

const currentMonth = new Date().toISOString().slice(0, 7);

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

export default async function ClientReportPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { mes?: string };
}) {
  const selectedMonth = searchParams.mes || currentMonth;
  const monthDate = new Date(`${selectedMonth}-01T00:00:00.000Z`);
  const prevMonthDate = new Date(monthDate);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const nextMonthDate = new Date(monthDate);
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);

  const [client, agency] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.id },
      include: {
        socialAccounts: {
          include: {
            metrics: {
              where: { month: { in: [monthDate, prevMonthDate] } },
            },
          },
        },
      },
    }),
    getAgencySettings(),
  ]);

  if (!client) notFound();

  const activities = await prisma.clientActivity.findMany({
    where: {
      clientId: client.id,
      date: { gte: monthDate, lt: nextMonthDate },
    },
    orderBy: { date: "asc" },
  });

  const monthLabel = `${monthNames[monthDate.getMonth()]} de ${monthDate.getFullYear()}`;

  return (
    <div>
      <Header title="Relatório Mensal" subtitle={`${client.company || client.name} · ${monthLabel}`} />
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between print:hidden">
          <Link href={`/clientes/${client.id}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 dark:text-gray-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <form method="get" className="flex items-center gap-2">
              <input
                type="month"
                name="mes"
                defaultValue={selectedMonth}
                className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
              />
              <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                Ver mês
              </button>
            </form>
            <SendReportEmailButton clientId={client.id} month={selectedMonth} />
            <PrintButton />
          </div>
        </div>

        {/* Report header */}
        <Card className="border-0 shadow-sm print:shadow-none">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {agency.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agency.logoUrl} alt={agency.name} className="h-14 object-contain" />
              )}
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Relatório de Performance</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{client.company || client.name}</p>
              </div>
            </div>
            <div className="text-right">
              {client.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={client.logoUrl} alt={client.name} className="h-14 object-contain ml-auto mb-1" />
              )}
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{monthLabel}</p>
            </div>
          </CardContent>
        </Card>

        {/* Social growth */}
        {client.socialAccounts.length > 0 && (
          <Card className="border-0 shadow-sm print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                Redes Sociais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.socialAccounts.map((account) => {
                const current = account.metrics.find(
                  (m) => new Date(m.month).getTime() === monthDate.getTime()
                );
                const previous = account.metrics.find(
                  (m) => new Date(m.month).getTime() === prevMonthDate.getTime()
                );
                const growth = current && previous ? current.followers - previous.followers : null;
                return (
                  <div key={account.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {platformLabel[account.platform] || account.platform} · {account.handle}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                          {current ? current.followers.toLocaleString("pt-BR") : "—"} seguidores
                        </span>
                        {growth != null && (
                          <p className={`text-xs ${growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                            {growth >= 0 ? "+" : ""}
                            {growth.toLocaleString("pt-BR")} no mês
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Activities */}
        <Card className="border-0 shadow-sm print:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Atividades Realizadas ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma atividade registrada neste mês.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap pt-0.5">{formatDate(activity.date)}</span>
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{activity.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
