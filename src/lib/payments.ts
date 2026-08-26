import { prisma } from "@/lib/prisma";
import { computeNextBillingDate } from "@/lib/billing";
import { syncScheduledInvoices } from "@/lib/scheduled-invoices";
import type { Invoice, Payment } from "@prisma/client";

type InvoiceWithPayments = Invoice & { payments: Payment[] };

export function paidAmount(invoice: InvoiceWithPayments): number {
  return invoice.payments.reduce((sum, p) => sum + p.amount, 0);
}

// Quanto ainda falta receber dessa fatura — 0 pra faturas já fechadas
// (pagas, rascunho ou canceladas), mesmo que nunca tenham tido pagamento.
export function remainingAmount(invoice: InvoiceWithPayments): number {
  if (invoice.status === "PAID" || invoice.status === "DRAFT" || invoice.status === "CANCELLED") return 0;
  return Math.max(0, invoice.total - paidAmount(invoice));
}

// Quanto já entrou de verdade dessa fatura — usado nos totais de "Recebido"
// pra contar o valor de uma baixa parcial mesmo antes da fatura fechar.
export function receivedAmount(invoice: InvoiceWithPayments): number {
  if (invoice.status === "PAID") return invoice.total;
  if (invoice.status === "PARTIALLY_PAID") return paidAmount(invoice);
  return 0;
}

/**
 * Registra o recebimento de um valor (total ou parcial) numa fatura. Se o
 * valor recebido (somado ao que já tinha sido pago antes) fechar o total da
 * fatura, marca como PAID; senão marca como PARTIALLY_PAID e mantém em aberto
 * o saldo restante pra uma próxima baixa.
 */
export async function registerInvoicePayment(invoiceId: string, amountPaid: number, paidAt: Date) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true, client: true } });
  if (!invoice) throw new Error("Fatura não encontrada.");

  const alreadyPaid = paidAmount(invoice);
  const remaining = invoice.total - alreadyPaid;

  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    throw new Error("O valor recebido deve ser maior que zero.");
  }
  if (amountPaid > remaining + 0.01) {
    throw new Error(
      `O valor recebido (${amountPaid.toFixed(2)}) é maior que o saldo devedor dessa fatura (${remaining.toFixed(2)}).`
    );
  }

  await prisma.payment.create({ data: { invoiceId, amount: amountPaid, paidAt } });

  const isFullyPaid = alreadyPaid + amountPaid >= invoice.total - 0.01;

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: isFullyPaid ? { status: "PAID", paidAt } : { status: "PARTIALLY_PAID" },
  });

  // Se essa é a cobrança programada vigente do cliente (recorrência semanal/
  // mensal/quinzenal), fechá-la 100% avança o próximo vencimento — não
  // importa por qual tela a baixa foi dada (recebimento programado, extrato
  // do cliente, etc), o comportamento tem que ser o mesmo.
  if (isFullyPaid && invoice.description === "Recebimento programado" && invoice.client.nextBillingDate?.getTime() === invoice.dueDate.getTime()) {
    const dayAfter = new Date(invoice.dueDate);
    dayAfter.setDate(dayAfter.getDate() + 1);
    const nextBillingDate = computeNextBillingDate(
      {
        frequency: invoice.client.billingFrequency,
        dayOfWeek: invoice.client.billingDayOfWeek,
        dayOfMonth1: invoice.client.billingDayOfMonth1,
        dayOfMonth2: invoice.client.billingDayOfMonth2,
      },
      dayAfter
    );
    await prisma.client.update({ where: { id: invoice.clientId }, data: { nextBillingDate } });
    await syncScheduledInvoices();
  }

  return { isFullyPaid, remaining: invoice.total - (alreadyPaid + amountPaid) };
}
