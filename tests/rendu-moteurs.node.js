// Rendu de scènes variées dans les 4 moteurs (SVG Chromium, Canvas, PDF poppler, EPS ghostscript) et comparaison.
// Usage : node tests/rendu-moteurs.node.js [filtre] (Linux : poppler-utils, ghostscript, python3 avec Pillow et numpy)
const { launch, BASE } = require('./env');
globalThis.self = globalThis;
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
require('../src/engine.js'); require('../src/shape.js'); require('../src/fx.js'); require('../src/ornament.js'); require('../src/export.js');
globalThis.ClipperLib = require('clipper-lib');
const K = globalThis.Khatt, X = globalThis.KhattExport;
const OUT = 'out/render';
const only = process.argv[2] || '';
const GOLD = [{ c: '#f3d688', p: 0 }, { c: '#9a7420', p: 1 }];
const base = (o) => Object.assign({
  size: 140, lineHeight: 1.1, align: 'center', fill: { type: 'linear', stops: GOLD, angle: 90 }, stroke: { on: false }, shadow: { on: false },
  bg: { type: 'solid', color: '#0e1a3a' }, format: { id: 'auto', margin: 40 }, shape: { type: 'straight', width: 100 }, fx: {}
}, o);
const CASES = [
  // régressions (fonctions existantes)
  ['old-shadow', 'aref-ruqaa', 'الخط العربي', base({ shadow: { on: true, color: '#000000', opacity: 0.45, dx: 6, dy: 8, blur: 10 } })],
  ['old-stroke', 'gulzar', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ\nالحمد لله', base({ size: 90, fill: { type: 'solid', color: '#1b1b1b' }, stroke: { on: true, color: '#c9a227', width: 3 }, bg: { type: 'linear', stops: [{ c: '#f6ebd2', p: 0 }, { c: '#e2cfa2', p: 1 }], angle: 90 }, format: { id: 'square', w: 1080, h: 1080 } })],
  ['old-circle', 'amiri', 'بسم الله الرحمن الرحيم', base({ shape: { type: 'circle', cover: 100, ring: 'double', ringW: 8, width: 100 }, bg: { type: 'none' }, fill: { type: 'solid', color: '#14213d' } })],
  // effets
  ['fx-extrude', 'reem-kufi', 'الخط العربي', base({ size: 160, fx: { extrude: { on: true, angle: 45, depth: 10, color: '#7a5a12' } }, shadow: { on: true, color: '#000000', opacity: 0.4, dx: 4, dy: 6, blur: 8 } })],
  ['fx-glow', 'aref-ruqaa', 'نور', base({ size: 200, fill: { type: 'solid', color: '#fff7e0' }, fx: { glow: { on: true, color: '#00f5d4', size: 14, strength: 0.9 } }, bg: { type: 'solid', color: '#07060f' } })],
  ['fx-outline', 'lalezar', 'مرحبا', base({ size: 170, fill: { type: 'solid', color: '#c62828' }, fx: { outline: { on: true, color: '#ffffff', gap: 2, width: 5 } }, shadow: { on: true, color: '#000000', opacity: 0.3, dx: 3, dy: 4, blur: 6 }, bg: { type: 'none' } })],
  ['fx-hollow', 'el-messiri', 'الحمد لله', base({ size: 150, fill: { type: 'linear', stops: [{ c: '#00f5d4', p: 0 }, { c: '#9b5de5', p: 0.5 }, { c: '#f15bb5', p: 1 }], angle: 0 }, fx: { hollow: { on: true, width: 2.5 } } })],
  ['fx-weight', 'tajawal-extralight', 'الخط العربي', base({ size: 150, fill: { type: 'solid', color: '#1b1712' }, fx: { weight: 3 }, bg: { type: 'solid', color: '#f7edd5' } })],
  ['fx-marks', 'amiri', 'بِسْمِ اللَّهِ الرَّحْمَٰنِ', base({ size: 120, fill: { type: 'solid', color: '#1b1712' }, fx: { marks: { on: true, color: '#c62828' }, dots: { on: true, color: '#0f5e4a' } }, bg: { type: 'linear', stops: [{ c: '#f7edd5', p: 0 }, { c: '#e6d2a4', p: 1 }], angle: 90 } })],
  // cadres et motifs
  ['frame-star8', 'aref-ruqaa', 'السلام', base({ size: 150, frame: { type: 'star8', width: 3, double: true, pad: 16, color: 'ink', panel: '#13284f' }, pattern: { type: 'stars8', color: '#e3c06a', opacity: 0.18, scale: 10 } })],
  ['frame-arch', 'amiri', 'بسم الله', base({ size: 120, fill: { type: 'solid', color: '#0b3b2e' }, frame: { type: 'arch', width: 2, double: false, pad: 14, color: '#c9a227', panel: '#fbf4e2' }, bg: { type: 'solid', color: '#0b3b2e' }, pattern: { type: 'hex', color: '#c9a227', opacity: 0.3, scale: 8 } })],
  ['frame-page', 'reem-kufi', 'الخط العربي', base({ size: 150, frame: { type: 'round', width: 1.5, double: true, fit: 'page', color: 'ink' }, format: { id: 'landscape', w: 1920, h: 1080 }, pattern: { type: 'circles', color: '#ffffff', opacity: 0.08, scale: 14 } })],
  // formes nouvelles
  ['shape-seal', 'reem-kufi', 'الخط العربي\n٢٠٢٦\nفن وجمال', base({ size: 90, shape: { type: 'seal', cover: 75, ring: 'double', ringW: 7, sep: 'star', width: 100 }, bg: { type: 'none' }, fill: { type: 'solid', color: '#8e0b14' } })],
  ['shape-heart', 'aref-ruqaa', 'أحبك في الله', base({ size: 110, shape: { type: 'heart', cover: 60, ring: 'single', ringW: 8, width: 100 }, fill: { type: 'solid', color: '#c62828' }, bg: { type: 'solid', color: '#fdf0f2' } })],
  ['shape-polygon', 'reem-kufi', 'بسم الله الرحمن الرحيم', base({ size: 90, shape: { type: 'polygon', sides: 8, round: 35, cover: 85, ring: 'double', ringW: 6, width: 100 }, fill: { type: 'solid', color: '#1e3a8a' }, bg: { type: 'solid', color: '#ffffff' } })],
  ['shape-mirror', 'aref-ruqaa', 'علي', base({ size: 180, shape: { type: 'straight', width: 100, repeat: 'mirror', mgap: -10 } })],
  ['shape-rosette', 'reem-kufi', 'الله', base({ size: 120, shape: { type: 'arc', bend: 40, width: 100, repeat: 'rosette', copies: 6, spread: 100 } })],
  ['shape-env', 'cairo', 'الخط العربي', base({ size: 150, fill: { type: 'solid', color: '#1b1712' }, bg: { type: 'solid', color: '#ffffff' }, shape: { type: 'dome', intensity: 60, width: 100 } })],
  ['shape-cyl', 'cairo', 'الخط العربي الجميل', base({ size: 120, fill: { type: 'solid', color: '#1b1712' }, bg: { type: 'solid', color: '#ffffff' }, shape: { type: 'cylinder', intensity: 70, width: 100 } })],
  // police en couleur
  ['color-font', 'cairo-play', 'بنت الخط العربي', base({ size: 140, fill: { type: 'solid', color: '#1b1712' }, bg: { type: 'solid', color: '#ffffff' } })]
];
const FONTFILE = { 'cairo-play': 'site/fonts/cairo-play.ttf' };
(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  fs.mkdirSync(OUT, { recursive: true });
  const scenes = {};
  const fonts = {};
  for (const [id, font, text, st] of CASES) {
    if (only && !id.includes(only)) continue;
    const file = FONTFILE[font] || 'site/fonts/' + font + '.ttf';
    if (!fs.existsSync(file)) { console.log('SKIP', id, file); continue; }
    const f = fonts[font] || (fonts[font] = new K.Font(fs.readFileSync(file)));
    const chk = K.checkSupport(f, text);
    const t0 = Date.now();
    const sc = X.buildScene(f, chk.text, st, null, { quality: 'export' });
    const ms = Date.now() - t0;
    fs.writeFileSync(`${OUT}/${id}.svg`, X.sceneToSVG(sc, { title: text }));
    fs.writeFileSync(`${OUT}/${id}.pdf`, await X.sceneToPDF(sc, { title: text }));
    fs.writeFileSync(`${OUT}/${id}.eps`, X.sceneToEPS(sc, { titleAscii: id }));
    fs.writeFileSync(`${OUT}/${id}.dxf`, X.sceneToDXF(sc));
    scenes[id] = { W: sc.W, H: sc.H, layers: sc.layers.map(l => Object.assign({}, l, { _p2d: undefined, _bb: undefined, _pdf: undefined })), st: sc.st };
    console.log(id.padEnd(14), 'W×H', sc.W, sc.H, 'layers', sc.layers.map(l => l.role).join(','), ms + ' ms', sc.pending ? 'PENDING' : '');
  }
  const browser = await launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.addScriptTag({ content: 'window.self=window;' + fs.readFileSync('src/engine.js', 'utf8') });
  await page.addScriptTag({ content: fs.readFileSync('src/export.js', 'utf8') });
  for (const id of Object.keys(scenes)) {
    const s = scenes[id];
    const png = await page.evaluate(async (s) => {
      const cv = document.createElement('canvas'); cv.width = Math.ceil(s.W); cv.height = Math.ceil(s.H);
      KhattExport.drawScene(cv.getContext('2d'), s, 1, null);
      return cv.toDataURL('image/png');
    }, s);
    fs.writeFileSync(`${OUT}/${id}-canvas.png`, Buffer.from(png.split(',')[1], 'base64'));
    const svg = fs.readFileSync(`${OUT}/${id}.svg`, 'utf8');
    const png2 = await page.evaluate(async ({ svg, W, H }) => {
      const img = new Image();
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
      await img.decode();
      const cv = document.createElement('canvas'); cv.width = Math.ceil(W); cv.height = Math.ceil(H);
      cv.getContext('2d').drawImage(img, 0, 0, Math.ceil(W), Math.ceil(H));
      return cv.toDataURL('image/png');
    }, { svg, W: s.W, H: s.H });
    fs.writeFileSync(`${OUT}/${id}-svg.png`, Buffer.from(png2.split(',')[1], 'base64'));
    execFileSync('pdftoppm', ['-r', '72', '-png', '-singlefile', `${OUT}/${id}.pdf`, `${OUT}/${id}-pdf`]);
    execFileSync('gs', ['-q', '-dNOPAUSE', '-dBATCH', '-dSAFER', '-dEPSCrop', '-sDEVICE=png16m', '-r72', '-dTextAlphaBits=4', '-dGraphicsAlphaBits=4', `-sOutputFile=${OUT}/${id}-eps.png`, `${OUT}/${id}.eps`]);
  }
  await browser.close();
  fs.writeFileSync(`${OUT}/scenes.json`, JSON.stringify(Object.fromEntries(Object.entries(scenes).map(([k, v]) => [k, { W: v.W, H: v.H }]))));
  // comparaison
  const py = `
import json
from PIL import Image, ImageDraw
import numpy as np
sc = json.load(open('${OUT}/scenes.json'))
for id in sc:
    ims = {}
    for k in ['svg','canvas','pdf','eps']:
        im = Image.open(f'${OUT}/{id}-{k}.png').convert('RGBA')
        bg = Image.new('RGBA', im.size, (255,255,255,255)); bg.alpha_composite(im)
        ims[k] = bg.convert('RGB')
    W, H = ims['svg'].size
    out = []
    a0 = np.asarray(ims['svg'].resize((max(1,W//3), max(1,H//3)), Image.BILINEAR)).astype(float)
    for k in ['canvas','pdf','eps']:
        a = np.asarray(ims[k].resize((max(1,W//3), max(1,H//3)), Image.BILINEAR)).astype(float)
        if a.shape != a0.shape: out.append(f'{k}: taille {ims[k].size}'); continue
        out.append(f'{k} {np.abs(a-a0).mean():.2f}')
    print(id.ljust(14), ' | '.join(out))
    w = 360; h = max(1, int(H * w / W))
    sheet = Image.new('RGB', (w*4+30, h+18), 'white'); d = ImageDraw.Draw(sheet)
    for i,k in enumerate(['svg','canvas','pdf','eps']):
        sheet.paste(ims[k].resize((w,h), Image.LANCZOS), (i*(w+10), 18)); d.text((i*(w+10)+3, 3), id + ' ' + k, fill='black')
    sheet.save(f'${OUT}/cmp-{id}.png')
`;
  console.log(execFileSync('python3', ['-c', py]).toString());
})().catch(e => { console.error(e); process.exit(1); });
