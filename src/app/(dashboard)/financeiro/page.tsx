import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Receipt } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RegisterPaymentButton } from "@/components/financeiro/RegisterPaymentButton";
import { SendRemindersButton } from "@/components/financeiro/SendRemindersButton";
import { RevenueChart } from "@/components/financeiro/RevenueChart";
import { NewExtraChargeDialog } from "@/components/financeiro/NewExtraChargeDialog";
import { DeleteExtraChargeButton } from "@/components/financeiro/DeleteExtraChargeButton";
import { MarkExtraChargePaidButton } from "@/components/financeiro/MarkExtraChargePaidButton";
import { EditPaidDateButton } from "@/components/financeiro/EditPaidDateButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { countOccurrencesInMonth } from "@/lib/billing";
import { syncInvoiceStatuses } from "@/lib/scheduled-invoices";
import { prisma } from "@/lib/prisma";

const frequencyLabel: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

export const dynamic = "force-dynamic";

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const MONTHS_BACK = 2;
const MONTHS_AHEAD = 2;

export default async function FinanceiroPage() {
  await syncInvoiceStatuses();

  const [invoices, clients, scheduledClients, projectableClients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    prisma.client.findMany({
      where: { billingFrequency: { not: "NONE" }, nextBillingDate: { not: null } },
      orderBy: { nextBillingDate: "asc" },
    }),
    prisma.client.findMany({
      where: { status: { notIn: ["CHURNED", "INACTIVE"] }, billingFrequency: { not: "NONE" }, contractValue: { not: null } },
      select: {
        contractValue: true,
        billingFrequency: true,
        billingDayOfWeek: true,
        billingDayOfMonth1: true,
        billingDayOfMonth2: true,
      },
    }),
  ]);

  const extraCharges = invoices.filter((i) => i.description !== "Recebimento programado");
  const recentlyPaid = invoices
    .filter((i) => i.status === "PAID" && i.paidAt)
    .sort((a, b) => (b.paidAt as Date).getTime() - (a.paidAt as Date).getTime())
    .slice(0, 15);

  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const pending = invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
  const total = invoices.reduce((s, i) => s + i.total, 0);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const startMonth = new Date(now.getFullYear(), now.getMonth() - MONTHS_BACK, 1);
  const endMonth = new Date(now.getFullYear(), now.getMonth() + MONTHS_AHEAD, 1);
  const monthsCount = MONTHS_BACK + MONTHS_AHEAD + 1;
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
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Lembretes automáticos são enviados 1x/dia: aviso de vencimento próximo e cobrança de faturas em atraso.
          </p>
          <SendRemindersButton />
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Faturamento Total</p>
                <div className="h-8 w-8 rounded-lg bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(total)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{invoices.length} recebimento(s)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Recebido</p>
                <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(paid)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{invoices.filter((i) => i.status === "PAID").length} recebido(s)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">A Receber</p>
                <div className="h-8 w-8 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pending)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{invoices.filter((i) => i.status === "PENDING").length} programado(s)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Em Atraso</p>
                <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500 dark:text-red-400">{formatCurrency(overdue)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{invoices.filter((i) => i.status === "OVERDUE").length} atrasado(s)</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Receita: Histórico e Previsão</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {MONTHS_BACK} meses atrás até {MONTHS_AHEAD} meses à frente — recebido (real) e previsto (com base na recorrência de cada cliente ativo)
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
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Recebimentos Programados</CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">Previsão com base na frequência configurada em cada cliente</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {scheduledClients.map((client) => {
                const overdue = client.nextBillingDate && client.nextBillingDate < new Date();
                return (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div>
                      <Link href={`/clientes/${client.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600">
                        {client.company || client.name}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {frequencyLabel[client.billingFrequency]} · vence {client.nextBillingDate && formatDate(client.nextBillingDate)}
                        {overdue && <span className="text-red-500 dark:text-red-400 font-medium"> · atrasado</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
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

        {/* Other manual charges */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Outros Recebimentos</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">Custos extras do cliente lançados na mão, com a data em que o valor foi recebido</p>
              </div>
              <NewExtraChargeDialog clients={clients} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {extraCharges.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum recebimento extra lançado ainda.</p>
            ) : (
              extraCharges.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div>
                    <Link href={`/clientes/${invoice.client.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600">
                      {invoice.client.company || invoice.client.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.description}
                      {" · "}
                      {invoice.status === "PAID" && invoice.paidAt
                        ? `recebido em ${formatDate(invoice.paidAt)}`
                        : `${invoice.status === "OVERDUE" ? "atrasado" : "pendente"} · vence em ${formatDate(invoice.dueDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</span>
                    {invoice.status !== "PAID" && <MarkExtraChargePaidButton id={invoice.id} />}
                    {invoice.status === "PAID" && invoice.paidAt && (
                      <>
                        <EditPaidDateButton id={invoice.id} currentDate={invoice.paidAt.toISOString().slice(0, 10)} />
                        <Link href={`/recibo/${invoice.id}`}>
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                            <Receipt className="h-3.5 w-3.5" />
                            Recibo
                          </Button>
                        </Link>
                      </>
                    )}
                    <DeleteExtraChargeButton id={invoice.id} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Payment history — correct the date of anything already given baixa */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Histórico de Recebimentos</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">Últimos recebimentos confirmados — corrija a data se precisar</p>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentlyPaid.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum recebimento confirmado ainda.</p>
            ) : (
              recentlyPaid.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div>
                    <Link href={`/clientes/${invoice.client.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600">
                      {invoice.client.company || invoice.client.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.description || "Recebimento"}
                      {" · recebido em "}
                      {formatDate(invoice.paidAt as Date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</span>
                    <EditPaidDateButton id={invoice.id} currentDate={(invoice.paidAt as Date).toISOString().slice(0, 10)} />
                    <Link href={`/recibo/${invoice.id}`}>
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                        <Receipt className="h-3.5 w-3.5" />
                        Recibo
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
