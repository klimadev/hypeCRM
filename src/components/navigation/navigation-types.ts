import type { ComponentType } from "react";

export type NavigationItem = {
  href: string;
  label: string;
  descricao: string;
  icon: ComponentType<{ className?: string }>;
  children?: NavigationItem[];
  limpo?: boolean;
};

export type NavigationSection = {
  titulo: string;
  itens: NavigationItem[];
};
