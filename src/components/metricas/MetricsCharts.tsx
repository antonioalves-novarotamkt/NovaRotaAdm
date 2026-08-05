"use client";

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
import { formatCurrency } from "@/lib/utils";

interface PerformancePoint {
  month: string;
  impressoes: number;
  cliques: number;
  conversoes: number;
}

interface PlatformPoint {
  platform: string;
  spend: number;
  revenue: number;
}

const PIE_COLORS = ["#EA580C", "#8b5cf6", "#06b6d4", "#ec4899", "#f59e0b", "#10b981"];

export function PerformanceLineChart({ data }: { data: PerformancePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60}
          tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(0) + "K" : v)} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={50} />
        <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
        <Line yAxisId="left" type="monotone" dataKey="impressoes" name="Impressões" stroke="#EA580C" strokeWidth={2} dot={false} />
        <Line yAxisId="left" type="monotone" dataKey="cliques" name="Cliques" stroke="#8b5cf6" strokeWidth={2} dot={false} />
        <Line yAxisId="right" type="monotone" dataKey="conversoes" name="Conversões" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981" }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function SpendPieChart({ data }: { data: PlatformPoint[] }) {
  const total = data.reduce((s, p) => s + p.spend, 0);
  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="spend" nameKey="platform">
            {data.map((entry, index) => (
              <Cell key={entry.platform} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-1.5">
        {data.map((item, index) => (
          <div key={item.platform} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
              <span className="text-gray-600">{item.platform}</span>
            </div>
            <span className="font-semibold text-gray-900">
              {total > 0 ? ((item.spend / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

export function PlatformBarChart({ data }: { data: PlatformPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis dataKey="platform" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={60}
          tickFormatter={(v) => "R$" + (v / 1000).toFixed(0) + "K"} />
        <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: "8px", fontSize: "12px" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
        <Bar dataKey="spend" name="Investimento" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
        <Bar dataKey="revenue" name="Receita" fill="#EA580C" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
