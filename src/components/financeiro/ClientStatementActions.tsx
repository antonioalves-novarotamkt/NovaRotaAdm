"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(text)}`;
}

export function ClientStatementActions({ text, phone }: { text: string; phone: string | null }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Não foi possível copiar automaticamente. Selecione o texto manualmente.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {phone && (
        <a href={whatsappLink(phone, text)} target="_blank" rel="noreferrer">
          <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            <MessageCircle className="h-3.5 w-3.5" />
            Enviar no WhatsApp
          </Button>
        </a>
      )}
      <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copiado!" : "Copiar resumo"}
      </Button>
    </div>
  );
}
