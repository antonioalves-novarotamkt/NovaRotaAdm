import {
  Users,
  FolderOpen,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

const recentProjects = [
  { id: "1", name: "Campanha Google Ads - TechBrasil", client: "TechBrasil Ltda", status: "IN_PROGRESS", budget: 15000, endDate: new Date("2024-03-15") },
  { id: "2", name: "Redesign de Marca - StartupXYZ", client: "StartupXYZ", status: "REVIEW", budget: 8500, endDate: new Date("2024-02-28") },
  { id: "3", name: "SEO e Conteúdo - Loja Moderna", client: "Loja Moderna", status: "PLANNING", budget: 4200, endDate: new Date("2024-04-01") },
  { id: "4", name: "Social Media - Restaurante Bella", client: "Restaurante Bella", status: "COMPLETED", budget: 3000, endDate: new Date("2024-01-31") },
  { id: "5", name: "E-mail Marketing - Clínica Saúde+", client: "Clínica Saúde+", status: "IN_PROGRESS", budget: 2500, endDate: new Date("2024-03-30") },
];

const recentInvoices = [
  { id: "1", number: "NF-2024-001", client: "TechBrasil Ltda", amount: 15000, status: "PAID", dueDate: new Date("2024-01-15") },
  { id: "2", number: "NF-2024-002", client: "StartupXYZ", amount: 8500, status: "PENDING", dueDate: new Date("2024-02-10") },
  { id: "3", number: "NF-2024-003", client: "Loja Moderna", amount: 4200, status: "OVERDUE", dueDate: new Date("2024-01-28") },
  { id: "4", number: "NF-2024-004", client: "Restaurante Bella", amount: 3000, status: "PAID", dueDate: new Date("2024-01-20") },
];

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "purple" | "gray" }> = {
  IN_PROGRESS: { label: "Em Andamento", variant: "info" },
  REVIEW: { label: "Em Revisão", variant: "purple" },
  PLANNING: { label: "Planejamento", variant: "warning" },
  COMPLETED: { label: "Concluído", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
  ON_HOLD: { label: "Pausado", variant: "gray" },
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  OVERDUE: { label: "Atrasado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "gray" },
};

export default function DashboardPage() {
  return (
    <div>
      <Header title="Dashboard" subtitle="Bem-vindo ao NovaRota — visão geral do seu negócio" />
      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Receita Mensal"
            value={formatCurrency(78500)}
            change={12.5}
            changeLabel="vs mês anterior"
            trend="up"
            icon={<DollarSign className="h-5 w-5 text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <KPICard
            title="Clientes Ativos"
            value="34"
            change={8.3}
            changeLabel="novos este mês"
            trend="up"
            icon={<Users className="h-5 w-5 text-emerald-600" />}
            iconBg="bg-emerald-50"
          />
          <KPICard
            title="Projetos em Andamento"
            value="12"
            change={-2.1}
            changeLabel="vs mês anterior"
            trend="down"
            icon={<FolderOpen className="h-5 w-5 text-orange-500" />}
            iconBg="bg-orange-50"
          />
          <KPICard
            title="Taxa de Conversão"
            value="67%"
            change={5.7}
            changeLabel="vs mês anterior"
            trend="up"
            icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            iconBg="bg-purple-50"
          />
        </div>

        {/* Charts & Recent Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart - spans 2 cols */}
          <RevenueChart />

          {/* Quick Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Resumo Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">8 tarefas concluídas</p>
                  <p className="text-xs text-gray-500">Hoje</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50">
                <Clock className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">5 prazos esta semana</p>
                  <p className="text-xs text-gray-500">Requer atenção</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">3 faturas vencidas</p>
                  <p className="text-xs text-gray-500">Total: {formatCurrency(12700)}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Meta Mensal</span>
                  <span className="font-semibold text-gray-900">79%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "79%" }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatCurrency(78500)} / {formatCurrency(100000)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Projects */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Projetos Recentes</CardTitle>
                <a href="/projetos" className="text-xs text-blue-600 hover:underline">Ver todos</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentProjects.map((project) => {
                const status = statusMap[project.status];
                return (
                  <div key={project.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{project.name}</p>
                      <p className="text-xs text-gray-500">{project.client}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900">Últimas Faturas</CardTitle>
                <a href="/financeiro" className="text-xs text-blue-600 hover:underline">Ver todas</a>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentInvoices.map((invoice) => {
                const status = statusMap[invoice.status];
                return (
                  <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-sm font-medium text-gray-900">{invoice.number}</p>
                      <p className="text-xs text-gray-500">{invoice.client} · Vence {formatDate(invoice.dueDate)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
