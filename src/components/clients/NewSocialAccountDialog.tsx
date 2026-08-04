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
import { createSocialAccount } from "@/app/actions/social";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

export function NewSocialAccountDialog({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          Nova Rede
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Rede Social</DialogTitle>
        </DialogHeader>
        <form action={createSocialAccount} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="clientId" value={clientId} />
          <select name="platform" defaultValue="INSTAGRAM" className={inputClass}>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
            <option value="TIKTOK">TikTok</option>
            <option value="LINKEDIN">LinkedIn</option>
            <option value="YOUTUBE">YouTube</option>
            <option value="TWITTER">X / Twitter</option>
            <option value="OTHER">Outra</option>
          </select>
          <Input name="handle" placeholder="@usuario" required />
          <Input name="url" placeholder="Link do perfil (opcional)" />
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Adicionar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
