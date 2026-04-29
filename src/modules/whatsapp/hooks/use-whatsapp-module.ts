"use client";

import { useEffect, useState, useCallback } from "react";
import {
  atualizarStatusInstanciaWhatsapp,
  criarInstanciaWhatsapp,
  excluirInstanciaWhatsapp,
  listarInstanciasWhatsapp,
  obterQrCodeWhatsapp,
  reconectarInstanciaWhatsapp,
} from "@/lib/api/whatsapp";
import type { ResultadoQrWhatsapp, WhatsappInstancia, UseWhatsappModuleReturn } from "../types";

export function useWhatsappModule(): UseWhatsappModuleReturn {
  const [instancias, setInstancias] = useState<WhatsappInstancia[]>([]);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [pairingCodes, setPairingCodes] = useState<Record<string, string>>({});
  const [reconectandoIds, setReconectandoIds] = useState<Record<string, boolean>>({});
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarInstancias = useCallback(async () => {
    setCarregando(true);
    setErro(null);

    try {
      const resultado = await listarInstanciasWhatsapp();

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }

      setInstancias(resultado.dados.instancias);
    } catch {
      setErro("Erro ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const carregar = async () => {
      await carregarInstancias();
    };

    void carregar();
  }, [carregarInstancias]);

  const buscarQrCode = useCallback(async (id: string): Promise<ResultadoQrWhatsapp | null> => {
    try {
      const resultado = await obterQrCodeWhatsapp(id);

      if (!resultado.ok) {
        return null;
      }

      const snapshot = resultado.dados;

      setInstancias((atual) =>
        atual.map((instancia) =>
          instancia.id === id
            ? {
                ...instancia,
                status: snapshot.status,
                phone: snapshot.phone ?? instancia.phone,
              }
            : instancia,
        ),
      );

      if (snapshot.qrCode) {
        setQrCodes((atual) => ({ ...atual, [id]: snapshot.qrCode! }));
      }

      if (snapshot.pairingCode) {
        setPairingCodes((atual) => ({ ...atual, [id]: snapshot.pairingCode! }));
      }

      if (snapshot.conectado) {
        setQrCodes((atual) => {
          const proximo = { ...atual };
          delete proximo[id];
          return proximo;
        });
        setPairingCodes((atual) => {
          const proximo = { ...atual };
          delete proximo[id];
          return proximo;
        });
      }

      return snapshot;
    } catch {
      return null;
    }
  }, []);

  const criarInstancia = useCallback(async (nome: string): Promise<{ instanciaId: string | null }> => {
    setErro(null);

    const idTemporario = `temp-${Date.now()}`;
    const instanciaTemp: WhatsappInstancia = {
      id: idTemporario,
      id_empresa: "",
      id_criador: "",
      nome,
      instance_name: "",
      status: "creating",
      phone: null,
      profile_name: null,
      profile_pic: null,
      criado_em: new Date(),
      atualizado_em: new Date(),
      latency_ms: null,
      last_seen_at: null,
      connection_quality: "unknown",
      data_source: "unavailable",
    };

    setInstancias((atual) => [instanciaTemp, ...atual]);

    try {
      const resultado = await criarInstanciaWhatsapp(nome);

      if (!resultado.ok) {
        setErro(resultado.erro);
        setInstancias((atual) => atual.filter((i) => i.id !== idTemporario));
        return { instanciaId: null };
      }

      if (resultado.dados.instancia) {
        const instanciaCriada = resultado.dados.instancia;
        setInstancias((atual) => atual.map((i) => (i.id === idTemporario ? instanciaCriada : i)));
        if (resultado.dados.qrCode) {
          const qrCode = resultado.dados.qrCode;
          setQrCodes((antigo) => ({ ...antigo, [instanciaCriada.id]: qrCode }));
        }
        return { instanciaId: instanciaCriada.id };
      }

      setInstancias((atual) => atual.filter((i) => i.id !== idTemporario));
      return { instanciaId: null };
    } catch {
      setErro("Erro ao criar instância.");
      setInstancias((atual) => atual.filter((i) => i.id !== idTemporario));
      return { instanciaId: null };
    }
  }, []);

  const excluirInstancia = useCallback(async (id: string) => {
    if (id.startsWith("temp-")) return;

    const instanciaAnterior = instancias.find((i) => i.id === id);
    if (!instanciaAnterior) return;

    setInstancias((atual) => atual.filter((i) => i.id !== id));
    setQrCodes((antigo) => {
      const resto = { ...antigo };
      delete resto[id];
      return resto;
    });
    setPairingCodes((antigo) => {
      const resto = { ...antigo };
      delete resto[id];
      return resto;
    });

    try {
      const resultado = await excluirInstanciaWhatsapp(id);

      if (!resultado.ok) {
        setErro(resultado.erro);
        setInstancias((atual) => [...atual, instanciaAnterior]);
      }
    } catch {
      setErro("Erro ao excluir instância.");
      setInstancias((atual) => [...atual, instanciaAnterior]);
    }
  }, [instancias]);

  const atualizarStatus = useCallback(async (id: string) => {
    if (id.startsWith("temp-")) return;

    try {
      const resultado = await atualizarStatusInstanciaWhatsapp(id);

      if (!resultado.ok || !resultado.dados.instancia) return;

      const instanciaAtualizada = resultado.dados.instancia;
      setInstancias((atual) => atual.map((i) => (i.id === id ? instanciaAtualizada : i)));

      if (instanciaAtualizada.phone) {
        setQrCodes((atual) => {
          const proximo = { ...atual };
          delete proximo[id];
          return proximo;
        });
        setPairingCodes((atual) => {
          const proximo = { ...atual };
          delete proximo[id];
          return proximo;
        });
      }
    } catch {
      // Silencioso
    }
  }, []);

  const reconectarInstancia = useCallback(async (id: string) => {
    if (id.startsWith("temp-") || reconectandoIds[id]) return;

    setReconectandoIds((atual) => ({ ...atual, [id]: true }));
    setErro(null);

    try {
      const resultado = await reconectarInstanciaWhatsapp(id);

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }

      if (resultado.dados.instancia) {
        setInstancias((atual) => atual.map((i) => (i.id === id ? resultado.dados.instancia! : i)));
      }

      if (resultado.dados.qrCode) {
        setQrCodes((atual) => ({ ...atual, [id]: resultado.dados.qrCode! }));
      }

      if (resultado.dados.pairingCode) {
        setPairingCodes((atual) => ({ ...atual, [id]: resultado.dados.pairingCode! }));
      }

      if (resultado.dados.conectado) {
        setQrCodes((atual) => {
          const proximo = { ...atual };
          delete proximo[id];
          return proximo;
        });
        setPairingCodes((atual) => {
          const proximo = { ...atual };
          delete proximo[id];
          return proximo;
        });
      }
    } catch {
      setErro("Erro ao reconectar instância.");
    } finally {
      setReconectandoIds((atual) => ({ ...atual, [id]: false }));
    }
  }, [reconectandoIds]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      instancias.forEach((instancia) => {
        if (!instancia.phone && !instancia.id.startsWith("temp-")) {
          atualizarStatus(instancia.id);
        }
      });
    }, 3000);

    return () => clearInterval(intervalo);
  }, [instancias, atualizarStatus]);

  const getQrCode = useCallback((id: string): string | null => {
    return qrCodes[id] ?? null;
  }, [qrCodes]);

  const getPairingCode = useCallback((id: string): string | null => {
    return pairingCodes[id] ?? null;
  }, [pairingCodes]);

  const estaReconectando = useCallback((id: string) => reconectandoIds[id] === true, [reconectandoIds]);

  return {
    instancias,
    carregando,
    erro,
    criarInstancia,
    excluirInstancia,
    atualizarStatus,
    reconectarInstancia,
    estaReconectando,
    buscarQrCode,
    getQrCode,
    getPairingCode,
    recarregar: carregarInstancias,
  };
}
