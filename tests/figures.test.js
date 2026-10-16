// Figures dans l'atelier : choix d'une figure dans « Remplir une forme », réglages propres aux figures,
// thème « Figures » de la galerie de modèles
const { launch, BASE, out } = require('./env');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const OUT = out('figures');
  const browser = await launch();
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 940 } })).newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#preview svg');
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('khattat:v1') || '{}'));
  const settle = ms => page.waitForTimeout(ms || 700);
  const rows = () => page.$$eval('#shapeParams .lbl', l => l.map(x => x.textContent));
  await page.fill('#txt', 'بسم الله مجراها ومرساها');
  await page.click('#tool-forme');
  await page.click('#shapeGroups button[data-v="compo"]');
  await page.click('#shapeThumbs .sthumb[data-v="fill"]');
  await settle();
  let r = await rows();
  ok(r.includes('Forme') && r.includes('Figure') && !r.includes('Sens') && !r.includes('Détails'), 'forme remplie : choix Forme et Figure, pas encore de sens ni de détails');
  // une figure : la bordure s'allume, le sens et les détails apparaissent
  await page.click('#shapeParams .seg button[data-v="boat"]');
  await settle(1200);
  let st = await state();
  r = await rows();
  ok(st.shape.fillShape === 'boat' && st.shape.ring === 'single', 'barque choisie, bordure allumée (' + st.shape.ring + ')');
  ok(r.includes('Sens') && r.includes('Détails'), 'réglages de la figure : sens et détails');
  ok(await page.$eval('#shapeParams .seg button[data-v="oval"]', b => b.getAttribute('aria-pressed')) === 'false', 'aucune forme géométrique sélectionnée');
  const svgLen = () => page.$eval('#stage svg', s => s.outerHTML.length);
  const l1 = await svgLen();
  await page.screenshot({ path: OUT + '/barque.png' });
  await page.click('#shapeParams .seg button[data-v="left"]');
  await page.click('#shapeParams .seg button[data-v="off"]');
  await settle(1200);
  st = await state();
  ok(st.shape.face === 'left' && st.shape.decor === 'off' && (await svgLen()) < l1, 'barque vers la gauche, sans mât ni vague');
  await page.screenshot({ path: OUT + '/barque-gauche.png' });
  // une figure symétrique n'a pas de sens ; une forme géométrique n'a pas de détails
  await page.click('#shapeParams .seg button[data-v="mosque"]');
  await settle();
  r = await rows();
  ok(!r.includes('Sens') && r.includes('Détails'), 'mosquée : pas de sens, des détails');
  await page.click('#shapeParams .seg button[data-v="oval"]');
  await settle();
  r = await rows();
  ok(!r.includes('Sens') && !r.includes('Détails') && (await state()).shape.fillShape === 'oval', 'retour à l’ovale');

  // galerie : thème « Figures », aperçus dessinés, modèle appliqué avec son exemple
  await page.click('#tool-modeles');
  await settle(800);
  await page.click('#mdFilters .chip[data-v="figures"]');
  await settle(800);
  const cards = await page.$$('#mgrid .mc[data-id]');
  for (const c of cards) { await c.scrollIntoViewIfNeeded(); await page.waitForTimeout(60); }
  await page.waitForFunction(n => document.querySelectorAll('#mgrid .mc[data-id] .mc-art svg').length >= n, cards.length, { timeout: 30000 }).catch(() => {});
  const drawn = await page.$$eval('#mgrid .mc[data-id] .mc-art svg', s => s.length);
  ok(cards.length === 14 && drawn === cards.length, 'thème Figures : ' + cards.length + ' modèles, ' + drawn + ' aperçus');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: OUT + '/galerie.png' });
  await page.evaluate(() => { const c = Array.from(document.querySelectorAll('#mgrid .mc')).find(c => c._m && c._m.id === 'fig-papillon'); c.querySelector('[data-a=ex]').click(); });
  await settle(2500);
  st = await state();
  ok(st.shape.fillShape === 'butterfly' && st.fontId === 'layla-diwani' && st.text.startsWith('سُبْحَانَ'), 'papillon appliqué avec son exemple');
  await page.screenshot({ path: OUT + '/papillon.png' });
  // un état sauvegardé avec une figure inconnue revient à l'ovale
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('khattat:v1')); s.shape.fillShape = 'dragon'; s.shape.face = 'haut'; localStorage.setItem('khattat:v1', JSON.stringify(s)); });
  await page.reload();
  await page.waitForSelector('#preview svg');
  await page.click('#tool-forme');
  await settle();
  r = await rows();
  ok(await page.$eval('#shapeParams .seg button[data-v="oval"]', b => b.getAttribute('aria-pressed')) === 'true' && !r.includes('Sens'), 'figure inconnue : retour à l’ovale');
  ok(!errs.length, 'aucune erreur : ' + (errs.join(' | ') || 'aucune'));
  await browser.close();
  console.log(fails ? '\n' + fails + ' échec(s)' : '\nfigures (atelier) : tout est bon');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('FAIL', e); process.exit(1); });
