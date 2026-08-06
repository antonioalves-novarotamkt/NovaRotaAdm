import Link from "next/link";
import { ShoppingCart, DollarSign, Wallet, TrendingDown, Hash } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { NewSaleDialog } from "@/components/vendas/NewSaleDialog";
import { EditSaleDialog } from "@/components/vendas/EditSaleDialog";
import { DeleteSaleButton } from "@/components/vendas/DeleteSaleButton";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const currentMonth = new Date().toISOString().slice(0, 7);

export default async function VendasPage({
  searchParams,
}: {
  searchParams: { cliente?: string; mes?: string };
}) {
  const selectedClientId = searchParams.cliente || "";
  const selectedMonth = searchParams.mes || currentMonth;
  const monthDate = new Date(`${selectedMonth}-01T00:00:00.000Z`);

  const [sales, clients] = await Promise.all([
    prisma.clientSale.findMany({
      where: {
        month: monthDate,
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
      },
      include: { client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
  ]);

  const totalGross = sales.reduce((s, sale) => s + sale.grossValue, 0);
  const totalNet = sales.reduce((s, sale) => s + (sale.netValue ?? 0), 0);
  const salesWithNet = sales.filter((s) => s.netValue != null);
  const totalLoss = salesWithNet.reduce((s, sale) => s + (sale.grossValue - (sale.netValue as number)), 0);
  const totalCount = sales.reduce((s, sale) => s + sale.salesCount, 0);
  const avgTicket = totalCount > 0 ? totalGross / totalCount : 0;

  const byClient = new Map<
    string,
    { name: string; grossValue: number; netValue: number; hasNet: boolean; salesCount: number }
  >();
  for (const sale of sales) {
    const key = sale.clientId;
    const entry = byClient.get(key) || {
      name: sale.client.company || sale.client.name,
      grossValue: 0,
      netValue: 0,
      hasNet: false,
      salesCount: 0,
    };
    entry.grossValue += sale.grossValue;
    if (sale.netValue != null) {
      entry.netValue += sale.netValue;
      entry.hasNet = true;
    }
    entry.salesCount += sale.salesCount;
    byClient.set(key, entry);
  }
  const clientSummaries = Array.from(byClient.entries()).sort((a, b) => b[1].grossValue - a[1].grossValue);

  return (
    <div>
      <Header title="Vendas App Clientes" subtitle="Vendas mensais de cada cliente pelos apps que administramos (iFood, Keeta, 99, app próprio) — não é o faturamento da agência" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <form className="flex items-center gap-2" method="get">
            <select
              name="cliente"
              defaultValue={selectedClientId}
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
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
              className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm"
            />
            <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50">
              Filtrar
            </button>
          </form>
          <NewSaleDialog clients={clients} defaultClientId={selectedClientId} defaultMonth={selectedMonth} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Total Bruto de Vendas</p>
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalGross)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Ganho Líquido</p>
                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(totalNet)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Perdas (taxas/promoções/entrega)</p>
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalLoss)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Número de Vendas</p>
                <div className="h-8 w-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Hash className="h-4 w-4 text-orange-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{totalCount.toLocaleString("pt-BR")}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Ticket Médio</p>
                <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(avgTicket)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Per-client summary */}
        {clientSummaries.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bruto</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Líquido</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Perdas</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nº Vendas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientSummaries.map(([clientId, summary]) => (
                      <tr key={clientId} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          <Link href={`/clientes/${clientId}`} className="hover:text-orange-600">
                            {summary.name}
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-900">{formatCurrency(summary.grossValue)}</td>
                        <td className="px-6 py-3 text-right text-gray-600">
                          {summary.hasNet ? formatCurrency(summary.netValue) : "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-red-600">
                          {summary.hasNet ? formatCurrency(summary.grossValue - summary.netValue) : "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-gray-600">{summary.salesCount.toLocaleString("pt-BR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries list */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {sales.length === 0 ? (
              <p className="p-10 text-center text-sm text-gray-500 flex flex-col items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-gray-300" />
                Nenhuma venda registrada para este período.
              </p>
            ) : (
              <div className="divide-y">
                {sales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.client.company || sale.client.name}</p>
                      <p className="text-xs text-gray-500">{sale.platform || "Todos os apps"}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Bruto</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(sale.grossValue)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Líquido</p>
                        <p className="text-sm font-bold text-gray-900">
                          {sale.netValue != null ? formatCurrency(sale.netValue) : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Vendas</p>
                        <p className="text-sm font-bold text-gray-900">{sale.salesCount}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <EditSaleDialog
                          sale={{
                            id: sale.id,
                            clientName: sale.client.company || sale.client.name,
                            platform: sale.platform,
                            grossValue: sale.grossValue,
                            netValue: sale.netValue,
                            salesCount: sale.salesCount,
                          }}
                        />
                        <DeleteSaleButton saleId={sale.id} />
                      </div>
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
