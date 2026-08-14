"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Trash2, ArrowRight, Loader2 } from "lucide-react";
import { updateLeadStage, deleteLead, convertLeadToClient } from "@/app/actions/leads";
import { formatCurrency } from "@/lib/utils";

export interface LeadCardData {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  value: number | null;
  stage: string;
  convertedClientId: string | null;
}

const stageLabel: Record<string, string> = {
  NEW: "Novo Contato",
  CONTACTED: "Em Contato",
  PROPOSAL: "Proposta Enviada",
  NEGOTIATION: "Negociação",
  WON: "Ganho",
  LOST: "Perdido",
};

const stageOrder = ["NEW", "CONTACTED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];

export function LeadCard({ lead }: { lead: LeadCardData }) {
  const [isPending, startTransition] = useTransition();

  function handleStageChange(stage: string) {
    const formData = new FormData();
    formData.set("id", lead.id);
    formData.set("stage", stage);
    startTransition(() => updateLeadStage(formData));
  }

  function handleDelete() {
    if (!confirm("Remover este lead?")) return;
    const formData = new FormData();
    formData.set("id", lead.id);
    startTransition(() => deleteLead(formData));
  }

  async function handleConvert() {
    const formData = new FormData();
    formData.set("id", lead.id);
    try {
      await convertLeadToClient(formData);
    } catch (err) {
      const digest = (err as { digest?: string })?.digest;
      if (digest?.startsWith("NEXT_REDIRECT")) throw err;
      alert(err instanceof Error ? err.message : "Erro ao converter lead em cliente.");
    }
  }

  const currentIdx = stageOrder.indexOf(lead.stage);
  const nextStage = currentIdx >= 0 && currentIdx < 3 ? stageOrder[currentIdx + 1] : null;

  return (
    <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lead.name}</p>
          {lead.company && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{lead.company}</p>}
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors shrink-0"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {lead.value != null && (
        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(lead.value)}</p>
      )}

      {lead.source && <p className="text-xs text-gray-400 dark:text-gray-500">Origem: {lead.source}</p>}

      <div className="flex items-center gap-2 pt-1">
        <select
          value={lead.stage}
          disabled={isPending || !!lead.convertedClientId}
          onChange={(e) => handleStageChange(e.target.value)}
          className="flex-1 min-w-0 h-7 text-xs rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-2"
        >
          {stageOrder.map((s) => (
            <option key={s} value={s}>
              {stageLabel[s]}
            </option>
          ))}
        </select>
        {nextStage && !lead.convertedClientId && (
          <button
            onClick={() => handleStageChange(nextStage)}
            disabled={isPending}
            title={`Mover para ${stageLabel[nextStage]}`}
            className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {lead.convertedClientId ? (
        <Link
          href={`/clientes/${lead.convertedClientId}`}
          className="block text-center text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline pt-1"
        >
          Ver cliente
        </Link>
      ) : (
        <button
          onClick={handleConvert}
          disabled={isPending}
          className="w-full text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md py-1.5 disabled:opacity-50"
        >
          Converter em Cliente
        </button>
      )}
    </div>
  );
}
