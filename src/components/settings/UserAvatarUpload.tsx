"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateOwnAvatar } from "@/app/actions/users";

export function UserAvatarUpload({ currentUrl, initials }: { currentUrl?: string | null; initials: string }) {
  const router = useRouter();
  const { update } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Erro ao enviar imagem.");
      }

      await updateOwnAvatar(result.url);
      await update();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      {currentUrl ? (
        <div className="relative h-16 w-16 rounded-full overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
          <Image src={currentUrl} alt="Foto de perfil" fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="h-16 w-16 rounded-full bg-orange-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
          {initials}
        </div>
      )}
      <div className="ml-auto">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Alterar Foto"}
        </Button>
        {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{error}</p>}
      </div>
    </div>
  );
}
