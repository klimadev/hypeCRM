---
plan name: ChatFilterDock
plan description: Floating inbox UX
plan status: done
---

## Idea
Transformar os filtros do `/chat` de um bloco inline que expande a sidebar para uma experiencia flutuante, premium e sem layout shift. A direcao recomendada e manter a arquitetura atual do modulo (`src/modules/chat/page.tsx`, `src/modules/chat/components/chat-sidebar.tsx`, `src/modules/chat/hooks/use-chat-module.ts`) e trocar apenas a camada de apresentacao/interacao dos filtros. No desktop, o clique em `Filtros` deve abrir um painel flutuante ancorado ao trigger, com leitura imediata dos filtros ativos, resumo visual e grupos de filtros mais refinados. No mobile, o mesmo trigger deve abrir um sheet, porque um popover pequeno perde ergonomia em toque. A logica de filtro existente deve ser preservada; o ganho vem da percepcao de produto, hierarquia visual, foco e ausencia de empurrar a lista de conversas para baixo.

## Implementation
- Mapear o bloco atual de filtros em `src/modules/chat/components/chat-sidebar.tsx` e separar claramente trigger, painel flutuante e conteudo reutilizavel, preservando a logica de estado ja exposta por `use-chat-module.ts`.
- Substituir a expansao inline controlada por `controlesAbertos` por uma arquitetura sem layout shift, em que o trigger de filtros continue no header da sidebar mas o conteudo abra fora do fluxo da lista.
- Implementar no desktop um painel flutuante ancorado ao botao de filtros usando o primitive `src/components/ui/popover.tsx`, com largura e elevacao premium compativeis com o design token atual.
- Implementar no mobile uma variante em `Sheet` usando `src/components/ui/sheet.tsx`, reutilizando o mesmo conteudo dos filtros para manter consistencia visual e ergonomia em touch.
- Redesenhar o conteudo interno dos filtros com linguagem mais SaaS 2026: resumo de filtros ativos, CTA de limpar tudo, metricas rapidas compactas, grupos de filtros com chips melhores e saude de sync em formato mais discreto.
- Polir interacao e acessibilidade: fechar ao clicar fora ou apertar Escape, manter `aria-expanded`, destacar estados ativos com contraste suficiente e tratar erro de sync com area anunciavel quando visivel.
- Validar a mudanca com `npm run pm2:prod` e revisar o comportamento de `/chat` em desktop e mobile para garantir que o painel flutuante nao corte conteudo nem degrade a navegacao.

## Required Specs
<!-- SPECS_START -->
- FilterDock
- DockExecutive
<!-- SPECS_END -->