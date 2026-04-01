type ResumoAgendaCalCom = {
  temConexaoAtiva: boolean;
  titulo: string;
  descricao: string;
  hrefIntegracao: string;
  rotuloAcao: string;
};

const HREF_INTEGRACAO_CALCOM = "/integracoes/calcom";

export function criarResumoAgendaCalCom(totalInstanciasAtivas: number): ResumoAgendaCalCom {
  if (totalInstanciasAtivas > 0) {
    return {
      temConexaoAtiva: true,
      titulo: "Agenda comercial",
      descricao: "Compromissos e slots ativos conectados ao Cal.com.",
      hrefIntegracao: HREF_INTEGRACAO_CALCOM,
      rotuloAcao: "Gerenciar Cal.com",
    };
  }

  return {
    temConexaoAtiva: false,
    titulo: "Ative sua agenda comercial",
    descricao: "Conecte uma API key valida para liberar reunioes, slots e acompanhamento operacional no CRM.",
    hrefIntegracao: HREF_INTEGRACAO_CALCOM,
    rotuloAcao: "Configurar Cal.com",
  };
}
