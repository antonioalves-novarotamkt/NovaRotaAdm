import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/contracts/PrintButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  OVERDUE: "Atrasado",
  DRAFT: "Rascunho",
  CANCELLED: "Cancelado",
};

export default async function ReciboPage({ params }: { params: { id: string } }) {
  const [invoice, agency] = await Promise.all([
    prisma.invoice.findUnique({
      where: { id: params.id },
      include: { client: true },
    }),
    getAgencySettings(),
  ]);

  if (!invoice) notFound();

  return (
    <div>
      <Header title={`Recibo ${invoice.number}`} subtitle={invoice.client.company || invoice.client.name} />
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between print:hidden">
          <Link href={`/clientes/${invoice.client.id}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <PrintButton />
        </div>

        <Card className="border-0 shadow-sm print:shadow-none print:border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {agency.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={agency.logoUrl} alt={agency.name} className="h-14 object-contain" />
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">{agency.name}</p>
                  <p className="text-xs text-gray-400">Recibo de Pagamento</p>
                </div>
              </div>
              {invoice.client.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={invoice.client.logoUrl} alt={invoice.client.name} className="h-14 object-contain" />
              )}
            </div>

            <div className="text-center mb-6">
              <p className="text-xs text-gray-400 tracking-widest uppercase">Recibo</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
              <p className="text-xs text-gray-400 mt-1">Nº {invoice.number}</p>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              Recebemos de <strong>{invoice.client.company || invoice.client.name}</strong> a quantia de{" "}
              <strong>{formatCurrency(invoice.total)}</strong>
              {invoice.description ? ` referente a ${invoice.description.toLowerCase()}` : ""}, dando plena, geral e
              irrevogável quitação relativa ao valor recebido, para nada mais reclamar a este título.
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-gray-400">Cliente</p>
                <p className="text-sm font-medium text-gray-900">{invoice.client.company || invoice.client.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">E-mail</p>
                <p className="text-sm font-medium text-gray-900">{invoice.client.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Data de Vencimento</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Data de Pagamento</p>
                <p className="text-sm font-medium text-gray-900">
                  {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Valor Pago</p>
                <p className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Status</p>
                <p className="text-sm font-medium text-gray-900">{statusLabel[invoice.status] || invoice.status}</p>
              </div>
            </div>

            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500">
                {agency.name}, {formatDate(new Date())}
              </p>
              <div className="mt-8 inline-block">
                <div className="border-t border-gray-400 w-64 mx-auto pt-2">
                  <p className="text-sm text-gray-700">{agency.name}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
