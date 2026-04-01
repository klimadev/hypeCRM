# 02. Implementation Plan

## Goal

Replicate the full `/chat` experience from `/var/www/crmconsorcio` into `/var/www/hypeCRM` with functional parity, while adapting the visuals to HypeCRM's design system and preserving the current Negócio drawer chat.

## Non-goals for the first pass

- no migration to Socket.io/WebSockets
- no outbound file upload
- no emoji picker implementation
- no aggregation of multiple leads into one Negócio-level chat thread
- no rewrite of the existing drawer chat from scratch

## Implementation principles

1. Reuse the existing `hypeCRM` WhatsApp chat core whenever possible.
2. Port the source realtime and conversations layer from `crmconsorcio`.
3. Keep the data model lead-centric.
4. Preserve backward compatibility for the current drawer tab.
5. Use Hype design tokens and shared shell/header components instead of WhatsApp-green styling.

## Recommended target file map

### New files to add

- `src/app/(dashboard)/chat/page.tsx`
- `src/modules/chat/index.ts`
- `src/modules/chat/page.tsx`
- `src/modules/chat/types.ts`
- `src/modules/chat/hooks/use-chat-list.ts`
- `src/modules/chat/hooks/use-chat-module.ts`
- `src/modules/chat/hooks/use-chat-context.ts`
- `src/modules/chat/components/chat-layout.tsx`
- `src/modules/chat/components/chat-list-panel.tsx`
- `src/modules/chat/components/chat-list-item.tsx`
- `src/modules/chat/components/chat-search.tsx`
- `src/modules/chat/components/chat-messages-panel.tsx`
- `src/modules/chat/components/chat-context-panel.tsx`
- `src/app/api/whatsapp/chat/conversations/route.ts`
- `src/app/api/whatsapp/chat/conversations/stream/route.ts`
- `src/app/api/whatsapp/chat/messages/stream/route.ts`
- `src/app/api/whatsapp/chat/context/route.ts`
- `src/lib/whatsapp-chat-realtime.ts`

### Existing files to update

- `src/lib/api/whatsapp.ts`
- `src/modules/whatsapp/hooks/use-whatsapp-chat.ts`
- `src/modules/whatsapp/components/chat/whatsapp-message-list.tsx`
- `src/modules/whatsapp/components/chat/whatsapp-chat-panel.tsx`
- `src/components/sidebar-principal.tsx`
- `src/components/mobile-bottom-dock.tsx`
- `src/modules/onboarding/lib/selectors.ts`
  Only if `/chat` should become part of onboarding.
- `src/lib/whatsapp-chat.integration.test.ts`
- `src/lib/whatsapp-chat.test.ts`

## Phase 1. Stabilize the shared chat core before adding the page

### Files

- `src/modules/whatsapp/hooks/use-whatsapp-chat.ts`
- `src/lib/api/whatsapp.ts`

### Actions

- Introduce a backward-compatible hook signature:

```ts
type UseWhatsappChatParams = {
  leadId?: string;
  contatoId?: string;
  enabled: boolean;
  markReadEnabled: boolean;
  pollMs?: number;
};
```

- Resolve a single internal identifier:

```ts
const resolvedLeadId = leadId ?? contatoId;
```

- Keep current drawer consumers working without immediate refactors.
- Add back `assinarMensagensWhatsapp` to the API client.
- Update `useWhatsappChat` to use SSE when available and fall back to polling/backoff exactly like the source.
- Do not remove the current optimistic-send and media compatibility code already working in Hype.

### Why this comes first

The standalone `/chat` page and the existing drawer should share the same message hook. If the hook contract is ambiguous, the rest of the port becomes brittle.

### Acceptance criteria

- existing drawer chat still works with `contatoId`
- new code paths can use `leadId`
- hook supports `EventSource` snapshots
- polling remains as fallback and for error recovery

## Phase 2. Port the realtime orchestration layer

### Files

- add `src/lib/whatsapp-chat-realtime.ts`

### Base reference

- `/var/www/crmconsorcio/src/lib/whatsapp-chat-realtime.ts`

### Actions

- Port the source file almost wholesale.
- Adapt Prisma relation names and imports to `hypeCRM`.
- Keep these constants unless product requires a different tuning:
  `HEARTBEAT_MS = 15000`
  `DEFAULT_MESSAGES_POLL_MS = 10000`
  `DEFAULT_CONVERSATIONS_POLL_MS = 10000`
  `CHAT_SYNC_TTL_MS = 8000`
- Preserve the in-memory global state pattern:
  `channels` + `chatCache`
- Preserve chat snapshot caching and hash-based dedupe.

### Required adaptations for Hype

- Use `hypeCRM` relation names:
  `Funcionario`, `Pdv`, `WhatsappInstancia`
- Keep the Hype `mapearMensagemDbParaCanonica` behavior that already supports raw media kinds
- Keep all logic keyed by `id_lead`

### Acceptance criteria

- one reusable realtime helper serves both chat messages and conversation list
- no duplicated polling logic in route handlers
- snapshot functions are callable from both REST and SSE routes

## Phase 3. Add the missing REST and SSE endpoints

### Files

- add `src/app/api/whatsapp/chat/conversations/route.ts`
- add `src/app/api/whatsapp/chat/conversations/stream/route.ts`
- add `src/app/api/whatsapp/chat/messages/stream/route.ts`
- add `src/app/api/whatsapp/chat/context/route.ts`
- update `src/lib/validacoes.ts` only if a dedicated context query schema is added

### Actions

- Port `conversations` and `messages/stream` routes from the source.
- Add `runtime = "nodejs"` and `dynamic = "force-dynamic"` on SSE routes.
- Keep conversation query parameters compatible with the source:
  `busca`
  `cursor`
  `limite`
  `naoLidas`
- Add a new Hype-specific context endpoint rather than mutating the generic `/api/leads/[id]` contract.

### Recommended context endpoint contract

Use:

- `GET /api/whatsapp/chat/context?leadId=...`

Recommended response:

```ts
type ChatContextResponse = {
  lead: {
    id: string;
    nome: string;
    telefone: string;
    origem: "MANUAL" | "SINCRONIZACAO_WHATSAPP" | "ANUNCIO_CTWA";
    anuncio_titulo: string | null;
    anuncio_descricao: string | null;
    observacoes: string | null;
    funcionario: { id: string; nome: string } | null;
    pdv: { id: string; nome: string } | null;
    gestores: Array<{ nome: string }>;
  } | null;
  negocio: {
    id: string;
    titulo: string;
    status: string;
    valor_estimado: number;
    id_estagio: string;
  } | null;
  leadsVinculados: Array<{
    id: string;
    nome: string;
    telefone: string;
  }>;
  parcelas: Array<{
    id: string;
    numero_parcela: number;
    valor: number;
    data_vencimento: string;
    status: string;
  }>;
};
```

### Why a dedicated endpoint is recommended

- `crmconsorcio` returns flat lead details from `/api/leads/[id]`
- `hypeCRM` already returns `{ lead: ..., negocio: ... }` with a different shape
- changing the generic lead endpoint risks breaking unrelated screens
- chat context is a dedicated view model and should remain local to chat

### Acceptance criteria

- conversations REST endpoint works standalone
- conversations SSE endpoint emits snapshots
- messages SSE endpoint emits snapshots
- context endpoint returns everything needed by the right-side panel without extra client joins

## Phase 4. Build the standalone `src/modules/chat`

### Files

- all new files under `src/modules/chat`

### Base references

- `/var/www/crmconsorcio/src/modules/chat/*`

### Actions

- Port the source module structure:
  `types`
  `use-chat-list`
  `use-chat-module`
  `chat-layout`
  `chat-list-panel`
  `chat-list-item`
  `chat-search`
  `chat-messages-panel`
- Replace the source lead-details fetch with a Hype-specific `useChatContext` hook that calls `/api/whatsapp/chat/context`.
- Keep the center messages panel powered by the shared `useWhatsappChat`.

### Hype-specific UI adaptations

- Wrap the page with `ModulePageShell`
- Add a `ModulePageHeader`
- Use `--surface`, `--surface-elevated`, `--brand`, `--border-subtle`, `--text-*`
- Reuse `Button`, `Input`, `Card`, and existing Hype tokens
- Avoid hardcoded source greens:
  `#075e54`
  `#128c7e`
  `#00a884`
  `#d9fdd3`

### Recommended page structure in Hype

- top header with module title and operational subtitle
- main shell with a 3-column layout inside a dark tokenized card
- left column:
  conversations list
- center column:
  `WhatsappChatPanel`
- right column:
  Hype-specific context panel with lead + negócio summary

### Acceptance criteria

- desktop layout is 3-column
- mobile collapses to source-style progressive flow
- search/unread filter/load more work
- selecting a conversation loads context + messages

## Phase 5. Merge source behavior with current Hype message UI

### Files

- `src/modules/whatsapp/components/chat/whatsapp-message-list.tsx`
- `src/modules/whatsapp/components/chat/whatsapp-message-bubble.tsx`
- `src/modules/whatsapp/components/chat/whatsapp-chat-panel.tsx`

### Actions

- Port date grouping from source `WhatsappMessageList`.
- Keep Hype's richer media rendering for:
  `imageMessage`
  `audioMessage`
  `videoMessage`
- Do not downgrade to the source placeholder-only implementation.
- If sequential audio autoplay is desired, port only that part from the source list logic.
- Keep Hype tokenized styling in the panel shell and message input.

### Important bug-prevention note

Do not copy the source `WhatsappChatMessage.kind` type union verbatim.

Reason:

- the source types are looser and partially inconsistent with the real normalized values
- Hype already supports raw message kinds used by media rendering

Recommended rule:

- keep Hype's current message-kind union
- port behavior, not the weaker typing

### Acceptance criteria

- date separators render correctly
- media rendering still works
- optimistic send/retry still works
- no regression in the existing drawer chat

## Phase 6. Add the dashboard route and navigation

### Files

- add `src/app/(dashboard)/chat/page.tsx`
- update `src/components/sidebar-principal.tsx`
- update `src/components/mobile-bottom-dock.tsx`

### Actions

- Add a new page route mirroring the source:

```ts
import { ModuloChat } from "@/modules/chat";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { redirect } from "next/navigation";

export default async function PaginaChat() { ... }
```

- Recommended access policy:
  allow all authenticated roles

Reason:

- this mirrors the source
- backend scoping already enforces role visibility
- collaborators can safely operate on their own assigned leads

- Add `/chat` navigation entry to the sidebar.
- Add `/chat` to the mobile dock or the “Mais” sheet.
- Use a distinct icon from `/whatsapp`, preferably `MessageSquare`.

### Acceptance criteria

- `/chat` is routable
- sidebar entry highlights correctly
- mobile navigation includes the module

## Phase 7. Add tests before exposing the page broadly

### Files

- add `src/lib/whatsapp-chat-realtime.test.ts`
- update `src/lib/whatsapp-chat.test.ts`
- update `src/lib/whatsapp-chat.integration.test.ts`
- add route tests for conversations endpoints if the team prefers route-level coverage

### Actions

- Cover derived conversation snapshots
- Cover unread-only filter behavior
- Cover cursor pagination behavior
- Cover SSE helper behavior at the unit level where feasible
- Cover `PDV_SEM_INSTANCIA`
- Cover message dedupe and stronger-status merge
- Fix `hypeCRM` integration test default port

Important:

`hypeCRM` currently has copied integration tests still defaulting to:

```ts
const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3333";
```

But the Hype app runs on:

- `3434` in `dev`
- `3434` in `start`

That mismatch should be corrected during the implementation pass.

## Phase 8. Final regression checklist before considering the feature done

### Must still work after the migration

- existing Negócio drawer chat
- `/api/whatsapp/chat/messages`
- `/api/whatsapp/chat/send-message`
- `/api/whatsapp/chat/mark-read`
- `/api/whatsapp/chat/media`
- WhatsApp instance management page
- lead sync from WhatsApp

### Must now exist

- `/chat`
- conversation list API
- conversation list SSE
- message SSE
- context panel endpoint

## Definition of done

- Hype has a standalone `/chat` page with the same functional surface as the source
- messages and conversation list update through SSE
- the page uses HypeCRM visual tokens instead of source WhatsApp-green styles
- the drawer chat remains functional
- role scoping works for all three perfis
- tests cover the new realtime and conversations logic

