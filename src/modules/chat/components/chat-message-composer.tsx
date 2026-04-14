"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { CalendarClock, ChevronDown, Clock3, Loader2, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { listarAtalhosChat, type ChatShortcut } from "@/lib/api/chat-shortcuts";
import { renderizarTemplateWhatsapp, type ContextoTemplateWhatsapp } from "@/lib/whatsapp-template";
import type { MensagemAgendada } from "@/lib/api/whatsapp.chat";
import { cn } from "@/lib/utils";
import {
  filtrarOrdenarAtalhos,
  normalizarMapaUsosAtalho,
  obterQueryAtalho,
  registrarUsoRecenteAtalho,
  resolverAcaoAtalhoTeclado,
} from "@/modules/chat/shortcuts-composer";

type ChatContextInfo = {
  telefone: string;
  pushName: string | null;
  canal: "whatsapp" | "instagram";
  leadMatch: {
    id: string;
    nome: string;
    id_estagio: string;
    id_negocio: string | null;
    nome_estagio: string | null;
    nome_funcionario: string | null;
    nome_pdv: string | null;
    negocio: { titulo: string } | null;
  } | null;
};

function ComposerToggle({
  active,
  label,
  icon,
  onClick,
  expanded,
}: {
  active?: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  expanded?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition-colors",
        active
          ? "border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-[var(--brand)]"
          : "border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
      )}
    >
      {icon}
      {label}
      {typeof expanded === "boolean" ? <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} /> : null}
    </button>
  );
}

type ChatMessageComposerProps = {
  instanceName: string;
  remoteJid: string;
  enviando: boolean;
  chatContext?: ChatContextInfo;
  agendadas: MensagemAgendada[];
  sendMessage: (conteudo: string) => Promise<void>;
  scheduleMessage: (conteudo: string, agendadoParaIso: string) => Promise<unknown>;
  cancelScheduledMessage: (id: string) => Promise<void>;
  recarregarAgendadas: () => Promise<void>;
};

export function ChatMessageComposer({
  instanceName,
  remoteJid,
  enviando,
  chatContext,
  agendadas,
  sendMessage,
  scheduleMessage,
  cancelScheduledMessage,
  recarregarAgendadas,
}: ChatMessageComposerProps) {
  const [texto, setTexto] = useState("");
  const [agendar, setAgendar] = useState(false);
  const [agendadoPara, setAgendadoPara] = useState("");
  const [agendadasAbertas, setAgendadasAbertas] = useState(false);
  const [atalhos, setAtalhos] = useState<ChatShortcut[]>([]);
  const [ultimosUsosAtalhos, setUltimosUsosAtalhos] = useState<Record<string, number>>({});
  const [atalhosAbertos, setAtalhosAbertos] = useState(false);
  const [indiceAtalhoAtivo, setIndiceAtalhoAtivo] = useState(0);
  const { addToast } = useToast();

  const queryAtalho = obterQueryAtalho(texto);
  const chaveRecenciaAtalhos = useMemo(
    () => `chat.shortcuts.recentes:${chatContext?.leadMatch?.id || remoteJid}`,
    [chatContext?.leadMatch?.id, remoteJid],
  );

  const atalhosFiltrados = useMemo(() => {
    return filtrarOrdenarAtalhos(atalhos, queryAtalho, ultimosUsosAtalhos);
  }, [atalhos, queryAtalho, ultimosUsosAtalhos]);

  function montarContextoVariaveis(): ContextoTemplateWhatsapp {
    return {
      lead_nome: chatContext?.leadMatch?.nome || chatContext?.pushName || "",
      lead_telefone: chatContext?.telefone || "",
      lead_id: chatContext?.leadMatch?.id || "",
      estagio_nome: chatContext?.leadMatch?.nome_estagio || "",
      negocio_titulo: chatContext?.leadMatch?.negocio?.titulo || "",
      nome_funcionario: chatContext?.leadMatch?.nome_funcionario || "",
      nome_pdv: chatContext?.leadMatch?.nome_pdv || "",
      canal: chatContext?.canal || "",
    };
  }

  function aplicarAtalho(atalho: ChatShortcut) {
    const renderizado = renderizarTemplateWhatsapp(atalho.conteudo, montarContextoVariaveis());
    setTexto(renderizado);
    setUltimosUsosAtalhos((atual) => {
      const atualizadoLimitado = registrarUsoRecenteAtalho(atual, atalho.slug, Date.now());
      try {
        localStorage.setItem(chaveRecenciaAtalhos, JSON.stringify(atualizadoLimitado));
      } catch {
        // ignorar falhas de armazenamento local
      }
      return atualizadoLimitado;
    });
    setAtalhosAbertos(false);
    setIndiceAtalhoAtivo(0);
  }

  useEffect(() => {
    if (!agendar && !agendadasAbertas) return;
    void recarregarAgendadas();
  }, [agendar, agendadasAbertas, recarregarAgendadas]);

  useEffect(() => {
    let mounted = true;
    void listarAtalhosChat().then((resultado) => {
      if (!mounted || !resultado.ok) return;
      setAtalhos(resultado.dados.atalhos);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(chaveRecenciaAtalhos);
      if (!salvo) {
        setUltimosUsosAtalhos({});
        return;
      }

      const parsed = JSON.parse(salvo) as unknown;
      const normalizado = normalizarMapaUsosAtalho(parsed);
      setUltimosUsosAtalhos(normalizado);
    } catch {
      setUltimosUsosAtalhos({});
    }
  }, [chaveRecenciaAtalhos]);

  useEffect(() => {
    if (!texto.startsWith("/") || texto.includes(" ")) {
      setAtalhosAbertos(false);
      setIndiceAtalhoAtivo(0);
      return;
    }

    setAtalhosAbertos(atalhosFiltrados.length > 0);
    setIndiceAtalhoAtivo(0);
  }, [texto, atalhosFiltrados.length]);

  const handleSubmit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!texto.trim() || enviando) return;
    const conteudo = texto;
    setTexto("");
    try {
      if (agendar) {
        if (!agendadoPara) throw new Error("Selecione data e hora para agendar.");
        await scheduleMessage(conteudo, new Date(agendadoPara).toISOString());
        setAgendar(false);
        setAgendadoPara("");
        addToast({ type: "success", title: "Mensagem agendada", description: "A mensagem será enviada no horário definido." });
      } else {
        await sendMessage(conteudo);
      }
    } catch (err) {
      setTexto(conteudo);
      const msgErro = err instanceof Error ? err.message : "Nao foi possivel enviar a mensagem agora.";
      addToast({ type: "error", title: "Erro ao enviar mensagem", description: msgErro });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const acao = resolverAcaoAtalhoTeclado({
      atalhosAbertos,
      quantidadeAtalhos: atalhosFiltrados.length,
      indiceAtual: indiceAtalhoAtivo,
      input: {
        key: event.key,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      },
    });

    if (acao.tipo === "navegar") {
      event.preventDefault();
      setIndiceAtalhoAtivo(acao.indice);
      return;
    }

    if (acao.tipo === "aplicar") {
      event.preventDefault();
      const alvo = atalhosFiltrados[indiceAtalhoAtivo] ?? atalhosFiltrados[0];
      if (alvo) {
        aplicarAtalho(alvo);
      }
      return;
    }

    if (acao.tipo === "fechar") {
      event.preventDefault();
      setAtalhosAbertos(false);
      return;
    }

    if (acao.tipo === "enviar") {
      event.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(12,12,14,0.94),rgba(12,12,14,1))] px-2.5 py-2.5 md:px-3">
      <div className="mx-auto w-full max-w-5xl rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] shadow-[var(--shadow-sm)]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border-subtle)] px-2.5 py-2">
          <ComposerToggle
            active={agendar}
            label={agendar ? "Agendando" : "Agendar"}
            icon={<CalendarClock className="h-3.5 w-3.5" />}
            onClick={() => setAgendar((current) => !current)}
          />
          {agendadas.length > 0 ? (
            <ComposerToggle
              active={agendadasAbertas}
              label={`Agendadas ${agendadas.length}`}
              icon={<Clock3 className="h-3.5 w-3.5" />}
              onClick={() => setAgendadasAbertas((current) => !current)}
              expanded={agendadasAbertas}
            />
          ) : null}
          {agendar ? (
            <input
              type="datetime-local"
              value={agendadoPara}
              onChange={(e) => setAgendadoPara(e.target.value)}
              className="h-9 rounded-xl border border-[var(--border-subtle)] bg-transparent px-3 text-[11px] text-[var(--text-primary)]"
            />
          ) : null}
          <div className="ml-auto hidden text-[10px] text-[var(--text-tertiary)] md:block">Enter envia, Shift+Enter quebra linha</div>
        </div>

        {agendadasAbertas ? (
          <div className="border-b border-[var(--border-subtle)] px-2.5 py-2.5 text-xs text-[var(--text-secondary)]">
            <div className="space-y-2">
              {agendadas.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-[var(--border-subtle)] bg-black/10 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-[var(--text-primary)]">{item.conteudo}</div>
                    <div>{new Date(item.agendadoPara).toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--brand)]/20 px-2 py-1 text-[10px] text-[var(--brand)]">{item.status}</span>
                    {item.status === "PENDENTE" ? (
                      <button
                        type="button"
                        onClick={() => {
                          void cancelScheduledMessage(item.id).catch((err) => {
                            addToast({
                              type: "error",
                              title: "Erro ao cancelar agendamento",
                              description: err instanceof Error ? err.message : "Tente novamente.",
                            });
                          });
                        }}
                        className="rounded-full border border-[var(--border-subtle)] p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)]"
                        aria-label="Cancelar mensagem agendada"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="relative flex items-end gap-2 px-2.5 py-2">
          <textarea
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={enviando || !instanceName || !remoteJid}
            placeholder={agendar ? "Escreva a mensagem que será enviada depois..." : "Escreva uma mensagem"}
            rows={1}
            className="max-h-28 min-h-[2.5rem] flex-1 resize-none bg-transparent px-2 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
          {atalhosAbertos ? (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-2.5 right-16 z-20 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1.5 shadow-[var(--shadow-md)]">
              <div className="mb-1 px-2 text-[10px] text-[var(--text-tertiary)]">
                Digite <span className="font-semibold">/</span>, navegue com ↑ ↓ (ou Ctrl/Cmd+J/K) e confirme com Enter/Tab
              </div>
              <div className="max-h-52 overflow-y-auto">
                {atalhosFiltrados.map((atalho, index) => (
                  <button
                    key={atalho.id}
                    type="button"
                    onClick={() => aplicarAtalho(atalho)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left transition-colors",
                      indiceAtalhoAtivo === index
                        ? "bg-[var(--brand-soft)] text-[var(--text-primary)]"
                        : "hover:bg-[color:rgba(255,255,255,0.04)]",
                    )}
                  >
                    <span className="mt-0.5 rounded-md border border-[var(--border-subtle)] bg-black/10 px-1.5 py-0.5 font-mono text-[10px] text-[var(--brand)]">
                      /{atalho.slug}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium text-[var(--text-primary)]">{atalho.nome}</span>
                      <span className="block truncate text-[11px] text-[var(--text-secondary)]">{atalho.conteudo}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <Button
            type="submit"
            size="icon"
            disabled={enviando || !texto.trim() || (agendar && !agendadoPara)}
            className="h-10 w-10 rounded-[14px] bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
}
