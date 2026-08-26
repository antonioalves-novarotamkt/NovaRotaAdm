"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelInvoicePayment } from "@/app/actions/payments";

export function CancelPaymentButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!confirm("Cancelar esse recebimento? A fatura volta a ficar em aberto e esse recibo deixa de valer.")) return;
    setError(null);
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      try {
        await cancelInvoicePayment(formData);
        router.push("/financeiro");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao cancelar o recebimento.");
      }
    });
  }

  return (
    <div className="print:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-900"
        disabled={isPending}
        onClick={handleClick}
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Undo2 className="h-3.5 w-3.5" />}
        Cancelar Recebimento
      </Button>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
    </div>
  );
}
