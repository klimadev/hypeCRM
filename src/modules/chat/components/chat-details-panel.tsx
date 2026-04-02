"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  GitBranch,
  Layers3,
  Megaphone,
  Phone,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChatUnificado } from "../types";
import { formatarTelefoneChat, obterMetaOrigemLead, obterNomeChat } from "../helpers";

type ChatDetailsPanelProps = {
  chat: ChatUnificado;
  onVoltar?: () => void;
  onRegistrarLead: (params: { telefone: string; nome?: string; id_pdv?: string; id_funcionario?: string }) => Promise<void>;
  onCriarNegocio: (params: { telefone: string; nome?: string; id_pdv?: string; id_funcionario?: string; id_estagio?: string }) => Promise<void>;
};

export function ChatDetailsPanel({ chat, onVoltar, onRegistrarLead, onCriarNegocio }: ChatDetailsPanelProps) {
  const [dialogOpen, setDialogOpen] = useState<"lead" | "negocio" | null>(null);
  const [negocioAtual, setNegocioAtual] = useState<{ id: string; titulo: string; status: string } | null>(null);
  const nome = obterNomeChat(chat);
  const origemLead = obterMetaOrigemLead(chat.leadMatch?.origem);

  useEffect(() => {
    let ativo = true;

    async function carregarNegocio() {
      if (!chat.leadMatch?.id) {
        setNegocioAtual(null);
        return;
      }

      const res = await fetch(`/api/leads/${chat.leadMatch.id}`, { cache: "no-store" });
      if (!res.ok) {
        if (ativo) setNegocioAtual(null);
        return;
      }

      const json = await res.json().catch(() => null);
      const negocio = json?.lead?.negocio;
      if (!ativo) return;

      setNegocioAtual(
        negocio
          ? {
              id: negocio.id,
              titulo: negocio.titulo,
              status: negocio.status,
            }
          : null,
      );
    }

    void carregarNegocio();

    return () => {
      ativo = false;
    };
  }, [chat.leadMatch?.id]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--surface)]">
      <div className="border-b border-[var(--border-subtle)] px-4 py-4">
        <div className="flex items-start gap-3">
          {onVoltar ? (
            <button type="button" onClick={onVoltar} className="rounded-lg p-1.5 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] md:hidden">
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.08)]">
            <span className="text-sm font-medium text-emerald-400">{nome.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{nome}</p>
              <Badge variant="success" size="sm" dot>{chat.semMatch ? "Sem lead" : "Lead vinculado"}</Badge>
              {origemLead ? <Badge variant={origemLead.variant} size="sm" dot>{origemLead.label}</Badge> : null}
              <Badge variant="secondary" size="sm">{chat.instanceName}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />{formatarTelefoneChat(chat.telefone)}</span>
              {!chat.semMatch && chat.leadMatch?.nome_funcionario ? <span className="inline-flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />{chat.leadMatch.nome_funcionario}</span> : null}
              {!chat.semMatch && chat.leadMatch?.nome_pdv ? <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />{chat.leadMatch.nome_pdv}</span> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid shrink-0 grid-cols-1 gap-3 border-b border-[var(--border-subtle)] px-4 py-3 xl:grid-cols-2">
        <InfoCard icon={<Layers3 className="h-4 w-4" />} label="Estágio" value={chat.leadMatch?.nome_estagio ?? "Sem estágio"} description="Fase atual da conversa no funil" />
        <InfoCard icon={<UserRound className="h-4 w-4" />} label="Responsável" value={chat.leadMatch?.nome_funcionario ?? "Não atribuído"} description="Colaborador vinculado ao lead" />
        <InfoCard icon={<Building2 className="h-4 w-4" />} label="PDV" value={chat.leadMatch?.nome_pdv ?? "Sem PDV"} description={chat.leadMatch?.empresa_origem ?? "Operação atual do lead"} />
        <InfoCard icon={<Megaphone className="h-4 w-4" />} label="Origem" value={origemLead?.label ?? "Não informada"} description={chat.leadMatch?.fonte ?? "Sem fonte complementar"} />
        <InfoCard
          icon={<GitBranch className="h-4 w-4" />}
          label="Negócio"
          value={negocioAtual?.titulo ?? (chat.leadMatch?.id_negocio ? "Vinculado" : "Nenhum")}
          description={negocioAtual ? `${negocioAtual.status} · ${negocioAtual.id}` : chat.leadMatch?.id_negocio ?? "Este contato ainda não tem negócio"}
        />
      </div>

      <div className="mt-auto flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--border-subtle)] px-4 py-3">
        {chat.semMatch ? (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setDialogOpen("lead")}>
            <UserPlus className="h-4 w-4" />
            Registrar como Lead
          </Button>
        ) : null}
        <Button size="sm" className="gap-2" onClick={() => setDialogOpen("negocio")}>
          <Briefcase className="h-4 w-4" />
          Criar negócio
        </Button>
      </div>

      <OrphanDialog open={dialogOpen === "lead"} onOpenChange={(open) => !open && setDialogOpen(null)} title="Registrar como Lead" description="Cadastrar este contato como um novo lead no CRM." telefone={chat.telefone} nomeInicial={chat.pushName && chat.pushName !== "Você" ? chat.pushName : ""} onSubmit={(params) => { void onRegistrarLead(params); setDialogOpen(null); }} />
      <OrphanDialog open={dialogOpen === "negocio"} onOpenChange={(open) => !open && setDialogOpen(null)} title="Criar negócio" description="Cadastrar o contato e abrir um negócio a partir desta conversa." telefone={chat.telefone} nomeInicial={chat.pushName && chat.pushName !== "Você" ? chat.pushName : ""} onSubmit={(params) => { void onCriarNegocio(params); setDialogOpen(null); }} />
    </div>
  );
}

type InfoCardProps = { icon: ReactNode; label: string; value: string; description: string };
function InfoCard({ icon, label, value, description }: InfoCardProps) {
  return <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] p-3"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]"><span className="text-[var(--brand)]">{icon}</span>{label}</div><div className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">{value}</div><div className="mt-1 truncate text-[11px] text-[var(--text-secondary)]">{description}</div></div>;
}

type OrphanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  telefone: string;
  nomeInicial: string;
  onSubmit: (params: { telefone: string; nome?: string; id_pdv?: string; id_funcionario?: string; id_estagio?: string }) => void;
};

function OrphanDialog({ open, onOpenChange, title, description, telefone, nomeInicial, onSubmit }: OrphanDialogProps) {
  const [nome, setNome] = useState(nomeInicial);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div><label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Telefone</label><input type="text" value={formatarTelefoneChat(telefone)} disabled className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-tertiary)]" /></div><div><label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome (opcional)</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-primary)]" /></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={() => onSubmit({ telefone, nome: nome || undefined })}>Confirmar</Button></DialogFooter></DialogContent></Dialog>;
}
