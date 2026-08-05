export const DEFAULT_CONTRACT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING

CONTRATANTE: {{cliente_empresa}}, doravante denominado(a) CONTRATANTE.

CONTRATADA: {{agencia}}, doravante denominada CONTRATADA.

As partes acima identificadas têm, entre si, justo e acertado o presente Contrato de Prestação de Serviços de Marketing, que se regerá pelas cláusulas seguintes:

CLÁUSULA 1ª — DO OBJETO
O presente contrato tem como objeto a prestação de serviços de marketing digital pela CONTRATADA à CONTRATANTE, incluindo, mas não se limitando a: gestão de redes sociais, campanhas de mídia paga, produção de conteúdo e relatórios de performance.

CLÁUSULA 2ª — DO PRAZO
O presente contrato tem início em {{data_inicio}}{{data_fim_clausula}}, podendo ser renovado mediante acordo entre as partes.

CLÁUSULA 3ª — DO VALOR E FORMA DE PAGAMENTO
Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor de {{valor}}, com pagamento na frequência {{frequencia}}.

CLÁUSULA 4ª — DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a executar os serviços contratados com zelo, dedicação e dentro dos prazos acordados, mantendo a CONTRATANTE informada sobre o andamento das atividades.

CLÁUSULA 5ª — DAS OBRIGAÇÕES DA CONTRATANTE
A CONTRATANTE se compromete a fornecer as informações, materiais e acessos necessários para a boa execução dos serviços, bem como efetuar os pagamentos nas datas acordadas.

CLÁUSULA 6ª — DA RESCISÃO
O presente contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio de 30 (trinta) dias, sem prejuízo dos valores já devidos até a data da rescisão.

CLÁUSULA 7ª — DA CONFIDENCIALIDADE
As partes se comprometem a manter sigilo sobre todas as informações confidenciais trocadas durante a vigência deste contrato.

E, por estarem assim justas e contratadas, as partes assinam o presente instrumento.

{{data_assinatura}}

_______________________________
{{cliente_empresa}} (CONTRATANTE)

_______________________________
{{agencia}} (CONTRATADA)
`;

interface TemplateVars {
  clienteEmpresa: string;
  agencia: string;
  valor: string;
  dataInicio: string;
  dataFim?: string;
  frequencia: string;
  dataAssinatura: string;
}

export function fillContractTemplate(vars: TemplateVars): string {
  return DEFAULT_CONTRACT_TEMPLATE.replace(/\{\{cliente_empresa\}\}/g, vars.clienteEmpresa)
    .replace(/\{\{agencia\}\}/g, vars.agencia)
    .replace(/\{\{valor\}\}/g, vars.valor)
    .replace(/\{\{data_inicio\}\}/g, vars.dataInicio)
    .replace(/\{\{data_fim_clausula\}\}/g, vars.dataFim ? `, com término previsto em ${vars.dataFim}` : ", por prazo indeterminado")
    .replace(/\{\{frequencia\}\}/g, vars.frequencia)
    .replace(/\{\{data_assinatura\}\}/g, vars.dataAssinatura);
}
