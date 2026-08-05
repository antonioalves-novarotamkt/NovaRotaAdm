import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/contracts/PrintButton";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ContractViewPage({ params }: { params: { id: string } }) {
  const contract = await prisma.contract.findUnique({
    where: { id: params.id },
    include: { client: true },
  });

  if (!contract) notFound();

  return (
    <div>
      <Header title={contract.title} subtitle={contract.client.company || contract.client.name} />
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/contratos">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <PrintButton />
        </div>

        <Card className="border-0 shadow-sm print:shadow-none print:border-0">
          <CardContent className="p-8">
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed">
              {contract.content || "Este contrato não tem um texto gerado."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
