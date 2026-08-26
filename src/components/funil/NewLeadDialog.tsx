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
import { createLead } from "@/app/actions/leads";

export function NewLeadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>
        <form action={createLead} onSubmit={() => setOpen(false)} className="space-y-3">
          <Input name="name" placeholder="Nome do contato / empresa" required />
          <Input name="company" placeholder="Empresa (opcional)" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="email" type="email" placeholder="E-mail" />
            <Input name="phone" placeholder="Telefone / WhatsApp" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="source" placeholder="Origem (indicação, site...)" />
            <Input name="value" type="number" step="0.01" placeholder="Valor estimado (R$)" />
          </div>
          <Input name="instagramHandle" placeholder="Instagram (@usuário ou link, opcional)" />
          <textarea
            name="notes"
            placeholder="Observações"
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
