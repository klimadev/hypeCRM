"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { TipoEstagio } from "../types";
import { TypeSelector } from "./type-selector";

interface StageModalProps {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  onSubmit: (data: { nome: string; tipo: TipoEstagio }) => Promise<void>;
  trigger?: ReactNode;
  modoEdicao?: boolean;
  dadosIniciais?: { nome: string; tipo: TipoEstagio };
  carregando?: boolean;
}

export function StageModal({
  open,
  onOpenChange,
  onSubmit,
  trigger,
  modoEdicao = false,
  dadosIniciais,
  carregando = false,
}: StageModalProps) {
  const [nome, setNome] = useState(dadosIniciais?.nome ?? "");
  const [tipo, setTipo] = useState<TipoEstagio>(dadosIniciais?.tipo ?? "ABERTO");
  const [erro, setErro] = useState<string | null>(null);
  const { addToast } = useToast();

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Nome do estágio é obrigatório.");
      return;
    }

    try {
      await onSubmit({ nome: nome.trim(), tipo });
      addToast({
        type: "success",
        title: modoEdicao ? "Estágio atualizado!" : "Estágio adicionado!",
      });
      onOpenChange(false);
    } catch {
      setErro("Erro ao salvar. Tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modoEdicao ? "Editar estágio" : "Adicionar estágio"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Nome do estágio
            </label>
            <Input
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (erro) setErro(null);
              }}
              placeholder="Ex: Novo Lead"
              disabled={carregando}
              required
              maxLength={100}
              className={`h-11 rounded-xl border bg-[var(--surface)] text-sm ${
                erro ? "border-[var(--danger)]" : "border-[var(--border-subtle)]"
              }`}
              autoFocus
            />
            {erro && <p className="text-sm text-[var(--danger)]">{erro}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Tipo
            </label>
            <TypeSelector value={tipo} onChange={setTipo} disabled={carregando} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={carregando}
              className="rounded-xl border-[var(--border-subtle)]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={carregando}
              className="rounded-xl bg-[var(--brand)]"
            >
              {carregando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {modoEdicao ? "Salvar" : "Adicionar"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
