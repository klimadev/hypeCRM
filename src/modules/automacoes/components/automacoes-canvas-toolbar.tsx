import { Crosshair, Plus, Save, Send, Slash, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type AutomacoesCanvasToolbarProps = {
  hasNodes: boolean;
  canAddStep: boolean;
  isSaving: boolean;
  isLoading: boolean;
  isPublishing: boolean;
  isPublished: boolean;
  canPublishDraft: boolean;
  hasSelection: boolean;
  onOpenStepDialog: () => void;
  onSave: () => void;
  onTogglePublish: () => void;
  onRemoveSelection: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onFit: () => void;
};

export function AutomacoesCanvasToolbar({
  hasNodes,
  canAddStep,
  isSaving,
  isLoading,
  isPublishing,
  isPublished,
  canPublishDraft,
  hasSelection,
  onOpenStepDialog,
  onSave,
  onTogglePublish,
  onRemoveSelection,
  onZoomOut,
  onZoomIn,
  onFit,
}: AutomacoesCanvasToolbarProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-2 rounded-[18px] border border-[var(--border-subtle)] bg-[color:rgba(12,12,14,0.86)] p-2 backdrop-blur-md">
      {hasNodes && canAddStep ? (
        <Button type="button" size="sm" variant="outline" onClick={onOpenStepDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo nó
        </Button>
      ) : null}

      <Button type="button" size="sm" variant="outline" onClick={onSave} disabled={isSaving || isLoading}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving ? "Salvando..." : "Salvar"}
      </Button>

      <Button
        type="button"
        size="sm"
        variant="default"
        onClick={onTogglePublish}
        disabled={isPublishing || isLoading || (!isPublished && !canPublishDraft)}
      >
        {isPublished ? <Slash className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
        {isPublishing ? (isPublished ? "Despublicando..." : "Publicando...") : isPublished ? "Despublicar" : "Publicar"}
      </Button>

      <Button type="button" variant="outline" size="icon" onClick={onRemoveSelection} aria-label="Excluir selecao" disabled={!hasSelection}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={onZoomOut} aria-label="Afastar canvas">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={onZoomIn} aria-label="Aproximar canvas">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" onClick={onFit} aria-label="Ajustar fluxo ao canvas">
        <Crosshair className="h-4 w-4" />
      </Button>
    </div>
  );
}
