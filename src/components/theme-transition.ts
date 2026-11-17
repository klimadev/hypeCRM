import { flushSync } from "react-dom";

export type ThemeTransitionOrigin = {
  x: number;
  y: number;
};

type ThemeTransitionRoot = {
  documentElement: {
    animate: (
      keyframes: PropertyIndexedKeyframes | Keyframe[] | null,
      options?: number | KeyframeAnimationOptions,
    ) => Animation;
  };
  startViewTransition?: (update: () => void) => {
    ready: Promise<unknown>;
  };
};

type ThemeViewTransitionOptions = {
  commit: () => void;
  origin: ThemeTransitionOrigin;
  root?: ThemeTransitionRoot;
  flush?: (commit: () => void) => void;
  viewport?: {
    width: number;
    height: number;
  };
};

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION = 450;

export function getThemeTransitionOriginFromRect(rect: {
  left: number;
  top: number;
  width: number;
  height: number;
}): ThemeTransitionOrigin {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getExpandedRadius(
  origin: ThemeTransitionOrigin,
  viewport: { width: number; height: number }
): number {
  return Math.hypot(
    Math.max(origin.x, viewport.width - origin.x),
    Math.max(origin.y, viewport.height - origin.y)
  );
}

function createClipPathKeyframes(
  origin: ThemeTransitionOrigin,
  viewport: { width: number; height: number }
): PropertyIndexedKeyframes {
  const radius = getExpandedRadius(origin, viewport);
  return {
    clipPath: [
      `circle(0px at ${origin.x}px ${origin.y}px)`,
      `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
    ],
  };
}

export async function startThemeViewTransition({
  commit,
  origin,
  root = document,
  flush = flushSync,
  viewport = { width: window.innerWidth, height: window.innerHeight },
}: ThemeViewTransitionOptions) {
  if (!root.startViewTransition) {
    flush(commit);
    return;
  }

  const transition = root.startViewTransition(() => {
    flush(commit);
  });

  await transition.ready;

  root.documentElement.animate(
    createClipPathKeyframes(origin, viewport),
    {
      duration: DURATION,
      easing: EASING,
      pseudoElement: "::view-transition-new(root)",
      fill: "forwards",
    }
  );
}