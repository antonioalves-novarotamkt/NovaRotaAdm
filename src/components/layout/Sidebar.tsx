"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  DollarSign,
  BarChart2,
  Settings,
  FileText,
  ClipboardList,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/atividades", label: "Atividades", icon: ClipboardList },
  { href: "/projetos", label: "Posts", icon: FolderOpen },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/metricas", label: "Métricas", icon: BarChart2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Usuário";
  const userEmail = session?.user?.email || "";

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center px-4 py-6 bg-white overflow-hidden">
        <BrandLogo logoUrl={logoUrl} size={100} />
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
                  ? "bg-orange-600 text-white shadow-sm"
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
          <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {getInitials(userName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{userName}</p>
            <p className="text-[#64748b] text-xs truncate">{userEmail}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-[#64748b] hover:text-white transition-colors shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
