import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityFeedForm } from "@/components/activities/ActivityFeedForm";
import { formatDate, getInitials } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const currentMonth = new Date().toISOString().slice(0, 7);

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: { cliente?: string; mes?: string };
}) {
  const selectedClientId = searchParams.cliente || "";
  const selectedMonth = searchParams.mes || "";

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });

  const monthRange = selectedMonth
    ? {
        gte: new Date(`${selectedMonth}-01T00:00:00.000Z`),
        lt: new Date(new Date(`${selectedMonth}-01T00:00:00.000Z`).setMonth(new Date(`${selectedMonth}-01T00:00:00.000Z`).getMonth() + 1)),
      }
    : undefined;

  const activities = await prisma.clientActivity.findMany({
    where: {
      ...(selectedClientId ? { clientId: selectedClientId } : {}),
      ...(monthRange ? { date: monthRange } : {}),
    },
    include: { client: true },
    orderBy: { date: "desc" },
    take: 100,
  });

  return (
    <div>
      <Header title="Atividades" subtitle="Feed do que foi feito em cada cliente, para gerar o relatório mensal" />
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">Nova Atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeedForm clients={clients} defaultClientId={selectedClientId} />
          </CardContent>
        </Card>

        <form className="flex items-center gap-2" method="get">
          <select
            name="cliente"
            defaultValue={selectedClientId}
            className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
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
            className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
          />
          <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            Filtrar
          </button>
          {(selectedClientId || selectedMonth) && (
            <Link href="/atividades" className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              Limpar filtros
            </Link>
          )}
        </form>

        {activities.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center gap-2">
              <ClipboardList className="h-6 w-6 text-gray-300 dark:text-gray-600" />
              Nenhuma atividade encontrada.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <Card key={activity.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {getInitials(activity.client.company || activity.client.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/clientes/${activity.client.id}`}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-600"
                      >
                        {activity.client.company || activity.client.name}
                      </Link>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(activity.date)}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
