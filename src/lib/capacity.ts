// Cálculo da capacidade da agência: quantas horas de trabalho o mês tem, quantas
// os clientes ocupam e quanto cada hora está rendendo. Usado na tela /capacidade.

export const WEEKS_PER_MONTH = 52 / 12;

export type CapacityTimes = {
  storyMin: number;
  postMin: number;
  reelsMin: number;
  articleMin: number;
  planningHours: number; // planejamento + relatório de redes, por cliente/mês
  appMinPerWeek: number; // gestão de cada app de delivery, por semana
  deliveryReportHours: number; // relatório de delivery, por cliente/mês
  supportHours: number; // WhatsApp, aprovação e ajustes, por cliente/mês
};

export type CapacityPackage = { name: string; hours: number; price: number };

/** Serviço extra cadastrado pelo Antonio (além dos fixos que vêm dos tempos). */
export type CapacityService = { name: string; minutes: number; quantity: number };

export type CapacityConfig = {
  weekHours: number;
  adminPct: number; // prospecção, vendas e administrativo
  qualityPct: number; // folga para qualidade e imprevistos
  hourRate: number; // valor da hora que a agência quer ganhar
  times: CapacityTimes;
  services: CapacityService[];
  packages: CapacityPackage[];
};

// Tempos informados pelo Antonio em out/2026; pacotes da tabela de preços 2027.
export const DEFAULT_CAPACITY: CapacityConfig = {
  weekHours: 40,
  adminPct: 25,
  qualityPct: 15,
  hourRate: 100,
  times: {
    storyMin: 10,
    postMin: 10,
    reelsMin: 30,
    articleMin: 20,
    planningHours: 1,
    appMinPerWeek: 40,
    deliveryReportHours: 2,
    supportHours: 1,
  },
  services: [{ name: "Responder avaliações e comentários", minutes: 20, quantity: 4.33 }],
  packages: [
    { name: "Rota Delivery", hours: 13, price: 1190 },
    { name: "Rota Essencial", hours: 6, price: 1450 },
    { name: "Rota Completa", hours: 22.2, price: 3300 },
    { name: "Redes sociais Completo", hours: 10.2, price: 2500 },
    { name: "Delivery 3 apps + relatório", hours: 11, price: 1000 },
    { name: "Site institucional (projeto)", hours: 20, price: 2800 },
  ],
};

const num = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

/** Lê o JSON salvo nas configurações, completando o que faltar com o padrão. */
export function parseCapacityConfig(raw: string | null | undefined): CapacityConfig {
  let data: Partial<CapacityConfig> = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }
  const d = DEFAULT_CAPACITY;
  const t = (data.times || {}) as Partial<CapacityTimes>;
  const packages = Array.isArray(data.packages)
    ? data.packages
        .filter((p) => p && typeof p.name === "string" && p.name.trim())
        .map((p) => ({ name: String(p.name).trim().slice(0, 80), hours: num(p.hours, 0), price: num(p.price, 0) }))
    : d.packages;
  const seen = new Set<string>();
  const services = Array.isArray(data.services)
    ? data.services
        .filter((x) => x && typeof x.name === "string" && x.name.trim())
        .map((x) => ({ name: String(x.name).trim().slice(0, 80), minutes: num(x.minutes, 0), quantity: num(x.quantity, 1) }))
        .filter((x) => {
          const k = x.name.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        })
    : d.services;
  return {
    weekHours: num(data.weekHours, d.weekHours),
    adminPct: Math.min(90, num(data.adminPct, d.adminPct)),
    qualityPct: Math.min(90, num(data.qualityPct, d.qualityPct)),
    hourRate: num(data.hourRate, d.hourRate),
    times: {
      storyMin: num(t.storyMin, d.times.storyMin),
      postMin: num(t.postMin, d.times.postMin),
      reelsMin: num(t.reelsMin, d.times.reelsMin),
      articleMin: num(t.articleMin, d.times.articleMin),
      planningHours: num(t.planningHours, d.times.planningHours),
      appMinPerWeek: num(t.appMinPerWeek, d.times.appMinPerWeek),
      deliveryReportHours: num(t.deliveryReportHours, d.times.deliveryReportHours),
      supportHours: num(t.supportHours, d.times.supportHours),
    },
    services,
    packages,
  };
}

export type ServiceOption = { name: string; minutes: number; quantity: number; fixed: boolean };

const per = (n: number) => Math.round(n * WEEKS_PER_MONTH * 100) / 100;

// Nomes dos serviços fixos: os mesmos usados na estimativa pelo escopo.
export const SERVICE_NAMES = {
  story: "Story",
  post: "Post",
  reels: "Reels",
  article: "Artigo de blog",
  planning: "Planejamento e relatório de redes",
  app: "Gestão de app de delivery (semana)",
  deliveryReport: "Relatório de delivery",
  support: "Atendimento (WhatsApp, aprovação, ajustes)",
};

/** Lista de serviços para escolher nos materiais: os fixos (tempos) + os cadastrados. */
export function serviceOptions(c: Pick<CapacityConfig, "times" | "services">): ServiceOption[] {
  const t = c.times;
  const fixed: ServiceOption[] = [
    { name: SERVICE_NAMES.story, minutes: t.storyMin, quantity: Math.round(per(5)), fixed: true },
    { name: SERVICE_NAMES.post, minutes: t.postMin, quantity: Math.round(per(1)), fixed: true },
    { name: SERVICE_NAMES.reels, minutes: t.reelsMin, quantity: Math.round(per(1)), fixed: true },
    { name: SERVICE_NAMES.article, minutes: t.articleMin, quantity: Math.round(per(1)), fixed: true },
    { name: SERVICE_NAMES.planning, minutes: t.planningHours * 60, quantity: 1, fixed: true },
    { name: SERVICE_NAMES.app, minutes: t.appMinPerWeek, quantity: per(1), fixed: true },
    { name: SERVICE_NAMES.deliveryReport, minutes: t.deliveryReportHours * 60, quantity: 1, fixed: true },
    { name: SERVICE_NAMES.support, minutes: t.supportHours * 60, quantity: 1, fixed: true },
  ];
  const names = new Set(fixed.map((f) => f.name.toLowerCase()));
  return [...fixed, ...c.services.filter((s) => !names.has(s.name.toLowerCase())).map((s) => ({ ...s, fixed: false }))];
}

export type CapacityBudget = { month: number; forClients: number; limit: number };

export function capacityBudget(c: CapacityConfig): CapacityBudget {
  const month = c.weekHours * WEEKS_PER_MONTH;
  const forClients = month * (1 - c.adminPct / 100);
  return { month, forClients, limit: forClients * (1 - c.qualityPct / 100) };
}

export type ClientScope = {
  includesSocialMedia: boolean;
  postsPerWeek: number | null;
  storiesPerWeek: number | null;
  reelsPerWeek: number | null;
  includesMenuMgmt: boolean;
  menuPlatforms: string | null;
};

/** Horas por mês estimadas pelo escopo cadastrado no cliente (redes + apps de delivery). */
export function estimateClientHours(scope: ClientScope, t: CapacityTimes): number {
  let hours = 0;
  if (scope.includesSocialMedia) {
    const weekMin =
      (scope.storiesPerWeek || 0) * t.storyMin + (scope.postsPerWeek || 0) * t.postMin + (scope.reelsPerWeek || 0) * t.reelsMin;
    hours += (weekMin * WEEKS_PER_MONTH) / 60 + t.planningHours;
  }
  if (scope.includesMenuMgmt) {
    const apps = scope.menuPlatforms ? scope.menuPlatforms.split(",").filter(Boolean).length : 0;
    hours += (Math.max(apps, 1) * t.appMinPerWeek * WEEKS_PER_MONTH) / 60 + t.deliveryReportHours;
  }
  if (hours > 0) hours += t.supportHours;
  return Math.round(hours * 10) / 10;
}

/** Valor do contrato convertido para mês (o contrato guarda o valor de cada cobrança). */
export function monthlyValue(value: number | null, frequency: string): number {
  if (!value) return 0;
  if (frequency === "WEEKLY") return value * WEEKS_PER_MONTH;
  if (frequency === "BIWEEKLY") return value * 2;
  return value;
}
