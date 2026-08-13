import { prisma } from "@/lib/prisma";

/**
 * Ensures every client on a recurring billing schedule has a PENDING (or
 * later OVERDUE) invoice matching their current nextBillingDate, so that
 * "A Receber" / "Em Atraso" and the automated reminder emails have something
 * to work with, without any manual invoice creation. Only clients marked
 * CHURNED or INACTIVE are excluded — a schedule + contract value is itself
 * a strong signal the client is being actively billed, regardless of the
 * status label (new clients default to PROSPECT).
 */
export async function syncScheduledInvoices() {
  const clients = await prisma.client.findMany({
    where: {
      status: { notIn: ["CHURNED", "INACTIVE"] },
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

/**
 * Keeps invoice status accurate regardless of whether the daily reminder
 * cron has actually run (e.g. CRON_SECRET not configured yet) — creates any
 * missing scheduled invoices and flips anything unpaid past its due date to
 * OVERDUE, for scheduled billing and manually entered extra charges alike.
 * Cheap and side-effect-free for humans (no emails), safe to call on every
 * Financeiro/Dashboard page load.
 */
export async function syncInvoiceStatuses() {
  await syncScheduledInvoices();
  await prisma.invoice.updateMany({
    where: { status: "PENDING", dueDate: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });
}
