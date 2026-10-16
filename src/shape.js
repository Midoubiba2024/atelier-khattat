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
  // Compositions par lignes : remplir une forme, anneaux concentriques, mosaïque de tuiles
  // ---------------------------------------------------------------------------
  // lignes du texte : morceaux (spans) de chaque ligne, boîte serrée et ligne de base (null : ligne vide)
  function lineGroups(c, sp, tinfo) {
    let n = tinfo && tinfo.lines ? tinfo.lines : 0;
    for (const s of sp) n = Math.max(n, (s.line || 0) + 1);
    const G = new Array(n).fill(null);
    sp.forEach((s, k) => {
      const L = s.line || 0;
      let g = G[L];
      if (!g) g = G[L] = { line: L, idx: [], x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, lb: tinfo && tinfo.lineBase ? tinfo.lineBase[L] : s.lb };
      g.idx.push(k);
      const b = bbox(c.slice(s.i0, s.i1));
      if (!(b.w || b.h)) return;
      if (b.x < g.x0) g.x0 = b.x;
      if (b.y < g.y0) g.y0 = b.y;
      if (b.x + b.w > g.x1) g.x1 = b.x + b.w;
      if (b.y + b.h > g.y1) g.y1 = b.y + b.h;
    });
    return G.map(g => g && g.x1 > g.x0 && g.y1 > g.y0 ? Object.assign(g, { w: g.x1 - g.x0, h: g.y1 - g.y0 }) : null);
  }
  // polygone convexe (sommets en sens horaire à l'écran) aux coins arrondis : somme de Minkowski avec un disque de rayon r
  function roundPoly(V, r) {
    const o = [], n = V.length;
    for (let i = 0; i < n; i++) {
      const P = V[(i + n - 1) % n], C = V[i], N = V[(i + 1) % n];
      const a0 = Math.atan2(-(C[0] - P[0]), C[1] - P[1]);
      let a1 = Math.atan2(-(N[0] - C[0]), N[1] - C[1]);
      while (a1 < a0) a1 += TAU;
      const k = Math.max(1, Math.ceil((a1 - a0) / (Math.PI / 24)));
      for (let j = 0; j <= k; j++) { const a = a0 + (a1 - a0) * j / k; o.push(C[0] + r * Math.cos(a), C[1] + r * Math.sin(a)); }
    }
    return o;
  }
  // ---------------------------------------------------------------------------
  // Figures (calligraphie figurative) : la phrase remplit le corps d'une silhouette (voile et coque, corps du poisson,
  // coupole et salle…) ; des pièces pleines, à l'encre du texte, la complètent (mât, queue, minarets…).
  // Silhouettes originales de l'atelier. Repère brut : y vers le bas ; contours en sens horaire à l'écran, trous en sens inverse.
  // ---------------------------------------------------------------------------
  const FIGS = (() => {
    const D = Math.PI / 180;
    // tracé : segments, courbes de Bézier et arcs d'ellipse (angles en degrés, croissants = sens horaire à l'écran)
    function Pen(x, y) {
      const p = [x, y];
      let cx = x, cy = y;
      const api = {
        p,
        L(x, y) { p.push(x, y); cx = x; cy = y; return api; },
        C(x1, y1, x2, y2, x, y, n) {
          n = n || 28;
          for (let i = 1; i <= n; i++) { const t = i / n, u = 1 - t; p.push(u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x, u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y); }
          cx = x; cy = y; return api;
        },
        Q(x1, y1, x, y, n) { return api.C(cx + 2 / 3 * (x1 - cx), cy + 2 / 3 * (y1 - cy), x + 2 / 3 * (x1 - x), y + 2 / 3 * (y1 - y), x, y, n); },
        A(ox, oy, rx, ry, a0, a1, n) {
          n = n || Math.max(6, Math.ceil(Math.abs(a1 - a0) / 5));
          for (let i = 1; i <= n; i++) { const a = (a0 + (a1 - a0) * i / n) * D; p.push(ox + rx * Math.cos(a), oy + ry * Math.sin(a)); }
          cx = p[p.length - 2]; cy = p[p.length - 1]; return api;
        },
        end() { if (p.length > 4 && Math.hypot(p[0] - p[p.length - 2], p[1] - p[p.length - 1]) < 1e-9) p.length -= 2; return p; }
      };
      return api;
    }
    // demi-contour droit, du haut de l'axe (x = 0) au bas de l'axe → contour symétrique complet
    const sym = h => { const o = h.slice(); for (let i = h.length - 4; i >= 2; i -= 2) o.push(-h[i], h[i + 1]); return o; };
    const area = p => { let a = 0; for (let i = 0; i < p.length; i += 2) { const j = (i + 2) % p.length; a += p[i] * p[j + 1] - p[j] * p[i + 1]; } return a; };
    const rev = p => { const o = []; for (let i = p.length - 2; i >= 0; i -= 2) o.push(p[i], p[i + 1]); return o; };
    const cw = p => area(p) < 0 ? rev(p) : p;
    const hole = p => area(p) > 0 ? rev(p) : p;
    const disk = (x, y, r) => { const o = [], n = Math.max(16, Math.ceil(r * 160)); for (let i = 0; i < n; i++) { const a = TAU * i / n; o.push(x + r * Math.cos(a), y + r * Math.sin(a)); } return o; };
    const ringAt = (x, y, r, w) => [disk(x, y, r + w / 2), hole(disk(x, y, r - w / 2))];
    const mx = p => cw(p.map((v, i) => i % 2 ? v : -v));
    const rot = (p, deg) => { const c = Math.cos(deg * D), s = Math.sin(deg * D), o = []; for (let i = 0; i < p.length; i += 2) o.push(p[i] * c - p[i + 1] * s, p[i] * s + p[i + 1] * c); return o; };
    const bezAt = (a, b, c, d, t) => { const u = 1 - t; return [u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0], u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1]]; };
    const bezPts = (B, t0, t1, n) => { const o = []; for (let i = 0; i <= n; i++) { const q = bezAt(B[0], B[1], B[2], B[3], t0 + (t1 - t0) * i / n); o.push(q[0], q[1]); } return o; };
    // normales d'une ligne ouverte (côté gauche du sens de parcours)
    function normals(pts) {
      const o = [], n = pts.length / 2;
      for (let k = 0; k < n; k++) {
        const a = Math.max(0, k - 1), b = Math.min(n - 1, k + 1);
        let tx = pts[2 * b] - pts[2 * a], ty = pts[2 * b + 1] - pts[2 * a + 1];
        const l = Math.hypot(tx, ty) || 1;
        o.push(ty / l, -tx / l);
      }
      return o;
    }
    const shiftLine = (pts, d) => { const N = normals(pts); return pts.map((v, i) => v + N[i] * d); };
    // trait d'épaisseur w le long d'une ligne ouverte
    const stroke = (pts, w) => cw(shiftLine(pts, w / 2).concat(rev(shiftLine(pts, -w / 2))));
    // étoile à n branches, première pointe vers le haut
    const star = (x, y, R, r, n) => { const o = []; for (let j = 0; j < 2 * n; j++) { const a = -Math.PI / 2 + j * Math.PI / n, q = j % 2 ? r : R; o.push(x + q * Math.cos(a), y + q * Math.sin(a)); } return o; };
    // croissant : disque de rayon R moins un disque de rayon r décalé de d vers la droite ; ouverture tournée de deg
    function crescent(cx, cy, R, d, r, deg) {
      const x = (R * R - r * r + d * d) / (2 * d), y = Math.sqrt(R * R - x * x);
      const t1 = Math.atan2(y, x) / D, f1 = Math.atan2(y, x - d) / D;
      const P = Pen(x, y).A(0, 0, R, R, t1, 360 - t1, 90).A(d, 0, r, r, 360 - f1, f1, 80).end();
      return cw(rot(P, deg).map((v, i) => v + (i % 2 ? cy : cx)));
    }
    // coins arrondis (rayon r) d'un polygone
    function fillet(p, r) {
      const o = [], n = p.length / 2;
      for (let k = 0; k < n; k++) {
        const a = (k + n - 1) % n, b = (k + 1) % n, V = [p[2 * k], p[2 * k + 1]];
        const da = Math.hypot(p[2 * a] - V[0], p[2 * a + 1] - V[1]), db = Math.hypot(p[2 * b] - V[0], p[2 * b + 1] - V[1]);
        const q = Math.min(r, da / 2, db / 2);
        const A = [V[0] + (p[2 * a] - V[0]) * q / da, V[1] + (p[2 * a + 1] - V[1]) * q / da], B = [V[0] + (p[2 * b] - V[0]) * q / db, V[1] + (p[2 * b + 1] - V[1]) * q / db];
        for (let i = 0; i <= 6; i++) { const t = i / 6, u = 1 - t; o.push(u * u * A[0] + 2 * u * t * V[0] + t * t * B[0], u * u * A[1] + 2 * u * t * V[1] + t * t * B[1]); }
      }
      return o;
    }
    // ordonnée d'une ligne échantillonnée à l'abscisse x
    const yAt = (pts, x) => { for (let i = 0; i + 3 < pts.length; i += 2) { const a = pts[i], b = pts[i + 2]; if ((a - x) * (b - x) <= 0 && a !== b) return pts[i + 1] + (pts[i + 3] - pts[i + 1]) * (x - a) / (b - a); } return pts[1]; };
    const F = {};
    // barque : voile triangulaire bombée et coque relevée à la proue et à la poupe ; mât, fanion, vague
    F.boat = () => {
      const m = -0.18;
      const body = Pen(m, -1.0).C(0.22, -0.78, 0.66, -0.30, 0.80, 0.20).C(0.98, 0.20, 1.12, 0.10, 1.24, -0.12)
        .C(1.12, 0.36, 0.66, 0.66, 0.0, 0.66).C(-0.66, 0.66, -1.06, 0.40, -1.20, -0.04).C(-1.08, 0.12, -0.92, 0.20, -0.72, 0.20).L(m, 0.20).end();
      const wave = [];
      for (let i = 0; i <= 60; i++) { const x = -1.16 + 2.32 * i / 60; wave.push(x, 0.80 + 0.035 * Math.sin(i / 60 * TAU * 3.5)); }
      return { body: cw(body), decor: [cw([m - 0.075, -1.24, m - 0.03, -1.24, m - 0.03, 0.20, m - 0.075, 0.20]), cw([m - 0.03, -1.24, m + 0.27, -1.165, m - 0.03, -1.09]), stroke(wave, 0.035)] };
    };
    // poisson : corps (texte) ; tête pleine et son œil, queue fourchue, nageoires
    F.fish = () => {
      const U = [[-0.62, -0.12], [-0.25, -0.70], [0.62, -0.74], [1.06, -0.02]], Lo = [[1.06, -0.02], [0.72, 0.62], [-0.25, 0.62], [-0.62, 0.12]];
      const tu = 0.80, tl = 0.20, g = 0.035;
      const u1 = bezAt(...U, tu), l1 = bezAt(...Lo, tl);
      const body = Pen(U[0][0], U[0][1]);
      const up = bezPts(U, 0, tu, 30), lo = bezPts(Lo, tl, 1, 30);
      for (let i = 2; i < up.length; i += 2) body.L(up[i], up[i + 1]);
      body.Q((u1[0] + l1[0]) / 2 - 0.26, (u1[1] + l1[1]) / 2, l1[0], l1[1], 24);
      for (let i = 2; i < lo.length; i += 2) body.L(lo[i], lo[i + 1]);
      const ua = bezAt(...U, tu + g), la = bezAt(...Lo, tl - g);
      const head = Pen(ua[0], ua[1]), hu = bezPts(U, tu + g, 1, 24), hl = bezPts(Lo, 0, tl - g, 24);
      for (let i = 2; i < hu.length; i += 2) head.L(hu[i], hu[i + 1]);
      for (let i = 2; i < hl.length; i += 2) head.L(hl[i], hl[i + 1]);
      head.Q((ua[0] + la[0]) / 2 - 0.21, (ua[1] + la[1]) / 2, ua[0], ua[1], 24);
      const decor = [cw(head.end()), hole(disk(0.80, -0.17, 0.065)), disk(0.815, -0.18, 0.03)];
      decor.push(cw(Pen(-0.67, -0.10).C(-0.86, -0.22, -1.00, -0.50, -1.16, -0.64).C(-1.10, -0.36, -1.00, -0.12, -0.94, 0.0)
        .C(-1.00, 0.12, -1.10, 0.36, -1.16, 0.62).C(-1.00, 0.50, -0.86, 0.22, -0.67, 0.10).end()));
      // nageoire dorsale, rabattue vers la queue ; nageoire anale
      const db = shiftLine(bezPts(U, 0.30, 0.60, 20), 0.05), n = db.length;
      const dorsal = Pen(db[0], db[1]);
      for (let i = 2; i < n; i += 2) dorsal.L(db[i], db[i + 1]);
      dorsal.Q(db[n - 2] - 0.02, db[n - 1] - 0.20, db[n - 2] - 0.34, db[n - 1] - 0.28).Q(db[0] - 0.02, db[1] - 0.10, db[0], db[1]);
      const ab = shiftLine(bezPts(Lo, 0.62, 0.84, 14), 0.05), m = ab.length;
      const anal = Pen(ab[0], ab[1]);
      for (let i = 2; i < m; i += 2) anal.L(ab[i], ab[i + 1]);
      anal.Q(ab[m - 2] - 0.02, ab[m - 1] + 0.14, ab[m - 2] - 0.16, ab[m - 1] + 0.20).Q(ab[0] - 0.02, ab[1] + 0.06, ab[0], ab[1]);
      decor.push(cw(dorsal.end()), cw(anal.end()));
      return { body: cw(body.end()), decor };
    };
    // colombe : corps (texte) ; tête pleine, œil et bec, queue en éventail, pattes
    F.bird = () => {
      const H = [0.60, -0.55], rh = 0.175, rp = rh + 0.05, pa = 168, pb = 42;
      const P0 = [H[0] + rp * Math.cos(pa * D), H[1] + rp * Math.sin(pa * D)];
      const belly = Pen(0.50, 0.40).C(0.12, 0.60, -0.45, 0.42, -0.74, 0.07).p;
      const body = Pen(-0.74, -0.10).C(-0.40, -0.50, 0.05, -0.56, P0[0], P0[1]).A(H[0], H[1], rp, rp, pa, pb).C(0.90, -0.22, 0.86, 0.20, 0.50, 0.40);
      for (let i = 2; i < belly.length; i += 2) body.L(belly[i], belly[i + 1]);
      const at = a => [H[0] + rh * Math.cos(a * D), H[1] + rh * Math.sin(a * D)], b0 = at(-24), b1 = at(10);
      const decor = [disk(H[0], H[1], rh), hole(disk(H[0] + 0.055, H[1] - 0.035, 0.038)), disk(H[0] + 0.062, H[1] - 0.04, 0.016)];
      decor.push(cw([b0[0] - 0.03, b0[1] + 0.01, b0[0], b0[1], 0.96, H[1] + 0.015, b1[0], b1[1], b1[0] - 0.03, b1[1]]));
      // queue en éventail, deux fentes entre les plumes
      decor.push(cw(Pen(-0.79, -0.10).C(-1.0, -0.07, -1.22, 0.0, -1.43, 0.07).Q(-1.53, 0.21, -1.42, 0.36).C(-1.20, 0.27, -1.0, 0.15, -0.79, 0.07).end()));
      for (const [a, b] of [[[-0.98, -0.02], [-1.40, 0.14]], [[-0.98, 0.05], [-1.37, 0.26]]]) {
        const q = []; for (let i = 0; i <= 8; i++) q.push(a[0] + (b[0] - a[0]) * i / 8, a[1] + (b[1] - a[1]) * i / 8);
        decor.push(hole(stroke(q, 0.018)));
      }
      for (const x of [0.10, 0.28]) {
        const y = yAt(belly, x + 0.02) + 0.05;
        decor.push(cw([x, y, x + 0.04, y, x + 0.065, 0.82, x + 0.18, 0.82, x + 0.18, 0.85, x - 0.03, 0.85, x - 0.03, 0.82, x + 0.025, 0.82]));
      }
      return { body: cw(body.end()), decor };
    };
    // papillon : une aile (texte), reflétée de l'autre côté de l'axe ; corps et antennes au milieu
    F.butterfly = () => {
      const a = 0.09;
      const wing = Pen(a, -0.26).C(0.24, -0.78, 0.66, -1.02, 0.98, -0.96).C(1.14, -0.78, 1.04, -0.20, 0.78, -0.04)
        .C(1.00, 0.18, 0.96, 0.62, 0.66, 0.82).C(0.40, 0.98, 0.14, 0.62, a, 0.30).end();
      const body = sym(Pen(0, -0.62).A(0, -0.52, 0.075, 0.10, -90, 90).L(0.055, -0.40).C(0.065, -0.10, 0.06, 0.40, 0, 0.74).end());
      const ant = [];
      for (let i = 0; i <= 24; i++) { const t = i / 24; ant.push(0.02 + 0.30 * t + 0.10 * t * t, -0.60 - 0.42 * t + 0.10 * t * t * t); }
      const side = [stroke(ant, 0.025), disk(ant[ant.length - 2], ant[ant.length - 1], 0.035)];
      return { body: cw(wing), decor: [cw(body)].concat(side, side.map(mx)), mirror: true };
    };
    // mosquée : coupole et salle (texte) ; minarets, croissant au sommet, sol
    F.mosque = () => {
      const half = Pen(0, -0.88).C(0.05, -0.74, 0.24, -0.66, 0.40, -0.53).C(0.58, -0.39, 0.64, -0.16, 0.52, 0.02).C(0.48, 0.08, 0.43, 0.10, 0.40, 0.11)
        .L(0.40, 0.28).L(0.98, 0.28).L(0.98, 1.0).L(0, 1.0).end();
      const minaret = cw([1.12, -0.90, 1.175, -0.62, 1.175, -0.20, 1.215, -0.20, 1.215, -0.14, 1.175, -0.10, 1.175, 1.0,
        1.065, 1.0, 1.065, -0.10, 1.025, -0.14, 1.025, -0.20, 1.065, -0.20, 1.065, -0.62]);
      return { body: cw(sym(half)), decor: [minaret, mx(minaret), cw([-0.012, -1.07, 0.012, -1.07, 0.012, -0.905, -0.012, -0.905]), disk(0, -0.97, 0.032),
        crescent(0, -1.15, 0.08, 0.034, 0.066, -90), cw([-1.27, 1.03, 1.27, 1.03, 1.27, 1.065, -1.27, 1.065])] };
    };
    // lampe de mosquée : col évasé et panse (texte) ; pied, rebord, anses, chaînes et anneau
    F.lamp = () => {
      const half = Pen(0, -0.78).L(0.60, -0.78).C(0.52, -0.50, 0.40, -0.34, 0.40, -0.18).C(0.66, -0.12, 0.76, 0.05, 0.73, 0.20)
        .C(0.70, 0.40, 0.52, 0.56, 0.30, 0.60).L(0, 0.60).end();
      const decor = [cw(sym([0, 0.64, 0.20, 0.64, 0.30, 0.78, 0, 0.78])), cw([-0.66, -0.86, 0.66, -0.86, 0.66, -0.82, -0.66, -0.82])];
      for (const s of [1, -1]) decor.push(...ringAt(s * 0.81, 0.03, 0.05, 0.026), stroke([s * 0.80, -0.02, s * 0.74, -0.92, s * 0.05, -1.18], 0.02));
      decor.push(...ringAt(0, -1.23, 0.055, 0.024));
      return { body: cw(sym(half)), decor };
    };
    // lanterne : corps (texte) ; chapeau, anneau, pointe
    F.lantern = () => {
      const half = Pen(0, -0.62).L(0.32, -0.62).L(0.60, -0.30).L(0.60, 0.22).L(0.34, 0.56).L(0, 0.56).end();
      const cap = sym(Pen(0, -0.99).C(0.12, -0.98, 0.34, -0.88, 0.36, -0.72).L(0.44, -0.72).L(0.44, -0.665).L(0, -0.665).end());
      return { body: cw(fillet(sym(half), 0.08)), decor: [cw(cap), ...ringAt(0, -1.07, 0.06, 0.026),
        cw(sym([0, 0.60, 0.40, 0.60, 0.40, 0.655, 0.24, 0.69, 0.035, 0.90, 0, 0.90])), disk(0, 0.93, 0.035)] };
    };
    // vase : col, épaule et panse (texte) ; lèvre et pied
    F.vase = () => {
      const half = Pen(0, -0.84).L(0.30, -0.84).C(0.22, -0.72, 0.18, -0.62, 0.20, -0.52).C(0.62, -0.36, 0.72, 0.06, 0.56, 0.36)
        .C(0.46, 0.56, 0.34, 0.66, 0.24, 0.70).L(0, 0.70).end();
      return { body: cw(sym(half)), decor: [cw(sym([0, -0.93, 0.36, -0.93, 0.34, -0.885, 0, -0.885])), cw(sym([0, 0.745, 0.20, 0.745, 0.34, 0.88, 0, 0.88]))] };
    };
    // croissant (texte) ; étoile à huit branches entre les cornes
    F.crescent = () => ({ body: crescent(0, 0, 1, 0.42, 0.80, -22), decor: [cw(rot(star(0.80, 0, 0.24, 0.18, 8), -22))] });
    // étoile à huit branches (khatim)
    F.star8 = () => ({ body: cw(fillet(star(0, 0, 1, 0.765, 8), 0.035)), decor: [] });
    // arbre : feuillage (texte) ; tronc et sol
    F.tree = () => {
      const p = [];
      for (let i = 0; i < 240; i++) { const t = TAU * i / 240, f = 1 + 0.045 * Math.cos(10 * t); p.push(0.80 * f * Math.cos(t), -0.28 + 0.66 * f * Math.sin(t)); }
      return { body: cw(p), decor: [cw(sym(Pen(0, 0.352).L(0.075, 0.352).C(0.07, 0.56, 0.09, 0.78, 0.25, 1.0).L(0, 1.0).end())), cw([-0.52, 1.0, 0.52, 1.0, 0.52, 1.035, -0.52, 1.035])] };
    };
    // tulipe : coupe (texte) ; trois pétales, tige et feuilles
    F.tulip = () => {
      const half = Pen(0, -0.46).L(0.48, -0.50).C(0.56, -0.14, 0.56, 0.20, 0.40, 0.42).C(0.28, 0.56, 0.14, 0.62, 0, 0.62).end();
      const side = cw(Pen(0.24, -0.515).C(0.30, -0.70, 0.44, -0.86, 0.56, -0.92).C(0.58, -0.80, 0.56, -0.66, 0.50, -0.55).end());
      const leaf = cw(Pen(0.02, 1.20).C(0.20, 1.02, 0.40, 0.86, 0.62, 0.80).C(0.52, 0.98, 0.32, 1.14, 0.03, 1.26).end());
      const stem = [];
      for (let i = 0; i <= 20; i++) { const t = i / 20; stem.push(0.03 * Math.sin(t * Math.PI), 0.66 + 0.62 * t); }
      return { body: cw(sym(half)), decor: [cw([-0.17, -0.505, 0, -0.62, 0.17, -0.505]), cw(Pen(-0.20, -0.51).C(-0.14, -0.70, -0.06, -0.88, 0, -1.0).C(0.06, -0.88, 0.14, -0.70, 0.20, -0.51).L(0, -0.53).end()),
        side, mx(side), stroke(stem, 0.05), leaf, mx(leaf)] };
    };
    // grenade : fruit (texte) ; couronne et feuille
    F.pomegranate = () => {
      const p = [];
      for (let i = 0; i < 240; i++) { const t = TAU * i / 240; p.push(0.92 * Math.cos(t) * (1 - 0.06 * Math.sin(t)), 0.86 * Math.sin(t)); }
      return { body: cw(p), decor: [cw(sym([0, -0.885, 0.16, -0.885, 0.13, -0.99, 0.27, -1.17, 0.12, -1.07, 0.08, -1.23, 0, -1.10])),
        cw(Pen(0.18, -0.96).C(0.30, -1.12, 0.48, -1.20, 0.70, -1.20).C(0.58, -1.04, 0.40, -0.96, 0.18, -0.96).end())] };
    };
    return F;
  })();
  const FIG_KINDS = Object.keys(FIGS);
  const figCache = new Map();
  // figure dans le repère des formes : corps de hauteur 2 centré ; décor et axe du miroir suivent. left : tournée vers la gauche
  function figure(kind, ratio, left) {
    if (!Object.prototype.hasOwnProperty.call(FIGS, kind)) return null;
    const k = Math.min(3, Math.max(0.33, (ratio || 100) / 100)), key = kind + '|' + k + '|' + (left ? 1 : 0);
    let f = figCache.get(key);
    if (f) return f;
    const raw = FIGS[kind](), B = raw.body;
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < B.length; i += 2) {
      if (B[i] < x0) x0 = B[i]; if (B[i] > x1) x1 = B[i];
      if (B[i + 1] < y0) y0 = B[i + 1]; if (B[i + 1] > y1) y1 = B[i + 1];
    }
    const s = 2 / (y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, sx = (left ? -s : s) / k;
    const T = p => {
      const o = p.map((v, i) => i % 2 ? (v - cy) * s : (v - cx) * sx);
      if (!left) return o;
      const r = [];
      for (let i = o.length - 2; i >= 0; i -= 2) r.push(o[i], o[i + 1]);
      return r;
    };
    f = { body: densify(T(B), 0.04), decor: raw.decor.map(T), mirror: !!raw.mirror, axis: -cx * sx };
    figCache.set(key, f);
    return f;
  }
  // contours à remplir : hauteur 2, centrés, sens horaire à l'écran ; ratio > 100 : plus haut (plus étroit)
  const FILL_KINDS = ['tri', 'oval', 'egg', 'circle', 'capsule', 'drop', 'arch', 'diamond', 'hexagon', 'octagon', 'heart', 'rect', 'round'].concat(FIG_KINDS);
  function fillLoop(kind, ratio) {
    const fg = figure(kind, ratio, false);
    if (fg) return fg.body.slice();
    const k = Math.min(3, Math.max(0.33, (ratio || 100) / 100));
    let p = [];
    const ell = (A, f) => { for (let i = 0; i < 240; i++) { const t = TAU * i / 240; p.push(A * Math.cos(t) * (f ? f(t) : 1), Math.sin(t)); } };
    switch (kind) {
      case 'tri': p = roundPoly([[0, -1], [1.1547 / k, 1], [-1.1547 / k, 1]], 0.05); break;
      case 'diamond': p = roundPoly([[0, -1], [1.2 / k, 0], [0, 1], [-1.2 / k, 0]], 0.04); break;
      case 'hexagon': { const A = 1.1547 / k; p = roundPoly([[-A / 2, -1], [A / 2, -1], [A, 0], [A / 2, 1], [-A / 2, 1], [-A, 0]], 0.04); break; }
      case 'octagon': {
        const R = 1 / Math.cos(Math.PI / 8), V = [];
        for (let j = 0; j < 8; j++) { const a = -Math.PI / 2 - Math.PI / 8 + j * Math.PI / 4; V.push([R * Math.cos(a) / k, R * Math.sin(a)]); }
        p = roundPoly(V, 0.03); break;
      }
      case 'rect': { const A = 1.4 / k; p = roundPoly([[-A, -1], [A, -1], [A, 1], [-A, 1]], 0.03); break; }
      case 'round': { const A = 1.4 / k, r = 0.34; p = roundPoly([[-A + r, -1 + r], [A - r, -1 + r], [A - r, 1 - r], [-A + r, 1 - r]], r); break; }
      case 'circle': ell(1 / k); break;
      case 'egg': ell(0.74 / k, t => 1 + 0.2 * Math.sin(t)); break;
      case 'capsule': {
        const a = Math.max(0, 3.2 / k - 1);
        for (let i = 0; i <= 60; i++) { const t = -Math.PI / 2 + Math.PI * i / 60; p.push(a + Math.cos(t), Math.sin(t)); }
        for (let i = 0; i <= 60; i++) { const t = Math.PI / 2 + Math.PI * i / 60; p.push(-a + Math.cos(t), Math.sin(t)); }
        break;
      }
      case 'drop': {
        const T = 1 + 1.6 * k, al = Math.acos(1 / T);
        p.push(0, -T);
        for (let i = 0; i <= 120; i++) { const t = -Math.PI / 2 + al + (TAU - 2 * al) * i / 120; p.push(Math.cos(t), Math.sin(t)); }
        break;
      }
      case 'arch': {
        const O = root.KhattOrn;
        if (O) { p = O.unitShape('arch', 0.8 / k); break; }
        ell(0.8 / k); break;
      }
      case 'heart': p = HEART.pts.map((v, i) => i % 2 ? v - HEART.cy : v); break;
      default: ell(1.45 / k);
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < p.length; i += 2) {
      if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i];
      if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1];
    }
    const s = 2 / (y1 - y0), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    return densify(p.map((v, i) => i % 2 ? (v - cy) * s : (v - cx) * s), 0.04);
  }
  // même contour, élargi ou resserré pour une proportion largeur / hauteur donnée
  function loopAspect(P, aspect) {
    let x0 = Infinity, x1 = -Infinity;
    for (let i = 0; i < P.length; i += 2) { if (P[i] < x0) x0 = P[i]; if (P[i] > x1) x1 = P[i]; }
    const k = 2 * aspect / Math.max(1e-6, x1 - x0);
    return P.map((v, i) => i % 2 ? v : v * k);
  }
  // intervalle horizontal intérieur d'un contour à la hauteur y : celui qui contient xc, sinon le plus large
  function chordAt(P, y, xc) {
    const xs = [];
    for (let i = 0, n = P.length; i < n; i += 2) {
      const j = (i + 2) % n, ya = P[i + 1], yb = P[j + 1];
      if ((ya <= y && yb > y) || (yb <= y && ya > y)) xs.push(P[i] + (P[j] - P[i]) * (y - ya) / (yb - ya));
    }
    if (xs.length < 2) return null;
    xs.sort((a, b) => a - b);
    let best = null;
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = xs[k], b = xs[k + 1];
      if (a <= xc && xc <= b) return [a, b];
      if (!best || b - a > best[1] - best[0]) best = [a, b];
    }
    return best;
  }
  // cordes échantillonnées sur toute la hauteur : band(ya, yb, m) = intervalle commun à la bande, marge m comprise
  function chordTable(P, xc, n) {
    let y0 = Infinity, y1 = -Infinity;
    for (let i = 1; i < P.length; i += 2) { if (P[i] < y0) y0 = P[i]; if (P[i] > y1) y1 = P[i]; }
    const L = new Float64Array(n + 1), R = new Float64Array(n + 1), H = y1 - y0;
    for (let k = 0; k <= n; k++) {
      const y = Math.min(y1 - H * 1e-6, Math.max(y0 + H * 1e-6, y0 + H * k / n)), c = chordAt(P, y, xc);
      L[k] = c ? c[0] : NaN; R[k] = c ? c[1] : NaN;
    }
    return {
      y0, y1,
      band(ya, yb, m) {
        if (ya < y0 - 1e-9 || yb > y1 + 1e-9) return null;
        const ka = Math.max(0, Math.floor((ya - y0) / H * n)), kb = Math.min(n, Math.ceil((yb - y0) / H * n));
        let l = -Infinity, r = Infinity;
        for (let k = ka; k <= kb; k++) { if (isNaN(L[k])) return null; if (L[k] > l) l = L[k]; if (R[k] < r) r = R[k]; }
        l += m; r -= m;
        return r > l ? [l, r] : null;
      }
    };
  }
  // place des lignes (boîtes w × h) dans un contour : chaque ligne remplit la largeur disponible à sa hauteur.
  // o = { lead : écart entre lignes, grow : 0..1 (une ligne courte peut grandir jusqu'à ×4), stretch : 0..1 (étirement
  // horizontal permis), pad : marge intérieure } ; écarts et marges en fraction de la hauteur moyenne des lignes.
  // Renvoie { rows : [{ y (haut), s (échelle), sx (étirement), cx (centre) }], scale : échelle moyenne } en unités du contour
  function fitRows(rows, P, o) {
    o = o || {};
    const n = rows.length;
    if (!n) return null;
    let x0 = Infinity, x1 = -Infinity;
    for (let i = 0; i < P.length; i += 2) { if (P[i] < x0) x0 = P[i]; if (P[i] > x1) x1 = P[i]; }
    const T = chordTable(P, (x0 + x1) / 2, 480), H0 = T.y1 - T.y0;
    const grow = 1 + 3 * Math.min(1, Math.max(0, o.grow || 0));
    const st = Math.min(1, Math.max(0, o.stretch || 0)), sxMin = 1 / (1 + st / 2), sxMax = 1 + st;
    const lead = o.lead == null ? 0.18 : o.lead, padK = o.pad == null ? 0.14 : o.pad;
    let al = 0.5;
    const place = s => {
      let hs = 0;
      for (let i = 0; i < n; i++) hs += s[i] * rows[i].h;
      const hm = hs / n, G = lead * hm, m = padK * hm, H = H0 - 2 * m, tot = hs + G * (n - 1);
      let y = T.y0 + m + (H - tot) * al;
      const out = [];
      let ok = tot <= H + 1e-9;
      for (let i = 0; i < n; i++) {
        const hh = s[i] * rows[i].h, ch = T.band(y, y + hh, m);
        out.push({ y, hh, ch });
        if (!ch) ok = false;
        y += hh + G;
      }
      return { out, ok };
    };
    function lay(sig) {
      const s = rows.map(() => sig);
      for (let it = 0; it < 16; it++) {
        const { out } = place(s);
        let diff = 0;
        for (let i = 0; i < n; i++) {
          const ch = out[i].ch, cw = ch ? ch[1] - ch[0] : 0;
          const ns = ch ? Math.min(sig * grow, cw / (rows[i].w * sxMin)) : s[i] * 0.8;
          diff = Math.max(diff, Math.abs(ns - s[i]) / sig);
          s[i] = it < 3 ? ns : 0.5 * (s[i] + ns);
        }
        if (diff < 1e-3) break;
      }
      // contrôle final : chaque ligne tient dans sa corde
      const { out, ok } = place(s);
      let good = ok;
      const res = out.map((q, i) => {
        const cw = q.ch ? q.ch[1] - q.ch[0] : 0, nat = s[i] * rows[i].w;
        let sx = nat > cw ? cw / nat : Math.min(sxMax, cw / nat);
        if (sx < sxMin * 0.999) good = false;
        sx = Math.max(sxMin, sx);
        return { y: q.y, s: s[i], sx, cx: q.ch ? (q.ch[0] + q.ch[1]) / 2 : (x0 + x1) / 2 };
      });
      return { ok: good, rows: res };
    }
    const solve = () => {
      let lo = 0, hi = H0 / Math.max(1e-9, Math.min(...rows.map(r => r.h))), best = null;
      const top = lay(hi);
      if (top.ok) best = top;
      else {
        for (let it = 0; it < 34; it++) {
          const mid = (lo + hi) / 2, r = lay(mid);
          if (r.ok) { lo = mid; best = r; } else hi = mid;
        }
      }
      if (!best) best = lay(Math.max(lo, hi * 1e-3));
      best.scale = best.rows.reduce((a, r) => a + r.s, 0) / n || 1;
      return best;
    };
    // part de la forme couverte par les lignes (boîtes des lignes, étirement compris)
    let A0 = 0;
    for (let i = 0; i < P.length; i += 2) { const j = (i + 2) % P.length; A0 += P[i] * P[j + 1] - P[j] * P[i + 1]; }
    A0 = Math.abs(A0) / 2 || 1;
    const cover = r => r.rows.reduce((a, q, i) => a + q.s * rows[i].h * q.s * q.sx * rows[i].w, 0) / A0;
    // remplissage d'une figure : surface couverte, hauteur occupée, et aucune ligne minuscule à côté des autres
    const fillQ = r => {
      const q0 = r.rows[0], q1 = r.rows[n - 1], span = Math.max(0, (q1.y + q1.s * rows[n - 1].h - q0.y) / H0);
      let mn = Infinity, mxs = 0;
      for (const q of r.rows) { if (q.s < mn) mn = q.s; if (q.s > mxs) mxs = q.s; }
      const ratio = mxs > 0 ? mn / mxs : 0;
      return cover(r) * Math.sqrt(span) * (ratio < 0.3 ? (ratio / 0.3) * (ratio / 0.3) : 1);
    };
    // centré d'abord ; un autre alignement n'est retenu que s'il agrandit nettement le texte (pyramide, goutte…),
    // ou, pour une figure (o.score = 'area'), s'il la remplit nettement mieux
    const better = (r, w) => o.score === 'area' ? fillQ(r) > fillQ(w) * 1.02 : r.scale > w.scale * 1.02;
    let win = solve();
    for (const a of o.align == null ? [1, 0.75, 0.25, 0] : []) {
      al = a;
      const r = solve();
      if (better(r, win)) win = r;
    }
    if (o.align != null) { al = o.align; win = solve(); }
    return { rows: win.rows, scale: win.scale, area: cover(win), fill: fillQ(win) };
  }
  function pushAllS(a, b) { for (let i = 0; i < b.length; i++) a.push(b[i]); return a; }
  const tileLoopAt = (L, cx, cy, k0) => L.map((v, i) => i % 2 ? cy + v * k0 : cx + v * k0);
  // couleurs des tuiles (mosaïque) ; accent : tuile du titre placée au centre
  const PALETTES = {
    pastel: { tiles: ['#F6D5C8', '#D6E7CF', '#F8E6B3', '#D2E2F1', '#E8D7EC', '#F2D2D9', '#D3ECE5', '#FBE2C6'], accent: '#EED9A0' },
    jewel: { tiles: ['#1F5F8B', '#7A1F3D', '#1F6B4F', '#4B2E83', '#0F7173', '#8C4A12'], accent: '#B8892B' },
    earth: { tiles: ['#D9C29E', '#C49A72', '#E6D5B8', '#B07F5A', '#D1B48C', '#E9DCC4'], accent: '#9C6B3C' },
    gold: { tiles: ['#F1DFA8', '#E8CF86', '#F6E8C1'], accent: '#D4A537' },
    none: { tiles: [], accent: '' }
  };
  // éclaircir (mélange avec du blanc) ; clarté perçue (0 noir … 1 blanc)
  function tint(hex, t) {
    const h = String(hex).replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16) || 0;
    const f = v => Math.round(v + (255 - v) * t).toString(16).padStart(2, '0');
    return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
  }
  function lum(hex) {
    const h = String(hex).replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16) || 0;
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }
  function shade(hex, t) {
    const h = String(hex).replace('#', ''), n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16) || 0;
    const f = v => Math.round(v * (1 - t)).toString(16).padStart(2, '0');
    return '#' + f((n >> 16) & 255) + f((n >> 8) & 255) + f(n & 255);
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
    const info = {}, panels = [], lineRings = new Map();
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
    } else if (type === 'fill') {
      // remplir une forme : chaque ligne occupe la largeur de la forme à sa hauteur
      const G = lineGroups(c, sp, tinfo).filter(Boolean);
      const FG = figure(sh.fillShape, sh.fratio, sh.face === 'left');
      const P = FG ? FG.body : fillLoop(sh.fillShape || 'oval', sh.fratio);
      const R = fitRows(G.map(g => ({ w: g.w, h: g.h })), P, { lead: (sh.lead == null ? 18 : sh.lead) / 100, grow: (sh.grow == null ? 40 : sh.grow) / 100, stretch: (sh.stretch == null ? 10 : sh.stretch) / 100, score: FG ? 'area' : null });
      if (R) {
        const Q = 1 / R.scale, fns = new Map();
        let hm = 0;
        G.forEach((g, i) => {
          const r = R.rows[i], xm = (g.x0 + g.x1) / 2;
          hm += r.s * Q * g.h / G.length;
          const fn = (x, y) => [(r.cx + (x - xm) * r.s * r.sx) * Q, (r.y + (y - g.y0) * r.s) * Q];
          for (const k of g.idx) fns.set(k, fn);
        });
        // figure en miroir (papillon) : chaque ligne est reflétée de l'autre côté de l'axe
        const ax = FG && FG.mirror ? FG.axis * Q : null, mir = cm => reversePath(eachPoint(cm, (x, y) => [2 * ax - x, y]));
        perSpan = (part, s, k) => {
          const fn = fns.get(k);
          if (!fn) return part;
          const m = eachPoint(part, fn);
          return ax == null ? m : m.concat(mir(m));
        };
        info.rows = G.length;
        if (sh.ring && sh.ring !== 'none') {
          const PQ = P.map(v => v * Q), w = Math.max(1, hm * (sh.ringW || 8) / 100 * 1.2), g0 = hm * 0.04;
          const bands = [band(offsetLoop(PQ, g0 + w), offsetLoop(PQ, g0))];
          if (sh.ring === 'double') bands.push(band(offsetLoop(PQ, g0 + w * 2.6), offsetLoop(PQ, g0 + w * 2)));
          for (const b of bands) { extra.push(b); if (ax != null) extra.push(mir(b)); }
        }
        // pièces de la figure (mât, queue, minarets…), à l'encre du texte
        if (FG && sh.decor !== 'off') for (const d of FG.decor) extra.push(loopToCmds(d.map(v => v * Q), false));
      }
    } else if (type === 'rings') {
      // médaillon : les premières lignes au centre, les suivantes en anneaux concentriques
      const G = lineGroups(c, sp, tinfo).filter(Boolean);
      const nc = Math.max(1, Math.min(G.length, Math.round(sh.center || 1)));
      const C = G.slice(0, nc), RL = G.slice(nc);
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity, hRef = 0;
      for (const g of C) { bx0 = Math.min(bx0, g.x0); by0 = Math.min(by0, g.y0); bx1 = Math.max(bx1, g.x1); by1 = Math.max(by1, g.y1); hRef = Math.max(hRef, g.h); }
      const bcx = (bx0 + bx1) / 2, bcy = (by0 + by1) / 2;
      // rayon du bloc central : son point le plus éloigné du centre
      let rC = 0;
      for (const g of C) for (const k of g.idx) eachPoint(c.slice(sp[k].i0, sp[k].i1), (x, y) => { const d = Math.hypot(x - bcx, y - bcy); if (d > rC) rC = d; return [x, y]; });
      rC *= 1.04;
      const gap = (sh.rgap == null ? 14 : sh.rgap) / 100 * hRef, sepOn = !!(sh.sep && sh.sep !== 'none');
      const lines = sh.rlines === 'thin', lw = Math.max(0.6, hRef * 0.035);
      const fns = new Map();
      for (const g of C) for (const k of g.idx) fns.set(k, part => eachPoint(part, (x, y) => [x - bcx, y - bcy]));
      let Pr = rC, prevT = hRef * 0.5, cover = 1;
      RL.forEach((g, j) => {
        if (lines) extra.push(ring(0, 0, Pr + gap * 0.5 - lw / 2, lw));
        const dUp = Math.max(1e-6, g.lb - g.y0), dDn = Math.max(0, g.y1 - g.lb), th = dUp + dDn, w = g.w;
        const inner = Pr + gap, sepW = (sepOn ? 1.1 : 0.45) * th;
        const cap = (j === 0 ? hRef * 0.55 : prevT * 1.15) / th;
        const den1 = w + sepW - TAU * dDn;
        let s = den1 > 0.08 * (w + sepW) ? TAU * inner / den1 : Infinity, m = 1;
        if (s > cap) {
          if (sh.rfill === 'off') s = cap;
          else {
            m = Math.max(1, Math.ceil(TAU * (inner + cap * dDn) / (cap * (w + sepW))));
            const den = m * (w + sepW) - TAU * dDn;
            s = den > 0 ? TAU * inner / den : cap;
          }
        }
        const R = inner + s * dDn, fr = circleFrame(0, 0, R, 0, false, 0), xm = (g.x0 + g.x1) / 2, step = (w + sepW) * s;
        cover = Math.min(cover, m * step / (TAU * R));
        for (const k of g.idx) fns.set(k, (part, span) => {
          const adj = { lb: 0, raised: span.raised, mark: span.mark };
          let o = [];
          for (let q = 0; q < m; q++) o = o.concat(mapSpanAlong(eachPoint(part, (x, y) => [(x - xm) * s + q * step, (y - g.lb) * s]), adj, fr, 0, size * s, seg, rigid));
          return o;
        });
        if (sepOn) {
          const rr = R + s * (dUp - dDn) / 2, os = th * s * 0.2;
          for (let q = 0; q < m; q++) { const a = (q + 0.5) * step / R; extra.push(ornament(sh.sep, rr * Math.sin(a), -rr * Math.cos(a), os)); }
        }
        Pr = R + s * dUp; prevT = th * s;
      });
      info.coverage = cover;
      if (sh.ring && sh.ring !== 'none') {
        const rw = Math.max(1, hRef * (sh.ringW || 8) / 100), r0 = Pr + gap * 0.8;
        extra.push(ring(0, 0, r0, rw));
        if (sh.ring === 'double') extra.push(ring(0, 0, r0 + rw * 2.2, rw * 0.5));
      }
      perSpan = (part, s, k) => { const fn = fns.get(k); return fn ? fn(part, s) : part; };
    } else if (type === 'tiles') {
      // mosaïque : chaque ligne (ou chaque paragraphe, s'il y a des lignes vides) devient une tuile ; la 1re peut servir de titre
      const GL = lineGroups(c, sp, tinfo);
      const fi = GL.findIndex(Boolean);
      let li = GL.length - 1;
      while (li > 0 && !GL[li]) li--;
      let para = false;
      for (let i = Math.max(0, fi); i <= li; i++) if (!GL[i]) { para = true; break; }
      let blocks = [];
      if (para) { let cur = []; for (const g of GL) { if (g) cur.push(g); else if (cur.length) { blocks.push(cur); cur = []; } } if (cur.length) blocks.push(cur); }
      else blocks = GL.filter(Boolean).map(g => [g]);
      const tmode = blocks.length > 1 ? (sh.title || 'top') : 'none';
      const title = tmode !== 'none' ? blocks.shift() : null;
      const kind = sh.tile || 'capsule';
      const TP = fillLoop(kind === 'cartouche' ? 'capsule' : kind, sh.fratio);
      let tx0 = Infinity, tx1 = -Infinity;
      for (let i = 0; i < TP.length; i += 2) { if (TP[i] < tx0) tx0 = TP[i]; if (TP[i] > tx1) tx1 = TP[i]; }
      const asp = (tx1 - tx0) / 2;
      const fopt = { lead: 0.14, grow: 1, stretch: 0.15, pad: 0.2 };
      const fits = blocks.map(b => fitRows(b.map(g => ({ w: g.w, h: g.h })), TP, fopt));
      const scs = fits.map(f => f ? f.scale : 0).filter(v => v > 0).sort((a, b) => a - b);
      const med = scs.length ? scs[Math.floor(scs.length / 2)] : 1;
      const T = 2 / med, cw = asp * T, gp = (sh.tgap == null ? 10 : sh.tgap) / 100 * T;
      const n = blocks.length, center = tmode === 'center';
      const gridOf = cols => {
        let cs = 0;
        if (center) cs = cols % 2 ? (cols >= 7 ? 3 : 1) : 2;
        let rows = Math.max(1, Math.ceil((n + cs * cs) / cols));
        if (center) { if (rows < cs) rows = cs; if ((rows - cs) % 2) rows++; }
        return { cols, rows, cs, empty: rows * cols - cs * cs - n, W: cols * cw + (cols - 1) * gp, H: rows * T + (rows - 1) * gp };
      };
      let grid;
      if (sh.cols > 0) grid = gridOf(Math.max(center ? 2 : 1, Math.round(sh.cols)));
      else {
        const target = tmode === 'top' ? 1.25 : 1.05;
        for (let cols = center ? 2 : 1; cols <= Math.max(center ? 2 : 1, Math.min(12, n)); cols++) {
          const g = gridOf(cols), e = Math.abs(Math.log(g.W / g.H / target)) + 0.06 * g.empty;
          if (!grid || e < grid.e - 1e-9) grid = Object.assign(g, { e });
        }
      }
      // cases dans l'ordre de lecture (de droite à gauche), sans le bloc central réservé au titre
      const r0 = (grid.rows - grid.cs) / 2, c0 = (grid.cols - grid.cs) / 2, cells = [];
      for (let r = 0; r < grid.rows && cells.length < n; r++) {
        const row = [];
        for (let q = 0; q < grid.cols; q++) {
          if (center && r >= r0 && r < r0 + grid.cs && q >= c0 && q < c0 + grid.cs) continue;
          row.push(q);
        }
        const take = row.slice(0, n - cells.length);
        // dernière rangée incomplète : centrée
        const shift = take.length < row.length && cells.length + take.length === n ? (row.length - take.length) / 2 : 0;
        for (const q of take) cells.push({ r, q: q + shift, x: (grid.cols - 1 - (q + shift)) * (cw + gp) + cw / 2, y: r * (T + gp) + T / 2 });
      }
      const pal = PALETTES[sh.palette] || PALETTES.pastel, fns = new Map();
      const tileRing = sh.ring && sh.ring !== 'none', rw = T * 0.028;
      const place = (b, f, cx, cy, k0) => b.forEach((g, i) => {
        const rr = f.rows[i], xm = (g.x0 + g.x1) / 2;
        const fn = (x, y) => [cx + (rr.cx + (x - xm) * rr.s * rr.sx) * k0, cy + (rr.y + (y - g.y0) * rr.s) * k0];
        for (const k of g.idx) fns.set(k, fn);
      });
      const tileLoop = (L, cx, cy, k0) => L.map((v, i) => i % 2 ? cy + v * k0 : cx + v * k0);
      blocks.forEach((b, t) => {
        const f = fits[t], cell = cells[t];
        if (!f || !cell) return;
        place(b, f, cell.x, cell.y, T / 2 * Math.min(1, med * 1.15 / f.scale));
        const L = tileLoop(TP, cell.x, cell.y, T / 2);
        const col = pal.tiles.length ? pal.tiles[Math.round(cell.q + 2 * cell.r) % pal.tiles.length] : null;
        if (col) panels.push({ path: loopToCmds(L), color: col });
        if (tileRing) { const B = band(offsetLoop(L, rw), L); if (col) panels.push({ path: B, color: shade(col, 0.35) }); else extra.push(B); }
      });
      if (title) {
        const tf = b => fitRows(b.map(g => ({ w: g.w, h: g.h })), b === title ? TL : TP, fopt);
        let TL, cx, cy, k0, Wt, Ht;
        if (center) {
          Wt = grid.cs * cw + (grid.cs - 1) * gp; Ht = grid.cs * T + (grid.cs - 1) * gp;
          TL = loopAspect(TP, Wt / Ht);
          cx = (grid.cols - 1 - (c0 + (grid.cs - 1) / 2)) * (cw + gp) + cw / 2; cy = (r0 + (grid.cs - 1) / 2) * (T + gp) + T / 2;
        } else {
          Wt = grid.W; Ht = T * 1.35;
          TL = loopAspect(fillLoop('rect', 100), Wt / Ht);
          cx = grid.W / 2; cy = -gp * 1.4 - Ht / 2;
        }
        k0 = Ht / 2;
        const f = tf(title);
        if (f) {
          place(title, f, cx, cy, k0);
          const L = tileLoop(TL, cx, cy, k0);
          if (center && pal.accent) panels.push({ path: loopToCmds(L), color: pal.accent });
          if (center && tileRing) { const B = band(offsetLoop(L, rw * 1.3), L); if (pal.accent) panels.push({ path: B, color: shade(pal.accent, 0.35) }); else extra.push(B); }
        }
      }
      info.tiles = n;
      perSpan = (part, s, k) => { const fn = fns.get(k); return fn ? eachPoint(part, fn) : part; };
    } else if (type === 'tughra') {
      // tughra : hampes du nom étirées vers le haut (tuğ), deux boucles en croissant à gauche (beyze),
      // deux traits effilés qui filent vers la droite (hançer) ; les autres lignes, plus petites, sous le nom
      const G = lineGroups(c, sp, tinfo).filter(Boolean);
      const g0 = G[0], lb = g0.lb, dUp = Math.max(1e-6, lb - g0.y0), dDn = Math.max(0, g0.y1 - lb), Hb = dUp + dDn, W0 = g0.w;
      const k = 1 + 2.4 * Math.min(1, Math.max(0, ((sh.height == null ? 60 : sh.height) + 100) / 200));
      const yT = lb - dUp * 0.42;
      const fns = new Map();
      // hampes : traits étroits qui montent au-dessus de yT (alif, lām, ṭā'…) ; seules elles s'allongent,
      // le corps des lettres (même haut, comme le mīm du ruqʿa) garde sa forme
      const namePath = [];
      for (const i of g0.idx) pushAllS(namePath, c.slice(sp[i].i0, sp[i].i1));
      const polys = root.Khatt.flatten(namePath, Math.max(0.2, size * 0.004));
      const cross = y => {
        const xs = [];
        for (const p of polys) for (let i = 0, n = p.length; i < n; i += 2) {
          const j = (i + 2) % n, ya = p[i + 1], yb = p[j + 1];
          if ((ya <= y && yb > y) || (yb <= y && ya > y)) xs.push([p[i] + (p[j] - p[i]) * (y - ya) / (yb - ya), yb > ya ? 1 : -1]);
        }
        xs.sort((a, b2) => a[0] - b2[0]);
        const I = [];
        let w = 0;
        for (let q = 0; q < xs.length - 1; q++) {
          w += xs[q][1];
          if (!w) continue;
          const L = I[I.length - 1];
          if (L && xs[q][0] - L[1] < 1e-6) L[1] = xs[q + 1][0]; else I.push([xs[q][0], xs[q + 1][0]]);
        }
        return I;
      };
      const ys1 = yT - (yT - g0.y0) * 0.35, ys2 = yT - (yT - g0.y0) * 0.7, I2 = cross(ys2), shafts = [];
      for (const [a, b2] of cross(ys1)) {
        const w = b2 - a;
        if (w > dUp * 0.22) continue;
        const xc1 = (a + b2) / 2;
        // la même hampe plus haut : sa pente (dīwānī, ruqʿa)
        let lean = 0, best = Infinity, w2 = 0;
        for (const [a2, b3] of I2) {
          const d = Math.abs((a2 + b3) / 2 - xc1);
          if (b3 - a2 < dUp * 0.25 && d < Math.max(w * 1.5, dUp * 0.12) && d < best) { best = d; w2 = b3 - a2; lean = ((a2 + b3) / 2 - xc1) / (ys2 - ys1); }
        }
        // une hampe continue plus haut, sans s'élargir beaucoup ni trop pencher (sinon : lettres empilées, trait oblique)
        if (best === Infinity || w2 > w * 2.2 || Math.abs(lean) > 0.35) continue;
        shafts.push({ xc: xc1, hw: w / 2, lean });
      }
      // poids d'étirement : 1 dans la hampe, décroissance douce sur ses côtés (pas de déchirure)
      const wAt = (x, y) => {
        let m = 0;
        for (const h of shafts) {
          const u = Math.abs(x - (h.xc + h.lean * (y - ys1))) / (h.hw * 1.6 + size * 0.01);
          const v = u <= 1 ? 1 : u >= 2 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * (u - 1));
          if (v > m) m = v;
        }
        return m;
      };
      const lift = (x, y) => [x, y < yT ? yT - (yT - y) * (1 + (k - 1) * wAt(x, y)) : y];
      // contours : les petits (points, signes) sont déplacés d'un bloc, les autres étirés
      let yTop = g0.y0;
      for (const i of g0.idx) {
        const out2 = [];
        for (const ctr of root.Khatt.splitContours(c.slice(sp[i].i0, sp[i].i1))) {
          const bc = bbox(ctr);
          if (Math.max(bc.w, bc.h) < size * 0.2) {
            const cx = bc.x + bc.w / 2, cy = bc.y + bc.h / 2, ny = lift(cx, cy)[1];
            pushAllS(out2, eachPoint(ctr, (x, y) => [x, y + ny - cy]));
          } else pushAllS(out2, eachPoint(subdivide(ctr, seg), lift));
        }
        if (out2.length) yTop = Math.min(yTop, bbox(out2).y);
        fns.set(i, () => out2);
      }
      info.shafts = shafts.length;
      // lignes suivantes : en dessous, au tiers de la taille, centrées sous le nom
      let yNext = g0.y1 + Hb * 0.25;
      G.slice(1).forEach(g => {
        const s2 = Math.min(0.45, W0 * 0.8 / Math.max(1, g.w)), cx2 = (g0.x0 + g0.x1) / 2, xm = (g.x0 + g.x1) / 2, top = yNext;
        for (const i of g.idx) fns.set(i, part => eachPoint(part, (x, y) => [cx2 + (x - xm) * s2, top + (y - g.y0) * s2]));
        yNext += g.h * s2 + Hb * 0.12;
      });
      perSpan = (part, s, i) => { const fn = fns.get(i); return fn ? fn(part, s) : part; };
      // boucles (beyze) : croissants épais à gauche, fins à droite, à gauche du nom ; d'après le plan des tughra,
      // elles occupent les deux tiers bas de la hauteur totale (hampes comprises)
      const Htot = g0.y1 - yTop;
      const t = Hb * 0.14, ry1 = Math.max(Hb * 0.7, Htot * 0.41), rx1 = ry1 * 1.12;
      const cx1 = g0.x0 - rx1 * 0.8, cy1 = yTop + Htot * 0.6;
      const crescent = (cx, cy, rx, ry, th) => {
        const o = [], inr = [];
        for (let q = 0; q < 120; q++) {
          const a = TAU * q / 120;
          o.push(cx + rx * Math.cos(a), cy + ry * Math.sin(a));
          inr.push(cx + th * 0.6 + (rx - th * 0.75) * Math.cos(a), cy - th * 0.1 + (ry - th * 0.45) * Math.sin(a));
        }
        return band(o, inr);
      };
      extra.push(crescent(cx1, cy1, rx1, ry1, t));
      extra.push(crescent(cx1 + rx1 * 0.2, cy1 + ry1 * 0.1, rx1 * 0.66, ry1 * 0.64, t * 0.85));
      // traits vers la droite (hançer) : deux lames effilées
      const blade = (x0b, y0b, x1b, y1b, bend, th) => {
        const up = [], dn = [];
        for (let q = 0; q <= 60; q++) {
          const u = q / 60, x = x0b + (x1b - x0b) * u, y = y0b + (y1b - y0b) * u - bend * Math.sin(Math.PI * u);
          const h = th * (1 - u) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 3)));
          up.push(x, y - h); dn.push(x, y + h);
        }
        const o = [];
        for (let q = 0; q < up.length; q += 2) o.push(q ? 1 : 0, up[q], up[q + 1]);
        for (let q = dn.length - 2; q >= 0; q -= 2) o.push(1, dn[q], dn[q + 1]);
        o.push(4);
        return o;
      };
      // les traits partent du creux des boucles et traversent les hampes, au-dessus du corps des lettres
      // (au-dessus de yT : seules les hampes sont traversées, le corps des lettres reste lisible)
      const xs = cx1 - rx1 * 0.2, xe = g0.x1 + Math.min(W0 * 0.3, Hb * 1.6), yk = q => yT - Math.max(yT - yTop, dUp * 0.58) * q;
      extra.push(blade(xs, yk(0.45), xe, yk(0.62), Hb * 0.08, t * 0.5));
      extra.push(blade(xs, yk(0.15), xe - Math.min(W0 * 0.06, Hb * 0.3), yk(0.3), Hb * 0.05, t * 0.42));
      info.tughra = true;
    } else if (type === 'wings') {
      // médaillon et ailes : la 1re ligne dans un cercle, la 2e à droite, la 3e à gauche, reliées par un long trait
      const G = lineGroups(c, sp, tinfo).filter(Boolean);
      const g0 = G[0], b0x = (g0.x0 + g0.x1) / 2, b0y = (g0.y0 + g0.y1) / 2;
      let rC = 0;
      for (const i of g0.idx) eachPoint(c.slice(sp[i].i0, sp[i].i1), (x, y) => { const d = Math.hypot(x - b0x, y - b0y); if (d > rC) rC = d; return [x, y]; });
      rC *= 1.05;
      const gap = rC * 0.12, rw = Math.max(1, rC * (sh.ringW || 8) / 100 * 0.6);
      const fns = new Map();
      for (const i of g0.idx) fns.set(i, part => eachPoint(part, (x, y) => [x - b0x, y - b0y]));
      if (sh.ring !== 'none') extra.push(ring(0, 0, rC + gap, rw));
      if (sh.ring === 'double') extra.push(ring(0, 0, rC + gap + rw * 2.2, rw * 0.5));
      // bord extérieur du médaillon
      const rOut = sh.ring === 'double' ? rC + gap + rw * 2.7 : sh.ring !== 'none' ? rC + gap + rw : rC;
      const wingBase = rC * 0.62, side = [];
      G.slice(1, 3).forEach((g, j) => {
        const s = Math.min(1.75 * rC / Math.max(1, g.h), 2.7 * rC / Math.max(1, g.w));
        const right = j === 0, x0w = right ? rC + gap * 3.2 : -(rC + gap * 3.2) - g.w * s;
        for (const i of g.idx) fns.set(i, part => eachPoint(part, (x, y) => [x0w + (x - g.x0) * s, wingBase + (y - g.lb) * s]));
        side.push({ line: g.line, x0: x0w, x1: x0w + g.w * s, h: (g.lb - g.y0) * s });
      });
      // long trait (kashida) sous le médaillon, d'une aile à l'autre
      if (side.length === 2 && sh.swash !== 'off') {
        const th = side[0].h * 0.075, xa = side[0].x0 + side[0].h * 0.15, xb = side[1].x1 - side[1].h * 0.15, y = wingBase + th * 0.6;
        // au milieu, le trait passe juste sous le cercle (ou sous le texte du médaillon s'il n'y a pas de cercle)
        const sag = Math.max(rC * 0.28, rOut + th * 1.6 - y);
        const up = [], dn = [];
        for (let q = 0; q <= 80; q++) {
          const u = q / 80, x = xa + (xb - xa) * u, yy = y + sag * Math.sin(Math.PI * u), h = th * (0.25 + 0.75 * Math.sin(Math.PI * u) ** 0.35);
          up.push(x, yy - h); dn.push(x, yy + h);
        }
        const o = [];
        for (let q = 0; q < up.length; q += 2) o.push(q ? 1 : 0, up[q], up[q + 1]);
        for (let q = dn.length - 2; q >= 0; q -= 2) o.push(1, dn[q], dn[q + 1]);
        o.push(4);
        lineRings.set(side[0].line, (lineRings.get(side[0].line) || []).concat(o));
      }
      // lignes suivantes : centrées sous le médaillon, plus petites
      let yb = rOut + (side.length === 2 && sh.swash !== 'off' ? side[0].h * 0.3 : rC * 0.15);
      G.slice(3).forEach(g => {
        const s2 = Math.min(0.9 * rC / Math.max(1, g.h), 3.2 * rC / Math.max(1, g.w)), xm = (g.x0 + g.x1) / 2, top = yb;
        for (const i of g.idx) fns.set(i, part => eachPoint(part, (x, y) => [(x - xm) * s2, top + (y - g.y0) * s2]));
        yb += g.h * s2 * 1.1;
      });
      perSpan = (part, s, i) => { const fn = fns.get(i); return fn ? fn(part, s) : part; };
    } else if (type === 'hilye') {
      // panneau à compartiments (d'après le plan des hilye ottomanes) : bandeau en haut, rond central et croissant,
      // quatre médaillons d'angle, bandeau du verset, panneau du bas ; une ligne de texte par compartiment
      const G = lineGroups(c, sp, tinfo).filter(Boolean);
      const U = size * 10, pal = PALETTES[sh.palette] || PALETTES.gold;
      // compartiments à texte toujours clairs (encre foncée lisible) ; panneaux décoratifs et croissant en couleur franche
      const deco = pal.tiles[0] || '#F1E3B6', acc = pal.accent || '#D4A537', tile = lum(deco) < 0.62 ? tint(deco, 0.72) : deco;
      const cells = [
        { kind: 'band', x: 0.5, y: 0.1, w: 0.84, h: 0.11 },
        { kind: 'circle', x: 0.5, y: 0.42, w: 0.42, h: 0.42 },
        { kind: 'circle', x: 0.83, y: 0.23, w: 0.15, h: 0.15 }, { kind: 'circle', x: 0.17, y: 0.23, w: 0.15, h: 0.15 },
        { kind: 'circle', x: 0.83, y: 0.62, w: 0.15, h: 0.15 }, { kind: 'circle', x: 0.17, y: 0.62, w: 0.15, h: 0.15 },
        { kind: 'band', x: 0.5, y: 0.81, w: 0.84, h: 0.1 },
        { kind: 'rect', x: 0.5, y: 1.09, w: 0.6, h: 0.32 }
      ];
      const fns = new Map(), PH = 1.3;
      // compartiments remplis selon le nombre de lignes (d'abord le rond central, puis les bandeaux, le bas, les angles),
      // dans l'ordre de lecture ; au-delà de 8 lignes, les suivantes rejoignent le panneau du bas
      const prio = [1, 0, 6, 7, 2, 3, 4, 5], use = prio.slice(0, Math.min(8, G.length)).sort((a, b2) => a - b2), byCell = new Map();
      use.forEach((ci, j) => byCell.set(ci, j === use.length - 1 ? G.slice(j) : [G[j]]));
      // fond et cadre du panneau, croissant autour du rond central, panneaux latéraux décorés
      const rectL = (x0, y0, x1, y1) => [x0, y0, x1, y0, x1, y1, x0, y1];
      const outer = rectL(0, 0, U, PH * U);
      panels.push({ path: loopToCmds(outer), color: '#FBF5E6' });
      extra.push(band(offsetLoop(outer, U * 0.012), outer));
      const crO = [], crI = [], cg = cells[1];
      for (let q = 0; q < 160; q++) { const a = TAU * q / 160; crO.push(cg.x * U + U * 0.255 * Math.cos(a), cg.y * U + U * 0.035 + U * 0.255 * Math.sin(a)); crI.push(cg.x * U + U * 0.215 * Math.cos(a), cg.y * U + U * 0.215 * Math.sin(a)); }
      panels.push({ path: band(crO, crI), color: acc });
      for (const sx of [0.06, 0.8]) panels.push({ path: loopToCmds(roundPoly([[sx * U, 0.95 * U], [(sx + 0.14) * U, 0.95 * U], [(sx + 0.14) * U, 1.24 * U], [sx * U, 1.24 * U]], U * 0.01)), color: deco });
      cells.forEach((cl, j) => {
        let L;
        if (cl.kind === 'circle') { L = []; for (let q = 0; q < 160; q++) { const a = TAU * q / 160; L.push(cl.x * U + cl.w / 2 * U * Math.cos(a), cl.y * U + cl.h / 2 * U * Math.sin(a)); } }
        else if (cl.kind === 'band') L = tileLoopAt(loopAspect(fillLoop('capsule', 100), cl.w / cl.h), cl.x * U, cl.y * U, cl.h / 2 * U);
        else L = tileLoopAt(loopAspect(fillLoop('round', 100), cl.w / cl.h), cl.x * U, cl.y * U, cl.h / 2 * U);
        panels.push({ path: loopToCmds(L), color: j === 1 ? '#FFFFFF' : tile });
        extra.push(band(offsetLoop(L, U * 0.004), L));
        const B = byCell.get(j);
        if (!B) return;
        const unit = cl.kind === 'circle' ? fillLoop('circle', 100) : loopAspect(fillLoop(cl.kind === 'band' ? 'capsule' : 'round', 100), cl.w / cl.h);
        const f = fitRows(B.map(g => ({ w: g.w, h: g.h })), unit, { lead: 0.1, grow: 1, stretch: 0.2, pad: 0.24 });
        if (!f) return;
        const k0 = cl.h / 2 * U, cx = cl.x * U, cy = cl.y * U;
        B.forEach((g, q) => {
          const r = f.rows[q], xm = (g.x0 + g.x1) / 2;
          const fn = (x, y) => [cx + (r.cx + (x - xm) * r.s * r.sx) * k0, cy + (r.y + (y - g.y0) * r.s) * k0];
          for (const i of g.idx) fns.set(i, fn);
        });
      });
      perSpan = (part, s, i) => { const fn = fns.get(i); return fn ? eachPoint(part, fn) : part; };
      info.compartments = cells.length;
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
    for (let k = 0; k < sp.length; k++) {
      const s = sp[k], part = c.slice(s.i0, s.i1);
      let m;
      if (perSpan) m = perSpan(part, s, k);
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
      const LR = new Map();
      for (const [k, v] of lineRings) LR.set(k, eachPoint(v, R));
      return { cmds: eachPoint(out, R), ranges, rings: eachPoint(rings, R), panels: panels.map(p => ({ path: eachPoint(p.path, R), color: p.color })), lineRings: LR, info };
    }
    return { cmds: out, ranges, rings, panels, lineRings, info };
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
    // anneaux et mosaïque organisent déjà tout le tableau : pas de répétition par-dessus
    if (!rep || rep === 'none' || ['rings', 'tiles', 'tughra', 'wings', 'hilye'].includes(sh.type)) return parts;
    let all = [];
    for (const p of parts) all = all.concat(p);
    if (!all.length) return parts;
    const B = bbox(all);
    if (rep === 'mirror') {
      const gap = B.h * ((sh.mgap == null ? 8 : sh.mgap) / 100);
      const a = B.x - gap / 2;
      return parts.map(p => p.length ? p.concat(reversePath(eachPoint(p, (x, y) => [2 * a - x, y]))) : p);
    }
    if (rep === 'kaleido') {
      const N = 2 * Math.max(2, Math.min(8, Math.round((sh.copies || 8) / 2)));
      const spread = Math.max(0.4, (sh.spread == null ? 110 : sh.spread) / 100);
      const cxT = B.x + B.w / 2, cyT = B.y + B.h / 2;
      const r0 = Math.max(B.h * 0.55, (B.h / 2) / Math.tan(Math.PI / N)) * spread;
      // quart de tour : le début de la phrase vers l'extérieur, la fin près du centre (0, 0)
      const toRadial = (x, y) => [y - cyT, -(x - cxT) - B.w / 2 - r0];
      return parts.map(p => {
        if (!p.length) return p;
        const base = eachPoint(p, toRadial), mir = reversePath(eachPoint(base, (x, y) => [-x, y]));
        let o = [];
        for (let k = 0; k < N; k++) {
          const a = TAU * k / N, ca = Math.cos(a), sa = Math.sin(a), src = k % 2 ? mir : base;
          o = o.concat(k ? eachPoint(src, (x, y) => [x * ca - y * sa, x * sa + y * ca]) : src);
        }
        return o;
      });
    }
    if (rep === 'rosette') {
      const kal = false;
      const N = Math.max(2, Math.min(16, Math.round(sh.copies || 6)));
      const spread = Math.max(0.4, (sh.spread == null ? 110 : sh.spread) / 100);
      const d = Math.max(B.h * 0.2, (B.w / 2) / Math.tan(Math.PI / N)) * spread;
      const cx = B.x + B.w / 2, cy = B.y + B.h + d;
      return parts.map(p => {
        if (!p.length) return p;
        // reflet par l'axe vertical du texte : tourné d'un cran, il devient le miroir de sa voisine (symétrie d'ordre 2N)
        const mir = kal ? reversePath(eachPoint(p, (x, y) => [2 * cx - x, y])) : null;
        let o = p;
        for (let k = 1; k < N; k++) {
          const a = TAU * k / N, ca = Math.cos(a), sa = Math.sin(a), src = kal && k % 2 ? mir : p;
          o = o.concat(eachPoint(src, (x, y) => { const dx = x - cx, dy = y - cy; return [cx + dx * ca - dy * sa, cy + dx * sa + dy * ca]; }));
        }
        return o;
      });
    }
    return parts;
  }

  root.KhattShape = { applyShape, compose, reversePath, normalizeFree, subdivide, follower, eachPoint, DEFAULT_FREE, roundedPolygon, offsetLoop, HEART,
    fillLoop, fitRows, chordAt, FILL_KINDS, FIG_KINDS, figure, PALETTES };
})(typeof self !== 'undefined' ? self : globalThis);
