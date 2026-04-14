import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChatUnificado } from "../types";
import type { FollowUpConversa, FollowUpTemplate } from "@/lib/api/chat-follow-up";

type ChatFollowUpCardProps = {
  chat: ChatUnificado;
  followUp: FollowUpConversa | null;
  templates: FollowUpTemplate[];
  templateSelecionadoEfetivo: string;
  salvandoFollowUp: boolean;
  carregandoFollowUp: boolean;
  atualizadoHa: string;
  statusUi: { variant: "success" | "secondary"; label: string };
  tempoAteProximoDisparo: string | null;
  possuiTemplatesAtivos: boolean;
  podeAtivarFollowUp: boolean;
  onTemplateSelecionadoChange: (value: string) => void;
  onAtualizarContexto: () => void;
  onAtivarCadencia: () => void;
  onPausar: () => void;
  onRetomar: () => void;
  onEncerrar: () => void;
  onReativar: () => void;
};

export function ChatFollowUpCard({
  chat,
  followUp,
  templates,
  templateSelecionadoEfetivo,
  salvandoFollowUp,
  carregandoFollowUp,
  atualizadoHa,
  statusUi,
  tempoAteProximoDisparo,
  possuiTemplatesAtivos,
  podeAtivarFollowUp,
  onTemplateSelecionadoChange,
  onAtualizarContexto,
  onAtivarCadencia,
  onPausar,
  onRetomar,
  onEncerrar,
  onReativar,
}: ChatFollowUpCardProps) {
  if (!chat.leadMatch || chat.canal !== "whatsapp") {
    return null;
  }

  return (
    <div className="mt-4 rounded-[20px] border border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Follow-up automatico</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">Cadencia por conversa</p>
          <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">Atualizado ha {atualizadoHa}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={carregandoFollowUp}
            onClick={onAtualizarContexto}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregandoFollowUp ? "animate-spin" : ""}`} />
          </Button>
          <Badge variant={statusUi.variant} size="sm" dot>
            {statusUi.label}
          </Badge>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-[12px] text-[var(--text-secondary)]">
        {followUp ? (
          <>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
              <span>Cadencia</span>
              <span className="truncate font-medium text-[var(--text-primary)]">{followUp.template.nome}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
              <span>Etapa atual</span>
              <span className="font-medium text-[var(--text-primary)]">Mensagem {Math.max(1, followUp.etapaAtual)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
              <span>Ciclo</span>
              <span className="font-medium text-[var(--text-primary)]">{followUp.cicloAtual}</span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
              <span>Proximo disparo</span>
              <span className="text-right font-medium text-[var(--text-primary)]">
                {followUp.proximoDisparoEm ? new Date(followUp.proximoDisparoEm).toLocaleString("pt-BR") : "Sem agendamento"}
                {tempoAteProximoDisparo ? <span className="block text-[10px] text-[var(--text-secondary)]">{tempoAteProximoDisparo}</span> : null}
              </span>
            </div>
            {followUp.ultimaRespostaEm ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                <span>Ultima resposta</span>
                <span className="font-medium text-[var(--text-primary)]">{new Date(followUp.ultimaRespostaEm).toLocaleString("pt-BR")}</span>
              </div>
            ) : null}
            {followUp.status === "PAUSADO" && followUp.motivoPausa ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                <span>Motivo</span>
                <span className="font-medium text-[var(--text-primary)]">{followUp.motivoPausa}</span>
              </div>
            ) : null}
            {followUp.status === "ENCERRADO" && followUp.motivoEncerramento ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] px-3 py-2">
                <span>Motivo</span>
                <span className="font-medium text-[var(--text-primary)]">{followUp.motivoEncerramento}</span>
              </div>
            ) : null}
            {followUp.status === "ENCERRADO" ? (
              <div className="rounded-xl border border-[color:rgba(16,185,129,0.24)] bg-[color:rgba(16,185,129,0.1)] px-3 py-2 text-[11px] text-[var(--text-primary)]">
                {followUp.motivoEncerramento === "Cliente respondeu"
                  ? "Follow-up encerrado automaticamente: o lead respondeu e os proximos disparos foram cancelados."
                  : `Follow-up encerrado: ${followUp.motivoEncerramento ?? "Fluxo concluido."}`}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <Select value={templateSelecionadoEfetivo} onValueChange={onTemplateSelecionadoChange}>
              <SelectTrigger disabled={salvandoFollowUp || carregandoFollowUp}>
                <SelectValue placeholder="Selecione uma cadencia" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!possuiTemplatesAtivos ? (
              <div className="rounded-xl border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.1)] px-3 py-2 text-[11px] text-[var(--text-primary)]">
                Nenhuma cadencia ativa encontrada. Crie/ative uma cadencia em Configuracoes para habilitar o follow-up automatico.
              </div>
            ) : null}
            <Button
              type="button"
              size="sm"
              disabled={!templateSelecionadoEfetivo || salvandoFollowUp || !podeAtivarFollowUp}
              onClick={onAtivarCadencia}
            >
              {salvandoFollowUp ? "Ativando..." : "Ativar cadencia"}
            </Button>
          </>
        )}
      </div>

      {followUp ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {followUp.status === "ATIVO" ? (
            <Button variant="outline" size="sm" disabled={salvandoFollowUp || carregandoFollowUp} onClick={onPausar}>
              Pausar
            </Button>
          ) : null}
          {followUp.status === "PAUSADO" ? (
            <Button variant="outline" size="sm" disabled={salvandoFollowUp || carregandoFollowUp} onClick={onRetomar}>
              Retomar
            </Button>
          ) : null}
          {followUp.status !== "ENCERRADO" ? (
            <Button variant="ghost" size="sm" disabled={salvandoFollowUp || carregandoFollowUp} onClick={onEncerrar}>
              Encerrar
            </Button>
          ) : null}
          {followUp.status === "ENCERRADO" ? (
            <Button
              variant="outline"
              size="sm"
              disabled={salvandoFollowUp || carregandoFollowUp || !chat.leadMatch}
              onClick={onReativar}
            >
              Reativar cadencia
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
