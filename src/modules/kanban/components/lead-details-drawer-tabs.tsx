"use client";

import { Banknote, FileText, Link2, Loader2, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WhatsappChatPanel } from "@/modules/whatsapp/components/chat/whatsapp-chat-panel";
import type { WhatsappChatBlockedState, WhatsappChatMessage, ChatConnectionStatus } from "@/modules/whatsapp/types";
import type { ApiLeadContato } from "@/lib/api/leads";
import type { Estagio, Funcionario, Lead, PendenciaDinamica } from "../types";
import { EmptyState } from "./empty-state";
import { NegocioDetailsTabContent } from "./lead-details-tab-content";
import { NegocioParcelasTab } from "./lead-parcelas-tab";
import { NegocioVinculosTab } from "./negocio-vinculos-tab";

type LeadDetailsDrawerTabsProps = {
  negocioSelecionado: Lead | null;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  estagios: Estagio[];
  funcionarios: Funcionario[];
  pendenciasNegocio: PendenciaDinamica[];
  salvando: boolean;
  erroDetalhesNegocio: string | null;
  setErroDetalhesNegocio: (erro: string | null) => void;
  onMudarNegocio: (negocioAtualizado: Lead) => void;
  onSalvar: () => Promise<void>;
  temAlteracoes: boolean;
  setTemAlteracoes: (value: boolean) => void;
  tabAtiva: string;
  setTabAtiva: (tab: string) => void;
  leadsDisponiveis: ApiLeadContato[];
  carregandoLeadsDisponiveis: boolean;
  salvandoVinculos: boolean;
  erroVinculos: string | null;
  setErroVinculos: (erro: string | null) => void;
  onSalvarVinculos: (leadIds: string[]) => Promise<void>;
  whatsappChat: {
    unreadCount: number;
    messages: WhatsappChatMessage[];
    connectionStatus: ChatConnectionStatus;
    loading: boolean;
    sending: boolean;
    canSend: boolean;
    error: string | null;
    blockedState: WhatsappChatBlockedState | null;
    sendMessage: (texto: string) => Promise<void>;
    retryMessage: (message: WhatsappChatMessage) => Promise<void>;
  };
};

export function LeadDetailsDrawerTabs(props: LeadDetailsDrawerTabsProps) {
  const {
    negocioSelecionado,
    perfil,
    estagios,
    funcionarios,
    pendenciasNegocio,
    salvando,
    erroDetalhesNegocio,
    setErroDetalhesNegocio,
    onMudarNegocio,
    onSalvar,
    temAlteracoes,
    setTemAlteracoes,
    tabAtiva,
    setTabAtiva,
    leadsDisponiveis,
    carregandoLeadsDisponiveis,
    salvandoVinculos,
    erroVinculos,
    setErroVinculos,
    onSalvarVinculos,
    whatsappChat,
  } = props;

  const podeRenderizarConteudo = Boolean(negocioSelecionado?.id && negocioSelecionado?.nome);

  if (!podeRenderizarConteudo || !negocioSelecionado) {
    return (
      <EmptyState
        icone={<Loader2 className="h-6 w-6 animate-spin" />}
        titulo="Preparando detalhes do negócio"
        descricao="Os dados do drawer ainda não ficaram prontos para exibição."
      />
    );
  }

  return (
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
          onSalvar={onSalvar}
          temAlteracoes={temAlteracoes}
          setTemAlteracoes={setTemAlteracoes}
        />
      </TabsContent>

      <TabsContent value="vinculos" className="m-0 flex-1 overflow-y-auto">
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
      </TabsContent>

      <TabsContent value="chat" className="m-0 flex-1 overflow-hidden">
        <WhatsappChatPanel
          nomeContato={negocioSelecionado.nome ?? "Negócio"}
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
    </Tabs>
  );
}
