/* Formes : déformation du texte (arc, cercle, vague, tracé libre…) appliquée point par point aux contours,
   ce qui garde les liaisons des lettres arabes continues. */
(function (root) {
  'use strict';
  const NC = { 0: 2, 1: 2, 2: 4, 3: 6, 4: 0 };
  const TAU = Math.PI * 2;

  function eachPoint(c, f) {
    const o = c.slice();
    for (let i = 0; i < o.length;) {
      const n = NC[o[i++]];
      for (let j = 0; j < n; j += 2) { const p = f(o[i], o[i + 1]); o[i] = p[0]; o[i + 1] = p[1]; i += 2; }
    }
    return o;
  }

  // Découpe les segments en morceaux courts : une déformation non linéaire courbe aussi les droites
  function subdivide(c, maxLen) {
    const o = [];
    let px = 0, py = 0, sx = 0, sy = 0;
    function line(x, y) {
      const n = Math.max(1, Math.ceil(Math.hypot(x - px, y - py) / maxLen));
      for (let k = 1; k <= n; k++) { const t = k / n; o.push(1, px + (x - px) * t, py + (y - py) * t); }
      px = x; py = y;
    }
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0) { px = sx = c[i]; py = sy = c[i + 1]; o.push(0, px, py); i += 2; }
      else if (op === 1) { line(c[i], c[i + 1]); i += 2; }
      else if (op === 2) {
        const x0 = px, y0 = py, x1 = c[i], y1 = c[i + 1], x2 = c[i + 2], y2 = c[i + 3]; i += 4;
        const n = Math.max(1, Math.ceil((Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1)) / maxLen));
        let ta = 0, ax = x0, ay = y0;
        for (let k = 1; k <= n; k++) {
          const tb = k / n, mt = 1 - tb;
          const bx = mt * mt * x0 + 2 * mt * tb * x1 + tb * tb * x2, by = mt * mt * y0 + 2 * mt * tb * y1 + tb * tb * y2;
          const dx = 2 * ((1 - ta) * (x1 - x0) + ta * (x2 - x1)), dy = 2 * ((1 - ta) * (y1 - y0) + ta * (y2 - y1));
          const h = (tb - ta) / 2;
          o.push(2, ax + h * dx, ay + h * dy, bx, by);
          ta = tb; ax = bx; ay = by;
        }
        px = x2; py = y2;
      } else if (op === 3) {
        const x0 = px, y0 = py, x1 = c[i], y1 = c[i + 1], x2 = c[i + 2], y2 = c[i + 3], x3 = c[i + 4], y3 = c[i + 5]; i += 6;
        const n = Math.max(1, Math.ceil((Math.hypot(x1 - x0, y1 - y0) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2)) / maxLen));
        const B = t => { const m = 1 - t; return [m * m * m * x0 + 3 * m * m * t * x1 + 3 * m * t * t * x2 + t * t * t * x3, m * m * m * y0 + 3 * m * m * t * y1 + 3 * m * t * t * y2 + t * t * t * y3]; };
        const D = t => { const m = 1 - t; return [3 * (m * m * (x1 - x0) + 2 * m * t * (x2 - x1) + t * t * (x3 - x2)), 3 * (m * m * (y1 - y0) + 2 * m * t * (y2 - y1) + t * t * (y3 - y2))]; };
        let ta = 0, A = [x0, y0];
        for (let k = 1; k <= n; k++) {
          const tb = k / n, Bb = B(tb), da = D(ta), db = D(tb), h = (tb - ta) / 3;
          o.push(3, A[0] + h * da[0], A[1] + h * da[1], Bb[0] - h * db[0], Bb[1] - h * db[1], Bb[0], Bb[1]);
          ta = tb; A = Bb;
        }
        px = x3; py = y3;
      } else {
        if (Math.hypot(px - sx, py - sy) > 1e-6) line(sx, sy);
        o.push(4); px = sx; py = sy;
      }
    }
    return o;
  }

  // Suit une polyligne dense : position et tangente à l'abscisse curviligne s
  function follower(pts) {
    const n = pts.length / 2, cum = new Float64Array(n), tx = new Float64Array(n), ty = new Float64Array(n);
    for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[2 * i] - pts[2 * i - 2], pts[2 * i + 1] - pts[2 * i - 1]);
    for (let i = 0; i < n; i++) {
      const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      const dx = pts[2 * b] - pts[2 * a], dy = pts[2 * b + 1] - pts[2 * a + 1], l = Math.hypot(dx, dy) || 1;
      tx[i] = dx / l; ty[i] = dy / l;
    }
    const L = cum[n - 1];
    function at(s) {
      if (s <= 0) return [pts[0] + tx[0] * s, pts[1] + ty[0] * s, tx[0], ty[0]];
      if (s >= L) { const e = n - 1, d = s - L; return [pts[2 * e] + tx[e] * d, pts[2 * e + 1] + ty[e] * d, tx[e], ty[e]]; }
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
      const f = (s - cum[lo]) / ((cum[hi] - cum[lo]) || 1);
      const x = pts[2 * lo] + (pts[2 * hi] - pts[2 * lo]) * f, y = pts[2 * lo + 1] + (pts[2 * hi + 1] - pts[2 * lo + 1]) * f;
      const ux = tx[lo] + (tx[hi] - tx[lo]) * f, uy = ty[lo] + (ty[hi] - ty[lo]) * f, l = Math.hypot(ux, uy) || 1;
      return [x, y, ux / l, uy / l];
    }
    return { L, at };
  }
  // repère le long d'une polyligne : x -> [point de la ligne de base, normale vers le haut des lettres]
  function pathFrame(F, s0, x0, k) {
    const kk = k || 1;
    return x => { const p = F.at(s0 + (x - x0) * kk); return [p[0], p[1], p[3], -p[2]]; };
  }
  const smooth = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

  // Cercle en 4 arcs de Bézier (sens horaire, ou inverse)
  function circle(cx, cy, r, reverse) {
    const k = 0.5522847498 * r;
    const c = [0, cx + r, cy,
      3, cx + r, cy + k, cx + k, cy + r, cx, cy + r,
      3, cx - k, cy + r, cx - r, cy + k, cx - r, cy,
      3, cx - r, cy - k, cx - k, cy - r, cx, cy - r,
      3, cx + k, cy - r, cx + r, cy - k, cx + r, cy, 4];
    if (!reverse) return c;
    return [0, cx + r, cy,
      3, cx + r, cy - k, cx + k, cy - r, cx, cy - r,
      3, cx - k, cy - r, cx - r, cy - k, cx - r, cy,
      3, cx - r, cy + k, cx - k, cy + r, cx, cy + r,
      3, cx + k, cy + r, cx + r, cy + k, cx + r, cy, 4];
  }
  function ring(cx, cy, r, w) { return circle(cx, cy, r + w, false).concat(circle(cx, cy, r, true)); }

  function bbox(c) { return root.Khatt.pathBBox(c); }

  // Tracé libre par défaut : une courbe en S douce
  const DEFAULT_FREE = (() => {
    const p = [];
    for (let i = 0; i <= 60; i++) { const t = i / 60; p.push(t, -0.12 * Math.sin(t * TAU)); }
    return p;
  })();

  // Lisse et rééchantillonne un tracé à main levée, puis le normalise (longueur 1)
  function normalizeFree(raw) {
    let p = raw.slice();
    if (p.length < 4) return null;
    for (let it = 0; it < 2; it++) { // lissage de Chaikin
      const q = [p[0], p[1]];
      for (let i = 0; i + 3 < p.length; i += 2) {
        const ax = p[i], ay = p[i + 1], bx = p[i + 2], by = p[i + 3];
        q.push(0.75 * ax + 0.25 * bx, 0.75 * ay + 0.25 * by, 0.25 * ax + 0.75 * bx, 0.25 * ay + 0.75 * by);
      }
      q.push(p[p.length - 2], p[p.length - 1]);
      p = q;
    }
    const F = follower(p);
    if (F.L < 1e-6) return null;
    const N = 160, out = [];
    for (let i = 0; i <= N; i++) { const a = F.at(F.L * i / N); out.push(a[0], a[1]); }
    // si le trait va de droite à gauche, on l'inverse pour que le texte reste à l'endroit
    if (out[out.length - 2] < out[0]) { const r = []; for (let i = out.length - 2; i >= 0; i -= 2) r.push(out[i], out[i + 1]); out.splice(0, out.length, ...r); }
    const x0 = out[0], y0 = out[1], k = 1 / F.L;
    return out.map((v, i) => Math.round(((i % 2 ? v - y0 : v - x0) * k) * 10000) / 10000);
  }

  // ---------------------------------------------------------------------------
  // Lettres rigides le long d'un repère
  // ---------------------------------------------------------------------------
  // frame(x) -> [X, Y, nx, ny] : point de la ligne de base et normale (vers le haut des lettres).
  // Sans rigidité, chaque point suit la normale locale : sur un petit cercle, les lettres hautes s'évasent.
  // Avec rigidité, près de la ligne de base (liaisons) la déformation reste locale ; du côté extérieur de la
  // courbe, chaque contour garde la normale de son point le plus éloigné de la ligne de base : fûts droits,
  // épaisseur constante, points et signes non déformés. Côté intérieur, les grands contours restent resserrés
  // (sinon ils se chevaucheraient) ; les contours très étalés et les glyphes surélevés (nastaliq) restent souples.
  function mapSpanAlong(part, sp, frame, yc, size, seg, rigid) {
    const warp = (x, y) => { const F = frame(x), h = yc - y; return [F[0] + F[2] * h, F[1] + F[3] * h]; };
    const plain = p => eachPoint(subdivide(p, seg), warp);
    if (!rigid || !sp || sp.raised || sp.lb == null) return plain(part);
    const d0 = size * 0.06, d1 = size * 0.32, lb = sp.lb;
    const out = [];
    const put = a => { for (let i = 0; i < a.length; i++) out.push(a[i]); };
    for (const ctr of root.Khatt.splitContours(part)) {
      let ex0 = Infinity, ex1 = -Infinity, best = -1, xr = 0;
      for (let i = 0; i < ctr.length;) {
        const n = NC[ctr[i++]];
        for (let j = 0; j < n; j += 2, i += 2) {
          const x = ctr[i], d = Math.abs(ctr[i + 1] - lb);
          if (d > d0) { if (x < ex0) ex0 = x; if (x > ex1) ex1 = x; }
          if (d > best) { best = d; xr = x; }
        }
      }
      if (best <= d0) { put(plain(ctr)); continue; }
      const A = frame(ex0), B = frame(ex1);
      const gf = 1 - smooth(0.35, 0.9, Math.acos(Math.min(1, Math.max(-1, A[2] * B[2] + A[3] * B[3]))));
      if (gf <= 0) { put(plain(ctr)); continue; }
      const G = frame(xr), hb = yc - lb;
      // courbure au point de référence (> 0 : les normales s'écartent au-dessus de la ligne de base)
      const e = Math.max(0.5, size * 0.02), P1 = frame(xr - e), P2 = frame(xr + e);
      const kap = ((P2[2] - P1[2]) * -G[3] + (P2[3] - P1[3]) * G[2]) / (2 * e);
      const pb = bbox(ctr), small = Math.hypot(pb.w, pb.h) < size * 0.25;
      put(eachPoint(subdivide(ctr, seg), (x, y) => {
        const F = frame(x), h = yc - y;
        const inner = kap * (h - hb) < 0;
        const w = inner && !small ? 0 : gf * smooth(d0, d1, Math.abs(y - lb));
        let nx = F[2], ny = F[3];
        if (w > 0) {
          nx += (G[2] - nx) * w; ny += (G[3] - ny) * w;
          const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        }
        // la ligne de base locale reste sur la courbe ; le reste suit la normale mélangée
        return [F[0] + F[2] * hb + nx * (h - hb), F[1] + F[3] * hb + ny * (h - hb)];
      }));
    }
    return out;
  }

  // repère d'un cercle de centre (cx, cy) et de rayon R ; xm = abscisse du texte placée en haut (ou en bas)
  function circleFrame(cx, cy, R, xm, down, spin) {
    const cs = Math.cos(spin || 0), sn = Math.sin(spin || 0);
    return x => {
      const th = (x - xm) / R, st = Math.sin(th), ct = Math.cos(th);
      let X, Y, nx, ny;
      if (down) { X = cx + R * st; Y = cy + R * ct; nx = -st; ny = -ct; }
      else { X = cx + R * st; Y = cy - R * ct; nx = st; ny = -ct; }
      if (spin) {
        const dx = X - cx, dy = Y - cy;
        X = cx + dx * cs - dy * sn; Y = cy + dx * sn + dy * cs;
        const n2 = nx * cs - ny * sn; ny = nx * sn + ny * cs; nx = n2;
      }
      return [X, Y, nx, ny];
    };
  }

  // ---------------------------------------------------------------------------
  // Contours fermés : polygone arrondi, cœur, bordures parallèles
  // ---------------------------------------------------------------------------
  // polygone régulier à N côtés, côté supérieur horizontal, coins arrondis (somme de Minkowski d'un polygone
  // de rayon inscrit rin et d'un disque de rayon r) ; parcours horaire à l'écran
  function roundedPolygon(N, rin, r, cx, cy) {
    const pts = [], step = TAU / N;
    const vd = rin / Math.cos(Math.PI / N);
    for (let k = 0; k < N; k++) {
      const a0 = -Math.PI / 2 + k * step, a1 = a0 + step, va = (a0 + a1) / 2;
      const vx = cx + vd * Math.cos(va), vy = cy + vd * Math.sin(va);
      const n = r > 1e-9 ? Math.max(2, Math.ceil(step / (Math.PI / 90))) : 1;
      for (let i = 0; i <= n; i++) {
        const a = a0 + step * i / n;
        pts.push(vx + r * Math.cos(a), vy + r * Math.sin(a));
      }
    }
    return densify(pts, Math.max(0.5, (rin + r) * 0.01));
  }
  // ajoute des points sur les segments trop longs (le suivi de tracé s'appuie sur des normales locales)
  function densify(p, maxLen) {
    const o = [];
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = (i + 2) % n, x0 = p[i], y0 = p[i + 1], x1 = p[j], y1 = p[j + 1];
      const k = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / maxLen));
      for (let t = 0; t < k; t++) o.push(x0 + (x1 - x0) * t / k, y0 + (y1 - y0) * t / k);
    }
    return o;
  }
  // fait commencer une boucle au point le plus bas (sur l'axe) et la ferme
  function startAtBottom(p, cx) {
    let bi = 0, by = -Infinity;
    for (let i = 0; i < p.length; i += 2) {
      const score = p[i + 1] - Math.abs(p[i] - cx) * 1e-3;
      if (score > by) { by = score; bi = i; }
    }
    const o = p.slice(bi).concat(p.slice(0, bi));
    o.push(o[0], o[1]);
    return o;
  }
  // cœur : deux lobes circulaires, un creux arrondi et une pointe ; unité = rayon des lobes ; parcours horaire
  const HEART = (() => {
    const a = 0.95, rho = 1.25, t = 2.45;
    const CL = [-a, 0], CR = [a, 0];
    const dd = Math.sqrt((1 + rho) * (1 + rho) - a * a), D = [0, -dd];
    const QR = [CR[0] + (D[0] - CR[0]) / (1 + rho), CR[1] + (D[1] - CR[1]) / (1 + rho)];
    const QL = [-QR[0], QR[1]];
    const T = [0, t];
    // points de tangence depuis la pointe
    const tang = (C, side) => {
      const vx = T[0] - C[0], vy = T[1] - C[1], d = Math.hypot(vx, vy), psi = Math.atan2(vy, vx), al = Math.acos(1 / d);
      const p1 = [C[0] + Math.cos(psi + al), C[1] + Math.sin(psi + al)], p2 = [C[0] + Math.cos(psi - al), C[1] + Math.sin(psi - al)];
      return side < 0 ? (p1[0] < p2[0] ? p1 : p2) : (p1[0] > p2[0] ? p1 : p2);
    };
    const PL = tang(CL, -1), PR = tang(CR, 1);
    const pts = [];
    const line = (A, B, n) => { for (let i = 0; i < n; i++) pts.push(A[0] + (B[0] - A[0]) * i / n, A[1] + (B[1] - A[1]) * i / n); };
    const arc = (C, r, A, B, cw) => {
      let a0 = Math.atan2(A[1] - C[1], A[0] - C[0]), a1 = Math.atan2(B[1] - C[1], B[0] - C[0]);
      if (cw) { while (a1 <= a0) a1 += TAU; } else { while (a1 >= a0) a1 -= TAU; }
      const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * r / 0.02));
      for (let i = 0; i < n; i++) { const q = a0 + (a1 - a0) * i / n; pts.push(C[0] + r * Math.cos(q), C[1] + r * Math.sin(q)); }
    };
    line(T, PL, 120);
    arc(CL, 1, PL, QL, true);
    arc(D, rho, QL, QR, false);
    arc(CR, 1, QR, PR, true);
    line(PR, T, 120);
    // pointe légèrement arrondie (Chaikin local)
    let p = pts;
    for (let it = 0; it < 3; it++) {
      const q = [];
      for (let i = 0, n = p.length; i < n; i += 2) {
        const j = (i + 2) % n;
        q.push(0.75 * p[i] + 0.25 * p[j], 0.75 * p[i + 1] + 0.25 * p[j + 1], 0.25 * p[i] + 0.75 * p[j], 0.25 * p[i + 1] + 0.75 * p[j + 1]);
      }
      p = q;
    }
    let per = 0;
    for (let i = 0, n = p.length; i < n; i += 2) { const j = (i + 2) % n; per += Math.hypot(p[j] - p[i], p[j + 1] - p[i + 1]); }
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 1; i < p.length; i += 2) { if (p[i] < y0) y0 = p[i]; if (p[i] > y1) y1 = p[i]; }
    return { pts: p, per, rho, cy: (y0 + y1) / 2 };
  })();
  // décale une boucle fermée horaire le long de ses normales extérieures (d > 0 : vers l'extérieur)
  function offsetLoop(p, d) {
    const n = p.length, o = new Array(n);
    for (let i = 0; i < n; i += 2) {
      const a = (i - 2 + n) % n, b = (i + 2) % n;
      let tx = p[b] - p[a], ty = p[b + 1] - p[a + 1];
      const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      o[i] = p[i] + ty * d; o[i + 1] = p[i + 1] - tx * d;
    }
    return o;
  }
  function loopToCmds(p, reverse) {
    const c = [];
    const n = p.length / 2;
    for (let k = 0; k < n; k++) {
      const i = (reverse ? n - 1 - k : k) * 2;
      c.push(k ? 1 : 0, p[i], p[i + 1]);
    }
    c.push(4);
    return c;
  }
  // bande entre deux boucles (orientation opposée → remplissage non nul)
  function band(outer, inner) { return loopToCmds(outer, false).concat(loopToCmds(inner, true)); }
  function openLoop(p) { const q = p.slice(); if (q.length > 4 && q[0] === q[q.length - 2] && q[1] === q[q.length - 1]) q.length -= 2; return q; }

  // petit ornement (séparateur du sceau) : étoile à 5 branches, losange ou point
  function ornament(kind, cx, cy, r) {
    const c = [];
    if (kind === 'dot') return circle(cx, cy, r * 0.55, false);
    const n = kind === 'diamond' ? 4 : 5, inner = kind === 'diamond' ? 0.45 : 0.42;
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * inner : r;
      c.push(i ? 1 : 0, cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    c.push(4);
    return c;
  }

  // ---------------------------------------------------------------------------
  // Application d'une forme
  // ---------------------------------------------------------------------------
  // shape = { type, bend, cover, side, spin, ring, ringW, height, ratio, amp, waves, intensity, gap, free, flip,
  //           width, rotate, rigid, sides, round, sep }
  // spans (fourni par buildText) : un morceau de cmds par glyphe ; tinfo = { lineBase, lineX } (sceau)
  // Renvoie { cmds (glyphes déformés, dans l'ordre des spans), ranges (position de chaque span dans cmds),
  //           rings (bordures et ornements), info }
  function applyShape(cmds, sh, size, baseRef, spans, tinfo) {
    const allSpan = [{ i0: 0, i1: cmds.length, lb: baseRef, raised: false, line: 0 }];
    if (!cmds.length || !sh) return { cmds, ranges: (spans || allSpan).map(s => [s.i0, s.i1]), rings: [], info: {} };
    const sp = spans && spans.length ? spans : allSpan;
    let c = cmds;
    let b = bbox(c);
    const xc0 = b.x + b.w / 2;
    // largeur des lettres
    const kx = (sh.width || 100) / 100;
    if (Math.abs(kx - 1) > 1e-3) c = eachPoint(c, (x, y) => [xc0 + (x - xc0) * kx, y]);
    b = bbox(c);
    const W = Math.max(1, b.w), Hh = Math.max(1, b.h);
    const x0 = b.x, xc = b.x + b.w / 2, ym = b.y + b.h / 2;
    // ligne de référence des formes à tracé : la ligne de base (là où les lettres se lient)
    const yc = baseRef == null ? ym : Math.min(b.y + b.h, Math.max(b.y, baseRef));
    const dUp = yc - b.y, dDown = b.y + b.h - yc;
    const type = sh.type || 'straight';
    const extra = [];
    const seg = Math.max(1, size * 0.02);
    const rigid = sh.rigid !== false;
    // rayon minimal côté extérieur (en multiple de la hauteur des lettres au-dessus de la ligne de base)
    const outerK = 1.25;
    const gapR = Hh * 0.12, ringW = Math.max(1, Hh * (sh.ringW || 8) / 100);
    let f = null, frame = null, perSpan = null;
    const info = {};
    if (type === 'arc' || type === 'arcInv' || type === 'circle') {
      let ang, down = type === 'arcInv';
      if (type === 'circle') { ang = TAU * Math.min(1, Math.max(0.2, (sh.cover || 100) / 100)); down = sh.side === 'bottom'; }
      else ang = Math.max(1, Math.min(330, sh.bend || 90)) * Math.PI / 180;
      // rayon minimal : en dessous, les lettres seraient écrasées vers le centre
      const Rmin = Math.max((down ? dUp : dDown) * 1.5, (down ? dDown : dUp) * outerK, Hh * 0.45);
      const R = Math.max(W / ang, Rmin), cy = down ? yc - R : yc + R;
      info.clamped = W / ang < Rmin;
      info.angle = W / R * 180 / Math.PI;
      info.coverage = W / (TAU * R);
      const spin = (type === 'circle' ? (sh.spin || 0) : 0) * Math.PI / 180;
      frame = circleFrame(xc, cy, R, xc, down, spin);
      if (type === 'circle' && sh.ring && sh.ring !== 'none') {
        const outer = down ? dDown : dUp, inner = down ? dUp : dDown;
        extra.push(ring(xc, cy, R + outer + gapR, ringW));
        // filet intérieur : seulement s'il reste assez grand (sinon il ressemble à une lettre au centre)
        if (sh.ring === 'double') { const ri = R - inner - gapR - ringW; if (ri > Math.max(ringW * 2, R * 0.5)) extra.push(ring(xc, cy, ri, ringW)); }
      }
    } else if (type === 'seal') {
      // sceau : 1re ligne en haut du cercle, dernière en bas (à l'endroit), lignes du milieu au centre
      const nL = tinfo && tinfo.lineBase ? tinfo.lineBase.length : 1;
      const boxes = [];
      for (const s of sp) {
        const bb = bbox(c.slice(s.i0, s.i1));
        if (!bb.w && !bb.h) continue;
        const L = s.line || 0, o = boxes[L];
        if (!o) boxes[L] = { x0: bb.x, y0: bb.y, x1: bb.x + bb.w, y1: bb.y + bb.h };
        else { o.x0 = Math.min(o.x0, bb.x); o.y0 = Math.min(o.y0, bb.y); o.x1 = Math.max(o.x1, bb.x + bb.w); o.y1 = Math.max(o.y1, bb.y + bb.h); }
      }
      const top = 0, bot = nL > 1 && boxes[nL - 1] ? nL - 1 : -1;
      const B0 = boxes[top] || { x0: b.x, y0: b.y, x1: b.x + b.w, y1: b.y + b.h }, B1 = bot > 0 ? boxes[bot] : null;
      const base0 = tinfo && tinfo.lineBase ? tinfo.lineBase[0] : yc, base1 = B1 ? tinfo.lineBase[bot] : 0;
      const up0 = base0 - B0.y0, dn0 = B0.y1 - base0;
      const up1 = B1 ? base1 - B1.y0 : 0, dn1 = B1 ? B1.y1 - base1 : 0;
      let M = null;
      for (let L = 1; L < (bot > 0 ? bot : nL); L++) {
        const o = boxes[L]; if (!o) continue;
        if (!M) M = Object.assign({}, o); else { M.x0 = Math.min(M.x0, o.x0); M.y0 = Math.min(M.y0, o.y0); M.x1 = Math.max(M.x1, o.x1); M.y1 = Math.max(M.y1, o.y1); }
      }
      const cover = Math.min(0.95, Math.max(0.3, (sh.cover || 75) / 100));
      const lineH = Math.max(B0.y1 - B0.y0, B1 ? B1.y1 - B1.y0 : 0);
      const Rmin = Math.max(dn0 * 1.5, up1 * 1.5, up0 * outerK, dn1 * outerK, lineH * 0.6);
      const W0 = B0.x1 - B0.x0, W1 = B1 ? B1.x1 - B1.x0 : 0;
      const Rw = Math.max(W0, W1) / (Math.PI * cover);
      const hasSep = !!(B1 && sh.sep && sh.sep !== 'none');
      // bloc du milieu (centré) : il ne doit toucher ni l'intérieur des lignes courbes, ni les ornements ;
      // il est d'abord réduit (jusqu'à 60 %), puis le cercle est agrandi si besoin
      const mw = M ? (M.x1 - M.x0) / 2 : 0, mh = M ? (M.y1 - M.y0) / 2 : 0, gapM = lineH * 0.1;
      // la dernière ligne descend vers la bordure : son pied rejoint le niveau des hampes de la 1re ligne
      const lift = B1 ? Math.max(0, up0 - dn1) : 0;
      const fits = (R, k) => {
        if (!M) return true;
        const w = mw * k, h = mh * k, th0 = W0 / R / 2 + 0.1, th1 = W1 / (R + lift) / 2 + 0.1;
        if (hasSep && w > R - lineH * 0.45) return false;
        for (let i = 0; i <= 20; i++) {
          const x = -w + 2 * w * i / 20;
          // bord haut (vers la 1re ligne) et bord bas (vers la dernière)
          let r = Math.hypot(x, h);
          if (Math.abs(Math.atan2(x, h)) <= th0 && r > R - dn0 - gapM) return false;
          if (B1 && Math.abs(Math.atan2(x, h)) <= th1 && r > R + lift - up1 - gapM) return false;
          // côtés : au-delà des lignes courbes, le bloc reste dans le cercle
          r = Math.hypot(w, h);
          if (r > R - gapM) return false;
        }
        return true;
      };
      // rayon de la 1re ligne (la dernière est au rayon R + lift)
      let R = Math.max(W0 / (Math.PI * cover), dn0 * 1.5, up0 * outerK, lineH * 0.6), mk = 1;
      if (B1) R = Math.max(R, W1 / (Math.PI * cover) - lift, up1 * 1.5 - lift, dn1 * outerK - lift);
      if (M) {
        let lo = 0.6, hi = 1;
        if (fits(R, 1)) mk = 1;
        else if (fits(R, 0.6)) { for (let it = 0; it < 14; it++) { const m = (lo + hi) / 2; if (fits(R, m)) lo = m; else hi = m; } mk = lo; }
        else { mk = 0.6; let n = 0; while (!fits(R, mk) && n++ < 200) R *= 1.025; }
      }
      info.clamped = Rw < R - 1e-6 && Rmin > 0;
      info.coverage = W0 / (Math.PI * R);
      info.middleScale = mk;
      const cx = xc, cy = base0 + R;
      const fTop = circleFrame(cx, cy, R, (B0.x0 + B0.x1) / 2, false, 0);
      const fBot = B1 ? circleFrame(cx, cy, R + lift, (B1.x0 + B1.x1) / 2, true, 0) : null;
      const mcx = M ? (M.x0 + M.x1) / 2 : 0, mcy = M ? (M.y0 + M.y1) / 2 : 0;
      perSpan = (part, s) => {
        const L = s.line || 0;
        if (L === top) return mapSpanAlong(part, s, fTop, base0, size, seg, rigid);
        if (L === bot) return mapSpanAlong(part, s, fBot, base1, size, seg, rigid);
        return eachPoint(part, (x, y) => [cx + (x - mcx) * mk, cy + (y - mcy) * mk]);
      };
      const outer = Math.max(up0, dn1), inner = Math.max(dn0, up1);
      const gapS = lineH * 0.12, ringWS = Math.max(1, lineH * (sh.ringW || 8) / 100);
      if (sh.ring && sh.ring !== 'none') {
        extra.push(ring(cx, cy, R + outer + gapS, ringWS));
        if (sh.ring === 'double') {
          const ri = Math.min(R - dn0, B1 ? R + lift - up1 : R - dn0) - gapS - ringWS, midR = M ? Math.hypot(mw * mk, mh * mk) + lineH * 0.05 : 0;
          if (ri > ringWS && ri > midR) extra.push(ring(cx, cy, ri, ringWS));
        }
      }
      if (B1 && sh.sep && sh.sep !== 'none') {
        const rr = (R + (up0 - dn0) / 2 + R + lift + (dn1 - up1) / 2) / 2, os = lineH * 0.16;
        extra.push(ornament(sh.sep, cx - rr, cy, os), ornament(sh.sep, cx + rr, cy, os));
      }
    } else if (type === 'bridge') {
      const A = Hh * (sh.height == null ? 50 : sh.height) / 100;
      f = (x, y) => { const u = (x - xc) / (W / 2); return [x, y - A * (1 - u * u)]; };
    } else if (type === 'flag') {
      const A = Hh * (sh.amp == null ? 25 : sh.amp) / 100, n = sh.waves || 1;
      f = (x, y) => [x, y + A * Math.sin(TAU * n * (x - x0) / W)];
    } else if (type === 'bulge') {
      const I = (sh.intensity == null ? 40 : sh.intensity) / 100;
      f = (x, y) => { const u = (x - xc) / (W / 2), k = Math.max(0.05, 1 + I * (1 - u * u)); return [x, ym + (y - ym) * k]; };
    } else if (type === 'persp') {
      const I = Math.max(-0.9, Math.min(0.9, (sh.intensity == null ? 40 : sh.intensity) / 100));
      f = (x, y) => { const u = (x - xc) / (W / 2), k = 1 + I * u; return [x, ym + (y - ym) * k]; };
    } else if (type === 'dome' || type === 'cup') {
      // dôme : bas droit, haut bombé ; coupe : haut droit, bas bombé
      const I = (sh.intensity == null ? 40 : sh.intensity) / 100, yb = b.y + b.h, yt = b.y;
      f = type === 'dome'
        ? (x, y) => { const u = (x - xc) / (W / 2), k = Math.max(0.05, 1 + I * (1 - u * u)); return [x, yb - (yb - y) * k]; }
        : (x, y) => { const u = (x - xc) / (W / 2), k = Math.max(0.05, 1 + I * (1 - u * u)); return [x, yt + (y - yt) * k]; };
    } else if (type === 'cylinder') {
      // cylindre vu de face : les lettres se resserrent vers les bords
      const ph = Math.max(0.1, Math.min(1.5, (sh.intensity == null ? 60 : sh.intensity) / 100 * (Math.PI / 2)));
      const Rc = (W / 2) / ph;
      f = (x, y) => { const a = (x - xc) / Rc, k = 1 - 0.12 * (1 - Math.cos(a)); return [xc + Rc * Math.sin(a), ym + (y - ym) * k]; };
    } else if (type === 'fisheye') {
      // loupe : grossit le centre (×(1+I)), réduit les bords ; profil r' = R·(1+I)u/(1+Iu),
      // strictement croissant quelle que soit l'intensité : les lettres des bords ne se replient jamais
      const I = Math.max(-0.8, (sh.intensity == null ? 50 : sh.intensity) / 100), Rf = Math.hypot(W, Hh) / 2 * 1.02;
      f = (x, y) => {
        const dx = x - xc, dy = y - ym, r = Math.hypot(dx, dy);
        if (r >= Rf || r < 1e-9) return [x, y];
        const k = (1 + I) / (1 + I * r / Rf);
        return [xc + dx * k, ym + dy * k];
      };
    } else if (type === 'rise') {
      // montée : la phrase s'élève (ou descend) en douceur, lettres verticales
      const A = Hh * (sh.amp == null ? 60 : sh.amp) / 100;
      f = (x, y) => { const u = (x - x0) / W, t = u * u * (3 - 2 * u); return [x, y - A * (t - 0.5)]; };
    } else if (type === 'wave' || type === 'oval' || type === 'spiral' || type === 'free' || type === 'heart' || type === 'polygon') {
      let pts;
      if (type === 'wave') {
        const A = Hh * (sh.amp == null ? 30 : sh.amp) / 100, lam = W / Math.max(0.25, sh.waves || 1.5);
        pts = [];
        for (let i = 0; i <= 400; i++) { const x = -W + 2 * W * i / 400; pts.push(x, -A * Math.sin(TAU * x / lam)); }
        const F = follower(pts);
        frame = pathFrame(F, F.L / 2 - W / 2, x0);
      } else if (type === 'oval') {
        const cover = Math.min(1, Math.max(0.2, (sh.cover || 70) / 100)), ratio = Math.min(1, Math.max(0.25, (sh.ratio || 60) / 100));
        const per = Math.PI * (3 * (1 + ratio) - Math.sqrt((3 + ratio) * (1 + 3 * ratio)));
        const Amin = Math.max(dDown * 1.5, dUp * outerK, Hh * 0.45) / ratio;
        const A = Math.max(W / cover / per, Amin), B = A * ratio;
        info.clamped = W / cover / per < Amin;
        info.coverage = W / (A * per);
        pts = [];
        for (let i = 0; i <= 720; i++) { const th = Math.PI / 2 + TAU * i / 720; pts.push(A * Math.cos(th), B * Math.sin(th)); }
        const F = follower(pts);
        frame = pathFrame(F, F.L / 2 - W / 2, x0);
        if (sh.ring && sh.ring !== 'none') {
          // bordure : ellipses concentriques (le texte est construit autour de l'origine)
          const ro = dUp + gapR, ri = dDown + gapR;
          const ell = (a, bb, rev) => { const q = []; for (let i = 0; i <= 96; i++) { const th = TAU * (rev ? -i : i) / 96; q.push(i ? 1 : 0, a * Math.cos(th), bb * Math.sin(th)); } q.push(4); return q; };
          extra.push(ell(A + ro + ringW, B + ro + ringW, false).concat(ell(A + ro, B + ro, true)));
          // filet intérieur : seulement s'il reste assez grand (sinon il fait un « anneau » vide au centre)
          if (sh.ring === 'double' && B - ri - ringW > Math.max(ringW * 2, B * 0.5)) extra.push(ell(A - ri, B - ri, false).concat(ell(A - ri - ringW, B - ri - ringW, true)));
        }
      } else if (type === 'heart' || type === 'polygon') {
        const cover = Math.min(1, Math.max(0.2, (sh.cover || (type === 'heart' ? 55 : 60)) / 100));
        const ringOn = sh.ring && sh.ring !== 'none';
        let loop, outerLoop = null, innerLoop = null, innerLoop2 = null, outerLoop2 = null;
        if (type === 'heart') {
          const H = HEART;
          const sMin = Math.max((dUp + (ringOn ? gapR + ringW : 0)) * 1.3 / H.rho, dDown * 1.5, Hh * 0.5);
          const sc = Math.max(W / cover / H.per, sMin);
          info.clamped = W / cover / H.per < sMin;
          info.coverage = W / (H.per * sc);
          loop = startAtBottom(H.pts.map((v, i) => i % 2 ? (v - H.cy) * sc : v * sc), 0);
          if (ringOn) {
            const base = openLoop(loop);
            outerLoop = offsetLoop(base, dUp + gapR + ringW); outerLoop2 = offsetLoop(base, dUp + gapR);
            if (sh.ring === 'double') { innerLoop = offsetLoop(base, -(dDown + gapR)); innerLoop2 = offsetLoop(base, -(dDown + gapR + ringW)); }
          }
        } else {
          const N = Math.max(3, Math.min(12, Math.round(sh.sides || 6)));
          const rk = Math.min(1, Math.max(0, (sh.round == null ? 35 : sh.round) / 100));
          const unitPer = 2 * N * (1 - rk) * Math.tan(Math.PI / N) + TAU * rk;
          const sMin = Math.max(dDown * 1.5 / Math.max(rk, 0.25), dUp * outerK, Hh * 0.6);
          const sc = Math.max(W / cover / unitPer, sMin);
          info.clamped = W / cover / unitPer < sMin;
          info.coverage = W / (unitPer * sc);
          const rin = sc * (1 - rk), r = sc * rk;
          loop = startAtBottom(roundedPolygon(N, rin, r, 0, 0), 0);
          if (ringOn) {
            const off = (d) => d >= -r ? roundedPolygon(N, rin, r + d, 0, 0) : roundedPolygon(N, Math.max(1, rin + r + d), 0, 0, 0);
            outerLoop = off(dUp + gapR + ringW); outerLoop2 = off(dUp + gapR);
            if (sh.ring === 'double') { innerLoop = off(-(dDown + gapR)); innerLoop2 = off(-(dDown + gapR + ringW)); }
          }
        }
        const F = follower(loop);
        frame = pathFrame(F, F.L / 2 - W / 2, x0);
        if (outerLoop) extra.push(band(outerLoop, outerLoop2));
        if (innerLoop) extra.push(band(innerLoop, innerLoop2));
      } else if (type === 'spiral') {
        const gap = Hh * Math.max(1.05, (sh.gap || 130) / 100);
        const b0 = gap / TAU, r0 = Hh * 0.9;
        pts = [];
        let th = 0, L = 0, px = r0, py = 0;
        pts.push(px, py);
        while (L < W * 1.02 + 1 && th < TAU * 40) {
          th += Math.PI / 90;
          const r = r0 + b0 * th, x = r * Math.cos(th), y = r * Math.sin(th);
          L += Math.hypot(x - px, y - py); px = x; py = y; pts.push(x, y);
        }
        // l'extrémité extérieure (début de la phrase) est placée en haut
        const rot = -Math.PI / 2 - th, cr = Math.cos(rot), sr = Math.sin(rot);
        for (let i = 0; i < pts.length; i += 2) { const x = pts[i], y = pts[i + 1]; pts[i] = x * cr - y * sr; pts[i + 1] = x * sr + y * cr; }
        const F = follower(pts);
        frame = pathFrame(F, F.L - W, x0);
      } else {
        const src = (sh.free && sh.free.length >= 4) ? sh.free : DEFAULT_FREE;
        let p = src.map(v => v * W);
        if (sh.flip) { const r = []; for (let i = p.length - 2; i >= 0; i -= 2) r.push(p[i], p[i + 1]); p = r; }
        const F = follower(p);
        // le texte occupe toute la longueur du tracé
        frame = pathFrame(F, 0, x0, F.L > 0 ? F.L / W : 1);
      }
    }
    const out = [], ranges = [];
    for (const s of sp) {
      const part = c.slice(s.i0, s.i1);
      let m;
      if (perSpan) m = perSpan(part, s);
      else if (frame) m = mapSpanAlong(part, s, frame, yc, size, seg, rigid);
      else if (f) m = eachPoint(subdivide(part, seg), f);
      else m = part;
      ranges.push([out.length, out.length + m.length]);
      for (let i = 0; i < m.length; i++) out.push(m[i]);
    }
    let rings = [];
    for (const e of extra) rings = rings.concat(e);
    // rotation de l'ensemble
    const rot = (sh.rotate || 0) * Math.PI / 180;
    if (rot) {
      const bb = bbox(out.concat(rings)), cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2, cr = Math.cos(rot), sr = Math.sin(rot);
      const R = (x, y) => { const dx = x - cx, dy = y - cy; return [cx + dx * cr - dy * sr, cy + dx * sr + dy * cr]; };
      return { cmds: eachPoint(out, R), ranges, rings: eachPoint(rings, R), info };
    }
    return { cmds: out, ranges, rings, info };
  }

  // ---------------------------------------------------------------------------
  // Compositions : miroir (musanna) et rosace
  // ---------------------------------------------------------------------------
  // inverse le sens de parcours de chaque contour (un miroir retourne l'orientation)
  function reversePath(c) {
    const out = [];
    for (const ctr of root.Khatt.splitContours(c)) {
      if (ctr[0] !== 0) continue;
      const P = [[ctr[1], ctr[2]]], segs = [];
      for (let i = 3; i < ctr.length;) {
        const op = ctr[i++];
        if (op === 4) break;
        const n = NC[op], v = ctr.slice(i, i + n); i += n;
        segs.push({ op, v });
        P.push([v[n - 2], v[n - 1]]);
      }
      const n = segs.length, last = P[n], first = P[0];
      out.push(0, first[0], first[1]);
      if (Math.hypot(last[0] - first[0], last[1] - first[1]) > 1e-9) out.push(1, last[0], last[1]);
      for (let k = n - 1; k >= 0; k--) {
        const s = segs[k], to = P[k];
        if (s.op === 1) out.push(1, to[0], to[1]);
        else if (s.op === 2) out.push(2, s.v[0], s.v[1], to[0], to[1]);
        else if (s.op === 3) out.push(3, s.v[2], s.v[3], s.v[0], s.v[1], to[0], to[1]);
      }
      out.push(4);
    }
    return out;
  }
  // parts : tableaux de cmds (lettres, signes, calques…) transformés ensemble
  function compose(parts, sh) {
    const rep = sh && sh.repeat;
    if (!rep || rep === 'none') return parts;
    let all = [];
    for (const p of parts) all = all.concat(p);
    if (!all.length) return parts;
    const B = bbox(all);
    if (rep === 'mirror') {
      const gap = B.h * ((sh.mgap == null ? 8 : sh.mgap) / 100);
      const a = B.x - gap / 2;
      return parts.map(p => p.length ? p.concat(reversePath(eachPoint(p, (x, y) => [2 * a - x, y]))) : p);
    }
    if (rep === 'rosette') {
      const N = Math.max(2, Math.min(16, Math.round(sh.copies || 6)));
      const spread = Math.max(0.4, (sh.spread == null ? 110 : sh.spread) / 100);
      const d = Math.max(B.h * 0.2, (B.w / 2) / Math.tan(Math.PI / N)) * spread;
      const cx = B.x + B.w / 2, cy = B.y + B.h + d;
      return parts.map(p => {
        if (!p.length) return p;
        let o = p;
        for (let k = 1; k < N; k++) {
          const a = TAU * k / N, ca = Math.cos(a), sa = Math.sin(a);
          o = o.concat(eachPoint(p, (x, y) => { const dx = x - cx, dy = y - cy; return [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca]; }));
        }
        return o;
      });
    }
    return parts;
  }

  root.KhattShape = { applyShape, compose, reversePath, normalizeFree, subdivide, follower, eachPoint, DEFAULT_FREE, roundedPolygon, offsetLoop, HEART };
})(typeof self !== 'undefined' ? self : globalThis);
