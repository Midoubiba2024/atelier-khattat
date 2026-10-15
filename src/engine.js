/* Moteur de rendu : HarfBuzz (mise en forme arabe) + mise en page + géométrie.
   Fonctionne avec harfbuzz.wasm (WebAssembly) ou sa version JavaScript (wasm2js). */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Enveloppe minimale de HarfBuzz (API C exportée par harfbuzz.wasm)
  // ---------------------------------------------------------------------------
  let ex = null, mem = null, table = null, mode = '';
  let lastBuf = null, U8, U16, U32, I32, F32;
  function sync() {
    const b = mem.buffer;
    if (b !== lastBuf) {
      lastBuf = b;
      U8 = new Uint8Array(b); U16 = new Uint16Array(b); U32 = new Uint32Array(b);
      I32 = new Int32Array(b); F32 = new Float32Array(b);
    }
  }

  function makeImports() {
    return {
      wasi_snapshot_preview1: { proc_exit(code) { throw new Error('HarfBuzz exit ' + code); } },
      env: {
        _emscripten_runtime_keepalive_clear() {},
        _abort_js() { throw new Error('HarfBuzz abort'); },
        _setitimer_js() { return 0; },
        emscripten_resize_heap(requested) {
          requested >>>= 0;
          const oldSize = mem.buffer.byteLength;
          const MAX = 2147483648;
          if (requested > MAX) return 0;
          for (let cut = 1; cut <= 4; cut *= 2) {
            let over = oldSize * (1 + 0.2 / cut);
            over = Math.min(over, requested + 100663296);
            const newSize = Math.min(MAX, Math.ceil(Math.max(requested, over) / 65536) * 65536);
            try {
              mem.grow(((newSize - mem.buffer.byteLength) + 65535) >>> 16);
              if (mem.buffer.byteLength >= requested) { sync(); return 1; }
            } catch (e) { /* on retente plus petit */ }
          }
          return 0;
        }
      }
    };
  }

  const WT = { i: 0x7f, j: 0x7e, f: 0x7d, d: 0x7c };
  // Transforme une fonction JS en fonction WebAssembly (pour la table des pointeurs)
  function wrapWasm(fn, sig) {
    const ret = sig[0], params = sig.slice(1).split('');
    const type = [0x01, 0x60, params.length].concat(params.map(p => WT[p]));
    if (ret === 'v') type.push(0x00); else type.push(0x01, WT[ret]);
    const bytes = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      0x01, type.length].concat(type, [
      0x02, 0x07, 0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
      0x07, 0x05, 0x01, 0x01, 0x66, 0x00, 0x00]));
    const inst = new WebAssembly.Instance(new WebAssembly.Module(bytes), { e: { f: fn } });
    return inst.exports.f;
  }
  function fnPtr(fn, sig) {
    const f = mode === 'wasm' ? wrapWasm(fn, sig) : fn;
    const idx = table.grow(1);
    table.set(idx, f);
    return idx;
  }
  function asciiPtr(s) {
    const p = ex.malloc(s.length + 1); sync();
    for (let i = 0; i < s.length; i++) U8[p + i] = s.charCodeAt(i) & 127;
    U8[p + s.length] = 0;
    return p;
  }
  function tag(s) {
    s = (s + '    ').slice(0, 4);
    return ((s.charCodeAt(0) << 24) | (s.charCodeAt(1) << 16) | (s.charCodeAt(2) << 8) | s.charCodeAt(3)) >>> 0;
  }
  function untag(t) {
    return String.fromCharCode((t >>> 24) & 255, (t >>> 16) & 255, (t >>> 8) & 255, t & 255);
  }

  let dfuncs = 0, drawOut = null, langAr = 0;
  const ARAB = tag('Arab');

  function setup(exports, m) {
    ex = exports; mem = ex.memory; table = ex.__indirect_function_table; mode = m; sync();
    if (ex.__wasm_call_ctors) ex.__wasm_call_ctors();
    dfuncs = ex.hb_draw_funcs_create();
    ex.hb_draw_funcs_set_move_to_func(dfuncs, fnPtr(function (d, dd, st, x, y) { drawOut.push(0, x, y); }, 'viiiffi'), 0, 0);
    ex.hb_draw_funcs_set_line_to_func(dfuncs, fnPtr(function (d, dd, st, x, y) { drawOut.push(1, x, y); }, 'viiiffi'), 0, 0);
    ex.hb_draw_funcs_set_quadratic_to_func(dfuncs, fnPtr(function (d, dd, st, cx, cy, x, y) { drawOut.push(2, cx, cy, x, y); }, 'viiiffffi'), 0, 0);
    ex.hb_draw_funcs_set_cubic_to_func(dfuncs, fnPtr(function (d, dd, st, ax, ay, bx, by, x, y) { drawOut.push(3, ax, ay, bx, by, x, y); }, 'viiiffffffi'), 0, 0);
    ex.hb_draw_funcs_set_close_path_func(dfuncs, fnPtr(function () { drawOut.push(4); }, 'viiii'), 0, 0);
    const lp = asciiPtr('ar');
    langAr = ex.hb_language_from_string(lp, 2);
    ex.free(lp);
  }

  const HB = {
    async initWasm(bytes) {
      const res = await WebAssembly.instantiate(bytes, makeImports());
      setup(res.instance.exports, 'wasm');
    },
    initAsm(factory) { setup(factory(makeImports()), 'js'); },
    get mode() { return mode; },
    get ready() { return !!ex; }
  };

  class Font {
    constructor(buffer) {
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      const p = ex.malloc(bytes.length); sync();
      U8.set(bytes, p);
      this.size = bytes.length;
      this.blob = ex.hb_blob_create(p, bytes.length, 2, 0, 0);
      this.face = ex.hb_face_create(this.blob, 0);
      this.upem = ex.hb_face_get_upem(this.face) || 1000;
      this.ptr = ex.hb_font_create(this.face);
      ex.hb_font_set_scale(this.ptr, this.upem, this.upem);
      this.axes = this._axes();
      this.varKey = '{}';
      this.caches = new Map([[this.varKey, new Map()]]);
      this.cache = this.caches.get(this.varKey);
      this._extents();
      // certaines polices (ex. Qahiri) ont une espace de chasse nulle : on lui donne un quart de cadratin
      const sp = this.shape(' ', false);
      this.fixSpace = (sp.ax.length ? sp.ax[0] : 0) < this.upem * 0.05 ? Math.round(this.upem * 0.25) : 0;
    }
    // la police sait-elle étirer les liaisons (tatwil) ?
    get kashidaOK() {
      if (this._k === undefined) {
        if (!this.hasChar(0x640)) this._k = false;
        else {
          const sum = a => a.reduce((x, y) => x + y, 0);
          this._k = sum(this.shape('\u0628\u0640\u0640\u0640\u0628', true).ax) - sum(this.shape('\u0628\u0628', true).ax) > this.upem * 0.05;
        }
      }
      return this._k;
    }
    _extents() {
      const p = ex.malloc(48); sync(); U8.fill(0, p, p + 48);
      ex.hb_font_get_h_extents(this.ptr, p); sync();
      this.ascender = I32[p >> 2]; this.descender = I32[(p >> 2) + 1]; this.lineGap = I32[(p >> 2) + 2];
      ex.free(p);
      if (!this.ascender && !this.descender) { this.ascender = Math.round(this.upem * 0.8); this.descender = -Math.round(this.upem * 0.2); }
    }
    _axes() {
      const total = ex.hb_ot_var_get_axis_infos(this.face, 0, 0, 0);
      if (!total) return [];
      const cp = ex.malloc(4), ap = ex.malloc(32 * total); sync();
      U32[cp >> 2] = total;
      ex.hb_ot_var_get_axis_infos(this.face, 0, cp, ap); sync();
      const n = U32[cp >> 2], axes = [];
      for (let i = 0; i < n; i++) {
        const b = (ap >> 2) + i * 8;
        axes.push({ tag: untag(U32[b + 1]), min: F32[b + 4], def: F32[b + 5], max: F32[b + 6] });
      }
      ex.free(ap); ex.free(cp);
      return axes;
    }
    setVariations(vars) {
      const key = JSON.stringify(vars || {});
      if (key === this.varKey) return;
      const keys = Object.keys(vars || {}), n = keys.length;
      const p = ex.malloc(Math.max(8, n * 8)); sync();
      keys.forEach((k, i) => { U32[(p >> 2) + i * 2] = tag(k); F32[(p >> 2) + i * 2 + 1] = vars[k]; });
      ex.hb_font_set_variations(this.ptr, p, n);
      ex.free(p);
      this.varKey = key;
      if (!this.caches.has(key)) this.caches.set(key, new Map());
      this.cache = this.caches.get(key);
    }
    hasChar(cp) {
      if (!this._has) this._has = new Map();
      let ok = this._has.get(cp);
      if (ok === undefined) {
        const p = ex.malloc(4);
        ok = !!ex.hb_font_get_nominal_glyph(this.ptr, cp, p);
        ex.free(p);
        this._has.set(cp, ok);
      }
      return ok;
    }
    shape(text, rtl, features) {
      // fonctionnalités par défaut de la police (ex. '-liga' quand une ligature est défectueuse)
      if (!features && this.defaultFeatures) features = this.defaultFeatures;
      const b = ex.hb_buffer_create();
      const n = text.length;
      const tp = ex.malloc(n * 2 + 2); sync();
      for (let i = 0; i < n; i++) U16[(tp >> 1) + i] = text.charCodeAt(i);
      ex.hb_buffer_add_utf16(b, tp, n, 0, n);
      ex.free(tp);
      ex.hb_buffer_set_direction(b, rtl ? 5 : 4);
      if (rtl) { ex.hb_buffer_set_script(b, ARAB); ex.hb_buffer_set_language(b, langAr); }
      ex.hb_buffer_guess_segment_properties(b);
      let fp = 0, fn = 0;
      if (features && features.length) {
        fp = ex.malloc(16 * features.length);
        features.forEach((s, i) => { const sp = asciiPtr(s); ex.hb_feature_from_string(sp, s.length, fp + 16 * i); ex.free(sp); });
        fn = features.length;
      }
      ex.hb_shape(this.ptr, b, fp, fn);
      if (fp) ex.free(fp);
      const len = ex.hb_buffer_get_length(b);
      const ip = ex.hb_buffer_get_glyph_infos(b, 0), pp = ex.hb_buffer_get_glyph_positions(b, 0);
      sync();
      const out = { g: new Uint32Array(len), cl: new Uint32Array(len), ax: new Int32Array(len), ay: new Int32Array(len), dx: new Int32Array(len), dy: new Int32Array(len) };
      for (let i = 0; i < len; i++) {
        const ib = (ip >> 2) + i * 5, pb = (pp >> 2) + i * 5;
        out.g[i] = U32[ib]; out.cl[i] = U32[ib + 2];
        out.ax[i] = I32[pb]; out.ay[i] = I32[pb + 1]; out.dx[i] = I32[pb + 2]; out.dy[i] = I32[pb + 3];
      }
      ex.hb_buffer_destroy(b);
      return out;
    }
    outline(gid) {
      let o = this.cache.get(gid);
      if (!o) {
        drawOut = [];
        ex.hb_font_draw_glyph(this.ptr, gid, dfuncs, 0);
        o = drawOut; drawOut = null;
        this.cache.set(gid, o);
      }
      return o;
    }
    // classe GDEF : 1 base, 2 ligature, 3 signe (haraka), 4 composant, 0 inconnue
    glyphClass(gid) {
      if (!this._gc) this._gc = new Map();
      let c = this._gc.get(gid);
      if (c === undefined) { c = ex.hb_ot_layout_get_glyph_class ? ex.hb_ot_layout_get_glyph_class(this.face, gid) : 0; this._gc.set(gid, c); }
      return c;
    }
    // polices en couleur (COLR v0) : calques [{glyph, color '#rrggbb' | null = couleur de l'encre}]
    get hasColorLayers() {
      if (this._hcl === undefined) this._hcl = !!(ex.hb_ot_color_has_layers && ex.hb_ot_color_has_layers(this.face));
      return this._hcl;
    }
    palette() {
      if (this._pal) return this._pal;
      const pal = [];
      if (ex.hb_ot_color_palette_get_colors) {
        const n = ex.hb_ot_color_palette_get_colors(this.face, 0, 0, 0, 0);
        if (n) {
          const cp = ex.malloc(4), ap = ex.malloc(4 * n); sync();
          U32[cp >> 2] = n;
          ex.hb_ot_color_palette_get_colors(this.face, 0, 0, cp, ap); sync();
          for (let i = 0; i < U32[cp >> 2]; i++) {
            const v = U32[(ap >> 2) + i]; // hb_color_t = BGRA
            const b = (v >>> 24) & 255, g = (v >>> 16) & 255, r = (v >>> 8) & 255;
            pal.push('#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''));
          }
          ex.free(ap); ex.free(cp);
        }
      }
      return (this._pal = pal);
    }
    colorLayers(gid) {
      if (!this.hasColorLayers) return null;
      if (!this._cl) this._cl = new Map();
      if (this._cl.has(gid)) return this._cl.get(gid);
      let out = null;
      const n = ex.hb_ot_color_glyph_get_layers(this.face, gid, 0, 0, 0);
      if (n) {
        const cp = ex.malloc(4), lp = ex.malloc(8 * n); sync();
        U32[cp >> 2] = n;
        ex.hb_ot_color_glyph_get_layers(this.face, gid, 0, cp, lp); sync();
        const pal = this.palette();
        out = [];
        for (let i = 0; i < U32[cp >> 2]; i++) {
          const g = U32[(lp >> 2) + i * 2], ci = U32[(lp >> 2) + i * 2 + 1];
          out.push({ glyph: g, color: ci === 0xFFFF || !pal[ci] ? null : pal[ci] });
        }
        ex.free(lp); ex.free(cp);
      }
      this._cl.set(gid, out);
      return out;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Texte : bidi simplifié, harakat, kashida
  // ---------------------------------------------------------------------------
  function isMark(c) {
    return (c >= 0x064B && c <= 0x065F) || c === 0x0670 || (c >= 0x0610 && c <= 0x061A) ||
      (c >= 0x06D6 && c <= 0x06DC) || (c >= 0x06DF && c <= 0x06E4) || c === 0x06E7 || c === 0x06E8 ||
      (c >= 0x06EA && c <= 0x06ED) || (c >= 0x08CA && c <= 0x08E1) || (c >= 0x08E3 && c <= 0x08FF) ||
      (c >= 0x0300 && c <= 0x036F) || (c >= 0xFE20 && c <= 0xFE2F);
  }
  function charClass(c) {
    if ((c >= 0x30 && c <= 0x39) || (c >= 0x0660 && c <= 0x0669) || (c >= 0x06F0 && c <= 0x06F9)) return 'D';
    if (isMark(c) || c === 0x200C || c === 0x200D) return 'M';
    if ((c >= 0x0590 && c <= 0x08FF) || (c >= 0xFB1D && c <= 0xFDFF) || (c >= 0xFE70 && c <= 0xFEFF) || c === 0x200F) return 'R';
    if (c >= 0xD800 && c <= 0xDFFF) return 'L';
    if (/\p{L}/u.test(String.fromCharCode(c))) return 'L';
    return 'N';
  }
  function bidiRuns(line) {
    const n = line.length;
    if (!n) return [];
    const cls = new Array(n);
    for (let i = 0; i < n; i++) cls[i] = charClass(line.charCodeAt(i));
    for (let i = 0; i < n; i++) if (cls[i] === 'M') cls[i] = i ? cls[i - 1] : 'R';
    for (let i = 1; i < n - 1; i++) {
      if (cls[i] === 'N' && cls[i - 1] === 'D' && cls[i + 1] === 'D' && /[.,:\/٫٬]/.test(line[i])) cls[i] = 'D';
    }
    // W7 : chiffres précédés d'un texte latin -> latin
    let strong = 'R';
    for (let i = 0; i < n; i++) {
      if (cls[i] === 'R' || cls[i] === 'L') strong = cls[i];
      else if (cls[i] === 'D' && strong === 'L') cls[i] = 'L';
    }
    const lvl = new Array(n);
    for (let i = 0; i < n;) {
      if (cls[i] !== 'N') { lvl[i] = cls[i] === 'R' ? 1 : 2; i++; continue; }
      let j = i;
      while (j < n && cls[j] === 'N') j++;
      const prev = i > 0 && cls[i - 1] === 'L' ? 'L' : 'R';
      const next = j < n && cls[j] === 'L' ? 'L' : 'R';
      const l = prev === 'L' && next === 'L' ? 2 : 1;
      for (let k = i; k < j; k++) lvl[k] = l;
      i = j;
    }
    const runs = [];
    let s = 0;
    for (let i = 1; i <= n; i++) {
      if (i === n || lvl[i] !== lvl[s]) { runs.push({ text: line.slice(s, i), rtl: lvl[s] === 1 }); s = i; }
    }
    return runs;
  }
  const MARKS_RE = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭ࣊-ࣣ࣡-ࣿ]/g;
  function stripMarks(s) { return s.replace(MARKS_RE, ''); }

  // Niveaux du tashkīl. Le texte garde sa vocalisation complète ; chaque niveau en montre une partie, selon des règles
  // fixes : aucun signe n'est ajouté, aucune lettre n'est changée (seul l'alif waṣla ٱ redevient ا dans les niveaux
  // allégés, comme dans l'écriture courante).
  //   full complet · nosukun sans soukoun · partial partiel (ce que le lecteur ne devine pas) · body sans les fins de mots
  //   ends fins de mots (désinence) · shaddatanwin chadda et tanwīn · shadda chadda seule · none aucun
  // Les textes du Coran copiés de tanzil.net ou de quran.com (encodage du Complexe du roi Fahd, KFGQPC) sont reconnus :
  // tanwīn « ouverts » ٗ ٖ ٞ, soukoun ۡ, lettres muettes ۟ ۠ (ou ْ chez KFGQPC), madda de tajwīd, tatwīl porteur de signes ;
  // l'alif suscrit et les petites lettres y comptent comme des lettres jusqu'au niveau « Aucun » (الكتٰب et non الكتب).
  const TASHKIL_LEVELS = ['full', 'nosukun', 'partial', 'body', 'ends', 'shaddatanwin', 'shadda', 'none'];
  // signes d'espacement (formes de présentation, textes copiés d'un PDF) : nature ; les formes « médianes » portent un tatwīl
  const SPACING = { 0xFE70: 't', 0xFE71: 't', 0xFE72: 't', 0xFE74: 't', 0xFE76: 'v', 0xFE77: 'v', 0xFE78: 'v', 0xFE79: 'v', 0xFE7A: 'v', 0xFE7B: 'v', 0xFE7C: 'h', 0xFE7D: 'h', 0xFE7E: 's', 0xFE7F: 's' };
  const SPACING_MEDIAL = new Set(['\uFE71', '\uFE77', '\uFE79', '\uFE7B', '\uFE7D', '\uFE7F']);
  // écriture du texte : coranique (ʿuthmānī), et parmi elles l'encodage KFGQPC. Indices : alif waṣla, petits signes
  // du Coran, alif suscrit porté par un tatwīl (ـٰ), madda posée ailleurs que sur un alif (قَالُوٓا، مُوسَىٰٓ)
  function tkScript(s) {
    const qpc = /\u065E/.test(s) || (/\u06E1/.test(s) && /\u0671/.test(s));
    return { qpc, uthmani: qpc || /[\u0671\u06DF-\u06E2\u06E5-\u06E8\u06EA-\u06ED]|\u0640\u0670|[^\u0627\u0623]\u0653/.test(s) };
  }
  // nature d'un signe : v voyelle, t tanwīn, h chadda, s soukoun, a alif suscrit et lettres élidées (ٰ ٖ ۧ ۨ),
  // o orthographe (hamza, madda de آ, formules, accents latins : toujours gardés), q signes coraniques (pauses, tajwīd)
  function markKind(c, sc, base) {
    if (SPACING[c]) return SPACING[c];
    if (c === 0x065E || (c >= 0x064B && c <= 0x064D) || (c >= 0x08F0 && c <= 0x08F2)) return 't';
    if ((c === 0x0657 || c === 0x0656) && sc.qpc) return 't';
    if (c === 0x064E || c === 0x064F || c === 0x0650 || (c >= 0x0657 && c <= 0x065D)) return 'v';
    if (c === 0x0651) return 'h';
    if (c === 0x06E1 || (c === 0x0652 && !sc.qpc)) return 's';
    if (c === 0x0670 || c === 0x0656 || c === 0x06E7 || c === 0x06E8) return 'a';
    if (c === 0x0653 && sc.uthmani && base !== 'أ') return 'q';
    if ((c >= 0x0653 && c <= 0x0655) || c === 0x065F || (c >= 0x0610 && c <= 0x0614) || (c >= 0x0300 && c <= 0x036F) || (c >= 0xFE20 && c <= 0xFE2F)) return 'o';
    return 'q';
  }
  // lettres des mots : arabes (tatwīl compris), formes de présentation (ﷲ, textes copiés d'un PDF), liants ZWJ / ZWNJ
  const isPres = c => (c >= 0xFB50 && c <= 0xFD3D) || (c >= 0xFD50 && c <= 0xFDFB) || c === 0xFDFD || (c >= 0xFE80 && c <= 0xFEFC);
  const isWordCl = x => x.b !== '' && (x.b === '\u200C' || x.b === '\u200D' || isArabicLetter(x.b) || isPres(x.b.codePointAt(0)));
  // lettre (un tatwīl qui porte des signes compte comme sa lettre)
  const isLetterCl = x => isWordCl(x) && x.b !== '\u200C' && x.b !== '\u200D' && (x.b !== 'ـ' || x.m.length > 0);
  const hasKind = (x, kinds) => x.k.some(k => kinds.indexOf(k) >= 0);
  // grappes (un caractère et ses signes, avec leur nature), mots et lettres de désinence
  function tkAnalyse(s) {
    s = String(s);
    const sc = tkScript(s), cl = [];
    for (const ch of Array.from(s)) {
      const c = ch.codePointAt(0), last = cl[cl.length - 1], mk = isMark(c) || SPACING[c] !== undefined;
      if (mk && last && !/\s/.test(last.b)) last.m.push(ch);
      else cl.push({ b: mk ? '' : ch, m: mk ? [ch] : [] });
    }
    for (const x of cl) {
      x.k = x.m.map(ch => markKind(ch.codePointAt(0), sc, x.b));
      // iqlāb (KFGQPC) : voyelle + ۢ = tanwīn
      if (x.m.indexOf('ۢ') >= 0 && x.k.indexOf('v') >= 0) x.m.forEach((ch, i) => { if (/[َ-ِۢ]/.test(ch)) x.k[i] = 't'; });
      // lettre muette : ۟ ۠, ْ dans l'encodage KFGQPC, alif marqué d'un soukoun (قَالُواْ)
      x.silent = x.m.some(ch => ch === '\u06DF' || ch === '\u06E0' || (ch === '\u0652' && (sc.qpc || x.b === '\u0627')));
    }
    const words = [];
    for (let i = 0; i < cl.length;) {
      if (!isWordCl(cl[i])) { i++; continue; }
      let j = i;
      while (j < cl.length && isWordCl(cl[j])) j++;
      words.push({ a: i, b: j });
      i = j;
    }
    for (const w of words) {
      // ٗ ٖ devant un ا ou ى final nu : tanwīn (ailleurs, hors KFGQPC, ce sont des voyelles longues : لَهٗ، بِهٖ)
      for (let i = w.a; i < w.b; i++) {
        const x = cl[i], n = nextCl(cl, i, w.b);
        if (n === w.b - 1 && 'اى'.indexOf(cl[n].b) >= 0 && !hasKind(cl[n], 'vths')) x.m.forEach((ch, k) => { if (ch === 'ٗ' || ch === 'ٖ') x.k[k] = 't'; });
      }
      w.unit = endingOf(cl, w.a, w.b);
    }
    return { cl, words, sc };
  }
  // lettre suivante du mot (le tatwīl nu est sauté), -1 s'il n'y en a pas
  function nextCl(cl, i, b) { let j = i + 1; while (j < b && cl[j].b === 'ـ' && !cl[j].m.length) j++; return j < b ? j : -1; }
  // lettre qui porte la désinence : la dernière lettre prononcée du mot (les lettres muettes sont sautées) ;
  // celle qui porte le tanwīn devant un ا، ى ou و final nu (كِتَابًا، هُدًى، عَمْرٌو) ;
  // avec le tanwīn sur l'alif (كتاباً، جدّاً), la lettre d'avant compte aussi
  function endingOf(cl, a, b) {
    const prevL = i => { let p = i - 1; while (p >= a && !isLetterCl(cl[p])) p--; return p; };
    let e = b - 1;
    while (e >= a && !isLetterCl(cl[e])) e--;
    while (e >= a && cl[e].silent) { const p = prevL(e); if (p < a) break; e = p; }
    if (e < a) return [];
    const p = prevL(e);
    if ('اىوٱ'.indexOf(cl[e].b) >= 0 && !hasKind(cl[e], 'vths') && p >= a && hasKind(cl[p], 't')) return [p];
    if ('اى'.indexOf(cl[e].b) >= 0 && hasKind(cl[e], 't') && p >= a) return [p, e];
    return [e];
  }
  // voyelle que le lecteur devine : fatḥa devant un alif nu (ا ى ٱ) ou devant ة, ḍamma devant un و nu,
  // kasra devant un ي ou un ى nu, kasra de إ
  function evidentVowel(cl, i, ch, b) {
    const x = cl[i];
    if (ch === 'ِ' && (x.b === 'إ' || (x.b === 'ا' && x.m.indexOf('ٕ') >= 0))) return true;
    const j = nextCl(cl, i, b);
    if (j < 0) return false;
    const n = cl[j], bare = !hasKind(n, 'vth');
    if (ch === 'َ') return n.b === 'ة' || (bare && 'اىٱ'.indexOf(n.b) >= 0);
    if (ch === 'ُ') return bare && n.b === 'و';
    if (ch === 'ِ') return bare && (n.b === 'ي' || n.b === 'ى');
    return false;
  }
  const WASLA_KEPT = { nosukun: true, body: true };
  function tashkilLevel(s, level) {
    s = String(s == null ? '' : s);
    if (level === 'full' || TASHKIL_LEVELS.indexOf(level) < 0) return s;
    const { cl, words, sc } = tkAnalyse(s), end = new Array(cl.length).fill(cl.length), unit = new Set();
    for (const w of words) {
      for (let i = w.a; i < w.b; i++) end[i] = w.b;
      for (const e of w.unit) unit.add(e);
    }
    let out = '', skipSpace = false;
    for (let i = 0; i < cl.length; i++) {
      const x = cl[i], last = unit.has(i);
      if (skipSpace) { skipSpace = false; if (x.b === ' ' && !x.m.length) continue; }
      let m = '';
      for (let k = 0; k < x.m.length; k++) {
        const kd = x.k[k], ch = x.m[k];
        let keep = kd === 'o';
        if (!keep) switch (level) {
          case 'nosukun': keep = kd !== 's'; break;
          case 'partial': keep = kd !== 's' && kd !== 'q' && !(kd === 'v' && evidentVowel(cl, i, ch, end[i])); break;
          case 'body': keep = !(last && (kd === 'v' || kd === 't' || kd === 's')); break;
          case 'ends': keep = last && kd !== 'q'; break;
          case 'shaddatanwin': keep = kd === 'h' || kd === 't'; break;
          case 'shadda': keep = kd === 'h'; break;
          default: keep = false;
        }
        // texte du Coran : l'alif suscrit et les petites lettres y tiennent lieu de lettres (ٱلْكِتَـٰبُ) ; seul « Aucun » les retire
        if (!keep && kd === 'a' && sc.uthmani && level !== 'none') keep = true;
        if (keep) m += ch;
        else if (SPACING_MEDIAL.has(ch)) m += 'ـ';
      }
      // tatwīl qui ne portait que des signes retirés (alif suscrit, madda du Coran…) : il disparaît avec eux
      if (x.b === 'ـ' && x.m.length && !m && x.k.every(k => k === 'a' || k === 'q')) continue;
      // signe seul (pause du Coran entre deux espaces) retiré : un seul espace reste
      if (x.b === '' && !m) { if (/[ \u00A0]$/.test(out)) skipSpace = true; continue; }
      out += (x.b === 'ٱ' && !WASLA_KEPT[level] ? 'ا' : x.b) + m;
    }
    return out;
  }
  // part des lettres vocalisées à l'intérieur des mots (0 à 1). Ne comptent pas : la lettre de la désinence (souvent nue
  // à la pause), les alifs, les lettres muettes, les lettres longues (و après ḍamma, ي après kasra), le lām de l'article,
  // la lettre suivie d'un alif qui porte le tanwīn (شكراً), la consonne nue entre une voyelle et une autre voyelle ou la
  // fin du mot (soukoun sous-entendu : العِلمُ، صَبر). Les signes d'un tatwīl comptent pour la lettre qui le précède.
  function tashkilCoverage(s) {
    const { cl, words } = tkAnalyse(s);
    let n = 0, m = 0;
    for (const { a, b, unit } of words) {
      const kindsOf = i => { const k = cl[i].k.slice(); for (let j = i + 1; j < b && cl[j].b === 'ـ'; j++) k.push(...cl[j].k); return k; };
      const letters = [];
      for (let i = a; i < b; i++) if (isLetterCl(cl[i]) && cl[i].b !== 'ـ') letters.push(i);
      const vowelled = i => kindsOf(i).some(k => k === 'v' || k === 'a');
      letters.forEach((i, li) => {
        const x = cl[i];
        if (unit.indexOf(i) >= 0 || 'اىٱآ'.indexOf(x.b) >= 0 || x.silent) return;
        const marked = kindsOf(i).some(k => 'vthsa'.indexOf(k) >= 0);
        if (!marked) {
          const p = li > 0 ? letters[li - 1] : -1, j = li < letters.length - 1 ? letters[li + 1] : -1;
          if (x.b === 'و' && p >= 0 && cl[p].m.indexOf('ُ') >= 0) return;
          if (x.b === 'ي' && p >= 0 && cl[p].m.indexOf('ِ') >= 0) return;
          if (x.b === 'ل' && p >= 0 && 'اٱ'.indexOf(cl[p].b) >= 0) return;
          if (x.b === 'ل' && j >= 0 && hasKind(cl[j], 'h')) return;
          if (j >= 0 && cl[j].b === 'ا' && hasKind(cl[j], 't')) return;
          if (p >= 0 && vowelled(p) && (j < 0 || unit.indexOf(j) >= 0 || vowelled(j))) return;
        }
        n++;
        if (marked) m++;
      });
    }
    return n ? m / n : (hasTashkil(s) ? 1 : 0);
  }
  const hasTashkil = s => tkAnalyse(s).cl.some(x => hasKind(x, 'vthsa'));

  // Lettres qui ne se lient pas à la lettre suivante
  const RIGHT_JOIN = new Set('اأإآٱدذرزوؤةڈڑژۆۇۈۋۅۉۊۏەۀړڕږڗڙۮۯٲٳٵٶٷ'.split(''));
  function isArabicLetter(ch) {
    const c = ch.charCodeAt(0);
    return (c >= 0x0620 && c <= 0x064A) || (c >= 0x066E && c <= 0x06D3) || c === 0x06D5 || (c >= 0x06FA && c <= 0x06FC) || c === 0x06FF || (c >= 0x0750 && c <= 0x077F) || (c >= 0x08A0 && c <= 0x08C9);
  }
  function joinsNext(ch) { return isArabicLetter(ch) && ch !== 'ء' && !RIGHT_JOIN.has(ch); }
  // Insère des tatwil (ـ) avant la dernière lettre liée de chaque mot (étirement calligraphique)
  const ALLAH_RE = /^[\u0648\u0641\u0628\u062A]?(?:\u0627\u0644|\u0644)\u0644\u0647\u0645?$/;
  function addKashida(text, count) {
    if (!count) return text;
    return text.split(/(\s+)/).map(word => {
      if (/^\s*$/.test(word)) return word;
      if (ALLAH_RE.test(stripMarks(word))) return word; // on n'étire pas le nom de Dieu
      const chars = Array.from(word);
      let best = -1;
      for (let i = 0; i < chars.length; i++) {
        if (!joinsNext(chars[i])) continue;
        let j = i + 1;
        while (j < chars.length && isMark(chars[j].charCodeAt(0))) j++;
        if (j >= chars.length || !isArabicLetter(chars[j])) continue;
        if (chars[i] === 'ل' && 'اأإآٱ'.includes(chars[j])) continue; // garder la ligature lam-alif
        if (chars[j] === 'ـ') continue;
        best = j; // position d'insertion (après les signes de la lettre)
      }
      if (best < 0) return word;
      return chars.slice(0, best).join('') + 'ـ'.repeat(count) + chars.slice(best).join('');
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // 3. Mise en page
  // ---------------------------------------------------------------------------
  // glyphes par pas de GS : [gid, x, y (décalage vertical), x du stylo, chasse, grappe]
  const GS = 6;
  function layoutText(font, text, opt) {
    opt = opt || {};
    const lines = text.replace(/\r/g, '').split('\n');
    const out = [];
    for (const line of lines) {
      const runs = bidiRuns(line).reverse();
      const glyphs = [];
      let x = 0;
      runs.forEach((r, ri) => {
        const s = font.shape(r.text, r.rtl, opt.features);
        for (let i = 0; i < s.g.length; i++) {
          let adv = s.ax[i];
          const ch = r.text.charCodeAt(s.cl[i]);
          if (ch === 32 || ch === 0xA0) {
            if (font.fixSpace && adv < font.fixSpace * 0.2) adv = font.fixSpace;
            if (opt.wordSpace != null && opt.wordSpace !== 1) adv = Math.round(adv * opt.wordSpace);
          }
          glyphs.push(s.g[i], x + s.dx[i], s.dy[i], x, adv, ri * 65536 + s.cl[i]);
          x += adv;
        }
      });
      out.push({ glyphs, width: x });
    }
    return out;
  }

  // Assemble les contours de tous les glyphes en coordonnées pixels (y vers le bas)
  function buildText(font, text, o) {
    const size = o.size || 100, lh = o.lineHeight || 1.0, align = o.align || 'center';
    const lines = layoutText(font, text, o);
    const s = size / font.upem;
    const adv = (font.ascender - font.descender + Math.max(0, font.lineGap)) * lh;
    const maxW = lines.reduce((m, l) => Math.max(m, l.width), 0);
    const cmds = [];
    // spans : morceaux de cmds par glyphe, avec sa ligne de base locale (px) ; « raised » = glyphe surélevé (nastaliq),
    // « mark » = signe (haraka), « color » = calque d'une police en couleur (null = couleur de l'encre), « line » = n° de ligne
    const spans = [], lineBase = [], lineX = [];
    const useColor = o.color !== false && font.hasColorLayers;
    const pushOutline = (ol, gx, gy, base) => {
      for (let i = 0; i < ol.length;) {
        const op = ol[i++];
        cmds.push(op);
        const nc = op === 0 || op === 1 ? 1 : op === 2 ? 2 : op === 3 ? 3 : 0;
        for (let c = 0; c < nc; c++) {
          cmds.push((gx + ol[i]) * s, (base - (gy + ol[i + 1])) * s);
          i += 2;
        }
      }
    };
    for (let li = 0; li < lines.length; li++) {
      const ln = lines[li];
      const xo = align === 'center' ? (maxW - ln.width) / 2 : align === 'right' ? maxW - ln.width : 0;
      const base = font.ascender + li * adv;
      lineBase.push(base * s); lineX.push([xo * s, (xo + ln.width) * s]);
      const g = ln.glyphs;
      // grappes (lettre + signes, ou ligature) : décalage vertical de la lettre de base (la plus large)
      const cl = new Map();
      for (let k = 0; k < g.length; k += GS) {
        const c = cl.get(g[k + 5]);
        if (!c) cl.set(g[k + 5], { dy: g[k + 2], a: g[k + 4] });
        else if (g[k + 4] > c.a) { c.a = g[k + 4]; c.dy = g[k + 2]; }
      }
      for (let k = 0; k < g.length; k += GS) {
        if (g[k] === 0) continue; // glyphe manquant (.notdef) : on ne dessine pas de boîte
        const gx = xo + g[k + 1], gy = g[k + 2];
        const c = cl.get(g[k + 5]);
        const gc = font.glyphClass(g[k]);
        const mark = gc === 3 || (gc === 0 && g[k + 4] === 0 && c.a > 0);
        const info = { lb: (base - c.dy) * s, raised: Math.abs(c.dy) > font.upem * 0.05, mark, line: li, gid: g[k], color: null };
        const layers = useColor ? font.colorLayers(g[k]) : null;
        if (layers && layers.length) {
          for (const L of layers) {
            const ol = font.outline(L.glyph);
            if (!ol.length) continue;
            const i0 = cmds.length;
            pushOutline(ol, gx, gy, base);
            spans.push(Object.assign({ i0, i1: cmds.length }, info, { color: L.color }));
          }
          continue;
        }
        const ol = font.outline(g[k]);
        if (!ol.length) continue;
        const i0 = cmds.length;
        pushOutline(ol, gx, gy, base);
        spans.push(Object.assign({ i0, i1: cmds.length }, info));
      }
    }
    return { cmds, spans, lineBase, lineX, bbox: pathBBox(cmds), width: maxW * s, height: (font.ascender - font.descender + (lines.length - 1) * adv) * s, lines: lines.length,
      baseline: (font.ascender + (lines.length - 1) * adv / 2) * s, size };
  }

  // ---------------------------------------------------------------------------
  // 4. Géométrie des chemins
  // ---------------------------------------------------------------------------
  function pathBBox(c) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, px = 0, py = 0;
    function add(x, y) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    function qext(p0, p1, p2, axis) {
      const d = p0 - 2 * p1 + p2;
      if (Math.abs(d) < 1e-9) return [];
      const t = (p0 - p1) / d;
      return t > 0 && t < 1 ? [t] : [];
    }
    function cext(p0, p1, p2, p3) {
      const a = -p0 + 3 * p1 - 3 * p2 + p3, b = 2 * (p0 - 2 * p1 + p2), cc = p1 - p0, r = [];
      if (Math.abs(a) < 1e-9) { if (Math.abs(b) > 1e-9) r.push(-cc / b); }
      else { const disc = b * b - 4 * a * cc; if (disc >= 0) { const q = Math.sqrt(disc); r.push((-b + q) / (2 * a), (-b - q) / (2 * a)); } }
      return r.filter(t => t > 0 && t < 1);
    }
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0 || op === 1) { px = c[i]; py = c[i + 1]; add(px, py); i += 2; }
      else if (op === 2) {
        const cx = c[i], cy = c[i + 1], x = c[i + 2], y = c[i + 3];
        add(x, y);
        for (const t of qext(px, cx, x).concat(qext(py, cy, y))) {
          const mt = 1 - t;
          add(mt * mt * px + 2 * mt * t * cx + t * t * x, mt * mt * py + 2 * mt * t * cy + t * t * y);
        }
        px = x; py = y; i += 4;
      } else if (op === 3) {
        const ax = c[i], ay = c[i + 1], bx = c[i + 2], by = c[i + 3], x = c[i + 4], y = c[i + 5];
        add(x, y);
        for (const t of cext(px, ax, bx, x).concat(cext(py, ay, by, y))) {
          const mt = 1 - t;
          add(mt * mt * mt * px + 3 * mt * mt * t * ax + 3 * mt * t * t * bx + t * t * t * x,
            mt * mt * mt * py + 3 * mt * mt * t * ay + 3 * mt * t * t * by + t * t * t * y);
        }
        px = x; py = y; i += 6;
      }
    }
    if (x0 === Infinity) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }
  function transformPath(c, k, tx, ty) {
    const o = new Array(c.length);
    for (let i = 0; i < c.length;) {
      const op = c[i]; o[i++] = op;
      const n = op === 0 || op === 1 ? 2 : op === 2 ? 4 : op === 3 ? 6 : 0;
      for (let j = 0; j < n; j += 2) { o[i] = c[i] * k + tx; o[i + 1] = c[i + 1] * k + ty; i += 2; }
    }
    return o;
  }
  function num(v, p) {
    const s = v.toFixed(p);
    return s.indexOf('.') >= 0 ? s.replace(/0+$/, '').replace(/\.$/, '').replace(/^-0$/, '0') : s;
  }
  function toSVGPath(c, prec) {
    const p = prec == null ? 2 : prec;
    let s = '';
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0) { s += 'M' + num(c[i], p) + ' ' + num(c[i + 1], p); i += 2; }
      else if (op === 1) { s += 'L' + num(c[i], p) + ' ' + num(c[i + 1], p); i += 2; }
      else if (op === 2) { s += 'Q' + num(c[i], p) + ' ' + num(c[i + 1], p) + ' ' + num(c[i + 2], p) + ' ' + num(c[i + 3], p); i += 4; }
      else if (op === 3) { s += 'C' + num(c[i], p) + ' ' + num(c[i + 1], p) + ' ' + num(c[i + 2], p) + ' ' + num(c[i + 3], p) + ' ' + num(c[i + 4], p) + ' ' + num(c[i + 5], p); i += 6; }
      else s += 'Z';
    }
    return s;
  }
  // Convertit les quadratiques en cubiques (PDF, EPS)
  function toCubic(c) {
    const o = [];
    let px = 0, py = 0, sx = 0, sy = 0;
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0) { px = sx = c[i]; py = sy = c[i + 1]; o.push(0, px, py); i += 2; }
      else if (op === 1) { px = c[i]; py = c[i + 1]; o.push(1, px, py); i += 2; }
      else if (op === 2) {
        const cx = c[i], cy = c[i + 1], x = c[i + 2], y = c[i + 3];
        o.push(3, px + 2 / 3 * (cx - px), py + 2 / 3 * (cy - py), x + 2 / 3 * (cx - x), y + 2 / 3 * (cy - y), x, y);
        px = x; py = y; i += 4;
      } else if (op === 3) { o.push(3, c[i], c[i + 1], c[i + 2], c[i + 3], c[i + 4], c[i + 5]); px = c[i + 4]; py = c[i + 5]; i += 6; }
      else { o.push(4); px = sx; py = sy; }
    }
    return o;
  }
  // Aplatit les courbes en polylignes fermées (DXF)
  function flatten(c, tol) {
    tol = tol || 0.05;
    const polys = [];
    let cur = null, px = 0, py = 0;
    function seg(n) { return Math.max(2, Math.min(64, Math.ceil(n))); }
    for (let i = 0; i < c.length;) {
      const op = c[i++];
      if (op === 0) { if (cur && cur.length > 2) polys.push(cur); px = c[i]; py = c[i + 1]; cur = [px, py]; i += 2; }
      else if (op === 1) { px = c[i]; py = c[i + 1]; cur.push(px, py); i += 2; }
      else if (op === 2) {
        const cx = c[i], cy = c[i + 1], x = c[i + 2], y = c[i + 3];
        const len = Math.hypot(cx - px, cy - py) + Math.hypot(x - cx, y - cy);
        const n = seg(Math.sqrt(len / tol) / 2);
        for (let k = 1; k <= n; k++) { const t = k / n, mt = 1 - t; cur.push(mt * mt * px + 2 * mt * t * cx + t * t * x, mt * mt * py + 2 * mt * t * cy + t * t * y); }
        px = x; py = y; i += 4;
      } else if (op === 3) {
        const ax = c[i], ay = c[i + 1], bx = c[i + 2], by = c[i + 3], x = c[i + 4], y = c[i + 5];
        const len = Math.hypot(ax - px, ay - py) + Math.hypot(bx - ax, by - ay) + Math.hypot(x - bx, y - by);
        const n = seg(Math.sqrt(len / tol) / 2);
        for (let k = 1; k <= n; k++) {
          const t = k / n, mt = 1 - t;
          cur.push(mt * mt * mt * px + 3 * mt * mt * t * ax + 3 * mt * t * t * bx + t * t * t * x, mt * mt * mt * py + 3 * mt * mt * t * ay + 3 * mt * t * t * by + t * t * t * y);
        }
        px = x; py = y; i += 6;
      } else { if (cur && cur.length > 2) polys.push(cur); cur = null; }
    }
    if (cur && cur.length > 2) polys.push(cur);
    return polys;
  }

  // Découpe un chemin en contours (chacun commence par un « M »)
  const NCOORD = { 0: 2, 1: 2, 2: 4, 3: 6, 4: 0 };
  function splitContours(c, i0, i1) {
    const out = [];
    let k = i0 == null ? 0 : i0;
    const end = i1 == null ? c.length : i1;
    while (k < end) {
      let e = k + 1 + NCOORD[c[k]];
      while (e < end && c[e] !== 0) e += 1 + NCOORD[c[e]];
      out.push(c.slice(k, e));
      k = e;
    }
    return out;
  }
  // aire signée d'une polyligne fermée [x0,y0,x1,y1…]
  function polyArea(p) {
    let a = 0;
    for (let i = 0, n = p.length; i < n; i += 2) { const j = (i + 2) % n; a += p[i] * p[j + 1] - p[j] * p[i + 1]; }
    return a / 2;
  }
  // nombre d'enroulement d'un point dans une polyligne fermée
  function winding(p, x, y) {
    let w = 0;
    for (let i = 0, n = p.length; i < n; i += 2) {
      const j = (i + 2) % n, x0 = p[i], y0 = p[i + 1], x1 = p[j], y1 = p[j + 1];
      if (y0 <= y) { if (y1 > y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) > 0) w++; }
      else if (y1 <= y && (x1 - x0) * (y - y0) - (x - x0) * (y1 - y0) < 0) w--;
    }
    return w;
  }
  // Repère les points diacritiques d'un glyphe : petits contours qui ne sont contenus dans aucun autre
  function dotContours(contours, size) {
    if (contours.length < 2) return contours.map(() => false);
    const polys = contours.map(c => flatten(c, Math.max(0.2, size * 0.004))[0] || []);
    const boxes = polys.map(p => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < p.length; i += 2) { if (p[i] < x0) x0 = p[i]; if (p[i] > x1) x1 = p[i]; if (p[i + 1] < y0) y0 = p[i + 1]; if (p[i + 1] > y1) y1 = p[i + 1]; }
      return { x0, y0, x1, y1 };
    });
    const big = boxes.map(b => Math.max(b.x1 - b.x0, b.y1 - b.y0));
    const maxBig = Math.max.apply(null, big);
    return polys.map((p, i) => {
      if (p.length < 6 || big[i] > size * 0.2 || big[i] >= maxBig * 0.999 || Math.abs(polyArea(p)) < size * size * 0.0004) return false;
      const b = boxes[i], cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      for (let j = 0; j < polys.length; j++) {
        if (j === i || polys[j].length < 6) continue;
        const o = boxes[j];
        if (cx < o.x0 || cx > o.x1 || cy < o.y0 || cy > o.y1) continue;
        if (winding(polys[j], cx, cy) !== 0) return false; // contenu : trou ou détail intérieur
      }
      return true;
    });
  }

  // Retire les signes (harakat) que la police ne sait pas dessiner et liste les caractères manquants
  function checkSupport(font, text) {
    const missing = new Set();
    let out = '';
    for (const ch of text) {
      const c = ch.codePointAt(0);
      if (c <= 0x20 || c === 0x200C || c === 0x200D || c === 0x200E || c === 0x200F || c === 0xA0) { out += ch; continue; }
      if (font.hasChar(c)) { out += ch; continue; }
      if (isMark(c)) continue;
      missing.add(ch);
      out += ch;
    }
    return { text: out, missing: Array.from(missing) };
  }

  root.Khatt = { checkSupport, isMark, HB, Font, bidiRuns, stripMarks, TASHKIL_LEVELS, tashkilLevel, tashkilCoverage, hasTashkil, addKashida, layoutText, buildText, pathBBox, transformPath, toSVGPath, toCubic, flatten, num, splitContours, polyArea, winding, dotContours };
})(typeof self !== 'undefined' ? self : globalThis);
