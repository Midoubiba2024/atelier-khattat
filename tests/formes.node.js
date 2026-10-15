globalThis.self = globalThis;
const fs = require('fs'); require('../src/engine.js'); require('../src/shape.js'); require('../src/export.js');
globalThis.ClipperLib = require('clipper-lib');
const K = globalThis.Khatt, X = globalThis.KhattExport, SH = globalThis.KhattShape;
(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  const amiri = new K.Font(fs.readFileSync('site/fonts/amiri.ttf'));
  const ruqaa = new K.Font(fs.readFileSync('site/fonts/aref-ruqaa.ttf'));
  const kufi = new K.Font(fs.readFileSync('site/fonts/reem-kufi.ttf'));
  const freeRaw = []; for (let i = 0; i <= 40; i++) { const t = i / 40; freeRaw.push(300 - t * 300, 100 + 60 * Math.sin(t * 6.28) + t * 40); }
  const free = SH.normalizeFree(freeRaw);
  const cases = [
    ['straight', ruqaa, 'الخط العربي', { type: 'straight' }],
    ['width 160%', ruqaa, 'الخط العربي', { type: 'straight', width: 160 }],
    ['arc 120°', ruqaa, 'بسم الله الرحمن الرحيم', { type: 'arc', bend: 120 }],
    ['arcInv 90°', ruqaa, 'بسم الله الرحمن الرحيم', { type: 'arcInv', bend: 90 }],
    ['bridge 60%', kufi, 'الخط العربي', { type: 'bridge', height: 60 }],
    ['circle 100% ring', amiri, 'بسم الله الرحمن الرحيم ✦ ', { type: 'circle', cover: 100, ring: 'double', ringW: 8 }],
    ['circle 60% top', amiri, 'السلام عليكم', { type: 'circle', cover: 60 }],
    ['circle bottom', amiri, 'السلام عليكم', { type: 'circle', cover: 50, side: 'bottom' }],
    ['oval ring', ruqaa, 'الحمد لله رب العالمين', { type: 'oval', cover: 70, ratio: 55, ring: 'single' }],
    ['wave', ruqaa, 'الخط العربي فن وجمال', { type: 'wave', amp: 40, waves: 1.5 }],
    ['flag', kufi, 'الخط العربي', { type: 'flag', amp: 30, waves: 1 }],
    ['bulge', kufi, 'الخط العربي', { type: 'bulge', intensity: 60 }],
    ['pinch', kufi, 'الخط العربي', { type: 'bulge', intensity: -45 }],
    ['persp', kufi, 'الخط العربي', { type: 'persp', intensity: 50 }],
    ['spiral', amiri, 'بسم الله الرحمن الرحيم الحمد لله رب العالمين الرحمن الرحيم', { type: 'spiral', gap: 130 }],
    ['free', ruqaa, 'الخط العربي فن وجمال', { type: 'free', free }],
    ['rotate -20', ruqaa, 'الخط العربي', { type: 'straight', rotate: -20 }],
  ];
  let html = '<html><body style="margin:0;font:12px sans-serif;display:flex;flex-wrap:wrap;gap:10px;padding:10px;background:#ddd">';
  for (const [name, font, text, shape] of cases) {
    const t0 = Date.now();
    const sc = X.buildScene(font, text, { size: 80, lineHeight: 1, align: 'center', shape, fill: { type: 'solid', color: '#14213d' }, stroke: { on: false }, shadow: { on: false }, bg: { type: 'solid', color: '#fffdf6' }, format: { id: 'auto', margin: 16 } });
    const ms = Date.now() - t0;
    const svg = X.sceneToSVG(sc, { inline: true }).replace('<svg ', '<svg style="max-width:420px;max-height:300px;width:auto;height:auto" width="' + sc.W + '" height="' + sc.H + '" ');
    html += `<figure style="margin:0;background:#fff;padding:6px"><figcaption>${name} · ${sc.W}×${sc.H} · ${sc.path.length} nums · ${ms} ms</figcaption>${svg}</figure>`;
    if (name === 'circle 100% ring') {
      fs.writeFileSync('out/shape_circle.pdf', await X.sceneToPDF(sc, { title: text }));
      fs.writeFileSync('out/shape_circle.eps', X.sceneToEPS(sc, { titleAscii: 'circle' }));
      fs.writeFileSync('out/shape_circle.dxf', X.sceneToDXF(sc));
    }
  }
  fs.writeFileSync('out/shapes.html', html + '</body></html>');
  // physical width test
  const sc2 = X.buildScene(ruqaa, 'الخط العربي', { size: 80, lineHeight: 1, align: 'center', shape: { type: 'arc', bend: 100 }, fill: { type: 'solid', color: '#000' }, stroke: { on: false }, shadow: { on: false }, bg: { type: 'none' }, format: { id: 'auto', margin: 0 }, phys: { on: true, widthMm: 1200 } });
  fs.writeFileSync('out/phys.pdf', await X.sceneToPDF(sc2, {}));
  fs.writeFileSync('out/phys.dxf', X.sceneToDXF(sc2));
  console.log('phys mmPerPx', sc2.mmPerPx.toFixed(4), 'W', sc2.W);
})().catch(e => { console.error(e); process.exit(1); });
