# Napkin Runbook

## Curation Rules
- Re-prioritize on every read.
- Keep recurring, high-value notes only.
- Max 10 items per category.
- Each item includes date + "Do instead".

## Execution & Validation (Highest Priority)
1. **[2026-04-07] Dashboard UI changes must finish with the full validation trio**
   Do instead: after editing app-shell or module layout code, run `pnpm lint`, `pnpm typecheck`, and `pnpm build` before concluding.

## Layout Guardrails
1. **[2026-04-07] Nao combine `fillHeight` (`h-full`) com shells `fixed` que ja usam `top/bottom`**
   Do instead: em layouts ancorados por inset, use `flex min-h-0 flex-col` no shell e deixe os insets definirem a altura.
1. **[2026-04-07] `h-full` does not constrain children when the ancestor only has `min-height`**
   Do instead: give the feature shell a real viewport-based height or a fully constrained ancestor chain, then pair inner scroll areas with `min-h-0` and `overflow-y-auto`.

## Local Artifacts
1. **[2026-04-07] Playwright MCP leaves temp outputs in `.playwright-mcp/` and `chat-*.png`**
   Do instead: delete those artifacts after browser sessions so `git status` stays focused on real code changes.

## User Directives
1. **[2026-04-07] Layout fixes must be structural, not cosmetic**
   Do instead: trace the first ancestor with infinite height, fix containment there, and only then apply internal scrolling.
2. **[2026-04-07] Playwright deve validar areas protegidas com sessao real da empresa alvo**
   Do instead: para testes autenticados, reutilize ou injete um cookie `hype_sessao` valido da conta `limawebvision@gmail.com` antes de abrir a rota protegida.
