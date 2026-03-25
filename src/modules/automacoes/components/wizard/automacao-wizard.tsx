"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  instanciaWhatsappEstaConectada,
  normalizarStatusInstanciaWhatsapp,
} from "@/lib/whatsapp-instancia-status";
import type {
  Automacao,
  AutomacaoForm,
  FormularioAutomacaoWizard,
  PassoAutomacaoWizard,
  ResumoRascunhoAutomacaoWizard,
} from "../../types";
import { VARIAVEIS_TEMPLATE } from "../../types";
import { listarInstanciasWhatsapp } from "@/lib/api/whatsapp";
import { listarEstagiosFunil } from "@/lib/api/whatsapp";
import type { WhatsappInstancia } from "@/modules/whatsapp/types";
import type { EstagioFunilOption } from "@/modules/whatsapp/types";
import {
  criarFormularioAutomacaoVazio,
  lerRascunhoAutomacaoWizard,
  mapearAutomacaoParaFormulario,
  obterResumoRascunhoAutomacaoWizard,
  removerRascunhoAutomacaoWizard,
  salvarRascunhoAutomacaoWizard,
} from "./rascunho-storage";

const VALOR_ESTAGIO_QUALQUER = "__qualquer_estagio__";

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

const PASSOS = [
  { numero: 1, titulo: "Gatilho" },
  { numero: 2, titulo: "Ação" },
  { numero: 3, titulo: "Revisão" },
] as const;

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
  const [instancias, setInstancias] = useState<WhatsappInstancia[]>([]);
  const [estagios, setEstagios] = useState<EstagioFunilOption[]>([]);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [erroCarregamentoInstancias, setErroCarregamentoInstancias] = useState<string | null>(null);
  const [erroCarregamentoEstagios, setErroCarregamentoEstagios] = useState<string | null>(null);
  const [automacaoRecuperadaId, setAutomacaoRecuperadaId] = useState<string | null>(null);
  const [rascunhoRecuperado, setRascunhoRecuperado] = useState(false);
  const [ultimoRascunhoSalvoEm, setUltimoRascunhoSalvoEm] = useState<string | null>(null);
  const [formInicial, setFormInicial] =
    useState<FormularioAutomacaoWizard>(criarFormularioAutomacaoVazio);
  const [passoInicial, setPassoInicial] = useState<PassoAutomacaoWizard>(1);
  const tokenInicializacaoRef = useRef<string | null>(null);
  const autoAberturaExecutadaRef = useRef(false);
  const forcarRecuperacaoNaProximaAberturaRef = useRef(false);

  const [form, setForm] =
    useState<FormularioAutomacaoWizard>(criarFormularioAutomacaoVazio);

  const automacaoRecuperada = useMemo(
    () => automacoes.find((item) => item.id === automacaoRecuperadaId) ?? null,
    [automacaoRecuperadaId, automacoes],
  );

  const instanciasDisponiveis = useMemo(
    () => instancias.filter(instanciaWhatsappEstaConectada),
    [instancias],
  );

  const instanciaSelecionada = useMemo(
    () => instancias.find((instancia) => instancia.id === form.idInstanciaWhatsapp) ?? null,
    [form.idInstanciaWhatsapp, instancias],
  );

  const instanciaSelecionadaDisponivel = instanciaSelecionada
    ? instanciaWhatsappEstaConectada(instanciaSelecionada)
    : false;

  const automacaoAtiva = automacaoEdicao ?? automacaoRecuperada ?? null;
  const automacaoAtivaId = automacaoAtiva?.id ?? automacaoRecuperadaId ?? null;

  const sincronizarResumoRascunho = useCallback(() => {
    onRascunhoChange?.(obterResumoRascunhoAutomacaoWizard());
  }, [onRascunhoChange]);

  const formatarHorarioRascunho = useCallback((valor: string | null) => {
    if (!valor) return null;

    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(data);
  }, []);

  const formatarStatusInstancia = useCallback((instancia: Pick<WhatsappInstancia, "status" | "phone">) => {
    const statusNormalizado = normalizarStatusInstanciaWhatsapp(instancia.status);

    if (instanciaWhatsappEstaConectada(instancia)) {
      return "Conectada";
    }

    if (statusNormalizado === "pending" || statusNormalizado === "qrcode" || statusNormalizado === "qr_code") {
      return "Aguardando QR Code";
    }

    if (statusNormalizado === "loading" || statusNormalizado === "creating") {
      return "Inicializando";
    }

    if (statusNormalizado === "disconnected" || statusNormalizado === "close") {
      return "Desconectada";
    }

    return instancia.status || "Indisponivel";
  }, []);

  const formulariosSaoIguais = useCallback(
    (atual: FormularioAutomacaoWizard, inicial: FormularioAutomacaoWizard) =>
      atual.nome === inicial.nome &&
      atual.idEstagioDestino === inicial.idEstagioDestino &&
      atual.idInstanciaWhatsapp === inicial.idInstanciaWhatsapp &&
      atual.telefoneDestino === inicial.telefoneDestino &&
      atual.mensagem === inicial.mensagem &&
      atual.delayMinutos === inicial.delayMinutos,
    [],
  );

  const temAlteracoesNaoSalvas =
    !formulariosSaoIguais(form, formInicial) || passo !== passoInicial;

  const temProtecaoDeRascunho = temAlteracoesNaoSalvas || rascunhoRecuperado;

  const aplicarFormularioInicial = useCallback(
    (proximoFormulario: FormularioAutomacaoWizard, proximoPasso: PassoAutomacaoWizard) => {
      setForm(proximoFormulario);
      setFormInicial(proximoFormulario);
      setPasso(proximoPasso);
      setPassoInicial(proximoPasso);
      setErro(null);
    },
    [],
  );

  const iniciarNovaAutomacao = useCallback(() => {
    setAutomacaoRecuperadaId(null);
    setRascunhoRecuperado(false);
    setUltimoRascunhoSalvoEm(null);
    aplicarFormularioInicial(criarFormularioAutomacaoVazio(), 1);
  }, [aplicarFormularioInicial]);

  const iniciarEdicaoAutomacao = useCallback(
    (automacao: Automacao) => {
      setAutomacaoRecuperadaId(automacao.id);
      setRascunhoRecuperado(false);
      setUltimoRascunhoSalvoEm(null);
      aplicarFormularioInicial(mapearAutomacaoParaFormulario(automacao), 1);
    },
    [aplicarFormularioInicial],
  );

  const recuperarRascunho = useCallback(
    (mostrarToast: boolean) => {
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
          description:
            "Retomamos sua automacao do ponto em que a pagina foi interrompida.",
        });
      }

      return true;
    },
    [addToast, automacaoEdicao],
  );

  const persistirRascunho = useCallback(
    (aberto: boolean) => {
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
    },
    [automacaoAtivaId, form, passo, sincronizarResumoRascunho],
  );

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
    if (loading) return;

    if (temProtecaoDeRascunho) {
      persistirRascunho(false);
    } else {
      limparRascunho();
    }

    onOpenChange(false);
  }, [limparRascunho, loading, onOpenChange, persistirRascunho, temProtecaoDeRascunho]);

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregandoDados(true);
      setErroCarregamentoInstancias(null);
      setErroCarregamentoEstagios(null);

      const [instanciasResult, estagiosResult] = await Promise.allSettled([
        listarInstanciasWhatsapp(),
        listarEstagiosFunil(),
      ]);

      if (!ativo) {
        return;
      }

      if (instanciasResult.status === "fulfilled") {
        if (instanciasResult.value.ok) {
          setInstancias(instanciasResult.value.dados.instancias);
        } else {
          setErroCarregamentoInstancias(
            instanciasResult.value.erro || "Nao foi possivel carregar as instancias agora.",
          );
        }
      } else {
        setErroCarregamentoInstancias(
          "Nao foi possivel carregar as instancias agora. Tente novamente em instantes.",
        );
      }

      if (estagiosResult.status === "fulfilled") {
        if (estagiosResult.value.ok) {
          setEstagios(estagiosResult.value.dados.estagios);
        } else {
          setErroCarregamentoEstagios(
            estagiosResult.value.erro || "Nao foi possivel carregar os estagios agora.",
          );
        }
      } else {
        setErroCarregamentoEstagios(
          "Nao foi possivel carregar os estagios agora. Tente novamente em instantes.",
        );
      }

      if (ativo) {
        setCarregandoDados(false);
      }
    }

    if (open) {
      void carregarDados();
    }

    return () => {
      ativo = false;
    };
  }, [open]);

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
    const devePriorizarRascunho =
      restaurarRascunhoAoAbrir || forcarRecuperacaoNaProximaAberturaRef.current;
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
    } else if (
      !devePriorizarRascunho ||
      !recuperarRascunho(tokenInicializacaoRef.current === null)
    ) {
      iniciarNovaAutomacao();
    }

    forcarRecuperacaoNaProximaAberturaRef.current = false;
    tokenInicializacaoRef.current = tokenDesejado;
  }, [
    automacaoEdicao,
    iniciarEdicaoAutomacao,
    iniciarNovaAutomacao,
    open,
    recuperarRascunho,
    restaurarRascunhoAoAbrir,
  ]);

  useEffect(() => {
    if (!open || !rascunhoRecuperado || !automacaoRecuperada) {
      return;
    }

    setFormInicial(mapearAutomacaoParaFormulario(automacaoRecuperada));
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
      const dados: AutomacaoForm = {
        nome: form.nome || `Automação ${new Date().toLocaleDateString()}`,
        fonte: "WHATSAPP",
        gatilho: "STAGE_CHANGE",
        ativo: true,
        acoes: [
          {
            tipo: "WHATSAPP_MSG",
            ordem: 0,
            delay_minutos: form.delayMinutos,
            id_instancia_whatsapp: form.idInstanciaWhatsapp || undefined,
            telefone_destino: form.telefoneDestino || undefined,
            mensagem: form.mensagem || "Olá {{lead_nome}}!",
          },
        ],
        id_estagio_destino: form.idEstagioDestino || undefined,
      };

      const resultado = await onSubmit(dados, { automacaoId: automacaoAtivaId });

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

  const podeAvancar = () => {
    if (passo === 1) return true;
    if (passo === 2) {
      return Boolean(form.mensagem.trim() && instanciaSelecionadaDisponivel);
    }
    return true;
  };

  const avisoRascunho = useMemo(() => {
    const horario = formatarHorarioRascunho(ultimoRascunhoSalvoEm);

    if (!temProtecaoDeRascunho && !ultimoRascunhoSalvoEm) {
      return null;
    }

    const titulo = rascunhoRecuperado
      ? "Rascunho recuperado"
      : "Protecao contra recarga ativa";

    const descricao = rascunhoRecuperado
      ? "Retomamos sua criacao automaticamente. A pagina pode recarregar sem derrubar seu progresso."
      : "Seu progresso fica salvo automaticamente nesta aba enquanto voce monta a automacao.";

    return { titulo, descricao, horario };
  }, [formatarHorarioRascunho, rascunhoRecuperado, temProtecaoDeRascunho, ultimoRascunhoSalvoEm]);

  const renderPasso = () => {
    switch (passo) {
      case 1:
        return (
          <div className="space-y-4">
            {erroCarregamentoEstagios ? (
              <InlineStatusAlert
                variant="error"
                message={erroCarregamentoEstagios}
                className="border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] text-[var(--danger)] [&>div]:bg-[rgba(244,63,94,0.16)] [&>div]:text-[var(--danger)]"
              />
            ) : null}

            <div className="rounded-[var(--radius-card)] border border-[rgba(16,185,129,0.22)] bg-[linear-gradient(180deg,rgba(16,185,129,0.1),rgba(12,12,14,0.96))] p-4 shadow-[var(--shadow-sm)]">
              <div className="mb-1 text-sm font-semibold text-[var(--text-primary)]">WhatsApp - Mudança de estágio</div>
              <div className="text-sm text-[var(--text-secondary)]">
                Esta automação dispara quando um lead muda de etapa no funil de vendas.
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Nome da automação
              </label>
              <Input
                value={form.nome}
                onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Notificar equipe sobre novos leads"
              />
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Estágio de destino (opcional)
              </label>
              <Select
                value={form.idEstagioDestino || VALOR_ESTAGIO_QUALQUER}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    idEstagioDestino: value === VALOR_ESTAGIO_QUALQUER ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="w-full bg-[var(--surface-elevated)]">
                  <SelectValue placeholder="Qualquer estágio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={VALOR_ESTAGIO_QUALQUER}>Qualquer estágio</SelectItem>
                  {estagios.map((estagio) => (
                    <SelectItem key={estagio.id} value={estagio.id}>
                      {estagio.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Deixe vazio para disparar em qualquer mudança de estágio
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">Configure a mensagem</h3>

            {erroCarregamentoInstancias ? (
              <InlineStatusAlert
                variant="error"
                message={erroCarregamentoInstancias}
                className="border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] text-[var(--danger)] [&>div]:bg-[rgba(244,63,94,0.16)] [&>div]:text-[var(--danger)]"
              />
            ) : null}
            
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Instância WhatsApp <span className="text-[var(--danger)]">*</span>
              </label>
              {carregandoDados ? (
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Carregando instâncias...</span>
                </div>
              ) : erroCarregamentoInstancias ? (
                <p className="rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] p-2 text-sm text-[var(--danger)]">
                  Tente recarregar os dados antes de escolher a instância.
                </p>
              ) : instancias.length === 0 ? (
                <p className="rounded-[var(--radius-control)] border border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.1)] p-2 text-sm text-[var(--warning)]">
                  Nenhuma instância WhatsApp cadastrada. Crie uma em WhatsApp &gt; Instâncias.
                </p>
              ) : (
                <div className="space-y-3">
                  <Select
                    value={form.idInstanciaWhatsapp}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, idInstanciaWhatsapp: value }))}
                  >
                    <SelectTrigger className="w-full bg-[var(--surface-elevated)]">
                      <SelectValue placeholder="Selecione a instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {instancias.map((inst) => {
                        const estaDisponivel = instanciaWhatsappEstaConectada(inst);

                        return (
                          <SelectItem key={inst.id} value={inst.id} disabled={!estaDisponivel}>
                            {inst.nome || inst.instance_name} ({formatarStatusInstancia(inst)})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {instanciasDisponiveis.length === 0 ? (
                    <InlineStatusAlert
                      variant="warning"
                      message="Suas instâncias existem, mas nenhuma está conectada no momento. Conecte uma em WhatsApp > Instâncias para usar nas automações."
                      className="border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.1)] text-[var(--warning)] [&>div]:bg-[rgba(245,158,11,0.16)] [&>div]:text-[var(--warning)]"
                    />
                  ) : null}

                  {instanciasDisponiveis.length < instancias.length ? (
                    <p className="text-xs text-[var(--text-secondary)]">
                      Só instâncias conectadas ficam habilitadas para envio automático.
                    </p>
                  ) : null}

                  {instanciaSelecionada && !instanciaSelecionadaDisponivel ? (
                    <InlineStatusAlert
                      variant="warning"
                      message="A instância selecionada não está conectada agora. Escolha uma instância ativa para salvar a automação."
                      className="border-[rgba(245,158,11,0.22)] bg-[rgba(245,158,11,0.1)] text-[var(--warning)] [&>div]:bg-[rgba(245,158,11,0.16)] [&>div]:text-[var(--warning)]"
                    />
                  ) : null}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Telefone destino (opcional)
              </label>
              <Input
                value={form.telefoneDestino}
                onChange={(e) => setForm((prev) => ({ ...prev, telefoneDestino: e.target.value }))}
                placeholder="11999999999"
              />
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                Deixe vazio para enviar para o lead. Formato: DDD + número (ex: 11999999999)
              </p>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Mensagem <span className="text-[var(--danger)]">*</span>
              </label>
              <Textarea
                value={form.mensagem}
                onChange={(e) => setForm((prev) => ({ ...prev, mensagem: e.target.value }))}
                placeholder="Digite sua mensagem..."
                rows={5}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {VARIAVEIS_TEMPLATE.map((v) => (
                  <Badge
                    key={v.nome}
                    variant="secondary"
                    className="cursor-pointer border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.06)]"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        mensagem: prev.mensagem + `{{${v.nome}}}`,
                      }))
                    }
                  >
                    {`{{${v.nome}}}`}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Atraso antes de enviar:
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={form.delayMinutos}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, delayMinutos: Number(e.target.value) }))
                  }
                  className="w-24"
                  min={0}
                />
                <span className="text-sm text-[var(--text-secondary)]">minutos</span>
              </div>
            </div>
          </div>
        );

      case 3:
        const estagioSelecionado = estagios.find(e => e.id === form.idEstagioDestino);
        
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              {automacaoAtivaId ? "Revise antes de salvar" : "Revise antes de criar"}
            </h3>
            <div className="space-y-3 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-sm)]">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Nome:</span>
                <p className="text-sm font-medium text-[var(--text-primary)]">{form.nome || `Automação sem nome`}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Canal:</span>
                <p className="text-sm font-medium text-[var(--text-primary)]">WhatsApp</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Gatilho:</span>
                <p className="text-sm font-medium text-[var(--text-primary)]">Mudança de estágio</p>
              </div>
              {estagioSelecionado && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Estágio destino:</span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{estagioSelecionado.nome}</p>
                </div>
              )}
              {instanciaSelecionada && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Instância:</span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{instanciaSelecionada.nome || instanciaSelecionada.instance_name}</p>
                </div>
              )}
              {form.telefoneDestino && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Telefone destino:</span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{form.telefoneDestino}</p>
                </div>
              )}
              {form.delayMinutos > 0 && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Atraso:</span>
                  <p className="text-sm font-medium text-[var(--text-primary)]">{form.delayMinutos} minutos</p>
                </div>
              )}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Mensagem:</span>
                <p className="mt-1 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-2 text-sm text-[var(--text-primary)]">
                  {form.mensagem || "(sem mensagem)"}
                </p>
              </div>
            </div>

            {erro && (
              <div className="rounded-[var(--radius-control)] border border-[rgba(244,63,94,0.22)] bg-[rgba(244,63,94,0.1)] p-3 text-sm text-[var(--danger)]">
                {erro}
              </div>
            )}

            <p className="text-sm text-[var(--text-secondary)]">
              Esta automação dispara no momento da mudança de estágio. Se houver
              atraso configurado ou retry, um job pode chamar <code>/api/dispatch</code>
              apenas para processar a fila pendente.
            </p>
          </div>
        );
    }
  };

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
            <DialogTitle>
              {automacaoAtivaId ? "Editar Automação" : "Nova Automação"}
            </DialogTitle>
          </DialogHeader>

          {avisoRascunho ? (
            <div className="rounded-[var(--radius-card)] border border-[rgba(56,189,248,0.22)] bg-[linear-gradient(135deg,rgba(56,189,248,0.12),rgba(12,12,14,0.96))] px-4 py-3 shadow-[var(--shadow-sm)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[var(--radius-control)] border border-[rgba(56,189,248,0.18)] bg-[rgba(56,189,248,0.12)] text-[var(--info)]">
                    <Save className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {avisoRascunho.titulo}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {avisoRascunho.descricao}
                    </p>
                    {avisoRascunho.horario ? (
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Ultimo salvamento as {avisoRascunho.horario}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={handleDescartarRascunho}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Descartar rascunho
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3">
            {PASSOS.map((p) => (
              <div key={p.numero} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors duration-[var(--duration-fast)]",
                    passo === p.numero
                      ? "bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-glow)]"
                      : passo > p.numero
                      ? "border border-[rgba(16,185,129,0.18)] bg-[rgba(16,185,129,0.14)] text-[var(--success)]"
                      : "border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] text-[var(--text-tertiary)]"
                  )}
                >
                  {passo > p.numero ? <Check className="h-4 w-4" /> : p.numero}
                </div>
                <span
                  className={cn(
                    "text-sm",
                    passo >= p.numero ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]",
                  )}
                >
                  {p.titulo}
                </span>
                {p.numero < 3 && (
                  <div className="ml-2 h-px w-8 bg-[var(--border-subtle)]" />
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[300px]">{renderPasso()}</div>

          <div className="flex justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleFecharWizard} disabled={loading}>
                Fechar e continuar depois
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  setPasso((valorAtual) => Math.max(1, valorAtual - 1) as PassoAutomacaoWizard)
                }
                disabled={passo === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>

            {passo < 3 ? (
              <Button
                onClick={() =>
                  setPasso((valorAtual) => Math.min(3, valorAtual + 1) as PassoAutomacaoWizard)
                }
                disabled={!podeAvancar()}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {automacaoAtivaId ? "Salvando..." : "Criando..."}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {automacaoAtivaId ? "Salvar" : "Criar Automação"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
