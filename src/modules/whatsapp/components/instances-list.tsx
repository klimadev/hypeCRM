"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Smartphone } from "lucide-react";
import type { WhatsappInstancia } from "../types";
import { InstancesListCard } from "./instances-list-card";

type Props = {
  instancias: WhatsappInstancia[];
  onExcluir: (id: string) => Promise<void>;
  onAtualizarStatus: (id: string) => Promise<void>;
  onReconectar: (id: string) => Promise<void>;
  estaReconectando: (id: string) => boolean;
  getQrCode: (id: string) => string | null;
  buscarQrCode: (id: string) => Promise<string | null>;
};

export function InstanciasList({ instancias, onExcluir, onAtualizarStatus, onReconectar, estaReconectando, getQrCode, buscarQrCode }: Props) {
  if (instancias.length === 0) {
    return (
      <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
            <Smartphone className="h-10 w-10 text-[var(--text-tertiary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Nenhuma conexao ativa</h3>
          <p className="mt-2 max-w-xs text-center text-sm text-[var(--text-secondary)]">Crie sua primeira instância WhatsApp para iniciar o cockpit.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {instancias.map((instancia) => (
        <InstancesListCard
          key={instancia.id}
          instancia={instancia}
          onExcluir={onExcluir}
          onAtualizarStatus={onAtualizarStatus}
          onReconectar={onReconectar}
          estaReconectando={estaReconectando}
          getQrCode={getQrCode}
          buscarQrCode={buscarQrCode}
        />
      ))}
    </div>
  );
}
