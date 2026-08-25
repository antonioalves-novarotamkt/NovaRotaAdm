import type { BillingFrequency } from "@prisma/client";

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export function weekdayLabel(day: number): string {
  return WEEKDAY_LABELS[day] ?? "";
}

function clampDayOfMonth(year: number, month: number, day: number): number {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Math.min(day, lastDay);
}

function nextWeekdayOccurrence(after: Date, dayOfWeek: number): Date {
  const d = new Date(after.getFullYear(), after.getMonth(), after.getDate());
  const diff = (dayOfWeek - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

function nextMonthlyOccurrence(after: Date, dayOfMonth: number): Date {
  const d = new Date(after.getFullYear(), after.getMonth(), 1);
  const thisMonthDay = clampDayOfMonth(d.getFullYear(), d.getMonth(), dayOfMonth);
  const thisMonthDate = new Date(d.getFullYear(), d.getMonth(), thisMonthDay);
  if (thisMonthDate >= new Date(after.getFullYear(), after.getMonth(), after.getDate())) {
    return thisMonthDate;
  }
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  const nextMonthDay = clampDayOfMonth(nextMonth.getFullYear(), nextMonth.getMonth(), dayOfMonth);
  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonthDay);
}

interface BillingRule {
  frequency: BillingFrequency;
  dayOfWeek?: number | null;
  dayOfMonth1?: number | null;
  dayOfMonth2?: number | null;
}

export function countOccurrencesInMonth(rule: BillingRule, year: number, month: number): number {
  if (rule.frequency === "WEEKLY" && rule.dayOfWeek != null) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      if (new Date(year, month, day).getDay() === rule.dayOfWeek) count++;
    }
    return count;
  }

  if (rule.frequency === "MONTHLY" && rule.dayOfMonth1 != null) {
    return 1;
  }

  if (rule.frequency === "BIWEEKLY" && rule.dayOfMonth1 != null && rule.dayOfMonth2 != null) {
    return 2;
  }

  return 0;
}

export function billingScheduleText(rule: BillingRule): string {
  if (rule.frequency === "WEEKLY" && rule.dayOfWeek != null) {
    return `Semanal, toda ${weekdayLabel(rule.dayOfWeek)}`;
  }
  if (rule.frequency === "MONTHLY" && rule.dayOfMonth1 != null) {
    return `Mensal, todo dia ${rule.dayOfMonth1} de cada mês`;
  }
  if (rule.frequency === "BIWEEKLY" && rule.dayOfMonth1 != null && rule.dayOfMonth2 != null) {
    return `Quinzenal, nos dias ${rule.dayOfMonth1} e ${rule.dayOfMonth2} de cada mês`;
  }
  return "";
}

// Gera todas as datas de cobrança da regra dentro de [from, to] — usado pra
// projetar recebimentos futuros (ex: previsão dos próximos meses), sem
// depender do nextBillingDate salvo no cliente (que só guarda a próxima
// ocorrência isolada).
export function projectBillingDates(rule: BillingRule, from: Date, to: Date): Date[] {
  const dates: Date[] = [];
  let cursor = from;
  let guard = 0;
  while (guard < 60) {
    const next = computeNextBillingDate(rule, cursor);
    if (!next || next > to) break;
    dates.push(next);
    cursor = new Date(next.getFullYear(), next.getMonth(), next.getDate() + 1);
    guard++;
  }
  return dates;
}

export function computeNextBillingDate(rule: BillingRule, after: Date = new Date()): Date | null {
  if (rule.frequency === "WEEKLY" && rule.dayOfWeek != null) {
    return nextWeekdayOccurrence(after, rule.dayOfWeek);
  }

  if (rule.frequency === "MONTHLY" && rule.dayOfMonth1 != null) {
    return nextMonthlyOccurrence(after, rule.dayOfMonth1);
  }

  if (rule.frequency === "BIWEEKLY" && rule.dayOfMonth1 != null && rule.dayOfMonth2 != null) {
    const candidates = [
      nextMonthlyOccurrence(after, rule.dayOfMonth1),
      nextMonthlyOccurrence(after, rule.dayOfMonth2),
    ];
    return candidates.sort((a, b) => a.getTime() - b.getTime())[0];
  }

  return null;
}
