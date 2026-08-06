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
