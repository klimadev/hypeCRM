const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando extensão de trial para todos os usuários...\n");

  const empresas = await prisma.empresa.findMany({
    select: {
      id: true,
      nome: true,
      email: true,
      status_assinatura: true,
      trial_fim: true,
    },
  });

  console.log(`Encontradas ${empresas.length} empresas no banco.\n`);

  let atualizados = 0;
  let erros = 0;

  for (const empresa of empresas) {
    try {
      const dataAtual = empresa.trial_fim ? new Date(empresa.trial_fim) : new Date();

      const novaData = new Date(dataAtual);
      novaData.setDate(novaData.getDate() + 90);

      await prisma.empresa.update({
        where: { id: empresa.id },
        data: {
          trial_fim: novaData,
          status_assinatura: "TRIAL",
        },
      });

      console.log(`✓ ${empresa.nome} (${empresa.email})`);
      console.log(`  Trial prorroga de ${dataAtual.toISOString().split("T")[0]} para ${novaData.toISOString().split("T")[0]}`);
      atualizados++;
    } catch (error) {
      console.error(`✗ Erro ao atualizar ${empresa.email}:`, error.message);
      erros++;
    }
  }

  console.log(`\n=== Resumo ===`);
  console.log(`Empresas atualizadas: ${atualizados}`);
  console.log(`Erros: ${erros}`);
  console.log(`Total processado: ${empresas.length}`);
}

main()
  .catch((erro) => {
    console.error("\nFalha ao executar script:", erro);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });