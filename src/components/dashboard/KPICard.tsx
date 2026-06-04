import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: "up" | "down" | "neutral";
  icon: React.ReactNode;
  iconBg?: string;
}

export function KPICard({ title, value, change, changeLabel, trend, icon, iconBg }: KPICardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-gray-500";
  const trendBg =
    trend === "up" ? "bg-green-50" : trend === "down" ? "bg-red-50" : "bg-gray-100";

  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", iconBg || "bg-blue-50")}>
            {icon}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5">
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", trendBg, trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>{Math.abs(change)}%</span>
          </div>
          <span className="text-xs text-gray-500">{changeLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}
