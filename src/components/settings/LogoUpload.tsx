"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoUpload({
  currentUrl,
  onUploaded,
  label = "Alterar Logo",
}: {
  currentUrl?: string | null;
  onUploaded: (url: string) => Promise<void>;
  label?: string;
}) {
  const router = useRouter();
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

      await onUploaded(result.url);
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
        <div className="relative h-16 w-16 rounded-lg border border-gray-200 overflow-hidden bg-white">
          <Image src={currentUrl} alt="Logo" fill className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="h-16 w-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300">
          <Upload className="h-5 w-5" />
        </div>
      )}
      <div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : label}
        </Button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    </div>
  );
}
