# Step 2: Micro-Interactivity & Tactile Feedback

## Goal
Every interactive element (buttons, cards, links, icon buttons) must have **instant physical feedback**. On hover: scale up slightly. On tap/click: shrink instantly to simulate physical resistance.

---

## 2.1 Motion Button

**File**: `src/components/ui/button.tsx` (modify existing)

The existing Button uses CSS `active:scale-[0.99]` and `hover:-translate-y-px`. We upgrade it to Framer Motion for spring-based tactile feedback.

### Implementation

```tsx
// src/components/ui/button.tsx

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

const buttonVariants = cva(
  // Remove active:scale-[0.99] and hover:-translate-y-px from base
  // Framer Motion handles these now
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] border border-transparent text-sm font-medium text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-productive)] focus-visible:outline-none focus-visible:border-[var(--border-focus)] focus-visible:shadow-[var(--focus-ring)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-[var(--border-subtle)] disabled:bg-[color:rgba(255,255,255,0.04)] disabled:text-[var(--text-disabled)] disabled:shadow-none",
  {
    variants: {
      variant: {
        default:
          "border-[color:var(--brand-strong)] bg-[var(--brand)] text-[var(--primary-foreground)] shadow-[var(--shadow-glow)] hover:bg-[var(--brand-strong)]",
        secondary:
          "border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:border-[var(--border-strong)] hover:bg-[color:rgba(255,255,255,0.08)]",
        outline:
          "border-[var(--border-strong)] bg-[color:rgba(12,12,14,0.72)] text-[var(--text-secondary)] shadow-none hover:border-[var(--border-focus)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]",
        ghost:
          "bg-transparent text-[var(--text-secondary)] shadow-none hover:bg-[color:rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]",
        destructive:
          "border-[color:rgba(244,63,94,0.4)] bg-[color:rgba(244,63,94,0.16)] text-[color:#ffe4ea] shadow-none hover:border-[color:rgba(244,63,94,0.58)] hover:bg-[color:rgba(244,63,94,0.24)]",
        success:
          "border-[color:rgba(16,185,129,0.34)] bg-[var(--success)] text-[color:#04130f] shadow-[0_16px_40px_-24px_rgba(16,185,129,0.7)] hover:bg-[color:#34d399]",
        link: "h-auto rounded-none border-0 bg-transparent px-0 py-0 text-[var(--brand)] underline-offset-4 shadow-none hover:text-[color:#a78bfa] hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-[calc(var(--radius-control)-2px)] px-3 text-xs",
        lg: "h-11 rounded-[calc(var(--radius-control)+2px)] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // For link variant, skip motion (links have their own interaction pattern)
    if (variant === "link") {
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        >
          {loading ? <LoadingSpinner /> : children}
        </Comp>
      );
    }

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled || loading}
        variants={{
          rest: { scale: 1, y: 0 },
          hover: { scale: 1.02, y: -1, transition: springs.snappy },
          tap: { scale: 0.97, y: 0, transition: springs.snappy },
        }}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        {...(props as any)}
      >
        {loading ? <LoadingSpinner /> : children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";

function LoadingSpinner() {
  return (
    <span className="flex items-center gap-2">
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span>Carregando...</span>
    </span>
  );
}

export { Button, buttonVariants };
```

### Key Changes
- Removed `active:scale-[0.99]` and `hover:-translate-y-px` from CSS classes
- Added `motion.button` with `whileHover` and `whileTap` using spring physics
- `scale: 1.02` on hover (slight lift), `scale: 0.97` on tap (physical press)
- `y: -1` on hover (subtle elevation), `y: 0` on tap (return to surface)
- Respects `prefers-reduced-motion` — disables all motion transforms
- `transition-property` in CSS changed to only `color, background-color, border-color, box-shadow` (no `opacity` — Framer Motion handles that)

---

## 2.2 Motion Card

**File**: `src/components/ui/card.tsx` (modify existing)

Cards get a subtle scale-up on hover with spring physics.

```tsx
// src/components/ui/card.tsx

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations/springs";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <motion.div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)] transition-colors duration-[var(--duration-fast)] ease-[var(--ease-productive)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]",
        className,
      )}
      variants={{
        rest: { scale: 1 },
        hover: { scale: 1.01, transition: springs.responsive },
        tap: { scale: 0.98, transition: springs.snappy },
      }}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      {...(props as any)}
    />
  );
}

// CardHeader, CardTitle, CardDescription, CardContent, CardFooter
// remain unchanged — they're layout components, not interactive
```

### Key Changes
- `div` → `motion.div`
- `hover:scale-1.01` — barely perceptible but creates "lift" feeling
- `tap:scale-0.98` — press feedback
- Border and shadow transitions remain CSS (they're color/box-shadow, GPU-friendly)

---

## 2.3 Interactive Table Rows

**File**: `src/components/ui/table.tsx` (modify existing)

Table rows should feel clickable when they have `onClick` or are wrapped in links.

```tsx
// Add to table.tsx — TableRow component

function TableRow({ className, onClick, ...props }: React.ComponentProps<"tr">) {
  const isInteractive = !!onClick;
  
  if (!isInteractive) {
    return <tr className={cn("border-b border-[var(--border-subtle)] transition-colors hover:bg-[color:rgba(255,255,255,0.03)]", className)} {...props} />;
  }
  
  return (
    <motion.tr
      className={cn(
        "border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[color:rgba(255,255,255,0.03)]",
        className,
      )}
      onClick={onClick}
      variants={{
        rest: { scale: 1 },
        tap: { scale: 0.995, transition: springs.snappy },
      }}
      initial="rest"
      whileTap="tap"
      {...(props as any)}
    />
  );
}
```

---

## 2.4 Interactive Badge/Chip

Badges that are clickable (filters, tags) should have tactile feedback.

```tsx
// Add a motion variant to badge.tsx or create a ClickableBadge

import { motion } from "framer-motion";
import { springs } from "@/lib/animations/springs";

// When badge has onClick:
<motion.span
  className={cn(badgeVariants({ variant }), "cursor-pointer")}
  whileHover={{ scale: 1.05, transition: springs.snappy }}
  whileTap={{ scale: 0.95, transition: springs.snappy }}
  onClick={onClick}
>
  {children}
</motion.span>
```

---

## 2.5 Sidebar Navigation Items

**File**: `src/components/shared/sidebar.tsx` (or wherever sidebar lives)

Navigation items should have subtle scale feedback.

```tsx
<motion.div
  variants={{
    rest: { scale: 1, x: 0 },
    hover: { scale: 1.02, x: 2, transition: springs.snappy },
    tap: { scale: 0.98, x: 0, transition: springs.snappy },
  }}
  initial="rest"
  whileHover="hover"
  whileTap="tap"
  className="flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 ..."
>
  {/* nav item content */}
</motion.div>
```

---

## Global CSS Change Required

In `globals.css`, the `*` selector currently transitions `opacity`. This must be removed because Framer Motion will handle opacity:

```css
/* BEFORE */
* {
  transition-property: color, background-color, border-color, box-shadow, opacity;
  ...
}

/* AFTER */
* {
  transition-property: color, background-color, border-color, box-shadow;
  ...
}
```

---

## Files Modified Summary

| File | Change Type |
|------|------------|
| `src/components/ui/button.tsx` | Major — wrap with motion.button |
| `src/components/ui/card.tsx` | Minor — wrap with motion.div |
| `src/components/ui/table.tsx` | Minor — add motion to TableRow |
| `src/components/ui/badge.tsx` | Minor — add motion variant for clickable |
| `src/app/globals.css` | Minor — remove opacity from global transition |

## Verification

- [ ] All buttons scale on hover (1.02) and press (0.97)
- [ ] All cards scale on hover (1.01) and press (0.98)
- [ ] Animations use spring physics (snappy, not linear)
- [ ] No layout shift from scale transforms (use `transform-origin: center`)
- [ ] `npm run build` succeeds
