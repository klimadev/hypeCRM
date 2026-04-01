"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  Save, 
  User, 
  Mail, 
  Briefcase, 
  MapPin, 
  Shield,
  MoreHorizontal,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  UserMinus,
  History,
  Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { Funcionario, UseEquipeModuleReturn, DadosEdicao } from "../types";

type FuncionarioEditarDrawerProps = {
  vm: UseEquipeModuleReturn;
  funcionario: Funcionario | null;
  aberto: boolean;
  onFechar: () => void;
};

// Componente de badge de status
function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <Badge 
      variant={ativo ? "success" : "error"}
      className="font-medium px-2.5 py-1"
    >
      {ativo ? (
        <><CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Ativo</>
      ) : (
        <><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Inativo</>
      )}
    </Badge>
  );
}

// Componente de label de campo com tooltip
function CampoLabel({ 
  icone: Icone, 
  children, 
  tooltip 
}: { 
  icone: React.ElementType, 
  children: React.ReactNode, 
  tooltip: string 
}) {
  return (
    <Tooltip content={tooltip} side="right">
      <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)] cursor-help">
        <Icone className="w-4 h-4 text-[var(--text-tertiary)]" />
        {children}
        <HelpCircle className="w-3.5 h-3.5 text-[var(--text-disabled)] hover:text-[var(--text-tertiary)] transition-colors" />
      </label>
    </Tooltip>
  );
}

// Componente de avatar do colaborador
function ColaboradorAvatar({ nome, tamanho = "lg" }: { nome: string, tamanho?: "sm" | "lg" }) {
  const iniciais = nome
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
    
  const cores = [
    "bg-gradient-to-br from-emerald-400 to-cyan-500",
    "bg-gradient-to-br from-violet-400 to-fuchsia-500",
    "bg-gradient-to-br from-amber-400 to-orange-500",
    "bg-gradient-to-br from-rose-400 to-pink-500",
    "bg-gradient-to-br from-sky-400 to-blue-500",
    "bg-gradient-to-br from-lime-400 to-green-500",
  ];
  
  const indiceCor = nome.charCodeAt(0) % cores.length;
  
  const tamanhoClasses = tamanho === "lg" 
    ? "w-20 h-20 text-2xl" 
    : "w-12 h-12 text-sm";

  return (
    <div className={`
      ${tamanhoClasses} rounded-full flex items-center justify-center text-white font-bold shadow-lg
      ${cores[indiceCor]}
    `}>
      {iniciais}
    </div>
  );
}

export function FuncionarioEditarDrawer({ vm, funcionario, aberto, onFechar }: FuncionarioEditarDrawerProps) {
  const [dados, setDados] = useState<DadosEdicao | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [mostrarMenuAcoes, setMostrarMenuAcoes] = useState(false);

  useEffect(() => {
    if (aberto && funcionario) {
      const sincronizacao = setTimeout(() => {
        setDados({
          nome: funcionario.nome,
          email: funcionario.email,
          cargo: funcionario.cargo,
          id_pdv: funcionario.pdv?.id ?? "",
        });
        setErros({});
      }, 0);

      return () => clearTimeout(sincronizacao);
    }
  }, [aberto, funcionario]);

  const aoMudar = (campo: keyof DadosEdicao, valor: string) => {
    if (!dados) return;
    const novosDados = { ...dados, [campo]: valor };
    setDados(novosDados);
    setErros({});
  };

  const handleSalvar = async () => {
    if (!dados || !funcionario) return;

    const novosErros: Record<string, string> = {};
    if (!dados.nome.trim() || dados.nome.trim().length < 2) {
      novosErros.nome = "Nome deve ter ao menos 2 caracteres.";
    }
    if (!dados.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email.trim())) {
      novosErros.email = "E-mail inválido.";
    }
    if (!dados.id_pdv.trim()) {
      novosErros.id_pdv = "PDV obrigatório.";
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    const ok = await vm.salvarEdicaoAtual(dados);
    if (ok) {
      onFechar();
    }
  };

  const handleInativar = () => {
    if (funcionario) {
      vm.abrirModalInativacao(funcionario);
      setMostrarMenuAcoes(false);
    }
  };

  const handleResetarSenha = () => {
    // TODO: Implementar reset de senha
    setMostrarMenuAcoes(false);
  };

  const handleVerHistorico = () => {
    // TODO: Implementar visualização de histórico
    setMostrarMenuAcoes(false);
  };

  const salvando = vm.statusSalvamento.id === funcionario?.id && vm.statusSalvamento.estado === "saving";

  // Pegar nome do cargo label
  const getCargoLabel = (cargo: string) => {
    const labels: Record<string, string> = {
      COLABORADOR: "Colaborador",
      GERENTE: "Gerente",
      ADMINISTRADOR: "Administrador",
    };
    return labels[cargo] || cargo;
  };

  return (
    <Sheet open={aberto} onOpenChange={(proximoAberto) => { if (!proximoAberto) onFechar(); }}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto bg-[var(--surface-elevated)] border-l-[var(--border-subtle)]">
        <SheetHeader className="pb-6 border-b border-[var(--border-subtle)]">
          {/* Header com avatar e info do colaborador */}
          <div className="flex items-start gap-4">
            <ColaboradorAvatar nome={funcionario?.nome || ""} />
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Editar Colaborador
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge ativo={funcionario?.ativo ?? false} />
                <Badge variant="secondary" className="font-medium">
                  <Shield className="w-3 h-3 mr-1.5" />
                  {getCargoLabel(funcionario?.cargo || "")}
                </Badge>
              </div>
            </div>
          </div>
          <SheetDescription className="text-[var(--text-secondary)] mt-3 text-sm leading-relaxed">
            Atualize as informações do colaborador. Campos marcados com * são obrigatórios.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="dados" className="mt-6">
          <TabsList className="grid w-full grid-cols-3 bg-[var(--surface-elevated)] p-1 rounded-xl border border-[var(--border-subtle)]">
            <TabsTrigger value="dados" className="rounded-lg gap-1.5 text-sm font-medium">
              <User className="w-4 h-4" />
              Dados
            </TabsTrigger>
            <TabsTrigger value="trabalho" className="rounded-lg gap-1.5 text-sm font-medium">
              <Briefcase className="w-4 h-4" />
              Trabalho
            </TabsTrigger>
            <TabsTrigger value="acesso" className="rounded-lg gap-1.5 text-sm font-medium">
              <Key className="w-4 h-4" />
              Acesso
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dados Pessoais */}
          <TabsContent value="dados" className="space-y-5 mt-6">
            <div className="space-y-2">
              <CampoLabel icone={User} tooltip="Nome completo conforme documento de identidade">
                Nome completo *
              </CampoLabel>
              <Input
                value={dados?.nome ?? ""}
                onChange={(e) => aoMudar("nome", e.target.value)}
                placeholder="Ex: Maria da Silva Santos"
                className={`
                  h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] 
                  placeholder:text-[var(--text-tertiary)] text-base font-medium
                  focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]
                  ${erros.nome ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : ""}
                `}
              />
              {erros.nome && (
                <p className="flex items-center gap-1.5 text-sm text-[var(--danger)] font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {erros.nome}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <CampoLabel icone={Mail} tooltip="E-mail corporativo usado para login e notificações do sistema">
                E-mail corporativo *
              </CampoLabel>
              <Input
                type="email"
                value={dados?.email ?? ""}
                onChange={(e) => aoMudar("email", e.target.value)}
                placeholder="Ex: maria.silva@hypecrm.com.br"
                className={`
                  h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-[var(--text-primary)] 
                  placeholder:text-[var(--text-tertiary)] text-base font-medium
                  focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]
                  ${erros.email ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : ""}
                `}
              />
              {erros.email && (
                <p className="flex items-center gap-1.5 text-sm text-[var(--danger)] font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {erros.email}
                </p>
              )}
              <p className="text-xs text-[var(--text-disabled)] flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Usado para login e envio de notificações importantes
              </p>
            </div>
          </TabsContent>

          {/* Tab: Trabalho */}
          <TabsContent value="trabalho" className="space-y-5 mt-6">
            <div className="space-y-2">
              <CampoLabel icone={Shield} tooltip="Nível de acesso e permissões do colaborador no sistema">
                Cargo / Função *
              </CampoLabel>
              <Select value={dados?.cargo ?? ""} onValueChange={(valor) => aoMudar("cargo", valor)}>
                <SelectTrigger className={`
                  h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-base font-medium
                  focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]
                  ${erros.cargo ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : ""}
                `}>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COLABORADOR">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--success)]" />
                      Colaborador
                    </div>
                  </SelectItem>
                  <SelectItem value="GERENTE">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--warning)]" />
                      Gerente
                    </div>
                  </SelectItem>
                  <SelectItem value="ADMINISTRADOR">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[var(--brand)]" />
                      Administrador
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {erros.cargo && (
                <p className="flex items-center gap-1.5 text-sm text-[var(--danger)] font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {erros.cargo}
                </p>
              )}
              <p className="text-xs text-[var(--text-disabled)] flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Define o nível de acesso e permissões no sistema
              </p>
            </div>

            <div className="space-y-2">
              <CampoLabel icone={MapPin} tooltip="PDV (Ponto de Venda) onde o colaborador irá trabalhar">
                PDV / Local de trabalho *
              </CampoLabel>
              <Select value={dados?.id_pdv ?? ""} onValueChange={(valor) => aoMudar("id_pdv", valor)}>
                <SelectTrigger className={`
                  h-12 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] text-base font-medium
                  focus:border-[var(--border-focus)] focus:ring-[var(--focus-ring)]
                  ${erros.id_pdv ? "border-[var(--danger)] bg-[color:rgba(244,63,94,0.08)]" : ""}
                `}>
                  <SelectValue placeholder="Selecione o PDV" />
                </SelectTrigger>
                <SelectContent>
                  {vm.pdvs.map((pdv) => (
                    <SelectItem key={pdv.id} value={pdv.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                        {pdv.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {erros.id_pdv && (
                <p className="flex items-center gap-1.5 text-sm text-[var(--danger)] font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {erros.id_pdv}
                </p>
              )}
              <p className="text-xs text-[var(--text-disabled)] flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Ponto de venda onde o colaborador irá operar
              </p>
            </div>
          </TabsContent>

          {/* Tab: Acesso (placeholder para funcionalidades futuras) */}
          <TabsContent value="acesso" className="space-y-5 mt-6">
            <div className="bg-[var(--surface-elevated)] rounded-2xl p-6 border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[color:rgba(255,255,255,0.06)] flex items-center justify-center">
                  <Key className="w-5 h-5 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)]">Configurações de Acesso</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Gerencie senhas e permissões</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-11 rounded-xl border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
                  onClick={handleResetarSenha}
                >
                  <Key className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="flex-1 text-left">Redefinir senha</span>
                  <span className="text-xs text-[var(--text-disabled)]">Enviar link por e-mail</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-11 rounded-xl border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
                  onClick={handleVerHistorico}
                >
                  <History className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="flex-1 text-left">Ver histórico de alterações</span>
                </Button>
              </div>
            </div>

            {/* Seção de segurança */}
            <div className="bg-[color:rgba(244,63,94,0.08)] rounded-2xl p-4 border border-[color:rgba(244,63,94,0.16)]">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-[var(--danger)]" />
                <h4 className="font-semibold text-[var(--text-primary)] text-sm">Zona de Perigo</h4>
              </div>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2 h-10 rounded-lg border-[color:rgba(244,63,94,0.24)] text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.12)] hover:border-[color:rgba(244,63,94,0.4)]"
                onClick={handleInativar}
              >
                <UserMinus className="w-4 h-4" />
                <span className="flex-1 text-left">Inativar colaborador</span>
              </Button>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                O colaborador não conseguirá mais acessar o sistema
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Erro geral de salvamento */}
        {vm.statusSalvamento.id === funcionario?.id && vm.statusSalvamento.estado === "error" && (
          <div className="mt-4 rounded-xl bg-[color:rgba(244,63,94,0.08)] border border-[color:rgba(244,63,94,0.2)] p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--danger)] mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-[var(--text-primary)]">Erro ao salvar</p>
              <p className="text-sm text-[var(--text-secondary)]">{vm.statusSalvamento.mensagem}</p>
            </div>
          </div>
        )}

        <SheetFooter className="mt-8 pt-4 border-t border-[var(--border-subtle)] flex-row gap-3">
          <div className="relative flex-1">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-[var(--border-subtle)] text-[var(--text-secondary)] font-medium hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] gap-2"
              onClick={() => setMostrarMenuAcoes(!mostrarMenuAcoes)}
              disabled={salvando}
            >
              <MoreHorizontal className="w-4 h-4" />
              Mais ações
            </Button>
            
            {/* Dropdown de ações */}
            {mostrarMenuAcoes && (
              <div className="absolute bottom-full mb-2 left-0 right-0 bg-[var(--surface-elevated)] rounded-xl shadow-lg border border-[var(--border-subtle)] py-2 z-10">
                <button 
                  className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] flex items-center gap-3"
                  onClick={handleVerHistorico}
                >
                  <History className="w-4 h-4 text-[var(--text-tertiary)]" />
                  Ver histórico
                </button>
                <button 
                  className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[color:rgba(255,255,255,0.04)] hover:text-[var(--text-primary)] flex items-center gap-3"
                  onClick={handleResetarSenha}
                >
                  <Key className="w-4 h-4 text-[var(--text-tertiary)]" />
                  Redefinir senha
                </button>
                <hr className="my-2 border-[var(--border-subtle)]" />
                <button 
                  className="w-full px-4 py-2.5 text-left text-sm text-[var(--danger)] hover:bg-[color:rgba(244,63,94,0.08)] flex items-center gap-3"
                  onClick={handleInativar}
                >
                  <UserMinus className="w-4 h-4" />
                  Inativar colaborador
                </button>
              </div>
            )}
          </div>
          
          <Button 
            className="h-12 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-strong)] text-white font-semibold shadow-lg shadow-[var(--brand)]/20 gap-2 min-w-[140px]"
            onClick={handleSalvar} 
            disabled={salvando}
          >
            {salvando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar alterações
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
