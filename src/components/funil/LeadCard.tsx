"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Trash2,
  ArrowRight,
  Loader2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Ban,
  MapPin,
  Globe,
  Instagram,
  Facebook,
  Linkedin,
  Mail,
} from "lucide-react";
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
  ANALYZING: "Analisando",
  PROPOSAL: "Proposta Enviada",
  NEGOTIATION: "Negociação",
  WON: "Ganho",
  LOST: "Perdido",
};

const stageOrder = ["NEW", "ANALYZING", "CONTACTED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"];
// A seta de "avançar" só faz sentido até a última etapa antes de
// Negociação — dali pra Ganho é sempre via "Converter em Cliente".
const LAST_AUTO_ADVANCE_IDX = stageOrder.indexOf("NEGOTIATION") - 1;

function whatsappLink(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}`;
}

interface LeadLinks {
  googleMapsUrl: string | null;
  siteUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  email: string | null;
}

// As notas de leads importados via prospecção guardam uma linha por
// informação ("Chave: valor") — extrai daqui os links para exibir como
// botões clicáveis em vez do texto corrido (que ficava com URLs enormes
// quebrando o layout do card).
function extractLeadLinks(notes: string | null): LeadLinks {
  const result: LeadLinks = {
    googleMapsUrl: null,
    siteUrl: null,
    instagramUrl: null,
    facebookUrl: null,
    linkedinUrl: null,
    email: null,
  };
  if (!notes) return result;
  const lines = notes
    .split(/\n|·/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (!match) continue;
    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    if (key === "email") {
      result.email = value;
      continue;
    }
    if (!/^https?:\/\//i.test(value)) continue;
    if (key === "google maps") result.googleMapsUrl = value;
    else if (key === "site") result.siteUrl = value;
    else if (key === "instagram") result.instagramUrl = value;
    else if (key === "facebook") result.facebookUrl = value;
    else if (key === "linkedin") result.linkedinUrl = value;
  }
  return result;
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
  const nextStage = currentIdx >= 0 && currentIdx <= LAST_AUTO_ADVANCE_IDX ? stageOrder[currentIdx + 1] : null;
  const waLink = lead.phone ? whatsappLink(lead.phone) : null;
  const links = extractLeadLinks(lead.notes);
  const hasAnyLink = Boolean(
    links.googleMapsUrl || links.siteUrl || links.instagramUrl || links.facebookUrl || links.linkedinUrl || links.email
  );
  const nameHref = links.googleMapsUrl || links.siteUrl;

  return (
    <div className="p-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {nameHref ? (
            <a
              href={nameHref}
              target="_blank"
              rel="noreferrer"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 truncate hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
            >
              {lead.name}
            </a>
          ) : (
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{lead.name}</p>
          )}
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

      {lead.phone && (
        waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5 shrink-0" /> {lead.phone}
          </a>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">{lead.phone}</p>
        )
      )}

      {lead.source && <p className="text-xs text-gray-400 dark:text-gray-500">Origem: {lead.source}</p>}

      {lead.stage === "LOST" && lead.lostReason && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded px-2 py-1">
          Motivo: {lead.lostReason}
        </p>
      )}

      {hasAnyLink ? (
        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
          {links.googleMapsUrl && (
            <a
              href={links.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
            >
              <MapPin className="h-3 w-3" /> Google Maps
            </a>
          )}
          {links.siteUrl && (
            <a
              href={links.siteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
            >
              <Globe className="h-3 w-3" /> Site
            </a>
          )}
          {links.instagramUrl && (
            <a
              href={links.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
            >
              <Instagram className="h-3 w-3" /> Instagram
            </a>
          )}
          {links.facebookUrl && (
            <a
              href={links.facebookUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
            >
              <Facebook className="h-3 w-3" /> Facebook
            </a>
          )}
          {links.linkedinUrl && (
            <a
              href={links.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:underline"
            >
              <Linkedin className="h-3 w-3" /> LinkedIn
            </a>
          )}
          {links.email && (
            <a
              href={`mailto:${links.email}`}
              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:underline truncate"
            >
              <Mail className="h-3 w-3" /> {links.email}
            </a>
          )}
        </div>
      ) : (
        lead.notes && (
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Ocultar detalhes" : "Ver detalhes"}
            </button>
            {expanded && (
              <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line mt-1 border-t border-gray-50 dark:border-gray-800 pt-1.5">
                {lead.notes}
              </p>
            )}
          </div>
        )
      )}

      <div className="flex items-center gap-2 pt-1">
        <select
          value={lead.stage}
          disabled={isPending || !!lead.convertedClientId}
          onChange={(e) => handleSelectStage(e.target.value)}
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
              className="w-full flex items-center justify-center gap-1 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 py-1"
            >
              <Ban className="h-3 w-3" /> Marcar como não apto
            </button>
          )}
        </>
      )}
    </div>
  );
}
