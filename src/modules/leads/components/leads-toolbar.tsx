"use client";

import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LeadsToolbarProps = {
  busca: string;
  onBuscaChange: (valor: string) => void;
  onNovoLead: () => void;
  onAtualizar: () => void;
  carregando: boolean;
  recarregando: boolean;
};

export function LeadsToolbar({
  busca,
  onBuscaChange,
  onNovoLead,
  onAtualizar,
  carregando,
  recarregando,
}: LeadsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <Input
          value={busca}
          onChange={(event) => onBuscaChange(event.target.value)}
          placeholder="Buscar lead..."
          className="h-10 w-[min(100vw-2rem,20rem)] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] pl-9 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
        />
      </div>

      <Button
        type="button"
        className="h-10 rounded-[var(--radius-control)] bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
        onClick={onNovoLead}
      >
        <Plus className="mr-2 h-4 w-4" />
        Novo lead
      </Button>

      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-[var(--radius-control)]"
        onClick={onAtualizar}
        disabled={carregando || recarregando}
      >
        {recarregando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
        Atualizar
      </Button>
    </div>
  );
}
