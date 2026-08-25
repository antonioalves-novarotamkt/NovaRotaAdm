"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updatePostMetrics, refreshPostMetrics } from "@/app/actions/posts";

interface Props {
  postId: string;
  postUrl: string | null;
  instagramViews: number | null;
  instagramLikes: number | null;
  instagramComments: number | null;
  instagramShares: number | null;
  facebookViews: number | null;
  facebookLikes: number | null;
  facebookShares: number | null;
}

export function EditPostMetrics({
  postId,
  postUrl,
  instagramViews,
  instagramLikes,
  instagramComments,
  instagramShares,
  facebookViews,
  facebookLikes,
  facebookShares,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRefresh() {
    setError(null);
    const formData = new FormData();
    formData.set("id", postId);
    startTransition(async () => {
      try {
        await refreshPostMetrics(formData);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar métricas.");
      }
    });
  }

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

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={handleRefresh}
            disabled={isPending || !postUrl}
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Atualizar automaticamente (Instagram)
          </Button>
          {!postUrl && (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 -mt-2">
              Adicione o link do post abaixo pra poder atualizar automaticamente.
            </p>
          )}
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>

        <form action={updatePostMetrics} onSubmit={() => setOpen(false)} className="space-y-4 pt-2 border-t">
          <input type="hidden" name="id" value={postId} />

          <Input name="postUrl" placeholder="Link do post no Instagram" defaultValue={postUrl ?? ""} />

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Instagram <span className="font-normal normal-case text-gray-400 dark:text-gray-500">(opcional)</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Input name="instagramViews" type="number" min={0} placeholder="Views" defaultValue={instagramViews ?? ""} />
              <Input name="instagramLikes" type="number" min={0} placeholder="Curtidas" defaultValue={instagramLikes ?? ""} />
              <Input name="instagramComments" type="number" min={0} placeholder="Comentários" defaultValue={instagramComments ?? ""} />
              <Input name="instagramShares" type="number" min={0} placeholder="Compart." defaultValue={instagramShares ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
              Facebook <span className="font-normal normal-case text-gray-400 dark:text-gray-500">(opcional)</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Input name="facebookViews" type="number" min={0} placeholder="Views" defaultValue={facebookViews ?? ""} />
              <Input name="facebookLikes" type="number" min={0} placeholder="Curtidas" defaultValue={facebookLikes ?? ""} />
              <Input name="facebookShares" type="number" min={0} placeholder="Compart." defaultValue={facebookShares ?? ""} />
            </div>
          </div>

          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Preencha só as redes em que o cliente está presente — nenhum campo é obrigatório.
          </p>

          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
