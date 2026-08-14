"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteClientSale } from "@/app/actions/sales";

export function DeleteSaleButton({ saleId }: { saleId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (confirm("Remover esse registro de vendas?")) {
          const formData = new FormData();
          formData.set("id", saleId);
          startTransition(() => deleteClientSale(formData));
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
