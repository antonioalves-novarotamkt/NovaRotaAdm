export interface ContractServiceConfig {
  includesSocialMedia: boolean;
  postsPerWeek?: number;
  reelsPerWeek?: number;
  socialNetworksCount?: number;
  includesGoogleAds: boolean;
  includesMenuMgmt: boolean;
  menuPlatforms?: string[];
}

export interface ContractVars {
  clienteEmpresa: string;
  agencia: string;
  valor: string;
  paymentDay?: number;
  dataAssinatura: string;
  services: ContractServiceConfig;
}

export function generateContractText(vars: ContractVars): string {
  const lines: string[] = [];
  const { services } = vars;

  lines.push("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL");
  lines.push(vars.agencia);
  lines.push("");
  lines.push("Objeto do Contrato:");
  lines.push(
    `O prestador de serviços se compromete a realizar os seguintes serviços de marketing digital para ${vars.clienteEmpresa}:`
  );
  lines.push("");

  if (services.includesSocialMedia) {
    lines.push("Gerenciamento de Redes Sociais:");
    if (services.socialNetworksCount) {
      lines.push(`Gestão de ${services.socialNetworksCount} rede(s) social(is).`);
    }
    if (services.postsPerWeek) {
      lines.push(`Criação e publicação de ${services.postsPerWeek} post(s) por semana.`);
    }
    if (services.reelsPerWeek) {
      lines.push(`Criação e publicação de ${services.reelsPerWeek} Reels/Stories por semana.`);
    }
    lines.push("Desenvolvimento de calendário de conteúdo estratégico.");
    lines.push("Monitoramento e interação com os seguidores do cliente.");
    lines.push("Elaboração de legendas persuasivas e uso de hashtags relevantes.");
    lines.push("");
  }

  if (services.includesGoogleAds) {
    lines.push("Campanhas de Google Ads:");
    lines.push("Criação e gerenciamento de campanhas de pesquisa no Google Ads para aumentar a visibilidade online do cliente.");
    lines.push("Otimização de palavras-chave e segmentação de público-alvo para maximizar o retorno do investimento.");
    lines.push("Monitoramento contínuo do desempenho das campanhas e ajustes conforme necessário para alcançar os melhores resultados.");
    lines.push("Elaboração de relatórios mensais detalhados sobre o desempenho das campanhas, incluindo métricas como impressões, cliques, conversões e custo por clique.");
    lines.push("");
  }

  if (services.includesMenuMgmt) {
    lines.push("Gerenciamento de Cardápio Digital:");
    const platforms = services.menuPlatforms && services.menuPlatforms.length > 0 ? services.menuPlatforms.join(", ") : "a definir";
    lines.push(`Atualização e gestão do cardápio nas plataformas: ${platforms}.`);
    lines.push("Ajuste de preços, disponibilidade e itens conforme solicitação do cliente.");
    lines.push("Monitoramento de avaliações e pedidos nas plataformas contratadas.");
    lines.push("");
  }

  lines.push("Valor e Forma de Pagamento:");
  lines.push(`O valor mensal dos serviços é de ${vars.valor}.`);
  if (vars.paymentDay) {
    lines.push(`O pagamento será todo dia ${vars.paymentDay} de cada mês.`);
  }
  lines.push("");

  lines.push("Prazo de Vigência:");
  lines.push("O presente contrato poderá ser rescindido por qualquer uma das partes, mediante aviso prévio de 30 (trinta) dias.");
  lines.push("");

  lines.push("Obrigações do Cliente:");
  lines.push("Fornecer ao prestador de serviços todas as informações e materiais necessários para a execução dos serviços.");
  lines.push("Realizar o pagamento dos serviços no prazo estipulado.");
  lines.push("Aprovar os conteúdos criados pelo prestador de serviços antes da publicação.");
  lines.push("");

  lines.push("Obrigações do Prestador de Serviços:");
  lines.push("Executar os serviços com profissionalismo e qualidade.");
  lines.push("Manter o cliente informado sobre o andamento dos serviços.");
  lines.push("Respeitar os prazos estabelecidos.");
  lines.push("Enviar relatórios mensais com os resultados das ações de marketing.");
  lines.push("");

  lines.push("Assinaturas:");
  lines.push("");
  lines.push("");
  lines.push("______________________________");
  lines.push(vars.agencia);
  lines.push("");
  lines.push("");
  lines.push("______________________________");
  lines.push(vars.clienteEmpresa);
  lines.push("");
  lines.push(`Data: ${vars.dataAssinatura}`);

  return lines.join("\n");
}
