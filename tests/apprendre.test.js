// Section « Apprendre » : tableau des lettres, étude d'une lettre, tracé, écritures, gabarits, feuille d'exercice
const { launch, BASE } = require('./env');
const fs = require('fs');
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text()); });
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) errors.push('FAIL ' + m); };
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#stage svg', { timeout: 20000 });
  await page.click('#spLearn');
  ok(await page.$eval('#studio', s => s.hidden) && !(await page.$eval('#learn', s => s.hidden)), 'espace Apprendre ouvert, atelier masqué');
  await page.waitForFunction(() => document.querySelectorAll('#lnTable .ln-cell svg').length >= 120, null, { timeout: 40000 }).catch(() => {});
  const cells = await page.$$eval('#lnTable .ln-cell', c => [c.length, c.filter(x => x.querySelector('svg')).length]);
  ok(cells[0] === 19 * 7 && cells[1] >= 125, 'tableau : ' + cells[1] + ' lettres dessinées sur ' + cells[0]);
  await page.click('#lnTable .ln-cell[data-l="ع"][data-s="thuluth"]');
  await page.waitForFunction(() => document.querySelectorAll('#lnForms .ln-form svg').length === 4, null, { timeout: 15000 }).catch(() => {});
  ok((await page.$$eval('#lnForms .ln-form svg', s => s.length)) === 4, 'ʿayn en thuluth : quatre formes');
  ok(/points/.test(await page.textContent('#lnFacts')) && !!(await page.$('#lnMeasure svg circle')), 'fiche et mesure en points (cercle d’Ibn Muqla)');
  await page.click('#lnLetters .ln-l[data-v="د"]');
  await page.waitForTimeout(800);
  ok((await page.$$eval('#lnForms .ln-form svg', s => s.length)) === 2, 'dāl : deux formes seulement');
  // tracé
  const cv = await page.$('#lnCanvas'); await cv.scrollIntoViewIfNeeded(); const bx = await cv.boundingBox();
  await page.mouse.move(bx.x + bx.width * 0.55, bx.y + bx.height * 0.4); await page.mouse.down();
  for (let i = 0; i <= 20; i++) await page.mouse.move(bx.x + bx.width * (0.55 - 0.1 * i / 20), bx.y + bx.height * (0.4 + 0.3 * i / 20));
  await page.mouse.up(); await page.waitForTimeout(300);
  ok(/Modèle couvert/.test(await page.textContent('#lnScore')), 'tracé noté : ' + (await page.textContent('#lnScore')).slice(0, 60));
  // écritures
  await page.click('#lt-ecritures');
  await page.waitForFunction(() => document.querySelectorAll('#lnScriptCards .ln-sc-art svg').length === 7, null, { timeout: 30000 }).catch(() => {});
  ok((await page.$$eval('#lnScriptCards .ln-sc-art svg', s => s.length)) === 7, 'sept écritures présentées');
  // gabarit : remplir un œuf avec la phrase
  await page.click('#lt-composer');
  await page.click('#lnGeo button[data-fill="egg"]');
  await page.waitForTimeout(800);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('khattat:v1')).shape);
  ok(!(await page.$eval('#studio', s => s.hidden)) && st.type === 'fill' && st.fillShape === 'egg', 'gabarit appliqué : retour à l’atelier, forme remplie en œuf');
  // feuille d'exercice
  await page.click('#spLearn');
  await page.click('#lt-exercice');
  await page.waitForSelector('#lnExPrev svg', { timeout: 15000 });
  ok(/calame/.test(await page.textContent('#lnExInfo')), 'feuille : ' + (await page.textContent('#lnExInfo')).slice(0, 70));
  fs.mkdirSync('out/dl', { recursive: true });
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }).catch(() => null), page.click('#lnExPdf')]);
  if (dl) { const p = 'out/dl/' + dl.suggestedFilename(); await dl.saveAs(p); const b = fs.readFileSync(p); ok(b.length > 3000 && b.slice(0, 5).toString() === '%PDF-', 'feuille PDF : ' + dl.suggestedFilename() + ' (' + b.length + ' o)'); }
  else ok(false, 'feuille PDF téléchargée');
  console.log(errors.length ? '\nERREURS :\n' + errors.join('\n') : '\naucune erreur');
  await browser.close();
  process.exitCode = errors.length ? 1 : 0;
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
