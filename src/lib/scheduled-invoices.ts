import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { computeNextBillingDate } from "@/lib/billing";

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
 *
 * Cada período de cobrança é independente: o vencimento avança sozinho com
 * o tempo (não quando a fatura anterior é paga) — se o cliente ficou com
 * semanas em atraso sem dar baixa, a cobrança da semana atual continua
 * saindo em dia mesmo assim, em vez de travar esperando o atraso ser
 * quitado. Faturas antigas não pagas continuam ali, acumulando.
 */
export async function syncScheduledInvoices() {
  const clients = await prisma.client.findMany({
    where: {
      status: { notIn: ["CHURNED", "INACTIVE"] },
      billingFrequency: { not: "NONE" },
      contractValue: { not: null },
      nextBillingDate: { not: null },
    },
    select: {
      id: true,
      contractValue: true,
      nextBillingDate: true,
      billingFrequency: true,
      billingDayOfWeek: true,
      billingDayOfMonth1: true,
      billingDayOfMonth2: true,
    },
  });

  const startOfToday = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));

  // Cada cliente é isolado no try/catch: se um cliente falhar (ex: colisão
  // de número de fatura sob concorrência), os que vêm depois na lista ainda
  // são processados — antes, um erro no meio do loop travava a sincronização
  // pra todo mundo daquele ponto em diante, silenciosamente (só logado no
  // console), até a próxima tentativa começar do zero e falhar no mesmo lugar.
  let created = 0;
  const errors: { clientId: string; error: unknown }[] = [];
  for (const client of clients) {
    if (!client.nextBillingDate || !client.contractValue) continue;

    try {
      let dueDate: Date | null = client.nextBillingDate;
      let guard = 0;

      // Avança período a período até alcançar um vencimento que ainda não
      // chegou — gera a fatura de cada período percorrido no caminho
      // (inclusive semanas puladas desde a última sincronização), sem
      // depender de nenhuma delas ter sido paga.
      while (dueDate && dueDate <= startOfToday && guard < 104) {
        const dayAfter = new Date(dueDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const next = computeNextBillingDate(
          {
            frequency: client.billingFrequency,
            dayOfWeek: client.billingDayOfWeek,
            dayOfMonth1: client.billingDayOfMonth1,
            dayOfMonth2: client.billingDayOfMonth2,
          },
          dayAfter
        );
        if (!next) break;

        // Reivindica esse período de forma atômica antes de criar a fatura:
        // só segue em frente se nextBillingDate no banco ainda for
        // exatamente o esperado. Se duas páginas carregarem ao mesmo tempo
        // e chamarem a sincronização em paralelo pro mesmo cliente, a
        // segunda encontra 0 linhas afetadas aqui e para, em vez de
        // duplicar a fatura do período.
        const claim = await prisma.client.updateMany({
          where: { id: client.id, nextBillingDate: dueDate },
          data: { nextBillingDate: next },
        });
        if (claim.count === 0) break;

        const existing = await prisma.invoice.findFirst({
          where: {
            clientId: client.id,
            dueDate,
            status: { in: ["PENDING", "OVERDUE", "PARTIALLY_PAID"] },
          },
        });
        if (!existing) {
          await createInvoiceWithUniqueNumber({
            clientId: client.id,
            amount: client.contractValue,
            tax: 0,
            total: client.contractValue,
            status: "PENDING",
            dueDate,
            description: "Recebimento programado",
          });
          created += 1;
        }

        dueDate = next;
        guard++;
      }
    } catch (error) {
      console.error(`syncScheduledInvoices: falhou pro cliente ${client.id}`, error);
      errors.push({ clientId: client.id, error });
    }
  }

  return { created, errors };
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

  // dueDate fica salvo como meia-noite UTC do dia do vencimento — comparar
  // com o instante exato (new Date()) marcava como atrasada uma fatura que
  // vence hoje assim que passasse da meia-noite, mesmo faltando o dia
  // inteiro pra ela vencer de verdade. Só conta como atrasada a partir do
  // dia seguinte ao vencimento.
  const startOfToday = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  await prisma.invoice.updateMany({
    where: { status: "PENDING", dueDate: { lt: startOfToday } },
    data: { status: "OVERDUE" },
  });
}
