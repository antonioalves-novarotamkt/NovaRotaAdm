import Link from "next/link";
import { Search, Filter, Mail, Phone, Globe, Building2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NewClientDialog } from "@/components/clients/NewClientDialog";
import { formatCurrency, getInitials } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  INACTIVE: { label: "Inativo", variant: "gray" },
  PROSPECT: { label: "Prospect", variant: "info" },
  CHURNED: { label: "Perdido", variant: "danger" },
};

const colors = ["bg-orange-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500"];

export default async function ClientesPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  const activeCount = clients.filter((c) => c.status === "ACTIVE").length;
  const totalMRR = clients
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + (c.contractValue ?? 0), 0);

  return (
    <div>
      <Header title="Clientes" subtitle="Gerencie sua base de clientes" />
      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total de Clientes", value: clients.length, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
            { label: "Ativos", value: activeCount, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
            { label: "Prospects", value: clients.filter((c) => c.status === "PROSPECT").length, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-500/10" },
            { label: "MRR Total", value: formatCurrency(totalMRR), color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input placeholder="Buscar cliente, empresa..." className="pl-9 h-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
          <NewClientDialog />
        </div>

        {/* Clients Grid */}
        {clients.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Nenhum cliente cadastrado ainda. Clique em &quot;Novo Cliente&quot; para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {clients.map((client, idx) => {
              const status = statusMap[client.status];
              const color = colors[idx % colors.length];
              return (
                <Link key={client.id} href={`/clientes/${client.id}`}>
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{client.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {client.company ?? "—"}
                            </p>
                          </div>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <Mail className="h-3.5 w-3.5" />
                          {client.email}
                        </p>
                        {client.phone && (
                          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Phone className="h-3.5 w-3.5" />
                            {client.phone}
                          </p>
                        )}
                        {client.website && (
                          <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <Globe className="h-3.5 w-3.5" />
                            {client.website}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t pt-3">
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Valor Contrato</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {client.contractValue ? formatCurrency(client.contractValue) : "—"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Projetos</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{client._count.projects}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Cidade</p>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {client.city ? `${client.city}, ${client.state}` : "—"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
