# Perceived Performance & UX Overhaul — HypeCRM

## Executive Summary

This plan transforms HypeCRM from a functional CRM into a **premium, native-feeling 120fps experience**. The goal is not just real performance — it's **perceived performance**: every interaction must feel instant, physical, and delightful, even on low-end mobile phones or old laptops.

The overhaul covers 5 pillars:
1. **Micro-interactivity & Tactile Feedback** — Every clickable element responds physically
2. **Spring Physics Layout Transitions** — Organic, snappy motion replaces linear CSS transitions
3. **Seamless Skeleton Loaders** — Geometry-matching shimmer placeholders with cross-fade
4. **Delightful Empty States** — Alive, floating, minimalist empty screens
5. **Hardware Acceleration & Optimistic UI** — GPU-only animations + instant UI updates

---

## Current State Analysis

### What Exists
- **Pure CSS animations** via `@keyframes` (fadeIn, slideUp, scaleIn, shimmer, stagger)
- **CSS transition tokens**: `--ease-productive`, `--ease-snappy`, `--duration-fast: 140ms`
- **Basic micro-interactions**: Button `active:scale-[0.99]`, hover `-translate-y-px`
- **CSS shimmer skeleton**: `.animate-shimmer` class with gradient background
- **OptimisticSync component**: Dashed-border wrapper for optimistic items
- **EmptyState component**: Static icon + text, no animations
- **React 19** with `useOptimistic` and `useTransition` available but unused
- **No framer-motion** dependency

### What's Missing
- No spring physics (all animations use linear/timed easing)
- No layout animations (AnimatePresence, layoutId)
- No cross-fade skeleton-to-content transitions
- No floating/delighting empty states
- No `useOptimistic` usage (manual optimistic patterns in kanban)
- No GPU acceleration enforcement (global transition includes `background-color`, `border-color`)
- No page transition animations
- No staggered list entrance animations with spring physics

---

## Architecture Decisions

### Why Framer Motion (not React Spring)
- **Declarative API** matches the existing component-based architecture
- **AnimatePresence** handles mount/unmount transitions (critical for skeletons → content)
- **layout / layoutId** enables shared element transitions (cards, modals)
- **whileHover / whileTap** built-in gesture support
- **Smaller learning curve** for the team
- **Better Next.js App Router integration** via `template.tsx` pattern

### Why React 19 `useOptimistic` (not Zustand/Redux)
- **Zero new dependencies** — built into React 19
- **Automatic rollback** when server responds with error
- **Pairs with `useTransition`** for non-blocking updates
- **Works with Server Actions** (already using Next.js App Router)
- **Simpler mental model** than external state management

### Why Not Replace All CSS Animations
- CSS `@keyframes` remain optimal for **continuous loops** (shimmer, floating)
- Framer Motion handles **interactive/conditional** animations (hover, tap, mount, layout)
- Hybrid approach: CSS for decorative, Framer Motion for interactive

---

## Technology Stack After Overhaul

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Micro-interactions | Framer Motion `whileHover`/`whileTap` | Tactile button/card feedback |
| Layout transitions | Framer Motion `AnimatePresence` + `layout` | Page/modal/list animations |
| Spring physics | Framer Motion `transition={{ type: "spring" }}` | Organic motion |
| Skeleton loaders | CSS `@keyframes` shimmer + Framer Motion cross-fade | Loading states |
| Empty states | CSS floating animation + Framer Motion entrance | Delightful emptiness |
| Optimistic UI | React 19 `useOptimistic` + `useTransition` | Instant mutations |
| GPU acceleration | CSS `transform`/`opacity` only + `will-change` | 60fps guarantee |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/animations/springs.ts` | Centralized spring presets |
| `src/lib/animations/variants.ts` | Reusable animation variant configs |
| `src/components/ui/motion-button.tsx` | Framer Motion Button wrapper |
| `src/components/ui/motion-card.tsx` | Framer Motion Card wrapper |
| `src/components/ui/skeleton.tsx` | Enhanced skeleton component |
| `src/components/ui/empty-state-animated.tsx` | Animated empty state |
| `src/components/ui/page-transition.tsx` | Page transition wrapper |
| `src/app/template.tsx` | Route-level animation template |

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `framer-motion` dependency |
| `src/app/globals.css` | Add floating animation, refine shimmer, add GPU hints |
| `src/components/ui/button.tsx` | Wrap with motion, add whileHover/whileTap |
| `src/components/ui/card.tsx` | Add hover scale + lift with spring |
| `src/components/ui/dialog.tsx` | Replace CSS animation with Framer Motion spring |
| `src/components/ui/sheet.tsx` | Add spring slide animation |
| `src/components/ui/optimistic-sync.tsx` | Add AnimatePresence mount/unmount |
| `src/modules/kanban/components/empty-state.tsx` | Add floating icon animation |
| `src/modules/kanban/hooks/use-kanban-movimentacao.ts` | Migrate to `useOptimistic` |
| All module `page.tsx` files | Add skeleton cross-fade patterns |

---

## Golden Rules

1. **ONLY animate `transform` and `opacity`** — never `width`, `height`, `margin`, `top`, `left`
2. **Every interactive element** must have `whileHover` and `whileTap` feedback
3. **Every layout shift** must use spring physics, not linear easing
4. **Every loading state** must show a geometry-matching skeleton
5. **Every empty state** must have a subtle floating animation
6. **Every mutation** must update UI optimistically before server responds
7. **Full motion always on** — no reduced motion support, premium experience for everyone
