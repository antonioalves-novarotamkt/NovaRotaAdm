"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regenerateClientApprovalLink } from "@/app/actions/task-approval";

export function ClientApprovalLinkCard({ clientId, approvalToken }: { clientId: string; approvalToken: string | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const url = approvalToken && typeof window !== "undefined" ? `${window.location.origin}/aprovacao/${approvalToken}` : "";

  function handleGenerate() {
    if (approvalToken && !confirm("Gerar um novo link invalida o link antigo — o cliente precisará do novo. Continuar?")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("clientId", clientId);
      await regenerateClientApprovalLink(fd);
      router.refresh();
    });
  }

  async function handleCopy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(url);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Link exclusivo onde o cliente vê e aprova arte e legenda dos posts/stories/reels, sem precisar de login.
      </p>
      {url && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 overflow-hidden">
          <span className="truncate flex-1">{url}</span>
        </div>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {url && (
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copiado!" : "Copiar link"}
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" className="gap-1.5" disabled={isPending} onClick={handleGenerate}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {approvalToken ? "Gerar novo link" : "Gerar link"}
        </Button>
      </div>
    </div>
  );
}
