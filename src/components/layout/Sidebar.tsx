"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  DollarSign,
  BarChart2,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/projetos", label: "Projetos", icon: FolderOpen },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/metricas", label: "Métricas", icon: BarChart2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">NovaRota</p>
          <p className="text-[#64748b] text-xs">Agency Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#94a3b8] hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5", isActive ? "text-white" : "text-[#64748b]")} size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user section */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            NR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">Admin User</p>
            <p className="text-[#64748b] text-xs truncate">admin@novarota.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
