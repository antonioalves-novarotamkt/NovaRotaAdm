import Link from "next/link";
import { FileText, Building2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NewContractDialog } from "@/components/contracts/NewContractDialog";
import { EditContractDialog } from "@/components/contracts/EditContractDialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  EXPIRED: { label: "Expirado", variant: "gray" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "warning" },
};

const frequencyLabel: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

export default async function ContratosPage() {
  const [contracts, clients, agency] = await Promise.all([
    prisma.contract.findMany({
      orderBy: { startDate: "desc" },
      include: { client: true },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    getAgencySettings(),
  ]);

  const activeCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const totalValue = contracts
    .filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + c.value, 0);

  return (
    <div>
      <Header title="Contratos" subtitle="Gerencie os contratos com seus clientes" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total de Contratos</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{contracts.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ativos</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Total Ativo</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{formatCurrency(totalValue)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clients.length === 0
              ? "Cadastre um cliente antes de criar um contrato."
              : `${contracts.length} contrato(s) cadastrado(s)`}
          </p>
          <NewContractDialog clients={clients} agencyName={agency.name} />
        </div>

        {contracts.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Nenhum contrato cadastrado ainda.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract) => {
              const status = statusMap[contract.status];
              return (
                <Card key={contract.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{contract.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {contract.client.company || contract.client.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Início</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(contract.startDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Valor</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(contract.value)}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">{frequencyLabel[contract.billingFrequency]}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <EditContractDialog
                        contract={contract}
                        clientName={contract.client.company || contract.client.name}
                        agencyName={agency.name}
                      />
                      {contract.content && (
                        <Link href={`/contratos/${contract.id}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 h-7">
                            Ver
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
