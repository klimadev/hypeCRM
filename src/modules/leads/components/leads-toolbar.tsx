"use client";

import { FileUp, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <div className="relative w-full md:w-auto">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          placeholder="Buscar lead..."
          className="h-10 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)] md:w-[20rem]"
        />
      </div>

      <Button
        type="button"
        className="h-10 rounded-[var(--radius-control)] bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
        onClick={onNovoLead}
      >
        <Plus className="mr-2 h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Novo lead</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-[var(--radius-control)]"
        onClick={onImportarCsv}
      >
        <FileUp className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Importar CSV</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-[var(--radius-control)]"
        onClick={onAtualizar}
        disabled={carregando || recarregando}
      >
        {recarregando ? <Loader2 className="h-4 w-4 animate-spin md:mr-2" /> : <RefreshCw className="h-4 w-4 md:mr-2" />}
        <span className="hidden md:inline">Atualizar</span>
      </Button>
    </div>
  );
}
