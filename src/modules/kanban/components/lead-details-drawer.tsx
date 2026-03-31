"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, Banknote, FileText, Link2, Loader2, MessageCircle, Phone, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWhatsappChat } from "@/modules/whatsapp/hooks/use-whatsapp-chat";
import { WhatsappChatPanel } from "@/modules/whatsapp/components/chat/whatsapp-chat-panel";
import { MENSAGENS_KANBAN } from "../utils/mensagens";
import { EmptyState } from "./empty-state";
import type { ApiLeadContato } from "@/lib/api/leads";
import type { Estagio, Funcionario, Lead, PendenciaDinamica, StatusSalvamentoDetalhesNegocio } from "../types";
import { NegocioDetailsTabContent } from "./lead-details-tab-content";
import { NegocioVinculosTab } from "./negocio-vinculos-tab";
import { NegocioParcelasTab } from "./lead-parcelas-tab";

type NegocioDetailsDrawerProps = {
  negocioSelecionado: Lead | null;
  pendenciasNegocio: PendenciaDinamica[];
  onOpenChange: (aberto: boolean) => void;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  estagios: Estagio[];
  funcionarios: Funcionario[];
  onMudarNegocio: (negocioAtualizado: Lead) => void;
  salvando: boolean;
  salvo: boolean;
  salvandoAutomaticamente: boolean;
  salvamentoAutomaticoPendente: boolean;
  ultimaAtualizacaoSalvaEm: Date | null;
  statusSalvamentoDetalhes: StatusSalvamentoDetalhesNegocio;
  erroDetalhesNegocio: string | null;
  setErroDetalhesNegocio: (erro: string | null) => void;
  onSalvarDetalhesNegocio: (negocio: Lead) => Promise<void>;
  leadsDisponiveis: ApiLeadContato[];
  carregandoLeadsDisponiveis: boolean;
  salvandoVinculos: boolean;
  removendoNegocio: boolean;
  erroVinculos: string | null;
  setErroVinculos: (erro: string | null) => void;
  onSalvarVinculos: (leadIds: string[]) => Promise<void>;
  onRemoverNegocio: (opcoes: { removerLeadsVinculados: boolean }) => Promise<boolean>;
};

export function NegocioDetailsDrawer(props: NegocioDetailsDrawerProps) {
  const {
    negocioSelecionado,
    pendenciasNegocio,
    onOpenChange,
    perfil,
    estagios,
    funcionarios,
    onMudarNegocio,
    salvando,
    salvo,
    salvandoAutomaticamente,
    salvamentoAutomaticoPendente,
    ultimaAtualizacaoSalvaEm,
    statusSalvamentoDetalhes,
    erroDetalhesNegocio,
    setErroDetalhesNegocio,
    onSalvarDetalhesNegocio,
    leadsDisponiveis,
    carregandoLeadsDisponiveis,
    salvandoVinculos,
    removendoNegocio,
    erroVinculos,
    setErroVinculos,
    onSalvarVinculos,
    onRemoverNegocio,
  } = props;

  const [temAlteracoes, setTemAlteracoes] = useState(false);
  const [tabAtiva, setTabAtiva] = useState("detalhes");
  const [fecharConfirmado, setFecharConfirmado] = useState(false);
  const [dialogRemocaoAberto, setDialogRemocaoAberto] = useState(false);
  const [removerLeadsVinculados, setRemoverLeadsVinculados] = useState(false);
  const podeRenderizarConteudo = Boolean(negocioSelecionado?.id && negocioSelecionado.nome);

  const whatsappChat = useWhatsappChat({
    contatoId: negocioSelecionado?.lead_principal?.id,
    enabled: Boolean(negocioSelecionado?.lead_principal?.id),
    markReadEnabled: tabAtiva === "chat" && Boolean(negocioSelecionado?.lead_principal?.id),
    pollMs: 30000,
  });

  const textoUltimaAtualizacao = useMemo(() => {
    if (!ultimaAtualizacaoSalvaEm) return null;

    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(ultimaAtualizacaoSalvaEm);
  }, [ultimaAtualizacaoSalvaEm]);

  const atalhoSalvar = useMemo(() => {
    if (typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")) {
      return "Cmd+S";
    }

    return "Ctrl+S";
  }, []);

  const leadsRelacionados = useMemo(() => {
    const ids = new Set<string>();
    if (negocioSelecionado?.lead_principal?.id) {
      ids.add(negocioSelecionado.lead_principal.id);
    }

    for (const lead of negocioSelecionado?.leads_vinculados ?? []) {
      ids.add(lead.id);
    }

    return Array.from(ids);
  }, [negocioSelecionado]);

  const quantidadeLeadsRelacionados = leadsRelacionados.length;

  const descricaoRemocao = useMemo(() => {
    if (quantidadeLeadsRelacionados === 0) {
      return "Este negócio nao possui leads vinculados para remover em conjunto.";
    }

    return quantidadeLeadsRelacionados === 1
      ? "Também remover o lead vinculado a este negócio."
      : `Também remover os ${quantidadeLeadsRelacionados} leads vinculados a este negócio.`;
  }, [quantidadeLeadsRelacionados]);

  const statusSalvar = useMemo(() => {
    if (erroDetalhesNegocio) {
      return {
        texto: erroDetalhesNegocio,
        classe: "text-rose-200",
        icone: <AlertCircle className="h-3 w-3" />,
      };
    }

    const mapaStatus: Record<StatusSalvamentoDetalhesNegocio, { texto: string; classe: string; icone?: ReactNode }> = {
      erro: {
        texto: erroDetalhesNegocio ?? MENSAGENS_KANBAN.erro.generico,
        classe: "text-rose-200",
        icone: <AlertCircle className="h-3 w-3" />,
      },
      salvando_automaticamente: {
        texto: "Salvando alterações automaticamente...",
        classe: "text-amber-100",
        icone: <Loader2 className="h-3 w-3 animate-spin" />,
      },
      salvando_manual: {
        texto: "Salvando alterações do negócio...",
        classe: "text-amber-100",
        icone: <Loader2 className="h-3 w-3 animate-spin" />,
      },
      salvo: {
        texto: textoUltimaAtualizacao ? `Última atualização salva às ${textoUltimaAtualizacao}.` : "Alterações salvas com sucesso.",
        classe: "text-emerald-100",
      },
      pendente: {
        texto: "Alterações detectadas. Salvamento automático em instantes.",
        classe: "text-amber-100",
        icone: <AlertCircle className="h-3 w-3" />,
      },
      ocioso: {
        texto: textoUltimaAtualizacao ? `Tudo salvo. Última atualização às ${textoUltimaAtualizacao}.` : `Edite os detalhes e use ${atalhoSalvar} para salvar na hora.`,
        classe: "text-emerald-100",
      },
    };

    const statusBase = mapaStatus[statusSalvamentoDetalhes];

    if (!salvando && !salvandoAutomaticamente && !salvo && temAlteracoes && !salvamentoAutomaticoPendente) {
        return {
          texto: "Existem alterações locais aguardando salvamento.",
        classe: "text-amber-100",
        icone: <AlertCircle className="h-3 w-3" />,
      };
    }

    return statusBase;
  }, [atalhoSalvar, erroDetalhesNegocio, temAlteracoes, salvando, salvandoAutomaticamente, salvamentoAutomaticoPendente, salvo, statusSalvamentoDetalhes, textoUltimaAtualizacao]);

  const handleOpenChange = useCallback((aberto: boolean) => {
    if (aberto) {
      onOpenChange(true);
      return;
    }

    let fechamentoConfirmadoAgora = false;

    if (!aberto && !fecharConfirmado && temAlteracoes) {
      const confirmar = window.confirm(MENSAGENS_KANBAN.confirmacao.descartarAlteracoes);
      if (!confirmar) return;
      setFecharConfirmado(true);
      fechamentoConfirmadoAgora = true;
    }

    if (!temAlteracoes || fecharConfirmado || fechamentoConfirmadoAgora) {
      onOpenChange(false);
      setFecharConfirmado(false);
      setTemAlteracoes(false);
      setTabAtiva("detalhes");
      setDialogRemocaoAberto(false);
      setRemoverLeadsVinculados(false);
    }
  }, [fecharConfirmado, temAlteracoes, onOpenChange]);

  const handleSalvar = useCallback(async () => {
    if (!negocioSelecionado) return;
    await onSalvarDetalhesNegocio(negocioSelecionado);
    setTemAlteracoes(false);
  }, [negocioSelecionado, onSalvarDetalhesNegocio]);

  const handleRemoverNegocio = useCallback(async () => {
    if (!negocioSelecionado) return;

    const sucesso = await onRemoverNegocio({ removerLeadsVinculados });
    if (!sucesso) {
      return;
    }

    setDialogRemocaoAberto(false);
    setRemoverLeadsVinculados(false);
    onOpenChange(false);
  }, [negocioSelecionado, onOpenChange, onRemoverNegocio, removerLeadsVinculados]);

  useEffect(() => {
    if (!negocioSelecionado) return;

    const handleAtalhos = (event: KeyboardEvent) => {
      const tecla = event.key.toLowerCase();

      if ((event.ctrlKey || event.metaKey) && tecla === "s") {
        if (!temAlteracoes || salvando) return;
        event.preventDefault();
        void handleSalvar();
        return;
      }

      if (event.key !== "Escape") return;

      event.preventDefault();
      handleOpenChange(false);
    };

    window.addEventListener("keydown", handleAtalhos, true);
    return () => window.removeEventListener("keydown", handleAtalhos, true);
  }, [handleOpenChange, handleSalvar, temAlteracoes, negocioSelecionado, salvando]);

  return (
    <>
      <Sheet open={Boolean(negocioSelecionado)} onOpenChange={handleOpenChange}>
          <SheetContent key={negocioSelecionado?.id ?? "sem-negocio"} side="right" className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-2xl">
            <SheetHeader className="space-y-0 border-b border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(17,17,19,0.98),rgba(12,12,14,0.96))] px-4 py-3 text-[var(--text-primary)]">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <MessageCircle className="h-5 w-5 shrink-0 text-[var(--success)]" />
                <SheetTitle className="truncate text-base text-[var(--text-primary)]">{negocioSelecionado?.nome}</SheetTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 rounded-[calc(var(--radius-control)-2px)]"
                  onClick={() => {
                    setRemoverLeadsVinculados(false);
                    setDialogRemocaoAberto(true);
                  }}
                  disabled={removendoNegocio}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.06)]" onClick={() => handleOpenChange(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <SheetDescription className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Phone className="h-3 w-3" />
              <span>{negocioSelecionado?.lead_principal?.telefone ?? "Sem contato principal vinculado"}</span>
              <span className={`inline-flex items-center gap-1 ${statusSalvar.classe}`}>
                {statusSalvar.icone ?? null}
                {statusSalvar.texto}
              </span>
            </SheetDescription>
      <p className="text-xs text-[var(--text-tertiary)]">Atalhos: {atalhoSalvar} salva agora • Esc fecha o drawer</p>
          </SheetHeader>

          {podeRenderizarConteudo && negocioSelecionado ? (
            <Tabs value={tabAtiva} onValueChange={setTabAtiva} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-4 py-2">
                <TabsList className="grid w-full grid-cols-4 bg-[color:rgba(255,255,255,0.03)]">
                  <TabsTrigger value="detalhes" className="text-sm data-[state=active]:bg-[var(--surface-elevated)] data-[state=active]:shadow-sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="vinculos" className="text-sm data-[state=active]:bg-[var(--surface-elevated)] data-[state=active]:shadow-sm">
                    <Link2 className="mr-2 h-4 w-4" />
                    Vínculos
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="relative text-sm data-[state=active]:bg-[var(--surface-elevated)] data-[state=active]:shadow-sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Chat
                    {whatsappChat.unreadCount > 0 ? <span className="ml-1 h-2 w-2 animate-pulse rounded-full bg-red-500" /> : null}
                  </TabsTrigger>
                  <TabsTrigger value="parcelas" className="text-sm data-[state=active]:bg-[var(--surface-elevated)] data-[state=active]:shadow-sm">
                    <Banknote className="mr-2 h-4 w-4" />
                    Parcelas
                  </TabsTrigger>
                  {/* [HYPE CRM] Feature em desenvolvimento - Produtos será uma feature exclusiva do HYPE CRM */}
                  {/* <TabsTrigger value="produtos" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <Package className="mr-2 h-4 w-4" />
                    Produtos
                  </TabsTrigger> */}
                </TabsList>
              </div>

              <TabsContent value="detalhes" className="m-0 flex-1 overflow-y-auto">
                <NegocioDetailsTabContent
                  negocioSelecionado={negocioSelecionado}
                  perfil={perfil}
                  estagios={estagios}
                  funcionarios={funcionarios}
                  pendenciasNegocio={pendenciasNegocio}
                  salvando={salvando}
                  erroDetalhesNegocio={erroDetalhesNegocio}
                  setErroDetalhesNegocio={setErroDetalhesNegocio}
                  onMudarNegocio={(negocioAtualizado) => {
                    onMudarNegocio(negocioAtualizado);
                    setTemAlteracoes(true);
                  }}
                  onSalvar={handleSalvar}
                  temAlteracoes={temAlteracoes}
                  setTemAlteracoes={setTemAlteracoes}
                />
              </TabsContent>

              <TabsContent value="vinculos" className="m-0 flex-1 overflow-y-auto">
                {negocioSelecionado ? (
                  <NegocioVinculosTab
                    key={negocioSelecionado.id}
                    negocioSelecionado={negocioSelecionado}
                    leadsDisponiveis={leadsDisponiveis}
                    carregandoLeadsDisponiveis={carregandoLeadsDisponiveis}
                    salvandoVinculos={salvandoVinculos}
                    erroVinculos={erroVinculos}
                    setErroVinculos={setErroVinculos}
                    onSalvarVinculos={onSalvarVinculos}
                  />
                ) : null}
              </TabsContent>

              <TabsContent value="chat" className="m-0 flex-1 overflow-hidden">
                <WhatsappChatPanel
                  nomeContato={negocioSelecionado?.nome ?? "Negócio"}
                  messages={whatsappChat.messages}
                  connectionStatus={whatsappChat.connectionStatus}
                  loading={whatsappChat.loading}
                  sending={whatsappChat.sending}
                  canSend={whatsappChat.canSend}
                  error={whatsappChat.error}
                  blockedState={whatsappChat.blockedState}
                  onSendMessage={whatsappChat.sendMessage}
                  onRetryMessage={whatsappChat.retryMessage}
                />
              </TabsContent>

              <TabsContent value="parcelas" className="m-0 flex-1 overflow-y-auto p-4">
                <NegocioParcelasTab negocioId={negocioSelecionado.id} />
              </TabsContent>

              {/* [HYPE CRM] Feature em desenvolvimento - Produtos será uma feature exclusiva do HYPE CRM */}
              {/* <TabsContent value="produtos" className="m-0 flex-1 overflow-y-auto p-4">
                <NegocioProdutosTab negocioId={negocioSelecionado.id} />
              </TabsContent> */}
            </Tabs>
          ) : (
            <EmptyState
              icone={<Loader2 className="h-6 w-6 animate-spin" />}
                titulo="Preparando detalhes do negócio"
                descricao="Os dados do drawer ainda não ficaram prontos para exibição."
            />
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(negocioSelecionado) && dialogRemocaoAberto}
        onOpenChange={(aberto) => {
          if (aberto) {
            setDialogRemocaoAberto(true);
            return;
          }

          if (removendoNegocio) {
            return;
          }

          setDialogRemocaoAberto(false);
          setRemoverLeadsVinculados(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover negócio</DialogTitle>
            <DialogDescription>
              A remoção desativa o negócio. Você pode decidir se os leads vinculados também devem ser removidos.
            </DialogDescription>
          </DialogHeader>

          {negocioSelecionado ? (
            <div className="space-y-3">
              <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">{negocioSelecionado.nome}</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {negocioSelecionado.lead_principal?.telefone ?? "Sem telefone principal"} • {quantidadeLeadsRelacionados.toLocaleString("pt-BR")} lead{quantidadeLeadsRelacionados === 1 ? "" : "s"} relacionado{quantidadeLeadsRelacionados === 1 ? "" : "s"}
                </p>
              </div>

              {quantidadeLeadsRelacionados > 0 ? (
                <div className="flex items-center justify-between gap-4 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">Remover leads vinculados</p>
                    <p className="text-xs text-[var(--text-secondary)]">{descricaoRemocao}</p>
                  </div>
                  <Switch
                    checked={removerLeadsVinculados}
                    onCheckedChange={setRemoverLeadsVinculados}
                    disabled={removendoNegocio}
                  />
                </div>
              ) : (
                <p className="rounded-[var(--radius-control)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                  Este negócio não possui leads vinculados ativos.
                </p>
              )}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (removendoNegocio) return;
                setDialogRemocaoAberto(false);
                setRemoverLeadsVinculados(false);
              }}
              disabled={removendoNegocio}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleRemoverNegocio()}
              disabled={removendoNegocio}
            >
              {removendoNegocio ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removendo...
                </span>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {quantidadeLeadsRelacionados > 0 && removerLeadsVinculados ? "Remover negócio e leads" : "Remover negócio"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
