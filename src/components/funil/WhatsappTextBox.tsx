"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WhatsappTextBox({ text, waLink }: { text: string; waLink: string | null }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-2 print:hidden">
      <textarea
        readOnly
        value={text}
        rows={10}
        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <div className="flex items-center gap-2">
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
