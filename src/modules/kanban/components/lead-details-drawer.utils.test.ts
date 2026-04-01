import { describe, expect, it } from "vitest";
import type { Lead, StatusSalvamentoDetalhesNegocio } from "../types";
import {
  criarDescricaoRemocaoLeads,
  criarStatusSalvarNegocio,
  formatarHorarioDetalhesNegocio,
  obterAtalhoSalvarNegocio,
  obterIdsLeadsRelacionadosNegocio,
} from "./lead-details-drawer.utils";

function criarLeadParcial(parcial: Partial<Lead> = {}): Lead {
  return {
    id: "neg-1",
    id_estagio: "est-1",
    id_funcionario: "func-1",
    nome: "Negócio teste",
    telefone: "11999999999",
    valor_oportunidade: 1500,
    observacoes: null,
    motivo_perda: null,
    atualizado_em: "2024-01-01T10:00:00.000Z",
    ...parcial,
  };
}

describe("obterIdsLeadsRelacionadosNegocio", () => {
  it("deduplica lead principal e vinculados", () => {
    const ids = obterIdsLeadsRelacionadosNegocio(
      criarLeadParcial({
        lead_principal: { id: "lead-1", nome: "Maria", telefone: "11" },
        leads_vinculados: [
          { id: "lead-1", nome: "Maria", telefone: "11" },
          { id: "lead-2", nome: "João", telefone: "22" },
        ],
      }),
    );

    expect(ids).toEqual(["lead-1", "lead-2"]);
  });
});

describe("criarDescricaoRemocaoLeads", () => {
  it("gera textos coerentes para zero, um ou muitos leads", () => {
    expect(criarDescricaoRemocaoLeads(0)).toBe("Este negócio nao possui leads vinculados para remover em conjunto.");
    expect(criarDescricaoRemocaoLeads(1)).toBe("Também remover o lead vinculado a este negócio.");
    expect(criarDescricaoRemocaoLeads(3)).toBe("Também remover os 3 leads vinculados a este negócio.");
  });
});

describe("obterAtalhoSalvarNegocio", () => {
  it("usa Cmd no mac e Ctrl nos demais", () => {
    expect(obterAtalhoSalvarNegocio("MacIntel")).toBe("Cmd+S");
    expect(obterAtalhoSalvarNegocio("Win32")).toBe("Ctrl+S");
  });
});

describe("formatarHorarioDetalhesNegocio", () => {
  it("formata horario em pt-BR", () => {
    const texto = formatarHorarioDetalhesNegocio(new Date("2024-03-15T14:30:00.000Z"));

    expect(texto).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("criarStatusSalvarNegocio", () => {
  it("prioriza erro explicito", () => {
    const status = criarStatusSalvarNegocio({
      atalhoSalvar: "Ctrl+S",
      erroDetalhesNegocio: "Falhou ao salvar",
      temAlteracoes: false,
      salvando: false,
      salvandoAutomaticamente: false,
      salvamentoAutomaticoPendente: false,
      salvo: false,
      statusSalvamentoDetalhes: "ocioso",
      textoUltimaAtualizacao: null,
    });

    expect(status.texto).toBe("Falhou ao salvar");
    expect(status.tom).toBe("erro");
  });

  it("explica estado ocioso com ultimo horario", () => {
    const status = criarStatusSalvarNegocio({
      atalhoSalvar: "Ctrl+S",
      erroDetalhesNegocio: null,
      temAlteracoes: false,
      salvando: false,
      salvandoAutomaticamente: false,
      salvamentoAutomaticoPendente: false,
      salvo: false,
      statusSalvamentoDetalhes: "ocioso",
      textoUltimaAtualizacao: "14:30",
    });

    expect(status.texto).toBe("Tudo salvo. Última atualização às 14:30.");
    expect(status.tom).toBe("sucesso");
  });

  it("mostra alteracoes locais aguardando quando ha mudancas sem fila automatica", () => {
    const status = criarStatusSalvarNegocio({
      atalhoSalvar: "Ctrl+S",
      erroDetalhesNegocio: null,
      temAlteracoes: true,
      salvando: false,
      salvandoAutomaticamente: false,
      salvamentoAutomaticoPendente: false,
      salvo: false,
      statusSalvamentoDetalhes: "ocioso" satisfies StatusSalvamentoDetalhesNegocio,
      textoUltimaAtualizacao: null,
    });

    expect(status.texto).toBe("Existem alterações locais aguardando salvamento.");
    expect(status.tom).toBe("alerta");
  });
});
