import { describe, expect, it } from "vitest";
import type { ApiNegocioResumo } from "@/lib/api/negocios";
import {
  criarFormularioEdicaoLead,
  criarFormularioNovoLead,
  criarResumoLeads,
  criarPayloadLeadContato,
  formatarDataLead,
  normalizarTextoOpcional,
  rotuloNegocioLead,
  rotuloOrigemLead,
} from "./utils";

describe("criarFormularioNovoLead", () => {
  it("cria formulario vazio com responsavel opcional", () => {
    expect(criarFormularioNovoLead("func-1")).toEqual({
      nome: "",
      telefone: "",
      email: "",
      fonte: "",
      empresaOrigem: "",
      observacoes: "",
      idFuncionario: "func-1",
    });
  });
});

describe("criarFormularioEdicaoLead", () => {
  it("mapeia lead para formulario editavel", () => {
    expect(
      criarFormularioEdicaoLead({
        nome: "Maria",
        telefone: "11999999999",
        email: null,
        fonte: null,
        empresa_origem: null,
        observacoes: null,
        id_funcionario: "func-1",
      } as never),
    ).toEqual({
      nome: "Maria",
      telefone: "11999999999",
      email: "",
      fonte: "",
      empresaOrigem: "",
      observacoes: "",
      idFuncionario: "func-1",
    });
  });
});

describe("normalizarTextoOpcional", () => {
  it("remove espacos e converte vazio para null", () => {
    expect(normalizarTextoOpcional("  teste ")).toBe("teste");
    expect(normalizarTextoOpcional("   ")).toBeNull();
  });
});

describe("rotuloOrigemLead", () => {
  it("traduz origens conhecidas e usa fallback neutro", () => {
    expect(rotuloOrigemLead("ANUNCIO_CTWA")).toBe("Anúncio");
    expect(rotuloOrigemLead("SINCRONIZACAO_WHATSAPP")).toBe("WhatsApp");
    expect(rotuloOrigemLead("MANUAL")).toBe("Manual");
    expect(rotuloOrigemLead("DESCONHECIDA")).toBe("—");
  });
});

describe("rotuloNegocioLead", () => {
  it("resume negocio com lead principal, funil e estagio", () => {
    const negocio = {
      id: "neg-1",
      titulo: "Seguro empresarial",
      lead_principal: { id: "lead-1", nome: "Maria", telefone: "11999999999" },
      leads: [],
      estagio: { id: "est-1", nome: "Proposta", ordem: 1, tipo: "ABERTO", id_funil: "fun-1" },
      funil: { id: "fun-1", nome: "Empresarial", slug: "empresarial", padrao: true },
    } as ApiNegocioResumo;

    expect(rotuloNegocioLead(negocio)).toEqual({
      titulo: "Seguro empresarial",
      subtitulo: "Maria • Empresarial • Proposta",
    });
  });

  it("retorna fallback quando nao ha negocio", () => {
    expect(rotuloNegocioLead()).toEqual({
      titulo: "—",
      subtitulo: "Sem negócio vinculado",
    });
  });
});

describe("formatarDataLead", () => {
  it("gera string legivel em pt-BR", () => {
    const texto = formatarDataLead("2024-03-15T14:30:00.000Z");

    expect(texto).toContain("2024");
  });
});

describe("criarPayloadLeadContato", () => {
  it("normaliza campos opcionais do formulario", () => {
    expect(
      criarPayloadLeadContato({
        nome: " Maria ",
        telefone: "11999999999",
        idFuncionario: "func-1",
        email: "  ",
        fonte: "Site",
        empresaOrigem: "  Empresa X ",
        observacoes: "  observacao  ",
      }),
    ).toEqual({
      nome: "Maria",
      telefone: "11999999999",
      id_funcionario: "func-1",
      email: null,
      fonte: "Site",
      empresa_origem: "Empresa X",
      observacoes: "observacao",
    });
  });
});

describe("criarResumoLeads", () => {
  it("gera titulo e resumo total", () => {
    expect(criarResumoLeads(2, 7)).toEqual({
      title: "2 leads",
      resumoTotal: "7 no total",
    });
  });
});
