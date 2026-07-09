# Contributing to hypeCRM

Thanks for considering contributing! This document outlines the conventions and workflow.

## Code of Conduct

Be respectful, constructive, and assume good faith. Harassment or toxic behavior will not be tolerated.

## Quick Start

```bash
git clone https://github.com/klimadev/hypeCRM.git
cd hypeCRM
pnpm install
cp .env.example .env  # fill in your secrets
pnpm db:generate
pnpm db:migrate:deploy
pnpm seed
pnpm dev
```

See [README](./README.md) for full setup details.

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) with emoji prefixes:

| Type       | Emoji | Example                          |
|------------|-------|----------------------------------|
| `feat`     | ✨     | `✨ feat: add lead export to CSV`  |
| `fix`      | 🐛    | `🐛 fix: handle null due date`     |
| `refactor` | ♻️    | `♻️ refactor: extract form hook`   |
| `docs`     | 📝    | `📝 docs: update API reference`    |
| `perf`     | ⚡️    | `⚡️ perf: cache pipeline queries`  |
| `chore`    | 🔧    | `🔧 chore: update deps`            |
| `style`    | 🎨    | `🎨 style: format component`       |
| `test`     | ✅    | `✅ test: add lead filter tests`    |
| `security` | 🔒️   | `🔒️ security: sanitize input`      |

Format: `<emoji> <type>(<scope>): <description>`

Examples:
- `✨ feat: add lead kanban pipeline`
- `🐛 fix(chat): paginate message loading`
- `♻️ refactor: simplify integration module`

## Branch Strategy

- `main` — production-ready, protected
- Create feature/fix branches from `main`
- Use descriptive kebab-case names: `feat/lead-export-csv`, `fix/chat-pagination`

## Pull Request Process

1. **Keep PRs small and focused** — one feature/fix per PR
2. **Run validation before opening**:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
3. **Link related issues** in the PR description
4. **Use the PR template** — fill in all sections
5. **Squash commits on merge** — we keep a linear history
6. **Wait for CI to pass** — lint, typecheck, test, and build checks must be green

## Code Style

- **TypeScript** strict mode enabled
- **Prettier** formatting (2 spaces, single quotes)
- **ESLint** with `eslint-config-next`
- Prefer named exports over default exports
- Components in `src/components/`, logic in `src/lib/`, domain modules in `src/modules/`
- Files under 200 lines preferred; extract utilities early

## Testing

- Run `pnpm test` before pushing
- Write tests for new logic (Vitest)
- Use descriptive test names that read as sentences

## Questions?

Open a [discussion](https://github.com/klimadev/hypeCRM/discussions) or reach out to maintainers.
