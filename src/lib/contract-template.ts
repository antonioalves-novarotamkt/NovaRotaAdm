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
  scheduleText?: string;
  dataAssinatura: string;
  services: ContractServiceConfig;
}

export function generateContractText(vars: ContractVars): string {
  const lines: string[] = [];
  const { services } = vars;
  let clause = 0;
  const nextClause = () => {
    clause += 1;
    return CLAUSE_ORDINALS[clause - 1] ?? `${clause}ª`;
  };

  lines.push("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL");
  lines.push("");
  lines.push(`CONTRATANTE: ${vars.clienteEmpresa}`);
  lines.push(`CONTRATADA: ${vars.agencia}`);
  lines.push("");
  lines.push(
    "As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços de Marketing Digital, que se regerá pelas cláusulas e condições a seguir."
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DO OBJETO`);
  lines.push(
    `O presente contrato tem como objeto a prestação, pela CONTRATADA à CONTRATANTE, dos serviços de marketing digital descritos na Cláusula seguinte, com o propósito de fortalecer a presença digital, a comunicação e os resultados comerciais da CONTRATANTE.`
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DO ESCOPO DOS SERVIÇOS`);
  lines.push("A CONTRATADA se compromete a executar os seguintes serviços:");
  lines.push("");

  if (services.includesSocialMedia) {
    lines.push("a) Gerenciamento de Redes Sociais:");
    if (services.socialNetworksCount) {
      lines.push(`   - Gestão de ${services.socialNetworksCount} rede(s) social(is) da CONTRATANTE;`);
    }
    if (services.postsPerWeek) {
      lines.push(`   - Criação e publicação de ${services.postsPerWeek} post(s) por semana;`);
    }
    if (services.reelsPerWeek) {
      lines.push(`   - Criação e publicação de ${services.reelsPerWeek} Reels/Stories por semana;`);
    }
    lines.push("   - Desenvolvimento de calendário editorial e linha estratégica de conteúdo;");
    lines.push("   - Monitoramento e interação com o público e seguidores da CONTRATANTE;");
    lines.push("   - Elaboração de legendas, artes e uso de hashtags relevantes ao segmento;");
    lines.push("");
  }

  if (services.includesGoogleAds) {
    lines.push("b) Gestão de Campanhas Google Ads:");
    lines.push("   - Criação, configuração e gerenciamento de campanhas de pesquisa e/ou display;");
    lines.push("   - Pesquisa e otimização de palavras-chave e segmentação de público-alvo;");
    lines.push("   - Acompanhamento contínuo de desempenho e ajustes de orçamento e lances;");
    lines.push("   - Envio de relatório mensal com métricas de impressões, cliques, conversões e custo por resultado;");
    lines.push("");
  }

  if (services.includesMenuMgmt) {
    lines.push("c) Gerenciamento de Cardápio Digital:");
    const platforms = services.menuPlatforms && services.menuPlatforms.length > 0 ? services.menuPlatforms.join(", ") : "a definir";
    lines.push(`   - Atualização e gestão do cardápio nas plataformas: ${platforms};`);
    lines.push("   - Ajuste de preços, disponibilidade e itens conforme solicitação da CONTRATANTE;");
    lines.push("   - Monitoramento de avaliações e pedidos nas plataformas contratadas;");
    lines.push("");
  }

  lines.push(
    "Parágrafo único. Qualquer serviço não expressamente listado nesta cláusula não está incluído no presente contrato, podendo ser objeto de aditivo contratual mediante acordo entre as partes."
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DO VALOR E DA FORMA DE PAGAMENTO`);
  lines.push(`Pela prestação dos serviços descritos na Cláusula Segunda, a CONTRATANTE pagará à CONTRATADA o valor de ${vars.valor}.`);
  if (vars.scheduleText) {
    lines.push(`A periodicidade de pagamento será: ${vars.scheduleText}.`);
  }
  lines.push(
    "Em caso de atraso no pagamento, a CONTRATADA poderá suspender a execução dos serviços até a regularização, sem prejuízo da cobrança de eventuais valores em aberto."
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DA VIGÊNCIA E RESCISÃO`);
  lines.push(
    "O presente contrato vigora por prazo indeterminado, a contar da data de assinatura, podendo ser rescindido por qualquer das partes mediante aviso prévio por escrito de, no mínimo, 30 (trinta) dias."
  );
  lines.push(
    "Serviços e conteúdos já produzidos e/ou publicados até a data de encerramento não serão desfeitos, sendo devidos os valores proporcionais aos serviços prestados até então."
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DAS OBRIGAÇÕES DA CONTRATANTE`);
  lines.push("a) Fornecer à CONTRATADA, em tempo hábil, as informações, materiais, acessos e aprovações necessários à execução dos serviços;");
  lines.push("b) Efetuar o pagamento dos valores devidos nos prazos estipulados neste contrato;");
  lines.push("c) Analisar e aprovar, ou solicitar ajustes, nos conteúdos submetidos pela CONTRATADA em prazo razoável;");
  lines.push("d) Garantir que possui os direitos necessários sobre marcas, imagens e materiais fornecidos à CONTRATADA.");
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DAS OBRIGAÇÕES DA CONTRATADA`);
  lines.push("a) Executar os serviços contratados com zelo, profissionalismo e dentro dos prazos acordados;");
  lines.push("b) Manter a CONTRATANTE informada sobre o andamento das atividades e resultados obtidos;");
  lines.push("c) Enviar relatório periódico com os principais indicadores de desempenho das ações realizadas;");
  lines.push("d) Zelar pelo sigilo de informações estratégicas e dados de acesso da CONTRATANTE.");
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DA CONFIDENCIALIDADE`);
  lines.push(
    "As partes se comprometem a manter sigilo sobre todas as informações confidenciais trocadas em razão deste contrato, incluindo estratégias, dados de acesso, resultados e informações comerciais, não as divulgando a terceiros sem autorização prévia e por escrito da outra parte."
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)`);
  lines.push(
    "As partes se comprometem a tratar quaisquer dados pessoais a que tiverem acesso em decorrência deste contrato em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais), utilizando-os exclusivamente para as finalidades relacionadas à execução dos serviços aqui previstos."
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DA PROPRIEDADE INTELECTUAL`);
  lines.push(
    "Os conteúdos, artes e materiais produzidos exclusivamente para a CONTRATANTE no âmbito deste contrato, uma vez quitados os respectivos pagamentos, poderão ser utilizados livremente pela CONTRATANTE. A CONTRATADA poderá exibir os trabalhos realizados em seu portfólio, salvo manifestação em contrário da CONTRATANTE."
  );
  lines.push("");

  lines.push(`CLÁUSULA ${nextClause()} — DO FORO`);
  lines.push(
    "Fica eleito o foro da comarca de domicílio da CONTRATADA para dirimir quaisquer dúvidas ou controvérsias oriundas do presente contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja."
  );
  lines.push("");

  lines.push(
    "E, por estarem justas e contratadas, as partes firmam o presente instrumento, em via única de igual teor, para que produza seus devidos efeitos legais."
  );
  lines.push("");
  lines.push(`${vars.dataAssinatura}`);
  lines.push("");
  lines.push("");
  lines.push("______________________________");
  lines.push(`${vars.agencia} — CONTRATADA`);
  lines.push("");
  lines.push("");
  lines.push("______________________________");
  lines.push(`${vars.clienteEmpresa} — CONTRATANTE`);

  return lines.join("\n");
}

const CLAUSE_ORDINALS = [
  "PRIMEIRA",
  "SEGUNDA",
  "TERCEIRA",
  "QUARTA",
  "QUINTA",
  "SEXTA",
  "SÉTIMA",
  "OITAVA",
  "NONA",
  "DÉCIMA",
];
