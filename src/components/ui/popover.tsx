"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { autoUpdate, flip, offset, shift, size, useFloating } from "@floating-ui/react";
import { cn } from "@/lib/utils";

type PopoverContextValue = {
  aberto: boolean;
  setAberto: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

const PopoverContext = React.createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const contexto = React.useContext(PopoverContext);
  if (!contexto) throw new Error("Popover components must be used within <Popover>.");
  return contexto;
}

function Popover({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return <PopoverContext.Provider value={{ aberto, setAberto, triggerRef }}>{children}</PopoverContext.Provider>;
}

const PopoverTrigger = React.forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button">>(
  ({ className, onClick, ...props }, ref) => {
    const { aberto, setAberto, triggerRef } = usePopoverContext();

    return (
      <button
        ref={(node) => {
          triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="button"
        aria-expanded={aberto}
        className={className}
        onClick={(event) => {
          setAberto((atual) => !atual);
          onClick?.(event);
        }}
        {...props}
      />
    );
  },
);
PopoverTrigger.displayName = "PopoverTrigger";

function PopoverContent({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  const { aberto, setAberto, triggerRef } = usePopoverContext();
  const [abertoVisual, setAbertoVisual] = React.useState(false);
  const { refs, floatingStyles, placement, isPositioned, update } = useFloating({
    placement: "right-start",
    strategy: "fixed",
    middleware: [
      offset(12),
      flip({ padding: 12, fallbackAxisSideDirection: "end" }),
      shift({ padding: 12 }),
      size({ padding: 12, apply({ availableWidth, elements }) {
        Object.assign(elements.floating.style, { maxWidth: `${Math.min(320, Math.max(180, availableWidth))}px` });
      } }),
    ],
    whileElementsMounted: autoUpdate,
  });

  React.useLayoutEffect(() => {
    if (aberto && triggerRef.current) {
      refs.setReference(triggerRef.current);
      update();
    }
  }, [aberto, refs, triggerRef, update]);
  React.useEffect(() => {
    if (!aberto) {
      setAbertoVisual(false);
      return;
    }

    const frame = requestAnimationFrame(() => setAbertoVisual(true));
    return () => cancelAnimationFrame(frame);
  }, [aberto]);
  const setFloatingRef = React.useCallback((node: HTMLDivElement | null) => {
    refs.setFloating(node);
  }, [refs]);

  React.useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aberto, setAberto]);

  if (!aberto || typeof document === "undefined") return null;

  const deslocamentoFechado = placement.startsWith("left") ? "-translate-x-2" : "translate-x-2";

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Fechar popover"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        onClick={() => setAberto(false)}
      />
      <div
        ref={setFloatingRef}
        role="dialog"
        aria-modal="false"
        aria-hidden={!abertoVisual}
        style={{ ...floatingStyles, visibility: isPositioned ? "visible" : "hidden" }}
        className={cn(
          "z-50 w-72 max-w-[min(20rem,calc(100vw-1rem))] rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-glass)] p-3 text-[var(--text-primary)] shadow-[var(--shadow-overlay)] backdrop-blur-xl transform-gpu transition-[opacity,transform,filter] duration-150 ease-[var(--ease-productive)] motion-reduce:transition-none",
          abertoVisual ? "opacity-100 scale-100 translate-x-0" : cn("opacity-0 scale-[0.98]", deslocamentoFechado),
          className,
        )}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

export { Popover, PopoverTrigger, PopoverContent };
