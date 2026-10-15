/* Ornements : cadres (médaillons) autour de la calligraphie et motifs géométriques de fond. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const SH = () => root.KhattShape, FX = () => root.KhattFX;

  // ---------------------------------------------------------------------------
  // Formes de cadre : boucles fermées (y vers le bas, sens horaire à l'écran), A = largeur / hauteur du contenu
  // ---------------------------------------------------------------------------
  function arcPts(cx, cy, r, a0, a1, step) {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / (step || Math.PI / 90)));
    const o = [];
    for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * i / n; o.push(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
    return o;
  }
  function poly(list) { return [].concat(...list); }
  function unitShape(type, A) {
    A = Math.max(0.3, Math.min(8, A || 1));
    switch (type) {
      case 'circle': return arcPts(0, 0, 1, -Math.PI / 2, 1.5 * Math.PI);
      case 'oval': { const o = []; for (let i = 0; i < 240; i++) { const a = -Math.PI / 2 + TAU * i / 240; o.push(A * Math.cos(a), Math.sin(a)); } return o; }
      case 'rect': return [-A, -1, A, -1, A, 1, -A, 1];
      case 'round': {
        const r = Math.min(0.45, A * 0.45);
        return poly([arcPts(A - r, -1 + r, r, -Math.PI / 2, 0), arcPts(A - r, 1 - r, r, 0, Math.PI / 2), arcPts(-A + r, 1 - r, r, Math.PI / 2, Math.PI), arcPts(-A + r, -1 + r, r, Math.PI, 1.5 * Math.PI)]);
      }
      case 'diamond': return [0, -1, A, 0, 0, 1, -A, 0];
      case 'hexagon': { const c = 0.6; return [-A, -1, A, -1, A + c, 0, A, 1, -A, 1, -A - c, 0]; }
      case 'octagon': { const c = Math.min(0.42, A * 0.42); return [-A + c, -1, A - c, -1, A, -1 + c, A, 1 - c, A - c, 1, -A + c, 1, -A, 1 - c, -A, -1 + c]; }
      case 'star8': {
        const ri = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8), o = [];
        for (let k = 0; k < 16; k++) { const a = -Math.PI / 2 + k * Math.PI / 8, r = k % 2 ? ri : 1; o.push(r * Math.cos(a), r * Math.sin(a)); }
        return o;
      }
      case 'arch': {
        // mihrab : base rectangulaire, arc brisé au-dessus de la ligne de naissance (y = -1)
        const a = A, rise = a * 1.05 + 0.35;
        const cr = (a * a - rise * rise) / (2 * a), rho = a - cr; // centre de l'arc droit (cr, -1), à gauche de l'axe
        const o = [-a, 1];
        // arc gauche : centre (-cr, -1), de la naissance gauche (angle π) jusqu'au sommet
        o.push(...arcPts(-cr, -1, rho, Math.PI, Math.atan2(-rise, cr) + TAU, Math.PI / 160));
        // arc droit : centre (cr, -1), du sommet jusqu'à la naissance droite (angle 0)
        o.push(...arcPts(cr, -1, rho, Math.atan2(-rise, -cr), 0, Math.PI / 160));
        o.push(a, -1, a, 1);
        return o;
      }
      case 'drop': {
        // goutte (poire) pointe en haut : cercle + tangentes depuis la pointe
        const T = 2.7, al = Math.acos(1 / T), o = [];
        const aR = -Math.PI / 2 + al, aL = -Math.PI / 2 - al;
        o.push(0, -T);
        o.push(...arcPts(0, 0, 1, aR, aL + TAU, Math.PI / 120));
        return o;
      }
      case 'heart': { const H = SH().HEART; return H.pts.map((v, i) => i % 2 ? v - H.cy : v); }
      case 'shield': {
        const w = Math.max(1, A), o = [-w, -1.1, w, -1.1, w, 0.2];
        for (let i = 1; i <= 24; i++) { const t = i / 24, mt = 1 - t; o.push(mt * mt * w + 2 * mt * t * w + t * t * 0, mt * mt * 0.2 + 2 * mt * t * 1.0 + t * t * 1.45); }
        for (let i = 1; i < 24; i++) { const t = i / 24, mt = 1 - t; o.push(mt * mt * 0 + 2 * mt * t * -w + t * t * -w, mt * mt * 1.45 + 2 * mt * t * 1.0 + t * t * 0.2); }
        return o;
      }
      case 'cartouche': {
        const a = Math.max(0, A - 0.3);
        return poly([arcPts(a, 0, 1, -Math.PI / 2, Math.PI / 2), arcPts(-a, 0, 1, Math.PI / 2, 1.5 * Math.PI)]);
      }
      case 'triangle': { const w = 1.155 * Math.max(1, A); return [0, -1.25, w * 1.08, 0.95, -w * 1.08, 0.95]; }
      case 'egg': { const o = []; for (let i = 0; i < 240; i++) { const t = -Math.PI / 2 + TAU * i / 240; o.push(0.78 * Math.cos(t) * (1 + 0.2 * Math.sin(t)), Math.sin(t)); } return o; }
      case 'scallop': { const o = []; for (let i = 0; i < 360; i++) { const a = -Math.PI / 2 + TAU * i / 360, r = 1 + 0.045 * Math.cos(18 * (a + Math.PI / 2)); o.push(r * Math.cos(a), r * Math.sin(a)); } return o; }
    }
    return null;
  }
  const STRETCH = { oval: 1, rect: 1, round: 1, diamond: 1, hexagon: 1, octagon: 1, arch: 1, shield: 1, cartouche: 1, triangle: 1 };

  // nombre d'enroulement (point dans polygone)
  function inside(p, x, y) {
    let w = 0;
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = (i + 2) % n, x0 = p[i], y0 = p[i + 1], x1 = p[j], y1 = p[j + 1];
      if (y0 <= y) { if (y1 > y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) > 0) w++; }
      else if (y1 <= y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) < 0) w--;
    }
    return w !== 0;
  }
  // plus grand rectangle de proportion A (centré horizontalement) qui tient dans la boucle
  function fitRect(p, A) {
    let y0 = Infinity, y1 = -Infinity, xmax = 0;
    for (let i = 0; i < p.length; i += 2) { y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); xmax = Math.max(xmax, Math.abs(p[i])); }
    const ok = (yo, t) => {
      const w = t * A;
      for (let k = 0; k <= 8; k++) {
        const u = -1 + k / 4;
        if (!inside(p, w * u, yo - t) || !inside(p, w * u, yo + t) || !inside(p, -w, yo + t * u) || !inside(p, w, yo + t * u)) return false;
      }
      for (let i = 0; i < p.length; i += 2) if (Math.abs(p[i]) < w - 1e-9 && Math.abs(p[i + 1] - yo) < t - 1e-9) return false;
      return true;
    };
    const cand = [];
    for (let s = 0; s <= 24; s++) {
      const yo = y0 + (y1 - y0) * (0.15 + 0.7 * s / 24);
      if (!inside(p, 0, yo)) continue;
      let lo = 0, hi = Math.max(y1 - y0, xmax * 2 / A);
      for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (ok(yo, m)) lo = m; else hi = m; }
      cand.push({ t: lo, yo });
    }
    if (!cand.length) return { t: 0, yo: 0 };
    // parmi les placements presque aussi grands que le meilleur, on préfère le plus centré verticalement
    const tmax = Math.max.apply(null, cand.map(c => c.t)), mid = (y0 + y1) / 2;
    let best = null;
    for (const c of cand) if (c.t >= tmax * 0.9 && (!best || Math.abs(c.yo - mid) < Math.abs(best.yo - mid))) best = c;
    return best;
  }
  function loopCmds(p, reverse) {
    const c = [], n = p.length / 2;
    for (let k = 0; k < n; k++) { const i = (reverse ? n - 1 - k : k) * 2; c.push(k ? 1 : 0, p[i], p[i + 1]); }
    c.push(4);
    return c;
  }
  function bboxPts(p) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  // bande entre deux décalages d'une boucle (Clipper si disponible, sinon décalage le long des normales)
  function ringOf(loop, a, b, tol) {
    const fx = FX();
    if (fx && fx.ready()) {
      const c = loopCmds(loop);
      const outer = fx.offsetPoly(c, b, tol), inner = fx.offsetPoly(c, a, tol);
      return outer.concat(reversePolys(inner));
    }
    const sh = SH();
    return loopCmds(sh.offsetLoop(loop, b)).concat(loopCmds(sh.offsetLoop(loop, a), true));
  }
  // filet pointillé : tirets réguliers entre les décalages 0 et lw de la boucle (vers l'extérieur)
  function dashedRing(loop, lw) {
    const sh = SH(), P = [];
    // boucle densifiée pour suivre les courbes
    for (let i = 0, n = loop.length; i < n; i += 2) {
      const j = (i + 2) % n, x0 = loop[i], y0 = loop[i + 1], x1 = loop[j], y1 = loop[j + 1];
      const k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / Math.max(0.5, lw * 0.6)));
      for (let t = 0; t < k; t++) P.push(x0 + (x1 - x0) * t / k, y0 + (y1 - y0) * t / k);
    }
    const O = sh.offsetLoop(P, lw), n = P.length / 2, cum = [0];
    for (let i = 1; i <= n; i++) { const a = (i - 1) % n, b = i % n; cum.push(cum[i - 1] + Math.hypot(P[2 * b] - P[2 * a], P[2 * b + 1] - P[2 * a + 1])); }
    const per = cum[n], np = Math.max(8, Math.round(per / (lw * 4.2))), period = per / np, dash = period * 0.58;
    const at = (A, s) => {
      let i = 0;
      while (i < n && cum[i + 1] < s) i++;
      const a = i % n, b = (i + 1) % n, f = (s - cum[i]) / ((cum[i + 1] - cum[i]) || 1);
      return [A[2 * a] + (A[2 * b] - A[2 * a]) * f, A[2 * a + 1] + (A[2 * b + 1] - A[2 * a + 1]) * f];
    };
    const out = [];
    for (let k = 0; k < np; k++) {
      const s0 = k * period, s1 = s0 + dash, inner = [], outer = [];
      const steps = Math.max(2, Math.ceil(dash / Math.max(0.5, lw * 0.5)));
      for (let q = 0; q <= steps; q++) { const s = s0 + (s1 - s0) * q / steps; inner.push(at(P, s)); outer.push(at(O, s)); }
      out.push(0, inner[0][0], inner[0][1]);
      for (let q = 1; q < inner.length; q++) out.push(1, inner[q][0], inner[q][1]);
      for (let q = outer.length - 1; q >= 0; q--) out.push(1, outer[q][0], outer[q][1]);
      out.push(4);
    }
    return out;
  }
  // inverse les contours polygonaux (M/L/Z) pour creuser une bande
  function reversePolys(c) {
    const out = [];
    let cur = [];
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0 || op === 1) { cur.push(c[i], c[i + 1]); i += 2; }
      else if (op === 4) { if (cur.length) out.push(...loopCmds(cur, true)); cur = []; }
      else i += op === 2 ? 4 : 6;
    }
    return out;
  }

  // Cadre autour d'un contenu (rectangle {x,y,w,h}) ; o = { type, pad, width, double, page:{x,y,w,h} }
  // Renvoie { panel, rings, line, box } en coordonnées de la scène
  function frame(o, content, tol) {
    const type = o.type;
    if (!type || type === 'none') return null;
    const lw = Math.max(0.5, o.width);
    let loop;
    if (o.page) {
      const r = o.page;
      loop = [r.x, r.y, r.x + r.w, r.y, r.x + r.w, r.y + r.h, r.x, r.y + r.h];
      if (type === 'round' || type === 'cartouche') {
        const rr = Math.min(r.w, r.h) * 0.06;
        loop = poly([arcPts(r.x + r.w - rr, r.y + rr, rr, -Math.PI / 2, 0), arcPts(r.x + r.w - rr, r.y + r.h - rr, rr, 0, Math.PI / 2), arcPts(r.x + rr, r.y + r.h - rr, rr, Math.PI / 2, Math.PI), arcPts(r.x + rr, r.y + rr, rr, Math.PI, 1.5 * Math.PI)]);
      }
    } else {
      const cw = content.w + 2 * o.pad, ch = content.h + 2 * o.pad, A = cw / Math.max(1, ch);
      const unit = unitShape(type, STRETCH[type] ? A : 1);
      if (!unit) return null;
      const fit = fitRect(unit, A);
      if (!fit.t) return null;
      const s = (ch / 2) / fit.t;
      const cx = content.x + content.w / 2, cy = content.y + content.h / 2 - s * fit.yo;
      loop = unit.map((v, i) => i % 2 ? cy + v * s : cx + v * s);
    }
    const rings = o.dash ? dashedRing(loop, lw) : ringOf(loop, 0, lw, tol);
    let all = rings;
    if (o.double) {
      const g = Math.max(lw * 1.2, 2);
      all = all.concat(ringOf(loop, lw + g, lw + g + Math.max(0.5, lw * 0.6), tol));
    }
    const b = bboxPts(loop), ext = lw + (o.double ? lw * 2.8 + 2 : 0);
    return { panel: loopCmds(loop), rings: all, box: { x: b.x - ext, y: b.y - ext, w: b.w + 2 * ext, h: b.h + 2 * ext }, inner: b };
  }

  // ---------------------------------------------------------------------------
  // Motifs géométriques (traits à tracer, ou points à remplir) couvrant [0,W]×[0,H]
  // ---------------------------------------------------------------------------
  function pattern(type, W, H, cell) {
    const s = Math.max(6, cell), c = [];
    const seen = new Set();
    const line = (x0, y0, x1, y1) => {
      const k = [Math.round((x0 + x1) * 4), Math.round((y0 + y1) * 4)].join(',');
      if (seen.has(k)) return;
      seen.add(k);
      c.push(0, x0, y0, 1, x1, y1);
    };
    const closed = pts => { c.push(0, pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.push(1, pts[i], pts[i + 1]); c.push(4); };
    if (type === 'stars8') {
      const ri = Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8), r = s / 2;
      for (let y = 0; y <= H + s; y += s) for (let x = 0; x <= W + s; x += s) {
        const p = [];
        for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, rr = k % 2 ? r * ri : r; p.push(x + rr * Math.cos(a), y + rr * Math.sin(a)); }
        closed(p);
      }
      return { cmds: c, fill: false };
    }
    if (type === 'hex') {
      const r = s / 2, dx = 1.5 * r, dy = Math.sqrt(3) * r;
      for (let i = -1; i * dx <= W + s; i++) for (let j = -1; j * dy <= H + s; j++) {
        const cx = i * dx, cy = j * dy + (i % 2 ? dy / 2 : 0);
        const v = [];
        for (let k = 0; k < 6; k++) v.push([cx + r * Math.cos(k * Math.PI / 3), cy + r * Math.sin(k * Math.PI / 3)]);
        for (let k = 0; k < 6; k++) { const a = v[k], b = v[(k + 1) % 6]; line(a[0], a[1], b[0], b[1]); }
      }
      return { cmds: c, fill: false };
    }
    if (type === 'stars6') {
      const r = s / 2, dx = s, dy = s * Math.sqrt(3) / 2;
      for (let j = -1; j * dy <= H + s; j++) for (let i = -1; i * dx <= W + s; i++) {
        const cx = i * dx + (j % 2 ? dx / 2 : 0), cy = j * dy;
        for (const off of [-Math.PI / 2, Math.PI / 2]) {
          const p = [];
          for (let k = 0; k < 3; k++) { const a = off + k * TAU / 3; p.push(cx + r * 0.62 * Math.cos(a), cy + r * 0.62 * Math.sin(a)); }
          closed(p);
        }
      }
      return { cmds: c, fill: false };
    }
    if (type === 'diamonds') {
      const n = Math.ceil((W + H) / s) + 2;
      for (let k = -n; k <= n; k++) {
        const b = k * s;
        // y = x + b et y = -x + b, découpées au rectangle
        const seg = (m, q) => {
          const pts = [];
          const add = (x, y) => { if (x >= -1e-6 && x <= W + 1e-6 && y >= -1e-6 && y <= H + 1e-6) pts.push([x, y]); };
          add(0, q); add(W, m * W + q); add((0 - q) / m, 0); add((H - q) / m, H);
          if (pts.length >= 2) { pts.sort((a, b2) => a[0] - b2[0]); c.push(0, pts[0][0], pts[0][1], 1, pts[pts.length - 1][0], pts[pts.length - 1][1]); }
        };
        seg(1, b); seg(-1, b);
      }
      return { cmds: c, fill: false };
    }
    if (type === 'circles') {
      const r = s / 2, dx = r, dy = r * Math.sqrt(3) / 2;
      for (let j = -2; j * dy <= H + s; j++) for (let i = -2; i * dx <= W + s; i++) {
        const cx = i * dx + (j % 2 ? dx / 2 : 0), cy = j * dy;
        c.push(...circleCmds(cx, cy, r));
      }
      return { cmds: c, fill: false };
    }
    if (type === 'chevrons') {
      const h = s / 2;
      for (let y = -s; y <= H + s; y += s / 1.6) {
        c.push(0, -s, y);
        for (let x = -s, k = 0; x <= W + s; x += h, k++) c.push(1, x + h, y + (k % 2 ? 0 : h * 0.7));
      }
      return { cmds: c, fill: false };
    }
    if (type === 'nuqat') {
      // losanges (points du calame) semés sur une grille décalée, graine fixe : le motif ne bouge pas d'un rendu à l'autre
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const multi = [[], [], [], [], []], step = s * 0.95;
      for (let j = -1, y = -step; y <= H + step; j++, y += step * 0.82) {
        for (let x = (j % 2 ? step / 2 : 0) - step; x <= W + step; x += step) {
          const cx = x + (rnd() - 0.5) * step * 0.7, cy = y + (rnd() - 0.5) * step * 0.5, r = s * (0.06 + 0.05 * rnd());
          const a = Math.PI / 4 + (rnd() - 0.5) * 0.6, g = multi[Math.floor(rnd() * 5) % 5];
          g.push(0, cx + r * Math.cos(a), cy + r * Math.sin(a));
          for (let q = 1; q < 4; q++) g.push(1, cx + r * Math.cos(a + q * Math.PI / 2), cy + r * Math.sin(a + q * Math.PI / 2));
          g.push(4);
        }
      }
      return { cmds: [].concat(...multi), fill: true, multi };
    }
    if (type === 'dots') {
      const r = s * 0.11;
      for (let j = -1, y = 0; y <= H + s; j++, y = j * s * 0.6) for (let x = (j % 2 ? s / 2 : 0) - s; x <= W + s; x += s) c.push(...circleCmds(x, y, r));
      return { cmds: c, fill: true };
    }
    return null;
  }
  function circleCmds(cx, cy, r) {
    const k = 0.5522847498 * r;
    return [0, cx + r, cy, 3, cx + r, cy + k, cx + k, cy + r, cx, cy + r, 3, cx - k, cy + r, cx - r, cy + k, cx - r, cy, 3, cx - r, cy - k, cx - k, cy - r, cx, cy - r, 3, cx + k, cy - r, cx + r, cy - k, cx + r, cy, 4];
  }

  root.KhattOrn = { frame, pattern, unitShape, fitRect };
})(typeof self !== 'undefined' ? self : globalThis);
