import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewCampaignDialog } from "@/components/metricas/NewCampaignDialog";
import { PerformanceLineChart, SpendPieChart, PlatformBarChart } from "@/components/metricas/MetricsCharts";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function MetricasPage() {
  const [campaigns, clients] = await Promise.all([
    prisma.campaignMetric.findMany({
      orderBy: { date: "desc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
  ]);

  const now = new Date();
  const performanceData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const monthCampaigns = campaigns.filter(
      (c) => c.date.getFullYear() === d.getFullYear() && c.date.getMonth() === d.getMonth()
    );
    return {
      month: monthLabels[d.getMonth()],
      impressoes: monthCampaigns.reduce((s, c) => s + c.impressions, 0),
      cliques: monthCampaigns.reduce((s, c) => s + c.clicks, 0),
      conversoes: monthCampaigns.reduce((s, c) => s + c.conversions, 0),
    };
  });

  const platformMap = new Map<string, { spend: number; revenue: number }>();
  for (const c of campaigns) {
    const entry = platformMap.get(c.platform) || { spend: 0, revenue: 0 };
    entry.spend += c.spend;
    entry.revenue += c.revenue;
    platformMap.set(c.platform, entry);
  }
  const platformData = Array.from(platformMap.entries()).map(([platform, v]) => ({ platform, ...v }));

  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
  const avgROAS = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0.00";

  return (
    <div>
      <Header title="Métricas & Relatórios" subtitle="KPIs de campanhas e performance de marketing" />
      <div className="p-6 space-y-6">
        <div className="flex justify-end">
          <NewCampaignDialog clients={clients} />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Impressões", value: (totalImpressions / 1000).toFixed(0) + "K", sub: "total", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Cliques", value: (totalClicks / 1000).toFixed(1) + "K", sub: "total", color: "text-purple-600", bg: "bg-purple-50" },
            { label: "CTR Médio", value: avgCTR + "%", sub: "todos os canais", color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Conversões", value: totalConversions.toLocaleString("pt-BR"), sub: "total", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "ROAS Médio", value: avgROAS + "x", sub: "retorno sobre ad spend", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Investimento", value: "R$" + (totalSpend / 1000).toFixed(0) + "K", sub: "total", color: "text-rose-600", bg: "bg-rose-50" },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                  <div className={`h-2 w-2 rounded-full ${kpi.color.replace("text-", "bg-")}`} />
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-gray-400 leading-tight mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {campaigns.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500">
              Nenhuma campanha registrada ainda. Clique em &quot;Nova Campanha&quot; para começar a acompanhar Google Ads e outras mídias pagas.
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-gray-900">Performance de Campanhas</CardTitle>
                  <p className="text-xs text-gray-500">Impressões, cliques e conversões (6 meses)</p>
                </CardHeader>
                <CardContent>
                  <PerformanceLineChart data={performanceData} />
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-gray-900">Distribuição de Investimento</CardTitle>
                  <p className="text-xs text-gray-500">Por plataforma</p>
                </CardHeader>
                <CardContent>
                  <SpendPieChart data={platformData} />
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">Investimento x Receita por Plataforma</CardTitle>
              </CardHeader>
              <CardContent>
                <PlatformBarChart data={platformData} />
              </CardContent>
            </Card>

            {/* Campaign Table */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">Campanhas</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        {["Campanha", "Cliente", "Plataforma", "Status", "Impressões", "Cliques", "CTR", "Conversões", "ROAS"].map((h) => (
                          <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{campaign.name || "—"}</td>
                          <td className="px-6 py-3 text-gray-600 whitespace-nowrap">{campaign.client.company || campaign.client.name}</td>
                          <td className="px-6 py-3 text-gray-500">{campaign.platform}</td>
                          <td className="px-6 py-3">
                            <Badge variant={campaign.status === "ACTIVE" ? "success" : campaign.status === "PAUSED" ? "warning" : "gray"}>
                              {campaign.status === "ACTIVE" ? "Ativa" : campaign.status === "PAUSED" ? "Pausada" : "Concluída"}
                            </Badge>
                          </td>
                          <td className="px-6 py-3 text-gray-600">{(campaign.impressions / 1000).toFixed(1)}K</td>
                          <td className="px-6 py-3 text-gray-600">{campaign.clicks.toLocaleString("pt-BR")}</td>
                          <td className="px-6 py-3 text-gray-600">{campaign.ctr.toFixed(1)}%</td>
                          <td className="px-6 py-3 text-gray-600">{campaign.conversions}</td>
                          <td className={`px-6 py-3 font-bold ${campaign.roas >= 3 ? "text-green-600" : campaign.roas >= 2 ? "text-yellow-600" : "text-red-500"}`}>
                            {campaign.roas.toFixed(1)}x
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
