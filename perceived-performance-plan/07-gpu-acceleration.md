# Step 7: GPU Acceleration & Performance Audit

## Goal
Guarantee 60fps on all animations by enforcing GPU-only properties and eliminating layout thrashing.

---

## 7.1 Property Audit Checklist

Review EVERY animated element in the codebase. For each animation, verify:

| Check | Pass Criteria |
|-------|--------------|
| Animated properties | Only `transform` and `opacity` |
| No layout triggers | No `width`, `height`, `margin`, `padding`, `top`, `left` |
| GPU hint | `will-change` on continuous animations only |
| Containment | `contain: layout style paint` on isolated animated containers |
| Reduced motion | `prefers-reduced-motion` respected |

---

## 7.2 Current Codebase Audit

### globals.css — Issues Found

**Line 145-147**: Global `*` transition includes `opacity`
```css
/* PROBLEM: Framer Motion will conflict with CSS opacity transitions */
transition-property: color, background-color, border-color, box-shadow, opacity;
```
**FIX**: Remove `opacity` from global transition.

**Line 209-218**: `slideUp` animation uses `translateY` ✅ (GPU-safe)
**Line 221-230**: `scaleIn` animation uses `scale` ✅ (GPU-safe)
**Line 245-253**: `shimmer` animation uses `background-position` ⚠️ (triggers paint, but acceptable for shimmer — it's a continuous decorative animation, not interactive)

### button.tsx — Issues Found

**Line 7**: `hover:-translate-y-px` ✅ (GPU-safe)
**Line 7**: `active:scale-[0.99]` ✅ (GPU-safe)
**No issues** — but will be replaced with Framer Motion for spring physics.

### card.tsx — Issues Found

**Line 5**: `hover:border-[var(--border-strong)]` ⚠️ (triggers paint, but acceptable — it's a color change, not layout)
**Line 5**: `hover:shadow-[var(--shadow-md)]` ⚠️ (triggers paint, but acceptable — box-shadow is paint-only)

### dialog.tsx — Issues Found

**Line 20**: `animate-fade-in` on overlay ✅ (opacity only)
**Line 38**: `animate-scale-in` on content ✅ (scale + opacity)
**No issues** — but will be upgraded to Framer Motion springs.

---

## 7.3 Performance Testing Protocol

### Chrome DevTools

1. **Open DevTools → Performance tab**
2. **Enable "Paint flashing"** (Rendering panel)
   - Green overlay = paint happening
   - No overlay = composite-only (good)
3. **Record animation** for 3-5 seconds
4. **Check flame chart**:
   - Look for purple bars (Layout) — should be absent during animations
   - Look for green bars (Paint) — should be minimal
   - Yellow bars (Scripting) — acceptable for JS-driven animations
   - Green-composite bars — this is what we want

### Lighthouse

Run Lighthouse performance audit. Key metrics:
- **CLS (Cumulative Layout Shift)**: Must be < 0.1
  - Skeleton → content transition must not cause layout shift
  - Scale transforms must not affect surrounding elements
- **FID (First Input Delay)**: Must be < 100ms
  - Optimistic UI should make this near-zero
- **INP (Interaction to Next Paint)**: Must be < 200ms

### Mobile Testing

Test on:
- **Low-end Android** (Chrome) — budget phone with 2GB RAM
- **Old iPhone** (Safari) — iPhone 8 or older
- **Throttled CPU** — Chrome DevTools 4x/6x CPU throttle

---

## 7.4 Framer Motion Performance Tips

### Use `layout` Prop Sparingly

```tsx
// GOOD — only on elements that actually change size/position
<motion.div layout>
  {expanded ? <ExpandedContent /> : <CollapsedContent />}
</motion.div>

// BAD — on every element
<div>
  {items.map((item) => (
    <motion.div layout key={item.id}> {/* Don't do this for static lists */}
      {item.name}
    </motion.div>
  ))}
</div>
```

The `layout` prop enables FLIP animations (First, Last, Invert, Play) which are GPU-accelerated. But it adds overhead — only use it when elements actually change position/size.

### Use `layoutId` for Shared Element Transitions

```tsx
// Card in list view
<motion.div layoutId={`card-${id}`}>
  <CardSummary data={item} />
</motion.div>

// Same card in detail view (different route)
<motion.div layoutId={`card-${id}`}>
  <CardDetail data={item} />
</motion.div>

// Framer Motion animates between the two automatically
```

### LazyMotion for Bundle Size

If `framer-motion` bundle size is a concern:

```tsx
// src/app/providers.tsx
import { LazyMotion, domAnimation } from "framer-motion";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  );
}

// Then use `m.div` instead of `motion.div` in components
import { m } from "framer-motion";
<m.div animate={{ scale: 1.02 }} />
```

This reduces the bundle by ~10KB by tree-shaking unused features.

---

## 7.5 Animation Budget

Limit simultaneous animations to maintain 60fps:

| Context | Max Simultaneous Animations |
|---------|---------------------------|
| Page load (stagger) | 10-15 elements (staggered, not simultaneous) |
| Hover interaction | 1 element |
| Kanban drag | 1 card + 1 column highlight |
| List scroll | 0 (pause animations during scroll) |
| Modal open | 1 modal + 1 overlay |

### Intersection Observer for Scroll Performance

Pause animations when elements are off-screen:

```tsx
import { useEffect, useRef, useState } from "react";

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

// Usage: Only animate when visible
function FloatingIcon() {
  const { ref, inView } = useInView();
  
  return (
    <div ref={ref}>
      <motion.div
        animate={inView ? { y: [0, -8, 0] } : { y: 0 }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Icon />
      </motion.div>
    </div>
  );
}
```

---

## Files Modified Summary

| File | Change Type |
|------|------------|
| `src/app/globals.css` | Modify — remove opacity from global transition |
| All animated components | Verify — GPU-only properties |

## Verification

- [ ] No purple (Layout) bars in Chrome DevTools during animations
- [ ] No green (Paint) bars during interactive animations (hover, tap)
- [ ] CLS < 0.1 in Lighthouse
- [ ] 60fps on throttled CPU (4x slowdown)
- [ ] `npm run build` succeeds
