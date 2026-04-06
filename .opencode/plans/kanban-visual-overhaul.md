# Kanban Visual Overhaul - Plano de Implementação

## Objetivo
Melhorar drasticamente o visual do kanban board (principal + drawer) e remover completamente o chat do drawer.

## Escopo de Mudanças

### 1. Kanban Board - Estilo Minimalista Clean

#### 1.1 Colunas (`kanban-board-column.tsx`)
- **Remover:** sombras pesadas, efeitos de translate no hover, gradientes complexos
- **Simplificar:** bordas sutis, transições rápidas (150ms), padding mais contido
- **Header:** layout mais limpo com nome + contador alinhados horizontalmente, remover descrição e resumo operacional do header (deixar mais compacto)
- **Drop state:** borda violeta sutil ao invés de azul/cyan com glow
- **Cards:** fundo `surface-elevated`, hover apenas com border mais forte e bg sutil, active com scale 0.99

#### 1.2 Cards (`kanban-negocio-card-content.tsx`)
- **Tipografia:** hierarquia mais clara, títulos em `text-[13px]` ao invés de `text-base`
- **Valor:** manter destaque mas com tamanho mais contido (`text-sm` ao invés de `text-lg`)
- **Badges:** simplificar - menos padding, bordas mais sutis, remover min-h-11 forçado
- **Espaçamento:** reduzir gaps entre elementos, mais densidade operacional
- **Drag handle:** mais sutil, opacity reduzida até hover

#### 1.3 Utilitários Visuais (`kanban-board.utils.ts`)
- **Colunas:** gradientes mais sutis, menos opacidade
- **Indicadores:** simplificar cores, remover efeitos extras

#### 1.4 Mobile (`kanban-board-mobile.tsx`)
- **Tabs:** pills mais limpas, sem glow excessivo
- **Cards:** mesmo tratamento da versão desktop

#### 1.5 Empty State (`empty-state.tsx`)
- **Visual:** mais minimalista, ícone menor, menos animação
- **Cores:** neutros do tema escuro

### 2. Drawer - Header Premium + Tabs Refinadas

#### 2.1 Header (`lead-details-drawer-header.tsx`)
- **Layout:** mais espaçado, melhor hierarquia visual
- **Título:** tipografia maior (`text-lg`), mais destaque
- **Telefone:** badge estilizado ao invés de texto solto
- **Status de salvamento:** indicador mais elegante (pill com dot)
- **Botão remover:** variante mais contida, sem ser excessivamente chamativo
- **Atalhos:** remover linha de atalhos (desnecessária)

#### 2.2 Tabs (`lead-details-drawer-tabs.tsx`)
- **REMOVER COMPLETAMENTE:** aba Chat, import do WhatsappChatPanel, prop whatsappChat
- **Layout:** 3 tabs ao invés de 4 (Detalhes, Vínculos, Parcelas)
- **Estilo:** tabs mais limpas, indicador de ativo mais elegante (underline ou pill)
- **Ícones:** manter, mas com sizing mais contido

#### 2.3 Drawer Principal (`lead-details-drawer.tsx`)
- **REMOVER:** hook `useWhatsappChat` completamente
- **REMOVER:** import do `useWhatsappChat`
- **Limpar:** todas as referências a whatsappChat passadas para tabs

## Arquivos a Modificar

| Arquivo | Tipo | Prioridade |
|---------|------|------------|
| `kanban-board-column.tsx` | Edit | Alta |
| `kanban-negocio-card-content.tsx` | Edit | Alta |
| `kanban-board.utils.ts` | Edit | Média |
| `kanban-board-mobile.tsx` | Edit | Média |
| `empty-state.tsx` | Edit | Média |
| `lead-details-drawer-header.tsx` | Edit | Alta |
| `lead-details-drawer-tabs.tsx` | Edit | Alta |
| `lead-details-drawer.tsx` | Edit | Alta |

## Princípios Visuais Aplicados

- **Densidade operacional:** mais informação em menos espaço
- **Motion utilitário:** transições rápidas (120-160ms), sem animações decorativas
- **Contraste funcional:** hierarquia clara sem excesso de cores
- **Um acento por superfície:** violeta para marca, semânticas apenas para estados reais
- **Bordas > Sombras:** elevação via border sutil + bg, não shadow pesada
