"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, CheckCircle2, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";
import { useWhatsappModule } from "./hooks/use-whatsapp-module";
import { InstanciasList } from "./components/instances-list";

export function ModuloWhatsapp() {
  const vm = useWhatsappModule();
  const [nomeInstancia, setNomeInstancia] = useState("");
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeInstancia.trim()) return;
    
    setSucesso(null);
    await vm.criarInstancia(nomeInstancia.trim());
    setNomeInstancia("");
    setSucesso("Instância criada! Escaneie o QR Code com seu WhatsApp.");
    
    setTimeout(() => setSucesso(null), 5000);
  };

  const connectedCount = vm.instancias.filter(instanciaWhatsappEstaConectada).length;

  return (
    <ModulePageShell spacing="lg">
      <ModulePageHeader
        title="WhatsApp"
        subtitle="Gerencie conexoes, acompanhe instancias ativas e mantenha o canal operacional da equipe."
        iconTone="emerald"
        icon={
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        }
      />

      <InlineStatusAlert variant="error" message={vm.erro} className="animate-fade-in" />

      <InlineStatusAlert variant="success" message={sucesso} icon={<CheckCircle2 className="h-5 w-5" />} className="animate-fade-in" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="relative overflow-hidden border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--success)_18%,transparent),transparent_50%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--info-alt)_12%,transparent),transparent_55%)]" />
          <CardContent className="relative flex items-center justify-between p-[18px] md:p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-control)] border border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)] shadow-[var(--shadow-sm)]">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Status</p>
                <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{connectedCount}</p>
                <p className="text-xs text-[var(--success)]">Instancias conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

        <Card className="overflow-hidden border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-[var(--text-primary)]">Nova conexao WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-3" onSubmit={handleCriar}>
            <div className="relative flex-1">
              <Input
                className={`h-11 pr-4 transition-all ${
                  focused
                    ? "border-[var(--success)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_20%,transparent)]"
                    : ""
                }`}
                placeholder="Ex: WhatsApp vendas, suporte..."
                value={nomeInstancia}
                onChange={(e) => setNomeInstancia(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                required
                minLength={3}
              />
            </div>
            <Button 
              className="bg-[var(--success)] text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] hover:brightness-110"
              disabled={!nomeInstancia.trim() || vm.carregando}
            >
              {vm.carregando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Criar instancia
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {vm.carregando ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-tertiary)]" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">Carregando suas conexoes...</p>
        </div>
      ) : (
        <InstanciasList
          instancias={vm.instancias}
          onExcluir={vm.excluirInstancia}
          onAtualizarStatus={vm.atualizarStatus}
          onReconectar={vm.reconectarInstancia}
          estaReconectando={vm.estaReconectando}
          getQrCode={vm.getQrCode}
          buscarQrCode={vm.buscarQrCode}
        />
      )}
    </ModulePageShell>
  );
}
