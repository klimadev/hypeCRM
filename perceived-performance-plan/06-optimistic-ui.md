# Step 6: Hardware Acceleration & Optimistic UI

## Goal
All animations must strictly use `transform` (translate3d, scale) and `opacity` to avoid layout thrashing. Any user action must **instantly update the UI** using React 19's `useOptimistic` before the server responds.

---

## Part A: GPU Acceleration Rules

### 6.1 The Golden Rule

**ONLY animate these properties:**
- `transform` (includes `translateX`, `translateY`, `translateZ`, `scale`, `rotate`)
- `opacity`

**NEVER animate these properties:**
- `width`, `height`
- `margin`, `padding`
- `top`, `left`, `right`, `bottom`
- `border-width`
- `font-size`

### Why
Browsers render in 4 stages: **Style → Layout → Paint → Composite**.

| Property | Triggers | Performance |
|----------|----------|-------------|
| `transform`, `opacity` | Composite only | Excellent (GPU) |
| `color`, `background` | Paint + Composite | Moderate |
| `width`, `height`, `margin` | Layout + Paint + Composite | Poor |

Animating `transform` and `opacity` skips Layout and Paint entirely — the GPU compositor handles everything. This is the difference between 60fps and 15fps on low-end devices.

### 6.2 Common Replacements

| Instead of... | Use... |
|--------------|--------|
| `width: 0 → 100%` | `transform: scaleX(0) → scaleX(1)` with `transform-origin: left` |
| `height: 0 → auto` | `max-height` + `overflow: hidden` OR Framer Motion `animate` with `height: "auto"` |
| `top: -100px → 0` | `transform: translateY(-100px) → translateY(0)` |
| `margin-top: 20px` | `transform: translateY(20px)` |
| `padding` animation | `transform: scale()` or inner wrapper approach |

### 6.3 will-change Usage

Add `will-change` **only** to elements that will definitely animate. Remove it after animation completes.

```tsx
// GOOD — add before animation, remove after
<motion.div
  style={{ willChange: "transform" }}
  animate={{ scale: 1.02 }}
  onUpdate={(latest) => {
    // Remove will-change after animation settles
    if (latest.scale === 1.02) {
      // settled
    }
  }}
/>

// BAD — will-change on everything
<div className="will-change-transform"> {/* Don't do this */}
```

**Practical approach**: Framer Motion handles GPU acceleration internally. You rarely need to manually set `will-change`. Only add it for elements with continuous animations (floating, shimmer).

### 6.4 CSS Containment

Add `contain: layout style paint` to isolated animated components:

```css
.animated-card {
  contain: layout style paint;
  /* Browser knows changes won't affect outside elements */
}
```

This is especially useful for:
- Kanban cards (many animated simultaneously)
- Table rows (long lists)
- Dashboard KPI cards

---

## Part B: Optimistic UI with React 19

### 6.5 What is useOptimistic?

`useOptimistic` is a React 19 hook that shows the expected result **immediately** while the server request is in flight. If the server returns an error, it automatically rolls back.

```
Traditional:  Click → Wait → Server responds → Update UI
Optimistic:   Click → Update UI instantly → Send request → Confirm or revert
```

### 6.6 Basic Pattern

```tsx
"use client";

import { useOptimistic, useTransition } from "react";

type Lead = {
  id: string;
  nome: string;
  id_estagio: string;
};

export function KanbanColumn({ leads: serverLeads }: { leads: Lead[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLeads, addOptimisticLead] = useOptimistic(
    serverLeads,
    (state, newLead: Lead) => {
      // This reducer updates the optimistic state
      return state.map((lead) =>
        lead.id === newLead.id ? { ...lead, ...newLead } : lead,
      );
    },
  );

  function handleMoveLead(leadId: string, newStage: string) {
    // 1. Instantly update UI
    addOptimisticLead({ id: leadId, id_estagio: newStage } as Lead);

    // 2. Send request in background (non-blocking)
    startTransition(async () => {
      const response = await fetch(`/api/leads/${leadId}/mover`, {
        method: "PATCH",
        body: JSON.stringify({ id_estagio: newStage }),
      });

      if (!response.ok) {
        // React automatically rolls back optimistic state
        // Show error toast
        addToast({ type: "error", title: "Erro ao mover lead" });
      }
    });
  }

  return (
    <div>
      {optimisticLeads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} onMove={handleMoveLead} />
      ))}
    </div>
  );
}
```

### 6.7 Migrating Kanban to useOptimistic

**File**: `src/modules/kanban/hooks/use-kanban-movimentacao.ts` (modify)

The existing pattern manually calls `setLeads()` for optimistic updates and rolls back on error. Migrate to `useOptimistic`.

```tsx
// src/modules/kanban/hooks/use-kanban-movimentacao.ts

import { useCallback, useOptimistic, useTransition } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { DropResult } from "@hello-pangea/dnd";
import type { Estagio, Lead } from "../types";
import { moverLeadKanban } from "@/lib/api/kanban";

type UseKanbanMovimentacaoParams = {
  leads: Lead[];
  estagios: Estagio[];
  registrarMovimentoLocal: () => void;
  addToast: (params: {
    type: "success" | "error" | "warning";
    title: string;
    description?: string;
  }) => void;
};

export function useKanbanMovimentacao({
  leads,
  estagios,
  registrarMovimentoLocal,
  addToast,
}: UseKanbanMovimentacaoParams) {
  const [isPending, startTransition] = useTransition();
  const [movimentoPendente, setMovimentoPendente] = useState<{
    id_lead: string;
    id_estagio: string;
  } | null>(null);
  const [motivoPerda, setMotivoPerda] = useState("");

  // useOptimistic replaces manual setLeads for movement
  const [optimisticLeads, addOptimisticMove] = useOptimistic(
    leads,
    (state, update: { id: string; id_estagio: string; motivo_perda: string | null }) =>
      state.map((item) =>
        item.id === update.id
          ? { ...item, id_estagio: update.id_estagio, motivo_perda: update.motivo_perda }
          : item,
      ),
  );

  const moverLead = useCallback(
    async (idLead: string, idEstagio: string, motivo?: string) => {
      // 1. Optimistic update — instant UI change
      addOptimisticMove({
        id: idLead,
        id_estagio: idEstagio,
        motivo_perda: motivo?.trim() ? motivo.trim() : null,
      });
      registrarMovimentoLocal();

      // 2. Server request in transition (non-blocking)
      startTransition(async () => {
        const resposta = await moverLeadKanban(idLead, {
          id_estagio: idEstagio,
          motivo_perda: motivo,
        });

        if (!resposta.ok) {
          // React automatically rolls back optimistic state
          addToast({
            type: "error",
            title: "Movimentação não permitida",
            description: resposta.erro,
          });
          return false;
        }

        if (resposta.dados.mensagem) {
          addToast({
            type: "warning",
            title: "Lead com pendência de análise",
            description: resposta.dados.mensagem,
          });
        }

        return true;
      });
    },
    [addOptimisticMove, registrarMovimentoLocal, addToast],
  );

  // ... rest of the hook (aoDragEnd, confirmarPerda) remains similar
  // but uses optimisticLeads instead of leads for rendering

  return {
    movimentoPendente,
    setMovimentoPendente,
    motivoPerda,
    setMotivoPerda,
    moverLead,
    aoDragEnd,
    confirmarPerda,
    optimisticLeads, // Return optimistic state for rendering
    isPending, // Return pending state for loading indicators
  };
}
```

### Key Changes
- `setLeads()` manual optimistic update → `addOptimisticMove()` 
- Manual rollback on error → React auto-rollback
- `leads` for server state, `optimisticLeads` for rendering
- `isPending` from `useTransition` for loading indicators

### 6.8 Optimistic Delete Pattern

```tsx
"use client";

import { useOptimistic, useTransition } from "react";

export function ItemList({ items: serverItems }: { items: Item[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    serverItems,
    (state, deletedId: string) => state.filter((item) => item.id !== deletedId),
  );

  function handleDelete(id: string) {
    // Instantly remove from UI
    setOptimisticItems(id);

    startTransition(async () => {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // React rolls back — item reappears
        addToast({ type: "error", title: "Erro ao excluir" });
      }
    });
  }

  return (
    <AnimatePresence>
      {optimisticItems.map((item) => (
        <motion.div
          key={item.id}
          layout
          exit={{ opacity: 0, scale: 0.95, transition: springs.stiff }}
        >
          <ItemCard item={item} onDelete={() => handleDelete(item.id)} />
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
```

### 6.9 Optimistic Toggle Pattern (Like/Favorite)

```tsx
"use client";

import { useOptimistic, useTransition } from "react";

export function FavoriteButton({ leadId, initialFavorito }: { leadId: string; initialFavorito: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorito, toggleFavorito] = useOptimistic(
    initialFavorito,
    (state) => !state,
  );

  function handleClick() {
    toggleFavorito(null); // Toggle optimistic state

    startTransition(async () => {
      await fetch(`/api/leads/${leadId}/favorito`, {
        method: "PATCH",
        body: JSON.stringify({ favorito: optimisticFavorito }),
      });
    });
  }

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.85, transition: springs.snappy }}
      className="..."
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          optimisticFavorito ? "fill-[var(--danger)] text-[var(--danger)]" : "text-[var(--text-tertiary)]",
        )}
      />
    </motion.button>
  );
}
```

### 6.10 OptimisticSync Component Enhancement

**File**: `src/components/ui/optimistic-sync.tsx` (modify)

Add AnimatePresence for smooth mount/unmount.

```tsx
"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

// ... existing variants ...

export function OptimisticSync({
  active,
  children,
  className,
  label = "Sincronizando...",
  variant,
}: OptimisticSyncProps) {
  return (
    <AnimatePresence mode="wait">
      {active ? (
        <motion.div
          key="optimistic"
          className={cn(optimisticSyncVariants({ variant }), className)}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1, transition: springs.snappy }}
          exit={{ opacity: 0, scale: 0.98, transition: springs.stiff }}
        >
          {children}
          <motion.p
            className={optimisticSyncLabelVariants({ variant })}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {label}
          </motion.p>
        </motion.div>
      ) : (
        <motion.div
          key="confirmed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: springs.smooth }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## 6.11 Where to Apply Optimistic UI

| Action | Pattern | Priority |
|--------|---------|----------|
| Move lead in kanban | Optimistic move | HIGH — most frequent action |
| Delete lead/item | Optimistic remove | HIGH — instant feedback critical |
| Toggle favorite/like | Optimistic toggle | MEDIUM — common micro-action |
| Add new lead | Optimistic add with temp ID | MEDIUM — show immediately |
| Edit lead details | Auto-save (existing) | LOW — already has debounce |
| Create team member | Optimistic add | LOW — infrequent |

---

## Files Modified Summary

| File | Change Type |
|------|------------|
| `src/modules/kanban/hooks/use-kanban-movimentacao.ts` | Major — migrate to useOptimistic |
| `src/components/ui/optimistic-sync.tsx` | Modify — add AnimatePresence |
| `src/modules/kanban/components/kanban-board.tsx` | Modify — use optimisticLeads |
| `src/modules/equipe/hooks/use-equipe-operacoes.ts` | Modify — add useOptimistic for delete |
| `src/modules/kanban/components/kanban-card.tsx` | Modify — add optimistic favorite toggle |

## Verification

- [ ] Moving a lead in kanban updates UI instantly (before server responds)
- [ ] If server returns error, UI rolls back automatically
- [ ] Deleting an item removes it from UI instantly
- [ ] OptimisticSync component mounts/unmounts with spring animation
- [ ] `isPending` state shows subtle loading indicator during transition
- [ ] All optimistic animations use `transform` and `opacity` only
- [ ] `npm run build` succeeds
