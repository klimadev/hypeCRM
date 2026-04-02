import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloChat } from "@/modules/chat";

export default async function ChatPage() {
  const sessao = await obterSessaoNoServidor();
  if (!sessao) return null;

  return <ModuloChat perfil={sessao.perfil} idUsuario={sessao.id_usuario} />;
}
