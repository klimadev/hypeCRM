---
plan name: ChatCategorias
plan description: Minimal inbox categories
plan status: done
---

## Idea
Transformar os filtros rápidos do chat em uma camada de categorias minimalistas, próprias do módulo mas equivalentes a recortes operacionais da inbox, como `Em aberto`, `Não lidas`, `Sem negócio` e `Com negócio`. O foco é reduzir peso visual e código, substituindo badges pesados por um conjunto limpo de ícones com tooltip e contagem, integrado ao layout e à linguagem visual já estabelecidos no chat.

## Implementation
- Inventariar os recortes já disponíveis no estado da inbox e distinguir o que vira categoria fixa do chat versus o que continua sendo filtro operacional secundário no dock atual.
- Definir o modelo visual das categorias com base no estilo executivo existente: ícone consistente, tooltip curta, contador acoplado e estados claro/ativo/hover sem introduzir chips pesados ou duplicar navegação.
- Mapear de onde cada categoria será derivada no frontend/hook (ex.: `nao lidas`, `sem negocio`, `com negocio`, `em aberto`) e como essas regras conversam com busca, paginação e filtros já existentes.
- Planejar a inserção das categorias na sidebar ou cabeçalho do painel lateral sem competir com busca, refresh, filtros avançados e lista de conversas.
- Executar a implementação mínima e coesa reaproveitando a arquitetura atual do chat, removendo ruído visual onde necessário e validando com `npm run pm2:prod` para garantir consistência de UI e build.

## Required Specs
<!-- SPECS_START -->
- ChatCategoriasSpec
<!-- SPECS_END -->