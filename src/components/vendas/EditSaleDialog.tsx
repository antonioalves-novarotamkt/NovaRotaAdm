"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateClientSale } from "@/app/actions/sales";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface SaleData {
  id: string;
  clientName: string;
  platform: string | null;
  grossValue: number;
  netValue: number | null;
  salesCount: number;
}

export function EditSaleDialog({ sale }: { sale: SaleData }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Venda — {sale.clientName}</DialogTitle>
        </DialogHeader>
        <form action={updateClientSale} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="id" value={sale.id} />
          <select name="platform" defaultValue={sale.platform || ""} className={inputClass}>
            <option value="">Todos os apps (geral)</option>
            <option value="iFood">iFood</option>
            <option value="Keeta">Keeta</option>
            <option value="99Food">99Food</option>
            <option value="App próprio">App próprio</option>
            <option value="Outro">Outro</option>
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input name="grossValue" type="number" step="0.01" defaultValue={sale.grossValue} placeholder="Total bruto de vendas (R$)" required />
            <Input name="netValue" type="number" step="0.01" defaultValue={sale.netValue ?? ""} placeholder="Ganho líquido (R$)" />
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-1.5">
            Ganho líquido é o que sobra após taxas, comissão do app, promoções e entregas — deixe em branco se não souber ainda.
          </p>
          <Input name="salesCount" type="number" min={0} defaultValue={sale.salesCount} placeholder="Nº de vendas" required />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
