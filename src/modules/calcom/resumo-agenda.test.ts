import { describe, expect, it } from "vitest";
import { criarResumoAgendaCalCom } from "./resumo-agenda";

describe("criarResumoAgendaCalCom", () => {
  it("mantem o resumo operacional quando existem conexoes ativas", () => {
    const resumo = criarResumoAgendaCalCom(2);

    expect(resumo.temConexaoAtiva).toBe(true);
    expect(resumo.titulo).toBe("Agenda comercial");
    expect(resumo.descricao).toBe("Compromissos e slots ativos conectados ao Cal.com.");
    expect(resumo.hrefIntegracao).toBe("/integracoes/calcom");
    expect(resumo.rotuloAcao).toBe("Gerenciar Cal.com");
  });

  it("troca o card por onboarding quando nao ha conexoes ativas", () => {
    const resumo = criarResumoAgendaCalCom(0);

    expect(resumo.temConexaoAtiva).toBe(false);
    expect(resumo.titulo).toBe("Ative sua agenda comercial");
    expect(resumo.descricao).toBe("Conecte uma API key valida para liberar reunioes, slots e acompanhamento operacional no CRM.");
    expect(resumo.hrefIntegracao).toBe("/integracoes/calcom");
    expect(resumo.rotuloAcao).toBe("Configurar Cal.com");
  });
});
