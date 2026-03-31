#!/usr/bin/env node
/**
 * Screenshot automática da seção de Pricing (10.preco.html)
 * 
 * Uso:
 *   node scripts/pricing-screenshots.js
 *   node scripts/pricing-screenshots.js --mobile
 *   node scripts/pricing-screenshots.js --url https://hypecrm.com.br/index.php
 * 
 * Saída: site/screenshots/pricing-*.png
 */

// Argumentos
const args = process.argv.slice(2);
const isMobile = args.includes('--mobile');
const urlIndex = args.indexOf('--url');
const TARGET_URL = urlIndex !== -1 ? args[urlIndex + 1] : 'https://hypecrm.com.br/index.php';

const VIEWPORT = isMobile
  ? { width: 390, height: 844 }
  : { width: 1440, height: 900 };

const PERIODS = ['mensal', 'semestral', 'anual'];
const SUFFIX = isMobile ? '-mobile' : '';

const log = (msg) => console.log(`  ${msg}`);
const ok = (msg) => console.log(`  ✓ ${msg}`);
const err = (msg) => console.error(`  ✗ ${msg}`);

async function main() {
  const [{ chromium }, fs, path] = await Promise.all([
    import('playwright'),
    import('node:fs'),
    import('node:path'),
  ]);
  const OUTPUT_DIR = path.join(__dirname, '..', 'site', 'screenshots');

  console.log(`\n📸 Pricing Screenshots${isMobile ? ' (MOBILE)' : ''}`);
  log(`URL: ${TARGET_URL}`);
  log(`Viewport: ${VIEWPORT.width}x${VIEWPORT.height}\n`);

  // Cria pasta de saída
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // retina quality
    locale: 'pt-BR',
  });

  const page = await context.newPage();

  try {
    // Navega
    log('Navegando...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 });
    ok('Página carregada');

    // Aguarda a seção de preço
    await page.waitForSelector('#preco', { timeout: 15000 });
    ok('Seção #preco encontrada');

    // Aguarda Lucide icons e Tailwind CDN renderizarem
    await page.waitForTimeout(1500);

    // 1. Screenshot da seção inteira (com o período padrão)
    log('Capturando seção completa...');
    const section = page.locator('#preco');
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);

    const sectionBox = await section.boundingBox();
    if (sectionBox) {
      const fullFile = path.join(OUTPUT_DIR, `pricing-full-section${SUFFIX}.png`);
      await page.screenshot({
        path: fullFile,
        clip: {
          x: Math.max(0, sectionBox.x),
          y: Math.max(0, sectionBox.y),
          width: sectionBox.width,
          height: sectionBox.height,
        },
        type: 'png',
      });
      ok(`pricing-full-section${SUFFIX}.png`);
    }

    // 2. Captura cada período
    for (const period of PERIODS) {
      log(`Clicando em período: ${period}...`);
      const btn = page.locator(`[data-period="${period}"]`);
      await btn.click();

      // Aguarda transição CSS
      await page.waitForTimeout(700);

      const file = path.join(OUTPUT_DIR, `pricing-${period}${SUFFIX}.png`);
      const sectionBox2 = await section.boundingBox();

      if (sectionBox2) {
        await page.screenshot({
          path: file,
          clip: {
            x: Math.max(0, sectionBox2.x),
            y: Math.max(0, sectionBox2.y),
            width: sectionBox2.width,
            height: sectionBox2.height,
          },
          type: 'png',
        });
        ok(`pricing-${period}${SUFFIX}.png`);
      }
    }

    console.log('\n✅ Concluído! Imagens salvas em:\n');
    log(OUTPUT_DIR + '\n');

  } catch (e) {
    err(`Falha: ${e.message}`);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

main();
