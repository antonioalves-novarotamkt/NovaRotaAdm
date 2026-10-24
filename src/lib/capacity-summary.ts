import { prisma } from "@/lib/prisma";
import { capacityBudget, estimateClientHours, monthlyQty, monthlyValue, parseCapacityConfig } from "@/lib/capacity";

/** Resumo da capacidade para o Dashboard: mesmas regras da tela /capacidade. */
export async function getCapacitySummary() {
  const [settings, clients] = await Promise.all([
    prisma.agencySettings.findUnique({ where: { id: "singleton" }, select: { capacityConfig: true } }),
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      select: {
        contractValue: true,
        billingFrequency: true,
        monthlyHours: true,
        includesSocialMedia: true,
        postsPerWeek: true,
        storiesPerWeek: true,
        reelsPerWeek: true,
        includesMenuMgmt: true,
        menuPlatforms: true,
        workItems: { select: { name: true, quantity: true, perWeek: true, minutes: true } },
      },
    }),
  ]);
  const config = parseCapacityConfig(settings?.capacityConfig);
  const budget = capacityBudget(config);

  let used = 0;
  let revenueWithHours = 0;
  let withHours = 0;
  let belowRate = 0;
  const materials = new Map<string, { name: string; quantity: number }>();
  for (const c of clients) {
    const itemsHours = c.workItems.reduce((s, i) => s + monthlyQty(i) * i.minutes, 0) / 60;
    const hours = c.workItems.length ? itemsHours : c.monthlyHours ?? estimateClientHours(c, config.times);
    if (hours <= 0) continue;
    const value = monthlyValue(c.contractValue, c.billingFrequency);
    used += hours;
    revenueWithHours += value;
    withHours++;
    if (value / hours < config.hourRate) belowRate++;
    for (const i of c.workItems) {
      const key = i.name.trim().toLowerCase();
      const m = materials.get(key) || { name: i.name.trim(), quantity: 0 };
      m.quantity += monthlyQty(i);
      materials.set(key, m);
    }
  }

  const free = Math.max(0, budget.limit - used);
  const avgClientHours = withHours ? used / withHours : 0;
  return {
    used,
    limit: budget.limit,
    forClients: budget.forClients,
    occupancy: budget.limit > 0 ? (used / budget.limit) * 100 : 0,
    free,
    avgRate: used > 0 ? revenueWithHours / used : 0,
    hourRate: config.hourRate,
    belowRate,
    clients: withHours,
    fitsMore: avgClientHours > 0 ? Math.floor(free / avgClientHours) : null,
    materials: Array.from(materials.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 6),
  };
}
