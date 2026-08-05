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
import { createActivity } from "@/app/actions/activities";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const today = new Date().toISOString().slice(0, 10);

export function NewActivityDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Nova Atividade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Atividade</DialogTitle>
        </DialogHeader>
        <form action={createActivity} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="clientId" value={clientId} />
          <Input name="date" type="date" defaultValue={today} required />
          <textarea
            name="description"
            placeholder="O que foi feito para este cliente..."
            rows={4}
            required
            className={inputClass + " resize-none"}
          />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
