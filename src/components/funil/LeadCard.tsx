"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, ArrowRight, Loader2, MessageCircle, ChevronDown, ChevronUp, Ban } from "lucide-react";
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
  notes: string | null;
  lostReason: string | null;
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

function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

export function LeadCard({ lead }: { lead: LeadCardData }) {
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  function handleStageChange(stage: string, lostReason?: string) {
    const formData = new FormData();
    formData.set("id", lead.id);
    formData.set("stage", stage);
    if (lostReason) formData.set("lostReason", lostReason);
    startTransition(() => updateLeadStage(formData));
  }

  function handleSelectStage(stage: string) {
    if (stage === "LOST") {
      const reason = window.prompt(
        "Motivo (opcional) — fica registrado para você analisar depois:",
        lead.lostReason || ""
      );
      if (reason === null) return; // cancelado
      handleStageChange(stage, reason);
      return;
    }
    handleStageChange(stage);
  }

  function handleMarkUnfit() {
    const reason = window.prompt(
      "Por que esse lead não é apto? (ex: fora da região, porte incompatível, já é cliente de outra agência)",
      "Não apto"
    );
    if (reason === null) return;
    handleStageChange("LOST", reason || "Não apto");
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
  const waLink = lead.phone ? whatsappLink(lead.phone) : null;

  return (
    <div className="p-3 rounded-lg border border-gray-100 bg-white space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{lead.name}</p>
          {lead.company && <p className="text-xs text-gray-500 truncate">{lead.company}</p>}
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
          title="Remover"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {lead.value != null && (
        <p className="text-sm font-bold text-gray-900">{formatCurrency(lead.value)}</p>
      )}

      {lead.phone && (
        waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" /> {lead.phone}
          </a>
        ) : (
          <p className="text-xs text-gray-500">{lead.phone}</p>
        )
      )}

      {lead.source && <p className="text-xs text-gray-400">Origem: {lead.source}</p>}

      {lead.stage === "LOST" && lead.lostReason && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">Motivo: {lead.lostReason}</p>
      )}

      {lead.notes && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Ocultar detalhes" : "Ver detalhes"}
          </button>
          {expanded && (
            <p className="text-xs text-gray-500 whitespace-pre-line mt-1 border-t border-gray-50 pt-1.5">
              {lead.notes}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <select
          value={lead.stage}
          disabled={isPending || !!lead.convertedClientId}
          onChange={(e) => handleSelectStage(e.target.value)}
          className="flex-1 min-w-0 h-7 text-xs rounded-md border border-gray-200 bg-gray-50 px-2"
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
            className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {lead.convertedClientId ? (
        <Link
          href={`/clientes/${lead.convertedClientId}`}
          className="block text-center text-xs font-medium text-orange-600 hover:underline pt-1"
        >
          Ver cliente
        </Link>
      ) : (
        <>
          <button
            onClick={handleConvert}
            disabled={isPending}
            className="w-full text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md py-1.5 disabled:opacity-50"
          >
            Converter em Cliente
          </button>
          {lead.stage !== "LOST" && (
            <button
              onClick={handleMarkUnfit}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-1 text-xs font-medium text-gray-400 hover:text-red-600 py-1"
            >
              <Ban className="h-3 w-3" /> Marcar como não apto
            </button>
          )}
        </>
      )}
    </div>
  );
}
