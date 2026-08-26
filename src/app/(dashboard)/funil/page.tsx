import { Target, TrendingUp, Percent, Users } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { NewLeadDialog } from "@/components/funil/NewLeadDialog";
import { LeadCard } from "@/components/funil/LeadCard";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const stages = [
  { key: "NEW", label: "Novo Contato" },
  { key: "ANALYZING", label: "Analisando" },
  { key: "CONTACTED", label: "Em Contato" },
  { key: "PROPOSAL", label: "Proposta Enviada" },
  { key: "NEGOTIATION", label: "Negociação" },
  { key: "WON", label: "Ganho" },
  { key: "LOST", label: "Perdido" },
] as const;

export default async function FunilPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { analysisItems: true } } },
  });

  const byStage = new Map<string, typeof leads>();
  for (const stage of stages) byStage.set(stage.key, []);
  for (const lead of leads) {
    byStage.get(lead.stage)?.push(lead);
  }

  const openLeads = leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST");
  const pipelineValue = openLeads.reduce((s, l) => s + (l.value || 0), 0);
  const decided = leads.filter((l) => l.stage === "WON" || l.stage === "LOST");
  const won = leads.filter((l) => l.stage === "WON").length;
  const conversionRate = decided.length > 0 ? (won / decided.length) * 100 : 0;

  return (
    <div>
      <Header title="Funil de Vendas" subtitle="Acompanhe seus leads da prospecção até o fechamento" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 mr-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Leads Ativos</p>
                  <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{openLeads.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Valor em Negociação</p>
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(pipelineValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Taxa de Conversão</p>
                  <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                    <Percent className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{conversionRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{won} de {decided.length} decididos</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total de Leads</p>
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{leads.length}</p>
              </CardContent>
            </Card>
          </div>
          <NewLeadDialog />
        </div>

        {/* Kanban board */}
        <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-4">
          {stages.map((stage) => {
            const stageLeads = byStage.get(stage.key) || [];
            const stageValue = stageLeads.reduce((s, l) => s + (l.value || 0), 0);
            return (
              <div key={stage.key} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stage.label}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{stageLeads.length}</span>
                </div>
                {stageValue > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 px-1 -mt-2">{formatCurrency(stageValue)}</p>
                )}
                <div className="space-y-2 min-h-[60px]">
                  {stageLeads.length === 0 ? (
                    <p className="text-xs text-gray-300 dark:text-gray-600 px-1">Nenhum lead</p>
                  ) : (
                    stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={{ ...lead, hasAnalysis: lead._count.analysisItems > 0 }} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
