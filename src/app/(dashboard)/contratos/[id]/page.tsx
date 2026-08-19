import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/contracts/PrintButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

export default async function ContractViewPage({ params }: { params: { id: string } }) {
  const [contract, agency] = await Promise.all([
    prisma.contract.findUnique({
      where: { id: params.id },
      include: { client: true, adjustments: { orderBy: { createdAt: "desc" } } },
    }),
    getAgencySettings(),
  ]);

  if (!contract) notFound();

  return (
    <div>
      <Header title={contract.title} subtitle={contract.client.company || contract.client.name} />
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/contratos">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 dark:text-gray-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <PrintButton />
        </div>

        <Card className="border-0 shadow-sm print:shadow-none print:border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                {agency.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={agency.logoUrl} alt={agency.name} className="h-14 object-contain" />
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{agency.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Contrato de Prestação de Serviços</p>
                </div>
              </div>
              {contract.client.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contract.client.logoUrl} alt={contract.client.name} className="h-14 object-contain" />
              )}
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
              {contract.content || "Este contrato não tem um texto gerado."}
            </pre>
          </CardContent>
        </Card>

        {contract.adjustments.length > 0 && (
          <Card className="border-0 shadow-sm print:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Histórico de Ajustes de Valor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {contract.adjustments.map((adj) => {
                const increased = adj.newValue > adj.previousValue;
                const delta = Math.abs(adj.newValue - adj.previousValue);
                return (
                  <div key={adj.id} className="flex items-start justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(adj.previousValue)} → <strong>{formatCurrency(adj.newValue)}</strong>
                      </p>
                      {adj.reason && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{adj.reason}</p>}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(adj.createdAt)}</p>
                    </div>
                    <div
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
                        increased
                          ? "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {increased ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      {increased ? "+" : "-"}
                      {formatCurrency(delta)}
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
