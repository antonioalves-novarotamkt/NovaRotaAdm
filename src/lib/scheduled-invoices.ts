import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Baseado no maior sufixo numerico ja usado no ano corrente (nao em count()):
// count() conta faturas de todos os anos, entao uma lacuna (fatura deletada,
// dados de teste, virada de ano) faz count()+1 colidir com um numero que ja
// existe de verdade — e nesse caso repetir a mesma conta não muda nada.
async function nextInvoiceNumber(): Promise<string> {
  const prefix = `NF-${new Date().getFullYear()}-`;
  const existing = await prisma.invoice.findMany({
    where: { number: { startsWith: prefix } },
    select: { number: true },
  });
  let maxSeq = 0;
  for (const invoice of existing) {
    const match = invoice.number.slice(prefix.length).match(/^(\d+)$/);
    if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
}

/**
 * Cria uma fatura gerando o numero automaticamente. Chamadas concorrentes
 * (dois carregamentos de pagina, ou o cron de lembretes rodando junto) podem
 * calcular o mesmo numero e colidir na constraint @unique — em vez de deixar
 * a chamada quebrar, tenta de novo com a sequencia recalculada.
 */
export async function createInvoiceWithUniqueNumber(
  data: Omit<Prisma.InvoiceUncheckedCreateInput, "number">
) {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const number = await nextInvoiceNumber();
    try {
      return await prisma.invoice.create({ data: { ...data, number } });
    } catch (error) {
      const isDuplicateNumber =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        (error.meta?.target as string[] | undefined)?.includes("number");
      if (!isDuplicateNumber || attempt === maxAttempts) throw error;
    }
  }
  throw new Error("Não foi possível gerar um número de fatura único.");
}

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
        status: { in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] },
      },
    });
    if (existing) continue;

    await createInvoiceWithUniqueNumber({
      clientId: client.id,
      amount: client.contractValue,
      tax: 0,
      total: client.contractValue,
      status: "PENDING",
      dueDate: client.nextBillingDate,
      description: "Recebimento programado",
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
