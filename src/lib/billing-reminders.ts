import { prisma } from "@/lib/prisma";
import { getAgencySettings } from "@/app/actions/agency";
import { syncScheduledInvoices } from "@/lib/scheduled-invoices";
import {
  sendInvoiceDueSoonEmail,
  sendInvoiceOverdueEmailToClient,
  sendOverdueSummaryToAgency,
} from "@/lib/mailer";

const DUE_SOON_WINDOW_DAYS = 3;
const OVERDUE_RESEND_DAYS = 7;

export async function runBillingReminders() {
  const now = new Date();
  const dueSoonWindow = new Date(now.getTime() + DUE_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const overdueResendCutoff = new Date(now.getTime() - OVERDUE_RESEND_DAYS * 24 * 60 * 60 * 1000);

  await syncScheduledInvoices();

  // Only auto-flip scheduled billing to OVERDUE — manually entered extra
  // charges stay PENDING until given baixa by hand.
  await prisma.invoice.updateMany({
    where: { status: "PENDING", dueDate: { lt: now }, description: "Recebimento programado" },
    data: { status: "OVERDUE" },
  });

  const agency = await getAgencySettings();

  const dueSoonInvoices = await prisma.invoice.findMany({
    where: {
      status: "PENDING",
      dueDate: { gte: now, lte: dueSoonWindow },
      dueSoonReminderSentAt: null,
    },
    include: { client: true },
  });

  let dueSoonSent = 0;
  let dueSoonFailed = 0;
  for (const invoice of dueSoonInvoices) {
    if (!invoice.client.email) continue;
    try {
      await sendInvoiceDueSoonEmail(invoice.client.email, {
        clientName: invoice.client.company || invoice.client.name,
        agencyName: agency.name,
        invoiceNumber: invoice.number,
        total: invoice.total,
        dueDate: invoice.dueDate,
      });
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { dueSoonReminderSentAt: now },
      });
      dueSoonSent += 1;
    } catch (err) {
      console.error(`Falha ao enviar lembrete de vencimento da fatura ${invoice.number}:`, err);
      dueSoonFailed += 1;
    }
  }

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "OVERDUE",
      OR: [{ lastOverdueReminderAt: null }, { lastOverdueReminderAt: { lt: overdueResendCutoff } }],
    },
    include: { client: true },
  });

  let overdueSent = 0;
  let overdueFailed = 0;
  const notifiedOverdue: typeof overdueInvoices = [];
  for (const invoice of overdueInvoices) {
    if (!invoice.client.email) continue;
    try {
      await sendInvoiceOverdueEmailToClient(invoice.client.email, {
        clientName: invoice.client.company || invoice.client.name,
        agencyName: agency.name,
        invoiceNumber: invoice.number,
        total: invoice.total,
        dueDate: invoice.dueDate,
      });
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: { lastOverdueReminderAt: now },
      });
      overdueSent += 1;
      notifiedOverdue.push(invoice);
    } catch (err) {
      console.error(`Falha ao enviar lembrete de atraso da fatura ${invoice.number}:`, err);
      overdueFailed += 1;
    }
  }

  if (notifiedOverdue.length > 0) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { email: true },
      });
      const agencyEmails = admins.map((a) => a.email).filter(Boolean) as string[];
      await sendOverdueSummaryToAgency(
        agencyEmails,
        notifiedOverdue.map((i) => ({
          clientName: i.client.company || i.client.name,
          invoiceNumber: i.number,
          total: i.total,
          dueDate: i.dueDate,
        }))
      );
    } catch (err) {
      console.error("Falha ao enviar resumo de faturas em atraso para a agência:", err);
    }
  }

  return { dueSoonSent, dueSoonFailed, overdueSent, overdueFailed };
}
