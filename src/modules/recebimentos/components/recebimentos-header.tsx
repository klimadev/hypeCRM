import { WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ModulePageHeader } from "@/components/shared/module-page-header";

type RecebimentosHeaderProps = {
  quantidadeMonitoradas: number;
  temFiltrosAtivos: boolean;
};

export function RecebimentosHeader({ quantidadeMonitoradas, temFiltrosAtivos }: RecebimentosHeaderProps) {
  return (
    <ModulePageHeader
      title="Recebimentos"
      subtitle="Acompanhe os recebimentos e pagamentos da empresa."
      iconTone="blue"
      icon={<WalletCards className="h-6 w-6" />}
      badges={[
        <Badge key="monitorados" variant="success">
          {quantidadeMonitoradas} parcelas monitoradas
        </Badge>,
        temFiltrosAtivos ? (
          <Badge key="filtros" variant="warning">
            filtros ativos
          </Badge>
        ) : (
          <Badge key="geral" variant="info">
            visao geral da operacao
          </Badge>
        ),
      ]}
    />
  );
}
