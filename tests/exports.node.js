globalThis.self = globalThis;
const fs = require('fs'); require('../src/engine.js'); require('../src/export.js');
const K = globalThis.Khatt, X = globalThis.KhattExport;
(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  fs.mkdirSync('out', { recursive: true });
  const cases = [
    { font: 'aref-ruqaa', text: 'الخط العربي', st: { size: 140, lineHeight: 1, align: 'center', fill: { type: 'linear', c1: '#7A5A12', c2: '#F1D27A', angle: 90 }, stroke: { on: false }, shadow: { on: true, color: '#000000', opacity: 0.45, dx: 6, dy: 8, blur: 10 }, bg: { type: 'solid', color: '#0E1A3A' }, format: { id: 'auto', margin: 60 } } },
    { font: 'gulzar', text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالحمد لله ٢٠٢٦', st: { size: 90, lineHeight: 1.1, align: 'center', fill: { type: 'solid', color: '#1B1B1B' }, stroke: { on: true, color: '#C9A227', width: 3 }, shadow: { on: false }, bg: { type: 'linear', c1: '#F6EBD2', c2: '#E2CFA2', angle: 90 }, format: { id: 'square', w: 1080, h: 1080 } } },
    { font: 'qahiri', text: 'السلام عليكم', st: { size: 160, lineHeight: 1, align: 'center', fill: { type: 'solid', color: '#0F5E4A' }, stroke: { on: false }, shadow: { on: false }, bg: { type: 'none' }, format: { id: 'auto', margin: 20 } } },
  ];
  for (const c of cases) {
    const font = new K.Font(fs.readFileSync('site/fonts/' + c.font + '.ttf'));
    const chk = K.checkSupport(font, c.text);
    const sc = X.buildScene(font, chk.text, c.st);
    console.log(c.font, 'W×H', sc.W, sc.H, 'overflow', sc.overflow, 'missing', chk.missing.join(''));
    fs.writeFileSync(`out/${c.font}.svg`, X.sceneToSVG(sc, { title: c.text }));
    fs.writeFileSync(`out/${c.font}.pdf`, await X.sceneToPDF(sc, { title: c.text }));
    fs.writeFileSync(`out/${c.font}.eps`, X.sceneToEPS(sc, { titleAscii: c.font }));
    fs.writeFileSync(`out/${c.font}.dxf`, X.sceneToDXF(sc));
  }
  const zip = await X.makeZip([{ name: 'a.svg', data: fs.readFileSync('out/qahiri.svg') }, { name: 'b.eps', data: fs.readFileSync('out/qahiri.eps', 'latin1') }, { name: 'c.pdf', data: new Uint8Array(fs.readFileSync('out/qahiri.pdf')) }]);
  fs.writeFileSync('out/test.zip', zip);
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
