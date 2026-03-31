# Current State Audit

## 1. Database

Current schema coupling found in `prisma/schema.prisma`:

- `Lead` still carries commercial data: `id_estagio`, `valor_oportunidade`, `probabilidade`, `motivo_perda`
- `Negocio` still requires a single `id_lead`
- `Lead` currently has `Negocio[]`, which is the wrong direction for the new model
- `Negocio` is treated as a wrapper around one lead instead of an independent opportunity
- `Parcela` still stores `id_lead` as the canonical contact reference
- `AutomacaoAgendamento`, `WhatsappMensagem`, `LeadProduto`, and `Pendencia` remain lead-scoped
- `NegocioProduto` and `NegocioEstagioLog` already exist, which is useful for the deal side

## 2. API

Current lead and deal APIs are mixed:

- `src/app/api/leads/route.ts` creates a lead with phone, value, stage, and responsible
- `src/app/api/leads/[id]/route.ts` updates phone, value, and responsible in the same payload
- `src/app/api/leads/[id]/mover/route.ts` moves a lead between pipeline stages and fires automations
- `src/app/api/negocios/route.ts` also asks for phone and internally creates a lead first
- `src/app/api/negocios/route.ts` serializes `negocio.Lead.*` back into the response
- there is no proper deal attach / detach endpoint for leads

## 3. Frontend

The Kanban module is the main source of confusion:

- `src/modules/kanban/types.ts` still models the board as `Lead[]`
- `src/modules/kanban/hooks/use-kanban-dados.ts` stores `leads`, not `negocios`
- `src/modules/kanban/hooks/use-kanban-derivacoes.ts` groups and filters by `lead.id_estagio`
- `src/modules/kanban/hooks/use-kanban-movimentacao.ts` drags leads, not deals
- `src/modules/kanban/components/kanban-board.tsx` renders lead cards directly on the board
- `src/modules/kanban/components/kanban-header.tsx` exposes a "Novo negocio" modal that still asks for phone
- `src/modules/kanban/components/lead-details-drawer.tsx` mixes contact data, commercial data, chat, parcels, and products in one drawer

The lead module is also incomplete:

- `src/modules/leads/page.tsx` is list-only
- there is no real "Add Lead" CTA
- the page still links back to `/kanban?lead=...`
- there is no dedicated lead hook / dialog / drawer module

## 4. Finance and related surfaces

These screens assume a single lead per deal:

- `src/app/api/recebimentos/route.ts`
- `src/app/api/parcelas/route.ts`
- `src/modules/recebimentos/components/*`
- `src/modules/kanban/hooks/use-lead-parcelas.ts`
- `src/modules/kanban/components/lead-parcelas-tab.tsx`
- `src/modules/kanban/components/lead-produtos-tab.tsx`

Current issue:

- they resolve a deal through `Negocio.Lead`
- the UI still uses the lead as the primary commercial entity

## 5. Automation and pendencies

These are still lead-driven:

- `src/lib/calculo-pendencias.ts`
- `src/lib/pendencias-dinamicas.ts`
- `src/lib/whatsapp-automations.ts`
- `src/lib/automacoes/agendamentos.ts`
- `src/modules/kanban/hooks/use-pendencias-globais.tsx`
- `src/modules/kanban/hooks/use-kanban-realtime.ts`

Current issue:

- lead stage changes drive automations
- pendency overlays are computed from lead stage
- realtime sync compares lead ids and lead stage changes

## 6. Key architectural decision for the refactor

The target model should be:

- `Lead` as a contact entity
- `Deal` as the commercial entity
- `Lead.id_negocio` as the ownership link to a deal
- `Negocio` as the board card
- `Negocio` may optionally keep a `lead_principal` style field if the UI needs one stable contact for chat / receipts / quick preview

That last point is a compatibility decision, not a business rule. If the implementation prefers to derive a representative lead at query time, that is acceptable, but the plan should stay consistent across API and UI.

