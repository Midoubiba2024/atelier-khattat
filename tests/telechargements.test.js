// Téléchargements : capacité Claude (acceptée, refusée, en attente), cadre protégé sans téléchargement,
// code de création (copie, collage), avertissement de texte coupé
const { launch, BASE } = require('./env');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const URL0 = BASE;
// page fictive qui intègre l'atelier dans un cadre protégé sans téléchargement, comme l'application Claude sur ordinateur
const FRAME = '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%}iframe{border:0;width:100%;height:100%}</style></head>' +
  '<body><iframe src="index.html" sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms" allow="clipboard-write; clipboard-read"></iframe></body></html>';
const mockCap = mode => {
  window.__saves = [];
  let pending = null;
  const downloads = {
    save: async req => {
      window.__saves.push({ filename: req.filename, size: req.data && req.data.size, type: req.data && req.data.type, isBlob: req.data instanceof Blob });
      if (mode === 'unavailable') throw { code: 'unavailable', message: 'x' };
      if (mode === 'pending') {
        if (pending) throw { code: 'rate_limited', message: 'x' };
        pending = new Promise(() => {});
        return pending;
      }
      await new Promise(r => setTimeout(r, 200));
      return { status: 'saved' };
    }
  };
  window.claude = { use: async n => n === 'downloads' ? downloads : null };
};
(async () => {
  const browser = await launch();
  const errs = [];
  const watch = (page, tag) => {
    page.on('pageerror', e => errs.push(tag + ' PAGEERROR ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404|Download is disallowed|sandboxed/.test(m.text())) errs.push(tag + ' ' + m.text()); });
  };
  const ready = async f => { await f.waitForSelector('#stage svg', { timeout: 20000 }); await f.waitForFunction(() => !!window.ClipperLib, null, { timeout: 20000 }); };
  const statusOf = f => f.$eval('#status', s => s.textContent);

  // 1) capacité présente et acceptée + texte coupé par le format
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.addInitScript(mockCap, 'ok');
    await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('khattat:v1', JSON.stringify({ text: 'بسم الله الرحمن الرحيم', fontId: 'amiri', size: 900, format: { id: 'square', margin: 56, w: 1200, h: 800 } })); } });
    const page = await ctx.newPage(); watch(page, 'ok');
    let dlEvents = 0; page.on('download', () => dlEvents++);
    await page.goto(URL0 + 'index.html'); await ready(page);
    await page.click('#qdl button[data-x="svg"]');
    await page.waitForFunction(() => /enregistré/.test(document.querySelector('#status').textContent), null, { timeout: 15000 });
    const st = await statusOf(page), saves = await page.evaluate(() => window.__saves);
    ok(saves.length === 1 && saves[0].isBlob && /\.svg$/.test(saves[0].filename) && saves[0].size > 1000, 'ok : SVG remis à Claude en Blob (' + JSON.stringify(saves[0]) + ')');
    ok(/dépasse du format/.test(st), 'ok : avertissement « texte coupé » : ' + st);
    ok(dlEvents === 0 && !(await page.$eval('#dlfb', d => d.open)), 'ok : ni lien direct ni fenêtre de secours');
    ok(await page.$eval('#dlHint', n => n.hidden), 'ok : pas d’avertissement quand le téléchargement est possible');
    await ctx.close();
  }
  // 2) capacité présente mais refusée par la fenêtre (application de bureau)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL0.slice(0, -1) });
    await ctx.addInitScript(mockCap, 'unavailable');
    await ctx.addInitScript(() => { if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.setItem('khattat:v1', JSON.stringify({ text: 'نور على نور', fontId: 'gulzar', shape: { type: 'arc', bend: 120 } })); } });
    const page = await ctx.newPage(); watch(page, 'unavailable');
    await page.goto(URL0 + 'index.html'); await ready(page);
    await page.click('#dlOpen'); await page.click('#exportBox button[data-x="png"]');
    await page.waitForFunction(() => document.querySelector('#dlfb').open, null, { timeout: 15000 });
    await page.waitForFunction(() => /^KHATTAT[01]:/.test(document.querySelector('#dlfbCode').value), null, { timeout: 5000 });
    const d = await page.evaluate(() => ({ name: document.querySelector('#dlfbName').textContent, size: document.querySelector('#dlfbSize').textContent, tech: document.querySelector('#dlfbTech').textContent, copy: !document.querySelector('#dlfbCopyWay').hidden, btn: document.querySelector('#dlfbCopy').textContent, open: document.querySelector('#dlfbOpen').href, code: document.querySelector('#dlfbCode').value }));
    ok(/\.png$/.test(d.name) && /Ko|Mo/.test(d.size), 'unavailable : fenêtre « fichier prêt » pour ' + d.name + ' (' + d.size + ')');
    ok(/unavailable/.test(d.tech) && d.copy && /image/.test(d.btn) && /claude\.ai\/artifact\//.test(d.open), 'unavailable : détail, copie d’image et lien navigateur');
    await page.click('#dlfbCopy');
    await page.waitForFunction(() => /Image copiée|copie n’est pas/.test(document.querySelector('#status').textContent), null, { timeout: 5000 });
    const clipTypes = await page.evaluate(async () => { try { const it = await navigator.clipboard.read(); return it.map(i => i.types.join(',')).join(';'); } catch (e) { return 'ERR ' + e.message; } });
    ok(/image\/png/.test(clipTypes), 'unavailable : l’image est dans le presse-papiers (' + clipTypes + ')');
    console.log('     longueur du code de création :', d.code.length);
    await ctx.close();
    var CODE = d.code;
  }
  // 3) cadre protégé sans capacité (comme une page intégrée sans téléchargement)
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL0.slice(0, -1) });
    const page = await ctx.newPage(); watch(page, 'cadre');
    let dlEvents = 0; page.on('download', () => dlEvents++);
    await page.route(URL0 + 'frame.html', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: FRAME }));
    await page.goto(URL0 + 'frame.html');
    const f = page.frame({ url: /index\.html/ });
    await ready(f);
    ok(!(await f.$eval('#dlHint', n => n.hidden)), 'cadre : avertissement visible sous la barre vectorielle');
    await f.click('#qdl button[data-x="svg"]');
    await f.waitForFunction(() => document.querySelector('#dlfb').open, null, { timeout: 15000 });
    const d = await f.evaluate(() => ({ name: document.querySelector('#dlfbName').textContent, tech: document.querySelector('#dlfbTech').textContent, btn: document.querySelector('#dlfbCopy').textContent }));
    ok(/\.svg$/.test(d.name) && /intégrée|ne propose pas/.test(d.tech) && /SVG/.test(d.btn), 'cadre : fenêtre de secours pour ' + d.name + ' (' + d.tech + ')');
    await f.click('#dlfbCopy');
    await f.waitForFunction(() => /SVG copié|copie n’est pas/.test(document.querySelector('#status').textContent), null, { timeout: 5000 });
    const clip = await f.evaluate(async () => { try { return (await navigator.clipboard.readText()).slice(0, 60); } catch (e) { return 'ERR ' + e.message; } });
    ok(/<svg|<\?xml/.test(clip), 'cadre : le code SVG est copié (' + clip.slice(0, 30) + '…)');
    await f.click('#dlfbClose');
    await f.click('#qdl button[data-x="pdf"]');
    await f.waitForFunction(() => document.querySelector('#dlfb').open, null, { timeout: 15000 });
    ok(await f.$eval('#dlfbCopyWay', s => s.hidden), 'cadre : PDF sans option de copie (navigateur proposé)');
    ok(dlEvents === 0, 'cadre : aucun téléchargement lancé en douce');
    await ctx.close();
  }
  // 4) une demande déjà ouverte ne bloque pas l'atelier
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.addInitScript(mockCap, 'pending');
    const page = await ctx.newPage(); watch(page, 'pending');
    await page.goto(URL0 + 'index.html'); await ready(page);
    await page.click('#qdl button[data-x="svg"]');
    await page.waitForFunction(() => window.__saves.length === 1, null, { timeout: 15000 });
    await page.waitForTimeout(300);
    await page.click('#qdl button[data-x="pdf"]');
    await page.waitForFunction(() => window.__saves.length === 2, null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(300);
    const st = await statusOf(page);
    ok((await page.evaluate(() => window.__saves.length)) === 2 && /déjà ouverte/.test(st), 'pending : second export possible, message clair : ' + st);
    await ctx.close();
  }
  // 5) code de création collé dans la zone de texte d'un autre atelier
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage(); watch(page, 'import');
    await page.goto(URL0 + 'index.html'); await ready(page);
    const before = await page.$eval('#txt', t => t.value);
    await page.evaluate(code => {
      const dt = new DataTransfer(); dt.setData('text/plain', code);
      const t = document.querySelector('#txt'); t.focus();
      t.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }));
    }, CODE);
    await page.waitForFunction(() => /importée/.test(document.querySelector('#status').textContent), null, { timeout: 5000 });
    await page.waitForTimeout(1200);
    const after = await page.evaluate(() => ({ txt: document.querySelector('#txt').value, saved: JSON.parse(localStorage.getItem('khattat:v1') || '{}') }));
    ok(after.txt === 'نور على نور' && after.txt !== before && after.saved.fontId === 'gulzar' && after.saved.shape && after.saved.shape.type === 'arc', 'import : texte, style et forme repris (' + after.txt + ' · ' + after.saved.fontId + ' · ' + (after.saved.shape || {}).type + ')');
    // champ « coller un code » de Mes créations, avec un code abîmé
    await page.click('#designsBtn');
    await page.fill('#dcodeIn', 'KHATTAT1:abcdefghijklmnop');
    await page.waitForTimeout(300);
    ok(/abîmé/.test(await statusOf(page)), 'import : code abîmé signalé sans rien casser');
    await page.click('#dcodeCopy');
    await page.waitForTimeout(500);
    ok(/Code copié|Copiez le code/.test(await statusOf(page)), 'Mes créations : copie du code proposée');
    await ctx.close();
  }
  console.log(errs.length ? 'ERREURS :\n' + errs.join('\n') : 'aucune erreur de page');
  await browser.close();
  console.log(fails ? fails + ' échec(s)' : 'tout est bon');
  process.exit(fails || errs.length ? 1 : 0);
})();
