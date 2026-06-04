import { Plus, Search, Filter, Mail, Phone, Globe, Building2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

const clients = [
  {
    id: "1",
    name: "Carlos Mendonça",
    company: "TechBrasil Ltda",
    email: "carlos@techbrasil.com.br",
    phone: "(11) 99123-4567",
    website: "techbrasil.com.br",
    status: "ACTIVE",
    contractValue: 15000,
    city: "São Paulo",
    state: "SP",
    projects: 3,
  },
  {
    id: "2",
    name: "Ana Lima",
    company: "StartupXYZ",
    email: "ana@startupxyz.io",
    phone: "(21) 98765-3210",
    website: "startupxyz.io",
    status: "ACTIVE",
    contractValue: 8500,
    city: "Rio de Janeiro",
    state: "RJ",
    projects: 2,
  },
  {
    id: "3",
    name: "Roberto Silva",
    company: "Loja Moderna",
    email: "roberto@lojamoderna.com",
    phone: "(31) 97654-8901",
    website: "lojamoderna.com",
    status: "ACTIVE",
    contractValue: 4200,
    city: "Belo Horizonte",
    state: "MG",
    projects: 1,
  },
  {
    id: "4",
    name: "Mariana Costa",
    company: "Restaurante Bella",
    email: "mariana@bellaristorante.com.br",
    phone: "(11) 93456-7890",
    website: "bellaristorante.com.br",
    status: "INACTIVE",
    contractValue: 3000,
    city: "São Paulo",
    state: "SP",
    projects: 1,
  },
  {
    id: "5",
    name: "Dr. Paulo Ferreira",
    company: "Clínica Saúde+",
    email: "paulo@clinicasaudemais.com.br",
    phone: "(85) 98901-2345",
    website: "clinicasaudemais.com.br",
    status: "ACTIVE",
    contractValue: 2500,
    city: "Fortaleza",
    state: "CE",
    projects: 2,
  },
  {
    id: "6",
    name: "Fernanda Rocha",
    company: "FashionHub",
    email: "fernanda@fashionhub.com.br",
    phone: "(51) 99012-3456",
    website: "fashionhub.com.br",
    status: "PROSPECT",
    contractValue: 6000,
    city: "Porto Alegre",
    state: "RS",
    projects: 0,
  },
  {
    id: "7",
    name: "Lucas Oliveira",
    company: "EduTech Academy",
    email: "lucas@edutechacademy.com",
    phone: "(62) 97890-1234",
    website: "edutechacademy.com",
    status: "ACTIVE",
    contractValue: 9800,
    city: "Goiânia",
    state: "GO",
    projects: 2,
  },
  {
    id: "8",
    name: "Juliana Martins",
    company: "MedHub",
    email: "juliana@medhub.com.br",
    phone: "(41) 96789-0123",
    website: "medhub.com.br",
    status: "CHURNED",
    contractValue: 5500,
    city: "Curitiba",
    state: "PR",
    projects: 0,
  },
];

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  INACTIVE: { label: "Inativo", variant: "gray" },
  PROSPECT: { label: "Prospect", variant: "info" },
  CHURNED: { label: "Perdido", variant: "danger" },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const colors = ["bg-blue-500", "bg-purple-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-rose-500"];

export default function ClientesPage() {
  const activeCount = clients.filter((c) => c.status === "ACTIVE").length;
  const totalMRR = clients.filter((c) => c.status === "ACTIVE").reduce((sum, c) => sum + c.contractValue, 0);

  return (
    <div>
      <Header title="Clientes" subtitle="Gerencie sua base de clientes" />
      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total de Clientes", value: clients.length, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Ativos", value: activeCount, color: "text-green-600", bg: "bg-green-50" },
            { label: "Prospects", value: clients.filter((c) => c.status === "PROSPECT").length, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "MRR Total", value: formatCurrency(totalMRR), color: "text-purple-600", bg: "bg-purple-50" },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar cliente, empresa..." className="pl-9 h-9 bg-white border-gray-200" />
            </div>
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
          <Button size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client, idx) => {
            const status = statusMap[client.status];
            const color = colors[idx % colors.length];
            return (
              <Card key={client.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {client.company}
                        </p>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                      {client.email}
                    </a>
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      <Phone className="h-3.5 w-3.5" />
                      {client.phone}
                    </p>
                    {client.website && (
                      <p className="flex items-center gap-2 text-xs text-gray-500">
                        <Globe className="h-3.5 w-3.5" />
                        {client.website}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div>
                      <p className="text-xs text-gray-400">Valor Contrato</p>
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(client.contractValue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Projetos</p>
                      <p className="text-sm font-bold text-gray-900">{client.projects}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Cidade</p>
                      <p className="text-sm font-medium text-gray-700">{client.city}, {client.state}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
