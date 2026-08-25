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
import { createTask } from "@/app/actions/tasks";
import { taskTypeLabel } from "@/lib/tasks";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

export function NewTaskDialog({
  clients,
  users,
  defaultClientId,
}: {
  clients: ClientOption[];
  users: UserOption[];
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
        </DialogHeader>
        <form action={createTask} onSubmit={() => setOpen(false)} className="space-y-3">
          <select name="clientId" required defaultValue={defaultClientId || ""} className={inputClass}>
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
          <Input name="title" placeholder="Título da tarefa" required />
          <select name="type" defaultValue="POST" className={inputClass}>
            {Object.entries(taskTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <textarea
            name="description"
            placeholder="Descrição / briefing (opcional)"
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          <Input name="contentUrl" placeholder="Link de referência / arquivo (opcional)" />
          <div className="grid grid-cols-2 gap-3">
            <select name="assigneeId" defaultValue="" className={inputClass}>
              <option value="">Sem responsável</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
            <Input name="dueDate" type="date" placeholder="Prazo" />
          </div>
          <select name="priority" defaultValue="MEDIUM" className={inputClass}>
            <option value="LOW">Prioridade baixa</option>
            <option value="MEDIUM">Prioridade média</option>
            <option value="HIGH">Prioridade alta</option>
            <option value="URGENT">Urgente</option>
          </select>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Criar Tarefa
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
