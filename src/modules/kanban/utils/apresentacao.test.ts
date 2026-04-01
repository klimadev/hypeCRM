import { describe, expect, it } from "vitest";
import type { Estagio, Lead, PendenciaNegocioInfo } from "../types";
import {
  obterDescricaoEtapaKanban,
  obterResumoOperacionalColuna,
  obterRotuloProximoPasso,
  obterRotuloTempoParado,
} from "./apresentacao";

const estagioBase: Estagio = {
  id: "estagio-1",
  nome: "Novo contato",
  ordem: 1,
  tipo: "ABERTO",
};

const negocioBase: Lead = {
  id: "negocio-1",
  id_estagio: "estagio-1",
  id_funcionario: "func-1",
  nome: "Ana Souza",
  telefone: "11999999999",
  valor_oportunidade: 1250,
  observacoes: null,
  motivo_perda: null,
  atualizado_em: new Date().toISOString(),
};

describe("obterDescricaoEtapaKanban", () => {
  it("explica etapas iniciais em linguagem simples", () => {
    expect(obterDescricaoEtapaKanban(estagioBase)).toBe("Leads em primeiro contato");
  });

  it("explica etapas de proposta e fechamento", () => {
    expect(obterDescricaoEtapaKanban({ ...estagioBase, nome: "Proposta enviada" })).toBe("Propostas aguardando resposta");
    expect(obterDescricaoEtapaKanban({ ...estagioBase, nome: "Fechado", tipo: "GANHO" })).toBe("Negócios concluídos");
  });
});

describe("obterResumoOperacionalColuna", () => {
  it("prioriza alertas críticos na coluna", () => {
    const pendenciasPorNegocio: Record<string, PendenciaNegocioInfo> = {
      "negocio-1": {
        total: 2,
        naoResolvidas: 2,
        tipos: ["lead_sem_contato" as never, "lead_parado" as never],
        gravidadeMaxima: "critica",
      },
    };

    expect(
      obterResumoOperacionalColuna({
        estagio: estagioBase,
        negocios: [negocioBase],
        pendenciasPorNegocio,
        agoraMs: Date.now(),
      }),
    ).toBe("1 atenção crítica");
  });

  it("mostra quantidade parada quando não há item crítico", () => {
    const ontem = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();

    expect(
      obterResumoOperacionalColuna({
        estagio: estagioBase,
        negocios: [{ ...negocioBase, atualizado_em: ontem }],
        pendenciasPorNegocio: {},
        agoraMs: Date.now(),
      }),
    ).toBe("1 parado há mais de 3 dias");
  });
});

describe("obterRotuloTempoParado", () => {
  it("transforma dias em linguagem objetiva", () => {
    expect(obterRotuloTempoParado(0)).toBe("Atualizado hoje");
    expect(obterRotuloTempoParado(1)).toBe("Parado desde ontem");
    expect(obterRotuloTempoParado(3)).toBe("Parado há 3 dias");
  });
});

describe("obterRotuloProximoPasso", () => {
  it("gera orientação direta para o operador", () => {
    expect(obterRotuloProximoPasso({ diasParados: 0, estagio: estagioBase, pendencia: undefined })).toBe("Próximo passo: continuar atendimento");
    expect(
      obterRotuloProximoPasso({
        diasParados: 2,
        estagio: { ...estagioBase, nome: "Proposta enviada" },
        pendencia: { total: 1, naoResolvidas: 1, tipos: ["lead_parado" as never], gravidadeMaxima: "alerta" },
      }),
    ).toBe("Próximo passo: cobrar retorno da proposta");
  });
});
