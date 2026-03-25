# Dashboard Responsivo

## Objetivo

Fazer o dashboard/resumo manter proporção visual e legibilidade em mobile, tablet e desktop.

## Problema atual

- Cards grandes funcionam no tablet, mas podem ficar pesados no mobile.
- O gráfico perde o aspecto ideal quando o container não tem altura bem definida.
- O layout pode ficar vertical demais em telas pequenas.

## Solução de layout

### Grid

- Mobile: 1 coluna.
- Tablet: 2 colunas.
- Desktop: 3 ou 4 colunas conforme a densidade da tela.

### Cards

- KPI cards mais compactos no mobile.
- Títulos menores.
- Metas e progressos simplificados.

### Gráficos

- Container responsivo com altura controlada.
- `ResponsiveContainer` deve herdar tamanho do wrapper.
- Evitar wrappers sem altura explícita.
- Reduzir ruído de labels em telas pequenas.

## Regras práticas

- Usar `aspect-ratio` ou `min-height` no wrapper do gráfico.
- Em mobile, simplificar eixos e legendas.
- Cards de KPI devem priorizar leitura rápida.
- Progress bars devem ser proporcionais e discretas.

## Arquivos a revisar

- `src/components/grafico-vendas.tsx`
- `src/modules/recebimentos/components/recebimentos-chart-card.tsx`
- módulo correspondente ao dashboard/resumo do app
- `src/components/resumo-skeleton.tsx`

## Critérios de aceite

- O gráfico não deforma no mobile.
- A leitura de KPIs permanece clara.
- O dashboard continua útil sem depender do desktop.
