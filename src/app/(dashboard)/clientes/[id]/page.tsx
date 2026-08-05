import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Globe, MapPin, Building2, Calendar, DollarSign, FileText, Users2, ClipboardList, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { NewSocialAccountDialog } from "@/components/clients/NewSocialAccountDialog";
import { LogSocialMetricDialog } from "@/components/clients/LogSocialMetricDialog";
import { NewActivityDialog } from "@/components/clients/NewActivityDialog";
import { ClientLogoUpload } from "@/components/clients/ClientLogoUpload";
import { ClientBillingForm } from "@/components/clients/ClientBillingForm";

const platformLabel: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  TWITTER: "X / Twitter",
  OTHER: "Outra",
};

const statusBadge: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  INACTIVE: { label: "Inativo", variant: "gray" },
  PROSPECT: { label: "Prospect", variant: "info" },
  CHURNED: { label: "Perdido", variant: "danger" },
};

const projectStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "purple" | "gray" }> = {
  IN_PROGRESS: { label: "Em Andamento", variant: "info" },
  COMPLETED: { label: "Concluído", variant: "success" },
  PLANNING: { label: "Planejamento", variant: "warning" },
  REVIEW: { label: "Revisão", variant: "purple" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
  ON_HOLD: { label: "Em Espera", variant: "gray" },
};

const invoiceStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  DRAFT: { label: "Rascunho", variant: "gray" },
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  OVERDUE: { label: "Atrasado", variant: "danger" },
  CANCELLED: { label: "Cancelado", variant: "gray" },
};

const contractStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  EXPIRED: { label: "Expirado", variant: "gray" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "warning" },
};

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      projects: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { issueDate: "desc" } },
      contracts: { orderBy: { startDate: "desc" } },
      socialAccounts: {
        orderBy: { createdAt: "asc" },
        include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
      },
      activities: { orderBy: { date: "desc" }, take: 20 },
    },
  });

  if (!client) notFound();

  const status = statusBadge[client.status];

  return (
    <div>
      <Header title={client.company || client.name} subtitle={`Detalhes do cliente${client.city ? ` · ${client.city}, ${client.state}` : ""}`} />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/clientes">
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Clientes
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Client Info */}
          <div className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {client.logoUrl ? (
                    <img
                      src={client.logoUrl}
                      alt={client.name}
                      className="h-16 w-16 rounded-2xl object-contain bg-white border border-gray-100"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-bold">
                      {getInitials(client.name)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">{client.name}</h2>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <ClientLogoUpload clientId={client.id} logoUrl={client.logoUrl} />
                </div>
                <div className="space-y-3">
                  {client.company && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      {client.company}
                    </div>
                  )}
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {client.email}
                  </a>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {client.phone}
                    </div>
                  )}
                  {client.website && (
                    <a href={client.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-orange-600 hover:underline">
                      <Globe className="h-4 w-4 text-gray-400" />
                      {client.website}
                    </a>
                  )}
                  {(client.address || client.city) && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>
                        {client.address && <>{client.address}<br /></>}
                        {client.city}, {client.state} – {client.country}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    Cliente desde {formatDate(client.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Recebimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ClientBillingForm
                  clientId={client.id}
                  contractValue={client.contractValue}
                  billingFrequency={client.billingFrequency}
                  nextBillingDate={client.nextBillingDate}
                  billingDayOfWeek={client.billingDayOfWeek}
                  billingDayOfMonth1={client.billingDayOfMonth1}
                  billingDayOfMonth2={client.billingDayOfMonth2}
                />
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

          {/* Right - Social, Activities, Projects, Contracts & Invoices */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-gray-400" />
                    Redes Sociais ({client.socialAccounts.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <LogSocialMetricDialog
                      clientId={client.id}
                      accounts={client.socialAccounts.map((a) => ({ id: a.id, handle: a.handle, platform: a.platform }))}
                    />
                    <NewSocialAccountDialog clientId={client.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.socialAccounts.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhuma rede social cadastrada.</p>
                )}
                {client.socialAccounts.map((account) => {
                  const latest = account.metrics[0];
                  return (
                    <div key={account.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {platformLabel[account.platform] || account.platform} · {account.handle}
                        </p>
                        {latest ? (
                          <p className="text-xs text-gray-500">
                            {formatDate(latest.month, { month: "long", year: "numeric", day: undefined })} · {latest.followers.toLocaleString("pt-BR")} seguidores
                            {latest.engagementRate != null && ` · ${latest.engagementRate}% engajamento`}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Nenhuma métrica registrada ainda</p>
                        )}
                      </div>
                      {latest && (
                        <span className="text-sm font-bold text-gray-900">{latest.followers.toLocaleString("pt-BR")}</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-400" />
                    Atividades ({client.activities.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Link href={`/atividades?cliente=${client.id}`} className="text-xs text-orange-600 hover:underline">
                      Ver todas
                    </Link>
                    <NewActivityDialog clientId={client.id} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.activities.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhuma atividade registrada ainda.</p>
                )}
                {client.activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100">
                    <span className="text-xs text-gray-400 whitespace-nowrap pt-0.5">{formatDate(activity.date)}</span>
                    <p className="text-sm text-gray-700 flex-1">{activity.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Link href={`/projetos?cliente=${client.id}`} className="block">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 flex items-center gap-3">
                  <ImageIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Ver posts do mês deste cliente</span>
                </CardContent>
              </Card>
            </Link>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Contratos ({client.contracts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.contracts.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhum contrato cadastrado.</p>
                )}
                {client.contracts.map((contract) => {
                  const cStatus = contractStatusMap[contract.status];
                  return (
                    <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{contract.title}</p>
                          <p className="text-xs text-gray-500">
                            Início: {formatDate(contract.startDate)}
                            {contract.endDate && ` · Fim: ${formatDate(contract.endDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(contract.value)}</span>
                        <Badge variant={cStatus.variant}>{cStatus.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Projetos ({client.projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.projects.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhum projeto cadastrado.</p>
                )}
                {client.projects.map((project) => {
                  const pStatus = projectStatusMap[project.status];
                  return (
                    <div key={project.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500">
                          {project.endDate ? `Prazo: ${formatDate(project.endDate)}` : "Sem prazo definido"}
                          {project.budget != null && ` · ${formatCurrency(project.budget)}`}
                        </p>
                      </div>
                      <Badge variant={pStatus.variant}>{pStatus.label}</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">
                  Faturas ({client.invoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.invoices.length === 0 && (
                  <p className="text-sm text-gray-400">Nenhuma fatura cadastrada.</p>
                )}
                {client.invoices.map((invoice) => {
                  const iStatus = invoiceStatusMap[invoice.status];
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
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(invoice.total)}</span>
                        <Badge variant={iStatus.variant}>{iStatus.label}</Badge>
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
