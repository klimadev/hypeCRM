# Checklist de Validação

## Navegação

- O hamburger não compete com o dock em mobile/tablet.
- O dock não é cortado por safe area.
- O item ativo fica claro sem ambiguidade.
- `More` agrupa os destinos secundários corretamente.

## Kanban mobile

- Apenas um estágio é exibido por vez.
- A busca continua funcional.
- O botão `Novo` permanece acessível.
- Os cards continuam legíveis sem overflow horizontal.

## Kanban tablet

- 2 ou 3 colunas cabem sem esmagar texto.
- Colunas recolhíveis funcionam.
- O usuário mantém contexto ao expandir e recolher.

## Dashboard

- O gráfico mantém proporção.
- Os cards não parecem gigantes em telas pequenas.
- A leitura continua clara em 360px a 430px.

## Performance e UX

- Animações continuam curtas e discretas.
- Estados `hover`, `active` e `disabled` seguem o padrão do sistema.
- Nenhuma tela importante perde acessibilidade de toque.

## Revisão final

- Rodar validação manual em:
  - mobile estreito
  - mobile grande
  - tablet portrait
  - tablet landscape
  - desktop
