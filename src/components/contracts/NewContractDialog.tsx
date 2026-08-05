"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createContract } from "@/app/actions/contracts";
import { generateContractText } from "@/lib/contract-template";
import { formatCurrency, formatDate } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

const MENU_PLATFORMS = ["iFood", "Keeta", "99Food", "App próprio"];

export function NewContractDialog({ clients, agencyName }: { clients: ClientOption[]; agencyName: string }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [paymentDay, setPaymentDay] = useState("");
  const [content, setContent] = useState("");

  const [includesSocialMedia, setIncludesSocialMedia] = useState(true);
  const [postsPerWeek, setPostsPerWeek] = useState("");
  const [reelsPerWeek, setReelsPerWeek] = useState("");
  const [socialNetworksCount, setSocialNetworksCount] = useState("");
  const [includesGoogleAds, setIncludesGoogleAds] = useState(false);
  const [includesMenuMgmt, setIncludesMenuMgmt] = useState(false);
  const [menuPlatforms, setMenuPlatforms] = useState<string[]>([]);

  function toggleMenuPlatform(platform: string) {
    setMenuPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  function handleUseTemplate() {
    const client = clients.find((c) => c.id === clientId);
    if (!client || !value || !startDate) {
      alert("Selecione o cliente, valor e data de início antes de gerar o modelo.");
      return;
    }
    setContent(
      generateContractText({
        clienteEmpresa: client.company || client.name,
        agencia: agencyName,
        valor: formatCurrency(Number(value)),
        paymentDay: paymentDay ? Number(paymentDay) : undefined,
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
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700" disabled={clients.length === 0}>
          <Plus className="h-4 w-4" />
          Novo Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        <form action={createContract} onSubmit={() => setOpen(false)} className="space-y-3">
          <Input name="title" placeholder="Título do contrato" required />
          <select
            name="clientId"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company || client.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="value"
              type="number"
              step="0.01"
              placeholder="Valor mensal (R$)"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <select name="status" defaultValue="ACTIVE" className={inputClass}>
              <option value="ACTIVE">Ativo</option>
              <option value="DRAFT">Rascunho</option>
              <option value="EXPIRED">Expirado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500 space-y-1">
              Início
              <Input name="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="text-xs text-gray-500 space-y-1">
              Dia do pagamento (opcional)
              <Input
                name="paymentDay"
                type="number"
                min={1}
                max={31}
                placeholder="Ex: 10"
                value={paymentDay}
                onChange={(e) => setPaymentDay(e.target.value)}
              />
            </label>
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
                    value={socialNetworksCount}
                    onChange={(e) => setSocialNetworksCount(e.target.value)}
                  />
                  <Input
                    name="postsPerWeek"
                    type="number"
                    min={0}
                    placeholder="Posts/semana"
                    value={postsPerWeek}
                    onChange={(e) => setPostsPerWeek(e.target.value)}
                  />
                  <Input
                    name="reelsPerWeek"
                    type="number"
                    min={0}
                    placeholder="Reels/semana"
                    value={reelsPerWeek}
                    onChange={(e) => setReelsPerWeek(e.target.value)}
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

          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={handleUseTemplate}>
            <Sparkles className="h-3.5 w-3.5" />
            Gerar Texto do Contrato
          </Button>

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
            className={inputClass + " resize-none"}
          />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar Contrato
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
