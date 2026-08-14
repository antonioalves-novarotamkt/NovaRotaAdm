import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmailEnviadoPage() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-500/10 mx-auto mb-4">
            <MailCheck className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Verifique seu email</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Se o email informado estiver cadastrado, você vai receber um link para redefinir sua senha em instantes.
          </p>
          <Link href="/login">
            <Button className="w-full bg-orange-600 hover:bg-orange-700">Voltar para o login</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
