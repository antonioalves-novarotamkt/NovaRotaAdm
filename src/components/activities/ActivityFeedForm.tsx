"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createActivity } from "@/app/actions/activities";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

const today = new Date().toISOString().slice(0, 10);

export function ActivityFeedForm({ clients, defaultClientId }: { clients: ClientOption[]; defaultClientId?: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createActivity(formData);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-3 gap-3">
        <select name="clientId" required defaultValue={defaultClientId || ""} className={inputClass + " col-span-2"}>
          <option value="" disabled>
            Selecione o cliente
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.company || client.name}
            </option>
          ))}
        </select>
        <input type="date" name="date" defaultValue={today} className={inputClass} />
      </div>
      <textarea
        name="description"
        placeholder="O que foi feito para este cliente hoje..."
        rows={3}
        required
        className={inputClass + " resize-none"}
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700">
          <Send className="h-3.5 w-3.5" />
          Publicar
        </Button>
      </div>
    </form>
  );
}
