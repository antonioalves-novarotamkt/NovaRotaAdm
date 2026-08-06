import { prisma } from "@/lib/prisma";

/**
 * Ensures every active client on a recurring billing schedule has a PENDING
 * (or later OVERDUE) invoice matching their current nextBillingDate, so that
 * "A Receber" / "Em Atraso" and the automated reminder emails have something
 * to work with, without any manual invoice creation.
 */
export async function syncScheduledInvoices() {
  const clients = await prisma.client.findMany({
    where: {
      status: "ACTIVE",
      billingFrequency: { not: "NONE" },
      contractValue: { not: null },
      nextBillingDate: { not: null },
    },
    select: { id: true, contractValue: true, nextBillingDate: true },
  });

  let created = 0;
  for (const client of clients) {
    if (!client.nextBillingDate || !client.contractValue) continue;

    const existing = await prisma.invoice.findFirst({
      where: {
        clientId: client.id,
        dueDate: client.nextBillingDate,
        status: { in: ["PENDING", "OVERDUE"] },
      },
    });
    if (existing) continue;

    const count = await prisma.invoice.count();
    const number = `NF-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;

    await prisma.invoice.create({
      data: {
        number,
        clientId: client.id,
        amount: client.contractValue,
        tax: 0,
        total: client.contractValue,
        status: "PENDING",
        dueDate: client.nextBillingDate,
        description: "Recebimento programado",
      },
    });
    created += 1;
  }

  return { created };
}
