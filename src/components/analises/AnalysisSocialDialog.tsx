"use client";

import { useState } from "react";
import { Users2 } from "lucide-react";
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

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
  socialAccounts: AccountOption[];
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

export function AnalysisSocialDialog({
  clients,
  defaultClientId,
}: {
  clients: ClientOption[];
  defaultClientId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState(defaultClientId || "");
  const [socialAccountId, setSocialAccountId] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);
  const accounts = selectedClient?.socialAccounts || [];
  const selectedAccount = accounts.find((a) => a.id === socialAccountId);
  const isInstagram = selectedAccount?.platform === "INSTAGRAM";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSocialAccountId("");
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-9 gap-1.5">
          <Users2 className="h-4 w-4" />
          Registrar Redes Sociais
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Métrica de Rede Social</DialogTitle>
        </DialogHeader>
        <form action={logSocialMetric} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="clientId" value={clientId} />
          <select
            required
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSocialAccountId("");
            }}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
          <select
            name="socialAccountId"
            required
            value={socialAccountId}
            onChange={(e) => setSocialAccountId(e.target.value)}
            disabled={!clientId}
            className={inputClass}
          >
            <option value="" disabled>
              {clientId ? "Selecione a rede" : "Escolha um cliente primeiro"}
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

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={!socialAccountId}>
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
