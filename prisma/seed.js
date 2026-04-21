/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const senhaEmpresa = await bcrypt.hash("123456", 10);
  const senhaEquipe = await bcrypt.hash("123456", 10);

  const empresaEmail = "empresa.demo@hypecrm.com";
  const empresaAtual = await prisma.empresa.findUnique({ where: { email: empresaEmail } });

  const empresaId = empresaAtual?.id || crypto.randomUUID();

  if (empresaAtual) {
    await prisma.lead.deleteMany({ where: { id_empresa: empresaId } });
    await prisma.funcionario.deleteMany({ where: { id_empresa: empresaId } });
    await prisma.pdv.deleteMany({ where: { id_empresa: empresaId } });
    await prisma.$executeRaw`DELETE FROM EstagioFunil WHERE id_empresa = ${empresaId}`;
    await prisma.$executeRaw`DELETE FROM Funil WHERE id_empresa = ${empresaId}`;
  }

  if (!empresaAtual) {
    await prisma.empresa.create({
      data: {
        id: empresaId,
        nome: "HYPE CRM Demo",
        email: empresaEmail,
        senha_hash: senhaEmpresa,
        isSuperAdmin: true,
      },
    });
  } else {
    await prisma.empresa.update({
      where: { id: empresaId },
      data: { nome: "HYPE CRM Demo", senha_hash: senhaEmpresa, isSuperAdmin: true },
    });
  }

  const funilId = crypto.randomUUID();
  await prisma.$executeRaw`
    INSERT INTO Funil (id, nome, slug, id_empresa, criado_em, atualizado_em)
    VALUES (${funilId}, 'Funil Principal', 'funil-principal', ${empresaId}, datetime('now'), datetime('now'))
  `;

  const estagios = [
    { nome: "Indefinido", tipo: "ABERTO", ordem: 1 },
    { nome: "Em Atendimento", tipo: "ABERTO", ordem: 2 },
    { nome: "Proposta Enviada", tipo: "ABERTO", ordem: 3 },
    { nome: "Pré Aprovação", tipo: "ABERTO", ordem: 4 },
    { nome: "Fechado", tipo: "GANHO", ordem: 5 },
    { nome: "Pós Vendas", tipo: "GANHO", ordem: 6 },
    { nome: "Perdido", tipo: "PERDIDO", ordem: 7 },
  ];

  for (const estagio of estagios) {
    await prisma.$executeRaw`
      INSERT INTO EstagioFunil (id, nome, tipo, ordem, id_empresa, id_funil, criado_em, atualizado_em)
      VALUES (${crypto.randomUUID()}, ${estagio.nome}, ${estagio.tipo}, ${estagio.ordem}, ${empresaId}, ${funilId}, datetime('now'), datetime('now'))
    `;
  }

  const pdvCentroId = crypto.randomUUID();
  const pdvZonaSulId = crypto.randomUUID();

  await prisma.pdv.create({
    data: { id: pdvCentroId, id_empresa: empresaId, nome: "PDV Centro" },
  });
  await prisma.pdv.create({
    data: { id: pdvZonaSulId, id_empresa: empresaId, nome: "PDV Zona Sul" },
  });

  await prisma.funcionario.create({
    data: {
      id: crypto.randomUUID(),
      id_empresa: empresaId,
      id_pdv: pdvCentroId,
      nome: "Marina Gerente",
      email: "gerente.demo@hypecrm.com",
      senha_hash: senhaEquipe,
      cargo: "GERENTE",
      ativo: true,
    },
  });
  await prisma.funcionario.create({
    data: {
      id: crypto.randomUUID(),
      id_empresa: empresaId,
      id_pdv: pdvCentroId,
      nome: "Joao Vendas",
      email: "colaborador1.demo@hypecrm.com",
      senha_hash: senhaEquipe,
      cargo: "COLABORADOR",
      ativo: true,
    },
  });
  await prisma.funcionario.create({
    data: {
      id: crypto.randomUUID(),
      id_empresa: empresaId,
      id_pdv: pdvZonaSulId,
      nome: "Ana Vendas",
      email: "colaborador2.demo@hypecrm.com",
      senha_hash: senhaEquipe,
      cargo: "COLABORADOR",
      ativo: true,
    },
  });

  console.log("Seed concluido com sucesso.");
  console.log("Empresa:", empresaEmail, "| senha: 123456");
  console.log("Gerente: gerente.demo@hypecrm.com | senha: 123456");
  console.log("Colaboradores: colaborador1.demo@hypecrm.com, colaborador2.demo@hypecrm.com | senha: 123456");
}

main()
  .catch((erro) => {
    console.error("Falha ao executar seed:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });