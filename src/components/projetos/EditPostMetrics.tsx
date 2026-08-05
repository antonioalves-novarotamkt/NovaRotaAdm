"use client";

import { useState } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updatePostMetrics } from "@/app/actions/posts";

interface Props {
  postId: string;
  views: number | null;
  likes: number | null;
  shares: number | null;
}

export function EditPostMetrics({ postId, views, likes, shares }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
          title="Editar métricas"
        >
          <BarChart3 className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Métricas do Post</DialogTitle>
        </DialogHeader>
        <form action={updatePostMetrics} onSubmit={() => setOpen(false)} className="space-y-3">
          <input type="hidden" name="id" value={postId} />
          <label className="text-xs text-gray-500 space-y-1 block">
            Visualizações
            <Input name="views" type="number" min={0} defaultValue={views ?? ""} />
          </label>
          <label className="text-xs text-gray-500 space-y-1 block">
            Curtidas
            <Input name="likes" type="number" min={0} defaultValue={likes ?? ""} />
          </label>
          <label className="text-xs text-gray-500 space-y-1 block">
            Compartilhamentos
            <Input name="shares" type="number" min={0} defaultValue={shares ?? ""} />
          </label>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
