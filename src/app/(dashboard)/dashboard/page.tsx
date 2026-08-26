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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/dashboard/KPICard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { syncInvoiceStatuses } from "@/lib/scheduled-invoices";
import { CALENDAR_TASK_TYPES, taskTypeLabel } from "@/lib/tasks";
import { computeNextBillingDate, projectBillingDates } from "@/lib/billing";
import { remainingAmount, receivedAmount } from "@/lib/payments";
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
  PARTIALLY_PAID: { label: "Parcial", variant: "info" },
  PENDING: { label: "Pendente", variant: "warning" },
  OVERDUE: { label: "Atrasado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "gray" },
  CANCELLED: { label: "Cancelado", variant: "gray" },
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  try {
    await syncInvoiceStatuses();
  } catch (error) {
    console.error("syncInvoiceStatuses falhou no Dashboard:", error);
  }

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Mes selecionado pelo filtro (formato "YYYY-MM"); tudo que e' historico/mensal
  // (receita, custos, vendas, novos clientes, posts) segue esse mes. Coisas ao
  // vivo por natureza (cobrancas nos proximos 7 dias, faturas em atraso agora)
  // continuam usando a data real de hoje, independente do filtro.
  const monthParam = searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month) ? searchParams.month : null;
  const selectedMonth = monthParam
    ? new Date(Date.UTC(Number(monthParam.slice(0, 4)), Number(monthParam.slice(5, 7)) - 1, 1))
    : new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthStart = selectedMonth;
  const nextMonthStart = new Date(Date.UTC(selectedMonth.getUTCFullYear(), selectedMonth.getUTCMonth() + 1, 1));
  const prevMonthStart = new Date(Date.UTC(selectedMonth.getUTCFullYear(), selectedMonth.getUTCMonth() - 1, 1));
  const isCurrentMonth =
    selectedMonth.getUTCFullYear() === now.getFullYear() && selectedMonth.getUTCMonth() === now.getMonth();
  const monthParamStr = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

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
    contentCalendarTasks,
    monthInvoices,
    recurringClients,
  ] = await Promise.all([
    prisma.invoice.findMany({ where: { status: "PAID" }, select: { total: true, paidAt: true } }),
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.client.count({ where: { createdAt: { gte: monthStart, lt: nextMonthStart } } }),
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
    prisma.task.findMany({
      where: {
        type: { in: CALENDAR_TASK_TYPES },
        status: "APPROVED",
        dueDate: { gte: monthStart, lt: nextMonthStart },
      },
      include: { client: { select: { id: true, name: true, company: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { dueDate: { gte: monthStart, lt: nextMonthStart } },
          { paidAt: { gte: monthStart, lt: nextMonthStart } },
        ],
      },
      include: { payments: true, client: { select: { id: true, name: true, company: true } } },
    }),
    prisma.client.findMany({
      where: { status: { notIn: ["CHURNED", "INACTIVE"] }, billingFrequency: { not: "NONE" }, contractValue: { not: null }, nextBillingDate: { not: null } },
      select: {
        id: true,
        name: true,
        company: true,
        contractValue: true,
        billingFrequency: true,
        billingDayOfWeek: true,
        billingDayOfMonth1: true,
        billingDayOfMonth2: true,
        nextBillingDate: true,
      },
    }),
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

  // Faturamento dia a dia do mês selecionado — junta o que já foi recebido
  // (por data de pagamento) com o que ainda está previsto (vencimento de
  // fatura já gerada, mais ocorrências futuras de clientes recorrentes que
  // ainda nem viraram fatura), pra dar visibilidade do mês inteiro dia a
  // dia — essencial pra quem tem cliente com cobrança semanal, onde o
  // faturamento do mês não é um valor só, é vários ao longo do mês.
  const dailyBilling = new Map<number, { received: number; expected: number }>();
  function addToDay(date: Date, field: "received" | "expected", amount: number) {
    if (amount <= 0) return;
    const day = date.getDate();
    const entry = dailyBilling.get(day) || { received: 0, expected: 0 };
    entry[field] += amount;
    dailyBilling.set(day, entry);
  }

  for (const invoice of monthInvoices) {
    if (invoice.paidAt && invoice.paidAt >= monthStart && invoice.paidAt < nextMonthStart) {
      addToDay(invoice.paidAt, "received", receivedAmount(invoice));
    }
    if (
      invoice.dueDate >= monthStart &&
      invoice.dueDate < nextMonthStart &&
      (invoice.status === "PENDING" || invoice.status === "OVERDUE" || invoice.status === "PARTIALLY_PAID")
    ) {
      addToDay(invoice.dueDate, "expected", remainingAmount(invoice));
    }
  }

  const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
  for (const client of recurringClients) {
    if (!client.nextBillingDate || !client.contractValue) continue;
    const rule = {
      frequency: client.billingFrequency,
      dayOfWeek: client.billingDayOfWeek,
      dayOfMonth1: client.billingDayOfMonth1,
      dayOfMonth2: client.billingDayOfMonth2,
    };
    // A próxima cobrança do cliente já tem fatura gerada (contada acima via
    // dueDate) — projeta só as ocorrências seguintes dentro do mês, senão
    // contaria a mesma cobrança duas vezes.
    const dayAfterNext = new Date(client.nextBillingDate);
    dayAfterNext.setDate(dayAfterNext.getDate() + 1);
    const projectFrom = dayAfterNext < monthStart ? monthStart : dayAfterNext;
    if (projectFrom >= nextMonthStart) continue;
    const futureDates = projectBillingDates(rule, projectFrom, monthEnd);
    for (const date of futureDates) addToDay(date, "expected", client.contractValue);
  }

  const dailyBillingRows = Array.from(dailyBilling.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([day, amounts]) => ({
      day,
      date: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day),
      ...amounts,
      total: amounts.received + amounts.expected,
    }));
  const monthBillingTotal = dailyBillingRows.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <Header title="Dashboard" subtitle="Bem-vindo ao NovaRota — visão geral do seu negócio" />
      <div className="p-6 space-y-6">
        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard?month=${monthParamStr(new Date(Date.UTC(selectedMonth.getUTCFullYear(), selectedMonth.getUTCMonth() - 1, 1)))}`}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 min-w-[9rem] text-center capitalize">
            {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(selectedMonth)}
          </span>
          <Link
            href={`/dashboard?month=${monthParamStr(new Date(Date.UTC(selectedMonth.getUTCFullYear(), selectedMonth.getUTCMonth() + 1, 1)))}`}
            className="h-8 w-8 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          {!isCurrentMonth && (
            <Link href="/dashboard" className="text-xs text-orange-600 dark:text-orange-400 hover:underline ml-1">
              Voltar para o mês atual
            </Link>
          )}
        </div>

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

        {/* Faturamento dia a dia — recebido + previsto, útil pra quem tem cobrança semanal */}
        {dailyBillingRows.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Faturamento do Mês — Dia a Dia</CardTitle>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(monthBillingTotal)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recebido (já pago) e previsto (vencimento programado, inclusive cobranças semanais futuras), dia a dia ao longo do mês
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {dailyBillingRows.map((row) => (
                <div key={row.day} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-28 capitalize">
                    {formatDate(row.date, { weekday: "short", day: "2-digit", month: "2-digit", year: undefined })}
                  </span>
                  <div className="flex items-center gap-3 text-xs flex-1 justify-end mr-3">
                    {row.received > 0 && (
                      <span className="text-green-600 dark:text-green-400 font-medium">Recebido {formatCurrency(row.received)}</span>
                    )}
                    {row.expected > 0 && (
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">Previsto {formatCurrency(row.expected)}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(row.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

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

        {/* Content Calendar — posts/stories aprovados no quadro de Tarefas */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Calendário de Conteúdo</CardTitle>
              <Link href="/tarefas" className="text-xs text-orange-600 dark:text-orange-400 hover:underline">Ver quadro de tarefas</Link>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Posts e stories aprovados, de todos os clientes, agendados para este mês</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {contentCalendarTasks.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum post ou story aprovado agendado para este mês ainda.</p>
            ) : (
              contentCalendarTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tarefas?cliente=${task.client.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {task.dueDate ? formatDate(task.dueDate) : "—"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {task.client.company || task.client.name} · {taskTypeLabel[task.type]}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

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
