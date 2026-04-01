import type {
  FiltroAcessoEmpresaFuncionario,
  LeadResumoBasico,
  LeadResponsavelResumo,
  LinhaRaw,
  NegocioResumo,
  NegocioRowBase,
} from "@/lib/negocios.types";

export function valorStringObrigatorio(linha: LinhaRaw, chave: string): string {
  const valor = linha[chave];
  if (typeof valor === "string") return valor;
  if (valor instanceof String) return String(valor);
  throw new Error(`Campo obrigatorio ausente: ${chave}`);
}

export function valorStringOuNulo(linha: LinhaRaw, chave: string): string | null {
  const valor = linha[chave];
  if (valor === null || valor === undefined) return null;
  return typeof valor === "string" ? valor : String(valor);
}

export function valorNumero(linha: LinhaRaw, chave: string, padrao = 0): number {
  const valor = linha[chave];
  if (typeof valor === "number") return valor;
  if (typeof valor === "bigint") return Number(valor);
  if (typeof valor === "string" && valor.trim().length > 0) {
    const parsed = Number(valor);
    return Number.isFinite(parsed) ? parsed : padrao;
  }
  return padrao;
}

export function valorBooleano(linha: LinhaRaw, chave: string): boolean {
  const valor = linha[chave];
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor !== 0;
  if (typeof valor === "string") return valor !== "0" && valor.toLowerCase() !== "false";
  return Boolean(valor);
}

export function valorData(linha: LinhaRaw, chave: string): Date {
  const valor = linha[chave];
  if (valor instanceof Date) return valor;
  if (typeof valor === "string" || typeof valor === "number") {
    return new Date(valor);
  }
  throw new Error(`Campo de data obrigatorio ausente: ${chave}`);
}

export function valorDataOuNulo(linha: LinhaRaw, chave: string): Date | null {
  const valor = linha[chave];
  if (valor === null || valor === undefined) return null;
  if (valor instanceof Date) return valor;
  if (typeof valor === "string" || typeof valor === "number") {
    return new Date(valor);
  }
  return null;
}

export function idsFuncionarioDoFiltro(filtro?: FiltroAcessoEmpresaFuncionario) {
  const valor = filtro?.id_funcionario;
  if (!valor) return null;
  if (typeof valor === "string") return [valor];
  if (Array.isArray(valor.in)) return valor.in.filter(Boolean);
  return null;
}

export function mapearResponsavelResumo(linha: LinhaRaw, prefixo: string): LeadResponsavelResumo {
  const idPdv = valorStringOuNulo(linha, `${prefixo}id_pdv`);
  const pdvId = valorStringOuNulo(linha, `${prefixo}pdv_id`);
  const pdvNome = valorStringOuNulo(linha, `${prefixo}pdv_nome`);

  return {
    id: valorStringObrigatorio(linha, `${prefixo}id`),
    nome: valorStringObrigatorio(linha, `${prefixo}nome`),
    id_pdv: idPdv,
    pdv: pdvId && pdvNome ? { id: pdvId, nome: pdvNome } : null,
  };
}

export function mapearLeadBasico(linha: LinhaRaw, prefixo: string): LeadResumoBasico {
  return {
    id: valorStringObrigatorio(linha, `${prefixo}id`),
    id_empresa: valorStringObrigatorio(linha, `${prefixo}id_empresa`),
    id_funcionario: valorStringObrigatorio(linha, `${prefixo}id_funcionario`),
    id_pdv: valorStringOuNulo(linha, `${prefixo}id_pdv`),
    id_negocio: valorStringOuNulo(linha, `${prefixo}id_negocio`),
    id_estagio: valorStringObrigatorio(linha, `${prefixo}id_estagio`),
    nome: valorStringObrigatorio(linha, `${prefixo}nome`),
    telefone: valorStringObrigatorio(linha, `${prefixo}telefone`),
    email: valorStringOuNulo(linha, `${prefixo}email`),
    valor_oportunidade: valorNumero(linha, `${prefixo}valor_oportunidade`, 0),
    probabilidade: valorNumero(linha, `${prefixo}probabilidade`, 0),
    fonte: valorStringOuNulo(linha, `${prefixo}fonte`),
    empresa_origem: valorStringOuNulo(linha, `${prefixo}empresa_origem`),
    observacoes: valorStringOuNulo(linha, `${prefixo}observacoes`),
    motivo_perda: valorStringOuNulo(linha, `${prefixo}motivo_perda`),
    criado_em: valorData(linha, `${prefixo}criado_em`),
    atualizado_em: valorData(linha, `${prefixo}atualizado_em`),
    origem: valorStringObrigatorio(linha, `${prefixo}origem`),
    anuncio_titulo: valorStringOuNulo(linha, `${prefixo}anuncio_titulo`),
    anuncio_descricao: valorStringOuNulo(linha, `${prefixo}anuncio_descricao`),
    anuncio_url: valorStringOuNulo(linha, `${prefixo}anuncio_url`),
    dados_extras: valorStringOuNulo(linha, `${prefixo}dados_extras`),
    funcionario: mapearResponsavelResumo(linha, `${prefixo}funcionario_`),
  };
}

export function mapearLeadBasicoDoRegistro(linha: LinhaRaw, prefixo = "lead_"): LeadResumoBasico {
  return mapearLeadBasico(linha, prefixo);
}

export function normalizarIdsNegocios(idsLeads: string[]) {
  return Array.from(new Set(idsLeads.map((id) => id.trim()).filter(Boolean)));
}

export function mapearNegocioResumo(linha: NegocioRowBase, leads: LeadResumoBasico[] = []): NegocioResumo {
  const leadPrincipal = linha.lead_principal_id
    ? mapearLeadBasico(
        {
          lead_id: linha.lead_principal_id,
          lead_id_empresa: linha.lead_principal_id_empresa ?? linha.negocio_id_empresa,
          lead_id_funcionario: linha.lead_principal_id_funcionario ?? linha.negocio_id_funcionario,
          lead_id_pdv: linha.lead_principal_id_pdv ?? linha.negocio_funcionario_id_pdv,
          lead_id_negocio: linha.lead_principal_id_negocio ?? linha.negocio_id,
          lead_id_estagio: linha.lead_principal_id_estagio ?? linha.negocio_id_estagio,
          lead_nome: linha.lead_principal_nome ?? "",
          lead_telefone: linha.lead_principal_telefone ?? "",
          lead_email: linha.lead_principal_email,
          lead_valor_oportunidade: linha.lead_principal_valor_oportunidade,
          lead_probabilidade: linha.lead_principal_probabilidade,
          lead_fonte: linha.lead_principal_fonte,
          lead_empresa_origem: linha.lead_principal_empresa_origem,
          lead_observacoes: linha.lead_principal_observacoes,
          lead_motivo_perda: linha.lead_principal_motivo_perda,
          lead_criado_em: linha.lead_principal_criado_em ?? linha.negocio_criado_em,
          lead_atualizado_em: linha.lead_principal_atualizado_em ?? linha.negocio_atualizado_em,
          lead_origem: linha.lead_principal_origem ?? "MANUAL",
          lead_anuncio_titulo: linha.lead_principal_anuncio_titulo,
          lead_anuncio_descricao: linha.lead_principal_anuncio_descricao,
          lead_anuncio_url: linha.lead_principal_anuncio_url,
          lead_dados_extras: linha.lead_principal_dados_extras,
          lead_funcionario_id: linha.lead_principal_funcionario_id ?? linha.negocio_id_funcionario,
          lead_funcionario_nome: linha.lead_principal_funcionario_nome ?? linha.negocio_funcionario_nome,
          lead_funcionario_id_pdv: linha.lead_principal_funcionario_id_pdv ?? linha.negocio_funcionario_id_pdv,
          lead_funcionario_pdv_id: linha.lead_principal_funcionario_pdv_id ?? linha.negocio_funcionario_pdv_id,
          lead_funcionario_pdv_nome: linha.lead_principal_funcionario_pdv_nome ?? linha.negocio_funcionario_pdv_nome,
        },
        "lead_",
      )
    : null;

  const leadPrincipalEfetivo = leadPrincipal ?? leads[0] ?? null;

  return {
    id: linha.negocio_id,
    id_empresa: linha.negocio_id_empresa,
    id_lead: linha.negocio_id_lead,
    id_funil: linha.negocio_id_funil,
    id_estagio: linha.negocio_id_estagio,
    id_funcionario: linha.negocio_id_funcionario,
    id_produto_principal: linha.negocio_id_produto_principal,
    titulo: linha.negocio_titulo,
    valor_estimado: valorNumero(linha, "negocio_valor_estimado", 0),
    valor_fechado:
      linha.negocio_valor_fechado === null || linha.negocio_valor_fechado === undefined
        ? null
        : valorNumero(linha, "negocio_valor_fechado", 0),
    probabilidade: linha.negocio_probabilidade,
    status: linha.negocio_status,
    data_abertura: valorData(linha, "negocio_data_abertura"),
    data_fechamento: valorDataOuNulo(linha, "negocio_data_fechamento"),
    motivo_perda: linha.negocio_motivo_perda,
    observacoes_comerciais: linha.negocio_observacoes_comerciais,
    chave_migracao: linha.negocio_chave_migracao,
    criado_em: valorData(linha, "negocio_criado_em"),
    atualizado_em: valorData(linha, "negocio_atualizado_em"),
    lead: leadPrincipalEfetivo,
    lead_principal: leadPrincipal,
    leads,
    estagio: {
      id: linha.negocio_estagio_id,
      nome: linha.negocio_estagio_nome,
      ordem: Number(linha.negocio_estagio_ordem),
      tipo: linha.negocio_estagio_tipo,
      id_funil: linha.negocio_estagio_id_funil,
    },
    funcionario: mapearResponsavelResumo(linha, "negocio_funcionario_"),
    funil: {
      id: linha.negocio_funil_id,
      nome: linha.negocio_funil_nome,
      slug: linha.negocio_funil_slug,
      padrao: valorBooleano(linha, "negocio_funil_padrao"),
    },
    id_pdv: linha.negocio_funcionario_id_pdv,
  };
}
