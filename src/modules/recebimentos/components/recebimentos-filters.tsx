import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseRecebimentosModuleReturn } from "../types";

type RecebimentosFiltersProps = {
  vm: UseRecebimentosModuleReturn;
};

export function RecebimentosFilters({ vm }: RecebimentosFiltersProps) {
  return (
    <section className="rounded-xl">

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="xl:col-span-2">
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Busca</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]" />
            <Input className="rounded-xl pl-9" placeholder="Lead, telefone, responsavel ou PDV" value={vm.filtros.busca} onChange={(event) => vm.setBusca(event.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Data inicial</label>
          <Input type="date" className="rounded-xl" value={vm.filtros.data_inicial} onChange={(event) => vm.setDataInicial(event.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Data final</label>
          <Input type="date" className="rounded-xl" value={vm.filtros.data_final} onChange={(event) => vm.setDataFinal(event.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">PDV</label>
          <Select value={vm.filtros.id_pdv || "todos"} onValueChange={(value) => vm.setIdPdv(value === "todos" ? "" : value)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Todos os PDVs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os PDVs</SelectItem>
              {vm.opcoesPdvs.map((pdv) => (
                <SelectItem key={pdv.id} value={pdv.id}>{pdv.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Responsavel</label>
          <Select value={vm.filtros.id_funcionario || "todos"} onValueChange={(value) => vm.setIdFuncionario(value === "todos" ? "" : value)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Todos os responsaveis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os responsaveis</SelectItem>
              {vm.opcoesResponsaveis.map((responsavel) => (
                <SelectItem key={responsavel.id} value={responsavel.id}>{responsavel.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {vm.temFiltrosAtivos ? (
        <div className="flex justify-end">
          <button type="button" onClick={vm.limparFiltros} className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        </div>
      ) : null}
    </section>
  );
}
