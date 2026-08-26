"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteOperationalCost } from "@/app/actions/costs";

export function DeleteCostButton({ costId, recurring }: { costId: string; recurring?: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        const message = recurring
          ? "Esse é um custo mensal. Remover também para as próximas repetições — os meses já lançados continuam no histórico. Confirmar?"
          : "Remover esse lançamento de custo?";
        if (confirm(message)) {
          const formData = new FormData();
          formData.set("id", costId);
          startTransition(() => deleteOperationalCost(formData));
        }
      }}
      disabled={isPending}
      className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Remover"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
