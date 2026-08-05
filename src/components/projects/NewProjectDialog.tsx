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
import { createProject } from "@/app/actions/projects";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

export function NewProjectDialog({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700" disabled={clients.length === 0}>
          <Plus className="h-4 w-4" />
          Novo Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Projeto</DialogTitle>
        </DialogHeader>
        <form action={createProject} onSubmit={() => setOpen(false)} className="space-y-3">
          <Input name="name" placeholder="Nome do projeto" required />
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
            <select name="status" defaultValue="PLANNING" className={inputClass}>
              <option value="PLANNING">Planejamento</option>
              <option value="IN_PROGRESS">Em Andamento</option>
              <option value="REVIEW">Em Revisão</option>
              <option value="COMPLETED">Concluído</option>
              <option value="ON_HOLD">Pausado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
            <select name="priority" defaultValue="MEDIUM" className={inputClass}>
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="startDate" type="date" placeholder="Início" />
            <Input name="endDate" type="date" placeholder="Prazo" />
          </div>
          <Input name="budget" type="number" step="0.01" placeholder="Orçamento (R$)" />
          <textarea
            name="description"
            placeholder="Descrição"
            rows={3}
            className={inputClass + " resize-none"}
          />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar Projeto
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
