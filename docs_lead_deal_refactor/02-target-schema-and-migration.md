# Target Schema and Migration Plan

## 1. Target domain model

### Lead

Lead becomes a contact-first record.

Keep:

- `id`
- `id_empresa`
- `id_funcionario`
- `id_pdv`
- `nome`
- `telefone`
- `email`
- `fonte`
- `empresa_origem`
- `observacoes`
- `origem`
- `anuncio_titulo`
- `anuncio_descricao`
- `anuncio_url`
- `dados_extras`
- timestamps

Add:

- `id_negocio?` as the ownership link to the deal
- `ativo` or a soft-delete timestamp

Remove from final state:

- `id_estagio`
- `valor_oportunidade`
- `probabilidade`
- `motivo_perda`

### Negocio

Deal becomes the pipeline card and the commercial record.

Keep / ensure:

- `id`
- `id_empresa`
- `id_funil`
- `id_estagio`
- `id_funcionario`
- `titulo`
- `valor_estimado`
- `valor_fechado`
- `probabilidade`
- `status`
- `data_abertura`
- `data_fechamento`
- `motivo_perda`
- `observacoes_comerciais`
- `chave_migracao`
- timestamps

Add:

- `Lead[]` relation
- optional `id_lead_principal?` if a single contact is needed for chat / receipts / card preview

### Related records

Keep them in the right domain:

- `LeadProduto` stays with `Lead`
- `NegocioProduto` stays with `Negocio`
- `Pendencia` stays with `Lead`
- `NegocioEstagioLog` stays with `Negocio`
- `WhatsappMensagem` stays with `Lead`
- `AutomacaoAgendamento` should support both scopes, but the deal board must not depend on lead-stage semantics

## 2. Relation decision

Use a one-deal-per-lead ownership rule:

- a lead can belong to zero or one deal at a time
- a deal can have zero, one, or many leads

Recommended implementation:

- `Lead.id_negocio` nullable FK to `Negocio.id`
- `Negocio.Lead[]` reverse relation
- `onDelete: SetNull` so deleting a deal does not wipe leads

Why this choice:

- it matches the requested business rule
- it is simpler than a join table
- it makes attachment later easy

If the product later needs a lead to belong to multiple deals simultaneously, that would be a different rule and should be handled with a join table in a future phase. Do not build that complexity now.

## 3. Migration strategy

Because the DB is SQLite, treat the migration as a controlled expand/backfill/cleanup sequence.

### Phase A - Expand

Add the new columns and relations before removing old ones:

- add `Lead.id_negocio`
- add `Lead.ativo` / soft-delete support
- make `Negocio.id_lead` optional only if you keep a compatibility pointer, or replace it with `id_lead_principal`
- keep `Negocio` stage / value fields
- keep all dependent tables writable during the transition

### Phase B - Backfill

Run an idempotent script in transactions:

- for each existing deal, link the corresponding lead into `Lead.id_negocio`
- if a lead currently holds commercial data but no deal exists yet, create a legacy deal record only once and attach the lead
- preserve `id_funil`, `id_estagio`, `id_funcionario`, value, probability, loss reason, and timestamps
- backfill parcel, product, and job references so the historic data remains consistent

Important rule:

- the backfill must be re-runnable
- use a deterministic migration key or checksum to avoid duplicate deals

### Phase C - Cleanup

After validation:

- remove deal logic from lead create/edit payloads
- remove hard dependencies on `Negocio.id_lead`
- drop lead commercial columns from the final schema
- remove any temporary compatibility fields if they are no longer needed

## 4. Data integrity rules

- use `prisma.$transaction` whenever a deal is created and leads are attached
- use `prisma.$transaction` whenever a lead is reassigned from one deal to another
- do not hard delete a lead if it has chat, parcel, product, or history dependencies
- do not hard delete a deal if it has attached leads or finance history

## 5. Compatibility notes

The current code already has a migration script named `migrate:lead-negocio:backfill`.

That script cannot be used unchanged because it assumes the old 1:1 lead-to-deal behavior.

The new migration script should instead:

- create or reconcile the new relation shape
- attach multiple leads to one deal when requested
- keep legacy data valid during the transition

