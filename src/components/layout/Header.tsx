"use client";

import { useSession } from "next-auth/react";
import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/layout/SidebarContext";
import { getInitials } from "@/lib/utils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { toggle } = useSidebar();
  const { data: session } = useSession();
  const userName = session?.user?.name || "Usuário";
  const userImage = (session?.user as { image?: string | null } | undefined)?.image;

  return (
    <header className="h-16 border-b dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="lg:hidden shrink-0 h-9 w-9 rounded-md flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          title="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 sm:line-clamp-none">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            className="pl-9 w-56 h-9 text-sm bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        {userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userImage} alt={userName} className="h-8 w-8 rounded-full object-cover cursor-pointer" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
            {getInitials(userName)}
          </div>
        )}
      </div>
    </header>
  );
}
