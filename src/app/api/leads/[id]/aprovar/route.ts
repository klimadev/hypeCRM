/**
 * @deprecated Esta rota foi descontinuada no HYPE CRM.
 * O sistema de aprovação de documentos não é mais necessário.
 * Para mover leads para "Fechado", use a rota /api/leads/:id/mover
 * 
 * Esta rota será removida em versões futuras.
 */


export async function POST() {
  // Rota descontinuada - retorna 410 Gone
  return new Response(
    JSON.stringify({
      erro: "Esta funcionalidade foi descontinuada no HYPE CRM. Use a rota /api/leads/:id/mover para fechar negócios.",
      deprecated: true,
    }),
    {
      status: 410,
      headers: {
        "Deprecation": "true",
        "Content-Type": "application/json",
      },
    }
  );
}
