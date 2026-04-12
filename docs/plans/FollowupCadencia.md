---
plan name: FollowupCadencia
plan description: Fluxo intuitivo multi-etapas
plan status: done
---

## Idea
Melhorar o sistema de cadência de follow-up do CRM para ficar mais intuitivo na criação e configuração. O estado atual já suporta múltiplas etapas no backend e no schema, mas a UI só permite uma etapa e expõe `delayMinutos` como número cru em minutos, com valor padrão 1440 pouco compreensível. O plano é evoluir a experiência de configuração para uma cadência multi-etapas com passos explícitos (mensagem 1, mensagem 2, mensagem 3...), cada um com conteúdo próprio e intervalo configurado em dias/horas/minutos, contado a partir da mensagem anterior. Ao detectar resposta do lead, o sistema deve cancelar os próximos envios e encerrar automaticamente a cadência, registrando motivo compatível no status da conversa. A implementação deve preservar o modelo atual de templates, conversas e mensagens agendadas, expandindo apenas o que for necessário na UI, contratos de API, mapeamentos e lógica de processamento.

## Implementation
- Mapear os contratos atuais de template, conversa e validação de follow-up para definir a menor mudança necessária no payload e nos DTOs sem quebrar o fluxo existente.
- Redesenhar a UX da criação/edição de cadências em `src/modules/configs/page.tsx` para suportar múltiplas etapas ordenadas, com adicionar/remover passo, rótulos claros e edição de mensagem por etapa.
- Substituir o campo bruto `delayMinutos` por uma modelagem de tempo humana na interface, usando dias/horas/minutos e um resumo legível, convertendo para minutos apenas no boundary do payload.
- Atualizar o resumo/listagem de cadências para mostrar quantidade de etapas, timing legível e noções de sequência em vez de apenas a primeira etapa.
- Ajustar a lógica de follow-up em `src/lib/chat/follow-up.ts` e na rota de conversa para que resposta do lead encerre automaticamente a cadência e cancele mensagens pendentes, mantendo a contagem de atraso relativa à mensagem anterior.
- Expandir testes de rotas e de lógica de follow-up para cobrir templates com múltiplas etapas, cancelamento/encerramento por resposta e serialização correta dos delays.
- Validar a mudança com a pipeline do projeto, priorizando lint, typecheck, testes afetados e build, e revisar riscos de compatibilidade com cadências já existentes.

## Required Specs
<!-- SPECS_START -->
<!-- SPECS_END -->