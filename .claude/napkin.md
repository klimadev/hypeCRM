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
1. **[2026-04-08] Quando o usuario pedir validacao so com PM2, nao rode lint/typecheck**
   Do instead: execute apenas `pnpm pm2:prod` como check final, mesmo que a regra padrao do repo seja mais ampla.
2. **[2026-04-08] Fatias do editor de automacoes precisam parecer ferramenta, nao apresentacao**
   Do instead: mantenha o canvas como protagonista, deixe empty states dentro da superficie de construcao e evite cards explicativos ou UI competindo com o editor.
3. **[2026-04-07] Layout fixes must be structural, not cosmetic**
   Do instead: trace the first ancestor with infinite height, fix containment there, and only then apply internal scrolling.
4. **[2026-04-07] Playwright deve validar areas protegidas com sessao real da empresa alvo**
   Do instead: para testes autenticados, reutilize ou injete um cookie `hype_sessao` valido da conta `limawebvision@gmail.com` antes de abrir a rota protegida.
5. **[2026-04-07] Planejamentos grandes devem virar artefatos TLC persistentes**
   Do instead: para features nao triviais, salvar `.specs/features/<slug>/spec.md`, `design.md` e `tasks.md`; mantenha arquivos de codigo pequenos, mas deixe arquivos de plano crescerem quando isso melhorar clareza e rastreabilidade.
6. **[2026-04-08] PM2 dev/prod deve ser troca exclusiva, nao dupla execucao**
   Do instead: use nomes distintos para `next start` e `next dev`, derrube o modo oposto antes de subir o novo e deixe o watch de arquivos com o proprio Next dev, nao com PM2 watch.
