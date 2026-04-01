import { describe, expect, it } from "vitest";
import {
  idsFuncionarioDoFiltro,
  mapearNegocioResumo,
  normalizarIdsNegocios,
  valorBooleano,
} from "@/lib/negocios.utils";
import type { FiltroAcessoEmpresaFuncionario, NegocioRowBase } from "@/lib/negocios.types";

describe("normalizarIdsNegocios", () => {
  it("remove vazios, espacos e ids duplicados", () => {
    expect(normalizarIdsNegocios(["  a ", "", "b", "a", "   "])).toEqual(["a", "b"]);
  });
});

describe("idsFuncionarioDoFiltro", () => {
  it("aceita id unico ou lista de ids", () => {
    const filtroUnico: FiltroAcessoEmpresaFuncionario = { id_empresa: "emp-1", id_funcionario: "fun-1" };
    const filtroLista: FiltroAcessoEmpresaFuncionario = {
      id_empresa: "emp-1",
      id_funcionario: { in: ["fun-1", "", "fun-2"] },
    };

    expect(idsFuncionarioDoFiltro(filtroUnico)).toEqual(["fun-1"]);
    expect(idsFuncionarioDoFiltro(filtroLista)).toEqual(["fun-1", "fun-2"]);
  });
});

describe("valorBooleano", () => {
  it("normaliza diferentes formatos booleanos", () => {
    expect(valorBooleano({ ativo: true }, "ativo")).toBe(true);
    expect(valorBooleano({ ativo: 0 }, "ativo")).toBe(false);
    expect(valorBooleano({ ativo: "false" }, "ativo")).toBe(false);
    expect(valorBooleano({ ativo: "1" }, "ativo")).toBe(true);
  });
});

describe("mapearNegocioResumo", () => {
  it("usa lead principal quando disponivel", () => {
    const linha = {
      negocio_id: "neg-1",
      negocio_id_empresa: "emp-1",
      negocio_id_lead: "lead-1",
      negocio_id_funil: "fun-1",
      negocio_id_estagio: "est-1",
      negocio_id_funcionario: "fun-1",
      negocio_id_produto_principal: null,
      negocio_titulo: "Seguro auto",
      negocio_valor_estimado: 1500,
      negocio_valor_fechado: null,
      negocio_probabilidade: 80,
      negocio_status: "ABERTO",
      negocio_data_abertura: new Date("2024-01-01T00:00:00.000Z"),
      negocio_data_fechamento: null,
      negocio_motivo_perda: null,
      negocio_observacoes_comerciais: "Observacao",
      negocio_chave_migracao: null,
      negocio_criado_em: new Date("2024-01-01T00:00:00.000Z"),
      negocio_atualizado_em: new Date("2024-01-02T00:00:00.000Z"),
      negocio_funcionario_id: "fun-1",
      negocio_funcionario_nome: "Carlos",
      negocio_funcionario_id_pdv: "pdv-1",
      negocio_funcionario_pdv_id: "pdv-1",
      negocio_funcionario_pdv_nome: "Centro",
      negocio_estagio_id: "est-1",
      negocio_estagio_nome: "Contato",
      negocio_estagio_ordem: 1,
      negocio_estagio_tipo: "ABERTO",
      negocio_estagio_id_funil: "fun-1",
      negocio_funil_id: "fun-1",
      negocio_funil_nome: "Principal",
      negocio_funil_slug: "principal",
      negocio_funil_padrao: 1,
      lead_principal_id: "lead-1",
      lead_principal_id_empresa: "emp-1",
      lead_principal_id_funcionario: "fun-1",
      lead_principal_id_pdv: "pdv-1",
      lead_principal_id_negocio: "neg-1",
      lead_principal_id_estagio: "est-1",
      lead_principal_nome: "Maria",
      lead_principal_telefone: "11999999999",
      lead_principal_email: null,
      lead_principal_valor_oportunidade: 2000,
      lead_principal_probabilidade: 65,
      lead_principal_fonte: "Site",
      lead_principal_empresa_origem: null,
      lead_principal_observacoes: null,
      lead_principal_motivo_perda: null,
      lead_principal_criado_em: new Date("2024-01-01T00:00:00.000Z"),
      lead_principal_atualizado_em: new Date("2024-01-02T00:00:00.000Z"),
      lead_principal_origem: "MANUAL",
      lead_principal_anuncio_titulo: null,
      lead_principal_anuncio_descricao: null,
      lead_principal_anuncio_url: null,
      lead_principal_dados_extras: null,
      lead_principal_funcionario_id: "fun-1",
      lead_principal_funcionario_nome: "Carlos",
      lead_principal_funcionario_id_pdv: "pdv-1",
      lead_principal_funcionario_pdv_id: "pdv-1",
      lead_principal_funcionario_pdv_nome: "Centro",
    } satisfies NegocioRowBase;

    const resultado = mapearNegocioResumo(linha, []);

    expect(resultado.lead?.id).toBe("lead-1");
    expect(resultado.lead_principal?.nome).toBe("Maria");
    expect(resultado.funil.padrao).toBe(true);
    expect(resultado.funcionario.pdv?.nome).toBe("Centro");
  });

  it("usa primeiro lead vinculado quando nao existe lead principal", () => {
    const linha = {
      negocio_id: "neg-1",
      negocio_id_empresa: "emp-1",
      negocio_id_lead: null,
      negocio_id_funil: "fun-1",
      negocio_id_estagio: "est-1",
      negocio_id_funcionario: "fun-1",
      negocio_id_produto_principal: null,
      negocio_titulo: "Seguro vida",
      negocio_valor_estimado: 500,
      negocio_valor_fechado: null,
      negocio_probabilidade: null,
      negocio_status: "ABERTO",
      negocio_data_abertura: new Date("2024-01-01T00:00:00.000Z"),
      negocio_data_fechamento: null,
      negocio_motivo_perda: null,
      negocio_observacoes_comerciais: null,
      negocio_chave_migracao: null,
      negocio_criado_em: new Date("2024-01-01T00:00:00.000Z"),
      negocio_atualizado_em: new Date("2024-01-02T00:00:00.000Z"),
      negocio_funcionario_id: "fun-1",
      negocio_funcionario_nome: "Carlos",
      negocio_funcionario_id_pdv: null,
      negocio_funcionario_pdv_id: null,
      negocio_funcionario_pdv_nome: null,
      negocio_estagio_id: "est-1",
      negocio_estagio_nome: "Contato",
      negocio_estagio_ordem: 1,
      negocio_estagio_tipo: "ABERTO",
      negocio_estagio_id_funil: "fun-1",
      negocio_funil_id: "fun-1",
      negocio_funil_nome: "Principal",
      negocio_funil_slug: "principal",
      negocio_funil_padrao: false,
      lead_principal_id: null,
      lead_principal_id_empresa: null,
      lead_principal_id_funcionario: null,
      lead_principal_id_pdv: null,
      lead_principal_id_negocio: null,
      lead_principal_id_estagio: null,
      lead_principal_nome: null,
      lead_principal_telefone: null,
      lead_principal_email: null,
      lead_principal_valor_oportunidade: null,
      lead_principal_probabilidade: null,
      lead_principal_fonte: null,
      lead_principal_empresa_origem: null,
      lead_principal_observacoes: null,
      lead_principal_motivo_perda: null,
      lead_principal_criado_em: null,
      lead_principal_atualizado_em: null,
      lead_principal_origem: null,
      lead_principal_anuncio_titulo: null,
      lead_principal_anuncio_descricao: null,
      lead_principal_anuncio_url: null,
      lead_principal_dados_extras: null,
      lead_principal_funcionario_id: null,
      lead_principal_funcionario_nome: null,
      lead_principal_funcionario_id_pdv: null,
      lead_principal_funcionario_pdv_id: null,
      lead_principal_funcionario_pdv_nome: null,
    } satisfies NegocioRowBase;

    const resultado = mapearNegocioResumo(linha, [
      {
        id: "lead-2",
        id_empresa: "emp-1",
        id_funcionario: "fun-1",
        id_pdv: null,
        id_negocio: "neg-1",
        id_estagio: "est-1",
        nome: "Joao",
        telefone: "11888888888",
        email: null,
        valor_oportunidade: 500,
        probabilidade: 30,
        fonte: null,
        empresa_origem: null,
        observacoes: null,
        motivo_perda: null,
        criado_em: new Date("2024-01-01T00:00:00.000Z"),
        atualizado_em: new Date("2024-01-02T00:00:00.000Z"),
        origem: "MANUAL",
        anuncio_titulo: null,
        anuncio_descricao: null,
        anuncio_url: null,
        dados_extras: null,
        funcionario: {
          id: "fun-1",
          nome: "Carlos",
          id_pdv: null,
          pdv: null,
        },
      },
    ]);

    expect(resultado.lead?.id).toBe("lead-2");
    expect(resultado.lead_principal).toBeNull();
  });
});
