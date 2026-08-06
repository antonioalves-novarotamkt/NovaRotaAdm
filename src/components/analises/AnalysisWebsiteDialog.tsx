"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logWebsiteMetric } from "@/app/actions/website";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const currentMonth = new Date().toISOString().slice(0, 7);

export function AnalysisWebsiteDialog({
  clients,
  defaultClientId,
}: {
  clients: ClientOption[];
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 gap-1.5">
          <Globe className="h-4 w-4" />
          Registrar Site
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Métrica do Site</DialogTitle>
        </DialogHeader>
        <form action={logWebsiteMetric} onSubmit={() => setOpen(false)} className="space-y-3">
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
          <Input name="month" type="month" defaultValue={currentMonth} required />
          <Input name="pageViews" type="number" placeholder="Visualizações" />
          <div className="grid grid-cols-2 gap-3">
            <Input name="totalUsers" type="number" placeholder="Total de usuários" />
            <Input name="newUsers" type="number" placeholder="Novos usuários" />
          </div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
