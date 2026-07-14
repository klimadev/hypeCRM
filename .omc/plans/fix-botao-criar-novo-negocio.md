# Plano: Corrigir botão "Criar novo negócio"

**Status**: Pending approval

## Resumo do Bug
O modal de criação de negócio nunca abre porque o componente `NovoNegocioDialog` foi definido mas nunca importado/renderezado em `page.tsx`. O botão "+" no header do Kanban seta `dialogNovoNegocioAberto = true` corretamente, mas não há componente escutando essa prop.

## Critérios de Aceitação
- [ ] Clicar no botão "+" (mobile/desktop) abre o modal "Cadastrar negócio"
- [ ] O modal exibe todos os campos: título, valor, estágio, contatos, funcionário
- [ ] Submeter o formulário cria o negócio via API
- [ ] Após criação, o modal fecha e o kanban atualiza
- [ ] Erros de validação/API são exibidos no modal
- [ ] Estado de loading durante criação funciona

## Implementação (1 arquivo)

### `src/modules/kanban/page.tsx`

1. **Import** `NovoNegocioDialog` de `./components/novo-negocio-dialog`
2. **Import** `useRef, useState` de `react`
3. **Adicionar state local** na função `ModuloKanban`:
   - `const inputNomeRef = useRef<HTMLInputElement>(null)`
   - `const [contatosSelecionados, setContatosSelecionados] = useState<string[]>([])
4. **Derivar** `contatosDisponiveis` de `vm.leadsDisponiveis`:
   ```tsx
   const contatosDisponiveis: ContatoDisponivelNegocio[] = useMemo(
     () => vm.leadsDisponiveis.map(l => ({ id: l.id, nome: l.nome, telefone: l.telefone, id_negocio: l.id_negocio })),
     [vm.leadsDisponiveis]
   )
   ```
5. **Import type** `ContatoDisponivelNegocio` de `./components/kanban-header.utils`
6. **Import** `useMemo` de `react` (já pode estar na importação)
7. **Renderizar** `NovoNegocioDialog` no JSX, posicionado após `KanbanHeader` e antes do `KanbanBoard` (dentro do `mostrarKanbanDireto`), com todas as props necessárias.

## Props do NovoNegocioDialog (fonte já disponível)

| Prop | Fonte |
|------|-------|
| `open` | `vm.dialogNovoNegocioAberto` |
| `onOpenChange` | `vm.setDialogNovoNegocioAberto` |
| `onSubmit` | `vm.criarNegocio` |
| `trigger` | `<span />` (controlado via open/onOpenChange) |
| `inputNomeRef` | `inputNomeRef` (novo useRef) |
| `criandoNegocio` | `vm.criandoNegocio` |
| `valorNovoNegocio` | `vm.valorNovoNegocio` |
| `setValorNovoNegocio` | `vm.setValorNovoNegocio` |
| `estagioNovoNegocio` | `vm.estagioNovoNegocio` |
| `estagioAberto` | `vm.estagioAberto` |
| `setEstagioNovoNegocio` | `vm.setEstagioNovoNegocio` |
| `cargoNovoNegocio` | `vm.cargoNovoNegocio` |
| `setCargoNovoNegocio` | `vm.setCargoNovoNegocio` |
| `contatosDisponiveis` | `contatosDisponiveis` (derivado de vm.leadsDisponiveis) |
| `carregandoContatosDisponiveis` | `vm.carregandoLeadsDisponiveis` |
| `contatosSelecionados` | `contatosSelecionados` (novo useState) |
| `setContatosSelecionados` | `setContatosSelecionados` (novo useState) |
| `perfil` | `perfil` (prop do componente) |
| `funcionarios` | `vm.funcionarios` |
| `estagios` | `vm.estagios` |
| `erroNovoNegocio` | `vm.erroNovoNegocio` |

## Riscos e Mitigações
- **Leads duplicados no picker**: leads já vinculados a negócios podem aparecer — é aceitável, o backend lida com duplicidade na criação
- **Performance com muitos leads**: `leadsDisponiveis` pode ser grande, mas já é carregado pelo hook existente — apenas mapeamento síncrono

## Verificação
- Abrir kanban com pipeline selecionada
- Clicar no botão "+" — modal deve abrir
- Preencher campos e submeter — negócio deve ser criado
- Fechar modal via X ou clique fora — deve fechar
