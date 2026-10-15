// Téléphones et tablettes : mise en page empilée (portrait) ou large (paysage, grande tablette), aucun débordement,
// tous les outils visibles, aperçu et réglages assez grands, aperçu qui se réduit quand on descend dans les réglages
const { launch, BASE, out } = require('./env');
const SCREENS = [
  // nom, largeur, hauteur, mise en page attendue
  ['téléphone 360', 360, 780, 'stack'],
  ['téléphone 390', 390, 844, 'stack'],
  ['téléphone en paysage', 844, 390, 'wide'],
  ['tablette portrait', 768, 1024, 'stack'],
  ['tablette paysage', 1024, 768, 'wide'],
  ['grande tablette portrait', 1024, 1366, 'wide']
];
(async () => {
  const browser = await launch();
  const errors = [];
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) errors.push('FAIL ' + m); };
  const dir = out('ecrans');
  for (const [name, w, h, mode] of SCREENS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(name + ' pageerror: ' + e.message));
    await page.goto(BASE + 'index.html');
    await page.waitForSelector('#stage svg', { timeout: 20000 });
    await page.waitForTimeout(600);
    const g = await page.evaluate(() => {
      const box = s => { const b = document.querySelector(s).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
      const tools = [...document.querySelectorAll('#rail .rt')].map(t => t.getBoundingClientRect());
      return {
        sw: document.documentElement.scrollWidth, vw: innerWidth, vh: innerHeight,
        pv: box('#preview'), pn: box('#panels'),
        toolsIn: tools.every(b => b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1 && b.width > 20),
        cut: [...document.querySelectorAll('#rail .rt > span:not(.dot-on)')].filter(s => getComputedStyle(s).display !== 'none' && s.scrollWidth > s.clientWidth + 1).length
      };
    });
    ok(g.sw <= g.vw, name + ' : pas de défilement horizontal');
    ok(g.toolsIn && !g.cut, name + ' : les 9 outils sont visibles, libellés entiers');
    const stacked = g.pn.y >= g.pv.b - 1;
    ok(mode === 'stack' ? stacked : g.pn.x < g.pv.x, name + ' : mise en page ' + (mode === 'stack' ? 'empilée' : 'côte à côte'));
    ok(g.pv.h >= 140 && g.pn.h >= 240, name + ' : aperçu ' + Math.round(g.pv.h) + ' px, réglages ' + Math.round(g.pn.h) + ' px');
    if (mode === 'stack') {
      // descendre dans les styles réduit l'aperçu ; remonter le rend
      await page.click('#tool-styles'); await page.waitForTimeout(300);
      await page.evaluate(() => { const p = document.querySelector('#panels'); p.scrollTop = 300; p.dispatchEvent(new Event('scroll')); });
      await page.waitForTimeout(450);
      const small = await page.$eval('#preview', e => e.getBoundingClientRect().height);
      await page.evaluate(() => { const p = document.querySelector('#panels'); p.scrollTop = 0; p.dispatchEvent(new Event('scroll')); });
      await page.waitForTimeout(450);
      const big = await page.$eval('#preview', e => e.getBoundingClientRect().height);
      ok(small < g.pv.h - 40 && Math.abs(big - g.pv.h) < 2, name + ' : aperçu réduit en descendant (' + Math.round(small) + ' px), rétabli en haut');
    }
    // espaces : menu déroulant sur téléphone, onglets ailleurs
    const sel = await page.$eval('#spaceSel', e => getComputedStyle(e).display !== 'none');
    if (sel) await page.selectOption('#spaceSel', 'learn'); else await page.click('#spLearn');
    await page.waitForTimeout(400);
    ok(await page.$eval('#learn', e => !e.hidden && e.getBoundingClientRect().height > 200), name + ' : espace Apprendre (' + (sel ? 'menu' : 'onglets') + ')');
    await page.screenshot({ path: dir + '/' + name.replace(/\s+/g, '-') + '.png' });
    await ctx.close();
  }
  await browser.close();
  console.log(errors.length ? '\n' + errors.join('\n') : '\naucune erreur');
  process.exitCode = errors.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
