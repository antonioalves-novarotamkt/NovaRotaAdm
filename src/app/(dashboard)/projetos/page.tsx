import { Search, Clock, User, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { formatCurrency, formatDate } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const columns = [
  { id: "PLANNING", label: "Planejamento", color: "bg-yellow-400" },
  { id: "IN_PROGRESS", label: "Em Andamento", color: "bg-blue-500" },
  { id: "REVIEW", label: "Em Revisão", color: "bg-purple-500" },
  { id: "COMPLETED", label: "Concluído", color: "bg-green-500" },
  { id: "ON_HOLD", label: "Pausado", color: "bg-gray-400" },
];

const priorityMap: Record<string, { label: string; variant: "danger" | "warning" | "info" | "gray" }> = {
  URGENT: { label: "Urgente", variant: "danger" },
  HIGH: { label: "Alta", variant: "danger" },
  MEDIUM: { label: "Média", variant: "warning" },
  LOW: { label: "Baixa", variant: "info" },
};

export default async function ProjetosPage() {
  const [projects, clients] = await Promise.all([
    prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        manager: true,
        tasks: { select: { status: true } },
      },
    }),
    prisma.client.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, company: true },
    }),
  ]);

  return (
    <div>
      <Header title="Projetos" subtitle="Visualize e gerencie todos os projetos" />
      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar projetos..." className="pl-9 h-9 bg-white border-gray-200" />
            </div>
          </div>
          <NewProjectDialog clients={clients} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {columns.map((col) => {
            const count = projects.filter((p) => p.status === col.id).length;
            return (
              <Card key={col.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2 w-2 rounded-full ${col.color}`} />
                    <p className="text-xs text-gray-500">{col.label}</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {projects.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-10 text-center text-sm text-gray-500">
              Nenhum projeto cadastrado ainda. Clique em &quot;Novo Projeto&quot; para começar.
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map((col) => {
              const colProjects = projects.filter((p) => p.status === col.id);
              return (
                <div key={col.id} className="flex-shrink-0 w-72">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`h-3 w-3 rounded-full ${col.color}`} />
                    <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                    <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                      {colProjects.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {colProjects.map((project) => {
                      const priority = priorityMap[project.priority];
                      const tasksTotal = project.tasks.length;
                      const tasksDone = project.tasks.filter((t) => t.status === "DONE").length;
                      const progress = tasksTotal > 0 ? Math.round((tasksDone / tasksTotal) * 100) : 0;
                      return (
                        <Card key={project.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900 leading-tight flex-1 pr-2">
                                {project.name}
                              </h4>
                              <Badge variant={priority.variant} className="text-[10px] shrink-0">
                                {priority.label}
                              </Badge>
                            </div>
                            {project.description && (
                              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
                            )}

                            <div className="space-y-2 mb-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Progresso</span>
                                <span className="font-medium text-gray-700">{progress}%</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-400">{tasksDone}/{tasksTotal} tarefas</p>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <User className="h-3 w-3" />
                                {project.client.company || project.client.name}
                              </div>
                              {project.endDate && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(project.endDate)}
                                </div>
                              )}
                              {project.manager && (
                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                  <Clock className="h-3 w-3" />
                                  {project.manager.name}
                                </div>
                              )}
                            </div>

                            {project.budget != null && (
                              <div className="mt-3 pt-3 border-t">
                                <span className="text-xs font-semibold text-gray-900">
                                  {formatCurrency(project.budget)}
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {colProjects.length === 0 && (
                      <div className="h-20 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-xs text-gray-400">
                        Sem projetos aqui
                      </div>
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
