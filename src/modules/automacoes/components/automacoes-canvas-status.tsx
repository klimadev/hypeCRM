import { Badge } from "@/components/ui/badge";

type AutomacoesCanvasStatusProps = {
  isLoading: boolean;
  isPublished: boolean;
  ultimoSave: string | null;
  selectedNodeLabel: string | null;
  selectedNodeKindLabel: string | null;
  selectedEdgeText: string | null;
  validationMessage: string | null;
};

export function AutomacoesCanvasStatus({
  isLoading,
  isPublished,
  ultimoSave,
  selectedNodeLabel,
  selectedNodeKindLabel,
  selectedEdgeText,
  validationMessage,
}: AutomacoesCanvasStatusProps) {
  return (
    <div className="pointer-events-auto rounded-[18px] border border-[var(--border-subtle)] bg-[color:rgba(12,12,14,0.86)] px-3.5 py-2.5 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <Badge variant="info" size="sm" dot>
          Fluxo
        </Badge>
        {isLoading ? (
          <Badge variant="secondary" size="sm">
            Carregando...
          </Badge>
        ) : isPublished ? (
          <Badge variant="success" size="sm" dot>
            Publicada
          </Badge>
        ) : (
          <Badge variant="warning" size="sm" dot>
            Rascunho
          </Badge>
        )}
        {ultimoSave ? <span className="text-xs text-[var(--text-secondary)]">Salvo: {ultimoSave}</span> : null}
        {selectedNodeKindLabel ? <span className="text-xs text-[var(--text-secondary)]">{selectedNodeKindLabel}</span> : null}
      </div>
      {selectedNodeLabel ? <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">{selectedNodeLabel}</p> : null}
      {selectedEdgeText ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{selectedEdgeText}</p> : null}
      {validationMessage ? (
        <p className="mt-1 text-xs text-[color:rgba(248,113,113,0.92)]">{validationMessage}</p>
      ) : (
        <p className="mt-1 text-xs text-[color:rgba(74,222,128,0.9)]">Fluxo visual consistente.</p>
      )}
    </div>
  );
}
