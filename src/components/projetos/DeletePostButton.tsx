"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteClientPost } from "@/app/actions/posts";

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (confirm("Remover esse post?")) {
          startTransition(() => deleteClientPost(postId));
        }
      }}
      disabled={isPending}
      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors disabled:opacity-50"
      title="Remover"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
