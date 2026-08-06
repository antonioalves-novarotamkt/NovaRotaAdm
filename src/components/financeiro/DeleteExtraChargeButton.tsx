"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteExtraCharge } from "@/app/actions/extra-charges";

export function DeleteExtraChargeButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Remover este recebimento?")) return;
        const formData = new FormData();
        formData.set("id", id);
        startTransition(() => deleteExtraCharge(formData));
      }}
      disabled={isPending}
      className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Remover"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
