// Remove tarefas de posts/stories/reels e a aprovação de cliente, que
// voltaram a ficar no sistema separado — roda antes do `prisma db push`
// remover esses valores dos enums no banco. Roda a cada deploy, mas não
// faz nada depois da primeira vez — se os valores já não existirem mais,
// o erro é ignorado.
//
// - Tarefas do tipo Post/Reels/Story são apagadas por completo (inclusive
//   atualizações, mídia, comentários e agendamentos, via cascade) — eram
//   só conteúdo de postagem, que não é mais gerenciado por aqui.
// - Qualquer tarefa restante (Blog/Atualização de Site/Outra) que estava
//   marcada como "Postado" vira "Aprovado", já que esse status deixou de
//   existir.
const { PrismaClient } = require("@prisma/client");

(async () => {
  const prisma = new PrismaClient();
  try {
    const deleted = await prisma.$executeRawUnsafe(
      `DELETE FROM tasks WHERE type IN ('POST', 'REELS', 'STORY')`
    );
    if (deleted > 0) console.log(`Removidas ${deleted} tarefa(s) de post/reels/story.`);
  } catch (err) {
    console.log("Nada a remover (tipos Post/Reels/Story já não existem no banco).");
  }

  try {
    const reassigned = await prisma.$executeRawUnsafe(
      `UPDATE tasks SET status = 'APPROVED' WHERE status = 'POSTED'`
    );
    if (reassigned > 0) console.log(`Migradas ${reassigned} tarefa(s) de "Postado" para "Aprovado".`);
  } catch (err) {
    console.log('Nada a migrar (status "Postado" já não existe no banco).');
  }

  await prisma.$disconnect();
})();
