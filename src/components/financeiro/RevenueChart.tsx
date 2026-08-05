"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface ChartPoint {
  month: string;
  receita: number;
}

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28} barGap={4}>
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
        <Bar dataKey="receita" name="Receita Recebida" fill="#EA580C" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
