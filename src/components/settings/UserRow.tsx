"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils";
import { updateUserRole, deleteUser } from "@/app/actions/users";

interface UserRowProps {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isCurrentUser: boolean;
}

const roleLabel: Record<string, { label: string; variant: "info" | "success" | "gray" }> = {
  ADMIN: { label: "Administrador", variant: "success" },
  MANAGER: { label: "Gerente", variant: "info" },
  USER: { label: "Usuário", variant: "gray" },
};

export function UserRow({ id, name, email, role, isCurrentUser }: UserRowProps) {
  const [isPending, startTransition] = useTransition();
  const badge = roleLabel[role] || roleLabel.USER;

  function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const formData = new FormData();
    formData.set("userId", id);
    formData.set("role", e.target.value);
    startTransition(() => updateUserRole(formData));
  }

  function handleDelete() {
    if (confirm(`Remover o acesso de ${name || email}?`)) {
      const formData = new FormData();
      formData.set("userId", id);
      startTransition(() => deleteUser(formData));
    }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
          {getInitials(name || email)}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{name || "—"}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {isCurrentUser ? (
          <Badge variant={badge.variant}>{badge.label}</Badge>
        ) : (
          <select
            defaultValue={role}
            onChange={handleRoleChange}
            disabled={isPending}
            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs"
          >
            <option value="USER">Usuário</option>
            <option value="MANAGER">Gerente</option>
            <option value="ADMIN">Administrador</option>
          </select>
        )}
        {!isCurrentUser && (
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="h-8 w-8 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            title="Remover usuário"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
