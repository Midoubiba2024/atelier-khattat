// Niveaux du tashkīl dans l'atelier : chaque niveau dessine exactement le texte filtré par le moteur,
// le texte garde sa vocalisation, « Compléter le tashkīl » vocalise un texte « de presse », les anciens réglages sont repris
const { launch, BASE, out } = require('./env');
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text()); });
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) errors.push('FAIL ' + m); };
  const settle = ms => page.waitForTimeout(ms || 600);
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#stage svg', { timeout: 20000 });
  await settle(800);
  const paths = () => page.$eval('#stage svg', s => [...s.querySelectorAll('path')].map(p => p.getAttribute('d')).join('|'));
  const levels = await page.$$eval('#tkLevels .chip', b => b.map(x => x.dataset.v));
  ok(levels.length === 8, 'niveaux proposés : ' + levels.join(', '));

  // 1. chaque niveau dessine le texte filtré par le moteur (comparaison avec ce texte filtré tapé tel quel, niveau Complet)
  const T = 'إِنَّ مَعَ الْعُسْرِ يُسْرًا\nالْكِتَابُ مُفِيدٌ جِدًّا';
  const bad = [];
  for (const l of levels) {
    await page.fill('#txt', T); await settle(300);
    await page.click('#tkLevels .chip[data-v="' + l + '"]'); await settle();
    const a = await paths();
    const pressed = await page.$eval('#tkLevels .chip[data-v="' + l + '"]', b => b.getAttribute('aria-pressed') === 'true');
    const kept = (await page.$eval('#txt', t => t.value)) === T;
    const filtered = await page.evaluate(([t, lv]) => window.Khatt.tashkilLevel(t, lv), [T, l]);
    await page.click('#tkLevels .chip[data-v="full"]'); await settle(200);
    await page.fill('#txt', filtered); await settle();
    const b = await paths();
    if (a !== b || !pressed || !kept) bad.push(l + (a !== b ? ' (dessin différent)' : '') + (!pressed ? ' (bouton)' : '') + (!kept ? ' (texte modifié)' : ''));
  }
  ok(!bad.length, 'les 8 niveaux dessinent exactement le texte filtré, sans toucher au texte' + (bad.length ? ' — ' + bad.join(', ') : ''));
  await page.fill('#txt', T); await settle(300);
  await page.click('#tkLevels .chip[data-v="partial"]'); await settle();
  await page.screenshot({ path: out('niveaux') + '/partiel.png' });
  // le niveau suit l'annulation
  await page.click('#tkLevels .chip[data-v="ends"]'); await settle(700);
  await page.click('#undoBtn'); await settle(500);
  ok(await page.$eval('#tkLevels .chip[data-v="partial"]', b => b.getAttribute('aria-pressed') === 'true'), 'Annuler revient au niveau précédent');

  // 2. texte « de presse » (tanwīn seul) : partiel signalé, « Compléter le tashkīl » le vocalise d'après la bibliothèque
  await page.click('#tkLevels .chip[data-v="full"]'); await settle(200);
  await page.fill('#txt', 'أهلاً وسهلاً'); await settle(500);
  ok((await page.$eval('#tkToggle', b => !b.hidden && b.textContent)) === 'Compléter le tashkīl' && !!(await page.$('#tkLvNote .tk-warn')), 'tashkīl partiel signalé, bouton Compléter');
  await page.click('#tkToggle'); await settle(500);
  ok((await page.$eval('#txt', t => t.value)) === 'أَهْلًا وَسَهْلًا' && !(await page.$('#tkLvNote .tk-warn')), 'tashkīl complété : أَهْلًا وَسَهْلًا');

  // 3. sans tashkīl : un exemple montre le niveau, le texte reste tel quel
  await page.fill('#txt', 'قلم أزرق'); await settle(400);
  await page.click('#tkLevels .chip[data-v="shaddatanwin"]'); await settle(300);
  ok((await page.$eval('#tkLvNote .tk-sample', e => e.textContent)) === 'الكتاب مفيدٌ جدًّا' && (await page.$eval('#txt', t => t.value)) === 'قلم أزرق', 'sans tashkīl : exemple du niveau');

  // 4. réglage d'une version précédente (« Afficher les voyelles » décoché) : niveau Aucun ; création enregistrée avec un niveau : repris
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('khattat:v1')); delete s.tkLevel; s.harakat = false; s.text = 'كَتَبَ'; localStorage.setItem('khattat:v1', JSON.stringify(s)); });
  await page.reload(); await page.waitForSelector('#stage svg', { timeout: 20000 }); await settle(700);
  ok(await page.$eval('#tkLevels .chip[data-v="none"]', b => b.getAttribute('aria-pressed') === 'true'), 'ancien réglage sans voyelles : niveau Aucun');
  await page.click('#tkLevels .chip[data-v="body"]'); await settle(700);
  await page.reload(); await page.waitForSelector('#stage svg', { timeout: 20000 }); await settle(700);
  ok(await page.$eval('#tkLevels .chip[data-v="body"]', b => b.getAttribute('aria-pressed') === 'true'), 'niveau gardé d’une visite à l’autre');

  await browser.close();
  console.log(errors.length ? '\n' + errors.join('\n') : '\naucune erreur');
  process.exitCode = errors.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
