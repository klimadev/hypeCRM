"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayDuration?: number;
}

export function Tooltip({ content, children, side = "top", delayDuration = 250 }: TooltipProps) {
  const [aberto, setAberto] = React.useState(false);
  const [abertoVisual, setAbertoVisual] = React.useState(false);
  const {
    refs,
    floatingStyles,
    placement,
    update,
    isPositioned,
  } = useFloating({
    placement: side,
    strategy: "fixed",
    middleware: [
      offset(10),
      flip({ padding: 12, fallbackAxisSideDirection: "end" }),
      shift({ padding: 12 }),
      size({ padding: 12, apply({ availableWidth, availableHeight, elements }) {
        Object.assign(elements.floating.style, {
          maxWidth: `${Math.min(320, Math.max(160, availableWidth))}px`,
          maxHeight: `${Math.min(240, Math.max(80, availableHeight))}px`,
        });
      } }),
    ],
    whileElementsMounted: autoUpdate,
  });
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const setReferenceRef = React.useCallback((node: HTMLSpanElement | null) => {
    refs.setReference(node);
  }, [refs]);
  const setFloatingRef = React.useCallback((node: HTMLDivElement | null) => {
    refs.setFloating(node);
  }, [refs]);

  const limparTimeout = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const abrir = React.useCallback(() => {
    limparTimeout();
    timeoutRef.current = setTimeout(() => setAberto(true), delayDuration);
  }, [delayDuration, limparTimeout]);

  const fechar = React.useCallback(() => {
    limparTimeout();
    setAberto(false);
  }, [limparTimeout]);

  React.useEffect(() => limparTimeout, [limparTimeout]);
  React.useEffect(() => {
    if (aberto) update();
  }, [aberto, update, content]);
  React.useEffect(() => {
    if (!aberto) {
      setAbertoVisual(false);
      return;
    }

    const frame = requestAnimationFrame(() => setAbertoVisual(true));
    return () => cancelAnimationFrame(frame);
  }, [aberto]);

  const deslocamentoFechado = placement.startsWith("top")
    ? "translate-y-1"
    : placement.startsWith("bottom")
      ? "-translate-y-1"
      : placement.startsWith("left")
        ? "translate-x-1"
        : "-translate-x-1";

  return (
    <>
      <span
        ref={setReferenceRef}
        className="inline-flex"
        onMouseEnter={abrir}
        onMouseLeave={fechar}
        onFocus={abrir}
        onBlur={fechar}
        onPointerDown={limparTimeout}
      >
        {children}
      </span>

      {typeof document !== "undefined"
        ? createPortal(
            aberto ? (
              <div
                ref={setFloatingRef}
                role="tooltip"
                aria-hidden={!abertoVisual}
                style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }}
                className={cn(
                  "pointer-events-none z-[60] w-max max-w-[min(20rem,calc(100vw-1.5rem))] rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--surface-glass)] px-3 py-2 text-[11px] leading-5 font-medium text-[var(--text-primary)] shadow-[var(--shadow-overlay)] backdrop-blur-md transform-gpu transition-[opacity,transform,filter] duration-150 ease-[var(--ease-productive)] motion-reduce:transition-none",
                  abertoVisual ? "opacity-100 scale-100 translate-x-0 translate-y-0" : cn("opacity-0 scale-[0.98]", deslocamentoFechado),
                )}
              >
                <div className="space-y-0.5">{content}</div>
              </div>
            ) : null,
            document.body,
          )
        : null}
    </>
  );
}
