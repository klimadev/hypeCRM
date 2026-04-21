import { redirect } from "next/navigation";
import { ModuloSuperAdminUsuarios } from "@/modules/super-admin/usuarios";
import { obterSessaoNoServidor, validarSuperAdmin } from "@/lib/autenticacao";

export default async function PaginaUsuariosSuperAdmin() {
  const sessao = await obterSessaoNoServidor();
  const eSuperAdmin = await validarSuperAdmin(sessao);

  if (!sessao || !eSuperAdmin) {
    redirect("/");
  }

  return <ModuloSuperAdminUsuarios />;
}