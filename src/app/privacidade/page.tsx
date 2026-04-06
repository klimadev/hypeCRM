export default function PaginaPrivacidade() {
  return (
    <main className="relative min-h-screen bg-[var(--canvas)] px-4 py-10 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" />

      <section className="relative mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl">Política de Privacidade</h1>
          <p className="text-sm text-[var(--text-secondary)]">Última atualização: Abril de 2026</p>
        </div>

        <div className="space-y-6 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">1. Introdução</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              O HYPE CRM está comprometido com a proteção da sua privacidade e com o tratamento adequado dos dados pessoais coletados. Esta política descreve como coletamos, usamos, armazenamos e protegemos seus dados, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">2. Dados Coletados</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Coletamos e processamos os seguintes tipos de dados:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li><strong className="text-[var(--text-primary)]">Dados de cadastro:</strong> nome, e-mail, telefone e informações da empresa</li>
              <li><strong className="text-[var(--text-primary)]">Dados de leads e clientes:</strong> nome, telefone, e-mail, estágio no funil, histórico de interações</li>
              <li><strong className="text-[var(--text-primary)]">Dados de comunicação:</strong> mensagens trocadas via WhatsApp e Instagram</li>
              <li><strong className="text-[var(--text-primary)]">Dados de uso:</strong> logs de acesso, ações realizadas na plataforma, timestamps</li>
              <li><strong className="text-[var(--text-primary)]">Dados de autenticação:</strong> tokens de sessão, cookies de autenticação</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">3. Finalidade do Tratamento</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Os dados são tratados para as seguintes finalidades:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li>Provisionamento e operação da plataforma CRM</li>
              <li>Gestão de leads, negócios e funil de vendas</li>
              <li>Comunicação com leads via WhatsApp e Instagram</li>
              <li>Automações de follow-up e agendamentos</li>
              <li>Geração de relatórios e métricas de desempenho</li>
              <li>Segurança, prevenção de fraudes e conformidade legal</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">4. Base Legal</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              O tratamento de dados pessoais no HYPE CRM é realizado com base nas seguintes bases legais da LGPD:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li><strong className="text-[var(--text-primary)]">Execução de contrato:</strong> tratamento necessário para a prestação do serviço contratado</li>
              <li><strong className="text-[var(--text-primary)]">Legítimo interesse:</strong> para melhoria da plataforma e experiência do usuário</li>
              <li><strong className="text-[var(--text-primary)]">Consentimento:</strong> quando aplicável, para finalidades específicas</li>
              <li><strong className="text-[var(--text-primary)]">Obrigação legal:</strong> quando exigido por legislação aplicável</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">5. Compartilhamento de Dados</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              O HYPE CRM pode compartilhar dados com os seguintes serviços de terceiros, estritamente para operação da plataforma:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li><strong className="text-[var(--text-primary)]">WhatsApp:</strong> para envio e recebimento de mensagens</li>
              <li><strong className="text-[var(--text-primary)]">Instagram:</strong> para integração com mensagens e dados de conta</li>
              <li><strong className="text-[var(--text-primary)]">Cal.com:</strong> para agendamento de compromissos</li>
            </ul>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Não vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins de marketing sem consentimento prévio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">6. Armazenamento e Segurança</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Os dados são armazenados em servidores seguros com acesso restrito. Utilizamos medidas técnicas e organizacionais adequadas para proteger os dados pessoais contra acesso não autorizado, perda, alteração ou divulgação. As senhas são armazenadas com hash criptográfico (bcrypt). Tokens de sessão possuem expiração configurada.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">7. Retenção de Dados</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Os dados são mantidos enquanto a conta estiver ativa e pelo período necessário para cumprimento de obrigações legais. Ao solicitar o encerramento da conta, os dados serão excluídos ou anonimizados, salvo quando a retenção for exigida por lei.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">8. Direitos do Titular</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Em conformidade com a LGPD, você tem direito a:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li>Confirmação da existência de tratamento de dados</li>
              <li>Acesso aos seus dados pessoais</li>
              <li>Correção de dados incompletos, inexatos ou desatualizados</li>
              <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
              <li>Portabilidade dos dados a outro fornecedor de serviço</li>
              <li>Revogação do consentimento, quando aplicável</li>
            </ul>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Para exercer seus direitos, entre em contato através dos canais disponíveis na plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">9. Cookies</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              O HYPE CRM utiliza cookies essenciais para autenticação e funcionamento da plataforma. Cookies de sessão são utilizados para manter o usuário autenticado e são removidos automaticamente ao fazer logout ou expirar a sessão.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">10. Alterações nesta Política</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Esta Política de Privacidade pode ser atualizada periodicamente. Alterações significativas serão comunicadas aos usuários. Recomendamos a revisão periódica desta página.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">11. Contato</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Para questões relacionadas a esta Política de Privacidade ou ao tratamento de dados pessoais, entre em contato através dos canais disponíveis na plataforma.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
