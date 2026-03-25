/**
 * Reusable animation variants for common UI patterns.
 * Import these instead of writing inline variants.
 */

import { springs } from "./springs";

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