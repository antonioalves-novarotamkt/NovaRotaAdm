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
import { createClient } from "@/app/actions/clients";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function NewClientDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>
        <form action={createClient} onSubmit={() => setOpen(false)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input name="name" placeholder="Nome do contato" required />
            <Input name="company" placeholder="Empresa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="phone" placeholder="Telefone" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="city" placeholder="Cidade" />
            <Input name="state" placeholder="Estado (UF)" maxLength={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="website" placeholder="Site" />
            <Input name="contractValue" type="number" step="0.01" placeholder="Valor contrato (R$)" />
          </div>
          <select name="status" defaultValue="PROSPECT" className={inputClass}>
            <option value="ACTIVE">Ativo</option>
            <option value="PROSPECT">Prospect</option>
            <option value="INACTIVE">Inativo</option>
            <option value="CHURNED">Perdido</option>
          </select>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar Cliente
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
