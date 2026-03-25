export type ConfigAutomacao = {
  id_estagio_destino?: string;
  arquivada?: boolean;
};

export function parseConfigAutomacao(configJson?: string | null): ConfigAutomacao {
  if (!configJson) {
    return {};
  }

  try {
    const bruto = JSON.parse(configJson) as ConfigAutomacao;
    const config: ConfigAutomacao = {};

    if (typeof bruto.id_estagio_destino === "string" && bruto.id_estagio_destino.trim()) {
      config.id_estagio_destino = bruto.id_estagio_destino.trim();
    }

    if (bruto.arquivada === true) {
      config.arquivada = true;
    }

    return config;
  } catch {
    return {};
  }
}

export function serializarConfigAutomacao(config: ConfigAutomacao): string {
  const normalizado: ConfigAutomacao = {};

  if (typeof config.id_estagio_destino === "string" && config.id_estagio_destino.trim()) {
    normalizado.id_estagio_destino = config.id_estagio_destino.trim();
  }

  if (config.arquivada === true) {
    normalizado.arquivada = true;
  }

  return JSON.stringify(normalizado);
}

export function automacaoArquivada(configJson?: string | null): boolean {
  return parseConfigAutomacao(configJson).arquivada === true;
}

export function automacaoCorrespondeAoEstagio(
  configJson: string | null | undefined,
  idEstagioAtual: string,
): boolean {
  const config = parseConfigAutomacao(configJson);
  return !config.id_estagio_destino || config.id_estagio_destino === idEstagioAtual;
}
