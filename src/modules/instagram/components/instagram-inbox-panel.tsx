"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Loader2, MessageCircle, RefreshCw, Instagram, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useInstagramInbox } from "../hooks/use-instagram-inbox";

function formatarData(valor: string) {
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "--";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(data);
}

export function InstagramInboxPanel() {
  const vm = useInstagramInbox();
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleEnviar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!mensagem.trim() || !vm.selectedConversationId || enviando) return;

    setEnviando(true);
    try {
      await vm.enviarMensagem(mensagem);
      setMensagem("");
    } finally {
      setEnviando(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleEnviar();
    }
  };

  const hasConversation = vm.selectedConversationId && vm.conversations.length > 0;

  return (
    <Card className="border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.92))]">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Inbox Instagram (polling)</CardTitle>
          <CardDescription>
            Leitura e envio por polling server-side, sem webhook, usando a conta profissional conectada.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => void vm.recarregar()}>
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="space-y-2">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Instagram className="h-4 w-4 text-[var(--brand)]" />
              {vm.account ? `@${vm.account.username}` : "Sem conta ativa"}
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{vm.account?.nome ?? "Conecte uma conta profissional para ler conversas."}</p>
          </div>

          <div className="max-h-[26rem] space-y-1 overflow-y-auto pr-1">
            {vm.carregando ? (
              <div className="flex items-center gap-2 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-3 text-sm text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando inbox...
              </div>
            ) : vm.conversations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-4 text-sm text-[var(--text-secondary)]">
                Nenhuma conversa encontrada na conta ativa.
              </div>
            ) : (
              vm.conversations.map((conversation) => {
                const active = conversation.id === vm.selectedConversationId;
                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void vm.selecionarConversa(conversation.id)}
                    className={cn(
                      "w-full rounded-2xl border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-[color:rgba(139,92,246,0.28)] bg-[var(--brand-soft)]"
                        : "border-[var(--border-subtle)] bg-[var(--surface-elevated)] hover:border-[var(--border-strong)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {conversation.participant_name ?? conversation.participant_username ?? conversation.participant_id ?? conversation.id}
                      </p>
                      {conversation.unread_count > 0 ? (
                        <span className="rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--brand)]">
                          {conversation.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-[var(--text-secondary)]">{conversation.last_message_text ?? (conversation.message_count > 0 ? `${conversation.message_count} mensagem(ns)` : "Sem mensagens")}</p>
                    <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{formatarData(conversation.updated_at)}</p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-h-[20rem] flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
          <div className="flex-1 overflow-y-auto p-4">
            {vm.carregandoMensagem ? (
              <div className="flex h-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando mensagens...
              </div>
            ) : vm.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-[var(--text-secondary)]">
                <MessageCircle className="h-10 w-10 text-[var(--text-tertiary)]" />
                <p>Selecione uma conversa para ver as mensagens.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vm.messages.map((message) => (
                  <div key={message.id} className={cn("max-w-[85%] rounded-2xl border px-3 py-2 text-sm", message.from_me ? "ml-auto border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)]" : "border-[var(--border-subtle)] bg-[var(--surface)]")}>
                    {!message.from_me && message.from_name ? (
                      <p className="mb-1 text-[10px] font-medium text-[var(--text-tertiary)]">{message.from_name}</p>
                    ) : null}
                    <p className="whitespace-pre-wrap text-[var(--text-primary)]">{message.text ?? "[mídia]"}</p>
                    <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{formatarData(message.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {hasConversation ? (
            <form onSubmit={handleEnviar} className="flex shrink-0 items-center gap-2 border-t border-[var(--border-subtle)] p-3">
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                rows={1}
                className="flex-1 resize-none rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              />
              <Button type="submit" size="sm" disabled={!mensagem.trim() || enviando}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
