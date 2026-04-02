import type { ComponentType } from "react";

export type NavigationItem = {
  href: string;
  label: string;
  descricao: string;
  icon: ComponentType<{ className?: string }>;
  tourTarget?: string;
  children?: NavigationItem[];
};

export type NavigationSection = {
  titulo: string;
  itens: NavigationItem[];
};
