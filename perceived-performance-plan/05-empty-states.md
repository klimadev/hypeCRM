# Step 5: Delightful Empty States

## Goal
If there is no data, the app must show **visually pleasing, minimalist empty states with subtle, continuous floating animations** to make the screen feel alive. No dead screens.

---

## 5.1 Animated Empty State Component

**File**: `src/components/ui/empty-state-animated.tsx` (create new)

```tsx
// src/components/ui/empty-state-animated.tsx

"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Inbox, Users, MessageSquare, Target, Package, Zap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

// === ICON MAP ===
const iconMap = {
  inbox: Inbox,
  users: Users,
  message: MessageSquare,
  target: Target,
  package: Package,
  zap: Zap,
  chart: BarChart3,
} as const;

type EmptyStateVariant = keyof typeof iconMap;

type EmptyStateAnimatedProps = {
  variant?: EmptyStateVariant;
  customIcon?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
};

export function EmptyStateAnimated({
  variant = "inbox",
  customIcon,
  titulo,
  descricao,
  acao,
  className,
}: EmptyStateAnimatedProps) {
  const shouldReduce = useReducedMotion();
  const IconComponent = iconMap[variant];

  return (
    <motion.div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-5 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.02)] px-6 py-16 text-center",
        className,
      )}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: springs.gentle }}
    >
      {/* Floating icon */}
      <motion.div
        className="relative"
        animate={
          shouldReduce
            ? {}
            : {
                y: [0, -8, 0], // Float up 8px and back
              }
        }
        transition={
          shouldReduce
            ? {}
            : {
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }
        }
      >
        {customIcon ?? (
          <div className="relative">
            {/* Glow behind icon */}
            <div className="absolute inset-0 blur-xl opacity-20 bg-[var(--brand)] rounded-full scale-150" />
            <IconComponent className="relative h-16 w-16 text-[color:rgba(255,255,255,0.16)]" strokeWidth={1.5} />
          </div>
        )}
      </motion.div>

      {/* Text */}
      <div>
        <motion.p
          className="text-base font-semibold text-[var(--text-primary)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {titulo}
        </motion.p>
        {descricao ? (
          <motion.p
            className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {descricao}
          </motion.p>
        ) : null}
      </div>

      {/* CTA */}
      {acao ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, ...springs.smooth }}
        >
          {acao}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
```

### Key Features
- **Floating icon**: Continuous `translateY` loop (0 → -8px → 0) over 3 seconds
- **Staggered text**: Title appears first, description 100ms later, CTA 300ms later
- **Subtle glow**: Brand-colored blur behind the icon for depth
- **GPU-only**: All animations use `transform` and `opacity`
- **Reduced motion**: All animations disabled when user prefers reduced motion

---

## 5.2 Module-Specific Empty States

### Kanban — No Leads

```tsx
// src/modules/kanban/components/empty-state.tsx (modify existing)

"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

type EmptyStateProps = {
  icone?: ReactNode;
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
  variant?: "default" | "leads";
};

export function EmptyState({ icone, titulo, descricao, acao, className, variant = "default" }: EmptyStateProps) {
  const shouldReduce = useReducedMotion();

  const defaultIcon = variant === "leads" ? (
    <svg className="h-20 w-20 text-[color:rgba(255,255,255,0.14)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ) : (
    <Inbox className="h-16 w-16 text-[color:rgba(255,255,255,0.14)]" />
  );

  return (
    <motion.div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 rounded-[var(--radius-card)] border border-dashed border-[var(--border-subtle)] bg-[color:rgba(255,255,255,0.03)] px-6 py-12 text-center",
        className,
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: springs.gentle }}
    >
      {/* Floating icon */}
      <motion.div
        className={icone ? "text-[var(--success)]" : "mb-2"}
        animate={
          shouldReduce
            ? {}
            : { y: [0, -6, 0] }
        }
        transition={
          shouldReduce
            ? {}
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {icone ?? defaultIcon}
      </motion.div>

      <div>
        <p className="text-base font-semibold text-[var(--text-primary)]">{titulo}</p>
        {descricao ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{descricao}</p> : null}
      </div>
      {acao ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {acao}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
```

### WhatsApp — No Instances

```tsx
// In whatsapp module, replace the spinner with:
<EmptyStateAnimated
  variant="message"
  titulo="Nenhuma conexão WhatsApp"
  descricao="Conecte seu primeiro número para começar a automatizar conversas com seus leads."
  acao={<Button onClick={abrirDialogoCriacao}>Conectar WhatsApp</Button>}
/>
```

### Equipe — No Team Members

```tsx
<EmptyStateAnimated
  variant="users"
  titulo="Equipe vazia"
  descricao="Adicione colaboradores ao seu ponto de venda para começar a gerenciar sua equipe."
  acao={<Button onClick={abrirDialogoCriacao}>Adicionar Colaborador</Button>}
/>
```

### Produtos — No Products

```tsx
<EmptyStateAnimated
  variant="package"
  titulo="Nenhum produto cadastrado"
  descricao="Cadastre seus produtos de seguro para começar a vender."
  acao={<Button onClick={abrirDialogoCriacao}>Cadastrar Produto</Button>}
/>
```

### Recebimentos — No Receivables

```tsx
<EmptyStateAnimated
  variant="chart"
  titulo="Nenhum recebimento registrado"
  descricao="Quando você fechar vendas, os recebimentos aparecerão aqui."
/>
```

---

## 5.3 Empty State Design Rules

1. **Always animated**: Every empty state must have at least the floating icon animation
2. **Single CTA**: One primary action button, never multiple competing CTAs
3. **Concise text**: Title max 5 words, description max 2 sentences
4. **Subtle glow**: Brand-colored blur behind icon for depth (not garish)
5. **Dashed border**: Maintains the existing pattern — indicates "this space is waiting"
6. **GPU-only**: Floating uses `translateY` (transform), entrance uses `opacity` + `translateY`

---

## Files Modified Summary

| File | Change Type |
|------|------------|
| `src/components/ui/empty-state-animated.tsx` | Create — new animated component |
| `src/modules/kanban/components/empty-state.tsx` | Modify — add floating animation |
| `src/modules/whatsapp/page.tsx` | Modify — replace spinner with empty state |
| `src/modules/equipe/page.tsx` | Modify — add empty state for no members |
| `src/modules/produtos/page.tsx` | Modify — add empty state for no products |
| `src/modules/recebimentos/page.tsx` | Modify — add empty state for no receivables |

## Verification

- [ ] Every empty state has floating icon animation
- [ ] Floating animation uses `translateY` only (GPU-accelerated)
- [ ] Animation loops continuously at 3s interval
- [ ] `prefers-reduced-motion` disables floating
- [ ] Empty states have single CTA button
- [ ] Entrance animation uses spring physics
- [ ] `npm run build` succeeds
