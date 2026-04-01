import { AlertCircle, History, Key, Loader2, MoreHorizontal, Save, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";

type FuncionarioEditarDrawerFooterProps = {
  salvando: boolean;
  mostrarMenuAcoes: boolean;
  onToggleMenu: () => void;
  onSalvar: () => void;
  onVerHistorico: () => void;
  onResetarSenha: () => void;
  onInativar: () => void;
  mensagemErro?: string;
};

export function FuncionarioEditarDrawerFooter({
  salvando,
  mostrarMenuAcoes,
  onToggleMenu,
  onSalvar,
  onVerHistorico,
  onResetarSenha,
  onInativar,
  mensagemErro,
}: FuncionarioEditarDrawerFooterProps) {
  return (
    <>
      {mensagemErro ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-[color:rgba(244,63,94,0.2)] bg-[color:rgba(244,63,94,0.08)] p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" />
          <div>
            <p className="font-medium text-[var(--text-primary)]">Erro ao salvar</p>
            <p className="text-sm text-[var(--text-secondary)]">{mensagemErro}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-row gap-3 border-t border-[var(--border-subtle)] pt-4">
        <div className="relative flex-1">
          <Button
            variant="outline"
            className="h-12 w-full gap-2 rounded-xl border-[var(--border-subtle)] font-medium text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
            onClick={onToggleMenu}
            disabled={salvando}
          >
            <MoreHorizontal className="h-4 w-4" />
            Mais ações
          </Button>

          {mostrarMenuAcoes ? (
            <div className="absolute bottom-full left-0 right-0 z-10 mb-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] py-2 shadow-lg">
              <button type="button" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]" onClick={onVerHistorico}>
                <History className="h-4 w-4 text-[var(--text-tertiary)]" />
                Ver histórico
              </button>
              <button type="button" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]" onClick={onResetarSenha}>
                <Key className="h-4 w-4 text-[var(--text-tertiary)]" />
                Redefinir senha
              </button>
              <hr className="my-2 border-[var(--border-subtle)]" />
              <button type="button" className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.08)]" onClick={onInativar}>
                <UserMinus className="h-4 w-4" />
                Inativar colaborador
              </button>
            </div>
          ) : null}
        </div>

        <Button className="min-w-[140px] h-12 gap-2 rounded-xl bg-[var(--brand)] text-white shadow-lg shadow-[var(--brand)]/20 hover:bg-[var(--brand-strong)]" onClick={onSalvar} disabled={salvando}>
          {salvando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Salvar alterações
            </>
          )}
        </Button>
      </div>
    </>
  );
}
