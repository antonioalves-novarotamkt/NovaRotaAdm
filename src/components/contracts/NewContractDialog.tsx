"use client";

import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createContract } from "@/app/actions/contracts";
import { fillContractTemplate } from "@/lib/contract-template";
import { formatCurrency, formatDate } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface ClientOption {
  id: string;
  name: string;
  company: string | null;
}

const frequencyLabel: Record<string, string> = {
  WEEKLY: "semanal",
  BIWEEKLY: "quinzenal",
  MONTHLY: "mensal",
};

export function NewContractDialog({ clients, agencyName }: { clients: ClientOption[]; agencyName: string }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [value, setValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [frequency, setFrequency] = useState("MONTHLY");
  const [content, setContent] = useState("");

  function handleUseTemplate() {
    const client = clients.find((c) => c.id === clientId);
    if (!client || !value || !startDate) {
      alert("Selecione o cliente, valor e data de início antes de gerar o modelo.");
      return;
    }
    setContent(
      fillContractTemplate({
        clienteEmpresa: client.company || client.name,
        agencia: agencyName,
        valor: formatCurrency(Number(value)),
        dataInicio: formatDate(new Date(startDate)),
        dataFim: endDate ? formatDate(new Date(endDate)) : undefined,
        frequencia: frequencyLabel[frequency] || frequency,
        dataAssinatura: formatDate(new Date()),
      })
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700" disabled={clients.length === 0}>
          <Plus className="h-4 w-4" />
          Novo Contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        <form action={createContract} onSubmit={() => setOpen(false)} className="space-y-3">
          <Input name="title" placeholder="Título do contrato" required />
          <select
            name="clientId"
            required
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Selecione o cliente
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.company || client.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="value"
              type="number"
              step="0.01"
              placeholder="Valor (R$)"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <select name="status" defaultValue="ACTIVE" className={inputClass}>
              <option value="ACTIVE">Ativo</option>
              <option value="DRAFT">Rascunho</option>
              <option value="EXPIRED">Expirado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-gray-500 space-y-1">
              Início
              <Input name="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </label>
            <label className="text-xs text-gray-500 space-y-1">
              Fim (opcional)
              <Input name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </label>
          </div>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass}>
            <option value="WEEKLY">Pagamento semanal</option>
            <option value="BIWEEKLY">Pagamento quinzenal</option>
            <option value="MONTHLY">Pagamento mensal</option>
          </select>

          <Button type="button" variant="outline" size="sm" className="w-full gap-1.5" onClick={handleUseTemplate}>
            <Sparkles className="h-3.5 w-3.5" />
            Gerar Texto do Contrato (Modelo Padrão)
          </Button>

          <textarea
            name="content"
            placeholder="O texto do contrato aparece aqui — você pode editar livremente antes de salvar"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={inputClass + " resize-y font-mono text-xs leading-relaxed"}
          />

          <textarea
            name="notes"
            placeholder="Observações internas (opcional)"
            rows={2}
            className={inputClass + " resize-none"}
          />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
            Salvar Contrato
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
