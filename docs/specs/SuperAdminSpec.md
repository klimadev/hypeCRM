# Spec: SuperAdminSpec

Scope: feature

# Super Admin - Specification

## Visão Geral
- **Tipo**: Sistema de administração global
- **Resumo**: Painel para super admins gerenciarem todas as empresas e funcionários do sistema
- **Usuário inicial**: limawebvision@gmail.com (isSuperAdmin=true)

## Banco de Dados

### Schema
```prisma
model Empresa {
  // ...campos existentes
  isSuperAdmin Boolean @default(false)
  // ...
}
```

## Autenticação

### Sessão Token (atualizado)
```typescript
type SessaoToken = {
  id_usuario: string;
  id_empresa: string;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  id_pdv: string | null;
  isSuperAdmin: boolean; // NOVO CAMPO
}
```

### Middleware de Proteção
- Rota: `/api/super-admin/*`
- Verifica: `sessao.isSuperAdmin === true`
- Retorna 403 se não autorizado

## APIs

### GET /api/super-admin/usuarios
**Params**: `?tipo=all|empresa|funcionario&pagina=1&limite=20`
**Response**:
```json
{
  "usuarios": [
    {
      "id": "uuid",
      "tipo": "empresa",
      "nome": "Nome da Empresa",
      "email": "email@exemplo.com",
      "status": "ATIVO",
      "isSuperAdmin": false,
      "criado_em": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "pagina": 1,
  "totalPaginas": 5
}
```

### PUT /api/super-admin/usuarios/[id]
**Body**:
```json
{
  "nome": "Novo Nome",
  "email": "novo@email.com"
}
```
**Response**: `{ "ok": true, "usuario": {...} }`

### PUT /api/super-admin/usuarios/[id]/senha
**Body**:
```json
{
  "novaSenha": "123456"
}
```
**Response**: `{ "ok": true }`

### DELETE /api/super-admin/usuarios/[id]
**Query**: `?Tipo=empresa|funcionario`
**Response**: `{ "ok": true }`

## Interface (UI)

### Página: /super-admin
- Layout: Container max-width 1200px, padding 24px
- Header: "Painel Super Admin" + botão atualizar
- Filtros: Select tipo (todos/empresa/funcionário)
- Tabela:
  - Colunas: Nome, Email, Tipo, Status, Super Admin, Criado em, Ações
  - Ações: Editar, Redefinir Senha, Excluir
- Modal de edição: Campos nome, email
- Modal redefinição senha: Input nova senha + confirmar
- Modal exclusão: Confirmar com texto "EXCLUIR"

### Design (seguindo AGENTS.md)
- Dark premium operacional
- Bordas sutis 1px #333
- Superfície #1a1a1a
- Tipografia 14px base
- Botões primários: background #2563eb, texto white
- danger: background #dc2626

## Fluxo de Dados

```
1. Login → verificar isSuperAdmin → token JWT
2. Request /super-admin → middleware valida isSuperAdmin
3. GET usuarios → retorna lista paginada
4. PUT editar → valida email único → atualiza
5. PUT senha → bcrypt hash → atualiza
6. DELETE → cascata (empresa exclui tudo)
```

## Casos de Borda
- Excluir empresa: cascade delete em todas as tabelas relacionadas
- Email único: validar duplicata antes de atualizar
- Auto-exclusão: impedir admin de excluir a si mesmo

## Limites Clean Code
- Cada API route: < 100 linhas
- Componente UI: < 150 linhas
- Total módulo: < 600 linhas