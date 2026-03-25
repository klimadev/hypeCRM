# 30-Day Trial System - Plano de Implementacao

## Visao Geral

Sistema de trial de 30 dias para o Hype CRM. Novos usuarios auto-registrados recebem status "Trial" com contagem regressiva. O sistema bloqueia abuso via email duplicado e rastreamento de IP.

## Arquitetura Atual (pontos relevantes)

- **DB**: SQLite via Prisma. Modelo `Empresa` sem campos de assinatura/trial.
- **Auth**: JWT via `jose`, cookie `hype_sessao`, 3 perfis (EMPRESA, GERENTE, COLABORADOR).
- **Registro**: `POST /api/autenticacao/cadastro-empresa` - cria empresa + estagios do funil via transaction.
- **Middleware**: `middleware.ts` protege rotas verificando cookie de sessao.
- **Frontend**: Next.js App Router, layout dashboard em `src/app/(dashboard)/layout.tsx`, sidebar em `src/components/sidebar-principal.tsx`.
- **UI**: Componentes base em `src/components/ui/` (Card, Badge, Button, Dialog, Toast). Tailwind + clsx + tailwind-merge.
- **Validacao**: Zod schemas em `src/lib/validacoes.ts`.
- **Helpers API**: `src/lib/api/http.ts`, `route-guards.ts`, `route-errors.ts`, `route-validation.ts`.

## Escopo da Mudanca

### 1. Database Schema (1 arquivo)
- Adicionar campos de trial ao modelo `Empresa`
- Criar modelo `RegistroIP` para rastreamento de IP anti-abuso

### 2. Backend - Cadastro (1 arquivo)
- Modificar `POST /api/autenticacao/cadastro-empresa` para:
  - Capturar IP do request
  - Verificar bloqueio por email e IP
  - Definir status trial + data de expiracao automaticamente

### 3. Backend - Middleware de Sessao (2 arquivos)
- Criar helper de verificacao de trial expirado
- Integrar verificacao no `exigirSessao` ou criar middleware separado

### 4. Backend - API de Status Trial (1 arquivo novo)
- Criar `GET /api/trial/status` para o frontend consultar estado do trial

### 5. Frontend - Widget/Banner Trial (3-4 arquivos novos)
- Componente `TrialBanner` com countdown e data de expiracao
- Hook `useTrialStatus` para buscar dados via API
- Integrar no layout do dashboard

### 6. Frontend - Pagina de Cadastro (1 arquivo)
- Atualizar mensagens de erro para bloqueio por IP/email
- Adicionar indicador de trial no form

## Arquivos Afetados (resumo)

| Arquivo | Tipo de Mudanca |
|---------|----------------|
| `prisma/schema.prisma` | Adicionar campos trial + modelo RegistroIP |
| `src/app/api/autenticacao/cadastro-empresa/route.ts` | Logica anti-abuso + trial |
| `src/lib/tipos.ts` | Adicionar tipos de trial |
| `src/lib/validacoes.ts` | Adicionar constantes de trial |
| `src/lib/permissoes.ts` | Adicionar verificacao de trial |
| `src/lib/autenticacao.ts` | Adicionar trial ao SessaoToken |
| `src/app/api/trial/status/route.ts` | **NOVO** - endpoint de status |
| `src/components/trial-banner.tsx` | **NOVO** - componente banner |
| `src/modules/trial/hooks/use-trial-status.ts` | **NOVO** - hook de estado |
| `src/modules/trial/types.ts` | **NOVO** - tipagens do modulo |
| `src/app/(dashboard)/layout.tsx` | Integrar TrialBanner |
| `src/app/(auth)/cadastro/page.tsx` | Feedback de erro de trial |
| `middleware.ts` | Adicionar rotas de trial ao matcher |

## Ordem de Execucao

1. Schema Prisma (migration)
2. Tipos e constantes
3. Backend - cadastro com anti-abuso
4. Backend - API de status trial
5. Backend - verificacao de trial expirado
6. Frontend - hook + componente
7. Frontend - integracao no layout
8. Frontend - atualizacao da pagina de cadastro
