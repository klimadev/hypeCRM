# DX Reduction Plan

## Goal
- Reduce file count and token footprint aggressively while preserving all current features and visual quality.
- Keep the existing modular architecture (`src/modules/*`) and Next.js App Router security/validation standards.

## Baseline and Targets
- Baseline (reported): `~180+ files`, `~230k tokens`.
- Target range after refactor:
  - File count: `-25%` to `-40%`.
  - Token count: `-30%` to `-45%`.
  - UI regressions: `0` critical regressions.
  - API behavior regressions: `0` breaking contract changes.

## Completed Refactors (Abril 2026)

### Lote A — Chat Panel Decomposition
**Target**: `src/modules/chat/components/chat-panel.tsx` (881 linhas)
**Result**: Extraídos 5 componentes focados
- `chat-info-card.tsx` — InfoCard presentacional
- `chat-orphan-dialog.tsx` — Diálogo de criação lead/negócio
- `chat-transfer-lead-dialog.tsx` — Transferência de responsabilidade
- `chat-follow-up-card.tsx` — Card de follow-up automático

### Lote B — Chat Messages Panel Decomposition
**Target**: `src/modules/chat/components/chat-messages-panel.tsx` (670 linhas)
**Result**: Separação em 2 componentes especializados
- `chat-message-list.tsx` — Rendering, agrupamento por data, media lazy-load, scroll anchor
- `chat-message-composer.tsx` — Composer, shortcuts, agendamento

### Lote C — Automações Module Decomposition
**Target**: `src/modules/automacoes/page.tsx` (701 linhas)
**Result**: Extrações em 3 camadas
- `lib/workflow-graph-utils.ts` — Utilitários puros de grafo
- `lib/automacoes-logs.ts` — Parsing de logs de execução
- `hooks/use-workflow-validation.ts` — Validação de workflow
- `hooks/use-automacoes-workspace-io.ts` — IO (load/save/publish/unpublish)
- `hooks/use-whatsapp-instancias-conectadas.ts` — Instâncias conectadas
- `components/automacoes-logs-section.tsx` — Seção de logs
- `components/automacoes-canvas-status.tsx` — Status card
- `components/automacoes-canvas-toolbar.tsx` — Toolbar flutuante

### Lote D — API Consistency
**Target**: `src/app/api/chat/messages/route.ts` (262 linhas → 179 linhas)
**Result**: Centralização de tratamento de erros Instagram
- `lib/api/instagram-errors.ts` — `instagramErrorToResponse()` padronizado
- Rota reduzida em ~32% (83 linhas removidas)

## Priority Order
1. Remove dead files and thin wrappers (fast wins).
2. Consolidate repeated UI shells/headers/alerts.
3. Decompose God-hooks into reusable hooks and service functions.
4. Abstract API route boilerplate (session, validation, errors).
5. Consolidate WhatsApp automation/chat surfaces.
6. Remove now-unused dependencies and run full validation.

## Plan Index
- `01-audit-findings.md`: Architectural redundancies and candidates.
- `02-file-matrix.md`: Exact file-level action map (delete/merge/create/update).
- `03-ui-consolidation.md`: ModulePageHeader and reusable shell strategy.
- `04-hook-refactor.md`: God-hook decomposition into standard reusable patterns.
- `05-api-abstractions.md`: Route utility abstractions and migration sequence.
- `06-execution-playbook.md`: Step-by-step AI execution order with gates.

## Hard Constraints
- Preserve business rules (perfil, tenant scoping, pendencias dynamicas, WhatsApp idempotencia).
- Preserve visual polish, gradients, status chips, and interaction feedback.
- No breaking changes to route contracts unless explicitly listed and versioned.
- Keep Next 15+ async dynamic params pattern and Zod validation coverage.

## Quality Gates (every major phase)
- Lint passes.
- Build passes.
- Tests pass.
- Manual review on:
  - Kanban: drag/drop, lead create/edit/move, pendencias behavior.
  - Equipe: filtering, inativacao, lote, PDV management.
  - WhatsApp: instancia lifecycle, automations CRUD, chat panel.
  - Auth flow: login/cadastro/logout and dashboard access restrictions.
