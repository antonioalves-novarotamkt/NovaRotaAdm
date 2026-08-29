"use client";

import { useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { deleteSocialAccount } from "@/app/actions/social";

export function DeleteSocialAccountButton({ id, label }: { id: string; label: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Remover "${label}"? As métricas registradas nessa conta também serão apagadas.`)) return;
    const formData = new FormData();
    formData.set("id", id);
    startTransition(() => deleteSocialAccount(formData));
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="h-7 w-7 shrink-0 rounded-md flex items-center justify-center text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Remover rede social"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
    </button>
  );
}
