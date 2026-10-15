globalThis.self = globalThis;
const fs = require('fs'); require('../src/engine.js'); require('../src/export.js');
const K = globalThis.Khatt, X = globalThis.KhattExport;
(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  const rows = [];
  const tests = [['amiri', 'الخط العربي', 0], ['amiri', 'الخط العربي', 3], ['aref-ruqaa', 'بسم الله الرحمن الرحيم', 2], ['amiri', 'السَّلامُ عَلَيْكُم', 3], ['amiri', 'STELLA ستيلا 2026', 0], ['qahiri', 'لا إله إلا الله', 2]];
  for (const [f, t, k] of tests) {
    const font = new K.Font(fs.readFileSync('site/fonts/' + f + '.ttf'));
    const txt = K.addKashida(t, k);
    console.log(f, k, JSON.stringify(txt));
    const sc = X.buildScene(font, K.checkSupport(font, txt).text, { size: 70, lineHeight: 1, align: 'center', fill: { type: 'solid', color: '#111' }, stroke: { on: false }, shadow: { on: false }, bg: { type: 'solid', color: '#fff' }, format: { id: 'auto', margin: 10 } });
    rows.push(`<div style="display:flex;gap:12px;align-items:center;border-bottom:1px solid #ccc"><code style="width:220px">${f} k=${k}</code>${X.sceneToSVG(sc, { inline: true }).replace('<svg ', `<svg width="${sc.W}" height="${sc.H}" `)}</div>`);
  }
  fs.writeFileSync('out/kashida.html', '<html><body style="margin:0;font:13px sans-serif">' + rows.join('') + '</body></html>');
})();
