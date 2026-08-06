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
import { createClientSale } from "@/app/actions/sales";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

const currentMonth = new Date().toISOString().slice(0, 7);

export function NewSaleDialog({ clients, defaultClientId, defaultMonth }: { clients: ClientOption[]; defaultClientId?: string; defaultMonth?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700" disabled={clients.length === 0}>
          <Plus className="h-4 w-4" />
          Registrar Vendas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Vendas do Mês</DialogTitle>
        </DialogHeader>
        <form action={createClientSale} onSubmit={() => setOpen(false)} className="space-y-3">
          <select name="clientId" required defaultValue={defaultClientId || ""} className={inputClass}>
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company || client.name}
              </option>
            ))}
          </select>
          <Input name="month" type="month" defaultValue={defaultMonth || currentMonth} required />
          <select name="platform" defaultValue="" className={inputClass}>
            <option value="">Todos os apps (geral)</option>
            <option value="iFood">iFood</option>
            <option value="Keeta">Keeta</option>
            <option value="99Food">99Food</option>
            <option value="App próprio">App próprio</option>
            <option value="Outro">Outro</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input name="grossValue" type="number" step="0.01" placeholder="Total bruto de vendas (R$)" required />
            <Input name="netValue" type="number" step="0.01" placeholder="Ganho líquido (R$)" />
          </div>
          <p className="text-[11px] text-gray-400 -mt-1.5">
            Ganho líquido é o que sobra após taxas, comissão do app, promoções e entregas — deixe em branco se não souber ainda.
          </p>
          <Input name="salesCount" type="number" min={0} placeholder="Nº de vendas" required />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
