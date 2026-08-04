import Link from "next/link";
import { Search, Download, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RevenueChart } from "@/components/financeiro/RevenueChart";
import { NewInvoiceDialog } from "@/components/financeiro/NewInvoiceDialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "gray" }> = {
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  OVERDUE: { label: "Atrasado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "gray" },
  CANCELLED: { label: "Cancelado", variant: "gray" },
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function FinanceiroPage() {
  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { issueDate: "desc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
  ]);

  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const pending = invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
  const total = invoices.reduce((s, i) => s + i.total, 0);

  const now = new Date();
  const chartData = Array.from({ length: 6 }).map((_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const receita = invoices
      .filter((i) => i.status === "PAID" && i.paidAt && i.paidAt.getFullYear() === d.getFullYear() && i.paidAt.getMonth() === d.getMonth())
      .reduce((s, i) => s + i.total, 0);
    return { month: monthLabels[d.getMonth()], receita };
  });

  return (
    <div>
      <Header title="Financeiro" subtitle="Gerencie faturamento, cobranças e relatórios financeiros" />
      <div className="p-6 space-y-6">
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
              <p className="text-xs text-gray-400 mt-1">{invoices.length} fatura(s)</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Recebido</p>
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(paid)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "PAID").length} faturas pagas</p>
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
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "PENDING").length} faturas pendentes</p>
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
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "OVERDUE").length} faturas vencidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Receita Recebida (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart data={chartData} />
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Faturas</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar fatura..." className="pl-9 h-8 text-xs bg-gray-50 border-gray-200" />
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </Button>
                <NewInvoiceDialog clients={clients} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <p className="p-10 text-center text-sm text-gray-500">Nenhuma fatura cadastrada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Emissão</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimento</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice, idx) => {
                      const status = statusMap[invoice.status];
                      return (
                        <tr key={invoice.id} className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                          <td className="px-6 py-4 font-medium text-gray-900">{invoice.number}</td>
                          <td className="px-6 py-4 text-gray-600">{invoice.client.company || invoice.client.name}</td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(invoice.issueDate)}</td>
                          <td className="px-6 py-4 text-gray-500">{formatDate(invoice.dueDate)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(invoice.total)}</td>
                          <td className="px-6 py-4 text-center">
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href={`/clientes/${invoice.client.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-7">
                                Ver
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
