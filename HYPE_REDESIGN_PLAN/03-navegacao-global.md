# Navegação Global

## Problema a resolver

- Hoje existem duas navegações concorrendo por atenção em mobile:
  - hamburger no topo
  - dock flutuante no rodapé
- Isso aumenta ruído visual e reduz espaço útil.

## Decisão de arquitetura

- Desktop continua usando sidebar principal.
- Mobile e tablet passam a usar dock inferior como navegação principal.
- Hamburger móvel deve ser removido ou deixado inativo nessas faixas.
- Itens administrativos e secundários migram para `More`.

## Estrutura proposta do dock

### Home

- Destino: `/resumo`
- Função: visão geral, indicadores, atalhos críticos.

### Sales

- Destinos agrupados:
  - `/kanban`
  - `/recebimentos`
- Função: operação comercial.

### Chat

- Destinos agrupados:
  - `/whatsapp`
  - `/automacoes`
- Função: conversas, automações e operação de mensagens.

### Team

- Destinos agrupados:
  - `/equipe`
  - `/minhas-metas`
- Função: gestão de pessoas ou metas próprias, conforme perfil.

### More

- Destinos agrupados:
  - `/configs`
  - perfil
  - sair
- Função: acessos secundários e configurações.

## Regras de permissão

- `EMPRESA` vê tudo o que tiver permissão.
- `GERENTE` vê o subconjunto permitido.
- `COLABORADOR` vê apenas o necessário para operar.
- O dock deve ser gerado dinamicamente por perfil, sem depender de esconder/mostrar itens que forcem quebra de layout.

## Lógica de estado

- `pathname` define o item ativo.
- `groupOpen` controla o popover/sheet de agrupamento.
- Ao navegar, qualquer painel aberto deve ser fechado.
- O estado do dock não deve duplicar o estado da rota.

## Layout recomendado

- Item do dock com:
  - ícone
  - label curto
  - largura proporcional igual
- O item `More` pode abrir um `sheet` ou `popover` com lista compacta.
- O dock deve suportar toque confortável sem aumentar demais a altura.

## Arquivos envolvidos

- `src/components/mobile-bottom-dock.tsx`
- `src/components/sidebar-principal.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`

## Critérios de aceite

- Não existe overlap entre hamburger e dock em mobile/tablet.
- O usuário consegue chegar a qualquer destino principal com no máximo dois toques adicionais.
- O dock permanece legível em telas pequenas e não empurra conteúdo de forma inesperada.
