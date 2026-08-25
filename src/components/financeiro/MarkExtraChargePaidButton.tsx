"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { markExtraChargePaid } from "@/app/actions/extra-charges";
import { formatCurrency } from "@/lib/utils";

const today = new Date().toISOString().slice(0, 10);

export function MarkExtraChargePaidButton({ id, remaining, alreadyPaid }: { id: string; remaining: number; alreadyPaid?: number }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Dar Baixa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Confirmar Recebimento</DialogTitle>
        </DialogHeader>
        <form action={markExtraChargePaid} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          {!!alreadyPaid && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Já recebido: {formatCurrency(alreadyPaid)} · Saldo devedor: {formatCurrency(remaining)}
            </p>
          )}
          <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1 block">
            Valor recebido
            <Input name="amount" type="number" step="0.01" min={0.01} max={remaining} defaultValue={remaining} required />
          </label>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Se receber menos que o saldo devedor ({formatCurrency(remaining)}), a fatura fica marcada como parcialmente paga com o restante em aberto.
          </p>
          <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1 block">
            Data em que foi recebido
            <Input name="paidAt" type="date" defaultValue={today} required />
          </label>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Confirmar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
