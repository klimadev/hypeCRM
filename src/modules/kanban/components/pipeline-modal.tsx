"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

interface PipelineModalProps {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  onSubmit: (data: { nome: string; descricao?: string }) => Promise<void>;
  trigger?: ReactNode;
  modoEdicao?: boolean;
  dadosIniciais?: { nome: string; descricao?: string | null };
  carregando?: boolean;
}

export function PipelineModal({
  open,
  onOpenChange,
  onSubmit,
  trigger,
  modoEdicao = false,
  dadosIniciais,
  carregando = false,
}: PipelineModalProps) {
  const [nome, setNome] = useState(dadosIniciais?.nome ?? "");
  const [descricao, setDescricao] = useState(dadosIniciais?.descricao ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Nome do pipeline é obrigatório.");
      return;
    }

    await onSubmit({ nome: nome.trim(), descricao: descricao.trim() || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {modoEdicao ? "Editar Pipeline" : "Criar Novo Pipeline"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Nome do Pipeline
            </label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Funil de Vendas"
              disabled={carregando}
              required
              maxLength={100}
              className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Descrição (opcional)
            </label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Pipeline principal de vendas"
              disabled={carregando}
              maxLength={500}
              className="h-11 rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]"
            />
          </div>

          {erro && <p className="text-sm text-rose-500">{erro}</p>}

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
              ) : modoEdicao ? (
                "Salvar Alterações"
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Pipeline
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}