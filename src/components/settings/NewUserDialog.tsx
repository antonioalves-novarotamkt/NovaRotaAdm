"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createUser } from "@/app/actions/users";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function NewUserDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700">
          <UserPlus className="h-4 w-4" />
          Novo Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
        </DialogHeader>
        <form action={createUser} onSubmit={() => setOpen(false)} className="space-y-3">
          <Input name="name" placeholder="Nome completo" required />
          <Input name="email" type="email" placeholder="Email" required />
          <Input name="password" type="password" placeholder="Senha temporária (mín. 6 caracteres)" required minLength={6} />
          <select name="role" defaultValue="USER" className={inputClass}>
            <option value="USER">Usuário</option>
            <option value="MANAGER">Gerente</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Criar Usuário
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
