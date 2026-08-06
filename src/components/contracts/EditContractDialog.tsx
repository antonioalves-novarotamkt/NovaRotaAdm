"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateContract } from "@/app/actions/contracts";
import { weekdayLabel } from "@/lib/billing";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const MENU_PLATFORMS = ["iFood", "Keeta", "99Food", "App próprio"];
const WEEKDAY_OPTIONS = [0, 1, 2, 3, 4, 5, 6];
const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1);

interface ContractData {
  id: string;
  title: string;
  value: number;
  startDate: Date;
  endDate: Date | null;
  status: string;
  notes: string | null;
  billingFrequency: string;
  billingDayOfWeek: number | null;
  billingDayOfMonth1: number | null;
  billingDayOfMonth2: number | null;
  includesSocialMedia: boolean;
  postsPerWeek: number | null;
  reelsPerWeek: number | null;
  socialNetworksCount: number | null;
  includesGoogleAds: boolean;
  includesMenuMgmt: boolean;
  menuPlatforms: string | null;
}

export function EditContractDialog({ contract }: { contract: ContractData }) {
  const [open, setOpen] = useState(false);
  const [billingFrequency, setBillingFrequency] = useState(contract.billingFrequency);
  const [includesSocialMedia, setIncludesSocialMedia] = useState(contract.includesSocialMedia);
  const [includesGoogleAds, setIncludesGoogleAds] = useState(contract.includesGoogleAds);
  const [includesMenuMgmt, setIncludesMenuMgmt] = useState(contract.includesMenuMgmt);
  const [menuPlatforms, setMenuPlatforms] = useState<string[]>(
    contract.menuPlatforms ? contract.menuPlatforms.split(",").filter(Boolean) : []
  );

  function toggleMenuPlatform(platform: string) {
    setMenuPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500 hover:text-gray-700 h-7">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
        </DialogHeader>
        <form action={updateContract} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="id" value={contract.id} />
          <Input name="title" placeholder="Título do contrato" defaultValue={contract.title} required />
          <div className="grid grid-cols-2 gap-3">
            <Input name="value" type="number" step="0.01" placeholder="Valor mensal (R$)" defaultValue={contract.value} required />
            <select name="status" defaultValue={contract.status} className={inputClass}>
              <option value="ACTIVE">Ativo</option>
              <option value="DRAFT">Rascunho</option>
              <option value="EXPIRED">Expirado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500 space-y-1">
              Início
              <Input name="startDate" type="date" defaultValue={contract.startDate.toISOString().slice(0, 10)} required />
            </label>
            <label className="text-xs text-gray-500 space-y-1">
              Fim (opcional)
              <Input name="endDate" type="date" defaultValue={contract.endDate ? contract.endDate.toISOString().slice(0, 10) : ""} />
            </label>
          </div>
          <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Recorrência do recebimento</p>
            <select
              name="billingFrequency"
              value={billingFrequency}
              onChange={(e) => setBillingFrequency(e.target.value)}
              className={inputClass}
            >
              <option value="WEEKLY">Semanal</option>
              <option value="BIWEEKLY">Quinzenal</option>
              <option value="MONTHLY">Mensal</option>
            </select>

            {billingFrequency === "WEEKLY" && (
              <label className="text-xs text-gray-500 space-y-1 block">
                Dia da semana
                <select name="billingDayOfWeek" defaultValue={contract.billingDayOfWeek ?? ""} className={inputClass}>
                  <option value="" disabled>
                    Selecione o dia
                  </option>
                  {WEEKDAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {weekdayLabel(d)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {billingFrequency === "MONTHLY" && (
              <label className="text-xs text-gray-500 space-y-1 block">
                Dia do mês
                <select name="billingDayOfMonth1" defaultValue={contract.billingDayOfMonth1 ?? ""} className={inputClass}>
                  <option value="" disabled>
                    Selecione o dia
                  </option>
                  {MONTH_DAY_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      Dia {d}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {billingFrequency === "BIWEEKLY" && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-gray-500 space-y-1 block">
                  1º dia do mês
                  <select name="billingDayOfMonth1" defaultValue={contract.billingDayOfMonth1 ?? ""} className={inputClass}>
                    <option value="" disabled>
                      Dia
                    </option>
                    {MONTH_DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        Dia {d}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-gray-500 space-y-1 block">
                  2º dia do mês
                  <select name="billingDayOfMonth2" defaultValue={contract.billingDayOfMonth2 ?? ""} className={inputClass}>
                    <option value="" disabled>
                      Dia
                    </option>
                    {MONTH_DAY_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        Dia {d}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </div>

          <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Serviços contratados</p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="includesSocialMedia"
                  checked={includesSocialMedia}
                  onChange={(e) => setIncludesSocialMedia(e.target.checked)}
                />
                Social Media (posts, stories e reels)
              </label>
              {includesSocialMedia && (
                <div className="grid grid-cols-3 gap-2 pl-6">
                  <Input
                    name="socialNetworksCount"
                    type="number"
                    min={0}
                    placeholder="Nº redes"
                    defaultValue={contract.socialNetworksCount ?? ""}
                  />
                  <Input
                    name="postsPerWeek"
                    type="number"
                    min={0}
                    placeholder="Posts/semana"
                    defaultValue={contract.postsPerWeek ?? ""}
                  />
                  <Input
                    name="reelsPerWeek"
                    type="number"
                    min={0}
                    placeholder="Reels/semana"
                    defaultValue={contract.reelsPerWeek ?? ""}
                  />
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="includesGoogleAds"
                checked={includesGoogleAds}
                onChange={(e) => setIncludesGoogleAds(e.target.checked)}
              />
              Google Ads
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="includesMenuMgmt"
                  checked={includesMenuMgmt}
                  onChange={(e) => setIncludesMenuMgmt(e.target.checked)}
                />
                Gerenciamento de Cardápio Digital
              </label>
              {includesMenuMgmt && (
                <div className="flex flex-wrap gap-3 pl-6">
                  {MENU_PLATFORMS.map((platform) => (
                    <label key={platform} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={menuPlatforms.includes(platform)}
                        onChange={() => toggleMenuPlatform(platform)}
                      />
                      {platform}
                    </label>
                  ))}
                  <input type="hidden" name="menuPlatforms" value={menuPlatforms.join(",")} />
                </div>
              )}
            </div>
          </div>

          <textarea
            name="notes"
            placeholder="Observações internas (opcional)"
            rows={2}
            defaultValue={contract.notes || ""}
            className={inputClass + " resize-none"}
          />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
