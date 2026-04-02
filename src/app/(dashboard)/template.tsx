/**
 * Template do dashboard - entrada leve via CSS para manter o shell enxuto.
 */
"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [estaVisivel, setEstaVisivel] = React.useState(false);

  React.useEffect(() => {
    setEstaVisivel(false);

    const frame = requestAnimationFrame(() => setEstaVisivel(true));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className={[
        "flex h-full min-h-0 flex-col transition-[opacity,transform] duration-200 ease-[var(--ease-productive)] motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100",
        estaVisivel ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
