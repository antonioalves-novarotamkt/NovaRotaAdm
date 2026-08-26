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
  Wallet,
  Target,
  LineChart,
  LogOut,
  Search,
  X,
  Kanban,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { useSidebar } from "@/components/layout/SidebarContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/funil", label: "Funil de Vendas", icon: Target },
  { href: "/prospeccao", label: "Prospecção", icon: Search },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/tarefas", label: "Tarefas", icon: Kanban },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/atividades", label: "Atividades", icon: ClipboardList },
  { href: "/analises", label: "Análises", icon: LineChart },
  { href: "/projetos", label: "Posts", icon: FolderOpen },
  { href: "/vendas", label: "Vendas App Clientes", icon: ShoppingCart },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/custos", label: "Custos", icon: Wallet },
  { href: "/metricas", label: "Métricas", icon: BarChart2 },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ logoUrl }: { logoUrl?: string | null }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open, close } = useSidebar();
  const userName = session?.user?.name || "Usuário";
  const userEmail = session?.user?.email || "";
  const userImage = (session?.user as { image?: string | null } | undefined)?.image;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden print:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-[#0f172a] flex flex-col z-40 transition-transform duration-200 ease-in-out print:hidden",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-6 bg-white overflow-hidden">
          <BrandLogo logoUrl={logoUrl} size={100} />
          <button
            onClick={close}
            className="text-gray-400 hover:text-gray-700 lg:hidden shrink-0"
            title="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
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
            {userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userImage} alt={userName} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {getInitials(userName)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{userName}</p>
              <p className="text-[#64748b] text-xs truncate">{userEmail}</p>
            </div>
            <ThemeToggle />
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
    </>
  );
}
