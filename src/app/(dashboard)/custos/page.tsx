import { Wallet, DollarSign, PieChart } from "lucide-react";
import { CostCategory } from "@prisma/client";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { NewCostDialog } from "@/components/custos/NewCostDialog";
import { DeleteCostButton } from "@/components/custos/DeleteCostButton";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const currentMonth = new Date().toISOString().slice(0, 7);

const categoryLabel: Record<string, string> = {
  EMPLOYEE: "Funcionário",
  SOFTWARE: "Sistema / Software",
  INTERNET: "Internet",
  RENT: "Aluguel",
  MARKETING: "Marketing",
  OTHER: "Outros",
};

export default async function CustosPage({
  searchParams,
}: {
  searchParams: { mes?: string; categoria?: string };
}) {
  const selectedMonth = searchParams.mes || currentMonth;
  const selectedCategory = searchParams.categoria || "";
  const monthDate = new Date(`${selectedMonth}-01T00:00:00.000Z`);

  const costs = await prisma.operationalCost.findMany({
    where: {
      month: monthDate,
      ...(selectedCategory ? { category: selectedCategory as CostCategory } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const totalValue = costs.reduce((s, c) => s + c.amount, 0);

  const byCategory = new Map<string, number>();
  for (const cost of costs) {
    byCategory.set(cost.category, (byCategory.get(cost.category) || 0) + cost.amount);
  }
  const categorySummaries = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  const biggestCategory = categorySummaries[0];

  return (
    <div>
      <Header title="Custos Operacionais" subtitle="Controle de despesas da agência: funcionários, sistemas, internet e outros" />
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <form className="flex items-center gap-2" method="get">
            <select
              name="categoria"
              defaultValue={selectedCategory}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
            >
              <option value="">Todas as categorias</option>
              {Object.entries(categoryLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
          <NewCostDialog defaultMonth={selectedMonth} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Custos Totais do Mês</p>
                <div className="h-8 w-8 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-red-500 dark:text-red-400" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Lançamentos</p>
                <div className="h-8 w-8 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{costs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Maior Categoria</p>
                <div className="h-8 w-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {biggestCategory ? categoryLabel[biggestCategory[0]] : "—"}
              </p>
              {biggestCategory && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatCurrency(biggestCategory[1])}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Per-category summary */}
        {categorySummaries.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 dark:bg-gray-900">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor Total</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">% do Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorySummaries.map(([category, value]) => (
                      <tr key={category} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-gray-100">{categoryLabel[category] || category}</td>
                        <td className="px-6 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(value)}</td>
                        <td className="px-6 py-3 text-right text-gray-600 dark:text-gray-300">
                          {totalValue > 0 ? ((value / totalValue) * 100).toFixed(0) : 0}%
                        </td>
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
            {costs.length === 0 ? (
              <p className="p-10 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
                <Wallet className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                Nenhum custo registrado para este período.
              </p>
            ) : (
              <div className="divide-y">
                {costs.map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{cost.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{categoryLabel[cost.category] || cost.category}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(cost.amount)}</span>
                      <DeleteCostButton costId={cost.id} />
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
