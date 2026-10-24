"use client";

import { useMemo, useState, useTransition } from "react";
import { Clock, Gauge, DollarSign, Timer, Plus, Trash2, RotateCcw, Save } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { saveCapacityConfig, setClientMonthlyHours } from "@/app/actions/capacity";
import {
  capacityBudget,
  estimateClientHours,
  type CapacityConfig,
  type CapacityTimes,
  type ClientScope,
} from "@/lib/capacity";

type ClientRow = {
  id: string;
  name: string;
  monthlyValue: number;
  monthlyHours: number | null;
  scope: ClientScope;
  estimate: number;
};

const inputClass =
  "h-9 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-500/40";
const thClass = "px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider";
const LIMIT_OK = 70;

const fmtH = (h: number) => `${(Math.round(h * 10) / 10).toLocaleString("pt-BR")} h`;
const toNum = (v: string) => {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const TIME_FIELDS: { key: keyof CapacityTimes; label: string; unit: string }[] = [
  { key: "storyMin", label: "Story", unit: "min cada" },
  { key: "postMin", label: "Post", unit: "min cada" },
  { key: "reelsMin", label: "Reels", unit: "min cada" },
  { key: "articleMin", label: "Artigo de blog", unit: "min cada" },
  { key: "planningHours", label: "Planejamento e relatório de redes", unit: "h por cliente/mês" },
  { key: "appMinPerWeek", label: "Gestão de cada app de delivery", unit: "min por semana" },
  { key: "deliveryReportHours", label: "Relatório de delivery", unit: "h por cliente/mês" },
  { key: "supportHours", label: "Atendimento (WhatsApp, aprovação, ajustes)", unit: "h por cliente/mês" },
];

export function CapacityCalculator({ initialConfig, clients }: { initialConfig: CapacityConfig; clients: ClientRow[] }) {
  const [config, setConfig] = useState<CapacityConfig>(initialConfig);
  const [dirty, setDirty] = useState(false);
  const [hours, setHours] = useState<Record<string, number | null>>(
    Object.fromEntries(clients.map((c) => [c.id, c.monthlyHours]))
  );
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const update = (patch: Partial<CapacityConfig>) => {
    setConfig((c) => ({ ...c, ...patch }));
    setDirty(true);
    setMessage("");
  };
  const updateTime = (key: keyof CapacityTimes, value: number) => update({ times: { ...config.times, [key]: value } });

  const budget = capacityBudget(config);

  const rows = useMemo(
    () =>
      clients.map((c) => {
        const estimate = estimateClientHours(c.scope, config.times);
        const manual = hours[c.id];
        const h = manual ?? estimate;
        return {
          ...c,
          estimate,
          manual,
          hours: h,
          rate: h > 0 ? c.monthlyValue / h : 0,
          fairPrice: h * config.hourRate,
        };
      }),
    [clients, hours, config.times, config.hourRate]
  );

  const used = rows.reduce((s, r) => s + r.hours, 0);
  const revenue = rows.reduce((s, r) => s + r.monthlyValue, 0);
  // Cliente sem horas (escopo vazio e nada digitado) fica fora da média e da diferença,
  // senão o valor dele entra como se fosse hora de graça.
  const withHours = rows.filter((r) => r.hours > 0);
  const revenueWithHours = withHours.reduce((s, r) => s + r.monthlyValue, 0);
  const fairRevenue = withHours.reduce((s, r) => s + r.fairPrice, 0);
  const missingHours = rows.length - withHours.length;
  const totalDiff = fairRevenue - revenueWithHours;
  const occupancy = budget.limit > 0 ? (used / budget.limit) * 100 : 0;
  const avgRate = used > 0 ? revenueWithHours / used : 0;
  const free = Math.max(0, budget.limit - used);
  const status =
    occupancy <= LIMIT_OK
      ? { label: "Com folga: cabe mais cliente", cls: "text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-500/10" }
      : occupancy <= 100
        ? { label: "No ponto, perto do limite", cls: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10" }
        : { label: "Acima do limite de qualidade", cls: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10" };
  // A barra vai até as horas para clientes; a marca laranja é o limite com qualidade.
  const scale = Math.max(budget.forClients, used, 1);

  function save() {
    startTransition(async () => {
      try {
        const clean = await saveCapacityConfig(config);
        setConfig(clean);
        setDirty(false);
        setMessage("Configurações salvas.");
      } catch {
        setMessage("Não foi possível salvar. Tente de novo.");
      }
    });
  }

  function saveHours(id: string, value: number | null) {
    setHours((h) => ({ ...h, [id]: value }));
    startTransition(async () => {
      try {
        await setClientMonthlyHours(id, value);
      } catch {
        setMessage("Não foi possível salvar as horas do cliente. Tente de novo.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi icon={Clock} tone="blue" label="Horas de clientes no mês" value={fmtH(used)} hint={`limite com qualidade: ${fmtH(budget.limit)}`} />
        <Kpi icon={Gauge} tone="orange" label="Ocupação" value={`${Math.round(occupancy)}%`}>
          <span className={cn("mt-1 inline-block text-[11px] font-medium px-2 py-0.5 rounded-full", status.cls)}>{status.label}</span>
        </Kpi>
        <Kpi icon={DollarSign} tone="green" label="Faturamento mensal (contratos)" value={formatCurrency(revenue)} hint={`pela sua hora seria ${formatCurrency(fairRevenue)}`} />
        <Kpi
          icon={Timer}
          tone="purple"
          label="Valor médio da sua hora"
          value={used > 0 ? formatCurrency(avgRate) : "—"}
          hint={`meta: ${formatCurrency(config.hourRate)}/h`}
          alert={used > 0 && avgRate < config.hourRate}
        />
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-2">
          <div className="relative h-5 rounded-md bg-gray-100 dark:bg-gray-800 overflow-hidden" role="img" aria-label={`Ocupação ${Math.round(occupancy)}%`}>
            <div
              className={cn("absolute inset-y-0 left-0 transition-all", used > budget.limit ? "bg-red-500" : "bg-[#003462] dark:bg-blue-400")}
              style={{ width: `${(used / scale) * 100}%` }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-orange-500" style={{ left: `${(budget.limit / scale) * 100}%` }} />
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Mês: {fmtH(budget.month)} · para clientes: {fmtH(budget.forClients)}</span>
            <span className="text-orange-600 dark:text-orange-400">marca laranja: limite com qualidade ({fmtH(budget.limit)})</span>
            <span>livres: {fmtH(free)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Horas e valor da hora */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Suas horas e valor da hora</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Mude e veja tudo recalcular. Clique em Salvar para guardar.</p>
            </div>
            <Field label="Horas de trabalho por semana" suffix="h" value={config.weekHours} onChange={(v) => update({ weekHours: v })} />
            <Field label="Prospecção, vendas e administrativo" suffix="%" value={config.adminPct} onChange={(v) => update({ adminPct: Math.min(90, v) })} />
            <Field label="Folga para qualidade e imprevistos" suffix="%" value={config.qualityPct} onChange={(v) => update({ qualityPct: Math.min(90, v) })} />
            <Field label="Valor da sua hora (meta)" prefix="R$" value={config.hourRate} onChange={(v) => update({ hourRate: v })} />
            <SaveBar dirty={dirty} pending={pending} message={message} onSave={save} />
          </CardContent>
        </Card>

        {/* Quanto ainda cabe */}
        <Card className="border-0 shadow-sm xl:col-span-2">
          <CardContent className="p-0">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Ainda cabem no mês</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Com {fmtH(free)} livres, quantos clientes novos de cada pacote cabem sem passar do limite. Edite os pacotes embaixo.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-y bg-gray-50 dark:bg-gray-900">
                    <th className={cn(thClass, "text-left")}>Pacote</th>
                    <th className={cn(thClass, "text-right")}>Cabem</th>
                    <th className={cn(thClass, "text-right")}>Horas</th>
                    <th className={cn(thClass, "text-right")}>Preço</th>
                    <th className={cn(thClass, "text-right")}>R$/hora</th>
                    <th className={cn(thClass, "text-right")}>Pela sua hora</th>
                  </tr>
                </thead>
                <tbody>
                  {config.packages.map((p, i) => {
                    const rate = p.hours > 0 ? p.price / p.hours : 0;
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                        <td className="px-4 py-2.5 text-right text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums">
                          {p.hours > 0 ? Math.floor(free / p.hours) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{fmtH(p.hours)}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{formatCurrency(p.price)}</td>
                        <td className={cn("px-4 py-2.5 text-right tabular-nums", rate && rate < config.hourRate ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-600 dark:text-gray-300")}>
                          {rate ? formatCurrency(rate) : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{formatCurrency(p.hours * config.hourRate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Horas por cliente */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Horas por cliente</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Clientes ativos. Sem horas digitadas, o sistema estima pelo escopo do cliente (posts, stories, reels e apps de delivery) com os tempos abaixo. Digite as horas reais quando souber: salva sozinho ao sair do campo.
              Contratos semanais viram mês com 4,33 semanas.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="border-y bg-gray-50 dark:bg-gray-900">
                  <th className={cn(thClass, "text-left")}>Cliente</th>
                  <th className={cn(thClass, "text-right")}>Valor/mês</th>
                  <th className={cn(thClass, "text-right w-40")}>Horas/mês</th>
                  <th className={cn(thClass, "text-right")}>R$/hora</th>
                  <th className={cn(thClass, "text-right")}>Pela sua hora</th>
                  <th className={cn(thClass, "text-right")}>Diferença</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                      Nenhum cliente ativo. Cadastre em Clientes para ver as horas aqui.
                    </td>
                  </tr>
                )}
                {rows.map((r) => {
                  const diff = r.fairPrice - r.monthlyValue;
                  const below = r.hours > 0 && r.rate < config.hourRate;
                  return (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{r.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {r.monthlyValue ? formatCurrency(r.monthlyValue) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center justify-end gap-1.5">
                          <input
                            key={`${r.id}-${r.manual ?? "est"}`}
                            type="number"
                            min={0}
                            step={0.5}
                            inputMode="decimal"
                            aria-label={`Horas por mês de ${r.name}`}
                            className={cn(inputClass, "w-20")}
                            defaultValue={r.manual ?? ""}
                            placeholder={String(r.estimate).replace(".", ",")}
                            onBlur={(e) => {
                              const v = e.target.value.trim();
                              const next = v === "" ? null : toNum(v);
                              if (next !== r.manual) saveHours(r.id, next);
                            }}
                          />
                          {r.manual == null ? (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400" title="Estimado pelo escopo">
                              est.
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => saveHours(r.id, null)}
                              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                              title={`Voltar para a estimativa (${fmtH(r.estimate)})`}
                              aria-label={`Voltar ${r.name} para a estimativa`}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className={cn("px-4 py-2.5 text-right tabular-nums", below ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-700 dark:text-gray-300")}>
                        {r.hours > 0 && r.monthlyValue ? formatCurrency(r.rate) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{formatCurrency(r.fairPrice)}</td>
                      {r.hours > 0 ? (
                        <td className={cn("px-4 py-2.5 text-right tabular-nums", diff > 0.5 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400")}>
                          {Math.abs(diff) < 0.5 ? "—" : diff > 0 ? `faltam ${formatCurrency(diff)}` : `+${formatCurrency(-diff)}`}
                        </td>
                      ) : (
                        <td className="px-4 py-2.5 text-right text-xs text-amber-700 dark:text-amber-400">digite as horas</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 font-semibold text-gray-900 dark:text-gray-100">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(revenue)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtH(used)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{used > 0 ? formatCurrency(avgRate) : "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(fairRevenue)}</td>
                    <td className={cn("px-4 py-3 text-right tabular-nums", totalDiff > 0.5 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400")}>
                      {Math.abs(totalDiff) < 0.5 ? "—" : totalDiff > 0 ? `faltam ${formatCurrency(totalDiff)}` : `+${formatCurrency(-totalDiff)}`}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          {missingHours > 0 && (
            <p className="px-5 py-3 text-xs text-amber-700 dark:text-amber-400 border-t">
              {missingHours === 1 ? "1 cliente está" : `${missingHours} clientes estão`} sem horas: o valor entra no faturamento, mas fica fora do valor médio da hora e da diferença até você digitar as horas.
            </p>
          )}
          <p className="px-5 py-3 text-xs text-gray-500 dark:text-gray-400 border-t">
            <b>Pela sua hora</b> = horas do cliente × valor da sua hora. <b>Diferença</b> mostra quanto falta no contrato para chegar nesse valor (vermelho) ou quanto ele paga acima (verde).
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Tempos */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tempo de cada peça</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Base da estimativa de horas dos clientes.</p>
            </div>
            {TIME_FIELDS.map((f) => (
              <div key={f.key} className="grid grid-cols-[minmax(0,1fr)_5.5rem_7rem] items-center gap-2">
                <label htmlFor={`t-${f.key}`} className="text-sm text-gray-700 dark:text-gray-300">{f.label}</label>
                <input
                  id={`t-${f.key}`}
                  type="number"
                  min={0}
                  step={f.unit.startsWith("h") ? 0.5 : 5}
                  inputMode="decimal"
                  className={inputClass}
                  value={config.times[f.key]}
                  onChange={(e) => updateTime(f.key, toNum(e.target.value))}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">{f.unit}</span>
              </div>
            ))}
            <SaveBar dirty={dirty} pending={pending} message={message} onSave={save} />
          </CardContent>
        </Card>

        {/* Pacotes */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Pacotes para o cálculo</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Horas por mês e preço de cada pacote que você vende.</p>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_6rem_2rem] gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <span>Pacote</span>
              <span className="text-right">Horas</span>
              <span className="text-right">Preço R$</span>
              <span />
            </div>
            {config.packages.map((p, i) => {
              const setPkg = (patch: Partial<typeof p>) =>
                update({ packages: config.packages.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
              return (
                <div key={i} className="grid grid-cols-[minmax(0,1fr)_4.5rem_6rem_2rem] items-center gap-2">
                  <input
                    aria-label="Nome do pacote"
                    className={cn(inputClass, "text-left")}
                    value={p.name}
                    maxLength={80}
                    onChange={(e) => setPkg({ name: e.target.value })}
                  />
                  <input aria-label={`Horas de ${p.name}`} type="number" min={0} step={0.5} className={inputClass} value={p.hours} onChange={(e) => setPkg({ hours: toNum(e.target.value) })} />
                  <input aria-label={`Preço de ${p.name}`} type="number" min={0} step={10} className={inputClass} value={p.price} onChange={(e) => setPkg({ price: toNum(e.target.value) })} />
                  <button
                    type="button"
                    className="h-9 w-8 flex items-center justify-center text-gray-400 hover:text-red-600"
                    onClick={() => update({ packages: config.packages.filter((_, j) => j !== i) })}
                    aria-label={`Remover ${p.name}`}
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => update({ packages: [...config.packages, { name: "Novo pacote", hours: 5, price: 500 }] })}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar pacote
            </Button>
            <SaveBar dirty={dirty} pending={pending} message={message} onSave={save} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, prefix, suffix }: { label: string; value: number; onChange: (v: number) => void; prefix?: string; suffix?: string }) {
  const id = "f-" + label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3">
      <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">{label}</label>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-xs text-gray-500 dark:text-gray-400">{prefix}</span>}
        <input id={id} type="number" min={0} step={1} inputMode="decimal" className={inputClass} value={value} onChange={(e) => onChange(toNum(e.target.value))} />
        {suffix && <span className="text-xs text-gray-500 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
}

function SaveBar({ dirty, pending, message, onSave }: { dirty: boolean; pending: boolean; message: string; onSave: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <Button type="button" size="sm" onClick={onSave} disabled={!dirty || pending} className="bg-orange-600 hover:bg-orange-700 text-white">
        <Save className="h-4 w-4 mr-1" /> {pending ? "Salvando…" : "Salvar"}
      </Button>
      <span className="text-xs text-gray-500 dark:text-gray-400">{dirty ? "Alterações não salvas" : message}</span>
    </div>
  );
}

const TONES = {
  blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  orange: "bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400",
  green: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
};

function Kpi({
  icon: Icon,
  tone,
  label,
  value,
  hint,
  alert,
  children,
}: {
  icon: typeof Clock;
  tone: keyof typeof TONES;
  label: string;
  value: string;
  hint?: string;
  alert?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", TONES[tone])}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className={cn("text-xl font-bold tabular-nums", alert ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100")}>{value}</p>
        {hint && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{hint}</p>}
        {children}
      </CardContent>
    </Card>
  );
}
