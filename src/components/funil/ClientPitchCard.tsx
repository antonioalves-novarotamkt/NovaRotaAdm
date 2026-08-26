"use client";

import { useState, useTransition } from "react";
import { Copy, Check, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAndSaveClientPitch, updateClientPitch } from "@/app/actions/lead-analysis";

function whatsappLinkWithText(phone: string, text: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

export function ClientPitchCard({
  leadId,
  initialPitch,
  fallbackText,
  phone,
}: {
  leadId: string;
  initialPitch: string | null;
  fallbackText: string;
  phone: string | null;
}) {
  const [pitch, setPitch] = useState(initialPitch);
  const [draft, setDraft] = useState(initialPitch ?? "");
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = pitch !== null && draft !== pitch;

  function handleGenerate() {
    setError(null);
    startGenerate(async () => {
      const result = await generateAndSaveClientPitch(leadId);
      if (result.ok) {
        setPitch(result.text);
        setDraft(result.text);
      } else {
        setError(result.error);
      }
    });
  }

  function handleSaveEdit() {
    startSave(async () => {
      await updateClientPitch(leadId, draft);
      setPitch(draft);
    });
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(pitch !== null ? draft : fallbackText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeText = pitch !== null ? draft : fallbackText;
  const waLink = phone ? whatsappLinkWithText(phone, activeText) : null;

  return (
    <div className="space-y-3 print:hidden">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Versão para o Cliente</p>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {pitch !== null ? "Regenerar" : "Gerar versão para o cliente"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1.5">
          {error}
        </p>
      )}

      {pitch === null ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Ainda não gerada. Enquanto isso, o texto abaixo usa direto o que você escreveu na análise.
        </p>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Gerada por IA a partir da sua análise — revise antes de enviar.
        </p>
      )}

      <textarea
        value={activeText}
        onChange={(e) => setDraft(e.target.value)}
        readOnly={pitch === null}
        rows={10}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />

      <div className="flex items-center gap-2 flex-wrap">
        {dirty && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleSaveEdit} disabled={isSaving}>
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
