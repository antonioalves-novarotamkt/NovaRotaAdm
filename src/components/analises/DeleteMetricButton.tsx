"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSocialMetric } from "@/app/actions/social";
import { deleteWebsiteMetric } from "@/app/actions/website";

export function DeleteMetricButton({ id, type }: { id: string; type: "social" | "website" }) {
  const [isPending, startTransition] = useTransition();
  const action = type === "social" ? deleteSocialMetric : deleteWebsiteMetric;

  return (
    <button
      onClick={() => {
        if (!confirm("Remover este registro?")) return;
        const formData = new FormData();
        formData.set("id", id);
        startTransition(() => action(formData));
      }}
      disabled={isPending}
      className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
      title="Remover"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
