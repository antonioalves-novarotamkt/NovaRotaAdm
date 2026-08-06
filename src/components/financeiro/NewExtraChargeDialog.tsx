"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createExtraCharge } from "@/app/actions/extra-charges";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

export function NewExtraChargeDialog({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 gap-1.5" disabled={clients.length === 0}>
          <Plus className="h-4 w-4" />
          Novo Recebimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Outro Recebimento</DialogTitle>
        </DialogHeader>
        <form action={createExtraCharge} onSubmit={() => setOpen(false)} className="space-y-3">
          <select name="clientId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
          <Input name="description" placeholder="Descrição (ex: taxa extra, serviço avulso)" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="amount" type="number" step="0.01" placeholder="Valor (R$)" required />
            <label className="text-xs text-gray-500 space-y-1">
              Data de vencimento
              <Input name="receivedDate" type="date" required />
            </label>
          </div>
          <p className="text-[11px] text-gray-400 -mt-1.5">
            Entra como pendente. Use &quot;Dar Baixa&quot; na lista quando o valor for recebido.
          </p>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
