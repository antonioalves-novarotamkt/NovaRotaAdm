import { ArrowLeft, Mail, Phone, Globe, MapPin, Building2, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";

const client = {
  id: "1",
  name: "Carlos Mendonça",
  company: "TechBrasil Ltda",
  email: "carlos@techbrasil.com.br",
  phone: "(11) 99123-4567",
  website: "https://techbrasil.com.br",
  address: "Av. Paulista, 1234, Sala 567",
  city: "São Paulo",
  state: "SP",
  country: "Brasil",
  status: "ACTIVE",
  contractValue: 15000,
  notes: "Cliente premium. Prefere reuniões às terças-feiras pela manhã. Foco em campanhas de performance e branding.",
  createdAt: new Date("2023-03-10"),
};

const projects = [
  { id: "1", name: "Campanha Google Ads Q1 2024", status: "IN_PROGRESS", budget: 8000, endDate: new Date("2024-03-31") },
  { id: "2", name: "Redesign Landing Page", status: "COMPLETED", budget: 4500, endDate: new Date("2024-01-15") },
  { id: "3", name: "SEO Estratégico 2024", status: "PLANNING", budget: 2500, endDate: new Date("2024-06-30") },
];

const invoices = [
  { id: "1", number: "NF-2024-001", amount: 15000, status: "PAID", dueDate: new Date("2024-01-15"), paidAt: new Date("2024-01-12") },
  { id: "2", number: "NF-2024-008", amount: 15000, status: "PENDING", dueDate: new Date("2024-02-15") },
];

const projectStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "purple" | "gray" }> = {
  IN_PROGRESS: { label: "Em Andamento", variant: "info" },
  COMPLETED: { label: "Concluído", variant: "success" },
  PLANNING: { label: "Planejamento", variant: "warning" },
};

const invoiceStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  OVERDUE: { label: "Atrasado", variant: "danger" },
};

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <Header title={client.company} subtitle={`Detalhes do cliente · ${client.city}, ${client.state}`} />
      <div className="p-6 space-y-6">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <Link href="/clientes">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Editar</Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Novo Projeto</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Client Info */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-2xl bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                    CM
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    {client.company}
                  </div>
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {client.email}
                  </a>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {client.phone}
                  </div>
                  <a href={client.website} target="_blank" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <Globe className="h-4 w-4 text-gray-400" />
                    {client.website}
                  </a>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <span>{client.address}<br />{client.city}, {client.state} – {client.country}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Cliente desde {formatDate(client.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700">Valor Contrato</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(client.contractValue)}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">por mês</p>
              </CardContent>
            </Card>

            {client.notes && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 leading-relaxed">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right - Projects & Invoices */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Projetos ({projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {projects.map((project) => {
                  const status = projectStatusMap[project.status];
                  return (
                    <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">Prazo: {formatDate(project.endDate)} · {formatCurrency(project.budget)}</p>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Faturas ({invoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoices.map((invoice) => {
                  const status = invoiceStatusMap[invoice.status];
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.number}</p>
                        <p className="text-xs text-gray-500">
                          Vence: {formatDate(invoice.dueDate)}
                          {invoice.paidAt && ` · Pago em ${formatDate(invoice.paidAt)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(invoice.amount)}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
