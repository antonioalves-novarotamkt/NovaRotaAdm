import { Header } from "@/components/layout/Header";
import { ProspeccaoSearch } from "@/components/prospeccao/ProspeccaoSearch";

export const dynamic = "force-dynamic";
// A busca via AIsa (Perplexity Sonar) pode levar dezenas de segundos por causa da
// pesquisa profunda em Maps/Instagram/LinkedIn. Estende o tempo maximo da funcao
// serverless que atende essa pagina (o padrao de 10s no plano Hobby da Vercel nao
// seria suficiente para a busca terminar).
export const maxDuration = 60;

export default function ProspeccaoPage() {
  return (
    <div>
      <Header
        title="Prospecção"
        subtitle="Busque empresas por categoria e cidade — escolha as fontes abaixo e os resultados entram automaticamente como Leads no Funil de Vendas"
      />
      <div className="p-6">
        <ProspeccaoSearch />
      </div>
    </div>
  );
}
