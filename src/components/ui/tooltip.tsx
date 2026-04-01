"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayDuration?: number;
}

const VIEWPORT_PADDING = 12;
const TOOLTIP_OFFSET = 10;

type CoordenadasTooltip = {
  top: number;
  left: number;
  ladoEfetivo: TooltipProps["side"];
};

function limitar(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo);
}

function calcularCoordenadasTooltip(
  alvo: DOMRect,
  tooltip: DOMRect,
  lado: TooltipProps["side"],
): CoordenadasTooltip {
  const espacoDisponivel = {
    top: alvo.top,
    right: window.innerWidth - alvo.right,
    bottom: window.innerHeight - alvo.bottom,
    left: alvo.left,
  };

  let ladoEfetivo = lado;
  if (lado === "top" && espacoDisponivel.top < tooltip.height + TOOLTIP_OFFSET + VIEWPORT_PADDING) ladoEfetivo = "bottom";
  if (lado === "bottom" && espacoDisponivel.bottom < tooltip.height + TOOLTIP_OFFSET + VIEWPORT_PADDING) ladoEfetivo = "top";
  if (lado === "left" && espacoDisponivel.left < tooltip.width + TOOLTIP_OFFSET + VIEWPORT_PADDING) ladoEfetivo = "right";
  if (lado === "right" && espacoDisponivel.right < tooltip.width + TOOLTIP_OFFSET + VIEWPORT_PADDING) ladoEfetivo = "left";

  let top = alvo.top;
  let left = alvo.left;

  if (ladoEfetivo === "top") {
    top = alvo.top - tooltip.height - TOOLTIP_OFFSET;
    left = alvo.left + (alvo.width - tooltip.width) / 2;
  }

  if (ladoEfetivo === "bottom") {
    top = alvo.bottom + TOOLTIP_OFFSET;
    left = alvo.left + (alvo.width - tooltip.width) / 2;
  }

  if (ladoEfetivo === "left") {
    top = alvo.top + (alvo.height - tooltip.height) / 2;
    left = alvo.left - tooltip.width - TOOLTIP_OFFSET;
  }

  if (ladoEfetivo === "right") {
    top = alvo.top + (alvo.height - tooltip.height) / 2;
    left = alvo.right + TOOLTIP_OFFSET;
  }

  return {
    top: limitar(top, VIEWPORT_PADDING, window.innerHeight - tooltip.height - VIEWPORT_PADDING),
    left: limitar(left, VIEWPORT_PADDING, window.innerWidth - tooltip.width - VIEWPORT_PADDING),
    ladoEfetivo,
  };
}

export function Tooltip({ content, children, side = "top", delayDuration = 250 }: TooltipProps) {
  const [aberto, setAberto] = React.useState(false);
  const [abertoVisual, setAbertoVisual] = React.useState(false);
  const [coordenadas, setCoordenadas] = React.useState<CoordenadasTooltip | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const floatingRef = React.useRef<HTMLDivElement | null>(null);

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
  const atualizarPosicao = React.useCallback(() => {
    if (!triggerRef.current || !floatingRef.current) {
      return;
    }

    const proximo = calcularCoordenadasTooltip(
      triggerRef.current.getBoundingClientRect(),
      floatingRef.current.getBoundingClientRect(),
      side,
    );

    setCoordenadas(proximo);
  }, [side]);

  React.useLayoutEffect(() => {
    if (!aberto) {
      setCoordenadas(null);
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
  }, [aberto, atualizarPosicao, content]);

  React.useEffect(() => {
    if (!aberto) {
      setAbertoVisual(false);
      return;
    }

    const frame = requestAnimationFrame(() => setAbertoVisual(true));
    return () => cancelAnimationFrame(frame);
  }, [aberto]);

  const ladoAnimacao = coordenadas?.ladoEfetivo ?? side;
  const deslocamentoFechado = ladoAnimacao?.startsWith("top")
    ? "translate-y-1"
    : ladoAnimacao?.startsWith("bottom")
      ? "-translate-y-1"
      : ladoAnimacao?.startsWith("left")
        ? "translate-x-1"
        : "-translate-x-1";

  return (
    <>
      <span
        ref={triggerRef}
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
                ref={floatingRef}
                role="tooltip"
                aria-hidden={!abertoVisual}
                style={{
                  position: "fixed",
                  top: coordenadas?.top ?? -9999,
                  left: coordenadas?.left ?? -9999,
                  visibility: coordenadas ? "visible" : "hidden",
                  maxWidth: "min(20rem, calc(100vw - 1.5rem))",
                  maxHeight: "min(15rem, calc(100vh - 1.5rem))",
                }}
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
