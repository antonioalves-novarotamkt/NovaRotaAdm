"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { month: "Jan", receita: 42000, despesas: 28000, lucro: 14000 },
  { month: "Fev", receita: 38000, despesas: 25000, lucro: 13000 },
  { month: "Mar", receita: 55000, despesas: 32000, lucro: 23000 },
  { month: "Abr", receita: 48000, despesas: 30000, lucro: 18000 },
  { month: "Mai", receita: 62000, despesas: 35000, lucro: 27000 },
  { month: "Jun", receita: 58000, despesas: 33000, lucro: 25000 },
  { month: "Jul", receita: 71000, despesas: 40000, lucro: 31000 },
  { month: "Ago", receita: 68000, despesas: 38000, lucro: 30000 },
  { month: "Set", receita: 75000, despesas: 42000, lucro: 33000 },
  { month: "Out", receita: 82000, despesas: 45000, lucro: 37000 },
  { month: "Nov", receita: 78000, despesas: 43000, lucro: 35000 },
  { month: "Dez", receita: 95000, despesas: 50000, lucro: 45000 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(value);

export function RevenueChart() {
  return (
    <Card className="border-0 shadow-sm col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">Receita vs Despesas</CardTitle>
        <p className="text-xs text-gray-500">Visão anual de 2024</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={70} />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
            <Area type="monotone" dataKey="receita" name="Receita" stroke="#3b82f6" strokeWidth={2} fill="url(#colorReceita)" />
            <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" strokeWidth={2} fill="url(#colorLucro)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
