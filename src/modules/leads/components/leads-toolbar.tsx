"use client";

import { EllipsisVertical, FileUp, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type LeadsToolbarProps = {
  busca: string;
  onBuscaChange: (valor: string) => void;
  onNovoLead: () => void;
  onImportarCsv: () => void;
  onAtualizar: () => void;
  carregando: boolean;
  recarregando: boolean;
};

export function LeadsToolbar({
  busca,
  onBuscaChange,
  onNovoLead,
  onImportarCsv,
  onAtualizar,
  carregando,
  recarregando,
}: LeadsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full md:w-auto md:min-w-[18rem]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          placeholder="Nome ou telefone..."
          className="h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--border-focus)]"
        />
      </div>

      <Button
        type="button"
        className="h-11 rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
        onClick={onNovoLead}
      >
        <Plus className="mr-2 h-4 w-4" />
        Novo lead
      </Button>

      <Popover>
        <PopoverTrigger className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]">
          <EllipsisVertical className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1">
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={onImportarCsv}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
            >
              <FileUp className="h-4 w-4 text-[var(--text-secondary)]" />
              Importar planilha
            </button>
            <button
              type="button"
              onClick={onAtualizar}
              disabled={carregando || recarregando}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-elevated)]"
            >
              {recarregando ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--text-secondary)]" />
              ) : (
                <RefreshCw className="h-4 w-4 text-[var(--text-secondary)]" />
              )}
              Atualizar lista
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
