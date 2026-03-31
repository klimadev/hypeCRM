# Sidebar com Hover Expand Absoluto

## Objetivo

Permitir que a sidebar saia do modo colapsado para o modo expandido no hover sem empurrar ou redimensionar o conteúdo principal.

## Regra de comportamento

- Estado colapsado: ícone apenas.
- Estado expandido: ícone + texto.
- A expansão deve flutuar acima do conteúdo, não reflow no layout.

## Estratégia técnica recomendada

### Opção preferida

Usar uma sidebar com largura fixa no estado colapsado e uma camada expansível absolutamente posicionada no hover.

Isso significa:

- o wrapper raiz continua com largura reduzida;
- a superfície expandida usa `position: absolute`;
- a superfície expandida recebe `left: 0`, `top: 0`, `height: 100vh`;
- o conteúdo expandido usa `z-index` superior ao main;
- o main não muda de largura quando a sidebar abre.

### Alternativa aceitável

Usar `position: sticky` para fixar a sidebar e dentro dela alternar duas superfícies:

- uma superfície compacta permanente;
- uma superfície expandida absoluta com `pointer-events-auto`.

Se a expansão precisar cobrir a área do main, o overlay deve ter:

- `z-40` ou superior;
- `shadow-[...]`;
- `backdrop-blur` muito sutil, se necessário;
- `overflow-y-auto`.

## Classes Tailwind úteis

- `relative`
- `absolute`
- `inset-y-0 left-0`
- `h-screen`
- `w-16` para colapsada
- `w-72` ou `w-80` para expandida
- `transition-[width,transform,opacity]`
- `duration-200`
- `ease-[cubic-bezier(0.2,0.8,0.2,1)]`
- `z-30`, `z-40`
- `pointer-events-none` no estado fechado do overlay
- `pointer-events-auto` no estado aberto

## Interação

- No desktop, o hover pode abrir.
- No mobile, a sidebar não deve depender de hover.
- Se houver clique para fixar, o hover e o click precisam compartilhar o mesmo estado visual.

## Critérios de aceite

- A abertura em hover não altera a largura do main.
- O conteúdo principal não “salta” quando a sidebar abre.
- O overlay fica acima do conteúdo e pode rolar independentemente.
- O menu expandido continua utilizável em telas de notebook.

