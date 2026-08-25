"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateOwnPassword } from "@/app/actions/users";

export function ChangePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateOwnPassword(formData);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao alterar senha.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Senha Atual</label>
          <Input name="currentPassword" type="password" placeholder="••••••••" required className="border-gray-200 dark:border-gray-700" />
        </div>
        <div />
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Nova Senha</label>
          <Input name="newPassword" type="password" placeholder="••••••••" required minLength={6} className="border-gray-200 dark:border-gray-700" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">Confirmar Senha</label>
          <Input name="confirmPassword" type="password" placeholder="••••••••" required minLength={6} className="border-gray-200 dark:border-gray-700" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      {success && <p className="text-xs text-green-600 dark:text-green-400">Senha alterada com sucesso.</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="outline" disabled={isPending}>
          {isPending ? "Alterando..." : "Alterar Senha"}
        </Button>
      </div>
    </form>
  );
}
