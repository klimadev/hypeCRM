"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, WifiOff } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { DadosEdicao, UseEquipeModuleReturn, Pdv } from "../types";
import {
  criarFuncionariosDaLoja,
  filtrarFuncionariosDaLoja,
  ordenarFuncionariosDaLoja,
  proximaOrdenacaoLoja,
  validarDadosEdicaoLoja,
  validarNovoFuncionarioLoja,
  type DirecaoOrdenacaoLoja,
  type ErrosCadastroLoja,
  type FuncionarioLojaItem,
  type OrdenacaoLoja,
} from "./equipe-loja-drawer.utils";
import { EquipeLojaDrawerEditView } from "./equipe-loja-drawer-edit-view";
import { EquipeLojaDrawerWhatsappCard } from "./equipe-loja-drawer-whatsapp-card";
import { EquipeLojaDrawerNewPersonForm } from "./equipe-loja-drawer-new-person-form";
import { EquipeLojaDrawerPeopleSection } from "./equipe-loja-drawer-people-section";

type EquipeLojaDrawerProps = {
  vm: UseEquipeModuleReturn;
  loja: Pdv | null;
  aberto: boolean;
  onFechar: () => void;
};

const VALOR_SEM_INSTANCIA = "__SEM_INSTANCIA__";

export function EquipeLojaDrawer({ vm, loja, aberto, onFechar }: EquipeLojaDrawerProps) {
  const { carregarFuncionarios } = vm;
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<OrdenacaoLoja>("nome");
  const [direcao, setDirecao] = useState<DirecaoOrdenacaoLoja>("asc");
  const [editandoPessoaId, setEditandoPessoaId] = useState<string | null>(null);
  const [dadosEdicaoPessoa, setDadosEdicaoPessoa] = useState<DadosEdicao | null>(null);
  const [errosEdicao, setErrosEdicao] = useState<Record<string, string>>({});
  const [mostrarFormularioNovo, setMostrarFormularioNovo] = useState(false);
  const [cadastroSucesso, setCadastroSucesso] = useState(false);
  const [errosCadastro, setErrosCadastro] = useState<ErrosCadastroLoja>({});
  const [cargoNovo, setCargoNovo] = useState("COLABORADOR");
  const [trocandoWhatsapp, setTrocandoWhatsapp] = useState(false);
  const [instanciaWhatsappSelecionada, setInstanciaWhatsappSelecionada] = useState("");
  const [salvandoWhatsapp, setSalvandoWhatsapp] = useState(false);

  const lojaAtual = useMemo(() => {
    if (!loja) {
      return null;
    }

    return vm.pdvs.find((item) => item.id === loja.id) ?? loja;
  }, [vm.pdvs, loja]);

  useEffect(() => {
    if (aberto && lojaAtual?.id) {
      void carregarFuncionarios();
    }
  }, [aberto, carregarFuncionarios, lojaAtual?.id]);

  const pessoasLoja = useMemo(() => criarFuncionariosDaLoja(vm.funcionarios, lojaAtual?.id), [lojaAtual?.id, vm.funcionarios]);
  const pessoasFiltradas = useMemo(() => filtrarFuncionariosDaLoja(pessoasLoja, busca), [busca, pessoasLoja]);
  const pessoasOrdenadas = useMemo(() => ordenarFuncionariosDaLoja(pessoasFiltradas, ordenacao, direcao), [direcao, ordenacao, pessoasFiltradas]);

  const resetarEstadoInterno = () => {
    setBusca("");
    setOrdenacao("nome");
    setDirecao("asc");
    setEditandoPessoaId(null);
    setDadosEdicaoPessoa(null);
    setErrosEdicao({});
    setMostrarFormularioNovo(false);
    setCadastroSucesso(false);
    setErrosCadastro({});
    setCargoNovo("COLABORADOR");
    setTrocandoWhatsapp(false);
    setInstanciaWhatsappSelecionada("");
    setSalvandoWhatsapp(false);
  };

  const iniciarEdicaoPessoa = (pessoa: FuncionarioLojaItem) => {
    setDadosEdicaoPessoa({
      nome: pessoa.nome,
      email: pessoa.email,
      cargo: pessoa.cargo,
      id_pdv: lojaAtual?.id ?? "",
    });
    setErrosEdicao({});
    setEditandoPessoaId(pessoa.id);
  };

  const cancelarEdicaoPessoa = () => {
    setEditandoPessoaId(null);
    setDadosEdicaoPessoa(null);
    setErrosEdicao({});
  };

  const salvarEdicaoPessoa = async () => {
    if (!dadosEdicaoPessoa || !editandoPessoaId) {
      return;
    }

    const novosErros = validarDadosEdicaoLoja(dadosEdicaoPessoa);
    if (Object.keys(novosErros).length > 0) {
      setErrosEdicao(novosErros);
      return;
    }

    const funcionario = vm.funcionarios.find((item) => item.id === editandoPessoaId);
    if (!funcionario) {
      return;
    }

    vm.iniciarEdicao(funcionario);
    const ok = await vm.salvarEdicaoAtual(dadosEdicaoPessoa);
    if (ok) {
      cancelarEdicaoPessoa();
    }
  };

  const handleSubmitNovo = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    setErrosCadastro({});
    setCadastroSucesso(false);

    const dados = new FormData(evento.currentTarget);
    const nome = (dados.get("nome") as string)?.trim() ?? "";
    const email = (dados.get("email") as string)?.trim() ?? "";
    const senha = (dados.get("senha") as string) ?? "";
    const novosErros = validarNovoFuncionarioLoja({ nome, email, senha });

    if (Object.keys(novosErros).length > 0) {
      setErrosCadastro(novosErros);
      return;
    }

    vm.setCargoSelecionado(cargoNovo);
    vm.setPdvSelecionado(lojaAtual?.id ?? "");

    const sucesso = await vm.adicionarFuncionario(evento);
    if (sucesso) {
      setCadastroSucesso(true);
      setMostrarFormularioNovo(false);
      setCargoNovo("COLABORADOR");
      setTimeout(() => setCadastroSucesso(false), 3000);
      evento.currentTarget.reset();
    }
  };

  const iniciarTrocaWhatsapp = () => {
    if (!lojaAtual) {
      return;
    }

    setInstanciaWhatsappSelecionada(lojaAtual.id_whatsapp_instancia ?? "");
    setTrocandoWhatsapp(true);
  };

  const cancelarTrocaWhatsapp = () => {
    setTrocandoWhatsapp(false);
    setInstanciaWhatsappSelecionada(lojaAtual?.id_whatsapp_instancia ?? "");
  };

  const salvarTrocaWhatsapp = async () => {
    if (!lojaAtual) {
      return;
    }

    setSalvandoWhatsapp(true);
    const ok = await vm.trocarInstanciaPdv(lojaAtual.id, instanciaWhatsappSelecionada || null);
    setSalvandoWhatsapp(false);

    if (ok) {
      setTrocandoWhatsapp(false);
    }
  };

  const alternarOrdenacao = (campo: OrdenacaoLoja) => {
    const proximo = proximaOrdenacaoLoja(ordenacao, direcao, campo);
    setOrdenacao(proximo.ordenacao);
    setDirecao(proximo.direcao);
  };

  const getFuncionarioOriginal = (pessoaId: string) => vm.funcionarios.find((item) => item.id === pessoaId);

  return (
    <Sheet
      open={aberto}
      onOpenChange={(estaAberto) => {
        if (!estaAberto) {
          onFechar();
          resetarEstadoInterno();
        }
      }}
    >
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto bg-[var(--surface-elevated)] p-0">
        {editandoPessoaId && dadosEdicaoPessoa ? (
          <EquipeLojaDrawerEditView
            dados={dadosEdicaoPessoa}
            erros={errosEdicao}
            statusSalvamento={vm.statusSalvamento}
            editandoPessoaId={editandoPessoaId}
            onCancelar={cancelarEdicaoPessoa}
            onSalvar={() => void salvarEdicaoPessoa()}
            onChange={(campo, valor) => setDadosEdicaoPessoa((atual) => (atual ? { ...atual, [campo]: valor } : atual))}
          />
        ) : (
          <>
            <SheetHeader className="border-b border-[var(--border-subtle)] px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <SheetTitle className="text-xl text-[var(--text-primary)]">{lojaAtual?.nome}</SheetTitle>
                  <SheetDescription className="text-sm text-[var(--text-secondary)] mt-1">
                    {pessoasLoja.length} {pessoasLoja.length === 1 ? "pessoa cadastrada" : "pessoas cadastradas"}
                  </SheetDescription>
                </div>
                {lojaAtual?.alerta_configuracao ? (
                  <div className="flex items-center gap-2 rounded-lg border border-[color:rgba(245,158,11,0.24)] bg-[color:rgba(245,158,11,0.08)] px-3 py-2 text-xs text-[var(--warning)] shrink-0">
                    <WifiOff className="h-3.5 w-3.5" />
                    <span>Sem WhatsApp</span>
                  </div>
                ) : null}
              </div>
            </SheetHeader>

            <div className="px-6 py-4 space-y-4">
              {cadastroSucesso ? (
                <div className="flex items-center gap-3 rounded-xl border border-[color:rgba(16,185,129,0.2)] bg-[color:rgba(16,185,129,0.08)] px-4 py-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:rgba(16,185,129,0.12)]">
                    <CheckCircle2 className="h-5 w-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--success)]">Pessoa cadastrada com sucesso!</p>
                    <p className="text-xs text-[var(--success)]/80">Lista atualizada automaticamente</p>
                  </div>
                </div>
              ) : null}

              {vm.podeGerenciarEmpresa && lojaAtual ? (
                <EquipeLojaDrawerWhatsappCard
                  loja={lojaAtual}
                  instancias={vm.instancias}
                  erro={vm.erroGestaoPdvs}
                  trocando={trocandoWhatsapp}
                  instanciaSelecionada={instanciaWhatsappSelecionada}
                  salvando={salvandoWhatsapp}
                  valorSemInstancia={VALOR_SEM_INSTANCIA}
                  onIniciarTroca={iniciarTrocaWhatsapp}
                  onCancelarTroca={cancelarTrocaWhatsapp}
                  onSelecionarInstancia={setInstanciaWhatsappSelecionada}
                  onSalvar={() => void salvarTrocaWhatsapp()}
                />
              ) : null}

              <EquipeLojaDrawerNewPersonForm
                aberto={mostrarFormularioNovo}
                erroCadastroApi={vm.erroCadastro}
                errosCadastro={errosCadastro}
                carregandoCadastro={vm.carregandoCadastro}
                cargoNovo={cargoNovo}
                onAbrir={() => setMostrarFormularioNovo(true)}
                onFechar={() => {
                  setMostrarFormularioNovo(false);
                  setErrosCadastro({});
                  setCargoNovo("COLABORADOR");
                }}
                onCargoChange={setCargoNovo}
                onSubmit={handleSubmitNovo}
              />
            </div>

            <EquipeLojaDrawerPeopleSection
              busca={busca}
              ordenacao={ordenacao}
              direcao={direcao}
              carregandoLista={vm.carregandoLista}
              alertaConfiguracao={Boolean(lojaAtual?.alerta_configuracao)}
              quantidadePessoas={pessoasOrdenadas.length}
              pessoas={pessoasOrdenadas}
              podeGerenciarEmpresa={vm.podeGerenciarEmpresa}
              onBuscaChange={setBusca}
              onOrdenar={alternarOrdenacao}
              onEditar={iniciarEdicaoPessoa}
              onInativar={(pessoaId) => {
                const alvo = getFuncionarioOriginal(pessoaId);
                if (alvo) {
                  vm.abrirModalInativacao(alvo);
                }
              }}
              getFuncionarioOriginal={getFuncionarioOriginal}
            />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
