// Nouveautés : ajustement au format après un changement de forme, dézoom sur un débordement, légende latine,
// variations, repères, vignette de navigation, lien de partage
const { launch, BASE } = require('./env');
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text()); });
  const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) errors.push('FAIL ' + m); };
  const settle = (ms) => page.waitForTimeout(ms || 700);
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#stage svg', { timeout: 20000 });

  // 1. format paysage, puis panneau hilye : la taille s'ajuste toute seule, rien ne dépasse
  await page.click('#tool-texte');
  await page.fill('#txt', 'بسم الله الرحمن الرحيم\nوإنك لعلى خلق عظيم\nأبو بكر\nعمر\nعثمان\nعلي\nوما أرسلناك إلا رحمة للعالمين\nصلى الله عليه وسلم');
  await settle(500);
  await page.click('#tool-format'); await page.click('#formats .fmt[data-v="landscape"]'); await settle();
  await page.click('#tool-forme'); await page.click('#shapeGroups button[data-v="compo"]');
  await page.click('#shapeThumbs .sthumb[data-v="hilye"]'); await settle(2000);
  ok(await page.$eval('#overflow', e => e.hidden), 'hilye en paysage : ajusté au format, aucun débordement');
  // 2. agrandi à la main : le débordement reste visible en dézoomant, sous un voile
  await page.click('#tool-texte'); await page.fill('#sizeNum', '260'); await page.press('#sizeNum', 'Enter'); await settle(1200);
  ok(!(await page.$eval('#overflow', e => e.hidden)), 'agrandi : alerte de débordement');
  const z0 = parseInt(await page.$eval('#zoomVal', e => e.textContent), 10);
  for (let i = 0; i < 5; i++) { if (await page.$eval('#zoomOut', e => !e.disabled)) { await page.click('#zoomOut'); await settle(250); } }
  const z1 = parseInt(await page.$eval('#zoomVal', e => e.textContent), 10);
  ok(z1 < z0 && await page.$eval('#zoomOut', e => e.disabled), 'dézoom au-delà de la page (' + z0 + ' % → ' + z1 + ' %), bouton − grisé au minimum');
  ok(!!(await page.$('#stage svg [data-layer="hors-format"]')), 'partie hors format voilée');
  await page.click('#fitBtn2'); await settle(1200);
  ok(await page.$eval('#overflow', e => e.hidden), '« Ajuster la taille » : tout rentre');
  await page.click('#tool-forme'); await page.click('#shapeGroups button[data-v="line"]'); await page.click('#shapeThumbs .sthumb[data-v="straight"]'); await settle();
  await page.click('#tool-format'); await page.click('#formats .fmt[data-v="auto"]'); await settle();

  // 3. légende latine : un prénom de la bibliothèque remplit la légende
  await page.click('#tool-texte');
  await page.click('#libBtn'); await settle(300);
  await page.click('#libCats .chip[data-v="filles"]'); await settle(200);
  await page.click('#libGrid .libitem:has-text("Yasmine")'); await settle(500);
  await page.check('#capOn'); await settle(1800);
  ok((await page.$eval('#capText', e => e.value)) === 'Yasmine', 'légende remplie : Yasmine');
  const h1 = await page.$eval('#stage svg', s => s.viewBox.baseVal.height);
  await page.click('#capColorMode button[data-v="custom"]'); await settle(800);
  ok(!!(await page.$('#stage svg [data-layer="legende"]')), 'légende dans son propre calque quand elle a sa couleur');
  await page.uncheck('#capOn'); await settle(900);
  const h2 = await page.$eval('#stage svg', s => s.viewBox.baseVal.height);
  ok(h1 > h2 + 8, 'la légende agrandit le dessin (' + Math.round(h2) + ' → ' + Math.round(h1) + ' px de haut)');

  // 4. variations : six propositions, appliquées en un clic
  await page.fill('#txt', 'وقل رب زدني علما'); await settle(400);
  await page.click('#tool-modeles'); await settle(300);
  await page.click('#variBtn');
  await page.waitForFunction(() => [...document.querySelectorAll('#vgrid .mc-art')].filter(a => a.querySelector('svg')).length === 6, null, { timeout: 40000 }).catch(() => {});
  const nv = await page.$$eval('#vgrid .mc', c => [c.length, c.filter(x => x.querySelector('.mc-art svg')).length, new Set(c.map(x => x.querySelector('.mc-name').textContent)).size]);
  ok(nv[0] === 6 && nv[1] === 6 && nv[2] === 6, 'variations : 6 aperçus, 6 écritures différentes');
  const want = await page.$eval('#vgrid .mc .mc-name', e => e.textContent);
  await page.click('#vgrid .mc-apply >> nth=0'); await settle(1500);
  ok((await page.$eval('#benchFont', e => e.textContent)) === want, 'variation appliquée : ' + want);

  // 5. repères et vignette de navigation
  await page.click('#guidesBtn'); await settle(400);
  ok(!!(await page.$('#stage svg.guides')), 'repères affichés');
  await page.click('#guidesBtn'); await settle(300);
  for (let i = 0; i < 3; i++) { await page.click('#zoomIn'); await settle(250); }
  ok(await page.$eval('#preview .pvnav', n => !n.hidden && !!n.querySelector('svg')), 'vignette de navigation au zoom avant');
  await page.click('#zoomFit'); await settle(400);
  ok(await page.$eval('#preview .pvnav', n => n.hidden), 'vignette masquée à l’ajustement');

  // 6. lien de partage : il ouvre la création dans un autre onglet
  await page.click('#dlOpen'); await settle(300);
  await page.click('#shareLink'); await settle(500);
  const link = await page.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  ok(/^https:\/\/midoubiba2024\.github\.io\/atelier-khattat\/#KHATTAT[01]:/.test(link), 'lien copié vers le site public (' + link.length + ' caractères)');
  await page.click('#exportClose');
  const p2 = await ctx.newPage();
  await p2.goto(BASE + 'index.html' + link.slice(link.indexOf('#')));
  await p2.waitForSelector('#stage svg', { timeout: 20000 });
  await p2.waitForTimeout(1500);
  ok((await p2.$eval('#txt', t => t.value)) === 'وقل رب زدني علما' && !p2.url().includes('#'), 'lien ouvert : création importée, adresse nettoyée');
  await browser.close();
  console.log(errors.length ? '\n' + errors.join('\n') : '\naucune erreur');
  process.exitCode = errors.length ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
