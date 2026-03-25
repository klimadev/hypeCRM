# Step 3: Spring Physics Layout Transitions

## Goal
Any layout shift, page transition, or component mounting/unmounting must use **spring physics** — snappy, organic, non-linear. No boring ease-in-outs.

---

## 3.1 Page Transitions with template.tsx

**File**: `src/app/template.tsx` (create new)

Next.js App Router's `template.tsx` remounts on every navigation, making it the perfect place for page transition animations.

```tsx
// src/app/template.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { springs } from "@/lib/animations/springs";

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: springs.gentle }}
        exit={{ opacity: 0, y: -4, transition: springs.stiff }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### How It Works
- `AnimatePresence` detects when `key={pathname}` changes
- Old page plays `exit` animation (fade out + slight up)
- New page plays `initial` → `animate` (fade in + slight down)
- `mode="wait"` ensures exit completes before enter starts
- Spring physics makes the motion feel organic, not robotic

### Placement
This file goes in `src/app/template.tsx` — it wraps ALL routes. For the dashboard specifically, you may want a second template at `src/app/(dashboard)/template.tsx` with different animation settings.

---

## 3.2 Dialog/Modal Spring Animations

**File**: `src/components/ui/dialog.tsx` (modify existing)

Replace CSS `animate-scale-in` with Framer Motion spring animation.

```tsx
// src/components/ui/dialog.tsx

"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-[var(--surface-overlay)] backdrop-blur-md",
      className,
    )}
    asChild
    {...props}
  >
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    />
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        asChild
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-overlay)]",
          "focus:outline-none",
          className,
        )}
        {...props}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: springs.smooth }}
          exit={{ opacity: 0, scale: 0.95, y: 4, transition: springs.stiff }}
        >
          {children}
          <DialogClose className="absolute right-4 top-4 rounded-[calc(var(--radius-control)-2px)] p-1 text-[var(--text-tertiary)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:bg-[color:rgba(255,255,255,0.06)] hover:text-[var(--text-primary)] focus:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)]">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </DialogClose>
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

// DialogHeader, DialogFooter, DialogTitle, DialogDescription remain unchanged
```

### Key Changes
- Removed `animate-scale-in` and `animate-fade-in` CSS classes
- Added `motion.div` with spring-based `initial/animate/exit`
- Dialog scales from 0.95 → 1.0 with `springs.smooth` (stiffness: 300, damping: 28)
- Overlay fades with simple opacity (no spring needed for pure fade)
- Exit uses `springs.stiff` for quick, clean dismissal

---

## 3.3 Sheet/Drawer Spring Animations

**File**: `src/components/ui/sheet.tsx` (modify existing)

The existing Sheet uses Vaul drawer. Enhance with spring physics for the slide animation.

```tsx
// In sheet.tsx, replace the CSS translate transitions with Framer Motion

// The Vaul Drawer already has its own animation system.
// To integrate spring physics, wrap the drawer content:

import { motion } from "framer-motion";
import { springs } from "@/lib/animations/springs";

// For the DrawerContent component, add spring transition to Vaul:
<Drawer.Content
  className="..."
  // Vaul supports custom transition via style prop
  style={{
    transition: `transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)`,
  }}
>
  {/* content */}
</Drawer.Content>

// NOTE: Vaul has its own animation system. If spring physics
// integration is too complex, keep Vaul's default animations
// which are already quite smooth. The key improvement is
// ensuring the overlay uses opacity-only animation.
```

**Decision**: Vaul's built-in animations are already spring-like. The main improvement is ensuring the overlay uses GPU-accelerated opacity. Skip deep Vaul customization unless the default feels wrong.

---

## 3.4 List Stagger Animations

**File**: Create `src/components/ui/motion-list.tsx` (new)

A reusable wrapper for lists that need staggered entrance animations.

```tsx
// src/components/ui/motion-list.tsx

"use client";

import { motion } from "framer-motion";
import { springs } from "@/lib/animations/springs";
import type { ReactNode } from "react";

type MotionListProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
};

export function MotionList({ children, className, staggerDelay = 0.04 }: MotionListProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.02,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

type MotionListItemProps = {
  children: ReactNode;
  className?: string;
};

export function MotionListItem({ children, className }: MotionListItemProps) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: springs.smooth },
      }}
    >
      {children}
    </motion.div>
  );
}
```

### Usage Example

```tsx
// In a module page that lists items:
<MotionList className="space-y-2">
  {items.map((item) => (
    <MotionListItem key={item.id}>
      <ItemCard item={item} />
    </MotionListItem>
  ))}
</MotionList>
```

---

## 3.5 AnimatePresence for Conditional Content

When content appears/disappears conditionally (loading → loaded, empty → data), wrap with AnimatePresence.

```tsx
import { AnimatePresence, motion } from "framer-motion";

// In a module page:
<AnimatePresence mode="wait">
  {carregando ? (
    <motion.div
      key="skeleton"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <SkeletonContent />
    </motion.div>
  ) : dados.length === 0 ? (
    <motion.div
      key="empty"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0, transition: springs.smooth }}
      exit={{ opacity: 0 }}
    >
      <EmptyStateAnimated />
    </motion.div>
  ) : (
    <motion.div
      key="data"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: springs.gentle }}
      exit={{ opacity: 0 }}
    >
      <DataContent data={dados} />
    </motion.div>
  )}
</AnimatePresence>
```

---

## 3.6 Kanban Drag Animations

**File**: `src/modules/kanban/components/kanban-card.tsx` (modify)

The existing `@hello-pangea/dnd` handles drag animations. Enhance the card's drag state with Framer Motion.

```tsx
import { motion } from "framer-motion";

// When card is being dragged (use @hello-pangea/dnd's snapshot):
<div
  {...draggableProps}
  ref={innerRef}
  className={cn(
    "transition-shadow",
    snapshot.isDragging && "shadow-2xl scale-[1.02] rotate-1 opacity-90"
  )}
>
  {/* card content */}
</div>

// NOTE: @hello-pangea/dnd manages its own drag transforms.
// Do NOT wrap with motion.div for drag — it will conflict.
// Only enhance the visual state classes (shadow, opacity).
```

**Important**: Do NOT use Framer Motion's `drag` prop alongside `@hello-pangea/dnd`. They will conflict. Keep `@hello-pangea/dnd` for drag logic and only use CSS classes for visual drag state.

---

## Files Modified Summary

| File | Change Type |
|------|------------|
| `src/app/template.tsx` | Create — page transition wrapper |
| `src/app/(dashboard)/template.tsx` | Create — dashboard-specific transitions |
| `src/components/ui/dialog.tsx` | Major — replace CSS with Framer Motion |
| `src/components/ui/sheet.tsx` | Minor — keep Vaul defaults, ensure GPU |
| `src/components/ui/motion-list.tsx` | Create — staggered list wrapper |

## Verification

- [ ] Page transitions use spring physics (snappy, not linear)
- [ ] Dialog opens with scale spring (0.95 → 1.0)
- [ ] Dialog closes with quick spring exit
- [ ] Lists stagger in with 40ms delay between items
- [ ] No jank during transitions (check Chrome DevTools Performance)
- [ ] `npm run build` succeeds
