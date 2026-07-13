"use client";

import Link from "next/link";
import type React from "react";
import { ArrowUpRight, BriefcaseBusiness, Clock3, Link2, Loader2, Mail, MessageCircle, Pencil, Phone, Tags, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formataMoeda } from "@/lib/utils";
import type { ApiLeadContato, LeadInformacoesApi } from "@/lib/api/leads";
import { formatarDataLead, rotuloOrigemLead } from "../utils";

type LeadInfoPanelProps = {
  open: boolean;
  leadBase: ApiLeadContato | null;
  informacoes: LeadInformacoesApi | null;
  carregando: boolean;
  erro: string | null;
  onOpenChange: (open: boolean) => void;
  onEditar: (lead: ApiLeadContato) => void;
  onVincular: (lead: ApiLeadContato) => void;
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.035)] p-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.04)] px-3 text-xs font-medium text-[var(--text-secondary)]">
      <Tags className="h-3.5 w-3.5 text-[var(--brand)]" />
      {children}
    </span>
  );
}

export function LeadInfoPanel({ open, leadBase, informacoes, carregando, erro, onOpenChange, onEditar, onVincular }: LeadInfoPanelProps) {
  const lead = informacoes?.lead ?? leadBase;
  const negocios = informacoes?.negocios ?? [];
  const resumo = informacoes?.resumo;
  const telefoneNumerico = lead?.telefone?.replace(/\D/g, "") ?? "";
  const tagsOperacionais = Array.from(new Set(
    [lead?.fonte, lead ? rotuloOrigemLead(lead.origem) : null, negocios[0]?.funil?.nome, negocios.length === 0 ? "Sem negócio" : null]
      .filter((tag): tag is string => Boolean(tag && tag !== "—")),
  ));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="z-[60] w-full max-w-[980px] overflow-hidden border-l border-[color:rgba(255,255,255,0.12)] bg-[color:#101010] shadow-[0_24px_90px_rgba(0,0,0,0.72)] backdrop-blur-xl" side="right">
        <SheetHeader className="sticky top-0 z-10 space-y-4 border-b border-[var(--border-subtle)] bg-[color:rgba(16,16,16,0.96)] p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <SheetTitle className="flex items-center gap-2 text-2xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.04)]">
                  <UserRound className="h-5 w-5 text-[var(--brand)]" />
                </span>
                <span className="truncate">{lead?.nome ?? "Informações do lead"}</span>
              </SheetTitle>
              <SheetDescription className="mt-2">Cadastro, negócios, valores, histórico e próximos passos em uma visão operacional.</SheetDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {telefoneNumerico ? (
                <Button asChild size="sm" className="rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
                  <a href={`https://wa.me/${telefoneNumerico}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => lead && onEditar(lead)} disabled={!lead}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => lead && onVincular(lead)} disabled={!lead}>
                <Link2 className="mr-2 h-4 w-4" />
                {negocios.length > 0 ? "Gerenciar negócios" : "Criar negócio"}
              </Button>
            </div>
          </div>
          {lead ? (
            <div className="flex flex-wrap gap-2">
              {tagsOperacionais.length > 0 ? tagsOperacionais.map((tag) => <TagChip key={tag}>{tag}</TagChip>) : <TagChip>Sem tags</TagChip>}
            </div>
          ) : null}
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 pb-8">
          {carregando ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--text-secondary)]" />
            </div>
          ) : erro ? (
            <div className="rounded-2xl border border-[color:rgba(248,113,113,0.35)] bg-[color:rgba(248,113,113,0.08)] p-4 text-sm text-[var(--danger)]">{erro}</div>
          ) : lead ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <InfoCard label="Negócios" value={`${resumo?.negociosTotal ?? negocios.length}`} />
                <InfoCard label="Valor estimado" value={formataMoeda(resumo?.valorEstimadoTotal ?? lead.valor_oportunidade ?? 0)} />
                <InfoCard label="Valor fechado" value={formataMoeda(resumo?.valorFechadoTotal ?? 0)} />
                <InfoCard label="Interações" value={`${resumo?.interacoesTotal ?? informacoes?.interacoes.length ?? 0}`} />
              </div>

              <section className="rounded-3xl border border-[color:rgba(124,58,237,0.22)] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.18),rgba(255,255,255,0.025)_42%,transparent_72%)] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <MessageCircle className="h-4 w-4 text-[var(--brand)]" />
                  Próxima ação
                </div>
                <div className="flex flex-wrap gap-2">
                  {telefoneNumerico ? (
                    <Button asChild size="sm" className="rounded-full bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
                      <a href={`https://wa.me/${telefoneNumerico}`} target="_blank" rel="noreferrer">Enviar WhatsApp</a>
                    </Button>
                  ) : null}
                  {telefoneNumerico ? (
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <a href={`tel:${telefoneNumerico}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Ligar
                      </a>
                    </Button>
                  ) : null}
                  {lead.email ? (
                    <Button asChild variant="outline" size="sm" className="rounded-full">
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        E-mail
                      </a>
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => onVincular(lead)}>
                    <BriefcaseBusiness className="mr-2 h-4 w-4" />
                    {negocios.length > 0 ? "Novo negócio" : "Criar negócio"}
                  </Button>
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <UserRound className="h-4 w-4 text-[var(--brand)]" />
                  Identificação
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard label="Telefone" value={lead.telefone || "-"} />
                  <InfoCard label="E-mail" value={lead.email || "-"} />
                  <InfoCard label="Origem" value={rotuloOrigemLead(lead.origem)} />
                  <InfoCard label="Fonte" value={lead.fonte || "-"} />
                  <InfoCard label="Empresa origem" value={lead.empresa_origem || "-"} />
                  <InfoCard label="Atualizado" value={formatarDataLead(lead.atualizado_em)} />
                </div>
                {lead.observacoes ? <p className="mt-4 rounded-2xl bg-[color:rgba(255,255,255,0.03)] p-3 text-sm leading-6 text-[var(--text-secondary)]">{lead.observacoes}</p> : null}
              </section>

              <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <BriefcaseBusiness className="h-4 w-4 text-[var(--info)]" />
                  Negócios associados
                </div>
                <div className="space-y-3">
                  {negocios.length > 0 ? negocios.map((negocio) => (
                    <div key={negocio.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{negocio.titulo}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{negocio.funil?.nome ?? "Funil"} • {negocio.estagio?.nome ?? "Etapa"} • {negocio.status}</p>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="h-8 rounded-full text-[var(--info)]">
                          <Link href={`/kanban?negocio=${negocio.id}`}>
                            Ver negócio
                            <ArrowUpRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <InfoCard label="Estimado" value={formataMoeda(negocio.valor_estimado)} />
                        <InfoCard label="Fechado" value={formataMoeda(negocio.valor_fechado ?? 0)} />
                        <InfoCard label="Responsável" value={negocio.funcionario?.nome ?? "-"} />
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.025)] p-4">
                      <p className="text-sm font-medium text-[var(--text-primary)]">Lead ainda sem negócio.</p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">Isso é um estado válido. Crie uma oportunidade escolhendo o pipeline correto quando houver intenção comercial.</p>
                      <Button variant="outline" size="sm" className="mt-3 rounded-full" onClick={() => onVincular(lead)}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Criar ou vincular negócio
                      </Button>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <Clock3 className="h-4 w-4 text-[var(--warning)]" />
                  Histórico recente
                </div>
                <div className="space-y-2">
                  {informacoes?.interacoes.length ? informacoes.interacoes.map((interacao) => (
                    <div key={`${interacao.tipo}-${interacao.id}`} className="rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-3">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{interacao.titulo}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{interacao.descricao}</p>
                      <p className="mt-2 text-xs text-[var(--text-tertiary)]">{formatarDataLead(interacao.data)} • {interacao.origem} • {interacao.status}</p>
                    </div>
                  )) : <p className="text-sm text-[var(--text-secondary)]">Sem interações recentes registradas para este lead.</p>}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
