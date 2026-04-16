# AGENTS.md - Directrices para Agentes de Codificación

> **⚠️ IMPORTANTE:** Carregue a skill `napkin` no início de cada sessão usando o comando `/napkin` ou `skill napkin` para ter acesso ao runbook do projeto.

## Visión General

CRM HYPE - app multi-tenant Next.js 16 (App Router) para seguros y productos financieros. Stack: React 19, TypeScript, Prisma, Tailwind CSS 4, Shadcn UI/Radix.

---

## 1. Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev              # Dev server en puerto 3434
pnpm build           # Build producción
pnpm start           # Servidor production

# Base de datos
pnpm db:generate     # Generar cliente Prisma
pnpm db:migrate:deploy  # Aplicar migraciones
pnpm db:migrate:status  # Ver estado migraciones
pnpm seed            # Ejecutar seed

# Validación (OBLIGATORIO después de editar)
pnpm lint; pnpm typecheck; pnpm build

# Deploy em produção (PM2)
pnpm pm2:prod
```

### Ejecutar un solo test
```bash
pnpm vitest run src/lib/__tests__/validacoes.test.ts  # Por archivo
pnpm vitest run --grep "nome da função"                # Por nombre
pnpm vitest src/lib/__tests__/validacoes.test.ts       # Modo watch
```

### PM2 + SQLite
Si `db:migrate:deploy` falla con "database is locked":
```bash
pm2 stop hypecrm-web
pnpm db:migrate:deploy
pm2 start hypecrm-web
```
- Para reiniciar o servidor no ambiente local/PM2, `npm run pm2:restart` já faz build junto; use isso quando quiser um reinicio completo e rápido.
- Fluxo recomendado quando houver tempo: rode `pnpm build` primeiro e, se passar, faça o restart manual com `pm2 restart hypecrm-web`.

### Layout de Altura
- Em módulos full-height dentro do dashboard, `fillHeight` sozinho pode colapsar sob `main` fora de `lg`; use altura explícita em viewport quando o canvas precisar ocupar a tela inteira.
- Para canvases/boards como `automacoes`, siga o padrão de `chat`/`kanban` com `h-[calc(100dvh-...)]` no shell do módulo e `min-h-0` em todos os wrappers intermediários.

### Playwright autenticado
- Para validar fluxos protegidos no Playwright, reutilize uma sessão existente em vez de testar deslogado.
- Conta padrão para reprodução autenticada neste projeto: `limawebvision@gmail.com`.
- Se não houver sessão exportada pronta, gere/injete o cookie `hype_sessao` correspondente a essa empresa antes de abrir a rota protegida.

---

## 2. Estilo de Código

### Imports
```typescript
// ✅ Orden: Externos → @/lib → Locales → Tipos
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEquipeModule } from '@/modules/equipe/hooks/use-equipe';
import type { TipoPerfil } from '@/modules/equipe/types';
```
- Use `@/` para rutas desde `src/`
- Evite imports barrel (`index.ts`)

### Naming Conventions
| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes React | PascalCase | `LeadCard.tsx` |
| Hooks | camelCase + `use` | `use-equipe.ts` |
| Utilitários | camelCase | `aplica-mascara-telefone.ts` |
| Constantes | UPPER_SNAKE_CASE | `DIAS_ESTAGIO_PARADO` |
| Funciones/Vars | camelCase | `calcularPendencias` |
| Rutas API | kebab-case | `lead/[id]/route.ts` |

### TypeScript
- **Sin `any`** sin justificación
- `type` para tipos simples, `interface` para objetos extensibles
- Evite tipos redundantes: `const name = "test"`

```typescript
interface Lead { id: string; nome: string; etapa: EtapaLead; }
type EtapaLead = 'novo' | 'contato' | 'proposta' | 'fechado';
```

### Manejo de Errores
- Valide payloads con Zod de `src/lib/validacoes.ts`
- Retorne errores structurados:

```typescript
export async function POST(request: Request) {
  const validacao = EsquemaLead.safeParse(await request.json());
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }
  // ... lógica
}
```

### MVVM Pattern
- `page.tsx` → componente presentacional
- `hooks/use-*.ts` → ViewModel (estados, efectos, API)
- `components/` → componentes visuales
- `types.ts` → tipajes del módulo

### API Routes
- Siempre verifique sesión: `await exigirSessao(request)`
- Use transacciones (`prisma.$transaction`) para mutaciones multi-tabla
- Soft deletes: `ativo: false` o `deleted_at`

---

## 3. Design System

### Colores (Dark Premium Theme)
```
canvas=#09090b, surface=#0c0c0e, surface-elevated=#111113
border-subtle=rgba(255,255,255,0.08), border-strong=#3f3f46
text-primary=#fafafa, text-secondary=#a1a1aa
brand=#8b5cf6, success=#10b981, danger=#f43f5e
```

### Reglas UI
- Use `cn()` de `@/lib/utils` para clases condicionales
- Evolua componentes de `src/components/ui/` (Shadcn/Radix)
- No cree button/input/select/dialog desde cero
- Focus ring obligatorio
- Motion: hover 120-160ms, modal 180-220ms

---

## 4. Estructura del Proyecto
```
src/
├── app/              # Next.js App Router
├── components/ui/    # Shadcn base components
├── lib/
│   ├── validacoes.ts # Esquemas Zod
│   └── utils.ts      # cn(), helpers
└── modules/[modulo]/
    ├── page.tsx, hooks/, components/, types.ts
```

---

## 5. Reglas de Negocio
- **WhatsApp:** Use chaves de idempotência
- **Pendências:** Calculadas "on the fly" (`src/lib/pendencias-dinamicas.ts`)
- **Teléfonos:** `aplicaMascaraTelefoneBr` (display), `normalizarTelefoneParaWhatsapp` (API)
- **Moneda:** `aplicaMascaraMoedaBr`

---

## 6. Git Commits
Conventional commits con emoji:
- `feat:` ✨ nueva funcionalidad
- `fix:` 🐛 bugfix
- `refactor:` ♻️ refactorización
- `docs:` 📝 documentación
- `chore:` 🔧 tooling, config
- `test:` ✅ tests

Formato: `<emoji> <tipo>: <descripción>`

### Aprendizado recente: Kanban catálogo

- Não forçar retorno para pipeline padrão apenas por abrir `/kanban` ou clicar em **Voltar ao catálogo**.
- Regra de navegação:
  - `/kanban` sem `pipelineId`/`id_funil` deve renderizar catálogo.
  - Selecionar funil via catálogo passa a `pipelineId` na URL.
  - Botão **Voltar ao catálogo** remove `pipelineId` e mantém catálogo ativo.

---

*Última actualización: Abril 2026*
