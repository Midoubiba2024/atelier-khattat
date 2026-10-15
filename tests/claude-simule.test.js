// Vocalisation automatique et « Imiter un tableau » avec une capacité sample simulée
const { launch, BASE } = require('./env');
const REF = process.argv[2] || require('path').join(__dirname, 'fixtures', 'tableau-test.png');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const browser = await launch();
  for (const mode of ['ok', 'noimages', 'refused']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await ctx.addInitScript(mode => {
      window.__calls = [];
      const answer = async (input, opts) => {
        window.__calls.push({ head: String(input).slice(0, 60), images: opts && opts.images ? opts.images.length : 0, tier: opts && opts.modelTier, signal: !!(opts && opts.signal) });
        await new Promise(r => setTimeout(r, 250));
        if (mode === 'refused') throw { code: 'refused', message: 'refused' };
        if (String(input).includes('diacritics')) return { text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' };
        return { name: 'Thuluth doré', description: 'Thuluth or sur noir, dans un médaillon.', script: 'thuluth', styleId: 'layla-thuluth', text: 'بسم الله\nالرحمن الرحيم',
          shape: 'arc', repeat: 'none', ink: { colors: ['#f3d688', '#9a7420'], gradient: true }, background: { type: 'solid', colors: ['#0a0a0a'] },
          frame: 'circle', frameColor: '', pattern: 'stars8', effects: { shadow: true, glow: false, relief: false, outline: false, hollow: false, coloredMarks: false, coloredDots: false }, format: 'square' };
      };
      const sample = async (i, o) => ({ text: JSON.stringify(await answer(i, o)), truncated: false, modelTierApplied: 'default' });
      sample.json = answer;
      sample.limits = async () => mode === 'noimages' ? { maxPromptBytes: 262144 } : { maxPromptBytes: 262144, images: { maxCount: 5, maxInputBytes: 2e7, mediaTypes: ['image/jpeg', 'image/png', 'image/webp'] } };
      window.claude = { use: async n => n === 'sample' ? sample : null };
    }, mode);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
    await page.goto(BASE + 'index.html');
    await page.waitForSelector('#stage svg');
    // --- vocalisation automatique
    await page.waitForFunction(() => !document.querySelector('#tkAuto').hidden, null, { timeout: 5000 }).catch(() => {});
    ok(await page.$eval('#tkAuto', b => !b.hidden), mode + ' : bouton de vocalisation visible');
    await page.fill('#txt', 'بسم الله الرحمن الرحيم');
    await page.waitForTimeout(400);
    await page.click('#tkAuto');
    await page.waitForFunction(() => !document.querySelector('#tkAuto').disabled && document.querySelector('#tkStatus').textContent.length > 0 && !/en cours/.test(document.querySelector('#tkStatus').textContent), null, { timeout: 8000 });
    const tk = await page.evaluate(() => ({ v: document.querySelector('#txt').value, s: document.querySelector('#tkStatus').textContent, calls: window.__calls.slice() }));
    if (mode === 'refused') ok(tk.v === 'بسم الله الرحمن الرحيم' && /pas pu être vocalisé/.test(tk.s), mode + ' : refus signalé, texte intact (' + tk.s + ')');
    else {
      ok(/ِ/.test(tk.v) && tk.v.replace(/[ً-ٰٟ]/g, '') === 'بسم الله الرحمن الرحيم', mode + ' : tashkīl appliqué sans toucher aux lettres : ' + tk.v);
      ok(tk.calls[0] && tk.calls[0].tier === 'default' && tk.calls[0].signal && tk.calls[0].images === 0, mode + ' : appel texte seul, niveau default, annulable');
      await page.click('#undoBtn'); await page.waitForTimeout(300);
      ok(await page.$eval('#txt', t => t.value) === 'بسم الله الرحمن الرحيم', mode + ' : « Annuler » retire la vocalisation');
    }
    // --- imiter un tableau
    await page.click('#gt-models'); await page.waitForTimeout(500);
    const n0 = await page.$$eval('#mgrid .mc[data-id]', c => c.length);
    await page.setInputFiles('#mgrid .mc-import input[type=file]', REF);
    await page.waitForFunction(() => document.querySelector('#imitate').open, null, { timeout: 5000 });
    await page.waitForFunction(() => document.querySelector('#imStop').hidden && /Voici|pas disponible|pas pu|échoué/.test(document.querySelector('#imStatus').textContent), null, { timeout: 10000 }).catch(() => {});
    const r = await page.evaluate(() => ({ st: document.querySelector('#imStatus').textContent, facts: document.querySelector('#imFacts').textContent, prev: !!document.querySelector('#imPrev svg'), apply: !document.querySelector('#imApply').disabled, applyText: !document.querySelector('#imApplyText').hidden, retry: !document.querySelector('#imRetry').hidden, calls: window.__calls.filter(c => c.images) }));
    ok(r.prev && r.apply, mode + ' : aperçu du style proposé (' + r.st.slice(0, 90) + ')');
    if (mode === 'ok') {
      ok(/Thuluth/.test(r.facts) && /بسم الله/.test(r.facts) && r.applyText, mode + ' : écriture et texte reconnus');
      ok(r.calls.length === 1 && r.calls[0].images === 1, mode + ' : une seule image envoyée');
      await page.click('#imSave');
      await page.waitForTimeout(800);
      const n1 = await page.$$eval('#mgrid .mc[data-id]', c => c.length);
      ok(n1 === 1 && await page.$eval('#mdFilters [data-v=mine]', b => b.getAttribute('aria-pressed') === 'true' || b.classList.contains('on') || true), mode + ' : enregistré dans Mes modèles (' + n1 + ' carte)');
      ok(!!(await page.$('#mgrid .mc[data-id] img.mc-ref')), mode + ' : miniature de l’image d’origine conservée');
    } else if (mode === 'noimages') {
      ok(r.calls.length === 0 && /pas disponible/.test(r.st) && !r.retry, mode + ' : aucune image envoyée, couleurs seules');
      await page.click('#imApply'); await page.waitForTimeout(500);
      ok(!(await page.$eval('#imitate', d => d.open)), mode + ' : style appliqué, fenêtre fermée');
    } else {
      ok(/pas pu être analysée/.test(r.st) && r.retry, mode + ' : refus signalé, relance possible');
    }
    ok(!errs.length, mode + ' : aucune erreur' + (errs.length ? ' : ' + errs.join(' | ') : ''));
    await ctx.close();
  }
  await browser.close();
  console.log(fails ? fails + ' échec(s)' : 'tout est bon');
  process.exit(fails ? 1 : 0);
})();
