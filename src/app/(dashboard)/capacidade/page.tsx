import { Header } from "@/components/layout/Header";
import { CapacityCalculator } from "@/components/capacidade/CapacityCalculator";
import { getAgencySettings } from "@/app/actions/agency";
import { estimateClientHours, monthlyValue, parseCapacityConfig } from "@/lib/capacity";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CapacidadePage() {
  const settings = await getAgencySettings();
  const config = parseCapacityConfig(settings.capacityConfig);

  const clients = await prisma.client.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      company: true,
      contractValue: true,
      billingFrequency: true,
      monthlyHours: true,
      includesSocialMedia: true,
      postsPerWeek: true,
      storiesPerWeek: true,
      reelsPerWeek: true,
      includesMenuMgmt: true,
      menuPlatforms: true,
      workItems: {
        orderBy: [{ sort: "asc" }, { createdAt: "asc" }],
        select: { id: true, name: true, quantity: true, minutes: true },
      },
    },
  });

  const rows = clients.map((c) => ({
    id: c.id,
    name: c.company || c.name,
    monthlyValue: Math.round(monthlyValue(c.contractValue, c.billingFrequency) * 100) / 100,
    monthlyHours: c.monthlyHours,
    items: c.workItems,
    scope: {
      includesSocialMedia: c.includesSocialMedia,
      postsPerWeek: c.postsPerWeek,
      storiesPerWeek: c.storiesPerWeek,
      reelsPerWeek: c.reelsPerWeek,
      includesMenuMgmt: c.includesMenuMgmt,
      menuPlatforms: c.menuPlatforms,
    },
    // Estimativa inicial; o componente recalcula quando os tempos mudam.
    estimate: estimateClientHours(
      {
        includesSocialMedia: c.includesSocialMedia,
        postsPerWeek: c.postsPerWeek,
        storiesPerWeek: c.storiesPerWeek,
        reelsPerWeek: c.reelsPerWeek,
        includesMenuMgmt: c.includesMenuMgmt,
        menuPlatforms: c.menuPlatforms,
      },
      config.times
    ),
  }));

  return (
    <div>
      <Header title="Capacidade" subtitle="Horas por cliente, valor da sua hora e quantos clientes ainda cabem no mês" />
      <div className="p-6">
        <CapacityCalculator initialConfig={config} clients={rows} />
      </div>
    </div>
  );
}
