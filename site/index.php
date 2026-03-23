<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HYPE CRM | Organize seu atendimento no WhatsApp</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: #09090b; /* zinc-950 */
            color: #d4d4d8; /* zinc-300 */
        }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #09090b; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }

        /* Animations */
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
        }
        @keyframes float-reverse {
            0% { transform: translateY(0px); }
            50% { transform: translateY(6px); }
            100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: float-reverse 7s ease-in-out infinite; }
        
        @keyframes pulse-soft {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
        }
        .animate-pulse-soft { animation: pulse-soft 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

        .glass-panel {
            background: rgba(9, 9, 11, 0.7);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }

        .text-gradient {
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Cascata editorial para depoimentos (v2) */
        .depoimentos-cascata-v2 {
            display: grid;
            grid-template-columns: 1fr;
            gap: 1rem;
        }
        @media (min-width: 1024px) {
            .depoimentos-cascata-v2 {
                grid-template-columns: repeat(12, minmax(0, 1fr));
                gap: 1.25rem;
            }
        }
        .faixa-cascata {
            position: relative;
            height: 40rem;
            overflow: hidden;
            border: 1px solid rgba(63, 63, 70, 0.8);
            border-radius: 1.75rem;
            background: linear-gradient(180deg, rgba(9, 9, 11, 0.88) 0%, rgba(12, 12, 14, 0.68) 100%);
            mask-image: linear-gradient(to bottom, transparent 0%, black 9%, black 91%, transparent 100%);
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 9%, black 91%, transparent 100%);
        }
        .faixa-cascata--a { transform: perspective(900px) rotateX(2deg) rotateZ(-0.8deg); }
        .faixa-cascata--b { transform: perspective(900px) rotateX(2deg) rotateZ(0.8deg); }
        .faixa-cascata--c { transform: perspective(900px) rotateX(2deg) rotateZ(-0.4deg); }
        @media (max-width: 1023px) {
            .faixa-cascata--a,
            .faixa-cascata--b,
            .faixa-cascata--c {
                transform: none;
            }
        }
        .trilho-cascata-v2 {
            display: flex;
            flex-direction: column;
            gap: 0.95rem;
            position: absolute;
            inset: 0;
            padding: 0.85rem;
        }
        .trilho-cascata-v2--subir {
            animation: cascata-v2-subir 28s linear infinite;
        }
        .trilho-cascata-v2--descer {
            animation: cascata-v2-descer 24s linear infinite;
        }
        .trilho-cascata-v2--subir-lento {
            animation: cascata-v2-subir 34s linear infinite;
        }
        .faixa-cascata:hover .trilho-cascata-v2 {
            animation-play-state: paused;
        }
        @keyframes cascata-v2-subir {
            0% { transform: translateY(0); }
            100% { transform: translateY(-52%); }
        }
        @keyframes cascata-v2-descer {
            0% { transform: translateY(-52%); }
            100% { transform: translateY(0); }
        }

        /* Subtle noise texture for specific sections */
        .bg-noise {
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.015;
            pointer-events: none;
        }
    </style>
</head>
<body class="antialiased overflow-x-hidden selection:bg-violet-500/30 selection:text-white">

    <?php
    $modulos = [
        '0.navbar.html',
        '1.hero.html',
        '2.dor.html',
        '3.solucao.html',
        '4.como-funciona.html',
        '5.beneficios.html',
        '6.funcionalidades.html',
        '7.diferenciais.html',
        '8.casos-de-uso.html',
        '9.prova-social.html',
        '10.preco.html',
        '11.faq.html',
        '12.footer.html',
    ];

    foreach ($modulos as $modulo) {
        $caminho = __DIR__ . '/modules/' . $modulo;
        if (is_file($caminho)) {
            echo file_get_contents($caminho);
        }
    }
    ?>

    <script>
        lucide.createIcons();

        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 20) {
                nav.classList.add('bg-[#09090b]/80', 'shadow-lg', 'border-white/5');
                nav.classList.remove('border-transparent');
            } else {
                nav.classList.remove('bg-[#09090b]/80', 'shadow-lg', 'border-white/5');
                nav.classList.add('border-transparent');
            }
        });
    </script>
</body>
</html>
