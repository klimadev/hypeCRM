# Backend, UI, State and Tests

## 1. Backend service layer

Create domain services before rewriting routes.

Recommended location:

- `src/lib/domains/leads.ts`
- `src/lib/domains/negocios.ts`
- `src/lib/domains/negocio-leads.ts`

Minimum services:

- `criarLeadContato`
- `atualizarLeadContato`
- `criarNegocio`
- `atualizarNegocio`
- `moverNegocioDeEstagio`
- `vincularLeadsAoNegocio`
- `desvincularLeadsDoNegocio`
- `montarDtoLead`
- `montarDtoNegocio`
- `montarDtoPipelineNegocios`

Do not keep this logic duplicated in route files.

## 2. API route split

### Lead API

`Lead` routes should be contact-only.

Recommended payloads:

- `POST /api/leads`
- `PATCH /api/leads/[id]`
- `DELETE /api/leads/[id]` as soft delete only
- `GET /api/leads/[id]`
- `GET /api/leads/[id]/negocios`

Lead payload should not require:

- `telefone` inside deal creation
- `id_estagio`
- `valor_oportunidade`
- `probabilidade`
- `motivo_perda`

### Deal API

`Deal` routes should own pipeline and commercial data.

Recommended payloads:

- `GET /api/negocios`
- `POST /api/negocios`
- `GET /api/negocios/[id]`
- `PATCH /api/negocios/[id]`
- `PATCH /api/negocios/[id]/mover`
- `PATCH /api/negocios/[id]/leads`
- `POST /api/negocios/[id]/leads`
- `DELETE /api/negocios/[id]/leads/[leadId]`

The create payload must support:

- `titulo`
- `valor_estimado`
- `id_estagio`
- `id_funcionario`
- `lead_ids?: string[]`

The create payload must not support:

- `telefone`

## 3. Lead creation flow

Add a true independent lead CRUD surface.

Files to create / refactor:

- `src/modules/leads/hooks/use-leads-module.ts`
- `src/modules/leads/components/*`
- `src/modules/leads/types.ts`
- `src/lib/api/leads.ts`

UI requirements:

- add a visible `Add Lead` / `Novo Lead` CTA
- create and edit leads from the leads page
- keep the page contact-centric
- show attached deal summary, not pipeline columns

Suggested lead page actions:

- create lead
- edit lead
- delete lead using soft delete
- attach to deal
- open deal

## 4. Deal creation and editing flow

The current deal modal must be rewritten.

Current wrong behavior:

- asks for phone
- creates a lead implicitly
- uses lead-centric labels

New behavior:

- create a deal without phone
- allow zero leads selected
- allow many leads selected
- allow attaching or removing leads later

Important UI detail:

- the lead picker must support multi-selection
- if a lead already belongs to another deal, the UI must make the transfer explicit
- if there is no selected lead, the form is still valid

## 5. Kanban / Pipeline refactor

The pipeline board must become deal-centric.

Current files to refactor:

- `src/modules/kanban/types.ts`
- `src/modules/kanban/hooks/use-kanban-dados.ts`
- `src/modules/kanban/hooks/use-kanban-derivacoes.ts`
- `src/modules/kanban/hooks/use-kanban-movimentacao.ts`
- `src/modules/kanban/hooks/use-kanban-detalhes-lead.ts`
- `src/modules/kanban/hooks/use-kanban-operacoes.ts`
- `src/modules/kanban/hooks/use-kanban-realtime.ts`
- `src/modules/kanban/components/kanban-board.tsx`
- `src/modules/kanban/components/kanban-header.tsx`
- `src/modules/kanban/components/lead-details-drawer.tsx`
- `src/modules/kanban/components/lead-details-tab-content.tsx`
- `src/modules/kanban/components/lead-parcelas-tab.tsx`
- `src/modules/kanban/components/lead-produtos-tab.tsx`

State rename direction:

- `leads` -> `negocios`
- `leadSelecionado` -> `negocioSelecionado`
- `criarLead` -> `criarNegocio`
- `dialogNovoLeadAberto` -> `dialogNovoNegocioAberto`
- `leadRef` -> `negociosRef`
- `moverLeadKanban` -> `moverNegocioKanban`

Board data rules:

- group by `negocio.id_estagio`
- filter by business fields, not lead fields
- search by business title and, optionally, attached lead names
- do not render leads as cards
- show lead attachments as secondary metadata only

Lead-only filters to remove from the board:

- pendency overlays based on lead stage
- origin-based board grouping
- any action that implies the lead is the pipeline card itself

## 6. Drawer split

The current drawer is a mixed surface and must be split into two pieces.

### Lead drawer

Use it on the leads page.

It should contain:

- contact details
- owner / PDV
- lead-specific WhatsApp chat
- lead-specific history
- lead-specific products if those stay contact-scoped

### Deal drawer

Use it on the pipeline board.

It should contain:

- deal title
- stage and status
- responsible owner
- attached leads
- product summary
- parcel summary
- commercial notes

If chat is needed from the deal drawer:

- the drawer must resolve one lead to use as the chat contact
- if the deal has multiple leads, expose a lead switcher
- if the deal has zero leads, disable chat with a clear empty state

## 7. Other screens that must move from lead-centric to deal-centric

Update the following surfaces:

- `src/app/api/recebimentos/route.ts`
- `src/modules/recebimentos/components/*`
- `src/app/api/parcelas/route.ts`
- `src/modules/kanban/hooks/use-lead-parcelas.ts`
- `src/modules/kanban/components/lead-parcelas-tab.tsx`
- `src/modules/kanban/components/lead-produtos-tab.tsx`
- `src/app/api/negocios/[id]/produtos/*`
- `src/app/api/leads/[id]/produtos/*`

Rule:

- deal finance and deal products must read from `Negocio`
- contact-level products and contact-level chat remain on `Lead`

## 8. App routes

Keep the thin server route pattern intact.

Recommended changes:

- `src/app/(dashboard)/leads/page.tsx` should keep importing the lead module, but the module itself must become a real CRUD surface
- `src/app/(dashboard)/kanban/page.tsx` should keep the route path, but import a deal module instead of a lead board

## 9. Tests

Add or update tests in three layers.

### Schema / service tests

- migration script idempotency
- lead-to-deal attachment
- deal creation with zero leads
- deal creation with multiple leads
- lead reassignment between deals

### API tests

- `POST /api/leads` does not require deal fields
- `POST /api/negocios` does not require phone
- `PATCH /api/negocios/[id]/leads` attaches and detaches leads
- `PATCH /api/negocios/[id]/mover` updates stage history correctly

### UI tests

- leads page shows an explicit `Add Lead` action
- deal modal shows lead picker and no phone field
- pipeline board does not render lead cards
- pipeline card count is based on deals, not leads

## 10. Rollout order

Implement in this order:

1. add the target relation and migration safety net
2. introduce the new backend services and deal attach endpoints
3. split lead CRUD from deal CRUD in the UI
4. rename the Kanban state from lead-centric to deal-centric
5. move finance / product / receipt screens to deal sources
6. clean up legacy columns and legacy route assumptions
7. add tests and run the backfill validation

