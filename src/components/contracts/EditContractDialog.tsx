"use client";

import { useState } from "react";
import { Pencil, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BillingFrequency } from "@prisma/client";
import { updateContract } from "@/app/actions/contracts";
import { generateContractText } from "@/lib/contract-template";
import { billingScheduleText, weekdayLabel } from "@/lib/billing";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  content: string | null;
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

interface Props {
  contract: ContractData;
  clientName: string;
  agencyName: string;
}

export function EditContractDialog({ contract, clientName, agencyName }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(contract.value));
  const [startDate, setStartDate] = useState(contract.startDate.toISOString().slice(0, 10));
  const [billingFrequency, setBillingFrequency] = useState(contract.billingFrequency);
  const [billingDayOfWeek, setBillingDayOfWeek] = useState(
    contract.billingDayOfWeek != null ? String(contract.billingDayOfWeek) : ""
  );
  const [billingDayOfMonth1, setBillingDayOfMonth1] = useState(
    contract.billingDayOfMonth1 != null ? String(contract.billingDayOfMonth1) : ""
  );
  const [billingDayOfMonth2, setBillingDayOfMonth2] = useState(
    contract.billingDayOfMonth2 != null ? String(contract.billingDayOfMonth2) : ""
  );
  const [content, setContent] = useState(contract.content || "");

  const [includesSocialMedia, setIncludesSocialMedia] = useState(contract.includesSocialMedia);
  const [socialNetworksCount, setSocialNetworksCount] = useState(
    contract.socialNetworksCount != null ? String(contract.socialNetworksCount) : ""
  );
  const [postsPerWeek, setPostsPerWeek] = useState(contract.postsPerWeek != null ? String(contract.postsPerWeek) : "");
  const [reelsPerWeek, setReelsPerWeek] = useState(contract.reelsPerWeek != null ? String(contract.reelsPerWeek) : "");
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

  function handleUpdateTemplate() {
    if (!value || !startDate) {
      alert("Preencha o valor e a data de início antes de atualizar o texto.");
      return;
    }
    setContent(
      generateContractText({
        clienteEmpresa: clientName,
        agencia: agencyName,
        valor: formatCurrency(Number(value)),
        scheduleText: billingScheduleText({
          frequency: billingFrequency as BillingFrequency,
          dayOfWeek: billingDayOfWeek ? Number(billingDayOfWeek) : null,
          dayOfMonth1: billingDayOfMonth1 ? Number(billingDayOfMonth1) : null,
          dayOfMonth2: billingDayOfMonth2 ? Number(billingDayOfMonth2) : null,
        }),
        dataAssinatura: formatDate(new Date(startDate)),
        services: {
          includesSocialMedia,
          postsPerWeek: postsPerWeek ? Number(postsPerWeek) : undefined,
          reelsPerWeek: reelsPerWeek ? Number(reelsPerWeek) : undefined,
          socialNetworksCount: socialNetworksCount ? Number(socialNetworksCount) : undefined,
          includesGoogleAds,
          includesMenuMgmt,
          menuPlatforms,
        },
      })
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
            <Input
              name="value"
              type="number"
              step="0.01"
              placeholder="Valor mensal (R$)"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
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
              <Input name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
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
                <select
                  name="billingDayOfWeek"
                  value={billingDayOfWeek}
                  onChange={(e) => setBillingDayOfWeek(e.target.value)}
                  className={inputClass}
                >
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
                <select
                  name="billingDayOfMonth1"
                  value={billingDayOfMonth1}
                  onChange={(e) => setBillingDayOfMonth1(e.target.value)}
                  className={inputClass}
                >
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
                  <select
                    name="billingDayOfMonth1"
                    value={billingDayOfMonth1}
                    onChange={(e) => setBillingDayOfMonth1(e.target.value)}
                    className={inputClass}
                  >
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
                  <select
                    name="billingDayOfMonth2"
                    value={billingDayOfMonth2}
                    onChange={(e) => setBillingDayOfMonth2(e.target.value)}
                    className={inputClass}
                  >
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
                  <label className="text-[11px] text-gray-500 space-y-1">
                    Nº redes
                    <Input
                      name="socialNetworksCount"
                      type="number"
                      min={0}
                      value={socialNetworksCount}
                      onChange={(e) => setSocialNetworksCount(e.target.value)}
                    />
                  </label>
                  <label className="text-[11px] text-gray-500 space-y-1">
                    Posts/semana
                    <Input
                      name="postsPerWeek"
                      type="number"
                      min={0}
                      value={postsPerWeek}
                      onChange={(e) => setPostsPerWeek(e.target.value)}
                    />
                  </label>
                  <label className="text-[11px] text-gray-500 space-y-1">
                    Reels/semana
                    <Input
                      name="reelsPerWeek"
                      type="number"
                      min={0}
                      value={reelsPerWeek}
                      onChange={(e) => setReelsPerWeek(e.target.value)}
                    />
                  </label>
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

          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={handleUpdateTemplate}>
            <Sparkles className="h-3.5 w-3.5" />
            Atualizar Texto do Contrato com os Serviços Selecionados
          </Button>
          <p className="text-[11px] text-gray-400 -mt-2">
            Isso substitui o texto abaixo pelo modelo padrão com os serviços marcados acima. Se você já
            personalizou o texto manualmente, revise antes de salvar.
          </p>

          <textarea
            name="content"
            placeholder="O texto do contrato aparece aqui — você pode editar livremente antes de salvar"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={inputClass + " resize-y font-mono text-xs leading-relaxed"}
          />

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
