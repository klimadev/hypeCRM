# Step 4: Seamless Skeleton Loaders

## Goal
Every dynamic section must have a **shimmering skeleton loader that perfectly mimics the final layout's geometry**. The transition from skeleton to actual data must be a **smooth cross-fade**, never a harsh jump.

---

## 4.1 Enhanced Skeleton Component

**File**: `src/components/ui/skeleton.tsx` (create new)

A composable skeleton component that matches the dark premium design system.

```tsx
// src/components/ui/skeleton.tsx

import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  /** Match the radius of the content it represents */
  rounded?: "control" | "card" | "shell" | "full";
};

export function Skeleton({ className, rounded = "control" }: SkeletonProps) {
  const radiusMap = {
    control: "rounded-[var(--radius-control)]",     // 12px
    card: "rounded-[var(--radius-card)]",            // 16px
    shell: "rounded-[var(--radius-shell)]",          // 28px
    full: "rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-shimmer",
        radiusMap[rounded],
        className,
      )}
    />
  );
}

// === PRE-BUILT SKELETON PATTERNS ===

/** Skeleton for a text line */
export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  if (lines === 1) {
    return <Skeleton className={cn("h-4 w-full", className)} />;
  }
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full", // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

/** Skeleton for an avatar */
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeMap = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };
  return <Skeleton className={sizeMap[size]} rounded="full" />;
}

/** Skeleton for a button */
export function SkeletonButton({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeMap = {
    sm: "h-9 w-20",
    default: "h-10 w-28",
    lg: "h-11 w-36",
  };
  return <Skeleton className={sizeMap[size]} rounded="control" />;
}

/** Skeleton for a card */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-6", className)}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={3} />
      <div className="flex gap-2">
        <SkeletonButton size="sm" />
        <SkeletonButton size="sm" />
      </div>
    </div>
  );
}

/** Skeleton for a table row */
export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--border-subtle)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn("h-4", i === 0 ? "w-24" : "w-16")} />
        </td>
      ))}
    </tr>
  );
}

/** Skeleton for a KPI card */
export function SkeletonKPI() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-5">
      <Skeleton className="mb-3 h-3 w-20" />
      <Skeleton className="mb-2 h-7 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/** Skeleton for kanban card */
export function SkeletonKanbanCard() {
  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-5 w-12" rounded="full" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}
```

---

## 4.2 Cross-Fade Pattern (Skeleton → Content)

The critical UX improvement: skeleton fades out while content fades in simultaneously. No harsh jump.

**Pattern**: Use `AnimatePresence` with `mode="sync"` (not "wait") for cross-fade.

```tsx
// In any module page that loads data:

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SkeletonKPI, SkeletonKanbanCard, SkeletonTableRow } from "@/components/ui/skeleton";

export function ModulePage() {
  const { dados, carregando } = useModuleHook();

  return (
    <AnimatePresence mode="wait">
      {carregando ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.15 } }}
        >
          {/* Skeleton layout MUST match real content layout exactly */}
          <div className="grid grid-cols-4 gap-4">
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
            <SkeletonKPI />
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.05 } }}
        >
          {/* Real content with same grid structure */}
          <div className="grid grid-cols-4 gap-4">
            {dados.kpis.map((kpi) => (
              <KPICard key={kpi.id} data={kpi} />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Why `mode="wait"` (not "sync")
- `"wait"`: Exit completes → then enter starts (cleaner, no overlap)
- `"sync"`: Both animate simultaneously (can look messy with skeletons)

For skeleton → content, `"wait"` is better because:
1. Skeleton fades out (150ms)
2. Content fades in (250ms with slight delay)
3. Total transition feels like a smooth handoff, not a glitch

---

## 4.3 Module-Specific Skeleton Templates

Each module should have a skeleton that matches its specific layout.

### Kanban Skeleton

```tsx
// src/modules/kanban/components/kanban-skeleton.tsx

import { SkeletonKanbanCard } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {/* 4 columns matching real kanban layout */}
      {Array.from({ length: 4 }).map((_, colIndex) => (
        <div key={colIndex} className="w-72 flex-shrink-0 space-y-3">
          {/* Column header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full animate-shimmer" />
              <div className="h-4 w-20 animate-shimmer rounded-[var(--radius-control)]" />
            </div>
            <div className="h-5 w-6 animate-shimmer rounded-full" />
          </div>
          {/* Cards */}
          <div className="space-y-2 rounded-[var(--radius-card)] bg-[color:rgba(255,255,255,0.02)] p-2">
            <SkeletonKanbanCard />
            <SkeletonKanbanCard />
            {colIndex < 2 && <SkeletonKanbanCard />}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Equipe (Team) Skeleton

```tsx
// src/modules/equipe/components/equipe-skeleton.tsx

import { Skeleton, SkeletonText, SkeletonAvatar, SkeletonButton } from "@/components/ui/skeleton";

export function EquipeSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <SkeletonButton />
      </div>
      {/* Filters */}
      <div className="flex gap-2">
        <Skeleton className="h-10 w-40" rounded="control" />
        <Skeleton className="h-10 w-32" rounded="control" />
        <Skeleton className="h-10 w-24" rounded="control" />
      </div>
      {/* Table */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)]">
        {/* Header row */}
        <div className="flex border-b border-[var(--border-subtle)] px-4 py-3">
          {[120, 100, 80, 90, 60].map((w, i) => (
            <Skeleton key={i} className={`h-3 w-${w / 4} mr-8`} />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-[var(--border-subtle)] px-4 py-3">
            <SkeletonAvatar size="sm" />
            <div className="ml-3 flex-1">
              <Skeleton className="mb-1 h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="ml-8 h-4 w-16" />
            <Skeleton className="ml-8 h-6 w-16" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Recebimentos Skeleton

```tsx
// src/modules/recebimentos/components/recebimentos-skeleton.tsx

import { SkeletonKPI, Skeleton, SkeletonText } from "@/components/ui/skeleton";

export function RecebimentosSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
        <SkeletonKPI />
      </div>
      {/* Table */}
      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center border-b border-[var(--border-subtle)] px-4 py-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-6 h-4 w-32" />
            <Skeleton className="ml-6 h-4 w-20" />
            <Skeleton className="ml-auto h-6 w-20" rounded="full" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 4.4 Dynamic Import Skeletons

The existing `resumo/page.tsx` uses `next/dynamic` with shimmer fallbacks. Enhance these.

```tsx
// BEFORE (existing pattern)
const GraficoVendas = dynamic(() => import("@/components/grafico-vendas").then((mod) => mod.GraficoVendas), {
  loading: () => <div className="min-h-[280px] animate-shimmer rounded-[var(--radius-card)] bg-[var(--surface-elevated)]" />,
  ssr: false,
});

// AFTER (geometry-matching skeleton)
const GraficoVendas = dynamic(
  () => import("@/components/grafico-vendas").then((mod) => mod.GraficoVendas),
  {
    loading: () => (
      <div className="rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24" rounded="control" />
        </div>
        {/* Chart area skeleton — matches chart geometry */}
        <div className="flex items-end gap-1 h-[200px]">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    ),
    ssr: false,
  },
);
```

---

## 4.5 Skeleton Design Rules

1. **Geometry match**: Skeleton must have the same border-radius, padding, and proportions as real content
2. **Color**: Use `animate-shimmer` class (existing) — dark theme compatible gradient
3. **No text**: Skeletons are shapes, never text placeholders
4. **Stagger**: If multiple skeletons appear, stagger their animation start by 50ms
5. **Duration**: Shimmer animation is 1.4s (existing `--duration-shimmer`) — keep it
6. **Transition**: Skeleton exits with `opacity: 0` over 150ms, content enters with `opacity: 1` over 250ms

---

## Files Modified Summary

| File | Change Type |
|------|------------|
| `src/components/ui/skeleton.tsx` | Create — base skeleton + presets |
| `src/modules/kanban/components/kanban-skeleton.tsx` | Create — kanban-specific |
| `src/modules/equipe/components/equipe-skeleton.tsx` | Create — team-specific |
| `src/modules/recebimentos/components/recebimentos-skeleton.tsx` | Create — receivables-specific |
| `src/modules/whatsapp/components/whatsapp-skeleton.tsx` | Create — whatsapp-specific |
| `src/modules/produtos/components/produtos-skeleton.tsx` | Create — products-specific |
| `src/modules/resumo/page.tsx` | Modify — enhance dynamic import skeletons |
| All module `page.tsx` files | Modify — add AnimatePresence skeleton→content |

## Verification

- [ ] Every module shows skeleton while loading
- [ ] Skeleton geometry matches real content layout
- [ ] Transition from skeleton to content is smooth cross-fade
- [ ] No layout shift (CLS) during skeleton → content transition
- [ ] Shimmer animation runs at 60fps (check DevTools)
- [ ] `npm run build` succeeds
