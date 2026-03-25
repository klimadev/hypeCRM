/**
 * Template raiz - não usa animações para evitar problemas de renderização
 * As animações de página podem ser adicionadas nos módulos específicos se necessário
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}