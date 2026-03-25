import { redirect } from "next/navigation";
import { SidebarPrincipal } from "@/components/sidebar-principal";
import { ProvidersWrapper } from "@/components/providers-wrapper";
import { DashboardErrorBoundary } from "@/components/dashboard-error-boundary";
import { MobileBottomDock } from "@/components/mobile-bottom-dock";
import { TrialBanner, TrialBlocker } from "@/modules/trial";
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
      <div className="min-h-screen lg:flex">
        <SidebarPrincipal sessao={sessao} dadosUsuario={dadosUsuario} />
        <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] p-3 pt-4 lg:pb-8 lg:p-8">
          <div className="mb-4">
            <TrialBanner />
          </div>
          <DashboardErrorBoundary>
            {children}
          </DashboardErrorBoundary>
        </main>
        <MobileBottomDock perfil={sessao.perfil} />
      </div>
    </ProvidersWrapper>
  );
}
