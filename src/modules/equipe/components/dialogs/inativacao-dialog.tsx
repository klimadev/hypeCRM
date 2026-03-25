"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { UseEquipeModuleReturn } from "../../types";

type InativacaoDialogProps = {
  vm: UseEquipeModuleReturn;
};

export function InativacaoDialog({ vm }: InativacaoDialogProps) {
  return (
    <Dialog
      open={vm.dialogInativacaoAberto}
      onOpenChange={(aberto) => {
        vm.setDialogInativacaoAberto(aberto);
        if (!aberto) {
          vm.setErroLista(null);
        }
      }}
    >
        <DialogContent className="rounded-[var(--radius-card)]">
          <DialogHeader>
            <DialogTitle>Inativar colaborador</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              Ao inativar <span className="font-semibold">{vm.funcionariosDestinoInativacao?.nome}</span>, os leads precisam ser
              reatribuidos para outro colaborador ativo do mesmo PDV.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Destino da reatribuicao</p>
              <Select
                value={vm.destinoInativacaoIndividual}
                onValueChange={vm.setDestinoInativacaoIndividual}
                disabled={vm.executandoInativacaoIndividual || vm.funcionariosDestinoMesmoPdv.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {vm.funcionariosDestinoMesmoPdv.map((funcionario) => (
                    <SelectItem key={funcionario.id} value={funcionario.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{funcionario.nome}</span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {funcionario.cargo} • {funcionario.pdv?.nome}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Observacao (opcional)</p>
              <Textarea
                value={vm.observacaoInativacaoIndividual}
                onChange={(evento) => vm.setObservacaoInativacaoIndividual(evento.target.value)}
                placeholder="Ex.: Reatribuicao por mudanca de carteira"
                className="min-h-20"
              />
            </div>

            {vm.erroLista && <p className="text-sm font-medium text-[var(--danger)]">{vm.erroLista}</p>}
            {vm.funcionariosDestinoMesmoPdv.length === 0 ? (
              <p className="text-sm font-medium text-[var(--warning)]">Nenhum colaborador no mesmo PDV. Atribua a um gerente geral.</p>
            ) : null}

            <div className="flex gap-2">
            <Button
              className="flex-1 rounded-[var(--radius-control)] text-sm font-medium"
              variant="outline"
              onClick={() => vm.setDialogInativacaoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-[var(--radius-control)] font-medium"
              onClick={() => void vm.confirmarInativacaoIndividual()}
              disabled={
                vm.executandoInativacaoIndividual ||
                !vm.destinoInativacaoIndividual ||
                vm.funcionariosDestinoMesmoPdv.length === 0
              }
            >
              {vm.executandoInativacaoIndividual ? "Processando..." : "Inativar colaborador"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
