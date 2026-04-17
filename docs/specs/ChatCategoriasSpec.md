# Spec: ChatCategoriasSpec

Scope: feature

# Categorias minimalistas da inbox

## Objetivo
Transformar os recortes operacionais principais da inbox em uma camada de categorias próprias do chat, com visual minimalista e baixo custo de implementação. Na prática, essas categorias funcionam como filtros rápidos da inbox, mas com apresentação mais limpa: ícone, tooltip e quantidade, sem chips pesados ou aparência de filtro técnico.

## Escopo funcional
- Introduzir uma faixa/conjunto de categorias rápidas no módulo de chat.
- As categorias serão equivalentes a filtros rápidos da inbox, não a taxonomias persistidas no banco.
- Cada categoria deve ser clicável e alterar o recorte da lista de conversas.
- Cada item deve exibir ícone consistente, tooltip com rótulo e contador visível.
- A solução deve coexistir com busca e filtros mais detalhados já existentes.

## Categorias base previstas
As categorias iniciais devem priorizar os recortes operacionais mencionados pelo usuário e os dados já existentes no módulo:
- `Em aberto`
- `Não lidas`
- `Sem negócio`
- `Com negócio`

Observação:
Os nomes finais podem ser refinados na implementação, mas a ideia central é manter um conjunto curto, inequívoco e operacional.

## Comportamento esperado
- Ao clicar em uma categoria, a inbox passa a mostrar apenas as conversas daquele recorte.
- Ao clicar novamente na categoria ativa, o filtro pode ser limpo ou substituído por outro comportamento simples e previsível; a implementação deve escolher apenas uma regra, sem ambiguidade.
- A busca textual continua funcionando em conjunto com a categoria ativa.
- Os contadores devem refletir o universo atual da inbox carregada de forma coerente.
- A interação deve ser rápida, sem abrir modais ou docks adicionais.

## Regras de derivação
- As categorias são derivadas dos dados já disponíveis no chat.
- Não deve haver necessidade de persistir novas entidades de categoria.
- O recorte `Com negócio` / `Sem negócio` deve usar o vínculo atual de negócio/CRM no chat.
- `Não lidas` e `Em aberto` devem usar somente sinais já existentes ou claramente deriváveis do estado do chat.
- Se algum recorte exigir regra ambígua, a implementação deve optar pela definição mais simples e explícita no código.

## Regras de UX/UI
- Visual minimalista, executivo e consistente com o chat atual.
- Estrutura preferida: ícone + contador + tooltip.
- Nada de chips grandes, abas pesadas ou blocos promocionais.
- O estado ativo precisa ser claro, mas contido.
- Hover e foco devem ser sutis e legíveis em dark mode.
- A solução não deve disputar atenção com busca, refresh ou lista de conversas.

## Restrições técnicas
- Preferir derivação no frontend/hook a partir do estado já carregado.
- Evitar criação de APIs novas se o recorte puder ser resolvido com os dados atuais.
- Não duplicar a lógica principal de filtragem da inbox; integrar ao pipeline de filtros já existente.
- A implementação deve ser pequena e coesa, com pouco código adicional.

## Arquivos provavelmente envolvidos
- `src/modules/chat/hooks/use-chat-module.ts`
- `src/modules/chat/page.tsx`
- `src/modules/chat/components/chat-sidebar.tsx`
- `src/modules/chat/components/chat-filters-content.tsx`
- Eventualmente `src/modules/chat/components/chat-item.tsx` se houver ajuste visual complementar

## Critérios de aceite
- Existe uma área de categorias rápidas no chat com visual minimalista.
- Cada categoria possui ícone, tooltip e quantidade.
- Clicar na categoria altera corretamente o recorte da inbox.
- Busca e categorias funcionam em conjunto sem comportamento confuso.
- A UI permanece limpa e alinhada ao `ChatFilterDock`.
- O projeto valida com `npm run pm2:prod`.

## Fora de escopo
- Categorias persistidas em banco.
- Gestão manual/customizável de categorias pelo usuário.
- Reescrever o dock de filtros existente.
- Criar um sistema visual novo de status para o CRM inteiro.