# Step 4 - Frontend: Componentes de UI para Trial

## Contexto
O dashboard precisa de um banner/widget visivel que mostre:
1. Status atual da assinatura (Trial)
2. Contagem regressiva (ex: "15 dias restantes")
3. Data de expiracao formatada
4. CTA para upgrade (placeholder por enquanto)

O banner deve seguir o design system do projeto (Tailwind, componentes existentes).

## 4.1 Novo arquivo: `src/modules/trial/types.ts`

Tipagens do modulo de trial:

```typescript
export type EstadoTrial = {
  status: "TRIAL" | "ATIVA" | "EXPIRADA" | "CANCELADA";
  plano: string;
  trial_ativo: boolean;
  trial_expirado: boolean;
  dias_restantes: number;
  trial_inicio: string | null;
  trial_fim: string | null;
  data_expiracao: string | null;
  mensagem: string;
};
```

## 4.2 Novo arquivo: `src/modules/trial/index.ts`

Export publico do modulo:

```typescript
export { TrialBanner } from "./components/trial-banner";
export { useTrialStatus } from "./hooks/use-trial-status";
export type { EstadoTrial } from "./types";
```

## 4.3 Novo arquivo: `src/modules/trial/hooks/use-trial-status.ts`

Hook client-side para buscar e manter estado do trial:

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import type { EstadoTrial } from "../types";

type UseTrialStatusReturn = {
  dados: EstadoTrial | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
};

export function useTrialStatus(): UseTrialStatusReturn {
  const [dados, setDados] = useState<EstadoTrial | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const resposta = await fetch("/api/trial/status");
      if (!resposta.ok) {
        throw new Error("Falha ao buscar status do trial.");
      }
      const json = await resposta.json();
      setDados(json);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscar();
  }, [buscar]);

  return { dados, carregando, erro, recarregar: buscar };
}
```

## 4.4 Novo arquivo: `src/modules/trial/components/trial-banner.tsx`

Componente principal do banner. Segue o design system do projeto.

### Variantes do banner:

1. **Trial Ativo (> 7 dias)**: Banner azul/cyan discreto no topo
2. **Trial Atencao (3-7 dias)**: Banner amarelo mais proeminente
3. **Trial Critico (< 3 dias)**: Banner vermelho/alerta
4. **Trial Expirado**: Banner vermelho com CTA de upgrade
5. **Assinatura Ativa**: Sem banner (ou badge discreto)

### Implementacao:

```typescript
"use client";

import { Clock, AlertTriangle, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialStatus } from "../hooks/use-trial-status";

function calcularVariante(dados: { trial_ativo: boolean; trial_expirado: boolean; dias_restantes: number }) {
  if (dados.trial_expirado) return "expirado";
  if (!dados.trial_ativo) return "ativo"; // Assinatura paga
  if (dados.dias_restantes <= 3) return "critico";
  if (dados.dias_restantes <= 7) return "atencao";
  return "informativo";
}

const estilosVariante = {
  informativo: {
    container: "border-sky-200 bg-sky-50",
    icone: "text-sky-600 bg-sky-100",
    titulo: "text-sky-900",
    descricao: "text-sky-700",
    badge: "bg-sky-100 text-sky-700",
    IconeComponent: Clock,
  },
  atencao: {
    container: "border-amber-200 bg-amber-50",
    icone: "text-amber-600 bg-amber-100",
    titulo: "text-amber-900",
    descricao: "text-amber-700",
    badge: "bg-amber-100 text-amber-700",
    IconeComponent: AlertTriangle,
  },
  critico: {
    container: "border-red-200 bg-red-50",
    icone: "text-red-600 bg-red-100",
    titulo: "text-red-900",
    descricao: "text-red-700",
    badge: "bg-red-100 text-red-700",
    IconeComponent: AlertCircle,
  },
  expirado: {
    container: "border-red-300 bg-red-50",
    icone: "text-red-600 bg-red-100",
    titulo: "text-red-900",
    descricao: "text-red-700",
    badge: "bg-red-100 text-red-700",
    IconeComponent: AlertCircle,
  },
  ativo: {
    container: "border-emerald-200 bg-emerald-50",
    icone: "text-emerald-600 bg-emerald-100",
    titulo: "text-emerald-900",
    descricao: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    IconeComponent: CheckCircle2,
  },
} as const;

export function TrialBanner() {
  const { dados, carregando } = useTrialStatus();

  if (carregando || !dados) {
    return null; // Evitar flash de conteudo
  }

  // Se a assinatura esta ativa (paga), nao mostrar banner
  if (dados.status === "ATIVA") {
    return null;
  }

  const variante = calcularVariante(dados);
  const estilo = estilosVariante[variante];
  const Icone = estilo.IconeComponent;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3.5 transition-all duration-200",
        estilo.container,
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          estilo.icone,
        )}
      >
        <Icone className="h-4.5 w-4.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-semibold", estilo.titulo)}>
          {dados.trial_expirado
            ? "Trial Expirado"
            : dados.trial_ativo
              ? `Trial: ${dados.dias_restantes} dia${dados.dias_restantes !== 1 ? "s" : ""} restante${dados.dias_restantes !== 1 ? "s" : ""}`
              : "Assinatura"}
        </p>
        <p className={cn("text-xs mt-0.5", estilo.descricao)}>
          {dados.trial_expirado
            ? `Expirou em ${dados.data_expiracao}. Faca upgrade para continuar.`
            : dados.trial_ativo
              ? `Expira em ${dados.data_expiracao}`
              : dados.mensagem}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {dados.trial_ativo && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              estilo.badge,
            )}
          >
            {dados.dias_restantes}d
          </span>
        )}
        {(dados.trial_ativo || dados.trial_expirado) && (
          <button
            type="button"
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200",
              dados.trial_expirado
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-slate-900 text-white hover:bg-slate-800",
            )}
            onClick={() => {
              // TODO: Implementar redirect para pagina de upgrade
              // Por enquanto, placeholder
              alert("Funcionalidade de upgrade em breve!");
            }}
          >
            <Sparkles className="inline h-3 w-3 mr-1" />
            Upgrade
          </button>
        )}
      </div>
    </div>
  );
}
```

## 4.5 Integracao no Dashboard Layout

Modificar `src/app/(dashboard)/layout.tsx` para incluir o TrialBanner:

```typescript
import { TrialBanner } from "@/modules/trial";

// No JSX do layout, dentro do <main>, antes de {children}:
<main className="flex-1 p-4 lg:p-8">
  <div className="mb-4">
    <TrialBanner />
  </div>
  <DashboardErrorBoundary>
    {children}
  </DashboardErrorBoundary>
</main>
```

O banner aparece no topo de todas as paginas do dashboard.

## 4.6 Atualizacao da Pagina de Cadastro

Modificar `src/app/(auth)/cadastro/page.tsx` para tratar novos erros de trial:

```typescript
// No bloco de erro, adicionar tratamento especifico:
if (!resposta.ok) {
  const erroApi = (json as { erro?: string }).erro;
  const mensagem = erroApi
    ?? (resposta.status === 409 ? "Este e-mail ja esta cadastrado ou possui um trial."
    : resposta.status === 429 ? "Muitas contas criadas nesta rede. Tente novamente mais tarde ou use outro endereco."
    : resposta.status === 0 ? "Servidor indisponivel. Tente mais tarde."
    : "Falha ao criar conta. Tente novamente.");
  setErro(mensagem);
  setCarregando(false);
  return;
}
```

## 4.7 Atualizacao do Sidebar (opcional)

Adicionar um badge discreto no sidebar para indicar status de trial:

No arquivo `src/components/sidebar-principal.tsx`, na secao do usuario (parte inferior da sidebar), adicionar um badge de trial se o perfil for EMPRESA:

```typescript
// Apos o badge de empresa:
{sessao.perfil === "EMPRESA" && (
  <div className="mt-1">
    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700">
      Trial
    </span>
  </div>
)}
```

Porem, para isso precisar passar os dados do trial para o Sidebar. Isso pode ser feito:
- Passando como prop adicional do layout
- Ou buscando via hook no proprio Sidebar (ja que e "use client")

Para simplificar, o banner no topo do dashboard ja e suficiente para a primeira versao.

## Notas de Design

- O banner segue os mesmos tokens visuais dos componentes existentes (Tailwind, border-slate-200, rounded-xl, etc.)
- Usa os mesmos icones do projeto (lucide-react)
- Nao usa componentes custom fora da base - e um componente standalone
- A animacao e sutil (transition-all duration-200)
- O banner e responsivo (flex-wrap em mobile via classes Tailwind)
- Cores seguem o padrao: azul = informativo, amarelo = atencao, vermelho = critico/expirado, verde = ativo/pago
