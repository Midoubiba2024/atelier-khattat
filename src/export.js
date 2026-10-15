/* Scène + exports : SVG, PDF, EPS, DXF, ZIP (et Canvas dans le navigateur). */
(function (root) {
  'use strict';
  const K = root.Khatt;
  const PX2PT = 0.75;            // 96 px = 72 pt
  const PX2MM = 25.4 / 96;

  function hex2rgb(h) {
    h = String(h || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h.slice(0, 6), 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbf(h) { return hex2rgb(h).map(v => v / 255); }
  function mix(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }
  function f2(v) { return K.num(v, 2); }
  function f3(v) { return K.num(v, 3); }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function gradLine(box, angleDeg) {
    const a = (angleDeg || 0) * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a);
    const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
    const half = (Math.abs(box.w * dx) + Math.abs(box.h * dy)) / 2 || 1;
    return { x1: cx - dx * half, y1: cy - dy * half, x2: cx + dx * half, y2: cy + dy * half };
  }

  // ---------------------------------------------------------------------------
  // Peintures : uni, dégradé linéaire ou circulaire, de 2 à 8 couleurs
  // pt = { type:'solid'|'linear'|'radial', color, stops:[{c,p}], angle } (l'ancien format c1/c2 reste accepté)
  // ---------------------------------------------------------------------------
  function isGrad(pt) { return !!pt && (pt.type === 'linear' || pt.type === 'radial'); }
  // arrêts triés, positions bornées à [0,1] et arrondies au 1/10 000 (positions égales = transition nette)
  function gradStops(pt) {
    let s = Array.isArray(pt.stops) && pt.stops.length ? pt.stops
      : [{ c: pt.c1 || pt.color || '#000000', p: 0 }, { c: pt.c2 || pt.color || '#000000', p: 1 }];
    s = s.map((x, i, a) => {
      const p = x.p == null || isNaN(+x.p) ? (a.length > 1 ? i / (a.length - 1) : 0) : Math.min(1, Math.max(0, +x.p));
      return { c: x.c || '#000000', p: Math.round(p * 1e4) / 1e4 };
    }).sort((a, b) => a.p - b.p);
    if (s.length === 1) s.push({ c: s[0].c, p: 1 });
    return s;
  }
  function sampleStops(s, t) {
    if (t <= s[0].p) return s[0].c;
    for (let i = 1; i < s.length; i++) {
      if (t <= s[i].p) { const a = s[i - 1], b = s[i]; return mix(a.c, b.c, b.p - a.p > 1e-9 ? (t - a.p) / (b.p - a.p) : 1); }
    }
    return s[s.length - 1].c;
  }
  // linéaire : segment traversant le cadre selon l'angle ; circulaire : ellipse centrée passant par les coins
  function gradGeom(box, pt) {
    if (pt.type === 'radial') {
      const rx = Math.max(1, box.w) / Math.SQRT2, ry = Math.max(1, box.h) / Math.SQRT2;
      return { radial: true, cx: box.x + box.w / 2, cy: box.y + box.h / 2, r: rx, ky: ry / rx };
    }
    return gradLine(box, pt.angle);
  }
  // l'ellipse = cercle de rayon r aplati verticalement autour du centre
  function ellipseMatrix(g) { return Math.abs(g.ky - 1) > 1e-4 ? [1, 0, 0, g.ky, 0, g.cy * (1 - g.ky)] : null; }
  function svgGradient(id, pt, box) {
    const g = gradGeom(box, pt);
    const stops = gradStops(pt).map(s => `<stop offset="${K.num(s.p, 4)}" stop-color="${s.c}"/>`).join('');
    if (g.radial) {
      const m = ellipseMatrix(g);
      const tr = m ? ` gradientTransform="matrix(1 0 0 ${K.num(m[3], 5)} 0 ${f2(m[5])})"` : '';
      return `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f2(g.cx)}" cy="${f2(g.cy)}" r="${f2(g.r)}"${tr}>${stops}</radialGradient>`;
    }
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f2(g.x1)}" y1="${f2(g.y1)}" x2="${f2(g.x2)}" y2="${f2(g.y2)}">${stops}</linearGradient>`;
  }
  // remplit le Path2D `path` avec la peinture (dégradé) calculée sur le cadre `box`
  function canvasGradFill(ctx, pt, box, path, rule) {
    const g = gradGeom(box, pt), s = gradStops(pt);
    if (!g.radial) {
      const lg = ctx.createLinearGradient(g.x1, g.y1, g.x2, g.y2);
      for (const x of s) lg.addColorStop(x.p, x.c);
      ctx.fillStyle = lg; ctx.fill(path, rule || 'nonzero');
      return;
    }
    const rg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.r);
    for (const x of s) rg.addColorStop(x.p, x.c);
    ctx.save();
    ctx.translate(g.cx, g.cy); ctx.scale(1, g.ky);
    const q = new Path2D();
    q.addPath(path, new DOMMatrix([1, 0, 0, 1 / g.ky, -g.cx, -g.cy / g.ky]));
    ctx.fillStyle = rg; ctx.fill(q, rule || 'nonzero');
    ctx.restore();
  }
  // fonction PDF/PostScript : type 2 (deux couleurs) ou type 3 (assemblage de types 2)
  function shadingFunction(stops) {
    const s = stops.slice();
    if (s[0].p > 0) s.unshift({ c: s[0].c, p: 0 });
    if (s[s.length - 1].p < 1) s.push({ c: s[s.length - 1].c, p: 1 });
    const seg = [];
    for (let i = 0; i < s.length - 1; i++) if (s[i + 1].p - s[i].p > 5e-5) seg.push([s[i], s[i + 1]]);
    const t2 = (a, b) => `<< /FunctionType 2 /Domain [0 1] /C0 [${rgbf(a).map(f3).join(' ')}] /C1 [${rgbf(b).map(f3).join(' ')}] /N 1 >>`;
    if (!seg.length) { const c = s[s.length - 1].c; return t2(c, c); }
    if (seg.length === 1) return t2(seg[0][0].c, seg[0][1].c);
    return `<< /FunctionType 3 /Domain [0 1] /Functions [${seg.map(x => t2(x[0].c, x[1].c)).join(' ')}] /Bounds [${seg.slice(1).map(x => K.num(x[0].p, 4)).join(' ')}] /Encode [${seg.map(() => '0 1').join(' ')}] >>`;
  }
  // dictionnaire de dégradé (identique en PDF et en PostScript) + matrice éventuelle de l'ellipse
  function shadingDict(pt, box) {
    const g = gradGeom(box, pt), fn = shadingFunction(gradStops(pt));
    if (g.radial) {
      return {
        dict: `<< /ShadingType 3 /ColorSpace /DeviceRGB /Coords [${f2(g.cx)} ${f2(g.cy)} 0 ${f2(g.cx)} ${f2(g.cy)} ${f2(g.r)}] /Extend [true true] /Function ${fn} >>`,
        m: ellipseMatrix(g)
      };
    }
    return { dict: `<< /ShadingType 2 /ColorSpace /DeviceRGB /Coords [${f2(g.x1)} ${f2(g.y1)} ${f2(g.x2)} ${f2(g.y2)}] /Extend [true true] /Function ${fn} >>`, m: null };
  }
  const matStr = m => m.map((v, i) => i === 3 ? K.num(v, 6) : f3(v)).join(' ');

  // ---------------------------------------------------------------------------
  // Scène : texte mis en forme, effets, cadre et fond → liste de calques dans le plan de travail
  // ---------------------------------------------------------------------------
  // st = { size, lineHeight, align, wordSpace, fill, stroke:{on,color,width}, shadow:{on,color,opacity,dx,dy,blur},
  //        bg:{type,color,stops,angle,veil,veilColor}, format:{id,w,h,margin}, shape, phys:{on,widthMm},
  //        fx:{ weight, hollow:{on,width}, outline:{on,color,gap,width}, extrude:{on,angle,depth,color,shade},
  //             glow:{on,color,size,strength}, marks:{on,color}, dots:{on,color} },
  //        frame:{type,width,double,pad,color,panel,fit}, pattern:{type,color,opacity,scale,width} }
  // Calque : { role, path, fill?, stroke?:{color,width}, box?, opacity?, blur?, dx?, dy?, evenodd?, fallback?, image? }
  //   fallback (PDF/EPS, sans flou) : 'sharp' = dessiné net, 'skip' = omis, 'rings' = halo par anneaux
  const FXL = () => root.KhattFX, ORN = () => root.KhattOrn, SHP = () => root.KhattShape;
  function pushAll(a, b) { for (let i = 0; i < b.length; i++) a.push(b[i]); return a; }
  const solid = color => ({ type: 'solid', color });
  function boxUnion(a, b) {
    if (!b || !(b.w || b.h)) return a;
    if (!a || !(a.w || a.h)) return { x: b.x, y: b.y, w: b.w, h: b.h };
    const x0 = Math.min(a.x, b.x), y0 = Math.min(a.y, b.y);
    return { x: x0, y: y0, w: Math.max(a.x + a.w, b.x + b.w) - x0, h: Math.max(a.y + a.h, b.y + b.h) - y0 };
  }
  function grow(b, d) { return b ? { x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d } : b; }
  // étendue visible d'un calque (contour, flou, décalage compris)
  function layerExtent(l) {
    let b = l._bb || (l._bb = K.pathBBox(l.path));
    if (!(b.w || b.h)) return null;
    let e = (l.stroke ? l.stroke.width / 2 : 0) + (l.blur || 0);
    b = grow(b, e);
    if (l.dx || l.dy) b = boxUnion(b, { x: b.x + (l.dx || 0), y: b.y + (l.dy || 0), w: b.w, h: b.h });
    return b;
  }
  function moveLayer(l, tx, ty) {
    l.path = K.transformPath(l.path, 1, tx, ty);
    if (l.box) l.box = { x: l.box.x + tx, y: l.box.y + ty, w: l.box.w, h: l.box.h };
    l._bb = null;
  }
  // couleur moyenne d'un fond (EPS : simulation de la transparence)
  function bgAverage(bg) {
    if (!bg) return null;
    if (bg.type === 'solid') return bg.color;
    if (isGrad(bg)) return sampleStops(gradStops(bg), 0.5);
    return null;
  }
  function frameLayers(F, fr, ink) {
    const out = [];
    if (fr.panel && fr.panel !== 'none') out.push({ role: 'panel', path: F.panel, fill: solid(fr.panel) });
    const paint = !fr.color || fr.color === 'ink' ? ink : solid(fr.color);
    if (F.rings.length) out.push({ role: 'frame', path: F.rings, fill: paint, box: F.box });
    return out;
  }

  // Lignes automatiques : la phrase (sur une seule ligne) est coupée entre les mots pour remplir la forme ;
  // on essaie de 1 à 9 lignes, réparties selon la largeur de la forme à leur hauteur, et on garde le plus grand texte
  // (anneaux : une phrase d'une seule ligne donne un mot au centre et deux ou trois anneaux de plus en plus longs)
  function splitWords(ww, sp, words, tg) {
    const total = ww.reduce((a, b) => a + b, 0) + sp * (ww.length - 1);
    const T = tg.reduce((a, b) => a + b, 0), rows = [];
    let cum = 0, ti = 0, bound = tg[0] / T;
    for (let i = 0; i < ww.length; i++) {
      const mid = (cum + ww[i] / 2) / total;
      while (ti < tg.length - 1 && mid > bound) { ti++; bound += tg[ti] / T; }
      const r = rows[ti] || (rows[ti] = { words: [], w: 0 });
      if (r.words.length) r.w += sp;
      r.words.push(words[i]); r.w += ww[i];
      cum += ww[i] + sp;
    }
    return rows.filter(Boolean);
  }
  function wrapForShape(font, text, st, features) {
    const sh = st.shape, S = SHP();
    if (!sh || !S || !((sh.type === 'fill' && sh.wrap !== 'off') || sh.type === 'rings')) return text;
    const src = String(text).replace(/\r/g, '');
    if (src.trim().includes('\n')) return text;
    const words = src.trim().split(/\s+/).filter(Boolean);
    if (words.length < (sh.type === 'rings' ? 3 : 2)) return text;
    const s = (st.size || 100) / font.upem, opt = { features, wordSpace: st.wordSpace };
    const ww = words.map(w => K.layoutText(font, w, opt)[0].width * s);
    const sp = Math.max(0, K.layoutText(font, words[0] + ' ' + words[0], opt)[0].width * s - 2 * ww[0]);
    if (sh.type === 'rings') {
      const rest = words.slice(1), nr = rest.length <= 3 ? 1 : rest.length <= 8 ? 2 : 3;
      return [words[0]].concat(splitWords(ww.slice(1), sp, rest, [1, 1.7, 2.4].slice(0, nr)).map(r => r.words.join(' '))).join('\n');
    }
    const h = (font.ascender - font.descender) * s * 0.8;
    const P = S.fillLoop(sh.fillShape || 'oval', sh.fratio);
    const fo = { lead: (sh.lead == null ? 18 : sh.lead) / 100, grow: (sh.grow == null ? 40 : sh.grow) / 100, stretch: (sh.stretch == null ? 10 : sh.stretch) / 100 };
    let best = null;
    for (let k = 1; k <= Math.min(9, words.length); k++) {
      const tg = [];
      for (let i = 0; i < k; i++) { const c = S.chordAt(P, -0.85 + 1.7 * (i + 0.5) / k, 0); tg.push(c ? Math.max(0.05, c[1] - c[0]) : 0.05); }
      const R = splitWords(ww, sp, words, tg), fit = S.fitRows(R.map(r => ({ w: r.w, h })), P, fo);
      if (fit && (!best || fit.scale > best.score * 1.03)) best = { score: fit.scale, rows: R };
    }
    return best ? best.rows.map(r => r.words.join(' ')).join('\n') : text;
  }

  function buildScene(font, text, st, features, opts) {
    opts = opts || {};
    const size = st.size, fx = st.fx || {};
    text = wrapForShape(font, text, st, features);
    const fine = opts.quality === 'export';
    const tol = Math.max(0.03, size * (fine ? 0.0006 : 0.0018));
    const t = K.buildText(font, text, { size, lineHeight: st.lineHeight, align: st.align, features, wordSpace: st.wordSpace, color: st.colorFont !== false });
    // 1. forme
    let cmds = t.cmds, ranges = t.spans.map(s => [s.i0, s.i1]), rings = [], shapeInfo = {}, panels = [];
    if (st.shape && SHP() && cmds.length) {
      const r = SHP().applyShape(t.cmds, st.shape, size, t.baseline, t.spans, t);
      cmds = r.cmds; ranges = r.ranges; rings = r.rings || []; shapeInfo = r.info || {}; panels = r.panels || [];
    }
    // 2. parties : encre, harakat, points, calques d'une police en couleur
    const wantMarks = !!(fx.marks && fx.marks.on), wantDots = !!(fx.dots && fx.dots.on);
    const base = [], marks = [], dots = [], colors = new Map(), lineParts = new Map();
    const lineInk = Array.isArray(st.lineInk) ? st.lineInk : null;
    t.spans.forEach((s, i) => {
      const r = ranges[i];
      if (!r || r[1] <= r[0]) return;
      const seg = cmds.slice(r[0], r[1]);
      if (s.color) { if (!colors.has(s.color)) colors.set(s.color, []); pushAll(colors.get(s.color), seg); return; }
      if (s.mark && wantMarks) { pushAll(marks, seg); return; }
      // couleur propre à la ligne
      const lc = lineInk && lineInk[s.line] ? lineInk[s.line] : null;
      let target = base;
      if (lc) { if (!lineParts.has(lc)) lineParts.set(lc, []); target = lineParts.get(lc); }
      if (wantDots && !s.mark) {
        const flags = K.dotContours(K.splitContours(t.cmds, s.i0, s.i1), size);
        if (flags.some(Boolean)) {
          // une forme peut répéter le glyphe (anneau complété) : les drapeaux se répètent avec lui
          const ctrs = K.splitContours(seg);
          if (ctrs.length && ctrs.length % flags.length === 0) { ctrs.forEach((c, k) => pushAll(flags[k % flags.length] ? dots : target, c)); return; }
        }
      }
      pushAll(target, seg);
    });
    pushAll(base, rings);
    const colorKeys = Array.from(colors.keys()), lineKeys = Array.from(lineParts.keys());
    let parts = [base, marks, dots].concat(colorKeys.map(k => colors.get(k)), lineKeys.map(k => lineParts.get(k)));
    // 3. composition (miroir, rosace)
    if (st.shape && SHP()) parts = SHP().compose(parts, st.shape);
    // 4. épaisseur
    const fxReady = !!(FXL() && FXL().ready());
    let pending = false;
    const wd = (fx.weight || 0) / 100 * size;
    if (Math.abs(wd) > 0.01) { if (fxReady) parts = parts.map(p => p.length ? FXL().grow(p, wd, tol) : p); else pending = true; }
    const textAll = parts.reduce((a, p) => pushAll(a, p), []);
    const empty = !textAll.length;
    const tb = K.pathBBox(textAll);
    // 5. effets (coordonnées du texte)
    const L = [];
    const sw = st.stroke && st.stroke.on ? st.stroke.width : 0;
    const ink = st.fill || solid('#000000');
    let ext = null;
    if (fx.extrude && fx.extrude.on && !empty) {
      if (fxReady) {
        const a = (fx.extrude.angle == null ? 45 : fx.extrude.angle) * Math.PI / 180, d = Math.max(0.5, (fx.extrude.depth == null ? 8 : fx.extrude.depth) / 100 * size);
        ext = FXL().extrude(textAll, Math.cos(a) * d, Math.sin(a) * d, tol);
      } else pending = true;
    }
    if (fx.glow && fx.glow.on && !empty) {
      const g = fx.glow, r = Math.max(1, (g.size == null ? 12 : g.size) / 100 * size), op = Math.min(1, Math.max(0.05, g.strength == null ? 0.8 : g.strength));
      L.push({ role: 'glow', path: textAll, fill: solid(g.color), stroke: { color: g.color, width: r * 0.5 }, blur: r, opacity: op * 0.85, fallback: 'rings' });
      L.push({ role: 'glow', path: textAll, fill: solid(g.color), stroke: { color: g.color, width: r * 0.2 }, blur: r * 0.35, opacity: op, fallback: 'skip' });
    }
    // liseré calculé avant l'ombre : l'ombre d'un autocollant suit son liseré
    let band = null;
    if (fx.outline && fx.outline.on && !empty) {
      if (fxReady) {
        const o = fx.outline, g = (o.gap == null ? 3 : o.gap) / 100 * size, w = Math.max(0.5, (o.width == null ? 4 : o.width) / 100 * size);
        band = FXL().band(textAll, g, g + w, tol);
      } else pending = true;
    }
    if (st.shadow && st.shadow.on && !empty) {
      const s = st.shadow;
      let sp = ext && ext.length ? pushAll(textAll.slice(), ext) : textAll;
      // ombre de la forme pleine : lettres + liseré (l'écart entre les deux reste vide)
      if (band && band.length) sp = pushAll(sp.slice(), band);
      L.push({ role: 'shadow', path: sp, fill: solid(s.color), stroke: sw ? { color: s.color, width: sw * 2 } : null, dx: s.dx || 0, dy: s.dy || 0, blur: s.blur || 0, opacity: s.opacity == null ? 1 : s.opacity, fallback: 'sharp' });
    }
    if (ext && ext.length) {
      const e = fx.extrude, col = e.color || '#6b4f1d';
      const paint = e.shade === false ? solid(col) : { type: 'linear', stops: [{ c: col, p: 0 }, { c: mix(col, '#000000', 0.55), p: 1 }], angle: e.angle == null ? 45 : e.angle };
      L.push({ role: 'extrude', path: ext, fill: paint, box: K.pathBBox(ext) });
    }
    if (band && band.length) L.push({ role: 'outline', path: band, fill: solid(fx.outline.color || '#ffffff') });
    // contre-formes : l'intérieur des boucles des lettres (ه، و، م…) rempli d'une couleur, sous le contour et l'encre
    if (fx.counters && fx.counters.on && !empty) {
      const holes = counterHoles(textAll, tol);
      if (holes.length) L.push({ role: 'counter', path: holes, fill: solid(fx.counters.color || '#ffffff') });
    }
    if (sw && !empty) L.push({ role: 'stroke', path: textAll, stroke: { color: st.stroke.color, width: sw * 2 } });
    let hollowW = 0;
    if (fx.hollow && fx.hollow.on) { if (fxReady) hollowW = Math.max(0.4, (fx.hollow.width == null ? 3 : fx.hollow.width) / 100 * size); else pending = true; }
    const body = p => hollowW ? FXL().band(p, -hollowW, 0, tol) : p;
    if (parts[0].length) L.push({ role: 'text', path: body(parts[0]), fill: ink, box: tb });
    if (parts[1].length) L.push({ role: 'marks', path: body(parts[1]), fill: solid(fx.marks.color || '#c62828') });
    if (parts[2].length) L.push({ role: 'dots', path: body(parts[2]), fill: solid(fx.dots.color || '#c62828') });
    colorKeys.forEach((k, i) => { const p = parts[3 + i]; if (p && p.length) L.push({ role: 'color', path: body(p), fill: solid(k) }); });
    lineKeys.forEach((k, i) => { const p = parts[3 + colorKeys.length + i]; if (p && p.length) L.push({ role: 'text', path: body(p), fill: solid(k) }); });
    // tuiles colorées de la forme (mosaïque), sous les effets et le texte
    const PL = panels.filter(p => p.path && p.path.length).map(p => ({ role: 'tile', path: p.path, fill: solid(p.color) }));
    // 6. cadre autour du texte et de ses effets pleins
    const fr = st.frame || {};
    const fm = st.format || { id: 'auto', margin: 40 };
    const frameOn = !!(fr.type && fr.type !== 'none' && ORN() && !empty);
    const pageFit = frameOn && fr.fit === 'page' && fm.id !== 'auto';
    const fw = Math.max(0.5, (fr.width == null ? 2.5 : fr.width) / 100 * size);
    let F = null, FL = [];
    if (frameOn && !pageFit) {
      let solidBox = tb;
      for (const l of L) if (l.role === 'extrude' || l.role === 'outline' || l.role === 'stroke') solidBox = boxUnion(solidBox, layerExtent(l));
      F = ORN().frame({ type: fr.type, pad: (fr.pad == null ? 14 : fr.pad) / 100 * size, width: fw, double: !!fr.double, dash: !!fr.dash }, solidBox, tol);
      if (F) FL = frameLayers(F, fr, ink);
    }
    // 7. étendue du contenu et plan de travail
    let ex = null;
    for (const l of FL.concat(PL, L)) ex = boxUnion(ex, layerExtent(l));
    if (!ex) ex = { x: 0, y: 0, w: 1, h: 1 };
    const cw = ex.w, ch = ex.h;
    let W, H, tx, ty;
    if (fm.id === 'auto') {
      const m = fm.margin == null ? 40 : fm.margin;
      W = Math.max(1, Math.ceil(cw + 2 * m)); H = Math.max(1, Math.ceil(ch + 2 * m));
    } else { W = fm.w; H = fm.h; }
    tx = (W - cw) / 2 - ex.x; ty = (H - ch) / 2 - ex.y;
    for (const l of FL.concat(PL, L)) moveLayer(l, tx, ty);
    if (pageFit) {
      const m = Math.min(W, H) * 0.045;
      F = ORN().frame({ type: fr.type, width: fw, double: !!fr.double, dash: !!fr.dash, page: { x: m + fw, y: m + fw, w: W - 2 * (m + fw), h: H - 2 * (m + fw) } }, null, tol);
      if (F) FL = frameLayers(F, fr, ink);
    }
    // 8. fond et motif
    const layers = [];
    const bg = st.bg || { type: 'none' };
    const rect = [0, 0, 0, 1, W, 0, 1, W, H, 1, 0, H, 4];
    if (bg.type === 'solid') layers.push({ role: 'bg', path: rect, fill: solid(bg.color) });
    else if (isGrad(bg)) layers.push({ role: 'bg', path: rect, fill: bg, box: { x: 0, y: 0, w: W, h: H } });
    else if (bg.type === 'image') layers.push({ role: 'bg', image: true, path: rect });
    const pt = st.pattern;
    if (pt && pt.type === 'words') {
      const P = wordsPattern(font, pt, text, W, H, features);
      if (P.length) layers.push({ role: 'pattern', path: P, fill: solid(pt.color || '#c9a227'), opacity: pt.opacity == null ? 0.25 : pt.opacity });
    } else if (pt && pt.type && pt.type !== 'none' && ORN()) {
      const cell = Math.max(8, (pt.scale == null ? 12 : pt.scale) / 100 * Math.min(W, H));
      const P = ORN().pattern(pt.type, W, H, cell);
      if (P && P.cmds.length) {
        const lw = Math.max(0.3, cell * 0.03 * ((pt.width == null ? 100 : pt.width) / 100));
        const op = pt.opacity == null ? 0.25 : pt.opacity;
        if (P.multi && pt.colorful) {
          // points en couleurs : la couleur du motif, puis rouge, bleu, vert et or
          const cols = [pt.color || '#c9a227', '#C62828', '#1E5AA8', '#2E7D32', '#E0A21B'];
          P.multi.forEach((m, k) => { if (m.length) layers.push({ role: 'pattern', path: m, fill: solid(cols[k % cols.length]), opacity: op }); });
        } else layers.push(P.fill ? { role: 'pattern', path: P.cmds, fill: solid(pt.color || '#c9a227'), opacity: op }
          : { role: 'pattern', path: P.cmds, stroke: { color: pt.color || '#c9a227', width: lw }, opacity: op });
      }
    }
    pushAll(layers, FL); pushAll(layers, PL); pushAll(layers, L);
    const path = K.transformPath(textAll, 1, tx, ty);
    let cutPath = path;
    if (F && F.rings.length) cutPath = path.concat(FL.find(l => l.role === 'frame').path);
    const box = { x: tb.x + tx, y: tb.y + ty, w: tb.w, h: tb.h };
    const content = { x: ex.x + tx, y: ex.y + ty, w: cw, h: ch };
    const overflow = fm.id !== 'auto' && (content.x < -0.5 || content.y < -0.5 || content.x + cw > W + 0.5 || content.y + ch > H + 0.5);
    // échelle physique : 96 px par pouce, ou largeur réelle imposée (en mm)
    const mmPerPx = st.phys && st.phys.on && st.phys.widthMm > 0 ? st.phys.widthMm / W : PX2MM;
    return { W, H, layers, path, cutPath, box, content, overflow, st, mmPerPx, shapeInfo, empty, pending, bgSolid: bgAverage(bg) };
  }
  // trous des lettres (contre-formes) : contours d'orientation contraire à celle des contours extérieurs
  function counterHoles(c, tol) {
    const info = K.splitContours(c).map(k => { const p = K.flatten(k, Math.max(0.2, tol * 4))[0] || []; return { c: k, a: p.length >= 6 ? K.polyArea(p) : 0 }; });
    let sum = 0;
    for (const x of info) sum += x.a;
    const sg = sum < 0 ? -1 : 1, out = [];
    for (const x of info) if (x.a * sg < 0 && Math.abs(x.a) > 1e-6) pushAll(out, x.c);
    return out;
  }
  // fond d'écriture : un mot (ou la phrase) répété en rangées décalées, légèrement incliné une rangée sur deux
  function wordsPattern(font, pt, text, W, H, features) {
    let w = String(pt.text || '').trim();
    if (!w) w = String(text).split('\n').map(l => l.trim()).filter(Boolean)[0] || '';
    w = w.split(/\s+/).slice(0, 3).join(' ');
    if (!w) return [];
    const cell = Math.max(8, (pt.scale == null ? 12 : pt.scale) / 100 * Math.min(W, H));
    const t = K.buildText(font, w, { size: cell * 0.62, features, color: false });
    if (!t.cmds.length) return [];
    const b = K.pathBBox(t.cmds), stepX = b.w + cell * 0.55, stepY = b.h + cell * 0.35;
    const nx = Math.ceil(W / stepX) + 2, ny = Math.ceil(H / stepY) + 2;
    if (nx * ny > 900) return [];
    const out = [], S = SHP();
    for (let j = -1; j < ny; j++) {
      const a = (j % 2 ? -6 : 5) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      for (let i = -1; i < nx; i++) {
        const cx = i * stepX + (j % 2 ? stepX / 2 : 0), cy = j * stepY;
        pushAll(out, S.eachPoint(t.cmds, (x, y) => { const dx = x - b.x - b.w / 2, dy = y - b.y - b.h / 2; return [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca]; }));
      }
    }
    return out;
  }
  // taille maximale pour faire tenir le contenu dans un format fixe
  function fitSize(font, text, st, features, ratio) {
    const probe = Object.assign({}, st, { size: 100, format: { id: 'auto', margin: 0 } });
    const sc = buildScene(font, text, probe, features);
    const fm = st.format;
    if (!sc.content.w || !sc.content.h) return st.size;
    const k = Math.min(fm.w * ratio / sc.content.w, fm.h * ratio / sc.content.h);
    return Math.max(8, Math.floor(100 * k));
  }

  // ---------------------------------------------------------------------------
  // SVG
  // ---------------------------------------------------------------------------
  function sceneToSVG(sc, opt) {
    opt = opt || {};
    const P = opt.idPrefix || 'kg';
    const W = sc.W, H = sc.H;
    let defs = '', body = '', gi = 0;
    const filters = new Map();
    const paint = (pt, box) => {
      if (!pt) return 'none';
      if (isGrad(pt)) { const id = P + '-g' + (++gi); defs += svgGradient(id, pt, box || { x: 0, y: 0, w: W, h: H }); return 'url(#' + id + ')'; }
      return pt.color;
    };
    // calques nommés (Illustrator, Inkscape) ; dans la page : attribut data-layer
    const ROLE = { bg: 'fond', pattern: 'motif', panel: 'fond-cadre', tile: 'tuiles', counter: 'contre-formes', frame: 'cadre', glow: 'halo', shadow: 'ombre', extrude: 'relief', outline: 'lisere', stroke: 'contour', text: 'texte', marks: 'harakat', dots: 'points', color: 'couleurs' };
    const seen = new Map();
    const label = r => { const b = ROLE[r] || 'calque', n = (seen.get(b) || 0) + 1; seen.set(b, n); return opt.inline ? ` data-layer="${b}"` : ` id="${b}${n > 1 ? '-' + n : ''}"`; };
    for (const l of sc.layers) {
      if (l.image) {
        if (opt.imageHref) {
          body += `<image x="0" y="0" width="${f2(W)}" height="${f2(H)}" preserveAspectRatio="xMidYMid slice" xlink:href="${opt.imageHref}" href="${opt.imageHref}"/>`;
          const bg = sc.st.bg;
          if (bg.veil > 0 && !opt.veilBaked) body += `<rect width="${f2(W)}" height="${f2(H)}" fill="${bg.veilColor === 'light' ? '#FFFFFF' : '#000000'}" fill-opacity="${f3(bg.veil)}"/>`;
        }
        continue;
      }
      const d = l._svg || (l._svg = K.toSVGPath(l.path, 2));
      if (!d) continue;
      const op = l.opacity == null ? 1 : l.opacity;
      let a = ' fill="' + paint(l.fill, l.box) + '"';
      if (l.fill && op < 1) a += ' fill-opacity="' + f3(op) + '"';
      if (l.evenodd) a += ' fill-rule="evenodd"';
      if (l.stroke) {
        a += ` stroke="${l.stroke.color}" stroke-width="${f2(l.stroke.width)}" stroke-linejoin="round" stroke-linecap="round"`;
        if (op < 1) a += ' stroke-opacity="' + f3(op) + '"';
      }
      let g = '';
      if (l.dx || l.dy) g += ` transform="translate(${f2(l.dx || 0)} ${f2(l.dy || 0)})"`;
      if (l.blur > 0) {
        const key = f2(l.blur);
        let id = filters.get(key);
        if (!id) {
          id = P + '-f' + (filters.size + 1);
          filters.set(key, id);
          defs += `<filter id="${id}" filterUnits="userSpaceOnUse" x="${f2(-W * 0.1)}" y="${f2(-H * 0.1)}" width="${f2(W * 1.2)}" height="${f2(H * 1.2)}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${f2(l.blur / 2)}"/></filter>`;
        }
        g += ` filter="url(#${id})"`;
      }
      const el = '<path' + label(l.role) + ' d="' + d + '"' + a + '/>';
      body += g ? '<g' + g + '>' + el + '</g>' : el;
    }
    const title = opt.title ? `<title>${esc(opt.title)}</title>` : '';
    const phys = sc.mmPerPx && Math.abs(sc.mmPerPx - PX2MM) > 1e-9;
    const size = opt.inline ? '' : phys ? ` width="${f2(W * sc.mmPerPx)}mm" height="${f2(H * sc.mmPerPx)}mm"` : ` width="${f2(W)}" height="${f2(H)}"`;
    return (opt.inline ? '' : '<?xml version="1.0" encoding="UTF-8"?>\n') +
      `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"${size} viewBox="0 0 ${f2(W)} ${f2(H)}">${title}${defs ? '<defs>' + defs + '</defs>' : ''}${body}</svg>`;
  }

  // ---------------------------------------------------------------------------
  // Canvas (PNG / JPG / WEBP)
  // ---------------------------------------------------------------------------
  function drawScene(ctx, sc, scale, img) {
    const W = sc.W, H = sc.H;
    ctx.save();
    ctx.scale(scale, scale);
    for (const l of sc.layers) {
      if (l.image) {
        if (!img) continue;
        const bg = sc.st.bg;
        const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(W / iw, H / ih);
        ctx.drawImage(img, (W - iw * k) / 2, (H - ih * k) / 2, iw * k, ih * k);
        if (bg.veil > 0) { ctx.save(); ctx.globalAlpha = bg.veil; ctx.fillStyle = bg.veilColor === 'light' ? '#FFFFFF' : '#000000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
        continue;
      }
      if (!l.path || !l.path.length) continue;
      const p = l._p2d || (l._p2d = new Path2D(l._svg || (l._svg = K.toSVGPath(l.path, 2))));
      const rule = l.evenodd ? 'evenodd' : 'nonzero', op = l.opacity == null ? 1 : l.opacity;
      ctx.save();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      if (l.blur > 0) {
        // le calque flou est dessiné hors champ ; seule son ombre portée (floutée) revient dans le cadre
        const c = hex2rgb(l.fill ? l.fill.color : l.stroke.color), rgba = `rgba(${c[0]},${c[1]},${c[2]},${op})`;
        const off = W + H + 1000;
        ctx.shadowColor = rgba; ctx.shadowBlur = l.blur * scale;
        ctx.shadowOffsetX = ((l.dx || 0) + off) * scale; ctx.shadowOffsetY = (l.dy || 0) * scale;
        ctx.translate(-off, 0);
        ctx.fillStyle = rgba; ctx.strokeStyle = rgba;
        if (l.stroke) { ctx.lineWidth = l.stroke.width; ctx.stroke(p); }
        if (l.fill) ctx.fill(p, rule);
      } else {
        if (l.dx || l.dy) ctx.translate(l.dx || 0, l.dy || 0);
        ctx.globalAlpha = op;
        if (l.stroke) { ctx.lineWidth = l.stroke.width; ctx.strokeStyle = l.stroke.color; ctx.stroke(p); }
        if (l.fill) {
          if (isGrad(l.fill)) canvasGradFill(ctx, l.fill, l.box || { x: 0, y: 0, w: W, h: H }, p, rule);
          else { ctx.fillStyle = l.fill.color; ctx.fill(p, rule); }
        }
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Compression (CompressionStream si disponible)
  // ---------------------------------------------------------------------------
  async function compress(bytes, fmt) {
    if (typeof CompressionStream === 'undefined') return null;
    try {
      const s = new Blob([bytes]).stream().pipeThrough(new CompressionStream(fmt));
      return new Uint8Array(await new Response(s).arrayBuffer());
    } catch (e) { return null; }
  }
  function concat(parts) {
    let n = 0; for (const p of parts) n += p.length;
    const out = new Uint8Array(n); let o = 0;
    for (const p of parts) { out.set(p, o); o += p.length; }
    return out;
  }
  const te = new TextEncoder();
  function latin1(s) { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }

  // ---------------------------------------------------------------------------
  // PDF (vectoriel, une ou plusieurs pages)
  // ---------------------------------------------------------------------------
  function pdfPath(c) {
    let s = '';
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0) { s += f2(c[i]) + ' ' + f2(c[i + 1]) + ' m\n'; i += 2; }
      else if (op === 1) { s += f2(c[i]) + ' ' + f2(c[i + 1]) + ' l\n'; i += 2; }
      else if (op === 3) { s += f2(c[i]) + ' ' + f2(c[i + 1]) + ' ' + f2(c[i + 2]) + ' ' + f2(c[i + 3]) + ' ' + f2(c[i + 4]) + ' ' + f2(c[i + 5]) + ' c\n'; i += 6; }
      else if (op === 4) s += 'h\n';
    }
    return s;
  }
  function pdfColor(h, stroke) { const c = rgbf(h); return c.map(f3).join(' ') + (stroke ? ' RG\n' : ' rg\n'); }
  function pdfDate(d) {
    const p = n => String(n).padStart(2, '0');
    return 'D:' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }
  function pdfText(s) {
    // chaîne UTF-16BE hexadécimale (accepte l'arabe dans les métadonnées)
    let h = 'FEFF';
    for (let i = 0; i < s.length; i++) h += s.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
    return '<' + h + '>';
  }
  // texte latin pour la police standard Helvetica (WinAnsi)
  function pdfLatin(s) {
    const map = { 'ʿ': "'", 'ʾ': "'", '’': "'", '‘': "'", 'ī': 'i', 'ā': 'a', 'ū': 'u', 'Ā': 'A', '·': '\xB7', '–': '-', '—': '-', '…': '...', 'œ': '\x9C', 'Œ': '\x8C' };
    let o = '';
    for (const ch of String(s)) {
      let c = map[ch] != null ? map[ch] : ch;
      const code = c.charCodeAt(0);
      if (c.length === 1 && code > 255) c = '?';
      o += c.replace(/[\\()]/g, m => '\\' + m);
    }
    return '(' + o + ')';
  }
  function PdfDoc() { this.objs = []; this.pageIds = []; this.pagesId = this.reserve(); }
  PdfDoc.prototype.reserve = function () { this.objs.push(null); return this.objs.length; };
  PdfDoc.prototype.set = function (n, s) { this.objs[n - 1] = typeof s === 'string' ? latin1(s) : s; };
  PdfDoc.prototype.add = function (s) { const n = this.reserve(); this.set(n, s); return n; };
  PdfDoc.prototype.addPage = async function (Wpt, Hpt, cs, res) {
    const raw = latin1(cs);
    const z = await compress(raw, 'deflate');
    const contents = this.add(concat([latin1(`<< /Length ${(z || raw).length}${z ? ' /Filter /FlateDecode' : ''} >>\nstream\n`), z || raw, latin1('\nendstream')]));
    this.pageIds.push(this.add(`<< /Type /Page /Parent ${this.pagesId} 0 R /MediaBox [0 0 ${f3(Wpt)} ${f3(Hpt)}] /Resources ${res.dict()} /Contents ${contents} 0 R >>`));
  };
  PdfDoc.prototype.finish = function (title) {
    this.set(this.pagesId, `<< /Type /Pages /Kids [${this.pageIds.map(n => n + ' 0 R').join(' ')}] /Count ${this.pageIds.length} >>`);
    const catalog = this.add(`<< /Type /Catalog /Pages ${this.pagesId} 0 R >>`);
    const info = this.add(`<< /Title ${pdfText(title || 'Calligraphie')} /Creator (Atelier Khattat) /Producer (Atelier Khattat - HarfBuzz) /CreationDate (${pdfDate(new Date())}) >>`);
    const parts = [latin1('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
    let off = parts[0].length;
    const xref = [];
    this.objs.forEach((body, i) => {
      const head = latin1(`${i + 1} 0 obj\n`), tail = latin1('\nendobj\n');
      xref.push(off);
      parts.push(head, body, tail);
      off += head.length + body.length + tail.length;
    });
    let x = `xref\n0 ${this.objs.length + 1}\n0000000000 65535 f \n`;
    for (const o of xref) x += String(o).padStart(10, '0') + ' 00000 n \n';
    x += `trailer\n<< /Size ${this.objs.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${off}\n%%EOF\n`;
    parts.push(latin1(x));
    return concat(parts);
  };
  // ressources d'une page
  function PdfRes(doc) { this.doc = doc; this.sh = []; this.gs = []; this.gsKey = new Map(); this.xo = []; this.font = 0; }
  PdfRes.prototype.shading = function (dict) { this.sh.push(this.doc.add(dict)); return '/Sh' + this.sh.length; };
  PdfRes.prototype.alpha = function (a) {
    const k = f3(a);
    if (!this.gsKey.has(k)) { this.gs.push(this.doc.add(`<< /Type /ExtGState /ca ${k} /CA ${k} >>`)); this.gsKey.set(k, this.gs.length); }
    return '/GS' + this.gsKey.get(k);
  };
  PdfRes.prototype.image = function (im) {
    const n = this.doc.add(concat([latin1(`<< /Type /XObject /Subtype /Image /Width ${im.w} /Height ${im.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.jpeg.length} >>\nstream\n`), im.jpeg, latin1('\nendstream')]));
    this.xo.push(n);
    return '/Im' + this.xo.length;
  };
  PdfRes.prototype.helv = function () { if (!this.font) this.font = this.doc.add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'); return '/F1'; };
  PdfRes.prototype.dict = function () {
    let r = '<< ';
    if (this.sh.length) r += '/Shading << ' + this.sh.map((n, i) => `/Sh${i + 1} ${n} 0 R`).join(' ') + ' >> ';
    if (this.gs.length) r += '/ExtGState << ' + this.gs.map((n, i) => `/GS${i + 1} ${n} 0 R`).join(' ') + ' >> ';
    if (this.xo.length) r += '/XObject << ' + this.xo.map((n, i) => `/Im${i + 1} ${n} 0 R`).join(' ') + ' >> ';
    if (this.font) r += `/Font << /F1 ${this.font} 0 R >> `;
    return r + '>>';
  };
  function pdfShade(pt, box, res) {
    const d = shadingDict(pt, box);
    return (d.m ? matStr(d.m) + ' cm ' : '') + res.shading(d.dict) + ' sh';
  }
  // calques d'une scène (repère en px de la scène déjà installé)
  function pdfLayers(sc, res, opt) {
    const W = sc.W, H = sc.H;
    let cs = '';
    for (const l of sc.layers) {
      if (l.image) {
        if (opt && opt.image) cs += `q 0 0 ${f2(W)} ${f2(H)} re W n ${f2(W)} 0 0 ${f2(-H)} 0 ${f2(H)} cm ${res.image(opt.image)} Do Q\n`;
        continue;
      }
      if (!l.path || !l.path.length) continue;
      const op = l.opacity == null ? 1 : l.opacity;
      if (l.blur > 0 && l.fallback === 'skip') continue;
      const P = l._pdf || (l._pdf = pdfPath(K.toCubic(l.path)));
      if (l.blur > 0 && l.fallback === 'rings') {
        // halo : anneaux de plus en plus larges, très transparents, qui s'additionnent vers le centre
        const col = (l.fill || l.stroke).color, n = 10, base = l.stroke ? l.stroke.width : 0;
        cs += 'q\n' + res.alpha(Math.min(1, op * 0.13)) + ' gs\n' + pdfColor(col) + pdfColor(col, true) + '1 j 1 J\n';
        for (let i = n; i >= 1; i--) cs += f2(base + l.blur * 1.7 * i / n) + ' w\n' + P + 'B\n';
        cs += 'Q\n';
        continue;
      }
      cs += 'q\n';
      if (op < 1) cs += res.alpha(op) + ' gs\n';
      if (l.dx || l.dy) cs += `1 0 0 1 ${f2(l.dx || 0)} ${f2(l.dy || 0)} cm\n`;
      if (l.stroke) cs += pdfColor(l.stroke.color, true) + `${f2(l.stroke.width)} w 1 j 1 J\n` + P + 'S\n';
      if (l.fill) {
        if (isGrad(l.fill)) cs += 'q\n' + P + (l.evenodd ? 'W* n ' : 'W n ') + pdfShade(l.fill, l.box || { x: 0, y: 0, w: W, h: H }, res) + '\nQ\n';
        else cs += pdfColor(l.fill.color) + P + (l.evenodd ? 'f*\n' : 'f\n');
      }
      cs += 'Q\n';
    }
    return cs;
  }
  // image = { jpeg: Uint8Array, w, h } (fond déjà recadré au format du plan de travail)
  async function sceneToPDF(sc, opt) {
    opt = opt || {};
    const k = (sc.mmPerPx || PX2MM) * 72 / 25.4;
    const Wpt = sc.W * k, Hpt = sc.H * k;
    const doc = new PdfDoc(), res = new PdfRes(doc);
    const cs = `${K.num(k, 6)} 0 0 ${K.num(-k, 6)} 0 ${f3(Hpt)} cm\n` + pdfLayers(sc, res, opt);
    await doc.addPage(Wpt, Hpt, cs, res);
    return doc.finish(opt.title);
  }
  // Planche de comparaison : cellules { sc, label, sub } réparties sur des pages A4 portrait
  // Feuille d'exercice : calques dessinés en px (96 par pouce) sur une page, et étiquettes en Helvetica
  // sheet = { W, H, layers, labels:[{ x, y (ligne de base), size, text, color }], title }
  async function practiceToPDF(sheet) {
    const k = PX2MM * 72 / 25.4, Wpt = sheet.W * k, Hpt = sheet.H * k;
    const doc = new PdfDoc(), res = new PdfRes(doc);
    let cs = `q ${K.num(k, 6)} 0 0 ${K.num(-k, 6)} 0 ${f3(Hpt)} cm\n` + pdfLayers({ W: sheet.W, H: sheet.H, layers: sheet.layers }, res, null) + 'Q\n';
    for (const l of sheet.labels || []) cs += 'BT ' + res.helv() + ' ' + f2(l.size * k) + ' Tf ' + rgbf(l.color || '#333333').map(f3).join(' ') + ' rg ' + f2(l.x * k) + ' ' + f2(Hpt - l.y * k) + ' Td ' + pdfLatin(l.text) + ' Tj ET\n';
    await doc.addPage(Wpt, Hpt, cs, res);
    return doc.finish(sheet.title);
  }

  async function sheetToPDF(cells, opt) {
    opt = opt || {};
    const doc = new PdfDoc();
    const Wpt = 595.28, Hpt = 841.89, M = 36, cols = opt.cols || 3, rows = opt.rows || 5;
    const gx = 10, gy = 14, cwPt = (Wpt - 2 * M - (cols - 1) * gx) / cols, headH = opt.title ? 34 : 0;
    const chPt = (Hpt - 2 * M - headH - (rows - 1) * gy) / rows, labelH = 22;
    const per = cols * rows;
    for (let p = 0; p * per < cells.length; p++) {
      const res = new PdfRes(doc);
      let cs = '';
      if (opt.title) {
        cs += 'BT ' + res.helv() + ' 13 Tf 0.12 0.12 0.12 rg ' + f2(M) + ' ' + f2(Hpt - M - 14) + ' Td ' + pdfLatin(opt.title) + ' Tj ET\n';
        cs += 'BT ' + res.helv() + ' 8 Tf 0.45 0.45 0.45 rg ' + f2(M) + ' ' + f2(Hpt - M - 27) + ' Td ' + pdfLatin((opt.subtitle || '') + (cells.length > per ? '  -  page ' + (p + 1) + '/' + Math.ceil(cells.length / per) : '')) + ' Tj ET\n';
      }
      cells.slice(p * per, p * per + per).forEach((cell, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const x = M + c * (cwPt + gx), yTop = Hpt - M - headH - r * (chPt + gy);
        const sc = cell.sc;
        // cadre de la cellule
        cs += 'q 0.85 0.83 0.78 RG 0.6 w ' + f2(x) + ' ' + f2(yTop - chPt) + ' ' + f2(cwPt) + ' ' + f2(chPt) + ' re S Q\n';
        if (sc && !sc.empty) {
          const aw = cwPt - 8, ah = chPt - labelH - 8;
          const k = Math.min(aw / sc.W, ah / sc.H);
          const ox = x + 4 + (aw - sc.W * k) / 2, oy = yTop - 4 - (ah - sc.H * k) / 2;
          cs += `q ${K.num(k, 6)} 0 0 ${K.num(-k, 6)} ${f3(ox)} ${f3(oy)} cm\n` + pdfLayers(sc, res, null) + 'Q\n';
        }
        cs += 'BT ' + res.helv() + ' 8.5 Tf 0.1 0.1 0.1 rg ' + f2(x + 5) + ' ' + f2(yTop - chPt + 11) + ' Td ' + pdfLatin(cell.label || '') + ' Tj ET\n';
        if (cell.sub) cs += 'BT ' + res.helv() + ' 6.5 Tf 0.45 0.45 0.45 rg ' + f2(x + 5) + ' ' + f2(yTop - chPt + 3.5) + ' Td ' + pdfLatin(cell.sub) + ' Tj ET\n';
      });
      await doc.addPage(Wpt, Hpt, cs, res);
    }
    return doc.finish(opt.title);
  }

  // ---------------------------------------------------------------------------
  // EPS (PostScript niveau 3)
  // ---------------------------------------------------------------------------
  function psPath(c) {
    let s = 'newpath\n';
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0) { s += f2(c[i]) + ' ' + f2(c[i + 1]) + ' m\n'; i += 2; }
      else if (op === 1) { s += f2(c[i]) + ' ' + f2(c[i + 1]) + ' l\n'; i += 2; }
      else if (op === 3) { s += f2(c[i]) + ' ' + f2(c[i + 1]) + ' ' + f2(c[i + 2]) + ' ' + f2(c[i + 3]) + ' ' + f2(c[i + 4]) + ' ' + f2(c[i + 5]) + ' c\n'; i += 6; }
      else if (op === 4) s += 'h\n';
    }
    return s;
  }
  function psColor(h) { return rgbf(h).map(f3).join(' ') + ' setrgbcolor\n'; }
  function psShading(pt, box) {
    const d = shadingDict(pt, box);
    return (d.m ? '[' + matStr(d.m) + '] concat\n' : '') + d.dict + ' shfill\n';
  }
  function ascii85(bytes) {
    let out = '', line = 0;
    const push = s => { for (const ch of s) { out += ch; if (++line >= 75) { out += '\n'; line = 0; } } };
    let i = 0;
    for (; i + 4 <= bytes.length; i += 4) {
      const v = ((bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3]) >>> 0;
      if (v === 0) { push('z'); continue; }
      let t = v, s = '';
      for (let k = 0; k < 5; k++) { s = String.fromCharCode(33 + (t % 85)) + s; t = Math.floor(t / 85); }
      push(s);
    }
    const rem = bytes.length - i;
    if (rem) {
      const b = [0, 0, 0, 0];
      for (let k = 0; k < rem; k++) b[k] = bytes[i + k];
      let t = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0, s = '';
      for (let k = 0; k < 5; k++) { s = String.fromCharCode(33 + (t % 85)) + s; t = Math.floor(t / 85); }
      push(s.slice(0, rem + 1));
    }
    return out + '~>';
  }
  // EPS ne connaît pas la transparence : les couleurs translucides sont mélangées à la couleur du fond
  function sceneToEPS(sc, opt) {
    opt = opt || {};
    const k = (sc.mmPerPx || PX2MM) * 72 / 25.4;
    const W = sc.W, H = sc.H, Wpt = W * k, Hpt = H * k;
    const solidBg = sc.st.bg && sc.st.bg.type === 'image' ? null : sc.bgSolid;
    let s = '%!PS-Adobe-3.0 EPSF-3.0\n' +
      `%%BoundingBox: 0 0 ${Math.ceil(Wpt)} ${Math.ceil(Hpt)}\n%%HiResBoundingBox: 0 0 ${f3(Wpt)} ${f3(Hpt)}\n` +
      `%%Title: ${(opt.titleAscii || 'Calligraphie').replace(/[^\x20-\x7e]/g, '')}\n%%Creator: Atelier Khattat (HarfBuzz)\n%%CreationDate: ${new Date().toISOString()}\n` +
      '%%LanguageLevel: 3\n%%DocumentData: Clean7Bit\n%%Pages: 1\n%%EndComments\n%%BeginProlog\n' +
      '/m {moveto} bind def /l {lineto} bind def /c {curveto} bind def /h {closepath} bind def\n%%EndProlog\n%%Page: 1 1\n' +
      `save\n[${K.num(k, 6)} 0 0 ${K.num(-k, 6)} 0 ${f3(Hpt)}] concat\n`;
    const tint = (col, op) => op < 1 && solidBg ? mix(solidBg, col, op) : col;
    for (const l of sc.layers) {
      if (l.image) {
        if (opt.image) {
          const im = opt.image;
          s += `gsave\n/DeviceRGB setcolorspace\n0 0 translate ${f2(W)} ${f2(H)} scale\n` +
            `<< /ImageType 1 /Width ${im.w} /Height ${im.h} /BitsPerComponent 8 /Decode [0 1 0 1 0 1] /ImageMatrix [${im.w} 0 0 ${im.h} 0 0] /DataSource currentfile /ASCII85Decode filter /DCTDecode filter >> image\n` +
            ascii85(im.jpeg) + '\ngrestore\n';
        }
        continue;
      }
      if (!l.path || !l.path.length) continue;
      const op = l.opacity == null ? 1 : l.opacity;
      if (l.blur > 0 && l.fallback === 'skip') continue;
      const P = psPath(K.toCubic(l.path));
      if (l.blur > 0 && l.fallback === 'rings') {
        if (!solidBg) continue;
        const col = (l.fill || l.stroke).color, n = 10, base = l.stroke ? l.stroke.width : 0;
        s += 'gsave 1 setlinejoin 1 setlinecap\n';
        for (let i = n; i >= 1; i--) {
          // opacité cumulée des anneaux du PDF : 1 - (1 - a)^k
          const c = mix(solidBg, col, Math.min(1, 1 - Math.pow(1 - op * 0.13, n - i + 1)));
          s += psColor(c) + f2(base + l.blur * 1.7 * i / n) + ' setlinewidth\n' + P + 'gsave fill grestore stroke\n';
        }
        s += 'grestore\n';
        continue;
      }
      s += 'gsave\n';
      if (l.dx || l.dy) s += `${f2(l.dx || 0)} ${f2(l.dy || 0)} translate\n`;
      if (l.stroke) s += `${f2(l.stroke.width)} setlinewidth 1 setlinejoin 1 setlinecap\n` + psColor(tint(l.stroke.color, op)) + P + 'stroke\n';
      if (l.fill) {
        if (isGrad(l.fill)) s += 'gsave\n' + P + (l.evenodd ? 'eoclip\n' : 'clip\n') + psShading(l.fill, l.box || { x: 0, y: 0, w: W, h: H }) + 'grestore\n';
        else s += psColor(tint(l.fill.color, op)) + P + (l.evenodd ? 'eofill\n' : 'fill\n');
      }
      s += 'grestore\n';
    }
    s += 'restore\nshowpage\n%%Trailer\n%%EOF\n';
    return s;
  }

  // ---------------------------------------------------------------------------
  // Découpe : contours fusionnés (lettres et cadre) ; DXF R12 en mm
  // ---------------------------------------------------------------------------
  function cutPolygons(sc) {
    const src = sc.cutPath || sc.path;
    const polys = K.flatten(src, 0.08);
    const C = root.ClipperLib;
    if (!C) return { polys, merged: false };
    const S = 1000;
    const paths = polys.map(p => { const a = []; for (let i = 0; i < p.length; i += 2) a.push({ X: Math.round(p[i] * S), Y: Math.round(p[i + 1] * S) }); return a; });
    const cpr = new C.Clipper();
    cpr.AddPaths(paths, C.PolyType.ptSubject, true);
    const sol = new C.Paths();
    cpr.Execute(C.ClipType.ctUnion, sol, C.PolyFillType.pftNonZero, C.PolyFillType.pftNonZero);
    const out = sol.filter(p => p.length > 2).map(p => { const a = []; for (const pt of p) a.push(pt.X / S, pt.Y / S); return a; });
    return { polys: out, merged: true };
  }
  function sceneToCutSVG(sc, color) {
    const cp = cutPolygons(sc);
    let d = '';
    for (const p of cp.polys) {
      d += 'M' + f2(p[0]) + ' ' + f2(p[1]);
      for (let i = 2; i < p.length; i += 2) d += 'L' + f2(p[i]) + ' ' + f2(p[i + 1]);
      d += 'Z';
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' +
      `<svg xmlns="http://www.w3.org/2000/svg" width="${f2(sc.W * (sc.mmPerPx || PX2MM))}mm" height="${f2(sc.H * (sc.mmPerPx || PX2MM))}mm" viewBox="0 0 ${f2(sc.W)} ${f2(sc.H)}"><path d="${d}" fill="${color || '#000000'}" fill-rule="evenodd"/></svg>`;
  }
  function sceneToDXF(sc) {
    const k = sc.mmPerPx || PX2MM, H = sc.H;
    const polys = cutPolygons(sc).polys;
    const L = [];
    const g = (code, val) => { L.push(String(code), String(val)); };
    const n = v => (Math.round(v * 10000) / 10000).toString();
    g(0, 'SECTION'); g(2, 'HEADER');
    g(9, '$ACADVER'); g(1, 'AC1009');
    g(9, '$INSUNITS'); g(70, 4);
    g(9, '$EXTMIN'); g(10, 0); g(20, 0); g(30, 0);
    g(9, '$EXTMAX'); g(10, n(sc.W * k)); g(20, n(H * k)); g(30, 0);
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'TABLES');
    g(0, 'TABLE'); g(2, 'LAYER'); g(70, 1);
    g(0, 'LAYER'); g(2, 'CALLIGRAPHIE'); g(70, 0); g(62, 7); g(6, 'CONTINUOUS');
    g(0, 'ENDTAB');
    g(0, 'ENDSEC');
    g(0, 'SECTION'); g(2, 'ENTITIES');
    for (const p of polys) {
      g(0, 'POLYLINE'); g(8, 'CALLIGRAPHIE'); g(66, 1); g(70, 1); g(10, 0); g(20, 0); g(30, 0);
      let cnt = p.length / 2;
      if (cnt > 2 && Math.abs(p[0] - p[p.length - 2]) < 1e-6 && Math.abs(p[1] - p[p.length - 1]) < 1e-6) cnt--;
      for (let i = 0; i < cnt; i++) {
        g(0, 'VERTEX'); g(8, 'CALLIGRAPHIE'); g(10, n(p[i * 2] * k)); g(20, n((H - p[i * 2 + 1]) * k)); g(30, 0);
      }
      g(0, 'SEQEND'); g(8, 'CALLIGRAPHIE');
    }
    g(0, 'ENDSEC'); g(0, 'EOF');
    return L.join('\r\n') + '\r\n';
  }

  // ---------------------------------------------------------------------------
  // ZIP
  // ---------------------------------------------------------------------------
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { let c = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  async function makeZip(files) {
    const d = new Date();
    const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    const local = [], central = [];
    let off = 0;
    for (const f of files) {
      const data = typeof f.data === 'string' ? te.encode(f.data) : f.data;
      const name = te.encode(f.name);
      const crc = crc32(data);
      let comp = await compress(data, 'deflate-raw'), method = 8;
      if (!comp || comp.length >= data.length) { comp = data; method = 0; }
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, method, true);
      h.setUint16(10, time, true); h.setUint16(12, date, true); h.setUint32(14, crc, true);
      h.setUint32(18, comp.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      local.push(new Uint8Array(h.buffer), name, comp);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, method, true);
      c.setUint16(12, time, true); c.setUint16(14, date, true); c.setUint32(16, crc, true); c.setUint32(20, comp.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, name.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), name);
      off += 30 + name.length + comp.length;
    }
    const cd = concat(central);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cd.length, true); e.setUint32(16, off, true);
    return concat(local.concat([cd, new Uint8Array(e.buffer)]));
  }

  // ---------------------------------------------------------------------------
  // Résolution d'impression (ppp) inscrite dans les PNG et JPG
  // ---------------------------------------------------------------------------
  function setPngDpi(bytes, dpi) {
    if (bytes[0] !== 0x89 || bytes[1] !== 0x50) return bytes;
    const ppm = Math.round(dpi / 0.0254);
    const chunk = new Uint8Array(21), dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9); chunk.set([0x70, 0x48, 0x59, 0x73], 4);
    dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
    dv.setUint32(17, crc32(chunk.subarray(4, 17)));
    // retire un pHYs existant puis insère le nouveau juste après IHDR (8 + 25 octets)
    const parts = [bytes.subarray(0, 33), chunk];
    let i = 33;
    while (i + 8 <= bytes.length) {
      const len = new DataView(bytes.buffer, bytes.byteOffset + i, 4).getUint32(0);
      const type = String.fromCharCode(bytes[i + 4], bytes[i + 5], bytes[i + 6], bytes[i + 7]);
      const end = i + 12 + len;
      if (type !== 'pHYs') parts.push(bytes.subarray(i, end));
      i = end;
    }
    return concat(parts);
  }
  function setJpegDpi(bytes, dpi) {
    // segment APP0 JFIF : unités (1 = ppp) puis densités X et Y
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF && bytes[3] === 0xE0 && bytes[6] === 0x4A && bytes[7] === 0x46) {
      const o = bytes.slice(), d = Math.min(65535, Math.round(dpi));
      o[13] = 1; o[14] = d >> 8; o[15] = d & 255; o[16] = d >> 8; o[17] = d & 255;
      return o;
    }
    return bytes;
  }

  root.KhattExport = { setPngDpi, setJpegDpi, cutPolygons, sceneToCutSVG, buildScene, wrapForShape, fitSize, sceneToSVG, drawScene, sceneToPDF, sheetToPDF, practiceToPDF, sceneToEPS, sceneToDXF, makeZip, gradLine, gradStops, sampleStops, isGrad, hex2rgb, mix, PX2PT, PX2MM };
})(typeof self !== 'undefined' ? self : globalThis);
