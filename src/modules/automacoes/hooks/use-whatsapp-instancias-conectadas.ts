import { useEffect, useState } from "react";
import { listarInstanciasWhatsapp } from "@/lib/api/whatsapp.instances";
import { instanciaWhatsappEstaConectada } from "@/lib/whatsapp-instancia-status";

type WhatsappInstanciaOption = {
  id: string;
  nome: string;
};

export function useWhatsappInstanciasConectadas() {
  const [whatsappInstancias, setWhatsappInstancias] = useState<WhatsappInstanciaOption[]>([]);

  useEffect(() => {
    void (async () => {
      const resultado = await listarInstanciasWhatsapp();
      if (!resultado.ok) {
        return;
      }

      const conectadas = resultado.dados.instancias
        .filter(instanciaWhatsappEstaConectada)
        .map((instancia) => ({ id: instancia.id, nome: instancia.nome }));

      setWhatsappInstancias(conectadas);
    })();
  }, []);

  return whatsappInstancias;
}
