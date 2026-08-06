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
import { updateClient } from "@/app/actions/clients";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const MENU_PLATFORMS = ["iFood", "Keeta", "99Food", "App próprio"];

interface ClientData {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  status: string;
  notes: string | null;
  contractValue: number | null;
  clientSince: Date | null;
  createdAt: Date;
  includesSocialMedia: boolean;
  postsPerWeek: number | null;
  storiesPerWeek: number | null;
  reelsPerWeek: number | null;
  socialNetworksCount: number | null;
  includesGoogleAds: boolean;
  includesMenuMgmt: boolean;
  menuPlatforms: string | null;
}

export function EditClientDialog({ client }: { client: ClientData }) {
  const [open, setOpen] = useState(false);
  const [includesSocialMedia, setIncludesSocialMedia] = useState(client.includesSocialMedia);
  const [includesGoogleAds, setIncludesGoogleAds] = useState(client.includesGoogleAds);
  const [includesMenuMgmt, setIncludesMenuMgmt] = useState(client.includesMenuMgmt);
  const [menuPlatforms, setMenuPlatforms] = useState<string[]>(
    client.menuPlatforms ? client.menuPlatforms.split(",").filter(Boolean) : []
  );

  function toggleMenuPlatform(platform: string) {
    setMenuPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  }

  const clientSinceValue = (client.clientSince || client.createdAt).toISOString().slice(0, 10);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
        </DialogHeader>
        <form action={updateClient} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="id" value={client.id} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="name" placeholder="Nome do contato" defaultValue={client.name} required />
            <Input name="company" placeholder="Empresa" defaultValue={client.company || ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="email" type="email" placeholder="Email" defaultValue={client.email} required />
            <Input name="phone" placeholder="Telefone" defaultValue={client.phone || ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="address" placeholder="Endereço" defaultValue={client.address || ""} />
            <Input name="website" placeholder="Site" defaultValue={client.website || ""} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input name="city" placeholder="Cidade" defaultValue={client.city || ""} />
            <Input name="state" placeholder="Estado (UF)" maxLength={2} defaultValue={client.state || ""} />
            <select name="status" defaultValue={client.status} className={inputClass}>
              <option value="ACTIVE">Ativo</option>
              <option value="PROSPECT">Prospect</option>
              <option value="INACTIVE">Inativo</option>
              <option value="CHURNED">Perdido</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input name="contractValue" type="number" step="0.01" placeholder="Valor contrato (R$)" defaultValue={client.contractValue ?? ""} />
            <label className="text-xs text-gray-500 space-y-1">
              Cliente desde
              <Input name="clientSince" type="date" defaultValue={clientSinceValue} />
            </label>
          </div>
          <textarea
            name="notes"
            placeholder="Observações"
            rows={2}
            defaultValue={client.notes || ""}
            className={inputClass + " resize-none"}
          />

          <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Produtos Contratados</p>

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
                <div className="grid grid-cols-4 gap-2 pl-6">
                  <Input
                    name="socialNetworksCount"
                    type="number"
                    min={0}
                    placeholder="Nº redes"
                    defaultValue={client.socialNetworksCount ?? ""}
                  />
                  <Input
                    name="postsPerWeek"
                    type="number"
                    min={0}
                    placeholder="Posts/sem"
                    defaultValue={client.postsPerWeek ?? ""}
                  />
                  <Input
                    name="storiesPerWeek"
                    type="number"
                    min={0}
                    placeholder="Stories/sem"
                    defaultValue={client.storiesPerWeek ?? ""}
                  />
                  <Input
                    name="reelsPerWeek"
                    type="number"
                    min={0}
                    placeholder="Reels/sem"
                    defaultValue={client.reelsPerWeek ?? ""}
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

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
