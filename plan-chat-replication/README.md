# Chat Replication Plan for HypeCRM

Audit date: 2026-03-31

This folder documents how to port the full `/chat` module from `/var/www/crmconsorcio` into `/var/www/hypeCRM` without implementing the feature yet.

## Executive summary

The source implementation in `crmconsorcio` is not a Socket.io/WebSocket chat. It is a lead-centric WhatsApp inbox built on:

- Next.js App Router pages and route handlers
- Prisma + SQLite persistence
- local React hooks and component state
- SSE via `EventSource`
- server-side polling/caching in `src/lib/whatsapp-chat-realtime.ts`
- Evolution API as the external transport

`hypeCRM` already contains part of the WhatsApp chat kernel:

- persisted `WhatsappMensagem` and `WhatsappInstancia` models
- `GET /api/whatsapp/chat/messages`
- `POST /api/whatsapp/chat/send-message`
- `POST /api/whatsapp/chat/mark-read`
- `GET /api/whatsapp/chat/media`
- drawer-level chat UI inside the Negócio details panel
- richer media rendering than the source for image/audio payloads

What is still missing in `hypeCRM` for parity with `/var/www/crmconsorcio`:

- the top-level `/chat` dashboard page
- the `src/modules/chat` module
- conversations list APIs
- SSE stream routes for messages and conversations
- the realtime orchestration layer `src/lib/whatsapp-chat-realtime.ts`
- navigation entries for `/chat`
- lead-context side panel data flow for the standalone chat page
- source UX details such as date separators and conversation search/filtering

## Key architectural findings

- State management is local React state only. There is no Zustand, Redux, or Context store dedicated to chat.
- The persisted model is `leadId`-centric. There is no real `conversations` table and no `participants` table.
- Conversations are derived from `WhatsappMensagem` joined with `Lead`.
- Access control is role-scoped in query logic:
  `EMPRESA` sees company-wide records, `GERENTE` sees only PDV collaborators, `COLABORADOR` sees only owned leads.
- Source `/chat` is available to authenticated users in the sidebar, not only admins.
- The source composer visually exposes emoji and paperclip buttons, but there is no outbound emoji picker or media upload workflow implemented.
- Inbound media exists through `/api/whatsapp/chat/media`, but the source page mainly special-cases audio. `hypeCRM` already has a more advanced media renderer.

## Recommended migration approach

Port behavior, not styling.

Use the `crmconsorcio` module as the functional reference for:

- route structure
- SSE orchestration
- conversation list behavior
- unread counts
- lead-context side panel behavior
- role-based query scoping

Use `hypeCRM` as the visual and domain reference for:

- design tokens and CSS variables
- `ModulePageShell`
- `ModulePageHeader`
- current dark/glass card language
- richer media bubble rendering already present in the drawer chat
- Negócio-aware CRM vocabulary

## Recommended product decisions

- Keep the standalone inbox lead-centric for v1.
  The persisted schema, unread logic, and source endpoints are all keyed by `id_lead`. Aggregating by `Negocio` would be a second project and adds avoidable bugs.
- Preserve the existing drawer chat while adding the standalone `/chat` module.
  The new module should reuse the same chat core rather than replacing the drawer.
- Add realtime through SSE exactly like the source.
  Do not introduce Socket.io, Pusher, Supabase Realtime, or new dependencies.
- Standardize chat internals on `leadId`.
  `hypeCRM` currently uses `contatoId` in the hook while all APIs and DB rows are still `leadId`-based. Keep a temporary alias for backward compatibility during migration.

## Main gaps versus HypeCRM today

| Area | `crmconsorcio` | `hypeCRM` today | Action |
| --- | --- | --- | --- |
| Standalone page | `/chat` exists | no `/chat` route | add route + module |
| Conversations list | yes | no | add endpoints + UI |
| Realtime | SSE + shared polling cache | client polling only | port realtime layer |
| Message stream route | yes | no | add `/messages/stream` |
| Conversations stream route | yes | no | add `/conversations/stream` |
| Context side panel | lead details shown in chat page | no standalone side panel | add dedicated context endpoint/hook |
| Message grouping | date separators | flat list | port grouping |
| Navigation | sidebar has `Chat` | no chat menu item | update sidebar + mobile dock |
| Media rendering | basic audio emphasis | richer image/audio support | preserve Hype implementation |
| Domain vocabulary | pure Lead CRM | Negócio + lead principal | adapt context panel only, keep message storage lead-centric |

## Files in this folder

- `01-source-audit.md`
  Exact architecture, endpoints, data model, dependencies, and gap analysis.
- `02-implementation-plan.md`
  File-by-file migration plan and step sequence for the next AI/code pass.
- `03-test-and-rollout.md`
  Verification matrix, regression checklist, and rollout safeguards.

