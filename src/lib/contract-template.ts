export interface ContractServiceConfig {
  includesSocialMedia: boolean;
  postsPerWeek?: number;
  storiesPerWeek?: number;
  reelsPerWeek?: number;
  socialNetworksCount?: number;
  includesGoogleAds: boolean;
  includesMenuMgmt: boolean;
  menuPlatforms?: string[];
  includesWebsiteCreation: boolean;
}

export interface ContractVars {
  clienteEmpresa: string;
  agencia: string;
  valor: string;
  scheduleText?: string;
  startDate: Date;
  endDate?: Date | null;
  signatureDate: Date;
  services: ContractServiceConfig;
}

const LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function longDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function generateContractText(vars: ContractVars): string {
  const lines: string[] = [];
  const { services } = vars;
  let clauseNum = 0;

  const clause = (title: string) => {
    clauseNum += 1;
    lines.push(`CLÁUSULA ${clauseNum}ª – ${title}`);
    lines.push("");
    return clauseNum;
  };

  const sub = (num: number, subIdx: number, text: string) => {
    lines.push(`${num}.${subIdx}. ${text}`);
  };

  const item = (letter: string, text: string) => {
    lines.push(`   ${letter}) ${text}`);
  };

  const blank = () => lines.push("");

  lines.push("CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL");
  blank();
  lines.push(
    "Pelo presente instrumento particular de contrato de prestação de serviços, celebrado entre as partes a seguir qualificadas:"
  );
  blank();
  lines.push(`CONTRATANTE: ${vars.clienteEmpresa}, doravante denominado(a) simplesmente CONTRATANTE;`);
  blank();
  lines.push(`CONTRATADA: ${vars.agencia}, doravante denominada simplesmente CONTRATADA;`);
  blank();
  lines.push(
    "As partes acima qualificadas têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente."
  );
  blank();

  // CLÁUSULA — DO OBJETO
  {
    const n = clause("DO OBJETO");
    sub(n, 1, "O presente contrato tem como objeto a prestação dos seguintes serviços:");
    blank();

    let letterIdx = 0;
    const nextLetter = () => LETTERS[letterIdx++] ?? String(letterIdx);

    if (services.includesSocialMedia) {
      const postsPart = services.postsPerWeek ? ` (${services.postsPerWeek} por semana)` : "";
      const storiesPart = services.storiesPerWeek ? ` (${services.storiesPerWeek} por semana)` : "";
      const reelsPart = services.reelsPerWeek ? ` (${services.reelsPerWeek} por semana)` : "";
      const networksPart = services.socialNetworksCount ? ` em ${services.socialNetworksCount} rede(s) social(is)` : "";
      item(nextLetter(), `Elaboração de calendário editorial e criação de posts para redes sociais${postsPart}${networksPart};`);
      item(nextLetter(), `Produção de stories para redes sociais${storiesPart};`);
      item(nextLetter(), `Produção de reels para redes sociais${reelsPart};`);
      item(nextLetter(), "Gestão e resposta de comentários e mensagens nas redes sociais;");
    }

    if (services.includesGoogleAds) {
      item(nextLetter(), "Gestão de campanhas de anúncios pagos em plataformas digitais;");
      item(nextLetter(), "Criação de peças visuais e criativos para campanhas de anúncios;");
    }

    if (services.includesMenuMgmt) {
      const platforms = services.menuPlatforms && services.menuPlatforms.length > 0 ? services.menuPlatforms.join(", ") : "a definir";
      item(nextLetter(), `Gerenciamento do cardápio digital nas plataformas: ${platforms};`);
    }

    if (services.includesWebsiteCreation) {
      item(nextLetter(), "Criação e/ou manutenção do site institucional da CONTRATANTE;");
    }

    item(nextLetter(), "Apresentação de relatório mensal de desempenho com as principais métricas dos serviços prestados.");
    blank();
    sub(
      n,
      2,
      "Os serviços serão executados conforme as especificações acordadas entre as partes, respeitando os padrões de qualidade e os prazos estabelecidos neste instrumento."
    );
    blank();
    sub(
      n,
      3,
      "Qualquer serviço não expressamente listado nesta cláusula não está incluído no presente contrato, podendo ser objeto de aditivo contratual mediante acordo entre as partes."
    );
    blank();
  }

  // CLÁUSULA — DAS PARTES
  {
    const n = clause("DAS PARTES");
    sub(n, 1, `CONTRATANTE: ${vars.clienteEmpresa}.`);
    sub(n, 2, `CONTRATADA: ${vars.agencia}.`);
    blank();
  }

  // CLÁUSULA — DO PRAZO
  {
    const n = clause("DO PRAZO");
    if (vars.endDate) {
      sub(
        n,
        1,
        `O prazo para execução dos serviços objeto deste contrato terá início em ${shortDate(vars.startDate)} e término previsto para ${shortDate(vars.endDate)}.`
      );
      sub(n, 2, "O prazo poderá ser prorrogado mediante acordo expresso entre as partes, formalizado por escrito com antecedência mínima de 15 (quinze) dias do término.");
    } else {
      sub(
        n,
        1,
        `O prazo para execução dos serviços objeto deste contrato terá início em ${shortDate(vars.startDate)}, vigorando por prazo indeterminado até que uma das partes o rescinda na forma prevista neste instrumento.`
      );
    }
    blank();
  }

  // CLÁUSULA — DO VALOR E FORMA DE PAGAMENTO
  {
    const n = clause("DO VALOR E FORMA DE PAGAMENTO");
    sub(
      n,
      1,
      `Pela prestação dos serviços objeto deste contrato, a CONTRATANTE pagará à CONTRATADA o valor de ${vars.valor}${vars.scheduleText ? `, com pagamento recorrente ${vars.scheduleText}` : ""}.`
    );
    sub(n, 2, "O pagamento será realizado mediante transferência bancária ou PIX, salvo acordo diverso entre as partes.");
    sub(n, 3, "Os valores acordados são fixos e irreajustáveis durante a vigência do contrato, salvo acordo expresso entre as partes.");
    blank();
  }

  // CLÁUSULA — DA MULTA POR ATRASO
  {
    const n = clause("DA MULTA POR ATRASO");
    sub(
      n,
      1,
      "O atraso no pagamento acarretará multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês, pro rata die, a partir do dia seguinte ao vencimento."
    );
    sub(
      n,
      2,
      "Os encargos moratórios são cumulativos e incidirão até a data do efetivo pagamento, podendo a CONTRATADA suspender a prestação dos serviços em caso de inadimplemento superior a 15 (quinze) dias."
    );
    blank();
  }

  // CLÁUSULA — DAS OBRIGAÇÕES DA CONTRATADA
  {
    clause("DAS OBRIGAÇÕES DA CONTRATADA");
    item("a", "Executar os serviços contratados com zelo, qualidade e profissionalismo, dentro dos prazos estabelecidos;");
    item("b", "Manter a CONTRATANTE informada sobre o andamento dos serviços;");
    item("c", "Enviar relatório mensal de desempenho com as principais métricas das ações realizadas;");
    item("d", "Responsabilizar-se por quaisquer danos causados à CONTRATANTE ou a terceiros, decorrentes de sua culpa ou dolo na execução dos serviços;");
    item("e", "Manter sigilo sobre todas as informações confidenciais às quais tiver acesso em razão da execução deste contrato.");
    blank();
  }

  // CLÁUSULA — DAS OBRIGAÇÕES DA CONTRATANTE
  {
    clause("DAS OBRIGAÇÕES DA CONTRATANTE");
    item("a", "Efetuar o pagamento na forma e prazo estabelecidos neste contrato;");
    item("b", "Fornecer, em tempo hábil, as informações, materiais, acessos e aprovações necessários à execução dos serviços;");
    item("c", "Analisar e aprovar, ou solicitar ajustes, nos conteúdos submetidos pela CONTRATADA em prazo razoável;");
    item("d", "Garantir que possui os direitos necessários sobre marcas, imagens e materiais fornecidos à CONTRATADA;");
    item("e", "Comunicar à CONTRATADA, por escrito, qualquer irregularidade observada na execução dos serviços.");
    blank();
  }

  // CLÁUSULA — DO FORNECIMENTO DE INFORMAÇÕES E ACESSOS
  {
    const n = clause("DO FORNECIMENTO DE INFORMAÇÕES E ACESSOS");
    sub(
      n,
      1,
      "A CONTRATANTE se compromete a fornecer à CONTRATADA, em tempo hábil, todas as informações, dados, documentos, acessos a sistemas e credenciais necessárias para a adequada execução dos serviços."
    );
    sub(
      n,
      2,
      "Atrasos no fornecimento de informações ou materiais pela CONTRATANTE não serão imputados à CONTRATADA, podendo resultar em prorrogação proporcional dos prazos de entrega."
    );
    sub(n, 3, "A CONTRATADA devolverá ou revogará todos os acessos fornecidos no prazo de 48 (quarenta e oito) horas após o término do contrato.");
    blank();
  }

  // CLÁUSULA — DA APROVAÇÃO DE ENTREGAS
  {
    const n = clause("DA APROVAÇÃO DE ENTREGAS");
    sub(n, 1, "A CONTRATANTE terá o prazo de 5 (cinco) dias úteis após cada entrega para validar, aprovar ou solicitar ajustes.");
    sub(n, 2, "Decorrido o prazo sem manifestação, a entrega será considerada tacitamente aprovada, nos termos do Art. 111 do Código Civil.");
    sub(n, 3, "Solicitações de ajustes deverão ser comunicadas por escrito, de forma clara e objetiva.");
    blank();
  }

  // CLÁUSULA — DAS REVISÕES E ALTERAÇÕES
  {
    const n = clause("DAS REVISÕES E ALTERAÇÕES");
    sub(n, 1, "Estão incluídas neste contrato até 3 (três) rodadas de revisão para cada entrega ou etapa do serviço.");
    sub(n, 2, "Revisões adicionais serão cobradas separadamente, mediante orçamento prévio aprovado pela CONTRATANTE.");
    sub(n, 3, "Considera-se revisão qualquer alteração solicitada após a apresentação de uma versão finalizada.");
    blank();
  }

  // CLÁUSULA — DO ACEITE E CONCLUSÃO
  {
    const n = clause("DO ACEITE E CONCLUSÃO");
    sub(n, 1, "A CONTRATANTE terá prazo de 5 (cinco) dias úteis após a entrega final de cada etapa para conferir e aceitar o serviço prestado.");
    sub(n, 2, "Decorrido o prazo sem manifestação, considera-se o serviço aceito e concluído, nos termos do Art. 111 do Código Civil.");
    sub(n, 3, "Eventuais ressalvas deverão ser comunicadas por escrito dentro do prazo, sob pena de preclusão.");
    blank();
  }

  // CLÁUSULA — DA RESCISÃO
  {
    const n = clause("DA RESCISÃO");
    sub(n, 1, "O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação prévia de 30 (trinta) dias.");
    sub(
      n,
      2,
      "Em caso de rescisão sem justa causa, a parte que rescindir deverá pagar à outra o valor proporcional aos serviços já executados ou, no caso de antecipações, restituir os valores referentes a serviços não prestados."
    );
    sub(n, 3, "Constituem motivos para rescisão imediata deste contrato:");
    item("a", "Inadimplemento de quaisquer cláusulas contratuais;");
    item("b", "Falência, recuperação judicial ou dissolução de qualquer das partes;");
    item("c", "Caso fortuito ou força maior que impeça a execução do contrato.");
    blank();
  }

  // CLÁUSULA — DA RESCISÃO ANTECIPADA
  {
    const n = clause("DA RESCISÃO ANTECIPADA");
    sub(
      n,
      1,
      "Em caso de rescisão antecipada por qualquer das partes, sem justa causa, a parte que der causa pagará à outra multa equivalente a 10% (dez por cento) do valor total do contrato, mediante comunicação por escrito com antecedência mínima de 15 (quinze) dias."
    );
    sub(n, 2, "A multa não se aplica em caso de descumprimento contratual pela outra parte ou por motivo de força maior devidamente comprovado.");
    blank();
  }

  // CLÁUSULA — DA RENOVAÇÃO AUTOMÁTICA
  {
    const n = clause("DA RENOVAÇÃO AUTOMÁTICA");
    sub(
      n,
      1,
      "Este contrato será automaticamente renovado por períodos iguais e sucessivos, salvo manifestação em contrário de qualquer das partes, com antecedência mínima de 30 (trinta) dias do término do período vigente."
    );
    sub(n, 2, "A renovação manterá as mesmas condições contratuais, salvo quanto ao valor, que poderá ser reajustado mediante acordo entre as partes.");
    blank();
  }

  // CLÁUSULA — DA CONFIDENCIALIDADE
  {
    const n = clause("DA CONFIDENCIALIDADE");
    sub(
      n,
      1,
      "A CONTRATADA se compromete a manter sigilo absoluto sobre todas as informações confidenciais da CONTRATANTE às quais tiver acesso durante a prestação dos serviços, incluindo dados financeiros, estratégias de negócio, informações de clientes e quaisquer outras informações não públicas."
    );
    sub(n, 2, "São consideradas informações confidenciais aquelas assim identificadas pela CONTRATANTE, bem como aquelas que, pela sua natureza, devam ser tratadas como tal.");
    sub(n, 3, "Esta obrigação permanece vigente por 2 (dois) anos após o término do contrato.");
    sub(n, 4, "A violação do sigilo sujeita a CONTRATADA a responsabilização por perdas e danos, sem prejuízo das medidas judiciais cabíveis.");
    blank();
  }

  // CLÁUSULA — DA CONFIDENCIALIDADE DE ACESSOS E CREDENCIAIS
  {
    const n = clause("DA CONFIDENCIALIDADE DE ACESSOS E CREDENCIAIS");
    sub(
      n,
      1,
      "A CONTRATADA se compromete a manter sigilo absoluto sobre todas as senhas, tokens de acesso, chaves de API e demais credenciais fornecidas pela CONTRATANTE para execução dos serviços."
    );
    sub(
      n,
      2,
      "A CONTRATADA se compromete a: (i) não compartilhar credenciais com terceiros; (ii) utilizar os acessos exclusivamente para execução dos serviços contratados; (iii) ao término do contrato, revogar seus acessos e confirmar por escrito a exclusão de quaisquer cópias no prazo de 48 (quarenta e oito) horas."
    );
    sub(n, 3, "Esta obrigação permanece vigente por 2 (dois) anos após o término do contrato.");
    blank();
  }

  // CLÁUSULA — DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)
  {
    const n = clause("DA PROTEÇÃO DE DADOS PESSOAIS (LGPD)");
    sub(
      n,
      1,
      "As partes se comprometem a tratar quaisquer dados pessoais a que tiverem acesso em decorrência deste contrato em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais), utilizando-os exclusivamente para as finalidades relacionadas à execução dos serviços aqui previstos."
    );
    blank();
  }

  // CLÁUSULA — DA PROPRIEDADE INTELECTUAL
  {
    const n = clause("DA PROPRIEDADE INTELECTUAL");
    sub(
      n,
      1,
      "Os conteúdos, artes e materiais produzidos exclusivamente para a CONTRATANTE no âmbito deste contrato, uma vez quitados os respectivos pagamentos, poderão ser utilizados livremente pela CONTRATANTE."
    );
    sub(n, 2, "A CONTRATADA poderá exibir os trabalhos realizados em seu portfólio, salvo manifestação em contrário da CONTRATANTE.");
    blank();
  }

  // CLÁUSULA — DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO
  {
    const n = clause("DA AUSÊNCIA DE VÍNCULO EMPREGATÍCIO");
    sub(n, 1, "As partes declaram expressamente que este contrato não configura relação de emprego, nos termos da Consolidação das Leis do Trabalho (CLT).");
    sub(n, 2, "A CONTRATADA atua de forma autônoma, sem subordinação, sem obrigatoriedade de horário fixo e sem exclusividade na prestação dos serviços.");
    sub(n, 3, "A CONTRATADA é responsável pelo recolhimento de todos os tributos, contribuições previdenciárias e demais obrigações fiscais decorrentes de sua atividade profissional.");
    sub(n, 4, "A CONTRATANTE não possui ingerência sobre o modo de execução dos serviços, desde que respeitadas as especificações acordadas e os prazos estabelecidos neste instrumento.");
    blank();
  }

  // CLÁUSULA — DAS DISPOSIÇÕES GERAIS
  {
    const n = clause("DAS DISPOSIÇÕES GERAIS");
    sub(n, 1, "Este contrato obriga as partes e seus herdeiros e sucessores a qualquer título.");
    sub(n, 2, "Qualquer tolerância ou concessão entre as partes não importará em novação de qualquer uma das cláusulas ou condições aqui estipuladas.");
    sub(n, 3, "Este contrato poderá ser aditado ou modificado mediante acordo entre as partes, formalizado por escrito.");
    blank();
  }

  // CLÁUSULA — DO FORO
  {
    const n = clause("DO FORO");
    sub(
      n,
      1,
      "As partes elegem o foro da comarca de domicílio da CONTRATADA para dirimir quaisquer dúvidas ou questões oriundas do presente contrato, renunciando a qualquer outro, por mais privilegiado que seja."
    );
    blank();
  }

  lines.push(
    "E, por estarem assim justos e contratados, firmam o presente instrumento em 02 (duas) vias de igual teor e forma, na presença de duas testemunhas abaixo, para que produza os seus efeitos legais."
  );
  blank();
  lines.push(`${longDate(vars.signatureDate)}.`);
  blank();
  blank();
  lines.push("______________________________");
  lines.push(`${vars.agencia} — CONTRATADA`);
  blank();
  blank();
  lines.push("______________________________");
  lines.push(`${vars.clienteEmpresa} — CONTRATANTE`);
  blank();
  blank();
  lines.push("Testemunhas:");
  blank();
  lines.push("1. ______________________________");
  lines.push("Nome:");
  lines.push("CPF:");
  blank();
  lines.push("2. ______________________________");
  lines.push("Nome:");
  lines.push("CPF:");

  return lines.join("\n");
}
