# Step 3 - Backend: API de Status Trial e Verificacao de Expiracao

## Contexto
Precisamos de:
1. Um endpoint `GET /api/trial/status` para o frontend consultar o estado do trial
2. Uma funcao auxiliar para verificar se o trial de uma empresa expirou
3. Integracao no `exigirSessao` para redirecionar usuarios com trial expirado

## 3.1 Novo arquivo: `src/app/api/trial/status/route.ts`

Este endpoint retorna o estado atual do trial para a empresa logada.

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirSessao } from "@/lib/permissoes";
import { calcularEstadoTrial } from "@/lib/trial";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const { sessao } = auth;

  const empresa = await prisma.empresa.findUnique({
    where: { id: sessao.id_empresa },
    select: {
      status_assinatura: true,
      trial_inicio: true,
      trial_fim: true,
      assinatura_inicio: true,
      assinatura_fim: true,
      plano: true,
    },
  });

  if (!empresa) {
    return NextResponse.json({ erro: "Empresa nao encontrada." }, { status: 404 });
  }

  const estado = calcularEstadoTrial(empresa);

  return NextResponse.json(estado);
}
```

### Resposta esperada:

```json
{
  "status": "TRIAL",               // TRIAL | ATIVA | EXPIRADA | CANCELADA
  "plano": "trial",                // trial | basico | profissional | enterprise
  "trial_ativo": true,             // Se o trial esta em andamento
  "trial_expirado": false,         // Se o trial ja passou da data
  "dias_restantes": 15,            // Dias ate expirar (0 se expirado)
  "trial_inicio": "2026-03-24...", // ISO date string
  "trial_fim": "2026-04-23...",    // ISO date string
  "data_expiracao": "24/04/2026",  // Formatada em pt-BR para exibicao direta
  "mensagem": "Seu trial expira em 15 dias." // Mensagem amigavel
}
```

## 3.2 Novo arquivo: `src/lib/trial.ts`

Funcoes auxiliares para logica de trial:

```typescript
type DadosTrial = {
  status_assinatura: string;
  trial_inicio: Date | null;
  trial_fim: Date | null;
  assinatura_inicio: Date | null;
  assinatura_fim: Date | null;
  plano: string;
};

type EstadoTrial = {
  status: string;
  plano: string;
  trial_ativo: boolean;
  trial_expirado: boolean;
  dias_restantes: number;
  trial_inicio: string | null;
  trial_fim: string | null;
  data_expiracao: string | null;
  mensagem: string;
};

export function calcularEstadoTrial(empresa: DadosTrial): EstadoTrial {
  const agora = new Date();
  
  // Se nao tem trial_fim, e uma conta antiga/paga
  if (!empresa.trial_fim) {
    return {
      status: empresa.status_assinatura,
      plano: empresa.plano,
      trial_ativo: false,
      trial_expirado: false,
      dias_restantes: 0,
      trial_inicio: empresa.trial_inicio?.toISOString() ?? null,
      trial_fim: null,
      data_expiracao: null,
      mensagem: empresa.status_assinatura === "ATIVA"
        ? "Assinatura ativa."
        : "Conta sem trial.",
    };
  }

  const trialFim = new Date(empresa.trial_fim);
  const diffMs = trialFim.getTime() - agora.getTime();
  const diasRestantes = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const trialExpirado = diffMs <= 0;
  const trialAtivo = !trialExpirado && empresa.status_assinatura === "TRIAL";

  const dataExpiracaoFormatada = trialFim.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  let mensagem: string;
  if (trialExpirado) {
    mensagem = "Seu trial expirou. Faca upgrade para continuar usando.";
  } else if (diasRestantes <= 3) {
    mensagem = `Atencao: seu trial expira em ${diasRestantes} dia${diasRestantes !== 1 ? "s" : ""}!`;
  } else {
    mensagem = `Seu trial expira em ${diasRestantes} dias.`;
  }

  return {
    status: trialExpirado ? "EXPIRADA" : empresa.status_assinatura,
    plano: empresa.plano,
    trial_ativo: trialAtivo,
    trial_expirado: trialExpirado,
    dias_restantes: diasRestantes,
    trial_inicio: empresa.trial_inicio?.toISOString() ?? null,
    trial_fim: empresa.trial_fim?.toISOString() ?? null,
    data_expiracao: dataExpiracaoFormatada,
    mensagem,
  };
}

// Verificar se uma empresa pode acessar o sistema
export function podeAcessarSistema(empresa: DadosTrial): boolean {
  if (empresa.status_assinatura === "ATIVA") return true;
  if (empresa.status_assinatura === "CANCELADA") return false;
  
  // Para trial, verificar se ainda nao expirou
  if (empresa.status_assinatura === "TRIAL" && empresa.trial_fim) {
    return new Date(empresa.trial_fim) > new Date();
  }
  
  // Contas sem trial_fim sao contas antigas/pagas
  if (!empresa.trial_fim) return true;
  
  return false;
}
```

## 3.3 Modificacao em `src/lib/permissoes.ts`

Adicionar funcao de verificacao de trial no fluxo de autenticacao. A funcao `exigirSessao` existente ja verifica se o usuario existe. Podemos adicionar uma verificacao separada para trial:

```typescript
// Nova funcao - nao substituir a existente
export async function verificarTrialExpirado(sessao: SessaoToken): Promise<{
  expirado: boolean;
  dadosTrial?: EstadoTrial;
}> {
  // Apenas EMPRESA tem trial. Funcionarios dependem da empresa.
  if (sessao.perfil !== "EMPRESA") {
    return { expirado: false };
  }

  const empresa = await prisma.empresa.findUnique({
    where: { id: sessao.id_empresa },
    select: {
      status_assinatura: true,
      trial_inicio: true,
      trial_fim: true,
      assinatura_inicio: true,
      assinatura_fim: true,
      plano: true,
    },
  });

  if (!empresa) {
    return { expirado: true };
  }

  const estado = calcularEstadoTrial(empresa);
  return {
    expirado: !podeAcessarSistema(empresa),
    dadosTrial: estado,
  };
}
```

## 3.4 Atualizacao do Middleware (`middleware.ts`)

Nao e necessario alterar o middleware.ts diretamente para verificacao de trial, pois:
- O middleware roda no Edge Runtime e nao tem acesso ao Prisma
- A verificacao de trial deve acontecer nas API routes e no layout do dashboard

Porem, precisamos adicionar as rotas de trial ao matcher para que elas nao sejam bloqueadas:

```typescript
export const config = {
  matcher: [
    "/resumo/:path*",
    "/kanban/:path*",
    "/equipe/:path*",
    "/configs/:path*",
    "/api/upload/:path*",
    "/api/trial/:path*",    // <- ADICIONAR: permitir acesso ao endpoint de trial
  ],
};
```

## 3.5 Verificacao de trial no Dashboard Layout

No arquivo `src/app/(dashboard)/layout.tsx`, adicionar verificacao de trial expirado apos a verificacao de sessao:

```typescript
// Apos a verificacao de usuarioValido:
const { expirado, dadosTrial } = await verificarTrialExpirado(sessao);

// Se o trial expirou, redirecionar para pagina de upgrade
// OU mostrar banner de trial expirado (decisao de produto)
// Recomendacao: mostrar banner vermelho no topo, nao bloquear acesso
```

A decisao de BLOQUEAR ou apenas AVISAR depende da regra de negocio. Recomendacao inicial: **apenas avisar com banner**, nao bloquear o acesso ainda. O bloqueio pode ser ativado depois que o sistema de pagamento estiver implementado.

## 3.6 Constantes adicionais em `src/lib/validacoes.ts`

```typescript
// === TRIAL SYSTEM ===
export const TRIAL_DURACAO_DIAS = 30;
export const MAX_REGISTROS_POR_IP = 3;
export const JANELA_BLOQUEIO_IP_DIAS = 30;

export const STATUS_ASSINATURA = {
  TRIAL: "TRIAL",
  ATIVA: "ATIVA",
  EXPIRADA: "EXPIRADA",
  CANCELADA: "CANCELADA",
} as const;

export type StatusAssinatura = typeof STATUS_ASSINATURA[keyof typeof STATUS_ASSINATURA];

export const PLANOS = {
  TRIAL: "trial",
  BASICO: "basico",
  PROFISSIONAL: "profissional",
  ENTERPRISE: "enterprise",
} as const;

export type Plano = typeof PLANOS[keyof typeof PLANOS];
```

## 3.7 Tipos em `src/lib/tipos.ts`

```typescript
// Adicionar apos os tipos existentes:
export type StatusAssinatura = "TRIAL" | "ATIVA" | "EXPIRADA" | "CANCELADA";
export type Plano = "trial" | "basico" | "profissional" | "enterprise";

export type EstadoTrial = {
  status: StatusAssinatura;
  plano: Plano;
  trial_ativo: boolean;
  trial_expirado: boolean;
  dias_restantes: number;
  trial_inicio: string | null;
  trial_fim: string | null;
  data_expiracao: string | null;
  mensagem: string;
};
```
