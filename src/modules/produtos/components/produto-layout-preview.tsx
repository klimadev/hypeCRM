import { RenderizadorCamposProduto } from "./renderizador-campos-produto";
import { parseSchemaLayout, type SchemaLayoutProduto } from "@/lib/api/produtos";

type ProdutoLayoutPreviewProps = {
  schemaLayout: SchemaLayoutProduto | string;
};

export function ProdutoLayoutPreview({ schemaLayout }: ProdutoLayoutPreviewProps) {
  const schema = typeof schemaLayout === "string" ? parseSchemaLayout(schemaLayout) : schemaLayout;

  return (
    <div className="rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-4">
      {schema.campos.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center text-sm text-[var(--text-secondary)]">
          <p>Adicione campos para ver o preview.</p>
        </div>
      ) : (
        <RenderizadorCamposProduto campos={schema.campos} valores={{}} somenteLeitura />
      )}
    </div>
  );
}
