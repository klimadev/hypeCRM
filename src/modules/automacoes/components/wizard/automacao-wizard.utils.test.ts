import { describe, expect, it } from "vitest";
import type { FormularioAutomacaoWizard } from "../../types";
import {
  criarAvisoRascunhoWizard,
  formatarHorarioRascunhoWizard,
  formulariosAutomacaoSaoIguais,
  formatarStatusInstanciaWizard,
  montarPayloadAutomacaoWizard,
  podeAvancarPassoAutomacaoWizard,
} from "./automacao-wizard.utils";

function criarFormularioBase(
  sobrescritas: Partial<FormularioAutomacaoWizard> = {},
): FormularioAutomacaoWizard {
  return {
    nome: "Avisar equipe",
    idEstagioDestino: "estagio-1",
    idInstanciaWhatsapp: "inst-1",
    telefoneDestino: "11999999999",
    mensagem: "Olá {{lead_nome}}",
    delayMinutos: 5,
    ...sobrescritas,
  };
}

describe("formatarStatusInstanciaWizard", () => {
  it("resume estados conhecidos de instância", () => {
    expect(formatarStatusInstanciaWizard({ status: "open", phone: "5511999999999" })).toBe("Conectada");
    expect(formatarStatusInstanciaWizard({ status: "qrcode", phone: "" })).toBe("Aguardando QR Code");
    expect(formatarStatusInstanciaWizard({ status: "loading", phone: "" })).toBe("Inicializando");
    expect(formatarStatusInstanciaWizard({ status: "close", phone: "" })).toBe("Desconectada");
  });
});

describe("formulariosAutomacaoSaoIguais", () => {
  it("compara apenas os campos relevantes do wizard", () => {
    const base = criarFormularioBase();
    expect(formulariosAutomacaoSaoIguais(base, criarFormularioBase())).toBe(true);
    expect(
      formulariosAutomacaoSaoIguais(base, criarFormularioBase({ mensagem: "Outro texto" })),
    ).toBe(false);
  });
});

describe("montarPayloadAutomacaoWizard", () => {
  it("gera payload esperado com defaults seguros", () => {
    expect(
      montarPayloadAutomacaoWizard(criarFormularioBase({ nome: "", mensagem: "" }), "01/04/2026"),
    ).toEqual({
      nome: "Automação 01/04/2026",
      fonte: "WHATSAPP",
      gatilho: "STAGE_CHANGE",
      ativo: true,
      acoes: [
        {
          tipo: "WHATSAPP_MSG",
          ordem: 0,
          delay_minutos: 5,
          id_instancia_whatsapp: "inst-1",
          telefone_destino: "11999999999",
          mensagem: "Olá {{lead_nome}}!",
        },
      ],
      id_estagio_destino: "estagio-1",
    });
  });
});

describe("podeAvancarPassoAutomacaoWizard", () => {
  it("exige mensagem e instância ativa apenas no passo de ação", () => {
    expect(podeAvancarPassoAutomacaoWizard(1, criarFormularioBase({ mensagem: "" }), false)).toBe(true);
    expect(podeAvancarPassoAutomacaoWizard(2, criarFormularioBase({ mensagem: "" }), true)).toBe(false);
    expect(podeAvancarPassoAutomacaoWizard(2, criarFormularioBase(), false)).toBe(false);
    expect(podeAvancarPassoAutomacaoWizard(2, criarFormularioBase(), true)).toBe(true);
    expect(podeAvancarPassoAutomacaoWizard(3, criarFormularioBase(), true)).toBe(true);
  });
});

describe("criarAvisoRascunhoWizard", () => {
  it("retorna banner de rascunho recuperado com horário formatado", () => {
    const aviso = criarAvisoRascunhoWizard({
      temProtecaoDeRascunho: true,
      rascunhoRecuperado: true,
      ultimoRascunhoSalvoEm: "2026-04-01T12:30:00.000Z",
    });

    expect(aviso?.titulo).toBe("Rascunho recuperado");
    expect(aviso?.descricao).toContain("Retomamos");
    expect(aviso?.horario).toBe(formatarHorarioRascunhoWizard("2026-04-01T12:30:00.000Z"));
  });

  it("retorna null sem proteção ativa e sem histórico de rascunho", () => {
    expect(
      criarAvisoRascunhoWizard({
        temProtecaoDeRascunho: false,
        rascunhoRecuperado: false,
        ultimoRascunhoSalvoEm: null,
      }),
    ).toBeNull();
  });
});
