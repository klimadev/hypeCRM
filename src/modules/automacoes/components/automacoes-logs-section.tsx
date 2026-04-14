import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AutomacaoExecucaoItem } from "@/lib/api/automacoes";
import { getExecucaoBadgeVariant, parseResumoExecucao } from "../lib/automacoes-logs";

type AutomacoesLogsSectionProps = {
  execucoes: AutomacaoExecucaoItem[];
  isLoadingExecucoes: boolean;
  onReload: () => void;
};

export function AutomacoesLogsSection({ execucoes, isLoadingExecucoes, onReload }: AutomacoesLogsSectionProps) {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <Badge variant="info" size="sm" dot>
          Últimas execuções
        </Badge>
        <Button type="button" size="sm" variant="outline" onClick={onReload} disabled={isLoadingExecucoes}>
          {isLoadingExecucoes ? "Atualizando..." : "Atualizar logs"}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Trigger</TableHead>
            <TableHead>Contexto</TableHead>
            <TableHead>Resumo</TableHead>
            <TableHead>Criado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {execucoes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[var(--text-tertiary)]">
                {isLoadingExecucoes ? "Carregando execuções..." : "Sem execuções registradas até o momento."}
              </TableCell>
            </TableRow>
          ) : (
            execucoes.map((execucao) => (
              <TableRow key={execucao.id}>
                <TableCell>
                  <Badge variant={getExecucaoBadgeVariant(execucao.status)} size="sm" dot>
                    {execucao.status}
                  </Badge>
                </TableCell>
                <TableCell>{execucao.trigger_tipo}</TableCell>
                <TableCell>{execucao.contexto_ref_tipo ? `${execucao.contexto_ref_tipo}:${execucao.contexto_ref_id}` : "-"}</TableCell>
                <TableCell>{parseResumoExecucao(execucao)}</TableCell>
                <TableCell>{new Date(execucao.criado_em).toLocaleString("pt-BR")}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </>
  );
}
