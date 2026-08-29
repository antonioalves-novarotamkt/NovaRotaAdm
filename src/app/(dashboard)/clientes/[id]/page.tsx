import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Globe, MapPin, Building2, Calendar, DollarSign, FileText, Package, Users2 } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { paidAmount, remainingAmount } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { ClientLogoUpload } from "@/components/clients/ClientLogoUpload";
import { ClientBillingForm } from "@/components/clients/ClientBillingForm";
import { EditClientDialog } from "@/components/clients/EditClientDialog";
import { NewSocialAccountDialog } from "@/components/clients/NewSocialAccountDialog";
import { RefreshFollowersButton } from "@/components/clients/RefreshFollowersButton";
import { DeleteSocialAccountButton } from "@/components/clients/DeleteSocialAccountButton";

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

const invoiceStatusMap: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "gray" }> = {
  DRAFT: { label: "Rascunho", variant: "gray" },
  PAID: { label: "Pago", variant: "success" },
  PARTIALLY_PAID: { label: "Parcial", variant: "info" },
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
      invoices: { orderBy: { issueDate: "desc" }, include: { payments: true } },
      contracts: { orderBy: { startDate: "desc" } },
      socialAccounts: {
        orderBy: { createdAt: "asc" },
        include: { metrics: { orderBy: { month: "desc" }, take: 1 } },
      },
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
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600 dark:text-gray-300">
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
                      className="h-16 w-16 rounded-2xl object-contain bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-xl font-bold">
                      {getInitials(client.name)}
                    </div>
                  )}
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{client.name}</h2>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <EditClientDialog client={client} />
                  </div>
                </div>

                <div className="mb-4">
                  <ClientLogoUpload clientId={client.id} logoUrl={client.logoUrl} />
                </div>
                <div className="space-y-3">
                  {client.company && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {client.company}
                    </div>
                  )}
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 hover:underline">
                    <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    {client.email}
                  </a>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {client.phone}
                    </div>
                  )}
                  {client.website && (
                    <a href={client.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400 hover:underline">
                      <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      {client.website}
                    </a>
                  )}
                  {(client.address || client.city) && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5" />
                      <span>
                        {client.address && <>{client.address}<br /></>}
                        {client.city}, {client.state} – {client.country}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Cliente desde {formatDate(client.clientSince || client.createdAt)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {(client.includesSocialMedia || client.includesGoogleAds || client.includesMenuMgmt || client.includesWebsiteCreation) && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-500" />
                    Produtos Contratados
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  {client.includesSocialMedia && (
                    <p>
                      Social Media
                      {client.socialNetworksCount != null && ` · ${client.socialNetworksCount} rede(s)`}
                      {client.postsPerWeek != null && ` · ${client.postsPerWeek} post(s)/sem`}
                      {client.storiesPerWeek != null && ` · ${client.storiesPerWeek} stories/sem`}
                      {client.reelsPerWeek != null && ` · ${client.reelsPerWeek} reel(s)/sem`}
                    </p>
                  )}
                  {client.includesGoogleAds && <p>Google Ads</p>}
                  {client.includesMenuMgmt && (
                    <p>
                      Cardápio Digital
                      {client.menuPlatforms && ` · ${client.menuPlatforms.split(",").join(", ")}`}
                    </p>
                  )}
                  {client.includesWebsiteCreation && <p>Criação de Site</p>}
                </CardContent>
              </Card>
            )}

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Users2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    Redes Sociais
                  </CardTitle>
                  <NewSocialAccountDialog clientId={client.id} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {client.socialAccounts.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma rede social cadastrada.</p>
                ) : (
                  client.socialAccounts.map((account) => {
                    const latest = account.metrics[0];
                    const label = `${platformLabel[account.platform] || account.platform} · ${account.handle}`;
                    return (
                      <div key={account.id} className="flex items-center justify-between p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {account.url ? (
                            <a
                              href={account.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-orange-600 dark:text-orange-400 hover:underline truncate"
                            >
                              {label}
                            </a>
                          ) : (
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{label}</p>
                          )}
                          {account.platform === "INSTAGRAM" && (
                            <RefreshFollowersButton socialAccountId={account.id} clientId={client.id} />
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {latest && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {latest.followers.toLocaleString("pt-BR")} seguidores
                            </span>
                          )}
                          <DeleteSocialAccountButton id={account.id} label={label} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
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
                  <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{client.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right - Contracts & Invoices */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Contratos ({client.contracts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.contracts.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhum contrato cadastrado.</p>
                )}
                {client.contracts.map((contract) => {
                  const cStatus = contractStatusMap[contract.status];
                  return (
                    <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{contract.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Início: {formatDate(contract.startDate)}
                            {contract.endDate && ` · Fim: ${formatDate(contract.endDate)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(contract.value)}</span>
                        <Badge variant={cStatus.variant}>{cStatus.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Faturas ({client.invoices.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.invoices.length === 0 && (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma fatura cadastrada.</p>
                )}
                {client.invoices.map((invoice) => {
                  const iStatus = invoiceStatusMap[invoice.status];
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-200 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{invoice.number}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Vence: {formatDate(invoice.dueDate)}
                          {invoice.paidAt && ` · Pago em ${formatDate(invoice.paidAt)}`}
                          {invoice.status === "PARTIALLY_PAID" &&
                            ` · recebido ${formatCurrency(paidAmount(invoice))} · falta ${formatCurrency(remainingAmount(invoice))}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(invoice.total)}</span>
                        <Badge variant={iStatus.variant}>{iStatus.label}</Badge>
                        {invoice.status === "PAID" && (
                          <Link href={`/recibo/${invoice.id}`}>
                            <Button variant="ghost" size="sm" className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 h-7">
                              Recibo
                            </Button>
                          </Link>
                        )}
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
