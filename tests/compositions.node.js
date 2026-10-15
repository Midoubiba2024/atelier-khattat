// Compositions par lignes : forme remplie, anneaux, mosaïque, kaléidoscope, contre-formes, motifs et cadre pointillé
globalThis.self = globalThis;
const fs = require('fs');
globalThis.ClipperLib = require('clipper-lib');
for (const f of ['engine', 'shape', 'fx', 'ornament', 'export']) require('../src/' + f + '.js');
const K = globalThis.Khatt, X = globalThis.KhattExport, S = globalThis.KhattShape;
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const base = (o) => Object.assign({ size: 100, lineHeight: 1.15, align: 'center', fill: { type: 'solid', color: '#111111' }, stroke: { on: false }, shadow: { on: false }, fx: {}, frame: { type: 'none' }, pattern: { type: 'none' }, bg: { type: 'solid', color: '#ffffff' }, format: { id: 'auto', margin: 20 }, phys: { on: false } }, o);
(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  fs.mkdirSync('out/compo', { recursive: true });
  const amiri = new K.Font(fs.readFileSync('site/fonts/amiri-bold.ttf'));
  const scene = (text, o) => X.buildScene(amiri, K.checkSupport(amiri, text).text, base(o));
  const inside = (sc, l) => { const b = K.pathBBox(l.path); return b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= sc.W + 0.5 && b.y + b.h <= sc.H + 0.5; };
  const save = (name, sc) => fs.writeFileSync('out/compo/' + name + '.svg', X.sceneToSVG(sc, { title: name }));

  // 1. contours à remplir : hauteur 2, sens horaire à l'écran (aire positive)
  for (const k of S.FILL_KINDS) {
    const P = S.fillLoop(k, 100);
    let y0 = Infinity, y1 = -Infinity, a = 0;
    for (let i = 0; i < P.length; i += 2) { y0 = Math.min(y0, P[i + 1]); y1 = Math.max(y1, P[i + 1]); const j = (i + 2) % P.length; a += P[i] * P[j + 1] - P[j] * P[i + 1]; }
    ok(Math.abs(y1 - y0 - 2) < 1e-6 && a > 0, 'contour « ' + k + ' » : hauteur 2, sens horaire');
  }
  // 2. lignes placées dans la forme : chaque boîte tient dans sa corde
  const tri = S.fillLoop('tri', 100);
  const fit = S.fitRows([{ w: 300, h: 80 }, { w: 400, h: 80 }, { w: 500, h: 80 }], tri, { grow: 1, stretch: 0.2 });
  ok(fit && fit.rows.length === 3 && fit.rows.every((r, i) => { const c = S.chordAt(tri, r.y + 80 * r.s, 0); return c && (c[1] - c[0]) >= [300, 400, 500][i] * r.s * r.sx - 1e-6; }), 'pyramide : chaque ligne tient dans le triangle');
  // 3. forme remplie, lignes automatiques
  const fill = scene('سبحان الله والحمد لله ولا إله إلا الله والله أكبر', { shape: { type: 'fill', fillShape: 'circle', wrap: 'auto', ring: 'single' } });
  ok(fill.shapeInfo.rows >= 2 && fill.layers.some(l => l.role === 'text') && fill.layers.every(l => !l.path || inside(fill, l)), 'cercle rempli : ' + fill.shapeInfo.rows + ' lignes automatiques, tout dans le cadre');
  save('cercle', fill);
  // 4. anneaux : centre + anneaux complétés, une phrase d'une ligne découpée toute seule
  const rings = scene('الله\nالرحمن الرحيم الملك\nالقدوس السلام المؤمن المهيمن العزيز', { shape: { type: 'rings', rlines: 'thin', sep: 'star', ring: 'double' } });
  ok(rings.shapeInfo.coverage > 0.97 && rings.W > 100 && Math.abs(rings.W - rings.H) < rings.W * 0.15, 'anneaux : couverture ' + Math.round(rings.shapeInfo.coverage * 100) + ' %, médaillon presque carré');
  save('anneaux', rings);
  ok(X.wrapForShape(amiri, 'سبحان الله والحمد لله ولا إله إلا الله', { size: 100, shape: { type: 'rings' } }).split('\n').length >= 3, 'anneaux : une phrase d’une ligne est répartie en centre et anneaux');
  // 5. mosaïque : titre + tuiles colorées, de droite à gauche
  const tiles = scene('العنوان\nأ\nب\nت\nث\nج', { shape: { type: 'tiles', tile: 'capsule', title: 'top', palette: 'pastel', ring: 'single' } });
  const tl = tiles.layers.filter(l => l.role === 'tile');
  ok(tiles.shapeInfo.tiles === 5 && tl.length === 10, 'mosaïque : 5 tuiles colorées et leurs filets (' + tl.length + ' calques)');
  save('mosaique', tiles);
  const para = scene('ligne une\nligne deux\n\nligne trois', { shape: { type: 'tiles', title: 'none', palette: 'none', ring: 'single' } });
  ok(para.shapeInfo.tiles === 2, 'mosaïque : les paragraphes séparés par une ligne vide font deux tuiles');
  // 6. kaléidoscope : 8 copies, autant de contours que le texte × 8
  const one = scene('هو', {}), kal = scene('هو', { shape: { repeat: 'kaleido', copies: 8 } });
  const n1 = K.splitContours(one.layers.find(l => l.role === 'text').path).length, n8 = K.splitContours(kal.layers.find(l => l.role === 'text').path).length;
  ok(n8 === n1 * 8, 'kaléidoscope : 8 copies (' + n8 + ' contours)');
  // 7. contre-formes : les boucles de هو remplies
  const cf = scene('هو', { fx: { counters: { on: true, color: '#ffffff' } } });
  ok(cf.layers.some(l => l.role === 'counter' && l.path.length > 10), 'contre-formes : intérieur des boucles rempli');
  // 8. couleur par ligne
  const li = scene('سطر\nسطر', { lineInk: ['#ff0000', '#0000ff'] });
  ok(li.layers.filter(l => l.role === 'text').length === 2, 'couleur par ligne : deux calques de texte');
  // 9. motifs : points du calame en couleurs, écriture répétée
  const nq = scene('نور', { format: { id: 'custom', w: 600, h: 400 }, pattern: { type: 'nuqat', color: '#c9a227', opacity: 0.5, scale: 10, colorful: true } });
  ok(nq.layers.filter(l => l.role === 'pattern').length === 5, 'points du calame : cinq couleurs');
  const wd = scene('نور', { format: { id: 'custom', w: 600, h: 400 }, pattern: { type: 'words', text: 'آدم', color: '#9c6b2e', opacity: 0.3, scale: 10 } });
  ok(wd.layers.some(l => l.role === 'pattern' && l.path.length > 1000), 'écriture répétée en fond');
  // 10. cadres : pointillé, triangle, œuf
  for (const [type, dash] of [['circle', true], ['triangle', false], ['egg', false]]) {
    const sc = scene('سلام', { frame: { type, width: 2.5, pad: 14, color: 'ink', panel: 'none', dash } });
    const fr = sc.layers.find(l => l.role === 'frame');
    ok(fr && (!dash || K.splitContours(fr.path).length >= 8), 'cadre ' + type + (dash ? ' pointillé (' + K.splitContours(fr.path).length + ' tirets)' : ''));
  }
  // 11. exports vectoriels d'une mosaïque
  const pdf = await X.sceneToPDF(tiles, { title: 'mosaique' }), eps = X.sceneToEPS(tiles, { titleAscii: 'mosaique' });
  ok(pdf.length > 2000 && /%%EOF/.test(eps.slice(-100)), 'mosaïque : PDF et EPS produits');
  console.log(fails ? fails + ' échec(s)' : 'compositions : tout est bon');
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
