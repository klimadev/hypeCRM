"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Layers3,
  Megaphone,
  MessageCircle,
  Phone,
  UserPlus,
  UserRound,
  PanelRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ChatMessagesPanel } from "./chat-messages-panel";
import type { ChatUnificado } from "../types";
import { formatarTelefoneChat, obterMetaOrigemLead, obterNomeChat } from "../helpers";

type ChatPanelProps = {
  chat: ChatUnificado;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  onVoltar?: () => void;
  onRegistrarLead: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
  }) => Promise<void>;
  onCriarNegocio: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
    id_estagio?: string;
  }) => Promise<void>;
  onTransferirLead: (params: { idLead: string; idFuncionario: string }) => Promise<void>;
};

export function ChatPanel({
  chat,
  perfil,
  onVoltar,
  onRegistrarLead,
  onCriarNegocio,
  onTransferirLead,
}: ChatPanelProps) {
  const [dialogOpen, setDialogOpen] = useState<"lead" | "negocio" | null>(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [transferirAberto, setTransferirAberto] = useState(false);

  const nome = obterNomeChat(chat);
  const origemLead = obterMetaOrigemLead(chat.leadMatch?.origem);
  const telefone = formatarTelefoneChat(chat.telefone);
  const statusPrincipal = chat.semMatch ? "Novo contato" : chat.leadMatch?.nome_estagio ?? "Lead vinculado";
  const canalLabel = chat.canal === "instagram" ? "Instagram" : "WhatsApp";

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col bg-[var(--surface)]">
        <header className="shrink-0 border-b border-[var(--border-subtle)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)] px-3 py-2.5 md:px-4">
          <div className="flex flex-wrap items-start gap-2.5 lg:items-center">
            {onVoltar ? (
              <button
                type="button"
                onClick={onVoltar}
                className="rounded-xl p-2 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)] md:hidden"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
              {chat.semMatch ? <MessageCircle className="h-4 w-4" /> : nome.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)] md:text-[15px]">{nome}</p>
                <Badge variant={chat.semMatch ? "secondary" : "success"} size="sm" dot>
                  {chat.semMatch ? "Novo" : "CRM"}
                </Badge>
                <Badge variant="secondary" size="sm">{canalLabel}</Badge>
                {origemLead ? (
                  <Badge variant={origemLead.variant} size="sm" className="hidden sm:inline-flex" dot>
                    {origemLead.label}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-[var(--text-tertiary)]" />
                  {telefone}
                </span>
                <span className="truncate">{statusPrincipal}</span>
                {chat.unreadCount > 0 ? <span>{chat.unreadCount} não lida(s)</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {chat.semMatch ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]"
                  onClick={() => setDialogOpen("lead")}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Registrar lead</span>
                </Button>
              ) : null}
              <Button size="sm" className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]" onClick={() => setDialogOpen("negocio")}>
                <Briefcase className="h-4 w-4" />
                <span>Criar negócio</span>
              </Button>
              {chat.leadMatch ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 min-h-9 gap-1.5 rounded-xl px-3 text-[11px]"
                  onClick={() => setTransferirAberto(true)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Transferir</span>
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-9 min-h-9 gap-1.5 rounded-xl px-2.5 text-[11px]"
                onClick={() => setDetalhesAbertos(true)}
              >
                <PanelRight className="h-4 w-4" />
                <span className="hidden sm:inline">Detalhes</span>
              </Button>
            </div>
          </div>
        </header>

        <ChatMessagesPanel
          instanceName={chat.instanceName}
          remoteJid={chat.remoteJid}
          chatContext={{
            telefone: chat.telefone,
            pushName: chat.pushName,
            canal: chat.canal,
            leadMatch: chat.leadMatch,
          }}
        />
      </div>

      <Sheet open={detalhesAbertos} onOpenChange={setDetalhesAbertos}>
        <SheetContent side="right" className="w-full max-w-[26rem] bg-[linear-gradient(180deg,rgba(17,17,19,0.98),rgba(12,12,14,0.98))] p-0">
          <SheetHeader className="gap-2 px-4 py-4">
            <SheetTitle>Detalhes da conversa</SheetTitle>
            <SheetDescription>
              Contexto do contato sem roubar espaço da leitura do feed.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
            <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[color:rgba(139,92,246,0.24)] bg-[var(--brand-soft)] text-sm font-semibold text-[var(--brand)]">
                  {chat.semMatch ? <MessageCircle className="h-4 w-4" /> : nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{nome}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={chat.semMatch ? "secondary" : "success"} size="sm" dot>
                      {chat.semMatch ? "Sem lead" : "Lead vinculado"}
                    </Badge>
                    {origemLead ? (
                      <Badge variant={origemLead.variant} size="sm" dot>
                        {origemLead.label}
                      </Badge>
                    ) : null}
                    <Badge variant="secondary" size="sm">{chat.instanceName}</Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-[12px] text-[var(--text-secondary)]">
                <div className="inline-flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  {telefone}
                </div>
                {chat.leadMatch?.nome_funcionario ? (
                  <div className="inline-flex items-center gap-2">
                    <UserRound className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    {chat.leadMatch.nome_funcionario}
                  </div>
                ) : null}
                {chat.leadMatch?.nome_pdv ? (
                  <div className="inline-flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                    {chat.leadMatch.nome_pdv}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <InfoCard icon={<Layers3 className="h-4 w-4" />} label="Estágio" value={chat.leadMatch?.nome_estagio ?? "Sem estágio"} description="Fase operacional atual" />
              <InfoCard icon={<UserRound className="h-4 w-4" />} label="Responsável" value={chat.leadMatch?.nome_funcionario ?? "Não atribuído"} description="Pessoa que conduz o lead" />
              <InfoCard icon={<Building2 className="h-4 w-4" />} label="PDV" value={chat.leadMatch?.nome_pdv ?? "Sem PDV"} description={chat.leadMatch?.empresa_origem ?? "Origem operacional do lead"} />
              <InfoCard icon={<Megaphone className="h-4 w-4" />} label="Origem" value={origemLead?.label ?? "Não informada"} description={chat.leadMatch?.fonte ?? "Sem fonte complementar"} />
              <InfoCard
                icon={<Briefcase className="h-4 w-4" />}
                label="Negócio"
                value={chat.leadMatch?.negocio?.titulo ?? (chat.leadMatch?.id_negocio ? "Vinculado" : "Nenhum")}
                description={
                  chat.leadMatch?.negocio
                    ? `${chat.leadMatch.negocio.status} · ${chat.leadMatch.negocio.id}`
                    : chat.leadMatch?.id_negocio ?? "Ainda sem negócio associado"
                }
              />
            </div>

            {chat.leadMatch ? (
              <div className="mt-4 rounded-[20px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Contexto operacional</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">O chat já nasce com dono e estágio</p>
                  </div>
                  <Badge variant={chat.leadMatch.id_funcionario ? "success" : "secondary"} size="sm" dot>
                    {chat.leadMatch.id_funcionario ? "Atribuído" : "Sem dono"}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-[12px] text-[var(--text-secondary)]">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                    <span>Dono</span>
                    <span className="truncate font-medium text-[var(--text-primary)]">{chat.leadMatch.nome_funcionario ?? "Não atribuído"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                    <span>PDV</span>
                    <span className="truncate font-medium text-[var(--text-primary)]">{chat.leadMatch.nome_pdv ?? "Sem PDV"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                    <span>Lead</span>
                    <span className="truncate font-medium text-[var(--text-primary)]">{chat.leadMatch.nome}</span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <OrphanDialog
        key={`lead-${chat.instanceName}-${chat.remoteJid}`}
        open={dialogOpen === "lead"}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(null);
        }}
        title="Registrar como Lead"
        description="Cadastrar este contato como um novo lead no CRM."
        telefone={chat.telefone}
        nomeInicial={chat.pushName && chat.pushName !== "Você" ? chat.pushName : ""}
        perfil={perfil}
        onSubmit={(params) => {
          void onRegistrarLead(params);
          setDialogOpen(null);
        }}
      />

      <OrphanDialog
        key={`negocio-${chat.instanceName}-${chat.remoteJid}`}
        open={dialogOpen === "negocio"}
        onOpenChange={(open) => {
          if (!open) setDialogOpen(null);
        }}
        title="Criar negócio"
        description="Cadastrar o contato e abrir um negócio a partir desta conversa."
        telefone={chat.telefone}
        nomeInicial={chat.pushName && chat.pushName !== "Você" ? chat.pushName : ""}
        perfil={perfil}
        onSubmit={(params) => {
          void onCriarNegocio(params);
          setDialogOpen(null);
        }}
      />

      <TransferLeadDialog
        open={transferirAberto}
        onOpenChange={setTransferirAberto}
        leadId={chat.leadMatch?.id ?? null}
        leadAtual={chat.leadMatch?.nome_funcionario ?? null}
        onSubmit={onTransferirLead}
      />
    </>
  );
}

type FuncionarioItem = {
  id: string;
  nome: string;
};

function TransferLeadDialog({
  open,
  onOpenChange,
  leadId,
  leadAtual,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  leadAtual: string | null;
  onSubmit: (params: { idLead: string; idFuncionario: string }) => Promise<void>;
}) {
  const [funcionarios, setFuncionarios] = useState<FuncionarioItem[]>([]);
  const [idFuncionario, setIdFuncionario] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;

    let ativo = true;
    setCarregando(true);
    fetch("/api/leads", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!ativo) return;
        setFuncionarios(Array.isArray(json?.funcionarios) ? json.funcionarios : []);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIdFuncionario("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir responsabilidade</DialogTitle>
          <DialogDescription>
            Reatribua o lead para outro colaborador sem sair do chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Atual</div>
            <div className="mt-1 font-medium text-[var(--text-primary)]">{leadAtual ?? "Sem responsável"}</div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Novo responsável</label>
            <Select value={idFuncionario} onValueChange={setIdFuncionario} disabled={carregando || salvando}>
              <SelectTrigger>
                <SelectValue placeholder={carregando ? "Carregando colaboradores..." : "Selecione um colaborador"} />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            disabled={!leadId || !idFuncionario || salvando}
            onClick={async () => {
              if (!leadId || !idFuncionario) return;
              setSalvando(true);
              try {
                await onSubmit({ idLead: leadId, idFuncionario });
                onOpenChange(false);
              } finally {
                setSalvando(false);
              }
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type InfoCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
};

function InfoCard({ icon, label, value, description }: InfoCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-3">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">
        <span className="text-[var(--brand)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-[11px] text-[var(--text-secondary)]">{description}</div>
    </div>
  );
}

type OrphanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  telefone: string;
  nomeInicial: string;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  onSubmit: (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
    id_estagio?: string;
  }) => void;
};

function OrphanDialog({
  open,
  onOpenChange,
  title,
  description,
  telefone,
  nomeInicial,
  perfil,
  onSubmit,
}: OrphanDialogProps) {
  const [nome, setNome] = useState(nomeInicial);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Telefone</label>
            <input
              type="text"
              value={formatarTelefoneChat(telefone)}
              disabled
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] px-3 text-sm text-[var(--text-tertiary)]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nome (opcional)</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome do contato"
              className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <p className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 text-xs text-[var(--text-secondary)]">
            {perfil === "COLABORADOR"
              ? "O lead será vinculado automaticamente a você."
              : perfil === "GERENTE"
                ? "O responsável será escolhido dentro do seu PDV após o cadastro."
                : "Você poderá complementar PDV e responsável na próxima etapa."}
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSubmit({
                telefone,
                nome: nome.trim() || undefined,
              })
            }
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
