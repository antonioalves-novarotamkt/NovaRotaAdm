"use client";

import { useState } from "react";
import { Plus, Search, Download, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const invoices = [
  { id: "1", number: "NF-2024-001", client: "TechBrasil Ltda", amount: 15000, tax: 1500, total: 16500, status: "PAID", issueDate: new Date("2024-01-01"), dueDate: new Date("2024-01-15"), paidAt: new Date("2024-01-12") },
  { id: "2", number: "NF-2024-002", client: "StartupXYZ", amount: 8500, tax: 850, total: 9350, status: "PENDING", issueDate: new Date("2024-01-15"), dueDate: new Date("2024-02-10") },
  { id: "3", number: "NF-2024-003", client: "Loja Moderna", amount: 4200, tax: 420, total: 4620, status: "OVERDUE", issueDate: new Date("2024-01-10"), dueDate: new Date("2024-01-28") },
  { id: "4", number: "NF-2024-004", client: "Restaurante Bella", amount: 3000, tax: 300, total: 3300, status: "PAID", issueDate: new Date("2024-01-05"), dueDate: new Date("2024-01-20"), paidAt: new Date("2024-01-18") },
  { id: "5", number: "NF-2024-005", client: "Clínica Saúde+", amount: 2500, tax: 250, total: 2750, status: "PAID", issueDate: new Date("2024-01-08"), dueDate: new Date("2024-01-22"), paidAt: new Date("2024-01-20") },
  { id: "6", number: "NF-2024-006", client: "EduTech Academy", amount: 9800, tax: 980, total: 10780, status: "PENDING", issueDate: new Date("2024-01-20"), dueDate: new Date("2024-02-15") },
  { id: "7", number: "NF-2024-007", client: "FashionHub", amount: 6000, tax: 600, total: 6600, status: "DRAFT", issueDate: new Date("2024-01-25"), dueDate: new Date("2024-02-25") },
];

const chartData = [
  { month: "Ago", receita: 68000, despesas: 38000 },
  { month: "Set", receita: 75000, despesas: 42000 },
  { month: "Out", receita: 82000, despesas: 45000 },
  { month: "Nov", receita: 78000, despesas: 43000 },
  { month: "Dez", receita: 95000, despesas: 50000 },
  { month: "Jan", receita: 78500, despesas: 43200 },
];

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "danger" | "gray" }> = {
  PAID: { label: "Pago", variant: "success" },
  PENDING: { label: "Pendente", variant: "warning" },
  OVERDUE: { label: "Atrasado", variant: "danger" },
  DRAFT: { label: "Rascunho", variant: "gray" },
  CANCELLED: { label: "Cancelado", variant: "gray" },
};

export default function FinanceiroPage() {
  const [tab, setTab] = useState<"invoices" | "payments">("invoices");

  const paid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const pending = invoices.filter((i) => i.status === "PENDING").reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.total, 0);
  const total = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div>
      <Header title="Financeiro" subtitle="Gerencie faturamento, cobranças e relatórios financeiros" />
      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Receita Total (Jan)</p>
                <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(total)}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600 font-medium">+12.5%</span>
                <span className="text-xs text-gray-400">vs dez/23</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Recebido</p>
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(paid)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "PAID").length} faturas pagas</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">A Receber</p>
                <div className="h-8 w-8 rounded-lg bg-yellow-50 flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pending)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "PENDING").length} faturas pendentes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">Em Atraso</p>
                <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(overdue)}</p>
              <p className="text-xs text-gray-400 mt-1">{invoices.filter((i) => i.status === "OVERDUE").length} faturas vencidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Receita x Despesas (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={28} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact", currency: "BRL", style: "currency" }).format(v)}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                />
                <Bar dataKey="receita" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesas" name="Despesas" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-900">Faturas</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar fatura..." className="pl-9 h-8 text-xs bg-gray-50 border-gray-200" />
                </div>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </Button>
                <Button size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-3.5 w-3.5" />
                  Nova Fatura
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Número</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Emissão</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimento</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice, idx) => {
                    const status = statusMap[invoice.status];
                    return (
                      <tr key={invoice.id} className={`border-b last:border-0 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{invoice.number}</td>
                        <td className="px-6 py-4 text-gray-600">{invoice.client}</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(invoice.issueDate)}</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(invoice.dueDate)}</td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(invoice.total)}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 h-7">
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
