import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Heart, Share2, TrendingUp, ShoppingCart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/contracts/PrintButton";
import { formatDate, formatCurrency } from "@/lib/utils";
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

  const [activities, posts, campaigns, sales] = await Promise.all([
    prisma.clientActivity.findMany({
      where: {
        clientId: client.id,
        date: { gte: monthDate, lt: nextMonthDate },
      },
      orderBy: { date: "asc" },
    }),
    prisma.clientPost.findMany({
      where: { clientId: client.id, month: monthDate },
      orderBy: { createdAt: "asc" },
    }),
    prisma.campaignMetric.findMany({
      where: {
        clientId: client.id,
        date: { gte: monthDate, lt: nextMonthDate },
      },
    }),
    prisma.clientSale.findMany({
      where: { clientId: client.id, month: monthDate },
    }),
  ]);

  const totalSalesValue = sales.reduce((s, sale) => s + sale.totalValue, 0);
  const totalSalesCount = sales.reduce((s, sale) => s + sale.salesCount, 0);

  const totalViews = posts.reduce((s, p) => s + (p.views || 0), 0);
  const totalLikes = posts.reduce((s, p) => s + (p.likes || 0), 0);
  const totalShares = posts.reduce((s, p) => s + (p.shares || 0), 0);

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  const monthLabel = `${monthNames[monthDate.getMonth()]} de ${monthDate.getFullYear()}`;

  return (
    <div>
      <Header title="Relatório Mensal" subtitle={`${client.company || client.name} · ${monthLabel}`} />
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between print:hidden">
          <Link href={`/clientes/${client.id}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
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
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
              />
              <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
                Ver mês
              </button>
            </form>
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
                <p className="text-xs text-gray-400">Relatório de Performance</p>
                <p className="text-lg font-bold text-gray-900">{client.company || client.name}</p>
              </div>
            </div>
            <div className="text-right">
              {client.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={client.logoUrl} alt={client.name} className="h-14 object-contain ml-auto mb-1" />
              )}
              <p className="text-sm font-medium text-gray-700">{monthLabel}</p>
            </div>
          </CardContent>
        </Card>

        {/* Social growth */}
        {client.socialAccounts.length > 0 && (
          <Card className="border-0 shadow-sm print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
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
                const showInstagramInsights =
                  account.platform === "INSTAGRAM" &&
                  current &&
                  (current.totalViews != null ||
                    current.followerViewsPct != null ||
                    current.profileVisits != null ||
                    current.linkTaps != null ||
                    current.addressTaps != null);
                return (
                  <div key={account.id} className="p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {platformLabel[account.platform] || account.platform} · {account.handle}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">
                          {current ? current.followers.toLocaleString("pt-BR") : "—"} seguidores
                        </span>
                        {growth != null && (
                          <p className={`text-xs ${growth >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {growth >= 0 ? "+" : ""}
                            {growth.toLocaleString("pt-BR")} no mês
                          </p>
                        )}
                      </div>
                    </div>
                    {showInstagramInsights && current && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
                        {current.totalViews != null && (
                          <div>
                            <p className="text-xs text-gray-400">Visualizações totais</p>
                            <p className="text-sm font-semibold text-gray-900">{current.totalViews.toLocaleString("pt-BR")}</p>
                          </div>
                        )}
                        {current.followerViewsPct != null && (
                          <div>
                            <p className="text-xs text-gray-400">Seguidores x Não seguidores</p>
                            <p className="text-sm font-semibold text-gray-900">
                              {current.followerViewsPct.toLocaleString("pt-BR")}% / {(100 - current.followerViewsPct).toLocaleString("pt-BR")}%
                            </p>
                          </div>
                        )}
                        {current.profileVisits != null && (
                          <div>
                            <p className="text-xs text-gray-400">Visitas ao perfil</p>
                            <p className="text-sm font-semibold text-gray-900">{current.profileVisits.toLocaleString("pt-BR")}</p>
                          </div>
                        )}
                        {current.linkTaps != null && (
                          <div>
                            <p className="text-xs text-gray-400">Toques em links</p>
                            <p className="text-sm font-semibold text-gray-900">{current.linkTaps.toLocaleString("pt-BR")}</p>
                          </div>
                        )}
                        {current.addressTaps != null && (
                          <div>
                            <p className="text-xs text-gray-400">Toques em endereço</p>
                            <p className="text-sm font-semibold text-gray-900">{current.addressTaps.toLocaleString("pt-BR")}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Posts */}
        <Card className="border-0 shadow-sm print:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              Posts do Mês ({posts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum post registrado neste mês.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                  {posts.map((post) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={post.id}
                      src={post.imageUrl}
                      alt={post.caption || "Post"}
                      className="aspect-square object-cover rounded-lg border border-gray-100"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-700 border-t pt-3">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-gray-400" /> {totalViews.toLocaleString("pt-BR")} visualizações
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-gray-400" /> {totalLikes.toLocaleString("pt-BR")} curtidas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Share2 className="h-4 w-4 text-gray-400" /> {totalShares.toLocaleString("pt-BR")} compartilhamentos
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Campaigns */}
        {campaigns.length > 0 && (
          <Card className="border-0 shadow-sm print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Campanhas Pagas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-400">Investimento</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(totalSpend)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Impressões</p>
                <p className="text-sm font-bold text-gray-900">{totalImpressions.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Cliques</p>
                <p className="text-sm font-bold text-gray-900">{totalClicks.toLocaleString("pt-BR")}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Conversões</p>
                <p className="text-sm font-bold text-gray-900">{totalConversions.toLocaleString("pt-BR")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sales */}
        {sales.length > 0 && (
          <Card className="border-0 shadow-sm print:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
                Vendas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-xs text-gray-400">Valor Total</p>
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(totalSalesValue)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Nº de Vendas</p>
                  <p className="text-sm font-bold text-gray-900">{totalSalesCount.toLocaleString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ticket Médio</p>
                  <p className="text-sm font-bold text-gray-900">
                    {formatCurrency(totalSalesCount > 0 ? totalSalesValue / totalSalesCount : 0)}
                  </p>
                </div>
              </div>
              {sales.length > 1 && (
                <div className="space-y-1.5 border-t pt-3">
                  {sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between text-xs text-gray-600">
                      <span>{sale.platform || "Geral"}</span>
                      <span>
                        {formatCurrency(sale.totalValue)} · {sale.salesCount} vendas
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activities */}
        <Card className="border-0 shadow-sm print:shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">
              Atividades Realizadas ({activities.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma atividade registrada neste mês.</p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">{formatDate(activity.date)}</span>
                  <p className="text-sm text-gray-700 flex-1">{activity.description}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
