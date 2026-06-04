import { Plus, Search, Clock, User, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

const projects = [
  {
    id: "1",
    name: "Campanha Google Ads Q1",
    client: "TechBrasil Ltda",
    manager: "Ana Souza",
    status: "IN_PROGRESS",
    priority: "HIGH",
    budget: 15000,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-03-31"),
    tasksTotal: 12,
    tasksDone: 7,
    description: "Campanha de performance focada em leads qualificados para o segmento B2B.",
  },
  {
    id: "2",
    name: "Redesign de Marca",
    client: "StartupXYZ",
    manager: "Carlos Lima",
    status: "REVIEW",
    priority: "HIGH",
    budget: 8500,
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-02-28"),
    tasksTotal: 8,
    tasksDone: 6,
    description: "Novo manual de marca, identidade visual completa e guia de aplicação.",
  },
  {
    id: "3",
    name: "SEO e Conteúdo",
    client: "Loja Moderna",
    manager: "Maria Ferreira",
    status: "PLANNING",
    priority: "MEDIUM",
    budget: 4200,
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-04-30"),
    tasksTotal: 15,
    tasksDone: 2,
    description: "Estratégia de SEO técnico, criação de conteúdo e link building.",
  },
  {
    id: "4",
    name: "Social Media Management",
    client: "Restaurante Bella",
    manager: "João Santos",
    status: "COMPLETED",
    priority: "MEDIUM",
    budget: 3000,
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-01-31"),
    tasksTotal: 20,
    tasksDone: 20,
    description: "Gestão completa das redes sociais, criação de conteúdo e relatórios mensais.",
  },
  {
    id: "5",
    name: "E-mail Marketing Automation",
    client: "Clínica Saúde+",
    manager: "Ana Souza",
    status: "IN_PROGRESS",
    priority: "LOW",
    budget: 2500,
    startDate: new Date("2024-01-20"),
    endDate: new Date("2024-03-30"),
    tasksTotal: 10,
    tasksDone: 4,
    description: "Automação de e-mail marketing com fluxos de nutrição e segmentação avançada.",
  },
  {
    id: "6",
    name: "Campanha de Influenciadores",
    client: "FashionHub",
    manager: "Paula Ramos",
    status: "ON_HOLD",
    priority: "HIGH",
    budget: 12000,
    startDate: new Date("2024-02-15"),
    endDate: new Date("2024-05-15"),
    tasksTotal: 18,
    tasksDone: 3,
    description: "Seleção, briefing e gestão de influenciadores para lançamento de coleção.",
  },
  {
    id: "7",
    name: "Vídeo Marketing B2B",
    client: "EduTech Academy",
    manager: "Carlos Lima",
    status: "PLANNING",
    priority: "MEDIUM",
    budget: 9800,
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-06-30"),
    tasksTotal: 14,
    tasksDone: 0,
    description: "Produção de vídeos institucionais e depoimentos para campanha educacional.",
  },
];

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

export default function ProjetosPage() {
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
          <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Novo Projeto
          </Button>
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

        {/* Kanban Board */}
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
                    const progress = project.tasksTotal > 0
                      ? Math.round((project.tasksDone / project.tasksTotal) * 100)
                      : 0;
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
                          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>

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
                            <p className="text-xs text-gray-400">{project.tasksDone}/{project.tasksTotal} tarefas</p>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              {project.client}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {formatDate(project.endDate)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {project.manager}
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t">
                            <span className="text-xs font-semibold text-gray-900">
                              {formatCurrency(project.budget)}
                            </span>
                          </div>
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
      </div>
    </div>
  );
}
