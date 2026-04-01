"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";
import type { Automacao, AutomacaoForm, FormularioAutomacaoWizard, PassoAutomacaoWizard, ResumoRascunhoAutomacaoWizard } from "../../types";
import {
  criarFormularioAutomacaoVazio,
  lerRascunhoAutomacaoWizard,
  mapearAutomacaoParaFormulario,
  obterResumoRascunhoAutomacaoWizard,
  removerRascunhoAutomacaoWizard,
  salvarRascunhoAutomacaoWizard,
} from "./rascunho-storage";
import { AutomacaoWizardDraftBanner } from "./automacao-wizard-draft-banner";
import { AutomacaoWizardFooter } from "./automacao-wizard-footer";
import { AutomacaoWizardProgress } from "./automacao-wizard-progress";
import { AutomacaoWizardStepPanel } from "./automacao-wizard-step-panel";
import { useAutomacaoWizardData } from "./use-automacao-wizard-data";
import {
  criarAvisoRascunhoWizard,
  formulariosAutomacaoSaoIguais,
  montarPayloadAutomacaoWizard,
  podeAvancarPassoAutomacaoWizard,
} from "./automacao-wizard.utils";

type AutomacaoWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    dados: AutomacaoForm,
    contexto?: { automacaoId?: string | null },
  ) => Promise<{ sucesso: boolean; erro?: string }>;
  restaurarRascunhoAoAbrir: boolean;
  automacoes: Automacao[];
  automacaoEdicao?: Automacao | null;
  onRascunhoChange?: (rascunho: ResumoRascunhoAutomacaoWizard | null) => void;
};

export function AutomacaoWizard({
  open,
  onOpenChange,
  onSubmit,
  restaurarRascunhoAoAbrir,
  automacoes,
  automacaoEdicao,
  onRascunhoChange,
}: AutomacaoWizardProps) {
  const { addToast } = useToast();
  const [passo, setPasso] = useState<PassoAutomacaoWizard>(1);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [automacaoRecuperadaId, setAutomacaoRecuperadaId] = useState<string | null>(null);
  const [rascunhoRecuperado, setRascunhoRecuperado] = useState(false);
  const [ultimoRascunhoSalvoEm, setUltimoRascunhoSalvoEm] = useState<string | null>(null);
  const [formInicial, setFormInicial] = useState<FormularioAutomacaoWizard>(criarFormularioAutomacaoVazio);
  const [passoInicial, setPassoInicial] = useState<PassoAutomacaoWizard>(1);
  const [form, setForm] = useState<FormularioAutomacaoWizard>(criarFormularioAutomacaoVazio);
  const tokenInicializacaoRef = useRef<string | null>(null);
  const autoAberturaExecutadaRef = useRef(false);
  const forcarRecuperacaoNaProximaAberturaRef = useRef(false);
  const {
    instancias,
    estagios,
    carregandoDados,
    erroCarregamentoInstancias,
    erroCarregamentoEstagios,
  } = useAutomacaoWizardData(open);

  const automacaoRecuperada = useMemo(
    () => automacoes.find((item) => item.id === automacaoRecuperadaId) ?? null,
    [automacaoRecuperadaId, automacoes],
  );
  const instanciasDisponiveis = useMemo(() => instancias.filter(instanciaWhatsappEstaConectada), [instancias]);
  const instanciaSelecionada = useMemo(
    () => instancias.find((instancia) => instancia.id === form.idInstanciaWhatsapp) ?? null,
    [form.idInstanciaWhatsapp, instancias],
  );
  const instanciaSelecionadaDisponivel = instanciaSelecionada ? instanciaWhatsappEstaConectada(instanciaSelecionada) : false;
  const automacaoAtiva = automacaoEdicao ?? automacaoRecuperada ?? null;
  const automacaoAtivaId = automacaoAtiva?.id ?? automacaoRecuperadaId ?? null;
  const temAlteracoesNaoSalvas = !formulariosAutomacaoSaoIguais(form, formInicial) || passo !== passoInicial;
  const temProtecaoDeRascunho = temAlteracoesNaoSalvas || rascunhoRecuperado;

  const sincronizarResumoRascunho = useCallback(() => {
    onRascunhoChange?.(obterResumoRascunhoAutomacaoWizard());
  }, [onRascunhoChange]);

  const aplicarFormularioInicial = useCallback((proximoFormulario: FormularioAutomacaoWizard, proximoPasso: PassoAutomacaoWizard) => {
    setForm(proximoFormulario);
    setFormInicial(proximoFormulario);
    setPasso(proximoPasso);
    setPassoInicial(proximoPasso);
    setErro(null);
  }, []);

  const iniciarNovaAutomacao = useCallback(() => {
    setAutomacaoRecuperadaId(null);
    setRascunhoRecuperado(false);
    setUltimoRascunhoSalvoEm(null);
    aplicarFormularioInicial(criarFormularioAutomacaoVazio(), 1);
  }, [aplicarFormularioInicial]);

  const iniciarEdicaoAutomacao = useCallback((automacao: Automacao) => {
    setAutomacaoRecuperadaId(automacao.id);
    setRascunhoRecuperado(false);
    setUltimoRascunhoSalvoEm(null);
    aplicarFormularioInicial(mapearAutomacaoParaFormulario(automacao), 1);
  }, [aplicarFormularioInicial]);

  const recuperarRascunho = useCallback((mostrarToast: boolean) => {
    const rascunho = lerRascunhoAutomacaoWizard();
    if (!rascunho) {
      return false;
    }

    setAutomacaoRecuperadaId(rascunho.automacaoId);
    setRascunhoRecuperado(true);
    setUltimoRascunhoSalvoEm(rascunho.salvoEm);

    const formularioBase =
      rascunho.automacaoId && automacaoEdicao?.id === rascunho.automacaoId
        ? mapearAutomacaoParaFormulario(automacaoEdicao)
        : criarFormularioAutomacaoVazio();

    setForm(rascunho.form);
    setFormInicial(formularioBase);
    setPasso(rascunho.passo);
    setPassoInicial(1);
    setErro(null);

    if (mostrarToast) {
      addToast({
        type: "info",
        title: "Rascunho recuperado",
        description: "Retomamos sua automacao do ponto em que a pagina foi interrompida.",
      });
    }

    return true;
  }, [addToast, automacaoEdicao]);

  const persistirRascunho = useCallback((aberto: boolean) => {
    const salvoEm = new Date().toISOString();

    salvarRascunhoAutomacaoWizard({
      versao: 1,
      aberto,
      passo,
      modo: automacaoAtivaId ? "edicao" : "criacao",
      automacaoId: automacaoAtivaId,
      form,
      salvoEm,
    });

    setUltimoRascunhoSalvoEm(salvoEm);
    sincronizarResumoRascunho();
  }, [automacaoAtivaId, form, passo, sincronizarResumoRascunho]);

  const limparRascunho = useCallback(() => {
    removerRascunhoAutomacaoWizard();
    setRascunhoRecuperado(false);
    setUltimoRascunhoSalvoEm(null);
    sincronizarResumoRascunho();
  }, [sincronizarResumoRascunho]);

  const handleDescartarRascunho = useCallback(() => {
    limparRascunho();
    if (automacaoAtiva) {
      iniciarEdicaoAutomacao(automacaoAtiva);
    } else {
      iniciarNovaAutomacao();
    }

    addToast({
      type: "info",
      title: "Rascunho removido",
      description: "Voce voltou para uma automacao limpa e segura.",
    });
  }, [addToast, automacaoAtiva, iniciarEdicaoAutomacao, iniciarNovaAutomacao, limparRascunho]);

  const handleFecharWizard = useCallback(() => {
    if (loading) {
      return;
    }

    if (temProtecaoDeRascunho) {
      persistirRascunho(false);
    } else {
      limparRascunho();
    }

    onOpenChange(false);
  }, [limparRascunho, loading, onOpenChange, persistirRascunho, temProtecaoDeRascunho]);

  useEffect(() => {
    sincronizarResumoRascunho();
    const rascunho = lerRascunhoAutomacaoWizard();

    if (rascunho?.aberto && !open && !autoAberturaExecutadaRef.current) {
      autoAberturaExecutadaRef.current = true;
      forcarRecuperacaoNaProximaAberturaRef.current = true;
      onOpenChange(true);
    }
  }, [onOpenChange, open, sincronizarResumoRascunho]);

  useEffect(() => {
    if (!open) {
      tokenInicializacaoRef.current = null;
      return;
    }

    const rascunho = lerRascunhoAutomacaoWizard();
    const devePriorizarRascunho = restaurarRascunhoAoAbrir || forcarRecuperacaoNaProximaAberturaRef.current;
    const tokenDesejado = automacaoEdicao
      ? rascunho?.automacaoId === automacaoEdicao.id
        ? `rascunho:${automacaoEdicao.id}:${rascunho.salvoEm}`
        : `edicao:${automacaoEdicao.id}`
      : rascunho
        ? `rascunho:${rascunho.automacaoId ?? "criacao"}:${rascunho.salvoEm}`
        : "criacao";

    if (tokenInicializacaoRef.current === tokenDesejado) {
      return;
    }

    if (automacaoEdicao) {
      const recuperouMesmoContexto =
        devePriorizarRascunho &&
        rascunho?.automacaoId === automacaoEdicao.id &&
        recuperarRascunho(tokenInicializacaoRef.current === null);

      if (!recuperouMesmoContexto) {
        iniciarEdicaoAutomacao(automacaoEdicao);
      }
    } else if (!devePriorizarRascunho || !recuperarRascunho(tokenInicializacaoRef.current === null)) {
      iniciarNovaAutomacao();
    }

    forcarRecuperacaoNaProximaAberturaRef.current = false;
    tokenInicializacaoRef.current = tokenDesejado;
  }, [automacaoEdicao, iniciarEdicaoAutomacao, iniciarNovaAutomacao, open, recuperarRascunho, restaurarRascunhoAoAbrir]);

  useEffect(() => {
    if (open && rascunhoRecuperado && automacaoRecuperada) {
      setFormInicial(mapearAutomacaoParaFormulario(automacaoRecuperada));
    }
  }, [automacaoRecuperada, open, rascunhoRecuperado]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!temProtecaoDeRascunho) {
      limparRascunho();
      return;
    }

    const timeout = window.setTimeout(() => {
      persistirRascunho(true);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [limparRascunho, open, persistirRascunho, temProtecaoDeRascunho]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!open || !temProtecaoDeRascunho) {
        return undefined;
      }

      persistirRascunho(true);
      event.preventDefault();
      event.returnValue = "Seu rascunho de automacao sera restaurado na volta.";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [open, persistirRascunho, temProtecaoDeRascunho]);

  const handleSubmit = async () => {
    setLoading(true);
    setErro(null);

    try {
      const resultado = await onSubmit(montarPayloadAutomacaoWizard(form), { automacaoId: automacaoAtivaId });

      if (resultado.sucesso) {
        limparRascunho();
        autoAberturaExecutadaRef.current = false;
        tokenInicializacaoRef.current = null;
        onOpenChange(false);
      } else {
        setErro(resultado.erro || "Erro ao criar automação.");
      }
    } catch {
      setErro("Erro de conexao ao salvar automacao.");
    } finally {
      setLoading(false);
    }
  };

  const avisoRascunho = useMemo(
    () =>
      criarAvisoRascunhoWizard({
        temProtecaoDeRascunho,
        rascunhoRecuperado,
        ultimoRascunhoSalvoEm,
      }),
    [rascunhoRecuperado, temProtecaoDeRascunho, ultimoRascunhoSalvoEm],
  );

  const podeAvancar = podeAvancarPassoAutomacaoWizard(passo, form, instanciaSelecionadaDisponivel);

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : handleFecharWizard())}>
      <DialogContent
        className="max-w-3xl overflow-hidden border border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] p-0 shadow-[var(--shadow-overlay)]"
        onEscapeKeyDown={(event) => {
          if (temProtecaoDeRascunho) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => {
          if (temProtecaoDeRascunho) {
            event.preventDefault();
          }
        }}
      >
        <div className="space-y-6 p-6">
          <DialogHeader>
            <DialogTitle>{automacaoAtivaId ? "Editar Automação" : "Nova Automação"}</DialogTitle>
          </DialogHeader>

          <AutomacaoWizardDraftBanner aviso={avisoRascunho} onDescartar={handleDescartarRascunho} />
          <AutomacaoWizardProgress passo={passo} />

          <AutomacaoWizardStepPanel
            passo={passo}
            automacaoAtivaId={automacaoAtivaId}
            carregandoDados={carregandoDados}
            erro={erro}
            erroCarregamentoEstagios={erroCarregamentoEstagios}
            erroCarregamentoInstancias={erroCarregamentoInstancias}
            estagios={estagios}
            form={form}
            instanciaSelecionada={instanciaSelecionada}
            instanciaSelecionadaDisponivel={instanciaSelecionadaDisponivel}
            instancias={instancias}
            instanciasDisponiveis={instanciasDisponiveis}
            onFormChange={(atualizador) => setForm((anterior) => atualizador(anterior))}
          />

          <AutomacaoWizardFooter
            automacaoAtivaId={automacaoAtivaId}
            loading={loading}
            passo={passo}
            podeAvancar={podeAvancar}
            onFechar={handleFecharWizard}
            onVoltar={() => setPasso((valorAtual) => Math.max(1, valorAtual - 1) as PassoAutomacaoWizard)}
            onProximo={() => setPasso((valorAtual) => Math.min(3, valorAtual + 1) as PassoAutomacaoWizard)}
            onSubmit={handleSubmit}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
