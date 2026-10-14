import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CLIENT_APPROVAL_TASK_TYPES } from "@/lib/tasks";
import { ClientApprovalBoard } from "@/components/approval/ClientApprovalBoard";

export const dynamic = "force-dynamic";

// Link sensível (dados do cliente) — nunca deve ser indexado ou aparecer em
// buscas, mesmo que alguém publique o link em algum lugar público.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ClientApprovalPage({ params }: { params: { token: string } }) {
  const client = await prisma.client.findUnique({ where: { approvalToken: params.token } });

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Este link não está mais ativo</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Peça para a agência enviar o link atualizado de aprovação.</p>
        </div>
      </div>
    );
  }

  const tasks = await prisma.task.findMany({
    where: {
      clientId: client.id,
      type: { in: CLIENT_APPROVAL_TASK_TYPES },
      status: { in: ["REVIEW", "APPROVED", "REJECTED", "POSTED"] },
      media: { some: {} },
    },
    include: {
      media: { orderBy: { sort: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <ClientApprovalBoard
      token={params.token}
      clientName={client.company || client.name}
      tasks={tasks}
    />
  );
}
