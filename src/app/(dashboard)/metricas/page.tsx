"use client";

import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const performanceData = [
  { month: "Jul", impressoes: 420000, cliques: 18900, conversoes: 945 },
  { month: "Ago", impressoes: 480000, cliques: 22080, conversoes: 1104 },
  { month: "Set", impressoes: 510000, cliques: 24480, conversoes: 1224 },
  { month: "Out", impressoes: 560000, cliques: 28000, conversoes: 1400 },
  { month: "Nov", impressoes: 620000, cliques: 31000, conversoes: 1550 },
  { month: "Dez", impressoes: 720000, cliques: 39600, conversoes: 1980 },
  { month: "Jan", impressoes: 680000, cliques: 35360, conversoes: 1768 },
];

const platformData = [
  { platform: "Google Ads", spend: 32000, revenue: 98000, roas: 3.06, ctr: 4.8, conversoes: 890 },
  { platform: "Meta Ads", spend: 18000, revenue: 54000, roas: 3.0, ctr: 3.2, conversoes: 620 },
  { platform: "LinkedIn Ads", spend: 8000, revenue: 28000, roas: 3.5, ctr: 1.8, conversoes: 180 },
  { platform: "TikTok Ads", spend: 5000, revenue: 12000, roas: 2.4, ctr: 5.5, conversoes: 158 },
];

const pieData = [
  { name: "Google Ads", value: 32000, color: "#3b82f6" },
  { name: "Meta Ads", value: 18000, color: "#8b5cf6" },
  { name: "LinkedIn", value: 8000, color: "#06b6d4" },
  { name: "TikTok", value: 5000, color: "#ec4899" },
];

const campaignData = [
  { name: "TechBrasil B2B Lead Gen", platform: "Google Ads", status: "ACTIVE", impressoes: 280000, cliques: 14000, ctr: 5.0, conversoes: 700, roas: 3.8 },
  { name: "StartupXYZ Brand Awareness", platform: "Meta Ads", status: "ACTIVE", impressoes: 520000, cliques: 15600, ctr: 3.0, conversoes: 312, roas: 2.9 },
  { name: "Loja Moderna Shopping", platform: "Google Ads", status: "PAUSED", impressoes: 180000, cliques: 9000, ctr: 5.0, conversoes: 450, roas: 4.2 },
  { name: "Clínica Saúde+ Consultas", platform: "Meta Ads", status: "ACTIVE", impressoes: 95000, cliques: 2850, ctr: 3.0, conversoes: 142, roas: 3.1 },
  { name: "EduTech Curso Online", platform: "LinkedIn Ads", status: "ACTIVE", impressoes: 48000, cliques: 864, ctr: 1.8, conversoes: 86, roas: 3.5 },
];

const ROAS_COLOR = (roas: number) => roas >= 3 ? "text-green-600" : roas >= 2 ? "text-yellow-600" : "text-red-500";

export default function MetricasPage() {
  const totalImpressions = performanceData[performanceData.length - 1].impressoes;
  const totalCliques = performanceData[performanceData.length - 1].cliques;
  const totalConversoes = performanceData[performanceData.length - 1].conversoes;
  const avgCTR = ((totalCliques / totalImpressions) * 100).toFixed(2);
  const totalSpend = platformData.reduce((s, p) => s + p.spend, 0);
  const totalRevenue = platformData.reduce((s, p) => s + p.revenue, 0);
  const avgROAS = (totalRevenue / totalSpend).toFixed(2);

  return (
    <div>
      <Header title="Métricas & Relatórios" subtitle="KPIs de campanhas e performance de marketing" />
      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Impressões", value: (totalImpressions / 1000).toFixed(0) + "K", sub: "último mês", color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Cliques", value: (totalCliques / 1000).toFixed(1) + "K", sub: "último mês", color: "text-purple-600", bg: "bg-purple-50" },
            { label: "CTR Médio", value: avgCTR + "%", sub: "todos os canais", color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "Conversões", value: totalConversoes.toLocaleString("pt-BR"), sub: "último mês", color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "ROAS Médio", value: avgROAS + "x", sub: "retorno sobre ad spend", color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Investimento", value: "R$" + (totalSpend / 1000).toFixed(0) + "K", sub: "mês atual", color: "text-rose-600", bg: "bg-rose-50" },
          ].map((kpi) => (
            <Card key={kpi.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`h-8 w-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                  <div className={`h-2 w-2 rounded-full ${kpi.color.replace("text-", "bg-")}`} />
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-xs text-gray-400 leading-tight mt-0.5">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Performance Line Chart */}
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Performance de Campanhas</CardTitle>
              <p className="text-xs text-gray-500">Impressões, cliques e conversões (6 meses)</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60}
                    tickFormatter={(v) => v >= 1000 ? (v/1000).toFixed(0) + "K" : v} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                  <Line yAxisId="left" type="monotone" dataKey="impressoes" name="Impressões" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="cliques" name="Cliques" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="conversoes" name="Conversões" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Spend Distribution Pie */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-900">Distribuição de Investimento</CardTitle>
              <p className="text-xs text-gray-500">Por plataforma</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {((item.value / totalSpend) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Performance */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-gray-900">Performance por Plataforma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={platformData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="platform" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60}
                  tickFormatter={(v) => "R$" + (v / 1000).toFixed(0) + "K"} />
                <Tooltip formatter={(v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="spend" name="Investimento" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" name="Receita" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Campaign Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Campanhas Ativas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {["Campanha", "Plataforma", "Status", "Impressões", "Cliques", "CTR", "Conversões", "ROAS"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaignData.map((campaign, idx) => (
                    <tr key={idx} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap">{campaign.name}</td>
                      <td className="px-6 py-3 text-gray-500">{campaign.platform}</td>
                      <td className="px-6 py-3">
                        <Badge variant={campaign.status === "ACTIVE" ? "success" : "warning"}>
                          {campaign.status === "ACTIVE" ? "Ativa" : "Pausada"}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{(campaign.impressoes / 1000).toFixed(0)}K</td>
                      <td className="px-6 py-3 text-gray-600">{(campaign.cliques / 1000).toFixed(1)}K</td>
                      <td className="px-6 py-3 text-gray-600">{campaign.ctr.toFixed(1)}%</td>
                      <td className="px-6 py-3 text-gray-600">{campaign.conversoes}</td>
                      <td className={`px-6 py-3 font-bold ${ROAS_COLOR(campaign.roas)}`}>{campaign.roas.toFixed(1)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
