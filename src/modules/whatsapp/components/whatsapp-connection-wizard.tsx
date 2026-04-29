"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles, Smartphone } from "lucide-react";
import { WhatsappConnectionScanStep } from "./whatsapp-connection-scan-step";
import { WhatsappConnectionSuccessStep } from "./whatsapp-connection-success-step";

type WizardStep = 1 | 2 | 3;

type WhatsappConnectionWizardProps = {
  step: WizardStep;
  nomeInstancia: string;
  onNomeInstanciaChange: (value: string) => void;
  onCriarInstancia: (event: React.FormEvent<HTMLFormElement>) => void;
  carregandoCriacao: boolean;
  instanciaNome: string | null;
  instanciaPhone: string | null;
  qrCode: string | null;
  pairingCode: string | null;
  carregandoQr: boolean;
  statusAtual: string;
  onGerarNovoQr: () => void;
  onReiniciarFluxo: () => void;
};

const steps = ["Nomear", "Escanear", "Pronto"] as const;

export function WhatsappConnectionWizard(props: WhatsappConnectionWizardProps) {
  const {
    step,
    nomeInstancia,
    onNomeInstanciaChange,
    onCriarInstancia,
    carregandoCriacao,
    instanciaNome,
    instanciaPhone,
    qrCode,
    pairingCode,
    carregandoQr,
    statusAtual,
    onGerarNovoQr,
    onReiniciarFluxo,
  } = props;

  const titulo = useMemo(() => {
    if (step === 1) return "Assistente de conexao WhatsApp";
    if (step === 2) return "Escaneie e conecte seu aparelho";
    return "Conexao concluida";
  }, [step]);

  const subtitulo = useMemo(() => {
    if (step === 1) return "Crie e conecte sua instancia com foco total em menos de um minuto.";
    if (step === 2) return "Mantenha esta tela aberta enquanto a autenticacao acontece em tempo real.";
    return "Instancia pronta para atendimento e automacoes.";
  }, [step]);

  return (
    <Card className="relative overflow-hidden border-[var(--border-subtle)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,color-mix(in_srgb,var(--success)_18%,transparent),transparent_42%),radial-gradient(circle_at_100%_0%,color-mix(in_srgb,var(--info)_14%,transparent),transparent_38%)]" />
      <CardHeader className="relative space-y-4 pb-2">
        <div className="flex items-center gap-2 text-[var(--success)]">
          <Sparkles className="h-4 w-4" />
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">Conexao guiada</p>
        </div>
        <div>
          <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">{titulo}</CardTitle>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitulo}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {steps.map((label, index) => {
            const etapa = index + 1;
            const concluida = step > etapa;
            const ativa = step === etapa;

            return (
              <div
                key={label}
                className={cn(
                  "rounded-xl border px-3 py-2 text-center transition-all duration-300",
                  concluida && "border-[var(--success)] bg-[color-mix(in_srgb,var(--success)_14%,transparent)] text-[var(--success)]",
                  ativa && "border-[var(--info)] bg-[color-mix(in_srgb,var(--info)_12%,transparent)] text-[var(--text-primary)]",
                  !concluida && !ativa && "border-[var(--border-subtle)] bg-[var(--surface-soft)] text-[var(--text-tertiary)]",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em]">Etapa {etapa}</p>
                <p className="mt-1 text-xs font-medium">{label}</p>
              </div>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="relative pb-5 pt-4">
        {step === 1 ? (
          <form className="space-y-4" onSubmit={onCriarInstancia}>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-tertiary)]">Nome da instancia</p>
              <Input
                className="h-12 bg-[var(--surface-elevated)]"
                placeholder="Ex: Vendas, Suporte, Pos-venda"
                value={nomeInstancia}
                onChange={(event) => onNomeInstanciaChange(event.target.value)}
                required
                minLength={3}
              />
              <p className="text-xs text-[var(--text-tertiary)]">Use um nome curto para facilitar a operacao da equipe no dia a dia.</p>
            </div>
            <Button type="submit" variant="success" className="w-full" disabled={!nomeInstancia.trim() || carregandoCriacao}>
              {carregandoCriacao ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
              <span className="ml-1">Gerar QR e continuar</span>
            </Button>
          </form>
        ) : null}

        {step === 2 ? (
          <WhatsappConnectionScanStep
            instanciaNome={instanciaNome}
            instanciaPhone={instanciaPhone}
            qrCode={qrCode}
            pairingCode={pairingCode}
            carregandoQr={carregandoQr}
            statusAtual={statusAtual}
            onGerarNovoQr={onGerarNovoQr}
          />
        ) : null}

        {step === 3 ? (
          <WhatsappConnectionSuccessStep
            instanciaNome={instanciaNome}
            instanciaPhone={instanciaPhone}
            onReiniciarFluxo={onReiniciarFluxo}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
