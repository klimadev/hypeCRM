"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { FeedbackImpacto, FeedbackTipo } from "../types";

type FeedbackFormProps = {
  open: boolean;
  onClose: () => void;
  initialTipo: FeedbackTipo;
};

const impactoOptions: { value: FeedbackImpacto; label: string }[] = [
  { value: "bloqueia_operacao", label: "Bloqueia o fluxo" },
  { value: "dificulta", label: "Dificulta o uso" },
  { value: "incoveniente", label: "Incoveniente" },
  { value: "sugestao", label: "Sugestão" },
];

const toopcao = (valor: string | null | undefined): string | undefined => {
  const texto = valor?.trim();
  return texto ? texto : undefined;
};

export function FeedbackForm({ open, onClose, initialTipo }: FeedbackFormProps) {
  const { addToast } = useToast();
  const pathname = usePathname();

  const [tipo, setTipo] = useState<FeedbackTipo>(initialTipo);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [impacto, setImpacto] = useState<"" | FeedbackImpacto>("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTipo(initialTipo);
      setTitulo("");
      setDescricao("");
      setImpacto("");
      setErro(null);
    }
  }, [open, initialTipo]);

  const moduloAtual = pathname
    .split("/")
    .filter(Boolean)
    .at(0) || "dashboard";

  const obterContexto = () => {
    if (typeof window === "undefined") {
      return {
        rota_origem: pathname,
        modulo_origem: moduloAtual,
      };
    }

    return {
      rota_origem: window.location.pathname,
      modulo_origem: moduloAtual,
      url_origem: window.location.href,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      user_agent: window.navigator.userAgent,
      build_ref: process.env.NEXT_PUBLIC_BUILD_REF,
    };
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!titulo.trim() || titulo.trim().length < 3) {
      setErro("Informe um titulo com pelo menos 3 caracteres.");
      return;
    }

    if (!descricao.trim() || descricao.trim().length < 10) {
      setErro("Descreva o problema ou a sugestão com pelo menos 10 caracteres.");
      return;
    }

    setEnviando(true);
    setErro(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          ...(toopcao(impacto) ? { impacto: impacto } : {}),
          ...obterContexto(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.erro || "Nao foi possivel enviar o feedback.");
      }

      addToast({
        type: "success",
        title: "Feedback enviado",
        description: "Relato enviado com sucesso. Obrigado pela contribuicao.",
      });

      setTitulo("");
      setDescricao("");
      setImpacto("");
      onClose();
    } catch (e) {
      const mensagem = e instanceof Error ? e.message : "Falha ao enviar feedback.";
      setErro(mensagem);
      addToast({ type: "error", title: "Falha ao enviar", description: mensagem });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{tipo === "BUG" ? "Reportar bug" : "Enviar sugestao"}</DialogTitle>
          <DialogDescription>Descreva em texto curto o ponto de melhoria ou o problema encontrado.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={tipo} disabled className="uppercase tracking-[0.2em] text-xs font-semibold" />
          <Input
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Resumo curto do item"
            required
            maxLength={120}
          />
          <Textarea
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            placeholder="Descreva o contexto, passos e impacto"
            required
            minLength={10}
            maxLength={2000}
            className="min-h-28"
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-tertiary)]">Impacto</label>
            <Select value={impacto || undefined} onValueChange={(valor) => setImpacto(valor as FeedbackImpacto)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o impacto" />
              </SelectTrigger>
              <SelectContent>
                {impactoOptions.map((opcao) => (
                  <SelectItem key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {erro ? (
            <div className="rounded-[var(--radius-control)] border border-[color:rgba(244,63,94,0.24)] bg-[color:rgba(244,63,94,0.08)] p-3 text-sm text-[var(--danger)]">
              <div className="inline-flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {erro}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={enviando}>
              Fechar
            </Button>
            <Button type="submit" disabled={enviando} className="gap-2">
              {enviando ? (
                <>
                  <Send className="h-4 w-4 animate-pulse" />
                  Enviando
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
