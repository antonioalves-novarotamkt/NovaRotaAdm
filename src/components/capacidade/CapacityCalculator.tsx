"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { Clock, Gauge, DollarSign, Timer, Plus, Trash2, RotateCcw, Save, ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import { addWorkItems, deleteWorkItem, saveCapacityConfig, setClientMonthlyHours, updateWorkItem } from "@/app/actions/capacity";
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
  items: WorkItem[];
  scope: ClientScope;
  estimate: number;
};

type WorkItem = { id: string; name: string; quantity: number; minutes: number };

const itemsHours = (items: WorkItem[]) => items.reduce((s, i) => s + i.quantity * i.minutes, 0) / 60;

const inputClass =
  "h-9 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-orange-500/40";
const thClass = "px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider";
const LIMIT_OK = 70;

const fmtH = (h: number) => `${(Math.round(h * 10) / 10).toLocaleString("pt-BR")} h`;
const fmtQty = (n: number) => (Math.round(n * 10) / 10).toLocaleString("pt-BR");
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
  const [items, setItems] = useState<Record<string, WorkItem[]>>(Object.fromEntries(clients.map((c) => [c.id, c.items])));
  const [openClient, setOpenClient] = useState<string | null>(null);
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
        const list = items[c.id] || [];
        // Com atividades cadastradas, as horas são a soma delas; senão vale o digitado ou a estimativa.
        const h = list.length ? itemsHours(list) : manual ?? estimate;
        return {
          ...c,
          items: list,
          estimate,
          manual,
          hours: h,
          rate: h > 0 ? c.monthlyValue / h : 0,
          fairPrice: h * config.hourRate,
        };
      }),
    [clients, hours, items, config.times, config.hourRate]
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
  const avgClientHours = withHours.length ? used / withHours.length : 0;
  // Materiais somados de todos os clientes (pelo nome), para ver o volume do mês.
  const materials = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; hours: number }>();
    for (const r of rows)
      for (const i of r.items) {
        const key = i.name.trim().toLowerCase();
        const m = map.get(key) || { name: i.name.trim(), quantity: 0, hours: 0 };
        m.quantity += i.quantity;
        m.hours += (i.quantity * i.minutes) / 60;
        map.set(key, m);
      }
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [rows]);
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

  const setClientItems = (id: string, list: WorkItem[]) => setItems((m) => ({ ...m, [id]: list }));
  const onItemsError = (e: unknown) => setMessage(e instanceof Error ? e.message : "Não foi possível salvar o material. Tente de novo.");

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

      {/* Horas por cliente */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Horas por cliente</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Clientes ativos. Em <b>Cadastrar materiais</b>, coloque quantos de cada material o cliente recebe por mês (stories, posts, reels, artigos, ajustes nos apps…) e quanto tempo leva cada um: as horas do cliente viram a soma.
              Sem materiais, vale o número digitado em Horas/mês ou, vazio, a estimativa pelo escopo do cliente. Tudo salva sozinho. Contratos semanais viram mês com 4,33 semanas.
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
                    <Fragment key={r.id}>
                    <tr className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{r.name}</div>
                        <button
                          type="button"
                          onClick={() => setOpenClient(openClient === r.id ? null : r.id)}
                          aria-expanded={openClient === r.id}
                          className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400"
                        >
                          {openClient === r.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          {r.items.length ? "Editar materiais" : "Cadastrar materiais"}
                        </button>
                        {r.items.length > 0 && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 max-w-[22rem]">
                            {r.items.map((i) => `${fmtQty(i.quantity)} ${i.name}`).join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">
                        {r.monthlyValue ? formatCurrency(r.monthlyValue) : "—"}
                      </td>
                      <td className="px-4 py-2">
                        {r.items.length ? (
                          <div className="flex items-center justify-end gap-1.5 tabular-nums font-medium text-gray-900 dark:text-gray-100">
                            {fmtH(r.hours)}
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400" title="Soma dos materiais">
                              mat.
                            </span>
                          </div>
                        ) : (
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
                        )}
                      </td>
                      <td className={cn("px-4 py-2.5 text-right tabular-nums", below ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-700 dark:text-gray-300")}>
                        {r.hours > 0 && r.monthlyValue ? formatCurrency(r.rate) : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-gray-700 dark:text-gray-300">{formatCurrency(r.fairPrice)}</td>
                      {r.hours > 0 ? (
                        <td className={cn("px-4 py-2.5 text-right tabular-nums whitespace-nowrap", diff > 0.5 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400")}>
                          {Math.abs(diff) < 0.5 ? "—" : diff > 0 ? `faltam ${formatCurrency(diff)}` : `+${formatCurrency(-diff)}`}
                        </td>
                      ) : (
                        <td className="px-4 py-2.5 text-right text-xs text-amber-700 dark:text-amber-400">digite as horas</td>
                      )}
                    </tr>
                    {openClient === r.id && (
                      <tr className="border-b bg-gray-50/60 dark:bg-gray-900/40">
                        <td colSpan={6} className="px-4 py-4">
                          <WorkItemsEditor
                            clientId={r.id}
                            clientName={r.name}
                            items={r.items}
                            times={config.times}
                            scope={r.scope}
                            onChange={(list) => setClientItems(r.id, list)}
                            onError={onItemsError}
                          />
                        </td>
                      </tr>
                    )}
                    </Fragment>
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
                    <td className={cn("px-4 py-3 text-right tabular-nums whitespace-nowrap", totalDiff > 0.5 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400")}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
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

        {/* Tempos */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Tempo de cada peça</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Base da estimativa de horas dos clientes.</p>
            </div>
            {TIME_FIELDS.map((f) => (
              <div key={f.key} className="grid grid-cols-[minmax(0,1fr)_5rem_6.5rem] items-center gap-2">
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

        {/* Materiais do mês */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Materiais do mês</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Soma dos materiais cadastrados em todos os clientes.</p>
            </div>
            {materials.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Nenhum material cadastrado ainda. Abra <b>Materiais</b> em um cliente para começar.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {materials.map((m) => (
                  <li key={m.name} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                    <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">{m.name}</span>
                    <span className="shrink-0 tabular-nums text-gray-900 dark:text-gray-100">
                      <b>{fmtQty(m.quantity)}</b> <span className="text-xs text-gray-500 dark:text-gray-400">· {fmtH(m.hours)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-md bg-orange-50 dark:bg-orange-500/10 p-3 text-sm text-gray-700 dark:text-gray-300">
              Livres no mês: <b className="tabular-nums">{fmtH(free)}</b>
              {avgClientHours > 0 && (
                <>
                  {" "}· cabem cerca de <b className="tabular-nums text-orange-700 dark:text-orange-400">{Math.floor(free / avgClientHours)}</b> clientes do tamanho médio dos atuais ({fmtH(avgClientHours)} cada)
                </>
              )}
            </div>
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

type Preset = { name: string; quantity: number; minutes: number };

/** Atividades comuns, com os tempos configurados. Quantidade = vezes por mês. */
function presets(t: CapacityTimes): Preset[] {
  const w = Math.round(52 / 12 * 100) / 100;
  return [
    { name: "Story", quantity: Math.round(5 * w), minutes: t.storyMin },
    { name: "Post", quantity: Math.round(1 * w), minutes: t.postMin },
    { name: "Reels", quantity: Math.round(1 * w), minutes: t.reelsMin },
    { name: "Artigo de blog", quantity: Math.round(1 * w), minutes: t.articleMin },
    { name: "Planejamento e relatório de redes", quantity: 1, minutes: t.planningHours * 60 },
    { name: "Ajustes no app de delivery (semana)", quantity: w, minutes: t.appMinPerWeek },
    { name: "Responder avaliações e comentários", quantity: w, minutes: 20 },
    { name: "Relatório de delivery", quantity: 1, minutes: t.deliveryReportHours * 60 },
    { name: "Atendimento (WhatsApp, aprovação, ajustes)", quantity: 1, minutes: t.supportHours * 60 },
  ];
}

/** Monta a lista inicial a partir do escopo cadastrado no cliente. */
function presetsFromScope(scope: ClientScope, t: CapacityTimes): Preset[] {
  const w = Math.round(52 / 12 * 100) / 100;
  const out: Preset[] = [];
  if (scope.includesSocialMedia) {
    if (scope.storiesPerWeek) out.push({ name: "Story", quantity: Math.round(scope.storiesPerWeek * w), minutes: t.storyMin });
    if (scope.postsPerWeek) out.push({ name: "Post", quantity: Math.round(scope.postsPerWeek * w), minutes: t.postMin });
    if (scope.reelsPerWeek) out.push({ name: "Reels", quantity: Math.round(scope.reelsPerWeek * w), minutes: t.reelsMin });
    out.push({ name: "Planejamento e relatório de redes", quantity: 1, minutes: t.planningHours * 60 });
  }
  if (scope.includesMenuMgmt) {
    const apps = scope.menuPlatforms ? scope.menuPlatforms.split(",").filter(Boolean) : [];
    for (const app of apps.length ? apps : ["app de delivery"]) out.push({ name: `Ajustes no ${app} (semana)`, quantity: w, minutes: t.appMinPerWeek });
    out.push({ name: "Relatório de delivery", quantity: 1, minutes: t.deliveryReportHours * 60 });
  }
  if (out.length) out.push({ name: "Atendimento (WhatsApp, aprovação, ajustes)", quantity: 1, minutes: t.supportHours * 60 });
  return out;
}

const fmtNum = (n: number) => String(Math.round(n * 100) / 100);

function WorkItemsEditor({
  clientId,
  clientName,
  items,
  times,
  scope,
  onChange,
  onError,
}: {
  clientId: string;
  clientName: string;
  items: WorkItem[];
  times: CapacityTimes;
  scope: ClientScope;
  onChange: (list: WorkItem[]) => void;
  onError: (e: unknown) => void;
}) {
  const list = presets(times);
  const [draft, setDraft] = useState<Preset>(list[0]);
  const [busy, setBusy] = useState(false);
  const fromScope = presetsFromScope(scope, times);

  async function add(newItems: Preset[]) {
    if (!newItems.length || !newItems[0].name.trim()) return;
    setBusy(true);
    try {
      const created = await addWorkItems(clientId, newItems);
      onChange([...items, ...created]);
    } catch (e) {
      onError(e);
    } finally {
      setBusy(false);
    }
  }

  async function save(item: WorkItem, patch: Partial<WorkItem>) {
    const next = { ...item, ...patch };
    if (next.name === item.name && next.quantity === item.quantity && next.minutes === item.minutes) return;
    if (!next.name.trim()) return onError(new Error("Dê um nome para o material."));
    onChange(items.map((i) => (i.id === item.id ? next : i)));
    try {
      await updateWorkItem(item.id, next);
    } catch (e) {
      onError(e);
    }
  }

  async function remove(item: WorkItem) {
    onChange(items.filter((i) => i.id !== item.id));
    try {
      await deleteWorkItem(item.id);
    } catch (e) {
      onError(e);
    }
  }

  const total = itemsHours(items);

  return (
    <div className="space-y-3 max-w-3xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Materiais de {clientName} por mês</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Total: <b className="tabular-nums text-gray-900 dark:text-gray-100">{fmtH(total)}</b> por mês
        </p>
      </div>

      {items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-xs text-gray-500 dark:text-gray-400">
                <th className="text-left font-medium pb-1">Material</th>
                <th className="text-right font-medium pb-1 w-24">Quantidade</th>
                <th className="text-right font-medium pb-1 w-24">Min cada</th>
                <th className="text-right font-medium pb-1 w-20">Horas</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="py-1 pr-2">
                    <input
                      aria-label="Nome do material"
                      className={cn(inputClass, "text-left")}
                      defaultValue={i.name}
                      maxLength={80}
                      onBlur={(e) => save(i, { name: e.target.value.trim() })}
                    />
                  </td>
                  <td className="py-1 px-1">
                    <input aria-label={`Quantidade por mês de ${i.name}`} type="number" min={0} step={1} inputMode="decimal" className={inputClass}
                      defaultValue={fmtNum(i.quantity)} onBlur={(e) => save(i, { quantity: toNum(e.target.value) })} />
                  </td>
                  <td className="py-1 px-1">
                    <input aria-label={`Minutos de cada ${i.name}`} type="number" min={0} step={5} inputMode="decimal" className={inputClass}
                      defaultValue={fmtNum(i.minutes)} onBlur={(e) => save(i, { minutes: toNum(e.target.value) })} />
                  </td>
                  <td className="py-1 pl-2 text-right tabular-nums text-gray-700 dark:text-gray-300">{fmtH((i.quantity * i.minutes) / 60)}</td>
                  <td className="py-1 pl-1">
                    <button type="button" onClick={() => remove(i)} className="h-9 w-8 flex items-center justify-center text-gray-400 hover:text-red-600"
                      aria-label={`Remover ${i.name}`} title="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
          <span>Nenhum material ainda.</span>
          {fromScope.length > 0 && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => add(fromScope)}>
              Preencher pelo escopo do cliente
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_auto] gap-2 items-end rounded-md border border-dashed border-gray-300 dark:border-gray-700 p-3">
        <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <span>Novo material</span>
          <input
            list={`presets-${clientId}`}
            className={cn(inputClass, "text-left")}
            value={draft.name}
            maxLength={80}
            onChange={(e) => {
              const p = list.find((x) => x.name === e.target.value);
              setDraft(p ? { ...p } : { ...draft, name: e.target.value });
            }}
            placeholder="Ex.: Story, Post, Ajustes no iFood"
          />
          <datalist id={`presets-${clientId}`}>
            {list.map((p) => (
              <option key={p.name} value={p.name} />
            ))}
          </datalist>
        </label>
        <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <span>Quantidade/mês</span>
          <input type="number" min={0} step={1} inputMode="decimal" className={inputClass} value={fmtNum(draft.quantity)}
            onChange={(e) => setDraft({ ...draft, quantity: toNum(e.target.value) })} />
        </label>
        <label className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <span>Min cada</span>
          <input type="number" min={0} step={5} inputMode="decimal" className={inputClass} value={fmtNum(draft.minutes)}
            onChange={(e) => setDraft({ ...draft, minutes: toNum(e.target.value) })} />
        </label>
        <Button type="button" size="sm" disabled={busy || !draft.name.trim()} onClick={() => add([draft]).then(() => setDraft(list[0]))} className="bg-orange-600 hover:bg-orange-700 text-white">
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Quantidade por mês: algo semanal dá cerca de 4,33 no mês. Escolha uma sugestão na lista ou escreva o seu. Mudanças nas linhas salvam ao sair do campo.
      </p>
    </div>
  );
}
