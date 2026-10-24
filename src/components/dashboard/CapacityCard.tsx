import Link from "next/link";
import { Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";
import type { getCapacitySummary } from "@/lib/capacity-summary";

type Summary = Awaited<ReturnType<typeof getCapacitySummary>>;

const fmtH = (h: number) => `${(Math.round(h * 10) / 10).toLocaleString("pt-BR")} h`;
const fmtQty = (n: number) => (Math.round(n * 10) / 10).toLocaleString("pt-BR");

export function CapacityCard({ data }: { data: Summary }) {
  const status =
    data.occupancy <= 70
      ? { label: "Com folga", cls: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10" }
      : data.occupancy <= 100
        ? { label: "Perto do limite", cls: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10" }
        : { label: "Acima do limite", cls: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10" };
  const scale = Math.max(data.forClients, data.used, 1);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Gauge className="h-4 w-4 text-orange-600 dark:text-orange-400" /> Capacidade do mês
        </CardTitle>
        <Link href="/capacidade" className="text-xs text-orange-600 dark:text-orange-400 hover:underline">
          Abrir Capacidade
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ocupação</p>
            <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{Math.round(data.occupancy)}%</p>
            <span className={cn("inline-block text-[11px] font-medium px-2 py-0.5 rounded-full", status.cls)}>{status.label}</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Horas de clientes</p>
            <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-gray-100">{fmtH(data.used)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">de {fmtH(data.limit)} com qualidade</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Valor médio da hora</p>
            <p className={cn("text-xl font-bold tabular-nums", data.used > 0 && data.avgRate < data.hourRate ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100")}>
              {data.used > 0 ? formatCurrency(data.avgRate) : "—"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              meta {formatCurrency(data.hourRate)}
              {data.belowRate > 0 ? ` · ${data.belowRate} cliente(s) abaixo` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ainda cabem</p>
            <p className="text-xl font-bold tabular-nums text-orange-600 dark:text-orange-400">
              {data.fitsMore != null ? `${data.fitsMore} clientes` : fmtH(data.free)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{fmtH(data.free)} livres</p>
          </div>
        </div>
        <div className="relative h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden" role="img" aria-label={`Ocupação ${Math.round(data.occupancy)}%`}>
          <div
            className={cn("absolute inset-y-0 left-0", data.used > data.limit ? "bg-red-500" : "bg-[#003462] dark:bg-blue-400")}
            style={{ width: `${(data.used / scale) * 100}%` }}
          />
          <div className="absolute inset-y-0 w-0.5 bg-orange-500" style={{ left: `${(data.limit / scale) * 100}%` }} />
        </div>
        {data.materials.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.materials.map((m) => (
              <span key={m.name} className="text-xs px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <b className="tabular-nums">{fmtQty(m.quantity)}</b> {m.name}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
