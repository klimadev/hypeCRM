import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { enviarMensagemTexto } from "./evolution-api.instances";
import { mascararTelefoneParaLog, normalizarTelefoneParaWhatsapp } from "./phone";
import { instanciaWhatsappEstaConectada } from "./whatsapp-instancia-status";
import {
  renderizarTemplateWhatsapp,
  criarContextoPreviewWhatsapp,
} from "./whatsapp-template";

export interface WorkspaceNode {
  id: string;
  kind: "gatilho" | "acao" | "condicao";
  type: string;
  label: string;
  description?: string;
  x: number;
  y: number;
  config: Record<string, unknown>;
  enabled?: boolean;
}

export interface WorkspaceEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
}

export interface WorkspaceGraph {
  nodes: WorkspaceNode[];
  edges: WorkspaceEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface CompiledWorkspace {
  schemaVersion: number;
  graph: WorkspaceGraph;
  compiled: {
    rootsByTrigger: Record<string, string[]>;
    nodesById: Record<string, WorkspaceNode>;
    outgoingByNode: Record<string, WorkspaceEdge[]>;
  };
}

export interface AutomationContext {
  empresaId: string;
  negocioId?: string;
  leadId?: string;
  negocio?: {
    id: string;
    titulo: string;
    id_funil: string;
    funil_nome?: string;
    id_estagio: string;
    estagio_nome?: string;
    lead_principal?: {
      id: string;
      nome: string;
      telefone: string;
    };
  };
  lead?: {
    id: string;
    nome: string;
    telefone: string;
  };
}

async function obterOuCriarWorkspaceDb(idEmpresa: string) {
  let workspace = await prisma.automacao.findFirst({
    where: { id_empresa: idEmpresa, ativo: true },
  });

  if (!workspace) {
    workspace = await prisma.automacao.create({
      data: {
        id: randomUUID(),
        id_empresa: idEmpresa,
        nome: "Workspace de Automacoes",
        fonte: "CANVAS",
        gatilho: "NENHUM",
        editor_modelo: "CANVAS",
        rascunho_grafo_json: JSON.stringify({
          schemaVersion: 1,
          nodes: [],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 },
        }),
        ativo: true,
      },
    });
  }

  return workspace;
}

export async function obterOuCriarWorkspace(idEmpresa: string) {
  return obterOuCriarWorkspaceDb(idEmpresa);
}

export async function salvarRascunho(idEmpresa: string, grafoJson: string) {
  const workspace = await obterOuCriarWorkspaceDb(idEmpresa);

  const updated = await prisma.automacao.update({
    where: { id: workspace.id },
    data: {
      rascunho_grafo_json: grafoJson,
      atualizado_em: new Date(),
    },
  });

  return updated;
}

export async function publicarWorkspace(idEmpresa: string) {
  const workspace = await obterOuCriarWorkspaceDb(idEmpresa);

  if (!workspace.rascunho_grafo_json) {
    throw new Error("publish: Rascunho vazio.");
  }

  const parsed = JSON.parse(workspace.rascunho_grafo_json) as WorkspaceGraph;
  const validation = validarGrafoParaPublicacao(parsed);

  if (!validation.valid) {
    throw new Error(`publish: ${validation.errors.join("; ")}`);
  }

  const compiled = compilarGrafo(parsed);
  const triggerPrincipal = Object.keys(compiled.compiled.rootsByTrigger)[0] || "NENHUM";

  const updated = await prisma.$transaction(async (tx) => {
    const agregacao = await tx.automacaoVersao.aggregate({
      where: { id_automacao: workspace.id },
      _max: { numero: true },
    });

    const proximoNumero = (agregacao._max.numero ?? 0) + 1;

    const versao = await tx.automacaoVersao.create({
      data: {
        id: randomUUID(),
        id_automacao: workspace.id,
        numero: proximoNumero,
        grafo_json: JSON.stringify(compiled),
        trigger_principal: triggerPrincipal,
      },
    });

    return tx.automacao.update({
      where: { id: workspace.id },
      data: {
        versao_publicada_id: versao.id,
        atualizado_em: new Date(),
      },
    });
  });

  return updated;
}

export async function despublicarWorkspace(idEmpresa: string) {
  const workspace = await obterOuCriarWorkspaceDb(idEmpresa);

  return prisma.automacao.update({
    where: { id: workspace.id },
    data: {
      versao_publicada_id: null,
      atualizado_em: new Date(),
    },
  });
}

export async function obterVersaoPublicada(versaoId: string) {
  return prisma.automacaoVersao.findUnique({
    where: { id: versaoId },
  });
}

export async function obterWorkspacePublicado(idEmpresa: string) {
  const workspace = await prisma.automacao.findFirst({
    where: { id_empresa: idEmpresa, ativo: true },
  });

  if (!workspace || !workspace.versao_publicada_id) {
    return null;
  }

  const versao = await obterVersaoPublicada(workspace.versao_publicada_id);

  if (!versao) {
    return null;
  }

  return { workspace, versao };
}

export async function listarExecucoesWorkspace(idEmpresa: string, limit = 50) {
  const workspace = await obterOuCriarWorkspaceDb(idEmpresa);
  const safeLimit = Math.max(1, Math.min(limit, 100));

  return prisma.automacaoExecucao.findMany({
    where: { id_automacao: workspace.id },
    orderBy: { criado_em: "desc" },
    take: safeLimit,
    select: {
      id: true,
      status: true,
      trigger_tipo: true,
      contexto_ref_tipo: true,
      contexto_ref_id: true,
      log_resumido_json: true,
      criado_em: true,
      atualizado_em: true,
    },
  });
}

function validarGrafoParaPublicacao(graph: WorkspaceGraph) {
  const errors: string[] = [];

  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));

  const triggerNodes = graph.nodes.filter((n) => n.kind === "gatilho");

  if (triggerNodes.length === 0) {
    errors.push("Grafo precisa de pelo menos um gatilho.");
  }

  for (const edge of graph.edges) {
    if (!nodesById.has(edge.source)) {
      errors.push(`Aresta com source invalido: ${edge.source}`);
    }
    if (!nodesById.has(edge.target)) {
      errors.push(`Aresta com target invalido: ${edge.target}`);
    }
  }

  for (const node of graph.nodes) {
    if (node.kind === "gatilho" && node.type !== "trigger.lead_criado") {
      errors.push(`Node ${node.id}: gatilho invalido.`);
    }

    if (node.kind === "acao" && node.type !== "whatsapp.enviar_texto") {
      errors.push(`Node ${node.id}: acao invalida.`);
    }

    if (node.kind === "acao" && node.type === "whatsapp.enviar_texto") {
      const cfg = node.config;
      const messageTemplate = String(cfg.messageTemplate ?? "").trim();
      const whatsappInstanceId = String(cfg.whatsappInstanceId ?? "").trim();
      const sendToLeadPhone = cfg.sendToLeadPhone !== false;
      const manualPhones = Array.isArray(cfg.manualPhones)
        ? cfg.manualPhones.filter((phone) => typeof phone === "string" && phone.trim().length > 0)
        : [];

      if (!messageTemplate || !whatsappInstanceId) {
        errors.push(
          `Node ${node.id}: WhatsApp action requer messageTemplate e whatsappInstanceId.`
        );
      }

      if (!sendToLeadPhone && manualPhones.length === 0) {
        errors.push(`Node ${node.id}: informe ao menos um destinatario para envio.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function compilarGrafo(graph: WorkspaceGraph): CompiledWorkspace {
  const nodesById = new Map(graph.nodes.map((n) => [n.id, n]));
  const outgoingByNode = new Map<string, WorkspaceEdge[]>();

  for (const edge of graph.edges) {
    const existing = outgoingByNode.get(edge.source) || [];
    existing.push(edge);
    outgoingByNode.set(edge.source, existing);
  }

  const rootsByTrigger: Record<string, string[]> = {};

  for (const node of graph.nodes) {
    if (node.kind === "gatilho" && node.enabled !== false) {
      const triggerType = node.type.replace("trigger.", "");
      const roots = rootsByTrigger[triggerType] || [];
      roots.push(node.id);
      rootsByTrigger[triggerType] = roots;
    }
  }

  return {
    schemaVersion: 1,
    graph,
    compiled: {
      rootsByTrigger,
      nodesById: Object.fromEntries(nodesById),
      outgoingByNode: Object.fromEntries(outgoingByNode),
    },
  };
}

export async function disparaAutomacoesPorEvento(
  idEmpresa: string,
  tipo: string,
  contexto: AutomationContext
) {
  const published = await obterWorkspacePublicado(idEmpresa);

  if (!published) {
    return;
  }

  const compiled = JSON.parse(published.versao.grafo_json) as CompiledWorkspace;
  const matchingRoots = compiled.compiled.rootsByTrigger[tipo] || [];

  if (matchingRoots.length === 0) {
    return;
  }

  const execucao = await prisma.automacaoExecucao.create({
    data: {
      id: randomUUID(),
      id_automacao: published.workspace.id,
      id_versao: published.versao.id,
      status: "INICIADA",
      trigger_tipo: tipo,
      contexto_ref_tipo: contexto.negocioId ? "NEGOCIO" : contexto.leadId ? "LEAD" : undefined,
      contexto_ref_id: contexto.negocioId || contexto.leadId,
    },
  });

  for (const rootId of matchingRoots) {
    const rootNode = compiled.compiled.nodesById[rootId];
    if (!rootNode) continue;

    await executarWorkflow(
      idEmpresa,
      execucao.id,
      compiled,
      rootId,
      contexto,
      new Set<string>()
    );
  }

  await prisma.automacaoExecucao.updateMany({
    where: { id: execucao.id, status: "INICIADA" },
    data: { status: "CONCLUIDA", atualizado_em: new Date() },
  });
}

async function executarWorkflow(
  idEmpresa: string,
  idExecucao: string,
  compiled: CompiledWorkspace,
  nodeId: string,
  contexto: AutomationContext,
  path: Set<string>
) {
  const node = compiled.compiled.nodesById[nodeId];

  if (!node || node.enabled === false) {
    return;
  }

  if (path.has(nodeId)) {
    await prisma.automacaoExecucao.update({
      where: { id: idExecucao },
      data: {
        status: "FALHA",
        log_resumido_json: JSON.stringify({
          nodeId,
          erro: "Ciclo detectado no workflow",
        }),
      },
    });
    return;
  }

  path.add(nodeId);

  try {
    if (node.kind === "acao" && node.type === "whatsapp.enviar_texto") {
      const cfg = node.config as {
        messageTemplate: string;
        whatsappInstanceId: string;
        sendToLeadPhone?: boolean;
        manualPhones?: string[];
      };

      const shouldSendToLead = cfg.sendToLeadPhone !== false;
      const leadPhone = contexto.negocio?.lead_principal?.telefone || contexto.lead?.telefone;
      const manualPhones = Array.isArray(cfg.manualPhones) ? cfg.manualPhones : [];
      const rawRecipients = [
        ...(shouldSendToLead && leadPhone ? [leadPhone] : []),
        ...manualPhones,
      ];

      if (rawRecipients.length === 0) {
        await prisma.automacaoExecucao.update({
          where: { id: idExecucao },
          data: {
            status: "FALHA",
            log_resumido_json: JSON.stringify({
              nodeId,
              erro: "Nenhum destinatario configurado",
            }),
          },
        });
        return;
      }

      const destinatariosValidos = rawRecipients
        .map((phone) => normalizarTelefoneParaWhatsapp(phone))
        .filter((phone) => phone.valido && phone.waNumber)
        .filter((phone, idx, arr) => arr.findIndex((item) => item.waNumber === phone.waNumber) === idx);

      if (destinatariosValidos.length === 0) {
        await prisma.automacaoExecucao.update({
          where: { id: idExecucao },
          data: {
            status: "FALHA",
            log_resumido_json: JSON.stringify({
              nodeId,
              erro: "Nenhum destinatario valido para WhatsApp",
            }),
          },
        });
        return;
      }

    const instancia = await prisma.whatsappInstancia.findFirst({
      where: {
        id: cfg.whatsappInstanceId,
        id_empresa: idEmpresa,
      },
      select: { id: true, nome: true, instance_name: true, status: true, phone: true },
    });

    if (!instancia || !instanciaWhatsappEstaConectada(instancia)) {
      await prisma.automacaoExecucao.update({
        where: { id: idExecucao },
        data: {
          status: "FALHA",
          log_resumido_json: JSON.stringify({
            nodeId,
            erro: "Instancia WhatsApp selecionada nao esta conectada",
          }),
        },
      });
      return;
    }

    const templateVars = {
      ...criarContextoPreviewWhatsapp(),
      negocio_id: contexto.negocio?.id,
      negocio_titulo: contexto.negocio?.titulo,
      funil_nome: contexto.negocio?.funil_nome,
      estagio_nome: contexto.negocio?.estagio_nome,
      lead_nome: contexto.negocio?.lead_principal?.nome || contexto.lead?.nome,
      lead_telefone: contexto.negocio?.lead_principal?.telefone || contexto.lead?.telefone,
    };

      const mensagem = renderizarTemplateWhatsapp(cfg.messageTemplate, templateVars);

      try {
        let enviados = 0;
        const falhas: { telefone: string; erro: string }[] = [];

        for (const destinatario of destinatariosValidos) {
          try {
            await enviarMensagemTexto({
              instanceName: instancia.instance_name,
              telefone: destinatario.waNumber!,
              mensagem,
            });
            enviados += 1;
          } catch (erro) {
            falhas.push({
              telefone: mascararTelefoneParaLog(destinatario.raw),
              erro: erro instanceof Error ? erro.message : "Erro desconhecido",
            });
          }
        }

        if (enviados === 0) {
          await prisma.automacaoExecucao.update({
            where: { id: idExecucao },
            data: {
              status: "FALHA",
              log_resumido_json: JSON.stringify({
                nodeId,
                instancia: instancia.nome,
                enviados,
                totalDestinatarios: destinatariosValidos.length,
                falhas,
              }),
            },
          });
          return;
        }

        await prisma.automacaoExecucao.update({
          where: { id: idExecucao },
          data: {
            status: falhas.length > 0 ? "FALHA" : undefined,
            log_resumido_json: JSON.stringify({
              nodeId,
              instancia: instancia.nome,
              enviados,
              totalDestinatarios: destinatariosValidos.length,
              destinatarios: destinatariosValidos.map((item) => mascararTelefoneParaLog(item.raw)),
              falhas,
            }),
          },
        });
      } catch (erro) {
        await prisma.automacaoExecucao.update({
          where: { id: idExecucao },
          data: {
            status: "FALHA",
            log_resumido_json: JSON.stringify({
              nodeId,
              erro: erro instanceof Error ? erro.message : "Erro desconhecido",
            }),
          },
        });
        return;
      }
    }

    const outgoing = compiled.compiled.outgoingByNode[nodeId] || [];

    for (const edge of outgoing) {
      await executarWorkflow(idEmpresa, idExecucao, compiled, edge.target, contexto, path);
    }
  } finally {
    path.delete(nodeId);
  }
}
