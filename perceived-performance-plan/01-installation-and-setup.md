# Step 1: Installation & Setup

## 1.1 Install Framer Motion

```bash
npm install framer-motion
```

This is the **only new dependency** required. React 19's `useOptimistic` and `useTransition` are already available.

**Version note**: Use `framer-motion` v11+ for best React 19 compatibility. The package has been renamed to `motion` in newer versions but `framer-motion` still works and has the most stable Next.js App Router support.

---

## 1.2 Create Spring Presets Library

**File**: `src/lib/animations/springs.ts`

This is the **single source of truth** for all spring configurations. Every animation in the app must reference these presets — never inline spring values.

```typescript
// src/lib/animations/springs.ts

/**
 * Centralized spring physics presets for HypeCRM.
 * 
 * Physics reference:
 * - stiffness: How fast the spring snaps back (higher = faster)
 * - damping: How quickly oscillation stops (higher = less bounce)
 * - mass: How heavy the object feels (higher = more momentum)
 * 
 * All values tuned for dark premium SaaS feel:
 * snappy, organic, never sluggish or overly bouncy.
 */

export const springs = {
  // === MICRO-INTERACTIONS (hover, tap, toggle) ===
  
  /** Instant tactile feedback — buttons, links, small elements */
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.5,
  },
  
  /** Slightly more deliberate — cards, larger interactive elements */
  responsive: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },
  
  // === LAYOUT TRANSITIONS (modals, sheets, page mounts) ===
  
  /** Smooth entrance — dialogs, sheets, dropdowns */
  smooth: {
    type: "spring" as const,
    stiffness: 300,
    damping: 28,
    mass: 0.8,
  },
  
  /** Gentle settle — page content, large panels */
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 25,
    mass: 1,
  },
  
  // === SPECIAL ===
  
  /** Slight overshoot for emphasis — success states, reveals */
  bouncy: {
    type: "spring" as const,
    stiffness: 350,
    damping: 15,
    mass: 0.6,
  },
  
  /** No bounce at all — precise positioning */
  stiff: {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.5,
  },
} as const;

// === STAGGER CONFIGURATIONS ===

export const stagger = {
  /** List items appearing one by one */
  list: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.04, // 40ms between items
          delayChildren: 0.05,
        },
      },
    },
    item: {
      hidden: { opacity: 0, y: 12 },
      visible: {
        opacity: 1,
        y: 0,
        transition: springs.smooth,
      },
    },
  },
  
  /** Grid items (cards, tiles) appearing with cascade */
  grid: {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.03,
          delayChildren: 0.02,
        },
      },
    },
    item: {
      hidden: { opacity: 0, scale: 0.96, y: 8 },
      visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: springs.responsive,
      },
    },
  },
} as const;
```

---

## 1.3 Create Animation Variants Library

**File**: `src/lib/animations/variants.ts`

Reusable variant objects for common patterns.

```typescript
// src/lib/animations/variants.ts

import { springs } from "./springs";

/**
 * Reusable animation variants for common UI patterns.
 * Import these instead of writing inline variants.
 */

// === TACTILE FEEDBACK VARIANTS ===

export const tactile = {
  /** Standard button: lift on hover, press on tap */
  button: {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -1, transition: springs.snappy },
    tap: { scale: 0.97, y: 0, transition: springs.snappy },
  },
  
  /** Card: subtle scale on hover, press on tap */
  card: {
    rest: { scale: 1 },
    hover: { scale: 1.01, transition: springs.responsive },
    tap: { scale: 0.98, transition: springs.snappy },
  },
  
  /** Icon button: more pronounced feedback */
  iconButton: {
    rest: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, transition: springs.snappy },
    tap: { scale: 0.9, transition: springs.snappy },
  },
  
  /** Link: subtle scale pulse */
  link: {
    rest: { scale: 1 },
    hover: { scale: 1.03, transition: springs.snappy },
    tap: { scale: 0.97, transition: springs.snappy },
  },
} as const;

// === ENTRANCE VARIANTS ===

export const entrance = {
  /** Fade up — most common entrance */
  fadeUp: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: springs.smooth },
    exit: { opacity: 0, y: -8, transition: springs.stiff },
  },
  
  /** Scale in — dialogs, popovers */
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: springs.smooth },
    exit: { opacity: 0, scale: 0.95, transition: springs.stiff },
  },
  
  /** Slide from right — sheets, drawers */
  slideRight: {
    hidden: { opacity: 0, x: "100%" },
    visible: { opacity: 1, x: 0, transition: springs.smooth },
    exit: { opacity: 0, x: "100%", transition: springs.stiff },
  },
  
  /** Slide from bottom — mobile sheets, toasts */
  slideUp: {
    hidden: { opacity: 0, y: "100%" },
    visible: { opacity: 1, y: 0, transition: springs.smooth },
    exit: { opacity: 0, y: "100%", transition: springs.stiff },
  },
} as const;

// === SKELETON TRANSITION ===

export const skeletonTransition = {
  /** Cross-fade from skeleton to content */
  content: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  },
  skeleton: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
    exit: {
      opacity: 0,
      transition: { duration: 0.15 },
    },
  },
} as const;
```

---

## 1.4 Update globals.css

Add new CSS animations for floating elements and refine existing ones.

**Add to `globals.css`** (after existing `@keyframes`):

```css
/* === FLOATING ANIMATION (for empty states) === */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* === PULSE GLOW (for optimistic sync) === */
@keyframes pulseGlow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.animate-pulse-glow {
  animation: pulseGlow 2s ease-in-out infinite;
}

/* === GPU ACCELERATION HINTS === */
/* Apply to elements that will be animated with Framer Motion */
.will-animate-transform {
  will-change: transform;
}

.will-animate-opacity {
  will-change: opacity;
}

.will-animate-both {
  will-change: transform, opacity;
}

/* === REFINED SHIMMER (darker theme compatible) === */
/* The existing .animate-shimmer is fine, but add a variant for cards */
.animate-shimmer-card {
  background: linear-gradient(
    90deg,
    rgb(17 17 19 / 80%) 0%,
    rgb(30 30 33 / 90%) 50%,
    rgb(17 17 19 / 80%) 100%
  );
  background-size: 200% 100%;
  animation: shimmer var(--duration-shimmer) linear infinite;
}
```

**Modify the global `*` transition** (line 142-148) to exclude properties that should NOT be globally transitioned:

```css
/* BEFORE */
* {
  transition-property: color, background-color, border-color, box-shadow, opacity;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-productive);
}

/* AFTER — remove opacity from global transition (Framer Motion handles it) */
* {
  transition-property: color, background-color, border-color, box-shadow;
  transition-duration: var(--duration-fast);
  transition-timing-function: var(--ease-productive);
}
```

**Why**: When Framer Motion controls opacity animations, the global CSS transition on opacity creates conflicts and double-animation artifacts.

---

## 1.5 Create Framer Motion Provider (Optional)

For advanced animations or bundle size optimization, create a provider. However, Framer Motion works without a provider — each component handles its own transitions. Skip this unless you need `LazyMotion` for bundle size optimization.

**Bundle size note**: `framer-motion` is ~32KB gzipped. If bundle size is a concern, use `motion/react` (the lighter import path) and consider `LazyMotion` with `domAnimation` features for tree-shaking. For this CRM, the full bundle is acceptable.

---

## Verification Checklist

- [ ] `npm install framer-motion` succeeds
- [ ] `src/lib/animations/springs.ts` created with all presets
- [ ] `src/lib/animations/variants.ts` created with all variants
- [ ] `globals.css` updated with floating animation and GPU hints
- [ ] `globals.css` global `*` transition excludes `opacity`
- [ ] `npm run build` succeeds with no errors
- [ ] `npm run lint` passes
