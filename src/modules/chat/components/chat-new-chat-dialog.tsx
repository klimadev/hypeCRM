"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageCircle, Send } from "lucide-react";
import { aplicaMascaraTelefoneBr } from "@/lib/utils";
import type { WhatsappInstancia } from "@/modules/whatsapp/types";

type ChatNewChatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instancias: WhatsappInstancia[];
  onSubmit: (params: { telefone: string; instanceName: string }) => Promise<void>;
};

export function ChatNewChatDialog({ open, onOpenChange, instancias, onSubmit }: ChatNewChatDialogProps) {
  const [telefone, setTelefone] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [enviando, setEnviando] = useState(false);

  const telefoneNormalizado = telefone.replace(/\D/g, "");
  const telefoneValido = telefoneNormalizado.length >= 10 && telefoneNormalizado.length <= 13;
  const instanciaValida = instanceName.length > 0;

  const handleSubmit = async () => {
    if (!telefoneValido || !instanciaValida) return;

    setEnviando(true);
    try {
      await onSubmit({ telefone: telefoneNormalizado, instanceName });
      setTelefone("");
      setInstanceName("");
      onOpenChange(false);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-[var(--brand)]" />
            Nova conversa
          </DialogTitle>
          <DialogDescription>
            Digite o número do WhatsApp para iniciar uma conversa direta.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              WhatsApp
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(aplicaMascaraTelefoneBr(e.target.value))}
              placeholder="(00) 00000-0000"
              className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] transition-colors focus:border-[var(--brand)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
              Instância
            </label>
            <Select value={instanceName} onValueChange={setInstanceName}>
              <SelectTrigger className="h-11 w-full border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)]">
                <SelectValue placeholder={instancias.length > 0 ? "Selecione uma instância" : "Nenhuma instância conectada"} />
              </SelectTrigger>
              <SelectContent>
                {instancias.map((instancia) => (
                  <SelectItem key={instancia.id} value={instancia.instance_name}>
                    {instancia.nome ?? instancia.instance_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!telefoneValido || !instanciaValida || enviando}
            className="gap-2"
          >
            {enviando ? (
              "Abrindo..."
            ) : (
              <>
                <Send className="h-4 w-4" />
                Abrir chat
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
