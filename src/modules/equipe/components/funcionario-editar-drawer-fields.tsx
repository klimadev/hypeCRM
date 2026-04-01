import type { ReactElement, ReactNode } from "react";
import { AlertCircle, Briefcase, HelpCircle, Mail, MapPin, Shield, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import type { DadosEdicao, ErrosEdicao, Pdv } from "../types";

function CampoLabel({ icone, children, tooltip }: { icone: React.ElementType; children: ReactNode; tooltip: string }) {
  const Icone = icone;

  return (
    <Tooltip content={tooltip} side="right">
      <label className="flex cursor-help items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
        <Icone className="h-4 w-4 text-[var(--text-tertiary)]" />
        {children}
        <HelpCircle className="h-3.5 w-3.5 text-[var(--text-disabled)] transition-colors hover:text-[var(--text-tertiary)]" />
      </label>
    </Tooltip>
  );
}

function CampoErro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) {
    return null;
  }

  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--danger)]">
      <AlertCircle className="h-4 w-4" />
      {mensagem}
    </p>
  );
}

function ClasseCampo(erro?: string) {
  return [
    "h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-base font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]",
    erro ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : "",
  ].join(" ");
}

type FuncionarioEditarDrawerFieldsProps = {
  dados: DadosEdicao | null;
  erros: ErrosEdicao;
  pdvs: Pdv[];
  onMudar: (campo: keyof DadosEdicao, valor: string) => void;
};

export function FuncionarioEditarDrawerDadosTab({ dados, erros, onMudar }: Omit<FuncionarioEditarDrawerFieldsProps, "pdvs">) {
  return (
    <div className="mt-6 space-y-5">
      <div className="space-y-2">
        <CampoLabel icone={User} tooltip="Nome completo conforme documento de identidade">
          Nome completo *
        </CampoLabel>
        <Input value={dados?.nome ?? ""} onChange={(e) => onMudar("nome", e.target.value)} placeholder="Ex: Maria da Silva Santos" className={ClasseCampo(erros.nome)} />
        <CampoErro mensagem={erros.nome} />
      </div>

      <div className="space-y-2">
        <CampoLabel icone={Mail} tooltip="E-mail corporativo usado para login e notificações do sistema">
          E-mail corporativo *
        </CampoLabel>
        <Input type="email" value={dados?.email ?? ""} onChange={(e) => onMudar("email", e.target.value)} placeholder="Ex: maria.silva@hypecrm.com.br" className={ClasseCampo(erros.email)} />
        <CampoErro mensagem={erros.email} />
        <p className="flex items-center gap-1 text-xs text-[var(--text-disabled)]">
          <HelpCircle className="h-3 w-3" />
          Usado para login e envio de notificações importantes
        </p>
      </div>
    </div>
  );
}

export function FuncionarioEditarDrawerTrabalhoTab({ dados, erros, pdvs, onMudar }: FuncionarioEditarDrawerFieldsProps) {
  return (
    <div className="mt-6 space-y-5">
      <div className="space-y-2">
        <CampoLabel icone={Shield} tooltip="Nível de acesso e permissões do colaborador no sistema">
          Cargo / Função *
        </CampoLabel>
        <Select value={dados?.cargo ?? ""} onValueChange={(valor) => onMudar("cargo", valor)}>
          <SelectTrigger className={ClasseCampo(erros.cargo)}>
            <SelectValue placeholder="Selecione o cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="COLABORADOR">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--success)]" />
                Colaborador
              </div>
            </SelectItem>
            <SelectItem value="GERENTE">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--warning)]" />
                Gerente
              </div>
            </SelectItem>
            <SelectItem value="ADMINISTRADOR">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[var(--brand)]" />
                Administrador
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <CampoErro mensagem={erros.cargo} />
        <p className="flex items-center gap-1 text-xs text-[var(--text-disabled)]">
          <HelpCircle className="h-3 w-3" />
          Define o nível de acesso e permissões no sistema
        </p>
      </div>

      <div className="space-y-2">
        <CampoLabel icone={MapPin} tooltip="PDV (Ponto de Venda) onde o colaborador irá trabalhar">
          PDV / Local de trabalho *
        </CampoLabel>
        <Select value={dados?.id_pdv ?? ""} onValueChange={(valor) => onMudar("id_pdv", valor)}>
          <SelectTrigger className={ClasseCampo(erros.id_pdv)}>
            <SelectValue placeholder="Selecione o PDV" />
          </SelectTrigger>
          <SelectContent>
            {pdvs.map((pdv) => (
              <SelectItem key={pdv.id} value={pdv.id}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  {pdv.nome}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <CampoErro mensagem={erros.id_pdv} />
        <p className="flex items-center gap-1 text-xs text-[var(--text-disabled)]">
          <HelpCircle className="h-3 w-3" />
          Ponto de venda onde o colaborador irá operar
        </p>
      </div>
    </div>
  );
}

export function FuncionarioEditarDrawerAcessoTab(props: {
  onResetarSenha: () => void;
  onVerHistorico: () => void;
  onInativar: () => void;
}): ReactElement {
  const { onResetarSenha, onVerHistorico, onInativar } = props;

  return (
    <div className="mt-6 space-y-5">
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:rgba(255,255,255,0.06)]">
            <Briefcase className="h-5 w-5 text-[var(--text-secondary)]" />
          </div>
          <div>
            <h4 className="font-semibold text-[var(--text-primary)]">Configurações de Acesso</h4>
            <p className="text-sm text-[var(--text-secondary)]">Gerencie senhas e permissões</p>
          </div>
        </div>

        <div className="space-y-3">
          <button type="button" className="flex h-11 w-full items-center justify-start gap-3 rounded-xl border border-[var(--border-subtle)] px-3 text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]" onClick={onResetarSenha}>
            <Shield className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="flex-1 text-left">Redefinir senha</span>
            <span className="text-xs text-[var(--text-disabled)]">Enviar link por e-mail</span>
          </button>

          <button type="button" className="flex h-11 w-full items-center justify-start gap-3 rounded-xl border border-[var(--border-subtle)] px-3 text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]" onClick={onVerHistorico}>
            <Briefcase className="h-4 w-4 text-[var(--text-tertiary)]" />
            <span className="flex-1 text-left">Ver histórico de alterações</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:rgba(244,63,94,0.16)] bg-[color:rgba(244,63,94,0.08)] p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[var(--danger)]" />
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">Zona de Perigo</h4>
        </div>
        <button type="button" className="flex h-10 w-full items-center justify-start gap-2 rounded-lg border border-[color:rgba(244,63,94,0.24)] px-3 text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.12)] hover:border-[color:rgba(244,63,94,0.4)]" onClick={onInativar}>
          <AlertCircle className="h-4 w-4" />
          <span className="flex-1 text-left">Inativar colaborador</span>
        </button>
        <p className="mt-2 text-xs text-[var(--text-secondary)]">O colaborador não conseguirá mais acessar o sistema</p>
      </div>
    </div>
  );
}
