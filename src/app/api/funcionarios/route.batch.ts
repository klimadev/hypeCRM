import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { podeGerenciarRecursoNoPdv } from "@/lib/permissoes";
import type {
  DestinoInativacaoFuncionario,
  FuncionarioAcaoLoteItem,
  PayloadAcaoLoteFuncionarios,
  ResultadoAcaoLoteFuncionarios,
  SessaoFuncionariosRoute,
} from "./route.types";

type ProcessarAcaoLoteParams = {
  sessao: SessaoFuncionariosRoute;
  ids: string[];
  payload: PayloadAcaoLoteFuncionarios;
  funcionarios: FuncionarioAcaoLoteItem[];
  destinoInativacao: DestinoInativacaoFuncionario | null;
};

export async function processarAcaoLoteFuncionarios({
  sessao,
  ids,
  payload,
  funcionarios,
  destinoInativacao,
}: ProcessarAcaoLoteParams): Promise<ResultadoAcaoLoteFuncionarios> {
  const funcionarioPorId = new Map(funcionarios.map((item) => [item.id, item]));
  const resultado: ResultadoAcaoLoteFuncionarios = {
    processados: ids.length,
    atualizados: 0,
    falhas: [],
  };

  for (const id of ids) {
    const atual = funcionarioPorId.get(id);

    if (!atual) {
      resultado.falhas.push({ id, motivo: "Funcionario nao encontrado." });
      continue;
    }

    if (sessao.perfil === "GERENTE") {
      if (!podeGerenciarRecursoNoPdv(sessao, atual.id_pdv)) {
        resultado.falhas.push({ id, motivo: "Sem permissao para colaborar fora do proprio PDV." });
        continue;
      }

      if (atual.cargo !== "COLABORADOR") {
        resultado.falhas.push({ id, motivo: "Gerente so pode alterar colaboradores." });
        continue;
      }
    }

    if (payload.acao === "INATIVAR" && payload.id_funcionario_destino === id) {
      resultado.falhas.push({ id, motivo: "Destino deve ser diferente do colaborador de origem." });
      continue;
    }

    try {
      if (payload.acao === "ATIVAR") {
        await prisma.funcionario.update({
          where: { id: atual.id },
          data: { ativo: true, inativado_em: null },
        });

        await prisma.auditoriaEquipe.create({
          data: {
            id: randomUUID(),
            id_empresa: sessao.id_empresa,
            id_funcionario_alvo: atual.id,
            acao: "ATIVAR_FUNCIONARIO",
            valor_anterior: atual.ativo ? "ATIVO" : "INATIVO",
            valor_novo: "ATIVO",
            autor_tipo: sessao.perfil,
            autor_id: sessao.id_usuario,
          },
        });

        resultado.atualizados += 1;
        continue;
      }

      if (payload.acao === "ALTERAR_CARGO" && payload.cargo) {
        await prisma.funcionario.update({
          where: { id: atual.id },
          data: { cargo: payload.cargo },
        });

        await prisma.auditoriaEquipe.create({
          data: {
            id: randomUUID(),
            id_empresa: sessao.id_empresa,
            id_funcionario_alvo: atual.id,
            acao: "ATUALIZAR_CARGO_FUNCIONARIO",
            campo: "cargo",
            valor_anterior: atual.cargo,
            valor_novo: payload.cargo,
            autor_tipo: sessao.perfil,
            autor_id: sessao.id_usuario,
          },
        });

        resultado.atualizados += 1;
        continue;
      }

      if (payload.acao === "ALTERAR_PDV" && payload.id_pdv) {
        if (sessao.perfil === "GERENTE" && payload.id_pdv !== atual.id_pdv) {
          resultado.falhas.push({ id, motivo: "Gerente nao pode alterar PDV de colaborador." });
          continue;
        }

        await prisma.funcionario.update({
          where: { id: atual.id },
          data: { id_pdv: payload.id_pdv },
        });

        await prisma.auditoriaEquipe.create({
          data: {
            id: randomUUID(),
            id_empresa: sessao.id_empresa,
            id_funcionario_alvo: atual.id,
            acao: "ATUALIZAR_PDV_FUNCIONARIO",
            campo: "id_pdv",
            valor_anterior: atual.id_pdv,
            valor_novo: payload.id_pdv,
            autor_tipo: sessao.perfil,
            autor_id: sessao.id_usuario,
          },
        });

        resultado.atualizados += 1;
        continue;
      }

      if (payload.acao === "INATIVAR" && payload.id_funcionario_destino && destinoInativacao) {
        const quantidadeLeads = await prisma.lead.count({
          where: { id_empresa: sessao.id_empresa, id_funcionario: atual.id },
        });

        await prisma.$transaction(async (tx) => {
          await tx.lead.updateMany({
            where: { id_empresa: sessao.id_empresa, id_funcionario: atual.id },
            data: { id_funcionario: payload.id_funcionario_destino },
          });

          await tx.funcionario.update({
            where: { id: atual.id },
            data: { ativo: false, inativado_em: new Date() },
          });

          await tx.reatribuicaoFuncionario.create({
            data: {
              id: randomUUID(),
              id_empresa: sessao.id_empresa,
              id_funcionario_origem: atual.id,
              id_funcionario_destino: destinoInativacao.id,
              quantidade_leads: quantidadeLeads,
              observacao: payload.observacao,
              criado_por_tipo: sessao.perfil,
              criado_por_id: sessao.id_usuario,
            },
          });

          await tx.auditoriaEquipe.createMany({
            data: [
              {
                id: randomUUID(),
                id_empresa: sessao.id_empresa,
                id_funcionario_alvo: atual.id,
                acao: "INATIVAR_FUNCIONARIO",
                valor_anterior: atual.ativo ? "ATIVO" : "INATIVO",
                valor_novo: "INATIVO",
                observacao: payload.observacao,
                autor_tipo: sessao.perfil,
                autor_id: sessao.id_usuario,
              },
              {
                id: randomUUID(),
                id_empresa: sessao.id_empresa,
                id_funcionario_alvo: atual.id,
                acao: "REATRIBUIR_LEADS_FUNCIONARIO",
                valor_anterior: atual.nome,
                valor_novo: destinoInativacao.nome,
                observacao: `Leads reatribuidos: ${quantidadeLeads}`,
                autor_tipo: sessao.perfil,
                autor_id: sessao.id_usuario,
              },
            ],
          });
        });

        resultado.atualizados += 1;
        continue;
      }

      resultado.falhas.push({ id, motivo: "Acao nao suportada para o item." });
    } catch {
      resultado.falhas.push({ id, motivo: "Erro ao processar colaborador." });
    }
  }

  return resultado;
}
