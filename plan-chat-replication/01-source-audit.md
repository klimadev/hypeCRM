# 01. Source Audit

## 1. Source file inventory in `crmconsorcio`

| File | Role |
| --- | --- |
| `/var/www/crmconsorcio/src/app/(dashboard)/chat/page.tsx` | top-level `/chat` route |
| `/var/www/crmconsorcio/src/modules/chat/page.tsx` | module bootstrap, selected conversation state, lead-context fetch |
| `/var/www/crmconsorcio/src/modules/chat/hooks/use-chat-list.ts` | conversations fetch, search, unread filter, pagination, SSE subscription |
| `/var/www/crmconsorcio/src/modules/chat/hooks/use-chat-module.ts` | selected conversation + mobile panel toggles |
| `/var/www/crmconsorcio/src/modules/chat/components/chat-layout.tsx` | 3-column responsive layout |
| `/var/www/crmconsorcio/src/modules/chat/components/chat-list-panel.tsx` | sidebar with search, unread filter, load more |
| `/var/www/crmconsorcio/src/modules/chat/components/chat-list-item.tsx` | row rendering with unread badge, source badge, preview |
| `/var/www/crmconsorcio/src/modules/chat/components/chat-messages-panel.tsx` | bridge from selected conversation to WhatsApp chat core |
| `/var/www/crmconsorcio/src/modules/chat/components/chat-client-panel.tsx` | lead metadata side panel |
| `/var/www/crmconsorcio/src/modules/whatsapp/hooks/use-whatsapp-chat.ts` | message state, optimistic send, mark-read, SSE subscription |
| `/var/www/crmconsorcio/src/modules/whatsapp/components/chat/*` | reusable message panel, list, bubbles, input, connection badge |
| `/var/www/crmconsorcio/src/lib/whatsapp-chat-realtime.ts` | SSE channel manager, polling, snapshot caching, derived conversations query |
| `/var/www/crmconsorcio/src/lib/whatsapp-chat.ts` | Evolution API integration, normalization, DB upsert, mark-read, media |
| `/var/www/crmconsorcio/src/app/api/whatsapp/chat/*` | internal REST/SSE API surface consumed by the frontend |

## 2. Frontend architecture

The source page is a three-part inbox:

- conversations sidebar
- message panel
- client/lead details panel

Responsive behavior:

- desktop: 3 columns
- mobile: message panel and client panel toggle within the center column

The source module is composed of two small local hooks:

- `useChatList`
  handles list fetch, search term, unread-only filter, cursor pagination, and SSE resubscription
- `useChatModule`
  handles `conversaSelecionada` and the mobile details toggle

The message panel itself does not have a second chat implementation. It reuses the existing WhatsApp drawer stack:

- `useWhatsappChat`
- `WhatsappChatPanel`
- `WhatsappMessageList`
- `WhatsappMessageBubble`
- `WhatsappMessageInput`

This is important because the migration target should also avoid building two different chat cores.

## 3. State management pattern

Exact pattern found in the source:

- React `useState`
- React `useEffect`
- React `useRef`
- React `useMemo`
- React `useCallback`
- native `fetch`
- native `EventSource`

Not found:

- Zustand
- Redux
- Context store dedicated to chat
- TanStack Query
- SWR

Conclusion:

- the architecture is intentionally local and route-scoped
- replication should stay hook-based and should not introduce a global store unless there is a new requirement

## 4. Realtime architecture

The source does realtime through SSE, not WebSockets.

### Client side

`/var/www/crmconsorcio/src/lib/api/whatsapp.ts` exposes:

- `assinarMensagensWhatsapp(leadId, handlers)`
- `assinarConversasWhatsapp(params, handlers)`

Both functions open `new EventSource(...)` against internal stream routes.

### Server side

`/var/www/crmconsorcio/src/lib/whatsapp-chat-realtime.ts` implements:

- in-memory global channel registry
- one channel per chat or per conversation-list query signature
- heartbeat events every 15 seconds
- polling loop every 10 seconds
- hash comparison to suppress duplicate snapshots
- chat snapshot TTL cache of 8 seconds

### Important consequence

The source is closer to:

- `EventSource` on the client
- polling + diffing on the server

than to:

- WebSocket
- Socket.io
- Pusher
- Supabase Realtime

## 5. Backend and API endpoints

### Internal app endpoints used by `/chat`

| Method | Path | Purpose | Notes |
| --- | --- | --- | --- |
| `GET` | `/chat` | dashboard page | authenticated page route |
| `GET` | `/api/whatsapp/chat/conversations` | paginated conversation summaries | params: `busca`, `cursor`, `limite`, `naoLidas` |
| `GET` | `/api/whatsapp/chat/conversations/stream` | SSE conversation updates | same filters except cursor |
| `GET` | `/api/whatsapp/chat/messages?leadId=...` | message snapshot | returns messages, connection status, unread count |
| `GET` | `/api/whatsapp/chat/messages/stream?leadId=...` | SSE message updates | per-lead channel |
| `POST` | `/api/whatsapp/chat/send-message` | outbound text send | body: `leadId`, `text`, `clientTempId` |
| `POST` | `/api/whatsapp/chat/mark-read` | mark inbound messages as read | body: `leadId` |
| `GET` | `/api/whatsapp/chat/media?leadId=...&messageId=...` | fetch inbound media as base64 | used for media playback/render |

### Internal validation contracts

From `/var/www/crmconsorcio/src/lib/validacoes.ts`:

```ts
export const esquemaWhatsappChatMessagesQuery = z.object({
  leadId: z.string().trim().min(1, "Lead obrigatorio."),
});

export const esquemaWhatsappChatSendMessage = z.object({
  leadId: z.string().trim().min(1, "Lead obrigatorio."),
  text: z.string().trim().min(1, "Mensagem obrigatoria.").max(4096, "Mensagem muito longa."),
  clientTempId: z.string().trim().min(1, "ID temporario obrigatorio."),
});

export const esquemaWhatsappChatMarkRead = z.object({
  leadId: z.string().trim().min(1, "Lead obrigatorio."),
});
```

### External Evolution API endpoints actually used by chat

From `/var/www/crmconsorcio/src/lib/whatsapp-chat.ts`:

| Method | External path | Purpose |
| --- | --- | --- |
| `GET` | `${EVOLUTION_API_URL}/instance/connectionState/${instanceName}` | online/offline state |
| `POST` | `${EVOLUTION_API_URL}/chat/findMessages/${instanceName}` | fetch messages for a contact or for the instance |
| `POST` | `${EVOLUTION_API_URL}/message/sendText/${instanceName}` | send outbound text |
| `POST` | `${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}` | propagate read receipts |
| `POST` | `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}` | fetch inbound media payload |

Important:

- the source repo also contains generic helpers for `findChats`
- the `/chat` module itself does not depend on `findChats`
- conversations are derived from the local DB, not from an Evolution chat-list endpoint

## 6. Data layer

### Real persisted tables

From `/var/www/crmconsorcio/prisma/schema.prisma`:

- `WhatsappInstancia`
- `WhatsappMensagem`

Relevant `WhatsappMensagem` fields:

- `id`
- `id_empresa`
- `id_lead`
- `id_whatsapp_instancia`
- `mensagem_id`
- `remote_jid`
- `from_me`
- `tipo`
- `conteudo`
- `status`
- `timestamp`
- `lida_no_crm_em`
- `erro`
- `payload_json`

### What does not exist

There is no dedicated table for:

- conversations
- participants

### How those concepts are represented instead

- conversation = `Lead` with at least one `WhatsappMensagem`
- participant = implicit relation through `Lead`, `Funcionario`, `Pdv`, and `WhatsappInstancia`
- unread count = derived count of `WhatsappMensagem` rows where `from_me = false` and `lida_no_crm_em IS NULL`

### Derived conversation query

`obterSnapshotConversas` in `whatsapp-chat-realtime.ts`:

- orders by `MAX(timestamp)` per `id_lead`
- applies role-scoped visibility
- supports search on lead name/phone
- supports unread-only filter via `EXISTS`
- uses cursor pagination based on the last lead's max timestamp

## 7. CRM integration in the source

The source chat is attached directly to existing CRM records:

- drawer chat binds to the selected `Lead`
- standalone `/chat` also stays lead-centric
- lead details side panel is fetched from `/api/leads/[id]`
- the WhatsApp instance is resolved from the lead's assigned collaborator -> PDV -> `id_whatsapp_instancia`

Important source behavior:

- if the lead's PDV has no WhatsApp instance, the API returns `409` with code `PDV_SEM_INSTANCIA`
- the response also includes a configuration route when the user is allowed to fix it

Lead origin signals displayed in the conversation list and client panel:

- `MANUAL`
- `SINCRONIZACAO_WHATSAPP`
- `ANUNCIO_CTWA`

Those origin values come from the WhatsApp lead sync flow in:

- `/var/www/crmconsorcio/src/lib/leads-sync-whatsapp.ts`

## 8. UI and behavior details in the source

Conversations list:

- search input with 300 ms debounce
- unread-only filter
- load-more pagination
- unread count badge
- last-message preview
- lead-origin badge
- formatted relative timestamps

Messages panel:

- connection badge in header
- auto-scroll to bottom on message count change
- optimistic send
- retry button for failed outbound text
- read/delivered/sent icons
- date separators
- audio autoplay chaining between sequential audio messages

Client panel:

- lead identity
- source badge
- stage
- phone
- value
- PDV
- managers
- responsible user
- notes
- parcelas list

### Source limitations that matter for a bug-free port

- Emoji and paperclip buttons are visual only.
- There is no outbound attachment upload flow in the source chat.
- The source type definitions around `message.kind` are a bit inconsistent with the actual normalized values.
- The standalone chat fetches raw lead details from `/api/leads/[id]`, which is not shape-compatible with `hypeCRM`.

## 9. What already exists in `hypeCRM`

Already present:

- `/var/www/hypeCRM/src/lib/whatsapp-chat.ts`
- `/var/www/hypeCRM/src/app/api/whatsapp/chat/messages/route.ts`
- `/var/www/hypeCRM/src/app/api/whatsapp/chat/send-message/route.ts`
- `/var/www/hypeCRM/src/app/api/whatsapp/chat/mark-read/route.ts`
- `/var/www/hypeCRM/src/app/api/whatsapp/chat/media/route.ts`
- `/var/www/hypeCRM/src/modules/whatsapp/hooks/use-whatsapp-chat.ts`
- `/var/www/hypeCRM/src/modules/whatsapp/components/chat/*`
- chat tab inside `/var/www/hypeCRM/src/modules/kanban/components/lead-details-drawer.tsx`

Key differences in `hypeCRM`:

- no `/chat` page
- no `src/modules/chat`
- no SSE routes
- no `src/lib/whatsapp-chat-realtime.ts`
- current hook uses polling only
- current hook parameter is `contatoId`, but the API and DB still use `leadId`
- current drawer chat is anchored to `negocioSelecionado?.lead_principal?.id`
- current message bubble renderer is richer than the source for image/audio/video display

### Important schema differences that make blind copy risky

- `hypeCRM` relation names are PascalCase in Prisma-generated accessors:
  `Funcionario`, `Pdv`, `WhatsappInstancia`
- `crmconsorcio` source code uses lower-case relation accessors:
  `funcionario`, `pdv`, `whatsapp_instancia`
- `hypeCRM` already had to add `randomUUID()` in `upsertMensagensNoBanco` because IDs are not being generated the same way in copied code paths

Conclusion:

- do not copy source backend files verbatim
- port logic while adapting relation names, existing type unions, and explicit ID generation

## 10. Recommended parity target for `hypeCRM`

Target behavior should be:

- functionally equivalent to `crmconsorcio /chat`
- visually aligned to the current Hype dark tokenized UI
- still lead-centric at the data/API level
- still compatible with the existing Negócio drawer chat
- preserving Hype's richer media bubble implementation instead of downgrading it to the source version

