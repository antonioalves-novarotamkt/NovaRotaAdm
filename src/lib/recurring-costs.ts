import { prisma } from "@/lib/prisma";

/**
 * Garante que todo custo marcado como recorrente (mensal) tenha uma cópia
 * lançada em cada mês até o atual — inclusive preenchendo meses que ficaram
 * sem lançamento porque ninguém abriu o sistema naquele período, já que um
 * custo recorrente de verdade (aluguel, assinatura, salário) continua
 * existindo mesmo assim. Cheap e seguro de chamar em toda carga de
 * Custos/Dashboard, no mesmo espírito do syncInvoiceStatuses.
 */
export async function syncRecurringCosts() {
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const recurringCosts = await prisma.operationalCost.findMany({
    where: { recurring: true },
    orderBy: { month: "desc" },
  });

  // Uma série recorrente é identificada por categoria+descrição — só
  // processa a ocorrência mais recente de cada série (a lista já vem
  // ordenada do mês mais novo pro mais antigo).
  const seen = new Set<string>();
  let created = 0;

  for (const cost of recurringCosts) {
    const key = `${cost.category}::${cost.description}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const cursor = new Date(cost.month);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);

    while (cursor.getTime() <= currentMonth.getTime()) {
      const existing = await prisma.operationalCost.findFirst({
        where: { category: cost.category, description: cost.description, month: cursor },
      });
      if (!existing) {
        await prisma.operationalCost.create({
          data: {
            category: cost.category,
            description: cost.description,
            amount: cost.amount,
            month: new Date(cursor),
            recurring: true,
          },
        });
        created += 1;
      }
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  return { created };
}
