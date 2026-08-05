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
import { createInvoice } from "@/app/actions/invoices";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

export function NewInvoiceDialog({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5 bg-orange-600 hover:bg-orange-700" disabled={clients.length === 0}>
          <Plus className="h-3.5 w-3.5" />
          Nova Fatura
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Fatura</DialogTitle>
        </DialogHeader>
        <form action={createInvoice} onSubmit={() => setOpen(false)} className="space-y-3">
          <select name="clientId" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company || client.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input name="amount" type="number" step="0.01" placeholder="Valor (R$)" required />
            <Input name="tax" type="number" step="0.01" placeholder="Impostos (R$)" defaultValue={0} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="dueDate" type="date" required />
            <select name="status" defaultValue="PENDING" className={inputClass}>
              <option value="DRAFT">Rascunho</option>
              <option value="PENDING">Pendente</option>
              <option value="PAID">Pago</option>
              <option value="OVERDUE">Atrasado</option>
            </select>
          </div>
          <Input name="description" placeholder="Descrição (opcional)" />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar Fatura
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
