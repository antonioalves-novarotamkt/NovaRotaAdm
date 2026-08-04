"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useRouter } from "next/navigation";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClientPost } from "@/app/actions/posts";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

const currentMonth = new Date().toISOString().slice(0, 7);
const today = new Date().toISOString().slice(0, 10);

export function UploadPostForm({ clients, defaultClientId }: { clients: ClientOption[]; defaultClientId?: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Selecione uma imagem.");
      return;
    }

    const formData = new FormData(form);
    const clientId = String(formData.get("clientId") || "");
    const month = String(formData.get("month") || "");
    const caption = String(formData.get("caption") || "");
    const postDate = String(formData.get("postDate") || "");

    if (!clientId) {
      setError("Selecione o cliente.");
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      await createClientPost({
        clientId,
        month,
        imageUrl: blob.url,
        caption: caption || undefined,
        postDate: postDate || undefined,
      });

      setOpen(false);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700" disabled={clients.length === 0}>
          <Upload className="h-4 w-4" />
          Enviar Post
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Print do Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select name="clientId" required defaultValue={defaultClientId || ""} className={inputClass}>
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company || client.name}
              </option>
            ))}
          </select>
          <Input name="month" type="month" defaultValue={currentMonth} required />
          <Input name="postDate" type="date" defaultValue={today} placeholder="Data do post" />
          <input ref={fileInputRef} type="file" name="file" accept="image/*" required className="text-sm" />
          <Input name="caption" placeholder="Legenda / descrição (opcional)" />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
