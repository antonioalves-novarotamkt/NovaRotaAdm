"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteInvoice } from "@/app/actions/extra-charges";

export function DeleteInvoiceButton({ id, number, paid }: { id: string; number: string; paid: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const message = paid
      ? `Apagar a fatura ${number}? Ela já tem baixa registrada — o valor sai do histórico de recebimentos e da receita. Essa ação não pode ser desfeita.`
      : `Apagar a fatura ${number}? Essa ação não pode ser desfeita.`;
    if (!confirm(message)) return;

    startTransition(async () => {
      const result = await deleteInvoice(id);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
      title="Apagar fatura"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
