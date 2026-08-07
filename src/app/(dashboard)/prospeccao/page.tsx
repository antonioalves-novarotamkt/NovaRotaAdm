import { Header } from "@/components/layout/Header";
import { ProspeccaoSearch } from "@/components/prospeccao/ProspeccaoSearch";

export const dynamic = "force-dynamic";

export default function ProspeccaoPage() {
  return (
    <div>
      <Header
        title="Prospecção"
        subtitle="Busque empresas no Google por categoria e cidade — os resultados entram automaticamente como Leads no Funil de Vendas"
      />
      <div className="p-6">
        <ProspeccaoSearch />
      </div>
    </div>
  );
}
