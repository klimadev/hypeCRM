# Iconografia e Refino Visual

## Objetivo

Padronizar o ícone de Team / Goals para uma escala mais consistente e visualmente minimalista.

## Problema

O ícone de setas up/down parece proporcionalmente pesado ou fora do conjunto de ícones Lucide.

## Direção

- Usar um ícone mais próximo da gramática visual de Lucide/Heroicons.
- Reduzir a área visual do traço.
- Evitar ícones com massa visual excessiva em menus compactos.

## Ações recomendadas

### Ajuste de tamanho

- trocar qualquer `h-5 w-5` ou maior para `h-4 w-4` no item de menu;
- se necessário, usar `h-3.5 w-3.5` para itens secundários ou compactos.

### Ajuste de stroke / peso

Se o ícone atual suportar `strokeWidth`, use um valor mais leve e regular.

### Troca de ícone

Se o símbolo atual continuar destoando, considerar substituição por uma alternativa mais neutra como:

- `Target`
- `BarChart3`
- `Users`
- outro ícone de linhas simples do conjunto Lucide

## Regra prática

Ícones de navegação devem parecer parte de um sistema de interface, não de ilustração.

## Critérios de aceite

- O ícone não domina o label.
- A leitura do item fica alinhada com o restante da sidebar.
- O menu continua consistente em estado colapsado e expandido.

