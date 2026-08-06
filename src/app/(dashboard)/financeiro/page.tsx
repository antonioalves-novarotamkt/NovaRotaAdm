import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterPaymentButton } from "@/components/financeiro/RegisterPaymentButton";
import { SendRemindersButton } from "@/components/financeiro/SendRemindersButton";
import { RevenueChart } from "@/components/financeiro/RevenueChart";
import { formatCurrency, formatDate } from "@/lib/utils";
import { countOccurrencesInMonth } from "@/lib/billing";
import { prisma } from "@/lib/prisma";

const frequencyLabel: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

export const dynamic = "force-dynamic";

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const PROJECTION_MONTHS_AHEAD = 6;
const MAX_CHART_MONTHS = 36;

export default async function FinanceiroPage() {
  const [invoices, scheduledClients, earliestContract, projectableClients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      where: { billingFrequency: { not: "NONE" }, nextBillingDate: { not: null } },
      orderBy: { nextBillingDate: "asc" },
    }),
    prisma.contract.findFirst({
      orderBy: { startDate: "asc" },
      select: { startDate: true },
    }),
    prisma.client.findMany({
      where: { status: "ACTIVE", billingFrequency: { not: "NONE" }, contractValue: { not: null } },
      select: {
        contractValue: true,
        billingFrequency: true,
        billingDayOfWeek: true,
        billingDayOfMonth1: true,
        billingDayOfMonth2: true,
      },
    }),
  ]);

  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const pending = invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
  const total = invoices.reduce((s, i) => s + i.total, 0);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const rawStart = earliestContract?.startDate
    ? new Date(earliestContract.startDate.getFullYear(), earliestContract.startDate.getMonth(), 1)
    : currentMonthStart;
  const endMonth = new Date(now.getFullYear(), now.getMonth() + PROJECTION_MONTHS_AHEAD, 1);

  let monthsCount = (endMonth.getFullYear() - rawStart.getFullYear()) * 12 + (endMonth.getMonth() - rawStart.getMonth()) + 1;
  monthsCount = Math.min(monthsCount, MAX_CHART_MONTHS);
  const startMonth = new Date(endMonth.getFullYear(), endMonth.getMonth() - monthsCount + 1, 1);
  const spansMultipleYears = startMonth.getFullYear() !== endMonth.getFullYear();

  const chartData = Array.from({ length: monthsCount }).map((_, idx) => {
    const d = new Date(startMonth.getFullYear(), startMonth.getMonth() + idx, 1);
    const label = monthLabels[d.getMonth()] + (spansMultipleYears ? `/${String(d.getFullYear()).slice(2)}` : "");
    const isFuture = d.getTime() > currentMonthStart.getTime();

    if (!isFuture) {
      const receita = invoices
        .filter((i) => i.status === "PAID" && i.paidAt && i.paidAt.getFullYear() === d.getFullYear() && i.paidAt.getMonth() === d.getMonth())
        .reduce((s, i) => s + i.total, 0);
      return { month: label, receita, projetado: null };
    }

    const projetado = projectableClients.reduce((sum, c) => {
      const occurrences = countOccurrencesInMonth(
        {
          frequency: c.billingFrequency,
          dayOfWeek: c.billingDayOfWeek,
          dayOfMonth1: c.billingDayOfMonth1,
          dayOfMonth2: c.billingDayOfMonth2,
        },
        d.getFullYear(),
        d.getMonth()
      );
      return sum + occurrences * (c.contractValue || 0);
    }, 0);
    return { month: label, receita: null, projetado };
  });

  return (
    <div>
      <Header title="Financeiro" subtitle="Gerencie faturamento, cobranças e relatórios financeiros" />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Lembretes automáticos são enviados 1x/dia: aviso de vencimento próximo e cobrança de faturas em atraso.
          </p>
          <SendRemindersButton />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Faturamento Total</p>
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.length} recebimento(s)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Recebido</p>
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(paid)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "PAID").length} recebido(s)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">A Receber</p>
                <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pending)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "PENDING").length} programado(s)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Em Atraso</p>
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(overdue)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "OVERDUE").length} atrasado(s)</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Receita: Histórico e Previsão</CardTitle>
            <p className="text-xs text-gray-500">
              Desde o início do primeiro contrato até {PROJECTION_MONTHS_AHEAD} meses à frente — recebido (real) e previsto (com base na recorrência de cada cliente ativo)
            </p>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        {/* Scheduled Payments */}
        {scheduledClients.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Recebimentos Programados</CardTitle>
              <p className="text-xs text-gray-500">Previsão com base na frequência configurada em cada cliente</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {scheduledClients.map((client) => {
                const overdue = client.nextBillingDate && client.nextBillingDate < new Date();
                return (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div>
                      <Link href={`/clientes/${client.id}`} className="text-sm font-medium text-gray-900 hover:text-orange-600">
                        {client.company || client.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {frequencyLabel[client.billingFrequency]} · vence {client.nextBillingDate && formatDate(client.nextBillingDate)}
                        {overdue && <span className="text-red-500 font-medium"> · atrasado</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900">
                        {client.contractValue ? formatCurrency(client.contractValue) : "—"}
                      </span>
                      <RegisterPaymentButton clientId={client.id} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
