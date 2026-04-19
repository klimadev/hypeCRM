import { redirect } from "next/navigation";
import { SidebarPrincipal } from "@/components/sidebar-principal";
import { ProvidersWrapper } from "@/components/providers-wrapper";
import { DashboardErrorBoundary } from "@/components/dashboard-error-boundary";
import { MobileBottomDock } from "@/components/mobile-bottom-dock";
import { TrialBlocker, TrialNotification } from "@/modules/trial";
import {
  obterDadosUsuarioLogado,
  obterSessaoNoServidor,
} from "@/lib/autenticacao";
import { verificarUsuarioExiste } from "@/lib/permissoes";

export default async function LayoutDashboard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  const usuarioValido = await verificarUsuarioExiste(sessao);
  if (!usuarioValido) {
    redirect("/login");
  }

  const dadosUsuario = await obterDadosUsuarioLogado(sessao);

  return (
    <ProvidersWrapper sessao={sessao}>
      <TrialBlocker />
      <TrialNotification />
      <div className="dashboard-shell min-h-[100dvh] overflow-x-hidden bg-[var(--canvas)] lg:flex lg:items-stretch">
        <SidebarPrincipal sessao={sessao} dadosUsuario={dadosUsuario} />
        <main className="dashboard-shell__content min-h-0 min-w-0 flex-1 px-2.5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-2.5 lg:flex lg:h-full lg:flex-col lg:min-h-0 lg:px-3 lg:pb-3 lg:pt-3 lg:pl-[calc(var(--sidebar-dock-offset)+var(--sidebar-dock-collapsed-width)+1rem)] xl:px-4 xl:pb-4 xl:pt-4 xl:pl-[calc(var(--sidebar-dock-offset)+var(--sidebar-dock-collapsed-width)+1.5rem)]">
          <div className="dashboard-shell__viewport min-h-0 flex-1">
            <DashboardErrorBoundary>
              {children}
            </DashboardErrorBoundary>
          </div>
        </main>
        <MobileBottomDock perfil={sessao.perfil} />
      </div>
    </ProvidersWrapper>
  );
}
