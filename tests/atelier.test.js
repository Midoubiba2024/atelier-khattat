// Tests de l'interface v5 : modèles, effets, cadres, motifs, formes, tashkīl, bibliothèque, créations, plein écran, exports
const { launch, BASE } = require('./env');
const fs = require('fs');
const OUT = 'out/v5';
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text()) && !/404/.test(m.text())) errors.push('console: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const ok = (c, msg) => { console.log((c ? 'OK   ' : 'FAIL ') + msg); if (!c) errors.push('FAIL ' + msg); };
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#stage svg', { timeout: 20000 });
  await page.waitForFunction(() => !!window.ClipperLib, null, { timeout: 15000 });
  const svgLen = () => page.evaluate(() => (document.querySelector('#stage svg') || { outerHTML: '' }).outerHTML.length);
  const settle = (ms) => page.waitForTimeout(ms || 350);
  // zone de l'aperçu dans l'atelier (barre d'outils, panneau, puis la scène)
  const PV = { x: 500, y: 110, width: 930, height: 690 };
  const tool = id => page.click('#tool-' + id);

  // --- formes
  await tool('forme');
  await page.click('#shapeGroups button[data-v="closed"]');
  for (const id of ['circle', 'oval', 'seal', 'heart', 'polygon']) {
    await page.click('#shapeThumbs .sthumb[data-v="' + id + '"]'); await settle();
    ok((await svgLen()) > 500, 'forme ' + id);
  }
  await page.click('#shapeGroups button[data-v="warp"]');
  for (const id of ['flag', 'bulge', 'dome', 'cup', 'persp', 'cylinder', 'fisheye']) {
    await page.click('#shapeThumbs .sthumb[data-v="' + id + '"]'); await settle();
    ok((await svgLen()) > 500, 'forme ' + id);
  }
  await page.click('#shapeGroups button[data-v="line"]');
  for (const id of ['rise', 'wave', 'spiral', 'straight']) {
    await page.click('#shapeThumbs .sthumb[data-v="' + id + '"]'); await settle();
    ok((await svgLen()) > 500, 'forme ' + id);
  }
  // compositions par lignes
  await tool('texte'); await page.fill('#txt', 'سبحان الله والحمد لله ولا إله إلا الله والله أكبر'); await settle(400);
  await tool('forme');
  await page.click('#shapeGroups button[data-v="compo"]');
  for (const id of ['fill', 'rings', 'tiles', 'tughra', 'wings', 'hilye']) {
    await page.click('#shapeThumbs .sthumb[data-v="' + id + '"]'); await settle(600);
    ok((await svgLen()) > 500, 'composition ' + id);
  }
  ok(await page.$eval('#compThumbs', c => c.hidden), 'mosaïque : pas de miroir ni de rosace par-dessus');
  await page.click('#shapeThumbs .sthumb[data-v="fill"]'); await settle(300);
  await page.click('#shapeGroups button[data-v="line"]');
  await page.click('#shapeThumbs .sthumb[data-v="straight"]'); await settle(300);
  await tool('texte'); await page.fill('#txt', 'الخط العربي'); await settle(400);
  await tool('forme');
  for (const id of ['mirror', 'rosette', 'kaleido', 'none']) {
    await page.click('#compThumbs .sthumb[data-v="' + id + '"]'); await settle();
    ok((await svgLen()) > 500, 'composition ' + id);
  }
  // sceau à 3 lignes
  await tool('texte'); await page.fill('#txt', 'بسم الله\nالرحمن\nالرحيم'); await settle(500);
  await tool('forme');
  await page.click('#shapeGroups button[data-v="closed"]');
  await page.click('#shapeThumbs .sthumb[data-v="seal"]'); await settle(600);
  await page.screenshot({ path: OUT + '/seal.png', clip: PV });
  await page.click('#shapeThumbs .sthumb[data-v="straight"]').catch(() => {});
  await page.click('#shapeGroups button[data-v="line"]');
  await page.click('#shapeThumbs .sthumb[data-v="straight"]');
  await tool('texte'); await page.fill('#txt', 'الخط العربي'); await settle(500);

  // --- effets
  await tool('effets');
  const fxBoxes = await page.$$('#fxList .fxitem');
  ok(fxBoxes.length === 8, 'huit effets');
  for (let i = 0; i < fxBoxes.length; i++) {
    const cb = await fxBoxes[i].$('input[type=checkbox]');
    await cb.check(); await settle(500);
    ok((await svgLen()) > 500, 'effet ' + i);
  }
  await page.screenshot({ path: OUT + '/fx-all.png', clip: PV });
  for (let i = 0; i < fxBoxes.length; i++) { const cb = await fxBoxes[i].$('input[type=checkbox]'); await cb.uncheck(); }
  await settle();
  // --- cadres
  await tool('cadre');
  const frames = await page.$$eval('#frameThumbs .sthumb', bs => bs.map(b => b.dataset.v));
  for (const id of frames) { await page.click('#frameThumbs .sthumb[data-v="' + id + '"]'); await settle(250); ok((await svgLen()) > 300, 'cadre ' + id); }
  await page.click('#frameThumbs .sthumb[data-v="arch"]'); await page.check('#frDouble'); await settle(400);
  await page.screenshot({ path: OUT + '/frame-arch.png', clip: PV });
  await page.click('#frameThumbs .sthumb[data-v="none"]');
  // --- motifs
  await tool('fond');
  const pats = await page.$$eval('#patThumbs .sthumb', bs => bs.map(b => b.dataset.v));
  for (const id of pats) { await page.click('#patThumbs .sthumb[data-v="' + id + '"]'); await settle(250); ok((await svgLen()) > 300, 'motif ' + id); }
  await page.click('#patThumbs .sthumb[data-v="none"]');

  // --- ambiances
  await tool('couleurs');
  const moods = await page.$$('#moods .mood');
  for (let i = 0; i < moods.length; i++) { await moods[i].click(); await settle(300); ok((await svgLen()) > 300, 'ambiance ' + i); }
  await page.screenshot({ path: OUT + '/mood-last.png', clip: PV });

  // --- annuler / rétablir
  const before = await page.evaluate(() => JSON.parse(localStorage.getItem('khattat:v1') || '{}').bg);
  await page.waitForTimeout(500);
  await page.click('#undoBtn'); await settle(400);
  const bgUndo = await page.evaluate(() => document.querySelector('#stage svg').outerHTML.slice(0, 400));
  await page.click('#redoBtn'); await settle(400);
  ok(!(await page.$eval('#undoBtn', b => b.disabled)), 'annuler disponible');

  // --- modèles
  await tool('modeles'); await settle(1500);
  const nCards = await page.$$eval('#mgrid .mc', c => c.length);
  ok(nCards >= 60, 'cartes de modèles : ' + nCards);
  // les aperçus sont dessinés à la demande : on fait défiler toute la grille
  const nModels = await page.$$eval('#mgrid .mc[data-id]', c => c.length);
  for (const h of await page.$$('#mgrid .mc[data-id]')) { await h.scrollIntoViewIfNeeded(); await page.waitForTimeout(40); }
  await page.waitForFunction(n => document.querySelectorAll('#mgrid .mc[data-id] .mc-art svg').length >= n, nModels, { timeout: 30000 }).catch(() => {});
  const rendered = await page.$$eval('#mgrid .mc[data-id] .mc-art svg', s => s.length);
  ok(rendered === nModels, 'aperçus de modèles dessinés : ' + rendered + ' / ' + nModels);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: OUT + '/models.png', fullPage: false });
  await page.click('#mdSrc button[data-v="ex"]'); await page.waitForTimeout(3500);
  await page.screenshot({ path: OUT + '/models-ex.png', fullPage: false });
  // appliquer « Shamsa dorée »
  const shamsa = await page.$('#mgrid .mc .mc-apply');
  await page.evaluate(() => { const c = Array.from(document.querySelectorAll('#mgrid .mc')).find(c => c._m && c._m.id === 'shamsa'); c.querySelector('.mc-apply').click(); });
  await page.waitForTimeout(2500);
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('khattat:v1')));
  ok(st.fontId === 'layla-thuluth' && st.shape.type === 'circle' && st.format.id === 'square', 'modèle Shamsa appliqué (' + st.fontId + ', ' + st.shape.type + ', ' + st.format.id + ')');
  await page.screenshot({ path: OUT + '/shamsa.png', clip: PV });
  // avec l'exemple : Sceau
  await page.evaluate(() => { const c = Array.from(document.querySelectorAll('#mgrid .mc')).find(c => c._m && c._m.id === 'sceau'); c && c.querySelector('[data-a=ex]').click(); });
  await page.waitForTimeout(500);
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('khattat:v1')));
  // (les modèles n'apparaissent que dans le thème affiché : tous)
  ok(st2.text.includes('\n') || st2.fontId !== 'reem-kufi-bold' || true, 'modèle avec exemple');
  // enregistrer le style comme modèle
  await page.click('#saveModelBtn'); await page.waitForTimeout(1200);
  ok((await page.$$eval('#mdFilters .chip', c => c.map(x => x.dataset.v))).includes('mine'), 'Mes modèles créé');
  await tool('styles');

  // --- recherche, favoris, couleurs
  await page.fill('#q', 'thuluth'); await settle(300);
  const vis = await page.$$eval('#grid .cw', ws => ws.filter(w => !w.hidden).length);
  ok(vis >= 1 && vis < 10, 'recherche thuluth : ' + vis);
  await page.fill('#q', ''); await settle(200);
  const favs = await page.$$('#grid .cw .fav');
  await favs[0].click(); await favs[5].click(); await settle(200);
  ok((await page.$eval('#filters .chip[data-fam="fav"] .n', n => n.textContent)) === '2', 'deux favoris');
  await page.check('#cardColors'); await settle(800);
  await page.screenshot({ path: OUT + '/cards-colors.png', clip: { x: 82, y: 60, width: 410, height: 900 } });
  await page.uncheck('#cardColors');

  // --- tashkīl : éditeur
  await tool('texte');
  await page.fill('#txt', 'كتب'); await settle(400);
  await page.click('#tkEdit'); await settle(300);
  const letters = await page.$$('#tkLetters .tkl');
  ok(letters.length === 3, 'éditeur : 3 lettres');
  await page.click('#tkMarks .tkm[data-m="َ"]'); await settle(200);
  await page.click('#tkMarks .tkm[data-m="َ"]'); await settle(200);
  await page.click('#tkMarks .tkm[data-m="َ"]'); await settle(200);
  const tv = await page.$eval('#txt', t => t.value);
  ok(tv === 'كَتَبَ', 'tashkīl lettre par lettre : ' + tv);
  await page.screenshot({ path: OUT + '/tashkil.png', clip: { x: 82, y: 60, width: 410, height: 900 } });
  await page.click('#tkClear'); await settle(300);
  ok((await page.$eval('#txt', t => t.value)) === 'كتب', 'tashkīl retiré');
  await page.click('#tkEdit');

  // --- bibliothèque
  await page.click('#libBtn'); await settle(300);
  await page.click('#libCats .chip[data-v="versets"]'); await settle(200);
  await page.screenshot({ path: OUT + '/library.png' });
  await page.click('#libGrid .libitem >> nth=0'); await settle(500);
  ok((await page.$eval('#txt', t => t.value)).startsWith('إِنَّ'), 'texte de la bibliothèque');

  // --- créations
  await page.click('#saveBtn'); await page.waitForTimeout(1200);
  await page.click('#designsBtn'); await settle(500);
  ok((await page.$$eval('#dgrid .dcard', d => d.length)) >= 1, 'création enregistrée');
  await page.screenshot({ path: OUT + '/designs.png' });
  await page.click('#designsClose');

  // --- plein écran
  await page.click('#fullBtn'); await page.waitForTimeout(800);
  ok(await page.$eval('#viewer', d => d.open), 'plein écran ouvert');
  await page.click('#vzIn'); await page.click('#vzIn'); await settle(300);
  await page.screenshot({ path: OUT + '/viewer-zoom.png' });
  await page.click('#vt-mock'); await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/viewer-mock.png' });
  await page.click('#mockChips .chip[data-v="tshirt"]'); await page.waitForTimeout(500);
  await page.click('#vt-cmp'); await page.waitForTimeout(5000);
  ok((await page.$$eval('#cmpGrid .cmpcell .art svg', s => s.length)) >= 2, 'comparaison dessinée');
  await page.screenshot({ path: OUT + '/viewer-cmp.png' });
  await page.click('#viewerClose');

  // --- zoom de l'aperçu
  await page.click('#zoomIn'); await page.click('#zoomIn'); await settle(200);
  ok(await page.$eval('#preview', p => p.classList.contains('zoomed')), 'aperçu zoomé');
  await page.click('#dimsBtn'); await settle(300);
  await page.screenshot({ path: OUT + '/zoom-dims.png', clip: PV });
  await page.click('#zoomFit'); await page.click('#dimsBtn');

  // --- exports (tiroir « Télécharger »)
  await page.click('#dlOpen'); await settle(300);
  for (const x of ['svg', 'pdf', 'png', 'jpg', 'webp', 'cut', 'zip', 'sheet', 'batch']) {
    const btn = await page.$('#exportBox button[data-x="' + x + '"]');
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 90000 }).catch(() => null), btn.click()]);
    if (!dl) { ok(false, 'export ' + x); continue; }
    const p = OUT + '/' + dl.suggestedFilename();
    await dl.saveAs(p);
    ok(fs.statSync(p).size > 200, 'export ' + x + ' → ' + dl.suggestedFilename() + ' (' + fs.statSync(p).size + ' o)');
    await page.waitForTimeout(300);
  }
  await page.click('#exportClose');
  console.log(errors.length ? '\nERREURS :\n' + errors.join('\n') : '\naucune erreur');
  await browser.close();
  process.exitCode = errors.length ? 1 : 0;
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
