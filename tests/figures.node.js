// Figures (calligraphie figurative) : silhouettes et leurs détails, sens, miroir du papillon,
// remplissage par la phrase et découpage des lignes
globalThis.self = globalThis;
const fs = require('fs');
globalThis.ClipperLib = require('clipper-lib');
for (const f of ['engine', 'shape', 'fx', 'ornament', 'export']) require('../src/' + f + '.js');
const K = globalThis.Khatt, X = globalThis.KhattExport, S = globalThis.KhattShape;
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const area = p => { let a = 0; for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length; a += p[i] * p[j + 1] - p[j] * p[i + 1]; } return a / 2; };
const box = p => { const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }; for (let i = 0; i < p.length; i += 2) { b.x0 = Math.min(b.x0, p[i]); b.x1 = Math.max(b.x1, p[i]); b.y0 = Math.min(b.y0, p[i + 1]); b.y1 = Math.max(b.y1, p[i + 1]); } return b; };
const within = (b, a) => b.x0 >= a.x0 && b.x1 <= a.x1 && b.y0 >= a.y0 && b.y1 <= a.y1;
function inPoly(P, x, y) {
  let c = false;
  for (let i = 0, j = P.length - 2; i < P.length; j = i, i += 2) {
    const yi = P[i + 1], yj = P[j + 1];
    if ((yi > y) !== (yj > y) && x < (P[j] - P[i]) * (y - yi) / (yj - yi) + P[i]) c = !c;
  }
  return c;
}
const base = o => Object.assign({ size: 100, lineHeight: 1.15, align: 'center', fill: { type: 'solid', color: '#111111' }, stroke: { on: false }, shadow: { on: false }, fx: {}, frame: { type: 'none' }, pattern: { type: 'none' }, bg: { type: 'solid', color: '#ffffff' }, format: { id: 'auto', margin: 20 }, phys: { on: false } }, o);
const FILL = o => Object.assign({ type: 'fill', wrap: 'auto', grow: 45, stretch: 30, lead: 10, ring: 'single', ringW: 5 }, o);

(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  fs.mkdirSync('out/figures', { recursive: true });
  const amiri = new K.Font(fs.readFileSync('site/fonts/amiri-bold.ttf'));
  const scene = (text, o) => X.buildScene(amiri, K.checkSupport(amiri, text).text, base(o));
  const textBox = sc => K.pathBBox(sc.layers.find(l => l.role === 'text').path);
  const inside = (sc, l) => { const b = K.pathBBox(l.path); return b.x >= -0.5 && b.y >= -0.5 && b.x + b.w <= sc.W + 0.5 && b.y + b.h <= sc.H + 0.5; };

  ok(S.FIG_KINDS.length === 13 && S.FIG_KINDS.every(k => S.FILL_KINDS.includes(k)), '13 figures dans les formes à remplir : ' + S.FIG_KINDS.join(', '));
  // 1. chaque figure : corps à remplir, pièces pleines et trous bien orientés ; les trous sont dans une pièce ;
  //    les pièces ne mordent pas sur le corps (le texte), dans les deux sens
  for (const k of S.FIG_KINDS) {
    const why = [];
    for (const left of [false, true]) {
      const f = S.figure(k, 100, left), B = box(f.body);
      if (!(area(f.body) > 0) || Math.abs(B.y1 - B.y0 - 2) > 1e-6) why.push('corps');
      const solids = f.decor.filter(d => area(d) > 0), holes = f.decor.filter(d => area(d) < 0);
      if (k !== 'star8' && !solids.length) why.push('aucun détail');
      if (!holes.every(h => solids.some(s => within(box(h), box(s))))) why.push('trou hors d’une pièce');
      let n = 0, hit = 0;
      for (const d of solids) for (let i = 0; i < d.length; i += 2) { n++; if (inPoly(f.body, d[i], d[i + 1])) hit++; }
      if (hit > Math.max(2, n * 0.04)) why.push(hit + ' points de détail dans le texte' + (left ? ' (à gauche)' : ''));
    }
    ok(!why.length, 'figure « ' + k + ' » : corps, détails et trous en place' + (why.length ? ' — ' + why.join(', ') : ''));
  }
  // 2. sens : la tête du poisson est à droite, puis à gauche ; le corps est le reflet exact
  const fr = S.figure('fish', 100, false), fl = S.figure('fish', 100, true);
  const cx = p => { const b = box(p); return (b.x0 + b.x1) / 2; };
  ok(cx(fr.decor[0]) > 0.5 && cx(fl.decor[0]) < -0.5 && Math.abs(box(fr.body).x1 + box(fl.body).x0) < 1e-9, 'poisson tourné vers la gauche : tête à gauche, corps en miroir');
  // proportion : plus étroite au-delà de 100 %
  ok(box(S.figure('vase', 150, false).body).x1 < box(S.figure('vase', 100, false).body).x1 * 0.7, 'proportion 150 % : vase plus étroit');

  // 3. la phrase remplit chaque figure, avec sa bordure et ses détails ; tout tient dans l'image
  const verse = 'وجعلنا من الماء كل شيء حي';
  for (const k of S.FIG_KINDS) {
    const sc = scene(verse, { shape: FILL({ fillShape: k }) });
    const allIn = sc.layers.every(l => !l.path || inside(sc, l));
    ok(sc.shapeInfo.rows >= 2 && allIn, 'scène « ' + k + ' » : ' + sc.shapeInfo.rows + ' lignes, tout dans le cadre (' + Math.round(sc.W) + '×' + Math.round(sc.H) + ')');
    fs.writeFileSync('out/figures/' + k + '.svg', X.sceneToSVG(sc, { title: k }));
  }
  // 4. sans les détails, le dessin s'allège ; sans bordure non plus
  const len = sc => sc.layers.find(l => l.role === 'text').path.length;
  const withD = scene(verse, { shape: FILL({ fillShape: 'mosque' }) }), noD = scene(verse, { shape: FILL({ fillShape: 'mosque', decor: 'off' }) }), noR = scene(verse, { shape: FILL({ fillShape: 'mosque', decor: 'off', ring: 'none' }) });
  ok(len(withD) > len(noD) && len(noD) > len(noR) && withD.W > noD.W, 'mosquée : minarets et bordure retirables (' + len(withD) + ' > ' + len(noD) + ' > ' + len(noR) + ')');
  // 5. papillon : chaque ligne est reflétée sur l'autre aile ; le texte est symétrique autour du corps
  const bf = scene('سبحان الله وبحمده', { shape: FILL({ fillShape: 'butterfly' }) });
  const tb = textBox(bf), bfo = scene('سبحان الله وبحمده', { shape: FILL({ fillShape: 'oval' }) });
  ok(len(bf) > len(bfo) * 1.5 && Math.abs(tb.x + tb.w / 2 - (bf.content.x + bf.content.w / 2)) < tb.w * 0.02, 'papillon : la phrase et son reflet, symétriques');
  fs.writeFileSync('out/figures/papillon.svg', X.sceneToSVG(bf, { title: 'papillon' }));
  // oiseaux affrontés : un oiseau tourné vers la gauche et la composition miroir
  const pair = scene('السلام عليكم', { shape: FILL({ fillShape: 'bird', face: 'left', repeat: 'mirror', mgap: 6 }) });
  ok(pair.W > pair.H * 1.8, 'oiseaux affrontés : deux oiseaux côte à côte (' + Math.round(pair.W) + '×' + Math.round(pair.H) + ')');
  fs.writeFileSync('out/figures/oiseaux.svg', X.sceneToSVG(pair, { title: 'oiseaux' }));

  // 6. découpage des lignes : un verset long remplit l'arbre en plusieurs lignes, la barque met sa formule
  //    dans la voile et la coque ; aucune ligne minuscule à côté des autres
  const tree = 'ألم تر كيف ضرب الله مثلا كلمة طيبة كشجرة طيبة أصلها ثابت وفرعها في السماء';
  const rowsOf = (t, k) => X.wrapForShape(amiri, K.checkSupport(amiri, t).text, { size: 100, shape: FILL({ fillShape: k }) }).split('\n');
  ok(rowsOf(tree, 'tree').length >= 4, 'arbre : le verset en ' + rowsOf(tree, 'tree').length + ' lignes');
  ok(rowsOf('بسم الله مجراها ومرساها', 'boat').length >= 3, 'barque : ' + rowsOf('بسم الله مجراها ومرساها', 'boat').join(' / '));
  const sh = FILL({ fillShape: 'star8' }), P = S.fillLoop('star8', 100), h = (amiri.ascender - amiri.descender);
  for (const t of ['ما شاء الله', 'الله أكبر', 'سبحان الله وبحمده']) {
    const R = rowsOf(t, 'star8').map(r => ({ w: K.layoutText(amiri, r, {})[0].width, h }));
    const f = S.fitRows(R, P, { lead: 0.1, grow: 0.45, stretch: 0.3, score: 'area' }), s = f.rows.map(r => r.s);
    ok(Math.min(...s) >= Math.max(...s) * 0.3, 'étoile, « ' + t + ' » : ' + R.length + ' ligne(s), aucune minuscule');
  }
  // 7. une forme géométrique garde son découpage d'avant (le plus grand texte possible)
  ok(rowsOf('سبحان الله والحمد لله ولا إله إلا الله والله أكبر', 'circle').length >= 2, 'cercle : découpage inchangé');

  console.log(fails ? '\n' + fails + ' échec(s)' : '\nfigures : tout est bon');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
