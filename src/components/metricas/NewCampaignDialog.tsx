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
import { createCampaignMetric } from "@/app/actions/campaigns";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

const today = new Date().toISOString().slice(0, 10);

export function NewCampaignDialog({ clients }: { clients: ClientOption[] }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700" disabled={clients.length === 0}>
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Campanha</DialogTitle>
        </DialogHeader>
        <form action={createCampaignMetric} onSubmit={() => setOpen(false)} className="space-y-3">
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
          <Input name="name" placeholder="Nome da campanha" />
          <div className="grid grid-cols-2 gap-3">
            <select name="platform" defaultValue="Google Ads" className={inputClass}>
              <option value="Google Ads">Google Ads</option>
              <option value="Meta Ads">Meta Ads</option>
              <option value="LinkedIn Ads">LinkedIn Ads</option>
              <option value="TikTok Ads">TikTok Ads</option>
              <option value="Outra">Outra</option>
            </select>
            <select name="status" defaultValue="ACTIVE" className={inputClass}>
              <option value="ACTIVE">Ativa</option>
              <option value="PAUSED">Pausada</option>
              <option value="COMPLETED">Concluída</option>
            </select>
          </div>
          <Input name="date" type="date" defaultValue={today} required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="impressions" type="number" placeholder="Impressões" />
            <Input name="clicks" type="number" placeholder="Cliques" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="conversions" type="number" placeholder="Conversões" />
            <Input name="spend" type="number" step="0.01" placeholder="Investimento (R$)" required />
          </div>
          <Input name="revenue" type="number" step="0.01" placeholder="Receita gerada (R$)" />
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Salvar Campanha
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
