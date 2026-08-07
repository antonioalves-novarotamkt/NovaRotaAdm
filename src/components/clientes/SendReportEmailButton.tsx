"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendClientReportEmail } from "@/app/actions/report";

export function SendReportEmailButton({ clientId, month }: { clientId: string; month: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      await sendClientReportEmail(clientId, month);
      setResult("Enviado!");
    } catch (err) {
      setResult(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {result && <span className="text-xs text-gray-500">{result}</span>}
      <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Enviar por Email
      </Button>
    </div>
  );
}
