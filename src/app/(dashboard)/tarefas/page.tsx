import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { NewTaskDialog } from "@/components/tasks/NewTaskDialog";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TASK_STATUS_COLUMNS, taskStatusLabel } from "@/lib/tasks";
import { prisma } from "@/lib/prisma";
import type { TaskStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function TarefasPage({
  searchParams,
}: {
  searchParams: { cliente?: string; responsavel?: string };
}) {
  const selectedClientId = searchParams.cliente || "";
  const selectedAssigneeId = searchParams.responsavel || "";

  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const canApprove = role === "ADMIN" || role === "MANAGER";

  const [clients, users, tasks] = await Promise.all([
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    prisma.task.findMany({
      where: {
        ...(selectedClientId ? { clientId: selectedClientId } : {}),
        ...(selectedAssigneeId ? { assigneeId: selectedAssigneeId } : {}),
      },
      include: {
        client: { select: { id: true, name: true, company: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const tasksByStatus = new Map<TaskStatus, typeof tasks>();
  for (const status of TASK_STATUS_COLUMNS) tasksByStatus.set(status, []);
  for (const task of tasks) tasksByStatus.get(task.status)?.push(task);

  return (
    <div>
      <Header title="Tarefas" subtitle="Quadro de trabalho da agência — todos os clientes, todas as atividades, com aprovação" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <form className="flex items-center gap-2" method="get">
            <select
              name="cliente"
              defaultValue={selectedClientId}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
            >
              <option value="">Todos os clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company || c.name}
                </option>
              ))}
            </select>
            <select
              name="responsavel"
              defaultValue={selectedAssigneeId}
              className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm"
            >
              <option value="">Todos os responsáveis</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
            <button type="submit" className="h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
              Filtrar
            </button>
          </form>
          <NewTaskDialog clients={clients} users={users} defaultClientId={selectedClientId} />
        </div>

        {clients.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 p-10 text-center">Cadastre um cliente primeiro para poder criar tarefas.</p>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {TASK_STATUS_COLUMNS.map((status) => {
              const columnTasks = tasksByStatus.get(status) || [];
              return (
                <div key={status} className="w-72 shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{taskStatusLabel[status]}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{columnTasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[4rem]">
                    {columnTasks.length === 0 ? (
                      <p className="text-xs text-gray-300 dark:text-gray-700 p-3 text-center">Nada aqui</p>
                    ) : (
                      columnTasks.map((task) => <TaskCard key={task.id} task={task} users={users} canApprove={canApprove} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
