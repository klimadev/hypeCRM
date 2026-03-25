import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UseRecebimentosModuleReturn } from "../types";

type RecebimentosTabsProps = {
  vm: UseRecebimentosModuleReturn;
};

const labels = {
  todos: "Todos",
  recebidos: "Recebidos",
  a_vencer: "A vencer",
  atrasados: "Atrasados",
} as const;

export function RecebimentosTabs({ vm }: RecebimentosTabsProps) {
  return (
    <Tabs value={vm.filtros.aba} onValueChange={(valor) => vm.setAba(valor as typeof vm.filtros.aba)}>
      <TabsList className="grid w-full grid-cols-2 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-1 md:grid-cols-4">
        {(Object.keys(labels) as Array<keyof typeof labels>).map((aba) => (
          <TabsTrigger key={aba} value={aba} className="rounded-[12px] text-sm data-[state=active]:bg-[var(--surface)] data-[state=active]:shadow-[var(--shadow-sm)]">
            {labels[aba]} ({vm.contadoresAbas[aba]})
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
