// Fumée : chargement de la page, erreurs de console, aperçu, captures d'écran (bureau et téléphone)
const { launch, BASE } = require('./env');
const OUT = process.argv[2] || 'out/smoke';
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const browser = await launch();
  const errors = [];
  for (const [name, vp] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(name + ' ' + m.type() + ': ' + m.text()); });
    page.on('pageerror', e => errors.push(name + ' PAGEERROR: ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
    await page.goto(BASE + 'index.html');
    await page.waitForSelector('#stage svg', { timeout: 20000 }).catch(() => errors.push(name + ': pas d’aperçu'));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: OUT + '/' + name + '.png', fullPage: name === 'mobile' });
    const info = await page.evaluate(() => ({
      styles: document.querySelectorAll('#grid .card[data-id]').length,
      models: document.querySelector('#modelCount').textContent,
      clipper: !!window.ClipperLib,
      meta: document.querySelector('#meta').textContent,
      thumbs: document.querySelectorAll('#shapeThumbs .sthumb svg').length,
      comp: document.querySelectorAll('#compThumbs .sthumb svg').length
    }));
    console.log(name, JSON.stringify(info));
    await ctx.close();
  }
  console.log(errors.length ? errors.join('\n') : 'aucune erreur');
  await browser.close();
  process.exitCode = errors.length ? 1 : 0;
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
