---
register: product
---

# hypeCRM

**CRM multi-tenant para corretoras e times comerciais** — gestão de leads, funil de vendas (Kanban), atendimento via WhatsApp/Instagram, automações e integração com anúncios Meta.

## Who

- **Primary:** Corretoras de imóveis e pequenos times comerciais brasileiros (2-50 pessoas)
- **User profiles:** Empresa (admin/dono), Gerente (supervisor), Colaborador (vendedor/corretor)
- **Proficiency:** Baixa a média em tecnologia. O usuário-tipo é "João Pedro, 67 anos" — nunca usou CRM, precisa de algo que funcione como papel e caneta mas com os benefícios digitais.

## What

Um CRM que resolve o essencial sem sobressaltos:

- **Leads** — cadastro, importação, distribuição entre vendedores
- **Kanban/Pipeline** — visualização do funil com drag-and-drop, estágios personalizáveis
- **Atendimento** — chat WhatsApp e Instagram unificado dentro do CRM
- **Automações** — regras simples de disparo e distribuição
- **Integrações** — anúncios Meta (Facebook/Instagram), calendário
- **Gestão** — equipe, produtos, recebimentos, permissões por perfil

Não é um CRM enterprise. Não tem forecasting, relatórios complexos, ou módulo financeiro pesado. É a ferramenta que o corretor abre no celular entre uma visita e outra.

## Personality

| Axis | Position |
|------|----------|
| Formal vs Casual | **Casual.** "Funil" não "Pipeline". "Negócio" não "Deal". "Perder negócio" não "Lost opportunity". |
| Serious vs Playful | **Sério mas não soturno.** É ferramenta de trabalho, não jogo. Mas erros são perdoados com feedback claro. |
| Dense vs Spacious | **Espaçoso.** Respiro entre elementos. Nunca apertado. |
| Traditional vs Modern | **Moderno sem ser modinha.** Dark mode nativo. Sem glassmorphism, sem gradientes decorativos. |
| Verbose vs Terse | **Terso.** Rótulos mínimos. "Buscar" não "Pesquisar por termo". "Criar" não "Criar novo registro". |

## Anti-references

- **Salesforce / RD Station / HubSpot** — complexos demais, UI carregada, dezenas de campos. O oposto do que queremos.
- **SaaS genérico "premium"** — fundo branco/cinza com sidebar azul, cards idênticos com ícone + texto, gráficos decorativos que não ajudam a vender.
- **Painéis "enterprise"** — tabelas infinitas, abas demais, filtros empilhados, métricas que ninguém olha.
- **CRMs que parecem planilhas** — grade cinza com bordas finas, linhas alternadas, sem hierarquia visual.
- **AI-generated UI** — side-stripe borders, gradient text, glassmorphism, numbered section markers, tiny uppercase kickers acima de toda seção.

## Strategic Design Principles

1. **The João Pedro Rule.** If João Pedro (67, never used CRM) can't figure it out in 10 seconds, it's wrong. Every feature must survive this test.
2. **Maximum 3 fields per card.** On Kanban cards, modals, list items — show only what's needed to make a decision. Everything else is one click away.
3. **Every action gets feedback.** Toast on save, inline error on validation, animation on drag. Silence is not acceptable.
4. **Progressive disclosure, not information dumping.** Show the essential, hide the advanced. "Adicionar descrição (opcional)" toggle, not a form with 15 campos.
5. **One primary action per view.** Each screen has one clear thing to do. The button for it is always visible, always the same color.
6. **Mobile is not an afterthought.** Corretor works from the phone. Every desktop layout must have a mobile equivalent that doesn't suck.
7. **Destructive actions are deliberate.** Red buttons for loss/deletion, with confirmation text. Never an accidental "perder negócio".
