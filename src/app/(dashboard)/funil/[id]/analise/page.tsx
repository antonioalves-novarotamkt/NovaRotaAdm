import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { AnalysisEditor } from "@/components/funil/AnalysisEditor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LeadAnalysisPage({ params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: { analysisItems: { orderBy: { order: "asc" } } },
  });

  if (!lead) notFound();

  return (
    <div>
      <Header title={`Análise — ${lead.company || lead.name}`} subtitle="Escreva o que analisamos e as oportunidades para o cliente" />
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <Link href="/funil">
          <Button variant="ghost" size="sm" className="gap-2 text-gray-600 dark:text-gray-300">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Funil
          </Button>
        </Link>

        <AnalysisEditor
          leadId={lead.id}
          initialSections={lead.analysisItems.map((i) => ({ title: i.title, content: i.content }))}
        />
      </div>
    </div>
  );
}
