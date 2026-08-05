"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateClientBilling } from "@/app/actions/billing";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const frequencyLabel: Record<string, string> = {
  NONE: "Não configurado",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

interface Props {
  clientId: string;
  contractValue: number | null;
  billingFrequency: string;
  nextBillingDate: Date | null;
}

export function ClientBillingForm({ clientId, contractValue, billingFrequency, nextBillingDate }: Props) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="space-y-2">
        <div>
          <span className="text-2xl font-bold text-gray-900">
            {contractValue != null ? formatCurrency(contractValue) : "—"}
          </span>
          <p className="text-xs text-gray-400 mt-0.5">Valor do contrato</p>
        </div>
        <div className="text-sm text-gray-600">
          Recebimento: <span className="font-medium">{frequencyLabel[billingFrequency] || billingFrequency}</span>
        </div>
        {nextBillingDate && (
          <div className="text-sm text-gray-600">
            Próximo vencimento: <span className="font-medium">{formatDate(nextBillingDate)}</span>
          </div>
        )}
        <Button variant="outline" size="sm" className="gap-1.5 mt-1" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
          Configurar Recebimento
        </Button>
      </div>
    );
  }

  return (
    <form
      action={async (formData) => {
        await updateClientBilling(formData);
        setEditing(false);
      }}
      className="space-y-3"
    >
      <input type="hidden" name="clientId" value={clientId} />
      <Input
        name="contractValue"
        type="number"
        step="0.01"
        placeholder="Valor (R$)"
        defaultValue={contractValue ?? ""}
      />
      <select name="billingFrequency" defaultValue={billingFrequency} className={inputClass}>
        <option value="NONE">Sem recebimento programado</option>
        <option value="WEEKLY">Semanal</option>
        <option value="BIWEEKLY">Quinzenal</option>
        <option value="MONTHLY">Mensal</option>
      </select>
      <Input
        name="nextBillingDate"
        type="date"
        defaultValue={nextBillingDate ? new Date(nextBillingDate).toISOString().slice(0, 10) : ""}
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700">
          Salvar
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
