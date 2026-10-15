/* Effets géométriques sur les contours (bibliothèque Clipper) : épaisseur, liseré, lettres creuses, relief.
   Les résultats sont des polygones (courbes aplaties avec une tolérance fine) et sont mis en cache. */
(function (root) {
  'use strict';
  const K = root.Khatt;
  const SC = 100; // précision : 1/100 de pixel
  const L = () => root.ClipperLib;
  const ready = () => !!root.ClipperLib;

  // empreinte rapide d'un chemin (clé de cache)
  function hash(c) {
    let h = 2166136261 >>> 0;
    const n = c.length, step = Math.max(1, Math.floor(n / 6000));
    for (let i = 0; i < n; i += step) { h ^= Math.round(c[i] * 50) | 0; h = Math.imul(h, 16777619) >>> 0; }
    return h.toString(36) + ':' + n;
  }
  const cache = new Map();
  function memo(key, fn) {
    if (cache.has(key)) { const v = cache.get(key); cache.delete(key); cache.set(key, v); return v; }
    const v = fn();
    cache.set(key, v);
    if (cache.size > 40) cache.delete(cache.keys().next().value);
    return v;
  }

  function toPaths(cmds, tol) {
    return K.flatten(cmds, tol).map(p => {
      const a = new Array(p.length / 2);
      for (let i = 0, j = 0; i < p.length; i += 2, j++) a[j] = { X: Math.round(p[i] * SC), Y: Math.round(p[i + 1] * SC) };
      return a;
    });
  }
  function fromPaths(paths) {
    const c = [];
    for (const p of paths) {
      if (p.length < 3) continue;
      c.push(0, p[0].X / SC, p[0].Y / SC);
      for (let i = 1; i < p.length; i++) c.push(1, p[i].X / SC, p[i].Y / SC);
      c.push(4);
    }
    return c;
  }
  function exec(type, subj, clip) {
    const C = L(), cp = new C.Clipper();
    cp.AddPaths(subj, C.PolyType.ptSubject, true);
    if (clip) cp.AddPaths(clip, C.PolyType.ptClip, true);
    const o = new C.Paths();
    cp.Execute(type, o, C.PolyFillType.pftNonZero, C.PolyFillType.pftNonZero);
    return o;
  }
  const union = p => exec(L().ClipType.ctUnion, p);
  const diff = (a, b) => exec(L().ClipType.ctDifference, a, b);
  function offset(paths, d) {
    if (Math.abs(d) < 1e-6) return paths;
    const C = L(), co = new C.ClipperOffset(2, 0.12 * SC);
    co.AddPaths(paths, C.JoinType.jtRound, C.EndType.etClosedPolygon);
    const o = new C.Paths();
    co.Execute(o, d * SC);
    return o;
  }
  // contours réunis et orientés (indispensable avant un décalage)
  function base(cmds, tol) { return memo('u' + tol + '|' + hash(cmds), () => union(toPaths(cmds, tol))); }

  // épaissit (d > 0) ou amincit (d < 0) les lettres
  function grow(cmds, d, tol) {
    if (!ready() || !cmds.length || Math.abs(d) < 0.01) return cmds;
    return memo('g' + d.toFixed(2) + '|' + tol + '|' + hash(cmds), () => fromPaths(offset(base(cmds, tol), d)));
  }
  // bande comprise entre les décalages a et b (a < b) : liseré (a ≥ 0) ou lettres creuses (a < 0, b = 0)
  function band(cmds, a, b, tol) {
    if (!ready() || !cmds.length) return [];
    return memo('b' + a.toFixed(2) + ',' + b.toFixed(2) + '|' + tol + '|' + hash(cmds), () => {
      const u = base(cmds, tol);
      return fromPaths(diff(offset(u, b), offset(u, a)));
    });
  }
  // relief : surface balayée par les lettres déplacées de (vx, vy)
  // (union des quadrilatères des arêtes tournées d'un même côté, du texte et du texte déplacé)
  function extrude(cmds, vx, vy, tol) {
    if (!ready() || !cmds.length || Math.hypot(vx, vy) < 0.05) return [];
    return memo('e' + vx.toFixed(2) + ',' + vy.toFixed(2) + '|' + tol + '|' + hash(cmds), () => {
      const C = L(), u = base(cmds, tol), X = Math.round(vx * SC), Y = Math.round(vy * SC);
      const quads = [];
      for (const p of u) {
        for (let i = 0, n = p.length; i < n; i++) {
          const q = p[i], r = p[(i + 1) % n];
          if ((r.X - q.X) * Y - (r.Y - q.Y) * X <= 0) continue;
          const quad = [q, r, { X: r.X + X, Y: r.Y + Y }, { X: q.X + X, Y: q.Y + Y }];
          quads.push(C.Clipper.Orientation(quad) ? quad : quad.reverse());
        }
      }
      const moved = u.map(p => p.map(q => ({ X: q.X + X, Y: q.Y + Y })));
      return fromPaths(union(quads.concat(moved, u)));
    });
  }
  // fusion simple (découpe)
  function merge(cmds, tol) {
    if (!ready() || !cmds.length) return null;
    return base(cmds, tol);
  }
  // décalage d'un polygone simple (cadres) ; renvoie des cmds
  function offsetPoly(cmds, d, tol) {
    if (!ready()) return null;
    return memo('o' + d.toFixed(2) + '|' + tol + '|' + hash(cmds), () => fromPaths(offset(base(cmds, tol), d)));
  }

  root.KhattFX = { ready, grow, band, extrude, merge, offsetPoly, hash, SC };
})(typeof self !== 'undefined' ? self : globalThis);
