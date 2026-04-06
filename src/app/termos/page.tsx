export default function PaginaTermos() {
  return (
    <main className="relative min-h-screen bg-[var(--canvas)] px-4 py-10 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-40" />

      <section className="relative mx-auto max-w-3xl space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl">Termos de Uso</h1>
          <p className="text-sm text-[var(--text-secondary)]">Última atualização: Abril de 2026</p>
        </div>

        <div className="space-y-6 rounded-[16px] border border-[var(--border-subtle)] bg-[var(--surface)] p-6 md:p-8">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">1. Aceitação dos Termos</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Ao acessar e utilizar o HYPE CRM, você concorda com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não utilize a plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">2. Descrição do Serviço</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              O HYPE CRM é uma plataforma de gestão de relacionamento com clientes (CRM) voltada para a venda de seguros e produtos financeiros. O serviço inclui funcionalidades de gestão de leads, funil de vendas, comunicação via WhatsApp e Instagram, automações, relatórios e integrações com serviços de terceiros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">3. Contas e Acesso</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Para utilizar o HYPE CRM, é necessário criar uma conta vinculada a uma empresa. O responsável pela empresa (perfil EMPRESA) tem acesso administrativo completo, incluindo gestão de usuários, PDVs e integrações. Perfis de GERENTE e COLABORADOR possuem acessos restritos conforme definido pelo administrador.
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Você é responsável por manter a confidencialidade das credenciais de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">4. Uso Permitido</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Você concorda em utilizar o HYPE CRM apenas para fins legítimos e em conformidade com a legislação brasileira aplicável, incluindo a Lei Geral de Proteção de Dados (LGPD). É proibido:
            </p>
            <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-[var(--text-secondary)]">
              <li>Utilizar a plataforma para envio de spam ou mensagens não solicitadas</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Realizar engenharia reversa ou tentar acessar o código-fonte da plataforma</li>
              <li>Utilizar dados de clientes de forma inadequada ou não autorizada</li>
              <li>Compartilhar credenciais de acesso com pessoas não autorizadas</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">5. Integrações com Terceiros</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              O HYPE CRM integra-se com serviços de terceiros, incluindo WhatsApp, Instagram e Cal.com. O uso dessas integrações está sujeito aos termos de uso e políticas de privacidade de cada serviço. O HYPE CRM não se responsabiliza por alterações, interrupções ou limitações impostas por esses serviços.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">6. Propriedade Intelectual</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Todo o conteúdo, código, design, marcas e propriedade intelectual do HYPE CRM são de propriedade exclusiva de seus criadores. Os dados inseridos pelos clientes permanecem de propriedade dos respectivos clientes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">7. Limitação de Responsabilidade</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              O HYPE CRM é fornecido &quot;como está&quot;, sem garantias de qualquer tipo. Não nos responsabilizamos por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou da impossibilidade de uso da plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">8. Alterações nos Termos</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações significativas serão comunicadas aos usuários. O uso continuado da plataforma após alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">9. Contato</h2>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              Para dúvidas sobre estes Termos de Uso, entre em contato através dos canais disponíveis na plataforma.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
