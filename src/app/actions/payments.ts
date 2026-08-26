"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { syncInvoiceStatuses } from "@/lib/scheduled-invoices";

// Desfaz um recebimento dado por engano — apaga os pagamentos registrados
// nessa fatura e ela volta a ficar em aberto (Pendente ou Atrasada,
// dependendo do vencimento). Usado no recibo, pra corrigir uma baixa errada
// sem precisar mexer direto no banco.
export async function cancelInvoicePayment(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Fatura não encontrada.");

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new Error("Fatura não encontrada.");
  if (invoice.status !== "PAID" && invoice.status !== "PARTIALLY_PAID") {
    throw new Error("Essa fatura não tem recebimento pra cancelar.");
  }

  await prisma.payment.deleteMany({ where: { invoiceId: id } });
  await prisma.invoice.update({ where: { id }, data: { status: "PENDING", paidAt: null } });
  await syncInvoiceStatuses();

  revalidatePath("/financeiro");
  revalidatePath(`/clientes/${invoice.clientId}`);
}
