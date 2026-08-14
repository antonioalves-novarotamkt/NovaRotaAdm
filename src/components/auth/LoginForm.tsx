"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLogo } from "@/components/layout/BrandLogo";

function LoginFormInner({ logoUrl }: { logoUrl?: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(
        result.error === "LOCKED"
          ? "Muitas tentativas de login. Tente novamente em alguns minutos ou redefina sua senha."
          : "Email ou senha inválidos."
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-sm border-0 shadow-xl">
      <CardContent className="p-8">
        <div className="flex flex-col items-center gap-2 mb-6">
          <BrandLogo logoUrl={logoUrl} size={140} />
          <p className="text-xs text-gray-500 dark:text-gray-400">Entre para gerenciar sua agência</p>
        </div>

        {resetSuccess && (
          <p className="mb-3 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 rounded-md px-3 py-2 text-center">
            Senha redefinida com sucesso. Entre com sua nova senha.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <Link
          href="/esqueci-senha"
          className="mt-4 block text-center text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Esqueci minha senha
        </Link>
      </CardContent>
    </Card>
  );
}

export function LoginForm({ logoUrl }: { logoUrl?: string | null }) {
  return (
    <Suspense fallback={null}>
      <LoginFormInner logoUrl={logoUrl} />
    </Suspense>
  );
}
