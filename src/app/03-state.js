  // ------------------------------------------------------------------ état
  const STORE = 'khattat:v1';
  const DEFAULT = {
    text: 'الخط العربي', fontId: 'aref-ruqaa', wght: null,
    size: 160, lineHeight: 1.15, align: 'center', kashida: 0, harakat: true, wordSpace: 1, colorFont: true,
    fill: { type: 'linear', color: '#1b1712', stops: stopsOf(GOLD), angle: 90, gk: 'linear' },
    stroke: { on: false, color: '#ffffff', width: 6 },
    shadow: { on: true, color: '#000000', opacity: 0.45, dist: 4, blur: 6 },
    fx: {
      weight: 0,
      hollow: { on: false, width: 3 },
      outline: { on: false, color: '#ffffff', gap: 3, width: 4 },
      extrude: { on: false, angle: 45, depth: 8, color: '#6b4f1d', shade: true },
      glow: { on: false, color: '#00f5d4', size: 12, strength: 0.8 },
      counters: { on: false, color: '#ffffff' },
      scatter: { on: false, color: '#9b2c4a', density: 50, size: 22, alpha: false },
      marks: { on: false, color: '#c62828' },
      dots: { on: false, color: '#c62828' }
    },
    frame: { type: 'none', width: 2.5, double: false, dash: false, pad: 14, ink: true, color: '#c9a227', panelOn: false, panel: '#ffffff', fit: 'text' },
    pattern: { type: 'none', color: '#c9a227', opacity: 0.25, scale: 12, width: 100, colorful: false, text: '' },
    // une couleur par ligne (médaillon et ailes, titres, mosaïques…)
    lineInk: { on: false, colors: ['#7a3b1e', '#1f7a7a', '#1f7a7a', '#8e3b5e', '#0f4c81', '#9a7420', '#2e7d32', '#b3261e'] },
    bg: { type: 'solid', color: '#0e1a3a', stops: stopsOf(PARCH), angle: 90, gk: 'linear', veil: 0.3, veilColor: 'dark' },
    format: { id: 'auto', margin: 56, w: 1200, h: 800 },
    shape: { type: 'straight', bend: 90, cover: 60, side: 'top', spin: 0, ring: 'none', ringW: 8, height: 50, ratio: 60, amp: 30, waves: 1.5, intensity: 40, gap: 130, sides: 6, round: 35, sep: 'star', free: null, flip: false, width: 100, rotate: 0, repeat: 'none', copies: 6, spread: 110, mgap: 8,
      fillShape: 'oval', wrap: 'auto', fratio: 100, grow: 40, stretch: 10, lead: 18, center: 1, rgap: 14, rfill: 'on', rlines: 'none', tile: 'capsule', title: 'top', palette: 'pastel', cols: 0, tgap: 10, swash: 'on' },
    phys: { on: false, value: 60, unit: 'cm' },
    // réglages d'interface (hors historique)
    scale: 2, filter: 'all', tab: 'ecr', tool: 'texte', favs: [], cardColors: false, pvBg: 'check', dims: false, gtab: 'styles', mdTheme: 'all', mdSrc: 'mine',
    // dernier texte vocalisé dont le tashkīl a été retiré (pour « Remettre le tashkīl »)
    tkBackup: ''
  };
  const UI_KEYS = ['scale', 'filter', 'tab', 'tool', 'favs', 'cardColors', 'pvBg', 'dims', 'gtab', 'mdTheme', 'mdSrc', 'tkBackup'];
  const FX_OFF = clone(DEFAULT.fx);

  function normHex(v) {
    let h = String(v == null ? '' : v).trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(h)) h = h.split('').map(c => c + c).join('');
    return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toLowerCase() : null;
  }
  // fusion profonde : ne garde que les clés connues, du bon type
  function mergeDeep(def, val) {
    if (Array.isArray(def)) return Array.isArray(val) ? clone(val) : clone(def);
    if (def && typeof def === 'object') {
      const v = val && typeof val === 'object' && !Array.isArray(val) ? val : {};
      const out = {};
      for (const k of Object.keys(def)) out[k] = k in v ? mergeDeep(def[k], v[k]) : clone(def[k]);
      return out;
    }
    if (def === null) return val === undefined ? null : val;
    if (typeof def === 'number') return typeof val === 'number' && isFinite(val) ? val : def;
    if (typeof def === 'boolean') return typeof val === 'boolean' ? val : def;
    if (typeof def === 'string') return typeof val === 'string' ? val.slice(0, 6000) : def;
    return def;
  }
  // peinture enregistrée : reprend l'ancien format à deux couleurs (c1, c2) et écarte les valeurs abîmées
  function cleanPaint(p, saved, def, types) {
    const out = Object.assign({}, def, p);
    if (saved && !Array.isArray(saved.stops) && normHex(saved.c1) && normHex(saved.c2)) out.stops = stopsOf([saved.c1, saved.c2]);
    delete out.c1; delete out.c2;
    let st = Array.isArray(out.stops) ? out.stops.filter(x => x && normHex(x.c) && isFinite(+x.p)).map(x => ({ c: normHex(x.c), p: Math.min(1, Math.max(0, +x.p)) })) : [];
    if (st.length < 2) st = clone(def.stops);
    out.stops = st.slice(0, 8).sort((a, b) => a.p - b.p);
    out.color = normHex(out.color) || def.color;
    if (!types.includes(out.type)) out.type = def.type;
    out.gk = out.type === 'linear' || out.type === 'radial' ? out.type : out.gk === 'radial' ? 'radial' : 'linear';
    out.angle = isFinite(+out.angle) ? +out.angle : 90;
    return out;
  }
  const oneOf = (v, list, d) => list.includes(v) ? v : d;
  const clampN = (v, a, b, d) => (typeof v === 'number' && isFinite(v)) ? Math.min(b, Math.max(a, v)) : d;
  // état relu (stockage, création enregistrée, historique) : types, bornes et couleurs vérifiés
  // (les couleurs sont injectées dans le SVG de l'aperçu : uniquement des codes #rrggbb)
  function sanitize(o, keepImage) {
    const s = mergeDeep(DEFAULT, o || {});
    s.text = String(s.text).slice(0, 5000);
    s.wght = typeof s.wght === 'number' && isFinite(s.wght) ? s.wght : null;
    s.size = clampN(s.size, 8, 2000, DEFAULT.size);
    s.lineHeight = clampN(s.lineHeight, 0.4, 3, DEFAULT.lineHeight);
    s.align = oneOf(s.align, ['right', 'center', 'left'], 'center');
    s.kashida = oneOf(s.kashida, [0, 1, 2, 3, 5], 0);
    s.wordSpace = clampN(s.wordSpace, 0.1, 5, 1);
    s.stroke.color = normHex(s.stroke.color) || DEFAULT.stroke.color;
    s.stroke.width = clampN(s.stroke.width, 0, 200, 6);
    s.shadow.color = normHex(s.shadow.color) || DEFAULT.shadow.color;
    s.shadow.opacity = clampN(s.shadow.opacity, 0, 1, 0.45);
    for (const k of ['outline', 'extrude', 'glow', 'counters', 'scatter', 'marks', 'dots']) s.fx[k].color = normHex(s.fx[k].color) || DEFAULT.fx[k].color;
    s.fx.weight = clampN(s.fx.weight, -10, 20, 0);
    s.fill = cleanPaint(s.fill, o && o.fill, DEFAULT.fill, ['solid', 'linear', 'radial']);
    s.bg = cleanPaint(s.bg, o && o.bg, DEFAULT.bg, ['none', 'solid', 'linear', 'radial', 'image']);
    s.bg.veil = clampN(s.bg.veil, 0, 0.9, 0.3);
    s.bg.veilColor = oneOf(s.bg.veilColor, ['dark', 'light'], 'dark');
    s.frame.type = oneOf(s.frame.type, FRAMES.map(f => f[0]), 'none');
    s.frame.color = normHex(s.frame.color) || DEFAULT.frame.color;
    s.frame.panel = normHex(s.frame.panel) || DEFAULT.frame.panel;
    s.frame.fit = oneOf(s.frame.fit, ['text', 'page'], 'text');
    s.pattern.type = oneOf(s.pattern.type, PATTERNS.map(p => p[0]), 'none');
    s.pattern.color = normHex(s.pattern.color) || DEFAULT.pattern.color;
    s.pattern.opacity = clampN(s.pattern.opacity, 0.02, 1, 0.25);
    s.pattern.text = String(s.pattern.text || '').slice(0, 60);
    s.lineInk.colors = DEFAULT.lineInk.colors.map((d, i) => normHex(s.lineInk.colors[i]) || d);
    const sh = s.shape;
    sh.type = oneOf(sh.type, SHAPES.map(x => x.id), 'straight');
    sh.side = oneOf(sh.side, ['top', 'bottom'], 'top');
    sh.ring = oneOf(sh.ring, ['none', 'single', 'double'], 'none');
    sh.sep = oneOf(sh.sep, ['none', 'star', 'dot', 'diamond'], 'star');
    sh.repeat = oneOf(sh.repeat, REPEATS.map(r => r[0]), 'none');
    sh.copies = Math.round(clampN(sh.copies, 2, 16, 6));
    sh.sides = Math.round(clampN(sh.sides, 3, 12, 6));
    sh.width = clampN(sh.width, 20, 400, 100);
    sh.fillShape = oneOf(sh.fillShape, FILL_OPTS.map(x => x[0]), 'oval');
    sh.wrap = oneOf(sh.wrap, ['auto', 'off'], 'auto');
    sh.rfill = oneOf(sh.rfill, ['on', 'off'], 'on');
    sh.swash = oneOf(sh.swash, ['on', 'off'], 'on');
    sh.rlines = oneOf(sh.rlines, ['none', 'thin'], 'none');
    sh.tile = oneOf(sh.tile, TILE_OPTS.map(x => x[0]), 'capsule');
    sh.title = oneOf(sh.title, ['top', 'center', 'none'], 'top');
    sh.palette = oneOf(sh.palette, ['pastel', 'jewel', 'earth', 'gold', 'none'], 'pastel');
    sh.cols = Math.round(clampN(sh.cols, 0, 12, 0));
    sh.center = Math.round(clampN(sh.center, 1, 4, 1));
    sh.fratio = clampN(sh.fratio, 40, 250, 100);
    for (const [k, a, b, d] of [['grow', 0, 100, 40], ['stretch', 0, 60, 10], ['lead', 0, 80, 18], ['rgap', 0, 60, 14], ['tgap', 0, 40, 10]]) sh[k] = clampN(sh[k], a, b, d);
    sh.free = Array.isArray(sh.free) && sh.free.length >= 4 && sh.free.length <= 4000 && sh.free.every(v => typeof v === 'number' && isFinite(v)) ? sh.free : null;
    s.format.id = oneOf(s.format.id, FORMATS.map(f => f.id), 'auto');
    s.format.w = clampN(s.format.w, 50, 12000, 1200);
    s.format.h = clampN(s.format.h, 50, 12000, 800);
    s.format.margin = clampN(s.format.margin, 0, 2000, 56);
    s.phys.unit = oneOf(s.phys.unit, ['mm', 'cm', 'm'], 'cm');
    s.phys.value = clampN(s.phys.value, 0.1, 100000, 60);
    s.scale = oneOf(s.scale, [1, 2, 4, 8], 2);
    s.tab = oneOf(s.tab, ['ecr', 'forme', 'col', 'fx', 'cadre', 'bg', 'fmt'], 'ecr');
    s.pvBg = oneOf(s.pvBg, ['check', 'light', 'dark'], 'check');
    s.gtab = oneOf(s.gtab, ['styles', 'models'], 'styles');
    s.tool = oneOf(s.tool, TOOLS, 'texte');
    s.mdTheme = oneOf(s.mdTheme, MTHEMES.map(t => t[0]), 'all');
    s.mdSrc = oneOf(s.mdSrc, ['mine', 'ex'], 'mine');
    s.favs = Array.isArray(s.favs) ? s.favs.filter(x => typeof x === 'string').slice(0, 400) : [];
    if (s.bg.type === 'image' && !keepImage) s.bg.type = 'none'; // la photo n'est pas gardée entre deux visites
    return s;
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STORE);
      return raw ? sanitize(JSON.parse(raw)) : clone(DEFAULT);
    } catch (e) { return clone(DEFAULT); }
  }
  const S = loadState();
  let saveT = 0;
  function saveSoon() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) { /* stockage indisponible */ } }, 300); }

  // ------------------------------------------------------------------ historique (annuler / rétablir)
  function snapshot() { const o = {}; for (const k of Object.keys(S)) if (!UI_KEYS.includes(k)) o[k] = S[k]; return JSON.stringify(o); }
  let hist = [], hpos = -1, histT = 0, restoring = false;
  function histInit() { hist = [snapshot()]; hpos = 0; syncHistUI(); }
  function record() { if (restoring) return; clearTimeout(histT); histT = setTimeout(commitHist, 450); }
  function commitHist() {
    clearTimeout(histT);
    if (hpos < 0) return;
    const s = snapshot();
    if (s === hist[hpos]) return;
    hist = hist.slice(0, hpos + 1); hist.push(s);
    if (hist.length > 100) hist.shift();
    hpos = hist.length - 1;
    syncHistUI();
  }
  function undo() { commitHist(); if (hpos <= 0) return; hpos--; restoreSnap(hist[hpos]); }
  function redo() { commitHist(); if (hpos >= hist.length - 1) return; hpos++; restoreSnap(hist[hpos]); }
  function restoreSnap(json) {
    restoring = true;
    try { replaceState(JSON.parse(json)); }
    finally { restoring = false; }
    syncHistUI();
  }
  // remplace l'état de la création (texte, style, réglages) en gardant les réglages d'interface
  function replaceState(o) {
    const s = sanitize(Object.assign({}, o, Object.fromEntries(UI_KEYS.map(k => [k, S[k]]))), !!bgImage);
    for (const k of Object.keys(s)) if (!UI_KEYS.includes(k)) S[k] = s[k];
    afterStateChange();
  }
  function syncHistUI() {
    const u = $('#undoBtn'), r = $('#redoBtn');
    if (u) u.disabled = hpos <= 0;
    if (r) r.disabled = hpos >= hist.length - 1;
  }
