---
plan name: FeedbackHub
plan description: Canal global de feedback
plan status: done
---

## Idea
Implementar um canal moderno e nativo para usuários reportarem bugs e enviarem sugestões dentro da shell do dashboard, com submissão rápida, contexto técnico automático, persistência estruturada, auditoria de ciclo de vida e um painel único de triagem para super admins. A V1 deve ser texto-only, sem anexos, sem acompanhamento pelo usuário final e sem realtime, reutilizando os padrões visuais e de feedback já existentes no produto e estendendo a arquitetura atual de super-admin sem criar uma experiência paralela.

## Implementation
- Mapear os pontos de entrada ideais na shell para expor a ação global de reportar bug ou enviar sugestão sem poluir a navegação principal desktop e mobile.
- Definir o modelo de dados para os registros de feedback e sua trilha de eventos, incluindo tipo, status, prioridade, origem, contexto técnico e autoria.
- Projetar as rotas e contratos de API para criação de feedback por usuários autenticados e gestão operacional no painel de super admin com validação e autorização server-side.
- Desenhar a experiência da V1 para o usuário final com formulário curto, captura automática de contexto técnico e feedback visual imediato após envio.
- Desenhar a experiência do painel Super Admin > Feedbacks com filtros, listagem, detalhe operacional, atualização de status e notas internas.
- Planejar a herança sistêmica da feature para auditoria, navegação da shell, mobile menu, guards de acesso e componentes compartilhados de feedback visual.
- Definir estratégia de validação final usando o pipeline obrigatório do projeto e critérios de aceite funcionais, visuais e de segurança para a entrega da V1.

## Required Specs
<!-- SPECS_START -->
- FeedbackHubSpec
<!-- SPECS_END -->