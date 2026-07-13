"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/components/ui/toast";

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
  const [mostrarDescricao, setMostrarDescricao] = useState(!!dadosIniciais?.descricao);
  const { addToast } = useToast();

  const handleSubmit = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErro(null);

    if (!nome.trim()) {
      setErro("Nome do pipeline é obrigatório.");
      return;
    }

    try {
      await onSubmit({ nome: nome.trim(), descricao: descricao.trim() || undefined });
      addToast({
        type: "success",
        title: modoEdicao ? "Pipeline atualizado!" : "Pipeline criado!",
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
            {modoEdicao ? "Editar funil" : "Criar novo funil"}
          </DialogTitle>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Nome do funil
            </label>
            <Input
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (erro) setErro(null);
              }}
              placeholder="Ex: Funil de Vendas"
              disabled={carregando}
              required
              maxLength={100}
              className={`h-12 rounded-xl border bg-[var(--surface)] text-base ${
                erro
                  ? "border-[var(--danger)] focus:border-[var(--danger)]"
                  : "border-[var(--border-subtle)] focus:border-[var(--border-focus)]"
              }`}
              autoFocus
            />
            {erro && (
              <p className="text-sm text-[var(--danger)]">{erro}</p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setMostrarDescricao(!mostrarDescricao)}
              className="flex items-center gap-1 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              {mostrarDescricao ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {mostrarDescricao ? "Ocultar descrição" : "Adicionar descrição (opcional)"}
            </button>

            {mostrarDescricao && (
              <div className="mt-2 space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  Descrição
                </label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Pipeline principal de vendas"
                  disabled={carregando}
                  maxLength={500}
                  className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm"
                />
              </div>
            )}
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
              disabled={carregando || !nome.trim()}
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
                  {modoEdicao ? "Salvar" : "Criar funil"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
