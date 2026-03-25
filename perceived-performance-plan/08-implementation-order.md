# Step 8: Implementation Order — Step-by-Step Execution Plan

## Overview

This plan is organized in **dependency order**. Each phase builds on the previous one. An AI model can execute these phases sequentially, with each phase being independently testable and shippable.

**Total estimated effort**: 8-12 hours of focused implementation
**Recommended approach**: One phase per session, validate before proceeding

---

## Phase 0: Foundation (30 min)
**Goal**: Install dependencies and create shared infrastructure

### Steps
1. Install framer-motion:
   ```bash
   npm install framer-motion
   ```

2. Create `src/lib/animations/springs.ts` (see `01-installation-and-setup.md` §1.2)
   - All spring presets in one file
   - Stagger configurations
   - `useMotionTransition` helper hook

3. Create `src/lib/animations/variants.ts` (see `01-installation-and-setup.md` §1.3)
   - Tactile feedback variants (button, card, iconButton, link)
   - Entrance variants (fadeUp, scaleIn, slideRight, slideUp)
   - Skeleton transition variants

4. Update `src/app/globals.css` (see `01-installation-and-setup.md` §1.4)
   - Add `@keyframes float` and `.animate-float`
   - Add `@keyframes pulseGlow` and `.animate-pulse-glow`
   - Add `.will-animate-*` utility classes
   - Add `.animate-shimmer-card` variant
   - **CRITICAL**: Remove `opacity` from global `*` transition-property

5. Verify: `npm run build` succeeds

---

## Phase 1: Micro-Interactions (1-2 hours)
**Goal**: Every interactive element has tactile feedback

### Steps
1. Modify `src/components/ui/button.tsx` (see `02-micro-interactions.md` §2.1)
   - Wrap with `motion.button`
   - Add `whileHover: { scale: 1.02, y: -1 }` with `springs.snappy`
   - Add `whileTap: { scale: 0.97, y: 0 }` with `springs.snappy`
   - Remove CSS `active:scale-[0.99]` and `hover:-translate-y-px`
   - Respect `useReducedMotion()`

2. Modify `src/components/ui/card.tsx` (see `02-micro-interactions.md` §2.2)
   - Wrap with `motion.div`
   - Add `whileHover: { scale: 1.01 }` with `springs.responsive`
   - Add `whileTap: { scale: 0.98 }` with `springs.snappy`

3. Modify `src/components/ui/table.tsx` (see `02-micro-interactions.md` §2.3)
   - Add motion to `TableRow` when interactive (has onClick)

4. Modify `src/components/ui/badge.tsx` (see `02-micro-interactions.md` §2.4)
   - Add motion variant for clickable badges

5. Verify: All buttons scale on hover/tap, all cards lift on hover

---

## Phase 2: Spring Layout Transitions (1-2 hours)
**Goal**: All mount/unmount/layout changes use spring physics

### Steps
1. Create `src/app/template.tsx` (see `03-spring-animations.md` §3.1)
   - Page transition wrapper with AnimatePresence
   - Spring-based fade + slide animation

2. Create `src/app/(dashboard)/template.tsx` (see `03-spring-animations.md` §3.1)
   - Dashboard-specific page transitions

3. Modify `src/components/ui/dialog.tsx` (see `03-spring-animations.md` §3.2)
   - Replace CSS `animate-scale-in` with Framer Motion spring
   - Replace CSS `animate-fade-in` on overlay with motion opacity
   - Use `springs.smooth` for entrance, `springs.stiff` for exit

4. Create `src/components/ui/motion-list.tsx` (see `03-spring-animations.md` §3.4)
   - `MotionList` and `MotionListItem` components
   - Staggered entrance with spring physics

5. Verify: Page transitions feel organic, dialogs spring open

---

## Phase 3: Skeleton Loaders (1-2 hours)
**Goal**: Every loading state shows geometry-matching skeleton with cross-fade

### Steps
1. Create `src/components/ui/skeleton.tsx` (see `04-skeleton-loaders.md` §4.1)
   - Base `Skeleton` component with shimmer
   - Presets: `SkeletonText`, `SkeletonAvatar`, `SkeletonButton`, `SkeletonCard`, `SkeletonTableRow`, `SkeletonKPI`, `SkeletonKanbanCard`

2. Create module-specific skeletons:
   - `src/modules/kanban/components/kanban-skeleton.tsx` (see §4.3)
   - `src/modules/equipe/components/equipe-skeleton.tsx` (see §4.3)
   - `src/modules/recebimentos/components/recebimentos-skeleton.tsx` (see §4.3)
   - `src/modules/whatsapp/components/whatsapp-skeleton.tsx` (see §4.3)
   - `src/modules/produtos/components/produtos-skeleton.tsx` (see §4.3)

3. Modify each module's `page.tsx` to use AnimatePresence cross-fade pattern:
   ```tsx
   <AnimatePresence mode="wait">
     {carregando ? (
       <motion.div key="skeleton" ...><ModuleSkeleton /></motion.div>
     ) : (
       <motion.div key="content" ...><ModuleContent /></motion.div>
     )}
   </AnimatePresence>
   ```

4. Enhance dynamic import skeletons in `src/app/(dashboard)/resumo/page.tsx` (see §4.4)

5. Verify: Every module shows skeleton while loading, cross-fade is smooth

---

## Phase 4: Delightful Empty States (1 hour)
**Goal**: Every empty screen has floating animation and feels alive

### Steps
1. Create `src/components/ui/empty-state-animated.tsx` (see `05-empty-states.md` §5.1)
   - Floating icon with `translateY` loop
   - Staggered text entrance
   - Subtle brand glow behind icon

2. Modify `src/modules/kanban/components/empty-state.tsx` (see §5.2)
   - Add floating animation to existing component
   - Add spring entrance animation

3. Replace spinner/blank states in modules:
   - `src/modules/whatsapp/page.tsx` — replace Loader2 spinner with EmptyStateAnimated
   - `src/modules/equipe/page.tsx` — add empty state for no members
   - `src/modules/produtos/page.tsx` — add empty state for no products
   - `src/modules/recebimentos/page.tsx` — add empty state for no receivables

4. Verify: Every empty state floats, entrance is animated

---

## Phase 5: Optimistic UI (1-2 hours)
**Goal**: All mutations update UI instantly before server responds

### Steps
1. Modify `src/modules/kanban/hooks/use-kanban-movimentacao.ts` (see `06-optimistic-ui.md` §6.7)
   - Replace manual `setLeads()` with `useOptimistic`
   - Use `useTransition` for non-blocking server requests
   - Return `optimisticLeads` for rendering
   - Remove manual rollback logic (React handles it)

2. Modify `src/modules/kanban/components/kanban-board.tsx`
   - Use `optimisticLeads` instead of `leads` for rendering
   - Show subtle loading indicator when `isPending`

3. Modify `src/components/ui/optimistic-sync.tsx` (see §6.10)
   - Add AnimatePresence for smooth mount/unmount
   - Add pulsing label animation

4. Add optimistic patterns to other modules:
   - `src/modules/equipe/hooks/use-equipe-operacoes.ts` — optimistic delete
   - `src/modules/kanban/components/kanban-card.tsx` — optimistic favorite toggle

5. Verify: Kanban moves are instant, deletes are instant, rollback works on error

---

## Phase 6: GPU Audit & Polish (1 hour)
**Goal**: Guarantee 60fps, eliminate layout thrashing

### Steps
1. Audit all animations for GPU-only properties (see `07-gpu-acceleration.md` §7.2)
   - Search codebase for `width`, `height`, `margin`, `padding` animations
   - Replace with `transform` equivalents

2. Add `contain: layout style paint` to high-density animated containers:
   - Kanban cards
   - Table rows
   - Dashboard KPI cards

3. Test with Chrome DevTools:
   - Enable Paint flashing
   - Record Performance profile
   - Verify no Layout or Paint during animations

4. Test `prefers-reduced-motion`:
   - Emulate in DevTools
   - Verify all animations are instant

5. Test on throttled CPU (4x slowdown):
   - Verify 60fps on hover interactions
   - Verify smooth page transitions

6. Final `npm run build` and `npm run lint`

---

## Dependency Graph

```
Phase 0 (Foundation)
    │
    ├── Phase 1 (Micro-Interactions)
    │
    ├── Phase 2 (Spring Transitions)
    │
    ├── Phase 3 (Skeleton Loaders)
    │       │
    │       └── Phase 4 (Empty States)
    │
    └── Phase 5 (Optimistic UI)
            │
            └── Phase 6 (GPU Audit & Polish)
```

**Phases 1, 2, 3, 5** can be done in parallel after Phase 0.
**Phase 4** depends on Phase 3 (skeletons must exist first).
**Phase 6** must be last (audit everything).

---

## Quick Reference: File Map

### New Files to Create (10 files)
```
src/lib/animations/springs.ts
src/lib/animations/variants.ts
src/components/ui/skeleton.tsx
src/components/ui/empty-state-animated.tsx
src/components/ui/motion-list.tsx
src/app/template.tsx
src/app/(dashboard)/template.tsx
src/modules/kanban/components/kanban-skeleton.tsx
src/modules/equipe/components/equipe-skeleton.tsx
src/modules/recebimentos/components/recebimentos-skeleton.tsx
```

### Existing Files to Modify (12+ files)
```
package.json                          — add framer-motion
src/app/globals.css                   — add animations, fix transition-property
src/components/ui/button.tsx          — wrap with motion
src/components/ui/card.tsx            — wrap with motion
src/components/ui/dialog.tsx          — replace CSS with Framer Motion
src/components/ui/table.tsx           — add motion to TableRow
src/components/ui/badge.tsx           — add motion variant
src/components/ui/optimistic-sync.tsx — add AnimatePresence
src/modules/kanban/components/empty-state.tsx — add floating
src/modules/kanban/hooks/use-kanban-movimentacao.ts — migrate to useOptimistic
src/modules/kanban/components/kanban-board.tsx — use optimisticLeads
src/app/(dashboard)/resumo/page.tsx   — enhance dynamic import skeletons
```

### Module pages to add skeleton + empty state (5+ files)
```
src/modules/kanban/page.tsx
src/modules/equipe/page.tsx
src/modules/whatsapp/page.tsx
src/modules/produtos/page.tsx
src/modules/recebimentos/page.tsx
```

---

## Validation Checklist (After All Phases)

- [ ] Every button has hover (scale 1.02) and tap (scale 0.97) feedback
- [ ] Every card has hover (scale 1.01) and tap (scale 0.98) feedback
- [ ] Page transitions use spring physics (not linear)
- [ ] Dialogs open with spring scale animation
- [ ] Every loading state shows geometry-matching skeleton
- [ ] Skeleton → content transition is smooth cross-fade
- [ ] Every empty state has floating icon animation
- [ ] Kanban lead movement is instant (optimistic)
- [ ] Deleting items is instant (optimistic)
- [ ] Error rollback works correctly
- [ ] No animation uses `width`, `height`, `margin`, `top`, `left`
- [ ] `prefers-reduced-motion` disables all motion
- [ ] 60fps on Chrome DevTools Performance profile
- [ ] CLS < 0.1 in Lighthouse
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
