"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";
import { refreshFollowerCount } from "@/app/actions/social";

export function RefreshFollowersButton({ socialAccountId, clientId }: { socialAccountId: string; clientId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    const formData = new FormData();
    formData.set("socialAccountId", socialAccountId);
    formData.set("clientId", clientId);
    startTransition(async () => {
      try {
        await refreshFollowerCount(formData);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao atualizar.");
      }
    });
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        title="Atualizar número de seguidores agora"
        className="h-6 w-6 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
      </button>
      {error && <span className="text-[11px] text-red-500 dark:text-red-400">{error}</span>}
    </span>
  );
}
