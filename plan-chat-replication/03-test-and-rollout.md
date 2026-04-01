# 03. Test and Rollout Plan

## 1. Automated test plan

## Unit tests

### `src/lib/whatsapp-chat.test.ts`

Keep existing coverage and expand it for:

- status strength resolution
- message deduplication by `messageId`
- `findMessages` request contract
- DB-to-canonical message mapping for media kinds
- `hasMedia` derivation if preserved

### New `src/lib/whatsapp-chat-realtime.test.ts`

Add coverage for:

- snapshot caching TTL behavior
- channel dedupe by key
- no duplicate publication when hash does not change
- chat snapshot unread count logic
- conversation snapshot cursor pagination
- unread-only filter
- role-scoped conversation query conditions

## Route tests

Add route-level coverage for:

- `GET /api/whatsapp/chat/conversations`
- `GET /api/whatsapp/chat/conversations/stream`
  At minimum, verify headers and route initialization.
- `GET /api/whatsapp/chat/messages/stream`
  At minimum, verify headers and route initialization.
- `GET /api/whatsapp/chat/context`
- existing `messages`, `send-message`, `mark-read`, `media`

## Integration tests

Update `src/lib/whatsapp-chat.integration.test.ts`:

- fix default Hype port to `3434` or make `TEST_BASE_URL` mandatory
- add a happy-path conversation list test
- add `PDV_SEM_INSTANCIA` coverage
- add mark-read coverage
- add media route smoke test with a known media message when available

## 2. Manual QA matrix

Run the following scenarios after implementation.

### Access and role scope

- `EMPRESA` sees company-wide conversations
- `GERENTE` sees only conversations from collaborators in the same PDV
- `COLABORADOR` sees only owned leads
- unauthenticated access redirects to login

### Conversation list

- page loads with initial conversation snapshot
- search by lead name works
- search by phone works
- unread-only filter works
- load more appends rather than replaces
- unread count badge is correct

### Message panel

- selecting a conversation loads messages
- automatic scroll lands at the latest message
- SSE updates append without duplicate rows
- optimistic outbound message appears immediately
- failed outbound message shows retry CTA
- successful retry replaces failed optimistic state
- timestamps are formatted
- date separators appear on multi-day histories
- sent, delivered, read, and played indicators render correctly

### Media

- image message renders
- audio message loads and plays
- video placeholder or renderer behaves consistently with chosen implementation
- missing media returns graceful fallback UI

### Mark-read behavior

- opening a conversation with unread inbound messages decrements unread count
- unread badge disappears after mark-read
- reopening the same conversation does not create duplicate read actions

### Missing configuration and offline cases

- lead without PDV instance shows the blocked-state banner
- offline WhatsApp instance disables outbound send
- configuration CTA points to the PDV edit route when permitted

### Layout and design

- desktop renders a 3-column layout
- mobile allows moving between list, messages, and details
- page matches Hype tokens and not source WhatsApp-green styling
- sidebar and mobile dock highlight `/chat` correctly

### Regression checks

- existing Negócio drawer chat still loads and sends
- WhatsApp module still manages instances normally
- no console spam from copied source debug logs

## 3. Rollout order

Recommended rollout sequence:

1. land backend realtime and conversations endpoints behind no new navigation
2. update the shared message hook and verify the existing drawer chat
3. land the standalone module behind the `/chat` route
4. run manual QA on all roles
5. expose sidebar and mobile navigation entry

## 4. Guardrails during implementation

- Do not remove the existing drawer chat until `/chat` is verified.
- Do not rewrite the persistence model.
- Do not aggregate multiple leads into a Negócio thread in the first pass.
- Do not introduce new dependencies for realtime.
- Do not blindly copy source types where Hype already has a safer contract.

## 5. High-risk migration points

- relation accessor rename differences between repos
- `contatoId` versus `leadId` naming drift
- `crmconsorcio` flat lead-context payload versus `hypeCRM` wrapped lead API
- copied integration tests using the wrong default port
- preserving Hype media rendering while porting source date grouping and SSE behavior

## 6. Final acceptance checklist

- `/chat` exists and is linked from navigation
- conversations REST + SSE both work
- messages REST + SSE both work
- context side panel works
- unread counters are consistent in drawer and standalone page
- Hype visual language is preserved
- no regression in the current WhatsApp drawer chat
- automated tests pass
