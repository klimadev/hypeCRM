"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PayloadCriarCampanhaDisparo } from "@/lib/api/leads";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formulario: PayloadCriarCampanhaDisparo;
  pdvsPresentes: Array<{ id: string; nome: string }>;
  semPdvSelecionados: number;
  instancias: Array<{ id: string; nome: string; instance_name: string }>;
  erro: string | null;
  enviando: boolean;
  onCampoChange: <Campo extends keyof PayloadCriarCampanhaDisparo>(campo: Campo, valor: PayloadCriarCampanhaDisparo[Campo]) => void;
  onInstanciaPdvChange: (pdvId: string, instanciaId: string) => void;
  onConfirmar: () => void;
};

export function LeadDisparoCampaignDialog({
  open,
  onOpenChange,
  formulario,
  pdvsPresentes,
  semPdvSelecionados,
  instancias,
  erro,
  enviando,
  onCampoChange,
  onInstanciaPdvChange,
  onConfirmar,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nova campanha de disparo</DialogTitle>
          <DialogDescription>Configure mensagem, instâncias por PDV e cadência dinâmica.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="nome-campanha" className="text-sm font-medium text-[var(--text-primary)]">Nome da campanha</label>
            <Input id="nome-campanha" value={formulario.nome} onChange={(event) => onCampoChange("nome", event.target.value)} />
          </div>

          <div className="grid gap-2">
            <label htmlFor="mensagem-template" className="text-sm font-medium text-[var(--text-primary)]">Mensagem (template)</label>
            <Textarea id="mensagem-template" rows={4} value={formulario.mensagemTemplate} onChange={(event) => onCampoChange("mensagemTemplate", event.target.value)} />
            <p className="text-xs text-[var(--text-secondary)]">Variáveis: {"{{lead_nome}}"}, {"{{lead_telefone}}"}, {"{{estagio_nome}}"}.</p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="grid gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Delay mínimo (s)</p>
              <Input
                type="number"
                min={120}
                max={600}
                value={formulario.delayMinSegundos}
                onChange={(event) => onCampoChange("delayMinSegundos", Number(event.target.value) || 120)}
              />
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Delay máximo (s)</p>
              <Input
                type="number"
                min={120}
                max={600}
                value={formulario.delayMaxSegundos}
                onChange={(event) => onCampoChange("delayMaxSegundos", Number(event.target.value) || 240)}
              />
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium text-[var(--text-primary)]">Jitter máx (ms)</p>
              <Input
                type="number"
                min={0}
                max={3000}
                value={formulario.jitterMsMax}
                onChange={(event) => onCampoChange("jitterMsMax", Number(event.target.value) || 0)}
              />
            </div>
          </div>

          <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] p-3">
            <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Instância por PDV</p>
            <div className="grid gap-3">
              {pdvsPresentes.length === 0 ? <p className="text-xs text-[var(--text-secondary)]">Nenhum PDV encontrado na seleção atual.</p> : null}
              {pdvsPresentes.map((pdv) => (
                <div key={pdv.id} className="grid items-center gap-2 md:grid-cols-[1fr_220px]">
                  <p className="text-sm text-[var(--text-secondary)]">{pdv.nome}</p>
                  <Select value={formulario.pdvInstancias.find((item) => item.pdvId === pdv.id)?.instanciaId || ""} onValueChange={(value) => onInstanciaPdvChange(pdv.id, value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar instância" />
                    </SelectTrigger>
                    <SelectContent>
                      {instancias.map((instancia) => (
                        <SelectItem key={instancia.id} value={instancia.id}>{instancia.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              {semPdvSelecionados > 0 ? (
                <div className="grid items-center gap-2 md:grid-cols-[1fr_220px]">
                  <p className="text-sm text-[var(--text-secondary)]">Leads sem PDV ({semPdvSelecionados})</p>
                  <Select value={formulario.fallbackInstanciaSemPdvId || "__none__"} onValueChange={(value) => onCampoChange("fallbackInstanciaSemPdvId", value === "__none__" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Fallback opcional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem fallback</SelectItem>
                      {instancias.map((instancia) => (
                        <SelectItem key={instancia.id} value={instancia.id}>{instancia.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
            </div>
          </div>

          {erro ? <p className="text-sm text-[var(--danger)]">{erro}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>Cancelar</Button>
          <Button onClick={onConfirmar} disabled={enviando} className="bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]">
            {enviando ? "Agendando..." : "Criar campanha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
