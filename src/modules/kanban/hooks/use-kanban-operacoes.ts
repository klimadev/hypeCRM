import { useCallback, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Lead, Props } from "../types";
import { obterMensagemErroKanban, MENSAGENS_FALLBACK_KANBAN } from "../utils/erro";
import { useToast } from "@/components/ui/toast";
import { converteMoedaBrParaNumero } from "@/lib/utils";
import {
  criarNegocioKanban,
  redistribuirNegociosEmAtendimentoKanban,
} from "@/lib/api/kanban";

type UseKanbanOperacoesParams = {
  perfil: Props["perfil"];
  idUsuario: string;
  valorNovoNegocio: string;
  pipelineSelecionadaId?: string;
  cargoNovoNegocio: { id_funcionario: string } | null;
  setNegocios: Dispatch<SetStateAction<Lead[]>>;
  setDialogNovoNegocioAberto: (aberto: boolean) => void;
  setCargoNovoNegocio: (cargo: { id_funcionario: string } | null) => void;
  setEstagioNovoNegocio: (estagio: string) => void;
  setValorNovoNegocio: (valor: string) => void;
  bootstrap: () => Promise<void>;
};

export function useKanbanOperacoes({
  perfil,
  idUsuario,
  valorNovoNegocio,
  pipelineSelecionadaId,
  cargoNovoNegocio,
  setNegocios,
  setDialogNovoNegocioAberto,
  setCargoNovoNegocio,
  setEstagioNovoNegocio,
  setValorNovoNegocio,
  bootstrap,
}: UseKanbanOperacoesParams) {
  const { addToast } = useToast();
  const [erroNovoNegocio, setErroNovoNegocio] = useState<string | null>(null);
  const [criandoNegocio, setCriandoNegocio] = useState(false);
  const [redistribuindoNegociosEmAtendimento, setRedistribuindoNegociosEmAtendimento] = useState(false);

  const criarNegocio = useCallback(
    async (evento: FormEvent<HTMLFormElement>) => {
      evento.preventDefault();

      if (criandoNegocio) {
        return;
      }

      setErroNovoNegocio(null);
      const dados = new FormData(evento.currentTarget);
      const idFuncionario =
        perfil === "COLABORADOR"
          ? idUsuario
          : cargoNovoNegocio?.id_funcionario ?? String(dados.get("id_funcionario") ?? "");

      const titulo = String(dados.get("titulo") ?? "").trim();
      const idEstagio = String(dados.get("id_estagio") ?? "").trim();
      const contatoIdsJson = String(dados.get("lead_ids_json") ?? "[]");

      let contatoIds: string[] = [];
      try {
        const parsed = JSON.parse(contatoIdsJson) as unknown;
        if (Array.isArray(parsed)) {
          contatoIds = parsed.filter((contatoId): contatoId is string => typeof contatoId === "string").map((contatoId) => contatoId.trim()).filter(Boolean);
        }
      } catch {
        contatoIds = [];
      }

      const valorOportunidade = converteMoedaBrParaNumero(valorNovoNegocio);

      if (titulo.length < 3) {
        setErroNovoNegocio("Informe um título para o negócio.");
        return;
      }

      if (!Number.isFinite(valorOportunidade) || valorOportunidade <= 0) {
        setErroNovoNegocio("Informe um valor maior que zero.");
        return;
      }

      if (!idEstagio) {
        setErroNovoNegocio("Selecione um estágio para o negócio.");
        return;
      }

      if (perfil !== "COLABORADOR" && !idFuncionario) {
        setErroNovoNegocio("Selecione um funcionário responsável.");
        return;
      }

      const idTemporario = `temp-${Date.now()}`;
      const negocioTemporario: Lead = {
        id: idTemporario,
        id_estagio: idEstagio,
        id_funcionario: idFuncionario,
        nome: titulo,
        telefone: "",
        valor_oportunidade: valorOportunidade,
        observacoes: null,
        motivo_perda: null,
        atualizado_em: new Date().toISOString(),
        id_negocio: idTemporario,
      };

      setCriandoNegocio(true);
      setNegocios((atual) => [negocioTemporario, ...atual]);

      try {
        const resposta = await criarNegocioKanban({
          titulo,
          valor_estimado: valorOportunidade,
          id_estagio: idEstagio,
          id_funcionario: idFuncionario,
          lead_ids: contatoIds,
          id_funil: pipelineSelecionadaId || undefined,
        });

        if (!resposta.ok) {
          setErroNovoNegocio(resposta.erro ?? MENSAGENS_FALLBACK_KANBAN.criarNegocio);
          setNegocios((atual) => atual.filter((item) => item.id !== idTemporario));
          return;
        }

        if (resposta.dados.negocio) {
          const negocioCriado = resposta.dados.negocio;
          setNegocios((atual) => atual.map((item) => (item.id === idTemporario ? negocioCriado : item)));
        } else {
          setNegocios((atual) => atual.filter((item) => item.id !== idTemporario));
        }

        addToast({
          type: "success",
          title: "Negócio criado",
          description: `${titulo} foi adicionado ao Kanban.`,
        });

        evento.currentTarget?.reset();
        setEstagioNovoNegocio("");
        setCargoNovoNegocio(null);
        setValorNovoNegocio("");
        setDialogNovoNegocioAberto(false);
      } catch (erro) {
        setErroNovoNegocio(obterMensagemErroKanban(erro, MENSAGENS_FALLBACK_KANBAN.criarNegocio));
        setNegocios((atual) => atual.filter((item) => item.id !== idTemporario));
      } finally {
        setCriandoNegocio(false);
      }
    },
    [
      criandoNegocio,
      perfil,
      idUsuario,
      cargoNovoNegocio,
      pipelineSelecionadaId,
      valorNovoNegocio,
      setNegocios,
      setEstagioNovoNegocio,
      setCargoNovoNegocio,
      setValorNovoNegocio,
      setDialogNovoNegocioAberto,
      addToast,
    ],
  );

  const redistribuirNegociosEmAtendimento = useCallback(async () => {
    if (redistribuindoNegociosEmAtendimento) {
      return { ok: false as const, erro: "Redistribuicao ja em andamento." };
    }

    setRedistribuindoNegociosEmAtendimento(true);
    try {
      const resposta = await redistribuirNegociosEmAtendimentoKanban({});
      if (!resposta.ok) {
        return { ok: false as const, erro: resposta.erro ?? MENSAGENS_FALLBACK_KANBAN.redistribuirEmAtendimento };
      }

      await bootstrap();

      return {
        ok: true as const,
        ...resposta.dados,
      };
    } catch (erro) {
      return { ok: false as const, erro: obterMensagemErroKanban(erro, MENSAGENS_FALLBACK_KANBAN.redistribuirEmAtendimento) };
    } finally {
      setRedistribuindoNegociosEmAtendimento(false);
    }
  }, [bootstrap, redistribuindoNegociosEmAtendimento]);

  return {
    erroNovoNegocio,
    setErroNovoNegocio,
    criandoNegocio,
    redistribuindoNegociosEmAtendimento,
    criarNegocio,
    redistribuirNegociosEmAtendimento,
  };
}
