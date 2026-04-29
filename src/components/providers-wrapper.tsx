"use client";

import type { SessaoToken } from "@/lib/tipos";
import { PendenciasProvider } from "@/modules/kanban/hooks/use-pendencias-globais";
import type { ReactNode } from "react";

export function ProvidersWrapper({ children, sessao }: { children: ReactNode; sessao: SessaoToken }) {
  return <PendenciasProvider>{children}</PendenciasProvider>;
}
