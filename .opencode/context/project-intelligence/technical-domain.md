<!-- Context: project-intelligence/technical | Priority: critical | Version: 1.3 | Updated: 2026-04-14 -->

# Technical Domain

Core concept: This project is a multi-tenant CRM built with Next.js App Router, TypeScript, Prisma, and Tailwind. The dominant implementation style is auth-first API handlers, feature-module hooks for UI orchestration, optimistic interactions with rollback, and event-driven automations for WhatsApp.

## Key Points
- Stack: Next.js 16, React 19, TypeScript 5, Prisma 5, SQLite, Tailwind v4, Vitest.
- Directory style: App Router endpoints in `src/app/api/**/route.ts` and feature slices in `src/modules/*`.
- API style: `exigirSessao` auth guard, permission gates, Zod `safeParse`, and `NextResponse.json` responses.
- Frontend style: hooks-first module orchestration, optimistic updates with rollback, and debounced autosave.
- Naming and security baseline: kebab-case/PascalCase conventions, JWT httpOnly cookie, bcrypt, and tenant scoping by `id_empresa`.
- WhatsApp automation: event-driven pattern with rules stored in database.

## Primary Stack
| Layer | Technology | Version | Rationale |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 | Unified SSR and API handlers |
| Runtime UI | React | 19.2.3 | Hooks and component composition |
| Language | TypeScript | 5 | Strong typing for handlers/components |
| ORM | Prisma | 5.22.0 | Typed schema and data access |
| Database | SQLite | current | Local-first, simple setup |
| Styling | Tailwind CSS | 4 | Fast utility-first styling |
| Testing | Vitest | 3.2.4 | Fast unit and route tests |

## Directory Patterns
- `src/app/`: routes and pages using App Router.
- `src/app/api/**/route.ts`: HTTP handlers by domain resource.
- `src/modules/*`: feature-centric hooks/components/pages (`kanban`, `equipe`, `configs`, `whatsapp`).
- `src/components/ui`: shared reusable primitives.
- `src/lib`: cross-cutting utilities (auth, permissions, validation, integrations, WhatsApp automations).
- WhatsApp automation: `src/lib/whatsapp-automations.ts` for event-driven orchestrator.

## Code Patterns

### API Endpoint
```ts
export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const body = await request.json();
  const validacao = schema.safeParse(body);
  if (!validacao.success) {
    return NextResponse.json({ erro: "Dados invalidos." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
```

### Module Hook Pattern
```tsx
const idTemporario = `temp-${Date.now()}`;
setLeads((atual) => [{ ...novoLead, id: idTemporario }, ...atual]);
const resposta = await fetch("/api/leads", { method: "POST", body: JSON.stringify(novoLead) });
if (!resposta.ok) {
  setLeads((atual) => atual.filter((lead) => lead.id !== idTemporario));
}
```

### WhatsApp Automation Pattern (Event-Driven)
```ts
// 1. Call automation function after action completes
import { executarAutomacoesLeadStageChanged } from "@/lib/whatsapp-automations";

await prisma.lead.update({ where: { id }, data: { id_estagio } });

// 2. Fire-and-forget with error logging
try {
  await executarAutomacoesLeadStageChanged({
    idEmpresa: auth.sessao.id_empresa,
    lead: { id: lead.id, nome: lead.nome, telefone: lead.telefone },
    estagioAnterior: { id: oldStage.id, nome: oldStage.nome },
    estagioNovo: { id: newStage.id, nome: newStage.nome },
  });
} catch (erro) {
  console.error("Erro ao executar automacoes WhatsApp:", erro);
}
```

### JSON Parse Error Handling
```ts
// Always handle parse errors gracefully
const json = await resposta.json().catch(() => ({}));
if (!resposta.ok) {
  setErro(json.erro ?? "Erro ao carregar dados.");
  return;
}
```

### Design System Colors (Dark Premium Theme)
```css
/* Cores principais */
--canvas: #09090b;       /* Background principal */
--surface: #0c0c0e;       /* Superfície de cards */
--surface-elevated: #111113;  /* Elementos elevados */

/* Cores de texto */
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--text-tertiary: #71717a;

/* Cores de marca */
--brand: #8b5cf6;        /* Roxo - Primary */
--success: #10b981;     /* Verde */
--danger: #f43f5e;      /* Vermelho */
--warning: #f59e0b;      /* Amarelo */
--info: #38bdf8;        /* Azul info */

/* Bordas */
--border-subtle: rgba(255,255,255,0.08);
--border-strong: #3f3f46;
```

### UI Components Disponíveis (src/components/ui/)
- `button.tsx` - Botões primários, secondary, ghost, destructive
- `input.tsx`, `textarea.tsx` - Campos de formulário
- `select.tsx` - Dropdowns (Radix UI)
- `dialog.tsx`, `sheet.tsx` - Modais e drawers
- `card.tsx`, `badge.tsx` - Cards e badges
- `table.tsx`, `tabs.tsx` - Estrutura de layout
- `toast.tsx`, `tooltip.tsx`, `popover.tsx` - Feedback
- `switch.tsx` - Toggle switches
- Uses Radix UI primitives + Tailwind merge

### Utils Disponíveis
```ts
import { cn } from "@/lib/utils";           // clsx + twMerge conditional
import { formataMoeda } from "@/lib/utils"; // R$ 1.234,56
import { formataData } from "@/lib/utils";   // DD/MM/AAAA
import { aplicaMascaraTelefoneBr } from "@/lib/utils";
import { aplicaMascaraMoedaBr } from "@/lib/utils";
import { converteMoedaBrParaNumero } from "@/lib/utils";
```

### API Helpers (src/lib/api/)
```ts
import { parseJson, validateBody } from "@/lib/api/route-validation";
// parseJson(request) → { ok, data } ou { ok: false, response }
validateBody(schema, payload) → { ok, data } ou { ok: false, response }

import { badRequest, forbidden, ok, notFound, serverError } from "@/lib/api/http";
// badRequest("msg") → 400 { erro }
// forbidden("msg") → 403 { erro }
// ok(data) → 200 data
// notFound("msg") → 404 { erro }

import { handleRouteError } from "@/lib/api/route-errors";
// handleRouteError(erro, "Contexto", "Prefixo") → 500 com log
```

## Design Patterns
- Feature module composition: `page.tsx` delegates logic to `use-*-module` hooks.
- Auth and RBAC gateway in API handlers before business logic.
- Controlled async UX with explicit loading, error, success, and rollback states.
- Debounce timers for autosave and transient UI status feedback.
- Event-driven automations: trigger → find matching rules → execute action.

## Naming Conventions
| Type | Convention | Example |
|---|---|---|
| Files | kebab-case | `modulo-equipe.tsx` |
| Components | PascalCase | `ModuloEquipe` |
| Functions | camelCase | `exigirSessao` |
| Database fields | snake_case | `id_empresa` |

## Code Standards
- TypeScript strict mode (`strict: true`).
- Validate request payloads with Zod `safeParse`.
- Use shared Prisma client from `@/lib/prisma`.
- Keep API handlers in `src/app/api/**/route.ts`.
- Use `@/*` alias for internal imports.
- Always handle JSON parse errors gracefully with `.catch(() => ({}))`.

## Security Requirements
- Validate all user input before persistence.
- Store sessions as signed JWT in httpOnly cookie.
- Hash passwords with bcrypt.
- Enforce role-based access (`EMPRESA`, `GERENTE`, `COLABORADOR`).
- Scope queries by tenant (`id_empresa`).

## 📂 Codebase References
### Core Patterns
- API route pattern: `src/app/api/leads/route.ts`
- Auth and RBAC helpers: `src/lib/permissoes.ts`
- Validation schemas: `src/lib/validacoes.ts` (modular: validacoes.crm.ts, validacoes.financeiro.ts, etc.)
- Session and JWT handling: `src/lib/autenticacao.ts`
- Utils core: `src/lib/utils.ts` (cn, formataMoeda, mascaraTelefone)
- HTTP helpers: `src/lib/api/http.ts` (badRequest, forbidden, ok, notFound)
- Route validation: `src/lib/api/route-validation.ts` (parseJson, validateBody)
- Route errors: `src/lib/api/route-errors.ts` (handleRouteError)

### Feature Modules (src/modules/*)
- Kanban: `src/modules/kanban/hooks/use-kanban-module.ts`
- Equipe: `src/modules/equipe/hooks/use-equipe-module.ts`
-WhatsApp: `src/modules/whatsapp/hooks/use-whatsapp-module.ts`
- Leads: `src/modules/leads/hooks/use-leads-module.ts`
- Chat: `src/modules/chat/hooks/use-chat-data.ts`
- Automacoes: `src/modules/automacoes/`
- Produto: `src/modules/produtos/`
- Recebimentos: `src/modules/recebimentos/`
- Onboarding: `src/modules/onboarding/`

### Integrations
- WhatsApp integration: `src/lib/evolution-api.ts`
- WhatsApp automations: `src/lib/whatsapp-automations.ts`
- Trial management: `src/lib/trial.ts`
- Instagram: `src/modules/instagram/`

### Data & Tooling
- Data model: `prisma/schema.prisma` (~739 lines)
- Package.json: `package.json`
- TypeScript config: `tsconfig.json`
- Tests: Vitest config

## Reference
- `.opencode/context/core/context-system/standards/mvi.md`
