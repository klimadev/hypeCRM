import { mascararTelefoneParaLog, normalizarTelefoneParaWhatsapp } from "@/lib/phone";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";
import type {
  CriarInstanciaParams,
  EvolutionConnectionState,
  EvolutionInstance,
  EvolutionQrCode,
} from "./evolution-api.types";
import {
  extrairTelefoneEvolution,
  montarEstadoConexaoEvolution,
  normalizarQrCodeEvolution,
  normalizarStatusEvolution,
} from "./evolution-api.utils";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
};

async function lerJsonErro(resposta: Response) {
  return await resposta.json().catch(() => ({}));
}

export async function listarInstancias(): Promise<EvolutionInstance[]> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: "GET",
      headers,
    });

    if (!resposta.ok) {
      const erro = await lerJsonErro(resposta);
      throw new Error(erro.message ?? "Erro ao buscar instâncias");
    }

    const json = await resposta.json();
    return json.instances ?? [];
  } catch (erro) {
    console.error("Erro ao listar instâncias na Evolution:", erro);
    throw erro;
  }
}

export async function buscarInstancia(instanceName: string): Promise<EvolutionInstance | null> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers,
    });

    if (!resposta.ok) {
      return null;
    }

    const json = await resposta.json();
    return {
      instanceName: json.instanceName,
      instanceId: json.instanceId,
      status: json.status,
      phoneNumber: json.phoneNumber,
    };
  } catch {
    return null;
  }
}

export async function obterEstadoConexao(instanceName: string): Promise<EvolutionConnectionState | null> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers,
    });

    if (!resposta.ok) {
      return null;
    }

    const json = (await resposta.json().catch(() => ({}))) as Record<string, unknown>;
    const data = (json.instance ?? json) as Record<string, unknown>;
    const status = normalizarStatusEvolution(data.state ?? data.status ?? json.state ?? json.status);
    const phoneNumber = extrairTelefoneEvolution(data.owner ?? data.phoneNumber ?? json.owner ?? json.phoneNumber);
    const connected = instanciaWhatsappEstaConectada({ status, phone: phoneNumber });
    return montarEstadoConexaoEvolution(instanceName, json, connected);
  } catch {
    return null;
  }
}

export async function criarInstancia(params: CriarInstanciaParams): Promise<{
  instanceName: string;
  qr_code?: string;
  base64?: string;
}> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        instanceName: params.nome,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });

    if (!resposta.ok) {
      const erro = await lerJsonErro(resposta);
      const mensagemErro = erro?.error?.message ?? erro?.message ?? erro?.reason ?? "Erro ao criar instância";
      throw new Error(mensagemErro);
    }

    const json = await resposta.json();
    let qrCodeData = json.qrcode?.base64 ?? json.qrcode;

    if (!qrCodeData && json.instance?.qrcode) {
      qrCodeData = json.instance.qrcode.base64 ?? json.instance.qrcode;
    }

    return {
      instanceName: json.instance?.instanceName ?? json.instanceName ?? params.nome,
      qr_code: json.qrcode?.code,
      base64: qrCodeData,
    };
  } catch (erro) {
    console.error("Erro ao criar instância na Evolution:", erro);
    throw erro;
  }
}

export async function deletarInstancia(instanceName: string): Promise<void> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers,
    });

    if (!resposta.ok) {
      const erro = await lerJsonErro(resposta);
      throw new Error(erro.message ?? "Erro ao excluir instância");
    }
  } catch (erro) {
    console.error("Erro ao deletar instância na Evolution:", erro);
    throw erro;
  }
}

export async function gerarQrCode(instanceName: string): Promise<{ code: string; base64: string } | null> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers,
    });

    if (!resposta.ok) {
      return null;
    }

    const json = await resposta.json();
    return json.qrcode ?? null;
  } catch {
    return null;
  }
}

export async function conectarInstancia(instanceName: string): Promise<EvolutionQrCode | null> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers,
    });

    if (!resposta.ok) {
      return null;
    }

    const json = (await resposta.json().catch(() => ({}))) as Record<string, unknown>;
    return normalizarQrCodeEvolution(json);
  } catch {
    return null;
  }
}

export async function reiniciarInstancia(instanceName: string): Promise<EvolutionConnectionState | null> {
  try {
    const resposta = await fetch(`${EVOLUTION_API_URL}/instance/restart/${instanceName}`, {
      method: "PUT",
      headers,
    });

    if (!resposta.ok) {
      return null;
    }

    return obterEstadoConexao(instanceName);
  } catch {
    return null;
  }
}

type EnviarMensagemTextoParams = {
  instanceName: string;
  telefone: string;
  mensagem: string;
};

export async function enviarMensagemTexto(params: EnviarMensagemTextoParams): Promise<void> {
  const numeroNormalizado = normalizarTelefoneParaWhatsapp(params.telefone);
  if (!numeroNormalizado.valido || !numeroNormalizado.waNumber) {
    throw new Error(numeroNormalizado.motivoErro ?? "Telefone invalido para envio WhatsApp.");
  }

  const resposta = await fetch(`${EVOLUTION_API_URL}/message/sendText/${params.instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      number: `+${numeroNormalizado.waNumber}`,
      text: params.mensagem,
    }),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    const mensagemErro =
      typeof erro.message === "string"
        ? erro.message
        : typeof erro.error === "string"
          ? erro.error
          : "Erro ao enviar mensagem WhatsApp";
    throw new Error(
      `${mensagemErro} (status=${resposta.status}, instancia=${params.instanceName}, numero=${mascararTelefoneParaLog(numeroNormalizado.waNumber)})`,
    );
  }
}
