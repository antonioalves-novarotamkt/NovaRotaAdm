"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { logSocialMetric } from "@/app/actions/social";

interface SocialMetricData {
  clientId: string;
  clientName: string;
  socialAccountId: string;
  accountLabel: string;
  isInstagram: boolean;
  month: string;
  followers: number;
  reach: number | null;
  engagementRate: number | null;
  totalViews: number | null;
  followerViewsPct: number | null;
  nonFollowerViewsPct: number | null;
  profileVisits: number | null;
  linkTaps: number | null;
  addressTaps: number | null;
}

export function EditSocialMetricDialog({ metric }: { metric: SocialMetricData }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Editar Métrica — {metric.clientName} · {metric.accountLabel}
          </DialogTitle>
        </DialogHeader>
        <form action={logSocialMetric} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="clientId" value={metric.clientId} />
          <input type="hidden" name="socialAccountId" value={metric.socialAccountId} />
          <Input name="month" type="month" defaultValue={metric.month} required />
          <Input name="followers" type="number" defaultValue={metric.followers} placeholder="Seguidores / usuários" required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="reach" type="number" defaultValue={metric.reach ?? ""} placeholder="Alcance (opcional)" />
            <Input
              name="engagementRate"
              type="number"
              step="0.01"
              defaultValue={metric.engagementRate ?? ""}
              placeholder="Engajamento % (opcional)"
            />
          </div>

          {metric.isInstagram && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs font-medium text-gray-500">Métricas do Instagram</p>
              <Input name="totalViews" type="number" defaultValue={metric.totalViews ?? ""} placeholder="Visualizações totais" />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  name="followerViewsPct"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  defaultValue={metric.followerViewsPct ?? ""}
                  placeholder="% seguidores"
                />
                <Input
                  name="nonFollowerViewsPct"
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  defaultValue={metric.nonFollowerViewsPct ?? ""}
                  placeholder="% não seguidores"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input name="profileVisits" type="number" defaultValue={metric.profileVisits ?? ""} placeholder="Visitas ao perfil" />
                <Input name="linkTaps" type="number" defaultValue={metric.linkTaps ?? ""} placeholder="Toques em links" />
                <Input name="addressTaps" type="number" defaultValue={metric.addressTaps ?? ""} placeholder="Toques em endereço" />
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
