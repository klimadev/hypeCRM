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