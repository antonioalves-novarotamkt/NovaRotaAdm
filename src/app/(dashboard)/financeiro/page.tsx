import Link from "next/link";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Receipt, X } from "lucide-react";
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
import { ClientStatementActions } from "@/components/financeiro/ClientStatementActions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { countOccurrencesInMonth, projectBillingDates } from "@/lib/billing";
import { syncInvoiceStatuses } from "@/lib/scheduled-invoices";
import { paidAmount, remainingAmount, receivedAmount } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import type { Invoice, Payment } from "@prisma/client";

type InvoiceWithPayments = Invoice & { payments: Payment[] };

const invoiceStatusStyle: Record<string, string> = {
  PAID: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  PARTIALLY_PAID: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  PENDING: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  OVERDUE: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
  DRAFT: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
  CANCELLED: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

const invoiceStatusLabel: Record<string, string> = {
  PAID: "Pago",
  PARTIALLY_PAID: "Parcial",
  PENDING: "Pendente",
  OVERDUE: "Atrasado",
  DRAFT: "Rascunho",
  CANCELLED: "Cancelado",
};

const monthLabelsFull = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function groupInvoicesByMonth(invoicesList: InvoiceWithPayments[]): { key: string; label: string; invoices: InvoiceWithPayments[] }[] {
  const groups = new Map<string, InvoiceWithPayments[]>();
  for (const inv of invoicesList) {
    const key = `${inv.dueDate.getFullYear()}-${String(inv.dueDate.getMonth() + 1).padStart(2, "0")}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(inv);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, invs]) => {
      const [year, month] = key.split("-").map(Number);
      return { key, label: `${monthLabelsFull[month - 1]} de ${year}`, invoices: invs };
    });
}

// Mensagem pro cliente só traz o que ainda está em aberto (atrasado,
// parcialmente pago ou pendente) — o que já foi pago não entra, pra não
// poluir a cobrança com histórico que não é mais acionável pro cliente.
function buildClientStatement(client: { name: string; company: string | null }, clientInvoices: InvoiceWithPayments[]): string {
  const overdueInvoices = clientInvoices.filter((i) => i.status === "OVERDUE");
  const pendingInvoices = clientInvoices.filter((i) => i.status === "PENDING");
  const partialInvoices = clientInvoices.filter((i) => i.status === "PARTIALLY_PAID");

  const lines: string[] = [`Resumo financeiro — ${client.company || client.name}`, ""];

  if (overdueInvoices.length > 0) {
    const total = overdueInvoices.reduce((s, i) => s + i.total, 0);
    lines.push(`EM ATRASO (${overdueInvoices.length}) — ${formatCurrency(total)}`);
    for (const inv of overdueInvoices) lines.push(`- ${inv.number} · ${formatCurrency(inv.total)} · venceu em ${formatDate(inv.dueDate)}`);
    lines.push("");
  }
  if (partialInvoices.length > 0) {
    const totalRemaining = partialInvoices.reduce((s, i) => s + remainingAmount(i), 0);
    lines.push(`PARCIALMENTE PAGO (${partialInvoices.length}) — falta ${formatCurrency(totalRemaining)}`);
    for (const inv of partialInvoices) {
      lines.push(
        `- ${inv.number} · recebido ${formatCurrency(paidAmount(inv))} de ${formatCurrency(inv.total)} · falta ${formatCurrency(remainingAmount(inv))}`
      );
    }
    lines.push("");
  }
  if (pendingInvoices.length > 0) {
    const total = pendingInvoices.reduce((s, i) => s + i.total, 0);
    lines.push(`PENDENTE (${pendingInvoices.length}) — ${formatCurrency(total)}`);
    for (const inv of pendingInvoices) lines.push(`- ${inv.number} · ${formatCurrency(inv.total)} · vence em ${formatDate(inv.dueDate)}`);
    lines.push("");
  }
  if (overdueInvoices.length === 0 && partialInvoices.length === 0 && pendingInvoices.length === 0) {
    lines.push("Nenhum valor em aberto no momento.");
  }
  return lines.join("\n").trimEnd();
}

const frequencyLabel: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

export const dynamic = "force-dynamic";

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const MONTHS_BACK = 2;
const MONTHS_AHEAD = 2;

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: { client?: string };
}) {
  try {
    await syncInvoiceStatuses();
  } catch (error) {
    console.error("syncInvoiceStatuses falhou no Financeiro:", error);
  }

  const selectedClientId = searchParams.client || "";

  const [invoices, clients, scheduledClients, projectableClients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { client: true, payments: true },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true, phone: true, logoUrl: true },
    }),
    prisma.client.findMany({
      where: { billingFrequency: { not: "NONE" }, nextBillingDate: { not: null } },
      orderBy: { nextBillingDate: "asc" },
    }),
    prisma.client.findMany({
      where: { status: { notIn: ["CHURNED", "INACTIVE"] }, billingFrequency: { not: "NONE" }, contractValue: { not: null } },
      select: {
        id: true,
        name: true,
        company: true,
        contractValue: true,
        billingFrequency: true,
        billingDayOfWeek: true,
        billingDayOfMonth1: true,
        billingDayOfMonth2: true,
      },
    }),
  ]);

  const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) || null : null;
  const selectedClientInvoices = selectedClient ? invoices.filter((i) => i.clientId === selectedClient.id) : [];
  const clientStatementText = selectedClient ? buildClientStatement(selectedClient, selectedClientInvoices) : "";

  const extraCharges = invoices.filter((i) => i.description !== "Recebimento programado");
  const recentlyPaid = invoices
    .filter((i) => i.status === "PAID" && i.paidAt)
    .sort((a, b) => (b.paidAt as Date).getTime() - (a.paidAt as Date).getTime())
    .slice(0, 15);

  // "Recebido" conta o valor de baixas parciais mesmo antes da fatura fechar;
  // "A Receber" soma o saldo que ainda falta das parciais junto com as pendentes.
  const paid = invoices.reduce((s, i) => s + receivedAmount(i), 0);
  const pending =
    invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0) +
    invoices.filter((i) => i.status === "PARTIALLY_PAID").reduce((s, i) => s + remainingAmount(i), 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
  const total = invoices.reduce((s, i) => s + i.total, 0);

  const now = new Date();
  // dueDate/nextBillingDate ficam salvos como meia-noite UTC do dia — usa o
  // mesmo corte pra decidir "atrasado" aqui, senão uma fatura que vence hoje
  // aparece como atrasada assim que passa da meia-noite.
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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

  // Matriz cliente x mes — mesma janela de tempo do grafico, pra ver rapido o
  // que cada cliente pagou/deve em cada mes sem precisar filtrar um por um.
  const matrixMonths = Array.from({ length: monthsCount }).map((_, idx) => new Date(startMonth.getFullYear(), startMonth.getMonth() + idx, 1));
  const matrixClientIds = Array.from(
    new Set(
      invoices
        .filter((i) => matrixMonths.some((m) => i.dueDate.getFullYear() === m.getFullYear() && i.dueDate.getMonth() === m.getMonth()))
        .map((i) => i.clientId)
    )
  );
  const matrixClients = matrixClientIds
    .map((id) => invoices.find((i) => i.clientId === id)!.client)
    .sort((a, b) => (a.company || a.name).localeCompare(b.company || b.name));

  function matrixCell(clientId: string, month: Date) {
    const cellInvoices = invoices.filter(
      (i) => i.clientId === clientId && i.dueDate.getFullYear() === month.getFullYear() && i.dueDate.getMonth() === month.getMonth()
    );
    if (cellInvoices.length === 0) return null;
    const cellTotal = cellInvoices.reduce((s, i) => s + i.total, 0);
    const status = cellInvoices.some((i) => i.status === "OVERDUE")
      ? "OVERDUE"
      : cellInvoices.some((i) => i.status === "PENDING")
        ? "PENDING"
        : cellInvoices.some((i) => i.status === "PARTIALLY_PAID")
          ? "PARTIALLY_PAID"
          : "PAID";
    return { total: cellTotal, status };
  }

  // Previsão dos próximos 2 meses (a partir do mês que vem) — semanais
  // detalhados semana a semana, mensais/quinzenais detalhados mês a mês, pra
  // dar visibilidade de fluxo de caixa sem misturar tudo num número só.
  const forecastRangeStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const forecastRangeEnd = new Date(now.getFullYear(), now.getMonth() + 3, 0);
  const forecastMonths = [
    new Date(now.getFullYear(), now.getMonth() + 1, 1),
    new Date(now.getFullYear(), now.getMonth() + 2, 1),
  ];
  const forecastSpansYears = forecastMonths[0].getFullYear() !== forecastMonths[1].getFullYear();

  function billingRule(c: (typeof projectableClients)[number]) {
    return {
      frequency: c.billingFrequency,
      dayOfWeek: c.billingDayOfWeek,
      dayOfMonth1: c.billingDayOfMonth1,
      dayOfMonth2: c.billingDayOfMonth2,
    };
  }

  function startOfWeek(d: Date): Date {
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const day = date.getDay();
    date.setDate(date.getDate() + (day === 0 ? -6 : 1 - day));
    return date;
  }

  function shortDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  }

  const weeklyForecastClients = projectableClients
    .filter((c) => c.billingFrequency === "WEEKLY")
    .map((c) => ({ client: c, dates: projectBillingDates(billingRule(c), forecastRangeStart, forecastRangeEnd) }))
    .filter((entry) => entry.dates.length > 0);

  const weekStarts = Array.from(
    new Set(weeklyForecastClients.flatMap((entry) => entry.dates.map((d) => startOfWeek(d).getTime())))
  )
    .sort((a, b) => a - b)
    .map((t) => new Date(t));

  function weeklyForecastCell(entry: (typeof weeklyForecastClients)[number], weekStart: Date) {
    const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
    const count = entry.dates.filter((d) => d >= weekStart && d <= weekEnd).length;
    return count * (entry.client.contractValue || 0);
  }

  const weeklyForecastTotalsByWeek = weekStarts.map((weekStart) =>
    weeklyForecastClients.reduce((sum, entry) => sum + weeklyForecastCell(entry, weekStart), 0)
  );

  const monthlyForecastClients = projectableClients
    .filter((c) => c.billingFrequency === "MONTHLY" || c.billingFrequency === "BIWEEKLY")
    .map((c) => ({ client: c, dates: projectBillingDates(billingRule(c), forecastRangeStart, forecastRangeEnd) }))
    .filter((entry) => entry.dates.length > 0);

  function monthlyForecastCell(entry: (typeof monthlyForecastClients)[number], month: Date) {
    const count = entry.dates.filter((d) => d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()).length;
    return count * (entry.client.contractValue || 0);
  }

  const monthlyForecastTotalsByMonth = forecastMonths.map((month) =>
    monthlyForecastClients.reduce((sum, entry) => sum + monthlyForecastCell(entry, month), 0)
  );

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

        {/* Client filter */}
        <form method="get" className="flex flex-col sm:flex-row sm:items-center gap-2">
          <select
            name="client"
            defaultValue={selectedClientId}
            className="h-9 w-full sm:w-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
          >
            <option value="">Ver todos os clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap">
              Ver pagamentos do cliente
            </button>
            {selectedClient && (
              <Link
                href="/financeiro"
                className="h-9 px-3 flex items-center gap-1.5 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap"
              >
                <X className="h-3.5 w-3.5" />
                Limpar filtro
              </Link>
            )}
          </div>
        </form>

        {selectedClient && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {selectedClient.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedClient.logoUrl} alt={selectedClient.name} className="h-10 w-10 rounded-full object-cover border border-gray-100 dark:border-gray-800" />
                  ) : null}
                  <div>
                    <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      {selectedClient.company || selectedClient.name}
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Histórico completo aqui na tela — a mensagem pra copiar/enviar traz só o que está em atraso ou pendente</p>
                  </div>
                </div>
                <ClientStatementActions text={clientStatementText} phone={selectedClient.phone} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(() => {
                  const paidTotal = selectedClientInvoices.reduce((s, i) => s + receivedAmount(i), 0);
                  const overdueTotal = selectedClientInvoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
                  const pendingTotal =
                    selectedClientInvoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0) +
                    selectedClientInvoices.filter((i) => i.status === "PARTIALLY_PAID").reduce((s, i) => s + remainingAmount(i), 0);
                  return (
                    <>
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-500/10">
                        <p className="text-xs text-green-700 dark:text-green-400">Pago</p>
                        <p className="text-lg font-bold text-green-700 dark:text-green-400 truncate">{formatCurrency(paidTotal)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-500/10">
                        <p className="text-xs text-yellow-700 dark:text-yellow-400">Pendente</p>
                        <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400 truncate">{formatCurrency(pendingTotal)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-red-50 dark:bg-red-500/10">
                        <p className="text-xs text-red-700 dark:text-red-400">Em atraso</p>
                        <p className="text-lg font-bold text-red-700 dark:text-red-400 truncate">{formatCurrency(overdueTotal)}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-4">
                {selectedClientInvoices.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum recebimento registrado para esse cliente ainda.</p>
                ) : (
                  groupInvoicesByMonth(selectedClientInvoices).map((group) => (
                    <div key={group.key}>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 capitalize">{group.label}</p>
                      <div className="space-y-2">
                        {group.invoices.map((invoice) => (
                          <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.number}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {invoice.description || "Recebimento"}
                                {" · "}
                                {invoice.status === "PAID" && invoice.paidAt
                                  ? `pago em ${formatDate(invoice.paidAt)}`
                                  : invoice.status === "PARTIALLY_PAID"
                                    ? `recebido ${formatCurrency(paidAmount(invoice))} · falta ${formatCurrency(remainingAmount(invoice))}`
                                    : invoice.status === "OVERDUE"
                                      ? `venceu em ${formatDate(invoice.dueDate)}`
                                      : `vence em ${formatDate(invoice.dueDate)}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</span>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${invoiceStatusStyle[invoice.status]}`}>
                                {invoiceStatusLabel[invoice.status]}
                              </span>
                              {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && invoice.status !== "DRAFT" && (
                                <MarkExtraChargePaidButton id={invoice.id} remaining={remainingAmount(invoice)} alreadyPaid={paidAmount(invoice)} />
                              )}
                              {invoice.status === "PAID" && (
                                <Link href={`/recibo/${invoice.id}`}>
                                  <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                                    <Receipt className="h-3.5 w-3.5" />
                                    Recibo
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedClient && (
        <>
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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {invoices.filter((i) => i.status === "PAID").length} recebido(s)
                {invoices.some((i) => i.status === "PARTIALLY_PAID") &&
                  ` · ${invoices.filter((i) => i.status === "PARTIALLY_PAID").length} parcial(is)`}
              </p>
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
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {invoices.filter((i) => i.status === "PENDING" || i.status === "PARTIALLY_PAID").length} programado(s)
              </p>
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

        {/* Forecast — próximos 2 meses, semanal por semana e mensal por mês */}
        {(weeklyForecastClients.length > 0 || monthlyForecastClients.length > 0) && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Previsão de Recebimentos — Próximos 2 Meses</CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Com base na recorrência configurada em cada cliente ativo — semanal detalhado por semana, mensal e quinzenal detalhado por mês
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {weeklyForecastClients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Semanais</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3 sticky left-0 bg-white dark:bg-gray-900">Cliente</th>
                          {weekStarts.map((w) => (
                            <th key={w.getTime()} className="text-right font-medium text-gray-500 dark:text-gray-400 pb-2 px-2 whitespace-nowrap">
                              {shortDate(w)} a {shortDate(new Date(w.getFullYear(), w.getMonth(), w.getDate() + 6))}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyForecastClients.map((entry) => (
                          <tr key={entry.client.id} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="py-2 pr-3 sticky left-0 bg-white dark:bg-gray-900">
                              <Link href={`/financeiro?client=${entry.client.id}`} className="text-gray-900 dark:text-gray-100 font-medium hover:text-orange-600 dark:hover:text-orange-400 hover:underline whitespace-nowrap">
                                {entry.client.company || entry.client.name}
                              </Link>
                            </td>
                            {weekStarts.map((w) => {
                              const value = weeklyForecastCell(entry, w);
                              return (
                                <td key={w.getTime()} className="py-2 px-2 text-right whitespace-nowrap">
                                  {value > 0 ? formatCurrency(value) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200 dark:border-gray-700 font-semibold">
                          <td className="py-2 pr-3 sticky left-0 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">Total</td>
                          {weeklyForecastTotalsByWeek.map((total, idx) => (
                            <td key={weekStarts[idx].getTime()} className="py-2 px-2 text-right whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {formatCurrency(total)}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {monthlyForecastClients.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Mensais e Quinzenais</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          <th className="text-left font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3 sticky left-0 bg-white dark:bg-gray-900">Cliente</th>
                          {forecastMonths.map((m) => (
                            <th key={m.getTime()} className="text-right font-medium text-gray-500 dark:text-gray-400 pb-2 px-2 whitespace-nowrap capitalize">
                              {monthLabelsFull[m.getMonth()]}
                              {forecastSpansYears ? ` de ${m.getFullYear()}` : ""}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyForecastClients.map((entry) => (
                          <tr key={entry.client.id} className="border-t border-gray-100 dark:border-gray-800">
                            <td className="py-2 pr-3 sticky left-0 bg-white dark:bg-gray-900">
                              <Link href={`/financeiro?client=${entry.client.id}`} className="text-gray-900 dark:text-gray-100 font-medium hover:text-orange-600 dark:hover:text-orange-400 hover:underline whitespace-nowrap">
                                {entry.client.company || entry.client.name}
                              </Link>
                              <span className="text-gray-400 dark:text-gray-500 font-normal text-xs"> · {frequencyLabel[entry.client.billingFrequency]}</span>
                            </td>
                            {forecastMonths.map((m) => {
                              const value = monthlyForecastCell(entry, m);
                              return (
                                <td key={m.getTime()} className="py-2 px-2 text-right whitespace-nowrap">
                                  {value > 0 ? formatCurrency(value) : <span className="text-gray-300 dark:text-gray-700">—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-gray-200 dark:border-gray-700 font-semibold">
                          <td className="py-2 pr-3 sticky left-0 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">Total</td>
                          {monthlyForecastTotalsByMonth.map((total, idx) => (
                            <td key={forecastMonths[idx].getTime()} className="py-2 px-2 text-right whitespace-nowrap text-gray-900 dark:text-gray-100">
                              {formatCurrency(total)}
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Client x Month matrix */}
        {matrixClients.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Recebimentos por Cliente e Mês</CardTitle>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clique em um cliente para ver o extrato completo</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left font-medium text-gray-500 dark:text-gray-400 pb-2 pr-3 sticky left-0 bg-white dark:bg-gray-900">Cliente</th>
                      {matrixMonths.map((m) => (
                        <th key={m.getTime()} className="text-right font-medium text-gray-500 dark:text-gray-400 pb-2 px-2 whitespace-nowrap capitalize">
                          {monthLabels[m.getMonth()]}
                          {spansMultipleYears ? `/${String(m.getFullYear()).slice(2)}` : ""}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixClients.map((client) => (
                      <tr key={client.id} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="py-2 pr-3 sticky left-0 bg-white dark:bg-gray-900">
                          <Link href={`/financeiro?client=${client.id}`} className="text-gray-900 dark:text-gray-100 font-medium hover:text-orange-600 dark:hover:text-orange-400 hover:underline whitespace-nowrap">
                            {client.company || client.name}
                          </Link>
                        </td>
                        {matrixMonths.map((m) => {
                          const cell = matrixCell(client.id, m);
                          return (
                            <td key={m.getTime()} className="py-2 px-2 text-right whitespace-nowrap">
                              {cell ? (
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${invoiceStatusStyle[cell.status]}`}>
                                  {formatCurrency(cell.total)}
                                </span>
                              ) : (
                                <span className="text-gray-300 dark:text-gray-700">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

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
                const overdue = client.nextBillingDate && client.nextBillingDate < startOfToday;
                const scheduledInvoice = invoices.find(
                  (i) =>
                    i.clientId === client.id &&
                    i.dueDate.getTime() === client.nextBillingDate?.getTime() &&
                    (i.status === "PENDING" || i.status === "OVERDUE" || i.status === "PARTIALLY_PAID")
                );
                const remaining = scheduledInvoice ? remainingAmount(scheduledInvoice) : client.contractValue || 0;
                const alreadyPaidAmount = scheduledInvoice ? paidAmount(scheduledInvoice) : 0;
                return (
                  <div key={client.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="min-w-0">
                      <Link href={`/clientes/${client.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600">
                        {client.company || client.name}
                      </Link>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {frequencyLabel[client.billingFrequency]} · vence {client.nextBillingDate && formatDate(client.nextBillingDate)}
                        {overdue && <span className="text-red-500 dark:text-red-400 font-medium"> · atrasado</span>}
                        {scheduledInvoice?.status === "PARTIALLY_PAID" && (
                          <span className="text-blue-500 dark:text-blue-400 font-medium"> · parcial, recebido {formatCurrency(alreadyPaidAmount)}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(remaining)}</span>
                      <RegisterPaymentButton clientId={client.id} remaining={remaining} alreadyPaid={alreadyPaidAmount} />
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
                <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0">
                    <Link href={`/clientes/${invoice.client.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600">
                      {invoice.client.company || invoice.client.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.description}
                      {" · "}
                      {invoice.status === "PAID" && invoice.paidAt
                        ? `recebido em ${formatDate(invoice.paidAt)}`
                        : invoice.status === "PARTIALLY_PAID"
                          ? `recebido ${formatCurrency(paidAmount(invoice))} · falta ${formatCurrency(remainingAmount(invoice))}`
                          : `${invoice.status === "OVERDUE" ? "atrasado" : "pendente"} · vence em ${formatDate(invoice.dueDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</span>
                    {invoice.status !== "PAID" && (
                      <MarkExtraChargePaidButton id={invoice.id} remaining={remainingAmount(invoice)} alreadyPaid={paidAmount(invoice)} />
                    )}
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
                <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                  <div className="min-w-0">
                    <Link href={`/clientes/${invoice.client.id}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600">
                      {invoice.client.company || invoice.client.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {invoice.description || "Recebimento"}
                      {" · recebido em "}
                      {formatDate(invoice.paidAt as Date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
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
        </>
        )}
      </div>
    </div>
  );
}
