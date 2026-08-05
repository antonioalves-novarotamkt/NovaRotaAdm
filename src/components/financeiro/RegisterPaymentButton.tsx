"use client";

import { useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { registerScheduledPayment } from "@/app/actions/billing";

export function RegisterPaymentButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      className="h-8 gap-1.5 text-xs"
      disabled={isPending}
      onClick={() => {
        const formData = new FormData();
        formData.set("clientId", clientId);
        startTransition(() => registerScheduledPayment(formData));
      }}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
      Dar Baixa
    </Button>
  );
}
