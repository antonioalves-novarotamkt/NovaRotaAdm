"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logSocialMetric } from "@/app/actions/social";

interface AccountOption {
  id: string;
  handle: string;
  platform: string;
}

const platformLabel: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  TWITTER: "X / Twitter",
  OTHER: "Outra",
};

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const currentMonth = new Date().toISOString().slice(0, 7);

export function LogSocialMetricDialog({ clientId, accounts }: { clientId: string; accounts: AccountOption[] }) {
  const [open, setOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const isInstagram = selectedAccount?.platform === "INSTAGRAM";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" disabled={accounts.length === 0}>
          <TrendingUp className="h-3.5 w-3.5" />
          Registrar Mês
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Métrica Mensal</DialogTitle>
        </DialogHeader>
        <form action={logSocialMetric} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="clientId" value={clientId} />
          <select
            name="socialAccountId"
            required
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione a rede
            </option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {platformLabel[acc.platform] || acc.platform} — {acc.handle}
              </option>
            ))}
          </select>
          <Input name="month" type="month" defaultValue={currentMonth} required />
          <Input name="followers" type="number" placeholder="Seguidores / usuários" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="reach" type="number" placeholder="Alcance (opcional)" />
            <Input name="engagementRate" type="number" step="0.01" placeholder="Engajamento % (opcional)" />
          </div>

          {isInstagram && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs font-medium text-gray-500">Métricas do Instagram</p>
              <Input name="totalViews" type="number" placeholder="Visualizações totais" />
              <div className="grid grid-cols-2 gap-3">
                <Input name="followerViewsPct" type="number" step="0.1" min={0} max={100} placeholder="% seguidores" />
                <Input name="nonFollowerViewsPct" type="number" step="0.1" min={0} max={100} placeholder="% não seguidores" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input name="profileVisits" type="number" placeholder="Visitas ao perfil" />
                <Input name="linkTaps" type="number" placeholder="Toques em links" />
                <Input name="addressTaps" type="number" placeholder="Toques em endereço" />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
