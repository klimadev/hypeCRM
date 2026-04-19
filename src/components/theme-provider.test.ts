import { describe, expect, it, vi } from "vitest";
import {
  getThemeTransitionOriginFromRect,
  startThemeViewTransition,
} from "@/components/theme-transition";

describe("theme view transition", () => {
  it("calcula a origem no centro do toggle", () => {
    expect(
      getThemeTransitionOriginFromRect({
        left: 12,
        top: 20,
        width: 36,
        height: 28,
      }),
    ).toEqual({ x: 30, y: 34 });
  });

  it("sincroniza o commit com flushSync e anima o reveal circular", async () => {
    const animate = vi.fn();
    const startViewTransition = vi.fn((commit: () => void) => {
      commit();
      return {
        ready: Promise.resolve(),
      };
    });
    const flush = vi.fn((commit: () => void) => commit());
    const commit = vi.fn();

    await startThemeViewTransition({
      commit,
      flush,
      origin: { x: 24, y: 40 },
      root: {
        documentElement: {
          animate,
        },
        startViewTransition,
      },
      viewport: { width: 200, height: 100 },
    });

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(flush).toHaveBeenCalledWith(commit);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(animate).toHaveBeenCalledWith(
      {
        clipPath: [
          "circle(0px at 24px 40px)",
          `circle(${Math.hypot(176, 60)}px at 24px 40px)`,
        ],
      },
      expect.objectContaining({
        duration: 500,
        pseudoElement: "::view-transition-new(root)",
      }),
    );
  });
});
