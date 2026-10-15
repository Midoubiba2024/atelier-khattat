// Compositions par lignes : forme remplie, anneaux, mosaïque, tughra, médaillon ailé, hilye, kaléidoscope, contre-formes,
// lettres semées, motifs et cadre pointillé
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
  // 11. tughra : les hampes s'allongent, le corps des lettres garde sa hauteur ; boucles et traits ajoutés
  const thuluth = new K.Font(fs.readFileSync('site/fonts/layla-thuluth.ttf'));
  const sceneT = (text, o) => X.buildScene(thuluth, K.checkSupport(thuluth, text).text, base(o), ['-liga']);
  const plain = sceneT('عبد الله', {}), tg = sceneT('عبد الله', { shape: { type: 'tughra', height: 60 } });
  const hOf = sc => sc.layers.find(l => l.role === 'text').box.h;
  ok(tg.shapeInfo.shafts === 3 && hOf(tg) > hOf(plain) * 1.6, 'tughra : 3 hampes allongées (hauteur ×' + (hOf(tg) / hOf(plain)).toFixed(2) + ')');
  ok(tg.W > plain.W * 1.4, 'tughra : boucles à gauche et traits vers la droite élargissent le tableau');
  // un mot sans hampe (lettres empilées du ruqʿa) n'est pas déformé
  const ruqaa = new K.Font(fs.readFileSync('site/fonts/aref-ruqaa-bold.ttf'));
  const mh = X.buildScene(ruqaa, 'محمود', base({ shape: { type: 'tughra', height: 100 } }));
  ok(mh.shapeInfo.shafts === 0, 'tughra : pas de fausse hampe dans un mot sans alif ni lām');
  save('tughra', tg);
  // 12. médaillon et ailes : trait de liaison de la couleur des ailes, sous le médaillon
  const wg = sceneT('بسم الله\nالرحمن\nالرحيم', { shape: { type: 'wings', ring: 'single', swash: 'on' }, lineInk: ['#7A3B1E', '#1F7A7A', '#1F7A7A'] });
  const wingsL = wg.layers.filter(l => l.role === 'text' && l.fill && l.fill.color === '#1F7A7A');
  const wingsOff = sceneT('بسم الله\nالرحمن\nالرحيم', { shape: { type: 'wings', ring: 'single', swash: 'off' }, lineInk: ['#7A3B1E', '#1F7A7A', '#1F7A7A'] });
  const lenOf = sc => sc.layers.filter(l => l.role === 'text' && l.fill && l.fill.color === '#1F7A7A').reduce((a, l) => a + l.path.length, 0);
  ok(wingsL.length === 1 && lenOf(wg) > lenOf(wingsOff), 'médaillon ailé : le trait de liaison prend la couleur des ailes');
  ok(wg.W > wg.H * 2, 'médaillon ailé : composition en largeur (' + Math.round(wg.W) + '×' + Math.round(wg.H) + ')');
  save('ailes', wg);
  // 13. hilye : 8 compartiments, panneau entier dans le format (proportionnel à la taille)
  const hil = sceneT('بسم الله\nالحمد لله\nأ\nب\nت\nث\nرب العالمين\nالرحمن الرحيم', { shape: { type: 'hilye', palette: 'gold' }, format: { id: 'custom', w: 800, h: 1100 } });
  ok(hil.shapeInfo.compartments === 8 && hil.layers.filter(l => l.role === 'tile').length >= 12, 'hilye : 8 compartiments et leurs fonds');
  const hfit = X.fitSize(thuluth, 'بسم الله\nالحمد لله', base({ shape: { type: 'hilye' }, format: { id: 'custom', w: 800, h: 1100 } }), ['-liga'], 0.84);
  const hil2 = sceneT('بسم الله\nالحمد لله', { size: hfit, shape: { type: 'hilye' }, format: { id: 'custom', w: 800, h: 1100 } });
  ok(hil2.layers.every(l => !l.path || inside(hil2, l)), 'hilye : tout le panneau tient dans le format');
  save('hilye', hil);
  // 14. lettres semées : autour du texte, sans le toucher
  const sc0 = scene('روائع', { format: { id: 'custom', w: 800, h: 800 }, fx: { scatter: { on: true, color: '#9b2c4a', density: 60, size: 22, alpha: true } } });
  const sl = sc0.layers.find(l => l.role === 'scatter'), txt = sc0.layers.find(l => l.role === 'text');
  ok(sl && K.splitContours(sl.path).length >= 10, 'lettres semées : ' + (sl ? K.splitContours(sl.path).length : 0) + ' contours');
  // aucune petite lettre ne recouvre le texte : on teste les points du semis contre le tramage du texte
  const polys = K.flatten(txt.path, 0.5), inTxt = (x, y) => { let w = 0; for (const p of polys) for (let i = 0, n = p.length; i < n; i += 2) { const j = (i + 2) % n, ya = p[i + 1], yb = p[j + 1]; if ((ya <= y && yb > y) || (yb <= y && ya > y)) { const xx = p[i] + (p[j] - p[i]) * (y - ya) / (yb - ya); if (xx > x) w += yb > ya ? 1 : -1; } } return w !== 0; };
  let hits = 0;
  for (const p of K.flatten(sl.path, 1)) for (let i = 0; i < p.length; i += 8) if (inTxt(p[i], p[i + 1])) hits++;
  ok(hits === 0, 'lettres semées : aucune ne touche le texte');
  save('semees', sc0);
  // 15. exports vectoriels d'une mosaïque
  const pdf = await X.sceneToPDF(tiles, { title: 'mosaique' }), eps = X.sceneToEPS(tiles, { titleAscii: 'mosaique' });
  ok(pdf.length > 2000 && /%%EOF/.test(eps.slice(-100)), 'mosaïque : PDF et EPS produits');
  console.log(fails ? fails + ' échec(s)' : 'compositions : tout est bon');
  process.exitCode = fails ? 1 : 0;
})().catch(e => { console.error(e); process.exit(1); });
