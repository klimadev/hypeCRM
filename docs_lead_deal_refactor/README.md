# Lead / Deal Refactor Plan

## Goal

Split the CRM into two clear domains:

- `Lead` = contact / prospect / owner of communication history
- `Deal` (`Negocio`) = commercial opportunity / pipeline card

Hard rules for the target state:

- the pipeline board must render only `Deal` cards
- `Lead` must have an independent CRUD flow
- creating a `Deal` must not require phone
- creating a `Deal` must allow `0`, `1`, or many linked leads
- leads can be attached to an existing deal later

## Why this folder exists

The current codebase still mixes lead and deal semantics in:

- database relations
- deal creation payloads
- the Kanban board
- lead details drawer
- parcel / product / finance screens
- realtime sync and pendency calculations

This folder is a step-by-step execution plan for the refactor. It is meant to be handed to another AI or engineer and executed in order.

## Read order

1. `01-audit-current-state.md`
2. `02-target-schema-and-migration.md`
3. `03-backend-ui-state-and-tests.md`

## Canonical implementation rules

- Do not keep `Lead` and `Deal` mixed in the same form or drawer.
- Do not render leads as pipeline cards.
- Do not hard delete records that affect history.
- Use transactions for multi-table writes.
- Keep the dark premium design system and existing UI primitives.

## Expected end state

- `/leads` becomes a real contact CRUD surface
- `/kanban` remains the route, but it becomes a `Deal` board
- `POST /api/leads` creates only a contact
- `POST /api/negocios` creates only a deal and optionally links leads
- lead-specific chat / contact history stays on the lead side
- parcel / product / revenue views read from the deal side

