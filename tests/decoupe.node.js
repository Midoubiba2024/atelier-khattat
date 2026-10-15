globalThis.self = globalThis;
const fs = require('fs'); require('../src/engine.js'); require('../src/export.js');
globalThis.ClipperLib = require('clipper-lib');
const K = globalThis.Khatt, X = globalThis.KhattExport;
(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  for (const f of ['aref-ruqaa', 'gulzar', 'reem-kufi']) {
    const font = new K.Font(fs.readFileSync('site/fonts/' + f + '.ttf'));
    const sc = X.buildScene(font, f === 'gulzar' ? 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ' : 'الخط العربي', { size: 140, lineHeight: 1, align: 'center', fill: { type: 'solid', color: '#000' }, stroke: { on: false }, shadow: { on: false }, bg: { type: 'none' }, format: { id: 'auto', margin: 20 } });
    const t0 = Date.now(); const cp = X.cutPolygons(sc);
    console.log(f, 'raw polys', K.flatten(sc.path, 0.08).length, '-> merged', cp.polys.length, (Date.now() - t0) + 'ms');
    fs.writeFileSync('out/cut_' + f + '.dxf', X.sceneToDXF(sc));
    fs.writeFileSync('out/cut_' + f + '.svg', X.sceneToCutSVG(sc));
  }
})();
