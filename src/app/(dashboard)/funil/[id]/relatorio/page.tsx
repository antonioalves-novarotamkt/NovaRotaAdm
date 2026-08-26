import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { EB_Garamond } from "next/font/google";
import { ArrowLeft, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/contracts/PrintButton";
import { ClientTextsCard } from "@/components/funil/ClientTextsCard";
import { buildWhatsappAnalysisText } from "@/lib/lead-analysis";
import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

const serif = EB_Garamond({ subsets: ["latin"], weight: ["500", "600"] });

// Cor de destaque do relatório impresso — mesma linha visual do modelo da
// agência (título e linhas em navy, sem depender do tema claro/escuro).
const NAVY = "text-[#1e3a5f] print:!text-[#1e3a5f]";
const NAVY_BORDER = "border-[#1e3a5f] print:!border-[#1e3a5f]";

// Define o título da página em português com o nome do cliente — é o que o
// navegador usa como nome sugerido ao salvar o relatório como PDF.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const lead = await prisma.lead.findUnique({ where: { id: params.id }, select: { name: true, company: true } });
  if (!lead) return {};
  return { title: `Análise de Oportunidades - ${lead.company || lead.name}` };
}

export default async function LeadReportPage({ params }: { params: { id: string } }) {
  const [lead, agency] = await Promise.all([
    prisma.lead.findUnique({
      where: { id: params.id },
      include: { analysisItems: { orderBy: { order: "asc" } } },
    }),
    getAgencySettings(),
  ]);

  if (!lead) notFound();

  const fallbackText = buildWhatsappAnalysisText(lead, lead.analysisItems, agency.name);

  return (
    <div>
      <Header title={`Análise — ${lead.company || lead.name}`} subtitle="Relatório e textos prontos para enviar" />
      <div className="p-6 space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between print:hidden">
          <Link href="/funil">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 dark:text-gray-300">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/funil/${lead.id}/analise`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            </Link>
            <PrintButton />
          </div>
        </div>

        <Card className="border-0 shadow-sm print:shadow-none print:border-0 bg-white">
          <CardContent className="p-10">
            <div className={`flex items-center justify-between pb-5 mb-8 border-b-2 ${NAVY_BORDER}`}>
              {agency.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agency.logoUrl} alt={agency.name} className="h-12 object-contain" />
              ) : (
                <p className="text-base font-bold text-gray-900">{agency.name}</p>
              )}
              <h1 className={`${serif.className} text-2xl ${NAVY}`}>Análise de Oportunidades</h1>
            </div>

            <div className="mb-8">
              <p className="text-xs text-gray-400 tracking-widest uppercase">Cliente</p>
              <p className="text-xl font-bold text-gray-900">{lead.company || lead.name}</p>
              {lead.company && lead.name !== lead.company && <p className="text-sm text-gray-500">{lead.name}</p>}
              {lead.instagramHandle && <p className="text-sm text-gray-500">Instagram: {lead.instagramHandle}</p>}
            </div>

            <div className="print:hidden">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Suas anotações (uso interno — não aparecem na versão impressa)
              </p>
              {lead.analysisItems.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma seção de análise cadastrada ainda.</p>
              ) : (
                <div className="space-y-4">
                  {lead.analysisItems.map((item) => (
                    <div key={item.id}>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line mt-0.5">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="hidden print:block text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {lead.reportText || fallbackText}
            </p>

            <div className={`hidden print:flex mt-16 pt-4 border-t-2 ${NAVY_BORDER} items-end justify-between`}>
              <p className={`${serif.className} text-lg ${NAVY}`}>{agency.name}</p>
              {agency.website && <p className={`text-sm font-bold ${NAVY}`}>{agency.website}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm print:hidden">
          <CardContent className="p-6">
            <ClientTextsCard
              leadId={lead.id}
              initialReportText={lead.reportText}
              initialWhatsappText={lead.whatsappTeaserText}
              fallbackText={fallbackText}
              phone={lead.phone}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
