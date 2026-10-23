"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createInvoiceWithUniqueNumber } from "@/lib/scheduled-invoices";
import { registerInvoicePayment } from "@/lib/payments";

export async function createExtraCharge(formData: FormData) {
  const clientId = String(formData.get("clientId") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const amount = Number(formData.get("amount") || 0);
  const dateRaw = String(formData.get("receivedDate") || "");

  if (!clientId || !description || !amount || !dateRaw) {
    throw new Error("Cliente, descrição, valor e data são obrigatórios.");
  }

  const date = new Date(`${dateRaw}T00:00:00.000Z`);

  await createInvoiceWithUniqueNumber({
    clientId,
    amount,
    tax: 0,
    total: amount,
    status: "PENDING",
    issueDate: new Date(),
    dueDate: date,
    description,
  });

  revalidatePath("/financeiro");
}

export async function markExtraChargePaid(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;
  const paidAtRaw = String(formData.get("paidAt") || "");
  const paidAt = paidAtRaw ? new Date(`${paidAtRaw}T00:00:00.000Z`) : new Date();
  const amountRaw = String(formData.get("amount") || "");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Recebimento não encontrado.");

  const amount = amountRaw ? Number(amountRaw) : invoice.total;
  await registerInvoicePayment(id, amount, paidAt);

  revalidatePath("/financeiro");
  revalidatePath(`/clientes/${invoice.clientId}`);
}

// Apaga qualquer fatura (programada ou extra), junto com as baixas já
// registradas nela — sem apagar os pagamentos antes, a fatura com baixa não
// sai por causa da referência no banco.
export async function deleteInvoice(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!id) return { ok: false, error: "Fatura inválida." };
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id }, select: { clientId: true } });
    if (!invoice) return { ok: false, error: "Fatura não encontrada." };

    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { invoiceId: id } }),
      prisma.invoice.delete({ where: { id } }),
    ]);

    revalidatePath("/financeiro");
    revalidatePath("/dashboard");
    revalidatePath(`/clientes/${invoice.clientId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Erro ao apagar a fatura." };
  }
}
