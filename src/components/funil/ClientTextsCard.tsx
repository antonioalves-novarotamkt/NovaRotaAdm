"use client";

import { useState, useTransition } from "react";
import { Copy, Check, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateAndSaveClientTexts,
  updateReportText,
  updateWhatsappTeaserText,
} from "@/app/actions/lead-analysis";

function whatsappLinkWithText(phone: string, text: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

function TextBlock({
  label,
  helpText,
  value,
  savedValue,
  onChange,
  onSave,
  isSaving,
  waLink,
}: {
  label: string;
  helpText: string;
  value: string;
  savedValue: string | null;
  onChange: (v: string) => void;
  onSave: () => void;
  isSaving: boolean;
  waLink?: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const dirty = savedValue !== null && value !== savedValue;

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">{helpText}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={savedValue === null}
        rows={label.includes("Relatório") ? 10 : 5}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="flex items-center gap-2 flex-wrap">
        {dirty && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Salvar edição
          </Button>
        )}
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado!" : "Copiar texto"}
        </Button>
        {waLink && (
          <a href={waLink} target="_blank" rel="noreferrer">
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <MessageCircle className="h-3.5 w-3.5" />
              Abrir no WhatsApp
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

export function ClientTextsCard({
  leadId,
  initialReportText,
  initialWhatsappText,
  fallbackText,
  phone,
}: {
  leadId: string;
  initialReportText: string | null;
  initialWhatsappText: string | null;
  fallbackText: string;
  phone: string | null;
}) {
  const [reportText, setReportText] = useState(initialReportText);
  const [reportDraft, setReportDraft] = useState(initialReportText ?? "");
  const [whatsappText, setWhatsappText] = useState(initialWhatsappText);
  const [whatsappDraft, setWhatsappDraft] = useState(initialWhatsappText ?? "");

  const [isGenerating, startGenerate] = useTransition();
  const [isSavingReport, startSaveReport] = useTransition();
  const [isSavingWhatsapp, startSaveWhatsapp] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    setError(null);
    startGenerate(async () => {
      const result = await generateAndSaveClientTexts(leadId);
      if (result.ok) {
        setReportText(result.reportText);
        setReportDraft(result.reportText);
        setWhatsappText(result.whatsappText);
        setWhatsappDraft(result.whatsappText);
      } else {
        setError(result.error);
      }
    });
  }

  function handleSaveReport() {
    startSaveReport(async () => {
      await updateReportText(leadId, reportDraft);
      setReportText(reportDraft);
    });
  }

  function handleSaveWhatsapp() {
    startSaveWhatsapp(async () => {
      await updateWhatsappTeaserText(leadId, whatsappDraft);
      setWhatsappText(whatsappDraft);
    });
  }

  const activeReportText = reportText !== null ? reportDraft : fallbackText;
  const activeWhatsappText = whatsappText !== null ? whatsappDraft : fallbackText;
  const waLink = phone ? whatsappLinkWithText(phone, activeWhatsappText) : null;

  return (
    <div className="space-y-5 print:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Textos para o Cliente</p>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {reportText !== null || whatsappText !== null ? "Regenerar" : "Gerar textos"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      {reportText === null && whatsappText === null && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ainda não gerados. Enquanto isso, os campos abaixo usam direto o que você escreveu na análise.
        </p>
      )}

      <TextBlock
        label="Texto do Relatório (técnico)"
        helpText="Vai para o PDF impresso — análise mais formal, por tópico."
        value={activeReportText}
        savedValue={reportText}
        onChange={setReportDraft}
        onSave={handleSaveReport}
        isSaving={isSavingReport}
      />

      <TextBlock
        label="Texto de Abordagem (WhatsApp)"
        helpText="Primeira mensagem — curta e direta, só para despertar interesse em receber o PDF."
        value={activeWhatsappText}
        savedValue={whatsappText}
        onChange={setWhatsappDraft}
        onSave={handleSaveWhatsapp}
        isSaving={isSavingWhatsapp}
        waLink={waLink}
      />
    </div>
  );
}
