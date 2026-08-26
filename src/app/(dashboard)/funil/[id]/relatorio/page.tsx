import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/contracts/PrintButton";
import { WhatsappTextBox } from "@/components/funil/WhatsappTextBox";
import { buildWhatsappAnalysisText } from "@/lib/lead-analysis";
import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";

export const dynamic = "force-dynamic";

function whatsappLinkWithText(phone: string, text: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
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

  const text = buildWhatsappAnalysisText(lead, lead.analysisItems, agency.name);
  const waLink = lead.phone ? whatsappLinkWithText(lead.phone, text) : null;

  return (
    <div>
      <Header title={`Análise — ${lead.company || lead.name}`} subtitle="Relatório e texto pronto para enviar" />
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
                  <p className="text-xs text-gray-400 dark:text-gray-500">Análise de Oportunidades</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs text-gray-400 dark:text-gray-500 tracking-widest uppercase">Lead</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{lead.company || lead.name}</p>
              {lead.company && lead.name !== lead.company && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{lead.name}</p>
              )}
              {lead.instagramHandle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Instagram: {lead.instagramHandle}</p>
              )}
            </div>

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
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm print:hidden">
          <CardContent className="p-6 space-y-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Texto para WhatsApp</p>
            <WhatsappTextBox text={text} waLink={waLink} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
