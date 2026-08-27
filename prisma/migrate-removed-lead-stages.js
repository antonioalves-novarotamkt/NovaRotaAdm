// Ajusta leads que usam etapas removidas do funil, antes do `prisma db push`
// remover esses valores do enum no banco. Roda a cada deploy, mas não faz
// nada depois da primeira vez — se os valores já não existirem mais no
// enum, o erro é ignorado.
//
// - "Negociação" foi removida: os leads que estavam lá viram "Proposta
//   Enviada" (a negociação em si passou a acontecer depois da proposta).
// - "Perdido" foi removida: agora marcar um lead como perdido já apaga o
//   registro na hora, então qualquer lead ainda com essa etapa (de antes
//   dessa mudança) é removido, pra manter o mesmo comportamento.
const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  try {
    const reassigned = await prisma.$executeRawUnsafe(
      `UPDATE leads SET stage = 'PROPOSAL' WHERE stage = 'NEGOTIATION'`
    );
    if (reassigned > 0) console.log(`Migrados ${reassigned} lead(s) de "Negociação" para "Proposta Enviada".`);
  } catch (err) {
    console.log("Nada a migrar (etapa Negociação já não existe no banco).");
  }

  try {
    const deleted = await prisma.$executeRawUnsafe(`DELETE FROM leads WHERE stage = 'LOST'`);
    if (deleted > 0) console.log(`Removidos ${deleted} lead(s) marcados como "Perdido".`);
  } catch (err) {
    console.log("Nada a remover (etapa Perdido já não existe no banco).");
  }

  await prisma.$disconnect();
})();
