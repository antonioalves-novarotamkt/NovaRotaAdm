import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Shield, Palette, Database, CreditCard } from "lucide-react";

export default function ConfiguracoesPage() {
  return (
    <div>
      <Header title="Configurações" subtitle="Gerencie sua conta e preferências do sistema" />
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Profile */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-600" />
              <CardTitle className="text-base font-semibold text-gray-900">Perfil do Usuário</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
                AD
              </div>
              <div>
                <p className="font-semibold text-gray-900">Admin User</p>
                <p className="text-sm text-gray-500">admin@novarota.com</p>
                <Badge variant="info" className="mt-1">Administrador</Badge>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">Alterar Foto</Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nome Completo</label>
                <Input defaultValue="Admin User" className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Email</label>
                <Input defaultValue="admin@novarota.com" type="email" className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Telefone</label>
                <Input placeholder="(11) 99999-9999" className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Cargo</label>
                <Input defaultValue="Gerente de Agência" className="border-gray-200" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
            </div>
          </CardContent>
        </Card>

        {/* Agency Info */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-600" />
              <CardTitle className="text-base font-semibold text-gray-900">Dados da Agência</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nome da Agência</label>
                <Input defaultValue="NovaRota Marketing" className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">CNPJ</label>
                <Input placeholder="00.000.000/0001-00" className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Website</label>
                <Input placeholder="https://novarota.com.br" className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Telefone</label>
                <Input placeholder="(11) 3333-4444" className="border-gray-200" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Salvar</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" />
              <CardTitle className="text-base font-semibold text-gray-900">Notificações</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Faturas vencendo", desc: "Receber alertas 3 dias antes do vencimento", enabled: true },
              { label: "Novos projetos", desc: "Notificar quando um novo projeto for criado", enabled: true },
              { label: "Tarefas atribuídas", desc: "Alertar sobre novas tarefas", enabled: false },
              { label: "Relatórios semanais", desc: "Resumo de performance toda segunda-feira", enabled: true },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <div className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${item.enabled ? "bg-blue-600" : "bg-gray-200"} cursor-pointer`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5 ${item.enabled ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-600" />
              <CardTitle className="text-base font-semibold text-gray-900">Segurança</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Senha Atual</label>
                <Input type="password" placeholder="••••••••" className="border-gray-200" />
              </div>
              <div />
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Nova Senha</label>
                <Input type="password" placeholder="••••••••" className="border-gray-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Confirmar Senha</label>
                <Input type="password" placeholder="••••••••" className="border-gray-200" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline">Alterar Senha</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
