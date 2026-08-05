import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { requestPasswordReset } from "@/app/actions/password-reset";

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Esqueceu sua senha?</h1>
            <p className="text-xs text-gray-500 text-center">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
          </div>

          <form action={requestPasswordReset} className="space-y-3">
            <Input type="email" name="email" placeholder="Email" required />
            <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">
              Enviar link de redefinição
            </Button>
          </form>

          <Link
            href="/login"
            className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
