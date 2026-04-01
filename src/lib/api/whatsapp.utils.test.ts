import { describe, expect, it } from "vitest";
import {
  criarBuscaConversasWhatsapp,
  criarBuscaStreamConversasWhatsapp,
  criarChaveCacheMidiaWhatsapp,
  normalizarResumoJobsWhatsapp,
} from "./whatsapp.utils";

describe("criarBuscaConversasWhatsapp", () => {
  it("serializa apenas filtros preenchidos", () => {
    expect(
      criarBuscaConversasWhatsapp({
        busca: " Ana Maria ",
        cursor: " page-2 ",
        limite: 30,
        naoLidas: true,
      }).toString(),
    ).toBe("busca=Ana+Maria&cursor=page-2&limite=30&naoLidas=true");
  });
});

describe("criarBuscaStreamConversasWhatsapp", () => {
  it("monta query string do stream sem cursor", () => {
    expect(
      criarBuscaStreamConversasWhatsapp({ busca: " Ana ", naoLidas: true, limite: 20 }).toString(),
    ).toBe("busca=Ana&naoLidas=true&limite=20");
  });
});

describe("normalizarResumoJobsWhatsapp", () => {
  it("preenche valores padrao quando a resposta vem parcial", () => {
    expect(normalizarResumoJobsWhatsapp({ pendentes: 3, enviadosHoje: 2 } as never)).toEqual({
      pendentes: 3,
      processando: 0,
      falhas: 0,
      enviadosHoje: 2,
      atualizadoEm: "",
    });
  });
});

describe("criarChaveCacheMidiaWhatsapp", () => {
  it("usa lead e mensagem para compor a chave", () => {
    expect(criarChaveCacheMidiaWhatsapp("lead-1", "msg-7")).toBe("lead-1:msg-7");
  });
});
