import Link from "next/link";
import {
  Users,
  FileText,
  DollarSign,
  ShoppingCart,
  Clock,
  ImageIcon,
  AlertCircle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { syncInvoiceStatuses } from "@/lib/scheduled-invoices";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const contractStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "purple" | "gray" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  EXPIRED: { label: "Expirado", variant: "gray" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "gray" },
};

const invoiceStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "purple" | "gray" }> = {
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  OVERDUE: { label: "Atrasado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "gray" },
  CANCELLED: { label: "Cancelado", variant: "gray" },
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function DashboardPage() {
  await syncInvoiceStatuses();

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const nextMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
  const prevMonthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    invoices,
    activeClientsCount,
    newClientsThisMonth,
    salesThisMonth,
    salesPrevMonth,
    overdueInvoices,
    upcomingBilling,
    postsThisMonth,
    recentContracts,
    recentInvoices,
    costsThisMonth,
    costsPrevMonth,
  ] = await Promise.all([
    prisma.invoice.findMany({ where: { status: "PAID" }, select: { total: true, paidAt: true } }),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.client.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.clientSale.aggregate({ where: { month: monthStart }, _sum: { grossValue: true } }),
    prisma.clientSale.aggregate({ where: { month: prevMonthStart }, _sum: { grossValue: true } }),
    prisma.invoice.findMany({ where: { status: "OVERDUE" }, select: { total: true } }),
    prisma.client.count({
      where: { nextBillingDate: { gte: now, lte: in7Days } },
    }),
    prisma.clientPost.count({ where: { month: monthStart } }),
    prisma.contract.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { client: true },
    }),
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      take: 5,
      include: { client: true },
    }),
    prisma.operationalCost.aggregate({ where: { month: monthStart }, _sum: { amount: true } }),
    prisma.operationalCost.aggregate({ where: { month: prevMonthStart }, _sum: { amount: true } }),
  ]);

  const revenueThisMonth = invoices
    .filter((i) => i.paidAt && i.paidAt >= monthStart && i.paidAt < nextMonthStart)
    .reduce((s, i) => s + i.total, 0);
  const revenuePrevMonth = invoices
    .filter((i) => i.paidAt && i.paidAt >= prevMonthStart && i.paidAt < monthStart)
    .reduce((s, i) => s + i.total, 0);
  const revenueChange = revenuePrevMonth > 0 ? ((revenueThisMonth - revenuePrevMonth) / revenuePrevMonth) * 100 : 0;

  const salesTotalThisMonth = salesThisMonth._sum.grossValue || 0;
  const salesTotalPrevMonth = salesPrevMonth._sum.grossValue || 0;
  const salesChange = salesTotalPrevMonth > 0 ? ((salesTotalThisMonth - salesTotalPrevMonth) / salesTotalPrevMonth) * 100 : 0;

  const overdueTotal = overdueInvoices.reduce((s, i) => s + i.total, 0);
  const overdueCount = overdueInvoices.length;

  const costsTotalThisMonth = costsThisMonth._sum.amount || 0;
  const costsTotalPrevMonth = costsPrevMonth._sum.amount || 0;
  const costsChange = costsTotalPrevMonth > 0 ? ((costsTotalThisMonth - costsTotalPrevMonth) / costsTotalPrevMonth) * 100 : 0;

  const profitThisMonth = revenueThisMonth - costsTotalThisMonth;
  const profitPrevMonth = revenuePrevMonth - costsTotalPrevMonth;
  const profitChange = profitPrevMonth !== 0 ? ((profitThisMonth - profitPrevMonth) / Math.abs(profitPrevMonth)) * 100 : 0;

  const chartData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (5 - idx), 1));
    const dNext = new Date(Date.UTC(now.getFullYear(), now.getMonth() - (5 - idx) + 1, 1));
    const faturamento = invoices
      .filter((i) => i.paidAt && i.paidAt >= d && i.paidAt < dNext)
      .reduce((s, i) => s + i.total, 0);
    return { key: d.getTime(), month: monthLabels[d.getUTCMonth()], faturamento, vendas: 0 };
  });

  const salesByMonth = await prisma.clientSale.groupBy({
    by: ["month"],
    _sum: { grossValue: true },
    where: {
      month: {
        gte: new Date(Date.UTC(now.getFullYear(), now.getMonth() - 5, 1)),
        lt: nextMonthStart,
      },
    },
  });
  for (const entry of salesByMonth) {
    const idx = chartData.findIndex((c) => c.key === new Date(entry.month).getTime());
    if (idx !== -1) chartData[idx].vendas = entry._sum.grossValue || 0;
  }

  return (
    <div>
      <Header title="Dashboard" subtitle="Bem-vindo ao NovaRota — visão geral do seu negócio" />
      <div className="p-6 space-y-6">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Receita Mensal"
            value={formatCurrency(revenueThisMonth)}
            change={Math.round(revenueChange * 10) / 10}
            changeLabel="vs mês anterior"
            trend={revenueChange >= 0 ? "up" : "down"}
            icon={<DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />}
            iconBg="bg-orange-50 dark:bg-orange-500/10"
            href="/financeiro"
          />
          <KPICard
            title="Custos Operacionais"
            value={formatCurrency(costsTotalThisMonth)}
            change={Math.round(costsChange * 10) / 10}
            changeLabel="vs mês anterior"
            trend={costsChange <= 0 ? "up" : "down"}
            icon={<Wallet className="h-5 w-5 text-red-500 dark:text-red-400" />}
            iconBg="bg-red-50 dark:bg-red-500/10"
            href="/custos"
          />
          <KPICard
            title="Lucro do Mês"
            value={formatCurrency(profitThisMonth)}
            change={Math.round(profitChange * 10) / 10}
            changeLabel="vs mês anterior"
            trend={profitThisMonth >= 0 ? "up" : "down"}
            icon={<TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
            href="/financeiro"
          />
          <KPICard
            title="Clientes Ativos"
            value={activeClientsCount}
            change={newClientsThisMonth}
            changeLabel="novos este mês"
            trend="up"
            icon={<Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
            href="/clientes?status=ACTIVE"
          />
          <KPICard
            title="Vendas dos Clientes"
            value={formatCurrency(salesTotalThisMonth)}
            change={Math.round(salesChange * 10) / 10}
            changeLabel="vs mês anterior"
            trend={salesChange >= 0 ? "up" : "down"}
            icon={<ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />}
            iconBg="bg-purple-50 dark:bg-purple-500/10"
            href="/vendas"
          />
          <KPICard
            title="A Receber"
            value={formatCurrency(overdueTotal)}
            change={overdueCount}
            changeLabel="fatura(s) atrasada(s)"
            trend={overdueCount > 0 ? "down" : "up"}
            icon={<AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />}
            iconBg="bg-red-50 dark:bg-red-500/10"
            href="/financeiro"
          />
        </div>

        {/* Charts & Recent Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue Chart - spans 2 cols */}
          <RevenueChart data={chartData} />

          {/* Quick Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Resumo Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href="/projetos"
                className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-500/10 hover:opacity-80 transition-opacity"
              >
                <ImageIcon className="h-5 w-5 text-orange-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{postsThisMonth} post(s) publicados</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Este mês</p>
                </div>
              </Link>
              <Link
                href="/financeiro"
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 hover:opacity-80 transition-opacity"
              >
                <Clock className="h-5 w-5 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{upcomingBilling} cobrança(s) nos próximos 7 dias</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Requer atenção</p>
                </div>
              </Link>
              <Link
                href="/financeiro"
                className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 hover:opacity-80 transition-opacity"
              >
                <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{overdueCount} fatura(s) vencida(s)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total: {formatCurrency(overdueTotal)}</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Contracts & Invoices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Contracts */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Contratos Recentes</CardTitle>
                <Link href="/contratos" className="text-xs text-orange-600 dark:text-orange-400 hover:underline">Ver todos</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentContracts.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum contrato cadastrado ainda.</p>
              ) : (
                recentContracts.map((contract) => {
                  const status = contractStatusMap[contract.status];
                  return (
                    <Link
                      key={contract.id}
                      href={`/contratos/${contract.id}`}
                      className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 rounded"
                    >
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{contract.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{contract.client.company || contract.client.name}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </Link>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Últimas Faturas</CardTitle>
                <Link href="/financeiro" className="text-xs text-orange-600 dark:text-orange-400 hover:underline">Ver todas</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentInvoices.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                  Nenhuma fatura registrada ainda.
                </p>
              ) : (
                recentInvoices.map((invoice) => {
                  const status = invoiceStatusMap[invoice.status];
                  return (
                    <div key={invoice.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.number}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{invoice.client.company || invoice.client.name} · Vence {formatDate(invoice.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
