"use client";

import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendBillingRemindersNow } from "@/app/actions/billing-reminders";

export function SendRemindersButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setResult(null);
    try {
      const res = await sendBillingRemindersNow();
      const failed = res.dueSoonFailed + res.overdueFailed;
      setResult(
        `${res.dueSoonSent} lembrete(s) de vencimento e ${res.overdueSent} de atraso enviados.` +
          (failed > 0 ? ` ${failed} falharam.` : "")
      );
    } catch {
      setResult("Erro ao enviar lembretes.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        Enviar Lembretes Agora
      </Button>
      {result && <span className="text-xs text-gray-500">{result}</span>}
    </div>
  );
}
