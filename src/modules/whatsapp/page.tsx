"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Radio, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ModulePageHeader } from "@/components/shared/module-page-header";
import { ModulePageShell } from "@/components/shared/module-page-shell";
import { InlineStatusAlert } from "@/components/shared/inline-status-alert";
import { instanciaWhatsappEstaConectada, normalizarStatusInstanciaWhatsapp } from "@/lib/whatsapp-instancia-status";
import { useWhatsappModule } from "./hooks/use-whatsapp-module";
import { InstanciasList } from "./components/instances-list";
import { WhatsappConnectionWizard } from "./components/whatsapp-connection-wizard";
import { getStatusBadgeWhatsapp } from "./components/instances-list.utils";

export function ModuloWhatsapp() {
  const vm = useWhatsappModule();
  const {
    instancias,
    carregando,
    erro,
    criarInstancia,
    excluirInstancia,
    atualizarStatus,
    reconectarInstancia,
    estaReconectando,
    getQrCode,
    getPairingCode,
    buscarQrCode,
  } = vm;
  const [nomeInstancia, setNomeInstancia] = useState("");
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [instanciaAssistidaId, setInstanciaAssistidaId] = useState<string | null>(null);
  const [wizardAberto, setWizardAberto] = useState(false);
  const [carregandoCriacao, setCarregandoCriacao] = useState(false);
  const [carregandoQr, setCarregandoQr] = useState(false);

  const instanciaAssistida = useMemo(
    () => instancias.find((instancia) => instancia.id === instanciaAssistidaId) ?? null,
    [instanciaAssistidaId, instancias],
  );

  const qrCodeAtual = instanciaAssistidaId ? getQrCode(instanciaAssistidaId) : null;
  const pairingCodeAtual = instanciaAssistidaId ? getPairingCode(instanciaAssistidaId) : null;

  const carregarQrCode = useCallback(
    async (id: string) => {
      setCarregandoQr(true);
      await buscarQrCode(id);
      setCarregandoQr(false);
    },
    [buscarQrCode],
  );

  const handleCriar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nome = nomeInstancia.trim();
    if (!nome || carregandoCriacao) return;

    setCarregandoCriacao(true);
    const resultado = await criarInstancia(nome);
    setCarregandoCriacao(false);

    if (!resultado.instanciaId) return;

    setInstanciaAssistidaId(resultado.instanciaId);
    setWizardStep(2);
    setNomeInstancia("");
    await carregarQrCode(resultado.instanciaId);
  };

  const handleGerarNovoQr = useCallback(async () => {
    if (!instanciaAssistidaId) return;
    await reconectarInstancia(instanciaAssistidaId);
    await carregarQrCode(instanciaAssistidaId);
    setWizardStep(2);
  }, [carregarQrCode, instanciaAssistidaId, reconectarInstancia]);

  const reiniciarWizard = useCallback(() => {
    setWizardStep(1);
    setInstanciaAssistidaId(null);
    setNomeInstancia("");
    setCarregandoQr(false);
  }, []);

  // Auto-abre o wizard se nao tem nenhuma instancia
  const autoAberturaFeita = useRef(false);
  useEffect(() => {
    if (!carregando && instancias.length === 0 && !autoAberturaFeita.current) {
      autoAberturaFeita.current = true;
      setWizardAberto(true);
    }
  }, [carregando, instancias]);

  useEffect(() => {
    if (wizardStep !== 2 || !instanciaAssistidaId) return;
    const interval = setInterval(() => {
      void atualizarStatus(instanciaAssistidaId);
    }, 2500);

    return () => clearInterval(interval);
  }, [atualizarStatus, instanciaAssistidaId, wizardStep]);

  useEffect(() => {
    if (wizardStep !== 2 || !instanciaAssistidaId || instanciaAssistida?.phone || qrCodeAtual || carregandoQr) return;
    void carregarQrCode(instanciaAssistidaId);
  }, [carregandoQr, carregarQrCode, instanciaAssistida?.phone, instanciaAssistidaId, qrCodeAtual, wizardStep]);

  useEffect(() => {
    if (!instanciaAssistida || !instanciaWhatsappEstaConectada(instanciaAssistida)) return;
    setWizardStep(3);
  }, [instanciaAssistida]);

  const connectedCount = instancias.filter(instanciaWhatsappEstaConectada).length;
  const pareandoCount = instancias.filter((instancia) => {
    const status = normalizarStatusInstanciaWhatsapp(instancia.status);
    return !instanciaWhatsappEstaConectada(instancia) && ["pending", "qrcode", "qr_code", "creating", "loading", "connecting"].includes(status);
  }).length;
  const offlineCount = Math.max(instancias.length - connectedCount - pareandoCount, 0);

  const statusWizard = instanciaAssistida ? getStatusBadgeWhatsapp(instanciaAssistida).labelDetailed : "Aguardando criacao";

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

      <InlineStatusAlert variant="error" message={erro} className="animate-fade-in" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <CardContent className="flex items-center justify-between p-[18px] md:p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]">
                <Wifi className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-tertiary)]">Status</p>
                <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{connectedCount}</p>
                <p className="text-xs text-[var(--success)]">Instancias conectadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <CardContent className="flex items-center gap-4 p-[18px] md:p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_14%,transparent)] text-[var(--warning)]">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-tertiary)]">Pareando</p>
              <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{pareandoCount}</p>
              <p className="text-xs text-[var(--text-secondary)]">Aguardando autenticacao</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
          <CardContent className="flex items-center gap-4 p-[18px] md:p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
              <WifiOff className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--text-tertiary)]">Offline</p>
              <p className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{offlineCount}</p>
              <p className="text-xs text-[var(--text-secondary)]">Precisam de acao manual</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={wizardAberto} onOpenChange={(open) => { if (!open) { reiniciarWizard(); setWizardAberto(false); } }}>
          <SheetContent side="right" className="w-full max-w-lg overflow-y-auto p-0">
            <WhatsappConnectionWizard
              step={wizardStep}
              nomeInstancia={nomeInstancia}
              onNomeInstanciaChange={setNomeInstancia}
              onCriarInstancia={handleCriar}
              carregandoCriacao={carregandoCriacao}
              instanciaNome={instanciaAssistida?.profile_name ?? instanciaAssistida?.nome ?? null}
              instanciaPhone={instanciaAssistida?.phone ?? null}
              qrCode={qrCodeAtual}
              pairingCode={pairingCodeAtual}
              carregandoQr={carregandoQr}
              statusAtual={statusWizard}
              onGerarNovoQr={handleGerarNovoQr}
              onReiniciarFluxo={reiniciarWizard}
            />
          </SheetContent>
        </Sheet>

      {carregando ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
              <Skeleton className="mb-3 h-3 w-20" />
              <Skeleton className="mb-2 h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
              <Skeleton className="mb-3 h-3 w-20" />
              <Skeleton className="mb-2 h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
              <Skeleton className="mb-3 h-3 w-20" />
              <Skeleton className="mb-2 h-7 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-36" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 shrink-0" rounded="full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-full" rounded="control" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[var(--text-tertiary)]">Instancias existentes</p>
            {!wizardAberto ? (
              <button
                type="button"
                onClick={() => { setWizardStep(1); setWizardAberto(true); }}
                className="text-xs font-medium text-[var(--brand)] transition-colors hover:brightness-110"
              >
                + Nova conexao
              </button>
            ) : null}
          </div>
          <InstanciasList
            instancias={instancias}
            onExcluir={excluirInstancia}
            onAtualizarStatus={atualizarStatus}
            onReconectar={reconectarInstancia}
            estaReconectando={estaReconectando}
            getQrCode={getQrCode}
            buscarQrCode={buscarQrCode}
          />
        </div>
      )}
    </ModulePageShell>
  );
}
