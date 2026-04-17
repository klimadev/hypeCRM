# Spec: FilterDock

Scope: feature

# Chat Filter Dock

## Objetivo
Transformar a abertura de filtros da tela `/chat` em uma experiencia de dock flutuante lateral, com leitura premium e sem layout shift na inbox.

## Requisitos funcionais
- No desktop, ao clicar em `Filtros`, abrir um painel flutuante ancorado ao topo da sidebar de chats.
- O painel deve abrir para a direita da sidebar, e nao para baixo.
- O painel nao pode cobrir a lista de chats carregados na inbox.
- A lista de conversas deve permanecer visivel e estavel durante toda a interacao.
- O estado atual dos filtros deve continuar sendo controlado pela logica existente de `useChatModule`.
- O painel deve exibir os filtros de origem, fila e canal, com estados ativos claramente destacados.
- O painel deve exibir um resumo compacto de filtros ativos e permitir limpar todos os filtros rapidamente.
- O painel deve incluir os indicadores rapidos de novos, sem dono e sem negocio.
- O estado de sincronizacao deve permanecer visivel em formato compacto dentro do dock.
- No mobile, a experiencia deve mudar para `Sheet`, mantendo o mesmo conteudo funcional.

## Requisitos de UX
- Nao pode haver empurrao vertical da inbox ao abrir filtros.
- A interacao deve parecer um dock lateral premium, nao um accordion ou bloco expandido.
- O trigger de `Filtros` deve continuar mostrando contagem de filtros ativos.
- O visual deve seguir o design token atual do projeto, evitando excesso de glass ou efeitos que prejudiquem legibilidade.
- O painel deve transmitir hierarquia, profundidade e refinamento de produto SaaS 2026 sem parecer template genérico.

## Requisitos de acessibilidade
- O trigger deve manter `aria-expanded`.
- O painel precisa fechar com clique fora e tecla `Escape`.
- Mensagens de erro de sincronizacao visiveis no painel devem ser anunciaveis.
- Contraste de texto e estados ativos deve permanecer legivel no tema atual.

## Nao objetivos
- Nao redesenhar a tela inteira de `/chat`.
- Nao alterar a logica de busca e filtragem existente.
- Nao introduzir novas categorias de filtro nesta primeira entrega.
- Nao revisar agora o uso de emojis em `chat-item`; isso pode virar uma rodada separada.

## Criterios de aceite
- Abrir filtros no desktop nao altera a altura do header da sidebar nem empurra a lista para baixo.
- O painel aparece lateralmente, a direita da sidebar.
- A inbox continua totalmente navegavel e visivel por tras ou ao lado do dock, sem o dock ficar por cima dos itens da lista.
- No mobile, filtros abrem em sheet com boa ergonomia.
- `npm run pm2:prod` conclui com sucesso apos a implementacao.