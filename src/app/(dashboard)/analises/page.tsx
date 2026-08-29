import Link from "next/link";
import { BarChart2, Users2, Globe, Image as ImageIcon, FileText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalysisSocialDialog } from "@/components/analises/AnalysisSocialDialog";
import { AnalysisWebsiteDialog } from "@/components/analises/AnalysisWebsiteDialog";
import { EditSocialMetricDialog } from "@/components/analises/EditSocialMetricDialog";
import { EditWebsiteMetricDialog } from "@/components/analises/EditWebsiteMetricDialog";
import { DeleteMetricButton } from "@/components/analises/DeleteMetricButton";
import { NewSocialAccountDialog } from "@/components/clients/NewSocialAccountDialog";
import { RefreshFollowersButton } from "@/components/clients/RefreshFollowersButton";
import { DeleteSocialAccountButton } from "@/components/clients/DeleteSocialAccountButton";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const currentMonth = new Date().toISOString().slice(0, 7);

const platformLabel: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  TWITTER: "X / Twitter",
  OTHER: "Outra",
};

export default async function AnalisesPage({
  searchParams,
}: {
  searchParams: { cliente?: string; mes?: string };
}) {
  const selectedClientId = searchParams.cliente || "";
  const selectedMonth = searchParams.mes || currentMonth;
  const monthDate = new Date(`${selectedMonth}-01T00:00:00.000Z`);

  const [clients, socialMetrics, websiteMetrics, selectedClientDetail] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        company: true,
        socialAccounts: { select: { id: true, handle: true, platform: true } },
      },
    }),
    prisma.socialMetric.findMany({
      where: {
        month: monthDate,
        ...(selectedClientId ? { socialAccount: { clientId: selectedClientId } } : {}),
      },
      include: { socialAccount: { include: { client: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.websiteMetric.findMany({
      where: {
        month: monthDate,
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    selectedClientId
      ? prisma.client.findUnique({
          where: { id: selectedClientId },
          select: {
            id: true,
            name: true,
            company: true,
            socialAccounts: {
              orderBy: { createdAt: "asc" },
              include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
            },
          },
        })
      : Promise.resolve(null),
  ]);

  type FeedEntry =
    | { kind: "social"; id: string; createdAt: Date; clientName: string; metric: (typeof socialMetrics)[number] }
    | { kind: "website"; id: string; createdAt: Date; clientName: string; metric: (typeof websiteMetrics)[number] };

  const feed: FeedEntry[] = [
    ...socialMetrics.map((m) => ({
      kind: "social" as const,
      id: m.id,
      createdAt: m.createdAt,
      clientName: m.socialAccount.client.company || m.socialAccount.client.name,
      metric: m,
    })),
    ...websiteMetrics.map((m) => ({
      kind: "website" as const,
      id: m.id,
      createdAt: m.createdAt,
      clientName: m.client.company || m.client.name,
      metric: m,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <Header title="Análises" subtitle="Seguidores, curtidas, dados do site e demais métricas dos clientes, mês a mês" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <form className="flex items-center gap-2" method="get">
            <select
              name="cliente"
              defaultValue={selectedClientId}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
            >
              <option value="">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company || c.name}
                </option>
              ))}
            </select>
            <input
              type="month"
              name="mes"
              defaultValue={selectedMonth}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
            />
            <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Filtrar
            </button>
          </form>
          <div className="flex items-center gap-2">
            <AnalysisSocialDialog clients={clients} defaultClientId={selectedClientId} />
            <AnalysisWebsiteDialog clients={clients} defaultClientId={selectedClientId} />
          </div>
        </div>

        {selectedClientDetail && (
          <>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Redes Sociais ({selectedClientDetail.socialAccounts.length})
                  </CardTitle>
                  <NewSocialAccountDialog clientId={selectedClientDetail.id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedClientDetail.socialAccounts.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma rede social cadastrada.</p>
                )}
                {selectedClientDetail.socialAccounts.map((account) => {
                  const latest = account.metrics[0];
                  const label = `${platformLabel[account.platform] || account.platform} · ${account.handle}`;
                  return (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                        {account.platform === "INSTAGRAM" && (
                          <RefreshFollowersButton socialAccountId={account.id} clientId={selectedClientDetail.id} />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          {latest ? (
                            <>
                              <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">{latest.followers.toLocaleString("pt-BR")}</span>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(latest.month, { month: "long", year: "numeric", day: undefined })}
                                {latest.engagementRate != null && ` · ${latest.engagementRate}% engajamento`}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500">Nenhuma métrica registrada ainda</p>
                          )}
                        </div>
                        <DeleteSocialAccountButton id={account.id} label={label} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Link href={`/projetos?cliente=${selectedClientDetail.id}`} className="block">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <ImageIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ver posts do cliente</span>
                  </CardContent>
                </Card>
              </Link>
              <Link href={`/clientes/${selectedClientDetail.id}/relatorio`} className="block">
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full bg-orange-50 dark:bg-orange-500/10">
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium text-orange-700">Gerar Relatório Mensal</span>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {feed.length === 0 ? (
              <p className="p-10 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
                <BarChart2 className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                Nenhuma análise registrada para este período.
              </p>
            ) : (
              <div className="divide-y">
                {feed.map((entry) => (
                  <div key={`${entry.kind}-${entry.id}`} className="flex items-center justify-between p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        {entry.kind === "social" ? (
                          <Users2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.clientName}
                          {entry.kind === "social" && (
                            <span className="text-gray-400 dark:text-gray-500 font-normal">
                              {" · "}
                              {platformLabel[entry.metric.socialAccount.platform] || entry.metric.socialAccount.platform}
                              {" · "}
                              {entry.metric.socialAccount.handle}
                            </span>
                          )}
                          {entry.kind === "website" && <span className="text-gray-400 dark:text-gray-500 font-normal"> · Site</span>}
                        </p>
                        {entry.kind === "social" ? (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {entry.metric.followers.toLocaleString("pt-BR")} seguidores
                            {entry.metric.engagementRate != null && ` · ${entry.metric.engagementRate}% engajamento`}
                            {entry.metric.totalViews != null && ` · ${entry.metric.totalViews.toLocaleString("pt-BR")} visualizações`}
                            {entry.metric.followerViewsPct != null &&
                              entry.metric.nonFollowerViewsPct != null &&
                              ` · ${entry.metric.followerViewsPct}% / ${entry.metric.nonFollowerViewsPct}% seguidores/não seguidores`}
                            {entry.metric.profileVisits != null && ` · ${entry.metric.profileVisits.toLocaleString("pt-BR")} visitas ao perfil`}
                            {entry.metric.linkTaps != null && ` · ${entry.metric.linkTaps.toLocaleString("pt-BR")} toques em links`}
                            {entry.metric.addressTaps != null && ` · ${entry.metric.addressTaps.toLocaleString("pt-BR")} toques em endereço`}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {entry.metric.pageViews != null && `${entry.metric.pageViews.toLocaleString("pt-BR")} visualizações`}
                            {entry.metric.totalUsers != null && ` · ${entry.metric.totalUsers.toLocaleString("pt-BR")} usuários`}
                            {entry.metric.newUsers != null && ` · ${entry.metric.newUsers.toLocaleString("pt-BR")} novos usuários`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {entry.kind === "social" ? (
                        <EditSocialMetricDialog
                          metric={{
                            clientId: entry.metric.socialAccount.clientId,
                            clientName: entry.clientName,
                            socialAccountId: entry.metric.socialAccountId,
                            accountLabel: `${platformLabel[entry.metric.socialAccount.platform] || entry.metric.socialAccount.platform} — ${entry.metric.socialAccount.handle}`,
                            isInstagram: entry.metric.socialAccount.platform === "INSTAGRAM",
                            month: new Date(entry.metric.month).toISOString().slice(0, 7),
                            followers: entry.metric.followers,
                            reach: entry.metric.reach,
                            engagementRate: entry.metric.engagementRate,
                            totalViews: entry.metric.totalViews,
                            followerViewsPct: entry.metric.followerViewsPct,
                            nonFollowerViewsPct: entry.metric.nonFollowerViewsPct,
                            profileVisits: entry.metric.profileVisits,
                            linkTaps: entry.metric.linkTaps,
                            addressTaps: entry.metric.addressTaps,
                          }}
                        />
                      ) : (
                        <EditWebsiteMetricDialog
                          metric={{
                            clientId: entry.metric.clientId,
                            clientName: entry.clientName,
                            month: new Date(entry.metric.month).toISOString().slice(0, 7),
                            pageViews: entry.metric.pageViews,
                            totalUsers: entry.metric.totalUsers,
                            newUsers: entry.metric.newUsers,
                          }}
                        />
                      )}
                      <DeleteMetricButton id={entry.id} type={entry.kind} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
