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
import { createContract } from "@/app/actions/contracts";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

export function NewContractDialog({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700" disabled={clients.length === 0}>
          <Plus className="h-4 w-4" />
          Novo Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        <form action={createContract} onSubmit={() => setOpen(false)} className="space-y-3">
          <Input name="title" placeholder="Título do contrato" required />
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
            <Input name="value" type="number" step="0.01" placeholder="Valor (R$)" required />
            <select name="status" defaultValue="ACTIVE" className={inputClass}>
              <option value="ACTIVE">Ativo</option>
              <option value="DRAFT">Rascunho</option>
              <option value="EXPIRED">Expirado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500 space-y-1">
              Início
              <Input name="startDate" type="date" required />
            </label>
            <label className="text-xs text-gray-500 space-y-1">
              Fim (opcional)
              <Input name="endDate" type="date" />
            </label>
          </div>
          <textarea
            name="notes"
            placeholder="Observações"
            rows={3}
            className={inputClass + " resize-none"}
          />
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Salvar Contrato
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
