import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FuncionarioItem = {
  id: string;
  nome: string;
};

type ChatTransferLeadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
  leadAtual: string | null;
  onSubmit: (params: { idLead: string; idFuncionario: string }) => Promise<void>;
};

export function ChatTransferLeadDialog({
  open,
  onOpenChange,
  leadId,
  leadAtual,
  onSubmit,
}: ChatTransferLeadDialogProps) {
  const [funcionarios, setFuncionarios] = useState<FuncionarioItem[]>([]);
  const [idFuncionario, setIdFuncionario] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;

    let ativo = true;
    setCarregando(true);
    fetch("/api/leads", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (!ativo) return;
        setFuncionarios(Array.isArray(json?.funcionarios) ? json.funcionarios : []);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setIdFuncionario("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir responsabilidade</DialogTitle>
          <DialogDescription>
            Reatribua o lead para outro colaborador sem sair do chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--text-secondary)]">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Atual</div>
            <div className="mt-1 font-medium text-[var(--text-primary)]">{leadAtual ?? "Sem responsável"}</div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Novo responsável</label>
            <Select value={idFuncionario} onValueChange={setIdFuncionario} disabled={carregando || salvando}>
              <SelectTrigger>
                <SelectValue placeholder={carregando ? "Carregando colaboradores..." : "Selecione um colaborador"} />
              </SelectTrigger>
              <SelectContent>
                {funcionarios.map((funcionario) => (
                  <SelectItem key={funcionario.id} value={funcionario.id}>
                    {funcionario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            disabled={!leadId || !idFuncionario || salvando}
            onClick={async () => {
              if (!leadId || !idFuncionario) return;
              setSalvando(true);
              try {
                await onSubmit({ idLead: leadId, idFuncionario });
                onOpenChange(false);
              } finally {
                setSalvando(false);
              }
            }}
          >
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
