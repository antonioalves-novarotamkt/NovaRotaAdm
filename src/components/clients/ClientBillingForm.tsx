"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { updateClientBilling } from "@/app/actions/billing";
import { weekdayLabel } from "@/lib/billing";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

const frequencyLabel: Record<string, string> = {
  NONE: "Não configurado",
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MONTHLY: "Mensal",
};

const weekdayOptions = [0, 1, 2, 3, 4, 5, 6];
const monthDayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

interface Props {
  clientId: string;
  contractValue: number | null;
  billingFrequency: string;
  nextBillingDate: Date | null;
  billingDayOfWeek: number | null;
  billingDayOfMonth1: number | null;
  billingDayOfMonth2: number | null;
}

export function ClientBillingForm({
  clientId,
  contractValue,
  billingFrequency,
  nextBillingDate,
  billingDayOfWeek,
  billingDayOfMonth1,
  billingDayOfMonth2,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [frequency, setFrequency] = useState(billingFrequency);

  if (!editing) {
    let scheduleText = "";
    if (billingFrequency === "WEEKLY" && billingDayOfWeek != null) {
      scheduleText = `Toda ${weekdayLabel(billingDayOfWeek)}`;
    } else if (billingFrequency === "MONTHLY" && billingDayOfMonth1 != null) {
      scheduleText = `Todo dia ${billingDayOfMonth1} do mês`;
    } else if (billingFrequency === "BIWEEKLY" && billingDayOfMonth1 != null && billingDayOfMonth2 != null) {
      scheduleText = `Dias ${billingDayOfMonth1} e ${billingDayOfMonth2} de cada mês`;
    }

    return (
      <div className="space-y-2">
        <div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {contractValue != null ? formatCurrency(contractValue) : "—"}
          </span>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Valor do contrato</p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Recebimento: <span className="font-medium">{frequencyLabel[billingFrequency] || billingFrequency}</span>
        </div>
        {scheduleText && <div className="text-sm text-gray-600 dark:text-gray-300">{scheduleText}</div>}
        {nextBillingDate && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
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
      <select
        name="billingFrequency"
        value={frequency}
        onChange={(e) => setFrequency(e.target.value)}
        className={inputClass}
      >
        <option value="NONE">Sem recebimento programado</option>
        <option value="WEEKLY">Semanal</option>
        <option value="BIWEEKLY">Quinzenal</option>
        <option value="MONTHLY">Mensal</option>
      </select>

      {frequency === "WEEKLY" && (
        <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1 block">
          Dia da semana que repete
          <select name="billingDayOfWeek" defaultValue={billingDayOfWeek ?? ""} className={inputClass}>
            <option value="" disabled>
              Selecione o dia
            </option>
            {weekdayOptions.map((d) => (
              <option key={d} value={d}>
                {weekdayLabel(d)}
              </option>
            ))}
          </select>
        </label>
      )}

      {frequency === "MONTHLY" && (
        <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1 block">
          Dia do mês que o cliente paga
          <select name="billingDayOfMonth1" defaultValue={billingDayOfMonth1 ?? ""} className={inputClass}>
            <option value="" disabled>
              Selecione o dia
            </option>
            {monthDayOptions.map((d) => (
              <option key={d} value={d}>
                Dia {d}
              </option>
            ))}
          </select>
        </label>
      )}

      {frequency === "BIWEEKLY" && (
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1 block">
            1º dia do mês
            <select name="billingDayOfMonth1" defaultValue={billingDayOfMonth1 ?? ""} className={inputClass}>
              <option value="" disabled>
                Dia
              </option>
              {monthDayOptions.map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1 block">
            2º dia do mês
            <select name="billingDayOfMonth2" defaultValue={billingDayOfMonth2 ?? ""} className={inputClass}>
              <option value="" disabled>
                Dia
              </option>
              {monthDayOptions.map((d) => (
                <option key={d} value={d}>
                  Dia {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        A próxima data de vencimento é calculada automaticamente a partir dessa regra.
      </p>

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
