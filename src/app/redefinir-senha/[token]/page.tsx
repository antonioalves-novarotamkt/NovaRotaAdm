import Link from "next/link";
import { Zap, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { resetPassword } from "@/app/actions/password-reset";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  weak: "A senha precisa ter pelo menos 6 caracteres.",
  mismatch: "As senhas não coincidem.",
  expired: "Esse link expirou ou já foi usado. Solicite um novo.",
};

export default async function RedefinirSenhaPage({
  params,
  searchParams,
}: {
  params: { token: string };
  searchParams: { error?: string };
}) {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: params.token },
  });

  const isValid = !!resetToken && resetToken.expiresAt > new Date();
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] : null;

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Redefinir senha</h1>
          </div>

          {!isValid ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-gray-500">
                Esse link é inválido ou expirou. Solicite um novo link de redefinição.
              </p>
              <Link href="/esqueci-senha">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Solicitar novo link</Button>
              </Link>
            </div>
          ) : (
            <form action={resetPassword} className="space-y-3">
              <input type="hidden" name="token" value={params.token} />
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="password" name="password" placeholder="Nova senha" className="pl-9" required minLength={6} />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input type="password" name="confirmPassword" placeholder="Confirmar nova senha" className="pl-9" required minLength={6} />
              </div>
              {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Redefinir senha
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
