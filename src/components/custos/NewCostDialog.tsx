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
import { createOperationalCost } from "@/app/actions/costs";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const currentMonth = new Date().toISOString().slice(0, 7);

export function NewCostDialog({ defaultMonth }: { defaultMonth?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          Lançar Custo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lançar Custo Operacional</DialogTitle>
        </DialogHeader>
        <form action={createOperationalCost} onSubmit={() => setOpen(false)} className="space-y-3">
          <select name="category" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecione a categoria
            </option>
            <option value="EMPLOYEE">Funcionário</option>
            <option value="SOFTWARE">Sistema / Software</option>
            <option value="INTERNET">Internet</option>
            <option value="RENT">Aluguel</option>
            <option value="MARKETING">Marketing</option>
            <option value="OTHER">Outros</option>
          </select>
          <Input name="description" placeholder="Descrição (ex: Salário João, Assinatura Canva)" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="month" type="month" defaultValue={defaultMonth || currentMonth} required />
            <Input name="amount" type="number" step="0.01" placeholder="Valor (R$)" required />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <input type="checkbox" name="recurring" className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500" />
            Custo mensal (repete todo mês automaticamente)
          </label>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
