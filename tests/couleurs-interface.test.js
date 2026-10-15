// Galerie (111 styles, chargement progressif) + éditeur de dégradés + migration de l'ancien état
const { launch, BASE } = require('./env');
const fs = require('fs');
const URL = BASE + 'index.html';
(async () => {
  const browser = await launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/favicon/.test(JSON.stringify(m.location()))) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const t0 = Date.now();
  await page.goto(URL);
  await page.waitForSelector('#preview svg', { timeout: 20000 });
  console.log('preview ready in', Date.now() - t0, 'ms');
  // la galerie des styles est dans son panneau : on l'ouvre, et la molette fait défiler le panneau
  await page.click('#tool-styles'); await page.waitForTimeout(300);
  await page.mouse.move(280, 500);
  const nCards = await page.$$eval('#grid .card[data-id]', a => a.length);
  const chips = await page.$$eval('#filters .chip', a => a.map(c => c.textContent.replace(/\s+/g, ' ').trim()));
  console.log('cards:', nCards, '| filters:', chips.join(' / '), '| count label:', await page.textContent('#styleCount'));
  // défilement progressif de la galerie : toutes les cartes doivent finir dessinées
  const t1 = Date.now();
  for (let y = 0; y < 40; y++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(150);
  }
  await page.waitForFunction(() => document.querySelectorAll('#grid .card-art svg').length >= document.querySelectorAll('#grid .card[data-id]').length - 0, null, { timeout: 60000 }).catch(() => {});
  const drawn = await page.$$eval('#grid .card-art svg', a => a.length);
  const errs = await page.$$eval('#grid .card-err', a => a.length);
  const missing = await page.$$eval('#grid .card.missing', a => a.map(c => c.dataset.id));
  console.log('cards drawn after scroll:', drawn, 'errors:', errs, 'in', Date.now() - t1, 'ms | missing letters:', missing.join(',') || 'none');
  // empreintes : deux cartes ne devraient pas être identiques (sauf exceptions voulues)
  const dup = await page.evaluate(() => {
    const m = new Map();
    for (const c of document.querySelectorAll('#grid .card[data-id]')) {
      const d = c.querySelector('.card-art path'); if (!d) continue;
      const k = d.getAttribute('d'); const id = c.dataset.id;
      if (m.has(k)) m.get(k).push(id); else m.set(k, [id]);
    }
    return [...m.values()].filter(v => v.length > 1);
  });
  console.log('identical renders:', dup.length ? JSON.stringify(dup) : 'none');
  await page.screenshot({ path: 'out/g_gallery_bottom.png' });
  await page.evaluate(() => window.scrollTo(0, 0));

  // ---------- Couleurs : dégradé de l'encre
  await page.click('#tool-couleurs');
  await page.waitForTimeout(200);
  const visible = await page.isVisible('#rowInkGrad');
  console.log('ink gradient editor visible:', visible);
  const gradOf = (s, layer) => { const p = s.querySelector('[data-layer="' + layer + '"]'); const m = p && /url\(#([^)]+)\)/.exec(p.getAttribute('fill') || ''); return m ? s.querySelector('#' + CSS.escape(m[1])) : null; };
  const inkDefs = async () => page.$eval('#preview svg', s => { const p = s.querySelector('[data-layer="texte"]'); const m = p && /url\(#([^)]+)\)/.exec(p.getAttribute('fill') || ''); const g = m ? s.querySelector('#' + CSS.escape(m[1])) : null; return g ? g.tagName + ':' + g.querySelectorAll('stop').length : 'none'; });
  console.log('default ink:', await inkDefs());
  await page.click('#rowInkGrad .gp[title^="Arc-en-ciel"]');
  await page.waitForTimeout(150);
  console.log('after rainbow preset:', await inkDefs(), '| handles:', await page.$$eval('#rowInkGrad .gstop', a => a.length));
  await page.click('#rowInkGrad .gkind button[data-v="radial"]');
  await page.waitForTimeout(150);
  console.log('after radial:', await inkDefs(), '| angle row hidden:', await page.$eval('#rowInkGrad .grow-angle', e => e.hidden));
  // clic sur la barre à 25 % → nouvelle couleur
  const bar = await page.$('#rowInkGrad .gbar');
  const bb = await bar.boundingBox();
  await page.mouse.click(bb.x + bb.width * 0.08, bb.y + 8);
  await page.waitForTimeout(150);
  console.log('after click on bar:', await inkDefs(), '| label:', await page.textContent('#rowInkGrad .gsel'));
  // glisser la pastille choisie
  const sel = await page.$('#rowInkGrad .gstop[aria-pressed="true"]');
  const sb = await sel.boundingBox();
  await page.mouse.move(sb.x + sb.width / 2, sb.y + sb.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width * 0.5, sb.y + sb.height / 2, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  console.log('after drag:', await page.textContent('#rowInkGrad .gsel'));
  // couleur du nuancier pour la pastille choisie
  await page.click('#rowInkGrad .gpick .sw[aria-label="Turquoise"]');
  await page.waitForTimeout(150);
  const stopsNow = await page.$eval('#preview svg', s => { const p = s.querySelector('[data-layer="texte"]'); const g = s.querySelector('#' + CSS.escape(/url\(#([^)]+)\)/.exec(p.getAttribute('fill'))[1])); return [...g.querySelectorAll('stop')].map(s => s.getAttribute('offset') + ' ' + s.getAttribute('stop-color')).join(' | '); });
  console.log('stops:', stopsNow);
  // code hexadécimal
  await page.fill('#rowInkGrad .gpick .hex', '#ff00aa');
  await page.press('#rowInkGrad .gpick .hex', 'Enter');
  await page.waitForTimeout(150);
  console.log('hex applied:', (await page.$eval('#preview svg', s => { const p = s.querySelector('[data-layer="texte"]'); const g = s.querySelector('#' + CSS.escape(/url\(#([^)]+)\)/.exec(p.getAttribute('fill'))[1])); return [...g.querySelectorAll('stop')].map(s => s.getAttribute('stop-color')); })).includes('#ff00aa'));
  await page.click('#rowInkGrad [data-a="rev"]');
  await page.click('#rowInkGrad [data-a="del"]');
  await page.waitForTimeout(150);
  console.log('after reverse+remove:', await inkDefs());
  // clavier : flèches sur la pastille
  await page.focus('#rowInkGrad .gstop[aria-pressed="true"]');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('ArrowRight');
  console.log('after keys:', await page.textContent('#rowInkGrad .gsel'));
  await page.screenshot({ path: 'out/g_colors.png' });
  const benchShot = await page.$('#bench');
  await benchShot.screenshot({ path: 'out/g_colors_bench.png' });

  // ---------- Fond : dégradé circulaire
  await page.click('#tool-fond');
  await page.click('#bgType button[data-v="grad"]');
  await page.click('#rowBgGrad .gp[title^="Halo"]');
  await page.waitForTimeout(200);
  console.log('bg:', await page.$eval('#preview svg', s => { const p = s.querySelector('[data-layer="fond"]'); const m = p && /url\(#([^)]+)\)/.exec(p.getAttribute('fill') || ''); const g = m ? s.querySelector('#' + CSS.escape(m[1])) : null; return g ? g.tagName + ':' + g.querySelectorAll('stop').length + ' ' + (g.getAttribute('gradientTransform') || '') : 'none'; }));
  await benchShot.screenshot({ path: 'out/g_bg_bench.png' });
  // téléchargements PDF / SVG / ZIP
  fs.mkdirSync('out/dlg', { recursive: true });
  await page.click('#dlOpen');
  for (const x of ['pdf', 'svg', 'png', 'zip']) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(`.dl button[data-x="${x}"]`)]);
    const p = 'out/dlg/' + x + '-' + dl.suggestedFilename();
    await dl.saveAs(p);
    console.log('download', x, fs.statSync(p).size, 'bytes |', await page.textContent('#status'));
  }
  await page.click('#exportClose');
  // ambiance « Néon »
  await page.click('#tool-couleurs');
  await page.click('.mood:has-text("Néon")');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'out/g_neon.png' });
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('khattat:v1')));
  console.log('saved fill:', JSON.stringify(saved.fill), '\nsaved bg:', JSON.stringify(saved.bg).slice(0, 200));

  // ---------- migration d'un état enregistré à l'ancien format
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errors.push('migr pageerror: ' + e.message));
  await p2.goto(URL);
  await p2.evaluate(() => localStorage.setItem('khattat:v1', JSON.stringify({ text: 'سلام', fontId: 'amiri', bold: true, fill: { type: 'linear', color: '#1B1712', c1: '#FF0000', c2: '#0000FF', angle: 45 }, bg: { type: 'linear', color: '#0E1A3A', c1: '#111111', c2: '#EEEEEE', angle: 90, veil: 0.3, veilColor: 'dark' } })));
  await p2.reload();
  await p2.waitForSelector('#preview svg', { timeout: 20000 });
  await p2.waitForTimeout(500);
  console.log('migrated ink:', await p2.$eval('#preview svg', s => { const p = s.querySelector('[data-layer="texte"]'); const m = /url\(#([^)]+)\)/.exec(p.getAttribute('fill') || ''); const g = m && s.querySelector('#' + CSS.escape(m[1])); return g ? [...g.querySelectorAll('stop')].map(s => s.getAttribute('stop-color')).join(',') : p.getAttribute('fill'); }),
    '| bg:', await p2.$eval('#preview svg', s => { const p = s.querySelector('[data-layer="fond"]'); const m = p && /url\(#([^)]+)\)/.exec(p.getAttribute('fill') || ''); const g = m && s.querySelector('#' + CSS.escape(m[1])); return g ? [...g.querySelectorAll('stop')].map(s => s.getAttribute('stop-color')).join(',') : (p ? p.getAttribute('fill') : 'none'); }));
  // ---------- mobile
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const p3 = await ctx3.newPage();
  p3.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await p3.goto(URL);
  await p3.waitForSelector('#preview svg', { timeout: 20000 });
  await p3.click('#tool-couleurs');
  await p3.waitForTimeout(400);
  const ov = await p3.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('mobile overflow px:', ov);
  const tp = await p3.$('#tp-col');
  await tp.screenshot({ path: 'out/g_mobile_colors.png' });
  console.log('ERRORS/WARNINGS:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
