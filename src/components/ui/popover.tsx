"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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

const VIEWPORT_PADDING = 12;
const POPOVER_OFFSET = 12;

type PosicaoPopover = {
  top: number;
  left: number;
  ladoEfetivo: "left" | "right";
};

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo);
}

function calcularPosicaoPopover(alvo: DOMRect, conteudo: DOMRect): PosicaoPopover {
  const espacoDireita = window.innerWidth - alvo.right;
  const ladoEfetivo = espacoDireita >= conteudo.width + POPOVER_OFFSET + VIEWPORT_PADDING ? "right" : "left";
  const top = limitar(alvo.top, VIEWPORT_PADDING, window.innerHeight - conteudo.height - VIEWPORT_PADDING);
  const leftBase = ladoEfetivo === "right"
    ? alvo.right + POPOVER_OFFSET
    : alvo.left - conteudo.width - POPOVER_OFFSET;

  return {
    top,
    left: limitar(leftBase, VIEWPORT_PADDING, window.innerWidth - conteudo.width - VIEWPORT_PADDING),
    ladoEfetivo,
  };
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
  const [posicao, setPosicao] = React.useState<PosicaoPopover | null>(null);
  const floatingRef = React.useRef<HTMLDivElement | null>(null);

  const atualizarPosicao = React.useCallback(() => {
    if (!triggerRef.current || !floatingRef.current) {
      return;
    }

    setPosicao(
      calcularPosicaoPopover(
        triggerRef.current.getBoundingClientRect(),
        floatingRef.current.getBoundingClientRect(),
      ),
    );
  }, [triggerRef]);

  React.useLayoutEffect(() => {
    if (!aberto) {
      setPosicao(null);
      return;
    }

    atualizarPosicao();
    const raf = requestAnimationFrame(atualizarPosicao);
    const opcoes: AddEventListenerOptions = { passive: true };
    window.addEventListener("resize", atualizarPosicao, opcoes);
    window.addEventListener("scroll", atualizarPosicao, opcoes);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", atualizarPosicao);
      window.removeEventListener("scroll", atualizarPosicao);
    };
  }, [aberto, atualizarPosicao]);

  React.useEffect(() => {
    if (!aberto) {
      setAbertoVisual(false);
      return;
    }

    const frame = requestAnimationFrame(() => setAbertoVisual(true));
    return () => cancelAnimationFrame(frame);
  }, [aberto]);

  React.useEffect(() => {
    if (!aberto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aberto, setAberto]);

  if (!aberto || typeof document === "undefined") return null;

  const deslocamentoFechado = posicao?.ladoEfetivo === "left" ? "-translate-x-2" : "translate-x-2";

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Fechar popover"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        onClick={() => setAberto(false)}
      />
      <div
        ref={floatingRef}
        role="dialog"
        aria-modal="false"
        aria-hidden={!abertoVisual}
        style={{
          position: "fixed",
          top: posicao?.top ?? -9999,
          left: posicao?.left ?? -9999,
          visibility: posicao ? "visible" : "hidden",
          maxWidth: "min(20rem, calc(100vw - 1rem))",
        }}
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
