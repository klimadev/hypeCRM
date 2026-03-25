# Dock Mobile e Safe Area

## Objetivo

Criar um bottom navigation enxuto, estável e compatível com dispositivos com `safe area`.

## Problemas do dock atual

- Muitos itens para pouca largura.
- Risco de clipping em iPhone e aparelhos com barra de gestos.
- Labels longas competem por espaço.
- O dock atual tenta resolver navegação demais em um único bloco.

## Solução proposta

### Estrutura visual

- Base glassmorphism sutil.
- Fundo semitransparente escuro.
- Borda sutil.
- Blur controlado.
- Sombra leve.

### Estrutura funcional

- Dock com 5 itens fixos por intenção.
- `Sales`, `Chat` e `More` podem abrir agrupamentos.
- `Home` e `Team` podem navegar direto.

### Safe area

- Usar `bottom: calc(env(safe-area-inset-bottom) + Xpx)`.
- Adicionar `padding-bottom: env(safe-area-inset-bottom)`.
- Garantir que a altura total do dock considere o espaço adicional.

## Regras de responsividade

- Em telas muito estreitas, o dock deve manter ícones estáveis e labels curtas.
- Não usar quantidade variável de itens como solução visual.
- O dock deve ficar centralizado com `max-width`.
- O container não deve tocar a borda inferior física do dispositivo.

## Estado recomendado

- `activeItem` derivado da rota.
- `sheetOpen` para agrupamentos.
- `dismissDockMenus()` para fechar popovers ao navegar.

## Implementação sugerida

- Reaproveitar tokens visuais do tema escuro do sistema.
- Não criar uma nova linguagem visual para o dock.
- Usar `cn()` para estados `active`, `hover`, `pressed` e `disabled`.
- Manter animação curta e discreta.

## Arquivos e componentes

- `src/components/mobile-bottom-dock.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/button.tsx`

## Critérios de validação

- Dock não é cortado em iPhone com gesture bar.
- Dock não sobrepõe conteúdo essencial.
- Dock continua utilizável em `320px` de largura.
- Dock permanece coerente entre mobile e tablet.
