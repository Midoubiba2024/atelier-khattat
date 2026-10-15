  // ------------------------------------------------------------------ galerie : onglets Styles / Modèles
  // les modèles ne se dessinent que si leur panneau est ouvert
  function showGTab(id) {
    S.gtab = id;
    if (id === 'models') renderModels();
  }

  // ------------------------------------------------------------------ modèles
  let userModels = [];
  const allModels = () => MODELS.concat(userModels);
  const fontLabel = id => { const f = fontById(id); return f ? f.name : 'Style courant'; };
  // applique l'apparence d'un modèle à un état (S ou une copie) ; le texte n'est pas touché
  function lookInto(st, L) {
    L = L || {};
    if (L.font && fontById(L.font)) { st.fontId = L.font; st.wght = typeof L.wght === 'number' ? L.wght : null; }
    st.shape = Object.assign(clone(DEFAULT.shape), { free: st.shape ? st.shape.free : null }, L.shape || {});
    st.fill = cleanPaint(Object.assign({}, DEFAULT.fill, L.fill || {}), null, DEFAULT.fill, ['solid', 'linear', 'radial']);
    st.bg = cleanPaint(Object.assign({}, DEFAULT.bg, L.bg || { type: 'none' }), null, DEFAULT.bg, ['none', 'solid', 'linear', 'radial']);
    st.stroke = Object.assign(clone(DEFAULT.stroke), L.stroke || { on: false });
    st.shadow = L.shadow ? Object.assign(clone(DEFAULT.shadow), L.shadow, { on: L.shadow.on !== false }) : Object.assign(clone(DEFAULT.shadow), { on: false });
    st.fx = mergeDeep(FX_OFF, L.fx || {});
    st.frame = Object.assign(clone(DEFAULT.frame), L.frame || {});
    st.pattern = Object.assign(clone(DEFAULT.pattern), L.pattern || {});
    st.lineInk = Array.isArray(L.lineInk) ? { on: true, colors: DEFAULT.lineInk.colors.map((d, i) => normHex(L.lineInk[i]) || d) } : clone(DEFAULT.lineInk);
    st.format = Object.assign({}, st.format || DEFAULT.format, { id: L.format || 'auto' });
    st.lineHeight = L.lineHeight || DEFAULT.lineHeight;
    st.kashida = L.kashida || 0;
    st.wordSpace = L.wordSpace || 1;
    st.align = L.align || 'center';
    // niveau du tashkīl : celui du modèle s'il en a un ; un modèle « avec harakat » montre le tashkīl caché
    if (K.TASHKIL_LEVELS.includes(L.tkLevel)) st.tkLevel = L.tkLevel;
    else if (L.harakat && st.tkLevel === 'none') st.tkLevel = 'full';
    st.harakat = st.tkLevel !== 'none';
    return st;
  }
  // apparence de la création en cours (pour l'enregistrer comme modèle)
  function currentLook() {
    return {
      font: S.fontId, wght: S.wght, shape: clone(S.shape), fill: clone(S.fill), bg: S.bg.type === 'image' ? { type: 'none' } : clone(S.bg),
      stroke: clone(S.stroke), shadow: clone(S.shadow), fx: clone(S.fx), frame: clone(S.frame), pattern: clone(S.pattern), lineInk: S.lineInk.on ? S.lineInk.colors.slice() : null,
      format: S.format.id === 'custom' ? 'auto' : S.format.id, lineHeight: S.lineHeight, kashida: S.kashida, wordSpace: S.wordSpace, align: S.align, tkLevel: S.tkLevel, harakat: S.harakat
    };
  }
  // ------------------------------------------------------------------ variations : propositions tirées au sort pour la phrase
  // une police, une ambiance et une forme qui conviennent à la longueur du texte ; jamais deux fois la même police
  // ni la même ambiance dans une série
  const VAR_FONTS = ['layla-thuluth', 'layla-diwani', 'aref-ruqaa-bold', 'amiri-bold', 'kitab-bold', 'reem-kufi-bold', 'kufam-black', 'qahiri', 'bouazzi-maghribi', 'gulzar', 'mirza-bold', 'el-messiri-bold', 'lalezar', 'rakkas', 'marhey-bold', 'noto-naskh-bold'];
  const pickOne = a => a[Math.floor(Math.random() * a.length)];
  function variationLooks(n) {
    const t = S.text.trim() || 'الخط العربي';
    const lines = t.split('\n').filter(l => l.trim()).length || 1, words = t.split(/\s+/).filter(Boolean).length, chars = t.replace(/\s+/g, '').length;
    const shapes = [];
    const add = (w, sh, fmt, round) => shapes.push({ w, sh, fmt, round });
    add(1.2, { type: 'straight' }, 'auto');
    add(1, { type: 'bridge', height: 28 }, 'landscape');
    if (lines === 1 && chars <= 40) add(1, { type: 'arc', bend: 80 + Math.round(Math.random() * 40) }, 'landscape');
    if (lines === 1 && words >= 2 && chars <= 60) add(1, { type: 'circle', cover: 96, ring: 'single', ringW: 5 }, 'square', true);
    if (words <= 2 && chars <= 12) { add(0.6, { repeat: 'rosette', copies: 8, spread: 100 }, 'square', true); add(0.5, { repeat: 'kaleido', copies: 8, spread: 90 }, 'square', true); add(0.5, { repeat: 'mirror', mgap: 4 }, 'auto'); }
    if (lines >= 2 && lines <= 3) add(1, { type: 'seal', cover: 70, ring: 'double', ringW: 6, sep: 'star' }, 'square', true);
    if (words >= 4 || chars > 22) add(1.4, { type: 'fill', fillShape: pickOne(['oval', 'egg', 'circle', 'drop', 'arch']), wrap: 'auto', grow: 55, stretch: 10, lead: 16, ring: 'single', ringW: 5 }, 'portrait');
    if (words >= 6) add(0.8, { type: 'rings', center: 1, rgap: 14, rlines: 'thin', sep: 'dot', ring: 'single', ringW: 5 }, 'square', true);
    if (lines === 1 && words >= 3 && words <= 6) add(0.6, { type: 'wings', ring: 'single', swash: 'on' }, 'banner');
    const total = shapes.reduce((a, s) => a + s.w, 0);
    const pickShape = () => { let r = Math.random() * total; for (const s of shapes) { r -= s.w; if (r <= 0) return s; } return shapes[0]; };
    const fonts = VAR_FONTS.filter(id => fontById(id)), out = [];
    for (let i = 0; i < n * 8 && out.length < n; i++) {
      const f = pickOne(fonts), m = pickOne(MOODS), s = pickShape();
      if (out.some(o => o.look.font === f || o.mood === m.id)) continue;
      const look = { font: f, shape: clone(s.sh), fill: clone(m.ink), bg: clone(m.bg), shadow: m.shadow ? clone(m.shadow) : null, fx: m.fx ? clone(m.fx) : {},
        frame: m.frame ? clone(m.frame) : null, pattern: m.pattern ? clone(m.pattern) : null, format: s.fmt, tkLevel: S.tkLevel };
      if (!look.frame && Math.random() < 0.4) look.frame = s.round ? { type: 'circle', width: 1.6, double: true, pad: 12 } : { type: pickOne(['rect', 'cartouche', 'arch', 'round', 'octagon']), width: 1.6, double: Math.random() < 0.5, pad: 16 };
      const fo = fontById(f), sh = SHAPES.find(x => x.id === (s.sh.type || 'straight')), rp = s.sh.repeat ? REPEATS.find(r => r[0] === s.sh.repeat) : null;
      out.push({ id: 'var' + Date.now().toString(36) + i, name: fo ? fo.name : f, note: m.name + (rp ? ' · ' + rp[1] : sh && sh.id !== 'straight' ? ' · ' + sh.name : ''), look, mood: m.id, variation: true });
    }
    return out;
  }
  let curVars = [], varSeq = 0, varKey = '';
  function variationCard(v) {
    const w = document.createElement('div');
    w.className = 'mc'; w.dataset.id = v.id; w._m = v;
    w.innerHTML = '<button type="button" class="mc-apply"><span class="mc-art"><span class="sk"></span></span><span class="mc-name"></span><span class="mc-note"></span></button>';
    w.querySelector('.mc-name').textContent = v.name;
    w.querySelector('.mc-note').textContent = v.note;
    const ap = w.querySelector('.mc-apply');
    ap.setAttribute('aria-label', 'Appliquer la variation : ' + v.name + ', ' + v.note);
    ap.addEventListener('click', () => applyModel(v, false));
    return w;
  }
  // aperçus des variations avec la phrase en cours (redessinés quand elle change)
  async function drawVariations() {
    const g = $('#vgrid'), run = ++varSeq;
    varKey = [S.text, S.tkLevel].join('|');
    for (const c of $$('.mc', g)) {
      if (run !== varSeq) return;
      const v = c._m, art = c.querySelector('.mc-art');
      try {
        await ensureFont(fontById(v.look.font));
        if (fxLookNeedsClipper(v.look)) await ensureClipper();
        if (run !== varSeq) return;
        const sc = modelScene(v, S.text.trim() ? S.text : 'الخط العربي');
        art.innerHTML = sc && !sc.empty ? KX.sceneToSVG(sc, { inline: true, idPrefix: 'vr' + run + '-' + c.dataset.id }) : '';
      } catch (e) { art.innerHTML = ''; }
      await sleep(0);
    }
  }
  function showVariations() {
    curVars = variationLooks(6);
    const g = $('#vgrid');
    g.innerHTML = '';
    for (const v of curVars) g.appendChild(variationCard(v));
    g.hidden = false;
    $('#variBtn').textContent = 'Nouvelles variations';
    drawVariations();
  }
  function applyModel(m, withExample) {
    const keepText = S.text;
    const st = lookInto(clone(S), m.look);
    st.text = withExample && m.ex ? m.ex : keepText;
    replaceState(st);
    commitHist();
    // format fixe : la taille s'ajuste au cadre une fois la police chargée
    const f = currentFont();
    if (S.format.id !== 'auto' && f) ensureFont(f, true).then(() => { fitToFormat(); }).catch(() => {});
    status(m.variation ? 'Variation appliquée : ' + m.name + ', ' + m.note + '. Tout reste réglable ; « Annuler » revient en arrière.'
      : 'Modèle « ' + m.name + ' » appliqué' + (withExample ? ' avec son exemple' : ' à votre phrase') + '. Tout reste réglable ; « Annuler » revient en arrière.');
  }
  // scène d'aperçu d'un modèle (format réduit)
  function modelScene(m, text) {
    const f = fontById(m.look.font) || currentFont() || fontById(DEFAULT.fontId);
    if (!f || f.state !== 'ready') return null;
    const st = lookInto(clone(S), m.look);
    const hb = f.hb;
    const v = Object.assign({}, f.vars || {});
    if (typeof st.wght === 'number' && hb.axes.some(a => a.tag === 'wght')) v.wght = st.wght;
    hb.setVariations(v);
    const p = prepText(text, st.tkLevel, st.kashida);
    const chk = K.checkSupport(hb, st.kashida && hb.kashidaOK ? p.k : p.t);
    if (!chk.text.trim()) return null;
    const F = FORMATS.find(x => x.id === st.format.id);
    let fmt = { id: 'auto', margin: 16 };
    if (F && F.w) { const k = 420 / Math.max(F.w, F.h); fmt = { id: 'custom', w: Math.round(F.w * k), h: Math.round(F.h * k) }; }
    st.size = 60;
    const set = settingsOf(st, { format: fmt, image: null, phys: { on: false } });
    if (fmt.id !== 'auto') set.size = KX.fitSize(hb, chk.text, set, null, 0.8);
    return KX.buildScene(hb, chk.text, set, null, { quality: 'preview' });
  }
  const previewText = m => (S.mdSrc === 'ex' || !S.text.trim()) ? (m.ex || S.text || 'الخط العربي') : S.text;
  let mdKey = '', mdSeq = 0;
  const mio = lazyObserver(es => {
    for (const e of es) { const c = e.target; c._vis = e.isIntersecting; if (e.isIntersecting && c._dirty) queueModel(c); }
  }, '600px');
  const mQueue = [];
  let mBusy = false;
  function queueModel(card) { if (!mQueue.includes(card)) mQueue.push(card); pumpModels(); }
  async function pumpModels() {
    if (mBusy) return;
    mBusy = true;
    try {
      while (mQueue.length) {
        const card = mQueue.shift();
        if (!card.isConnected || !card._dirty) continue;
        const m = card._m, art = card.querySelector('.mc-art');
        const f = fontById(m.look.font) || currentFont();
        try { await ensureFont(f); } catch (e) { art.innerHTML = '<small>police indisponible</small>'; card._dirty = false; continue; }
        if (!card.isConnected) continue;
        if (fxLookNeedsClipper(m.look)) await ensureClipper();
        try {
          const sc = modelScene(m, previewText(m));
          card._dirty = false;
          art.innerHTML = sc && !sc.empty ? KX.sceneToSVG(sc, { inline: true, idPrefix: 'md' + (++mdSeq) }) : '';
        } catch (e) { console.warn(e); card._dirty = false; art.innerHTML = ''; }
        await sleep(0);
      }
    } finally { mBusy = false; }
  }
  const fxLookNeedsClipper = L => !!(L.fx && (L.fx.weight || (L.fx.hollow && L.fx.hollow.on) || (L.fx.outline && L.fx.outline.on) || (L.fx.extrude && L.fx.extrude.on))) || !!(L.frame && L.frame.type && L.frame.type !== 'none');
  function modelCard(m) {
    const w = document.createElement('div');
    w.className = 'mc';
    w.dataset.id = m.id;
    const fmtL = (FORMATS.find(x => x.id === (m.look.format || 'auto')) || FORMATS[0]).label;
    w.innerHTML = '<button type="button" class="mc-apply"><span class="mc-art"><span class="sk"></span></span><span class="mc-name"></span><span class="mc-note"></span><span class="mc-tags"><span></span><span></span></span></button><div class="mc-acts"><button type="button" data-a="ex">Avec l’exemple</button></div>';
    const ap = w.querySelector('.mc-apply');
    ap.setAttribute('aria-label', 'Appliquer le modèle ' + m.name + ' à votre phrase');
    w.querySelector('.mc-name').textContent = m.name;
    w.querySelector('.mc-note').textContent = m.note || '';
    const tags = w.querySelectorAll('.mc-tags span');
    tags[0].textContent = fontLabel(m.look.font); tags[1].textContent = fmtL;
    ap.addEventListener('click', () => applyModel(m, false));
    w.querySelector('[data-a=ex]').addEventListener('click', () => applyModel(m, true));
    if (m.user) {
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'danger'; del.textContent = 'Supprimer';
      del.addEventListener('click', () => confirmClick(del, 'Confirmer ?', () => removeUserModel(m.id)));
      w.querySelector('.mc-acts').appendChild(del);
      if (m.refUrl) { const img = document.createElement('img'); img.className = 'mc-ref'; img.src = m.refUrl; img.alt = 'Image d’origine'; w.appendChild(img); }
    }
    w._m = m; w._dirty = true;
    if (mio) mio.observe(w); else queueModel(w);
    return w;
  }
  // bouton à deux temps (suppression)
  function confirmClick(btn, label, fn) {
    if (btn.dataset.armed) { delete btn.dataset.armed; fn(); return; }
    const old = btn.textContent;
    btn.dataset.armed = '1'; btn.textContent = label;
    setTimeout(() => { if (btn.isConnected && btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = old; } }, 3000);
  }
  function buildModelFilters() {
    const box = $('#mdFilters');
    box.innerHTML = '';
    for (const [id, label] of MTHEMES) {
      const n = id === 'all' ? allModels().length : allModels().filter(m => m.theme === id).length;
      if (id === 'mine' && !n) continue;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = id;
      b.innerHTML = esc(label) + ' <span class="n">' + n + '</span>';
      b.addEventListener('click', () => { S.mdTheme = id; syncSeg(box, id); renderModels(true); saveSoon(); });
      box.appendChild(b);
    }
    if (S.mdTheme === 'mine' && !userModels.length) S.mdTheme = 'all';
    syncSeg(box, S.mdTheme);
    $('#modelCount').textContent = allModels().length;
  }
  let builtTheme = null;
  function renderModels(force) {
    if (S.gtab !== 'models') return;
    if (curVars.length && varKey !== [S.text, S.tkLevel].join('|')) drawVariations();
    const g = $('#mgrid');
    const t = MTHEMES.find(x => x[0] === S.mdTheme) || MTHEMES[0];
    $('#mdNote').textContent = t[2];
    if (force || builtTheme !== S.mdTheme || !g.children.length) {
      builtTheme = S.mdTheme;
      g.innerHTML = '';
      g.appendChild(importModelCard());
      for (const m of allModels()) if (S.mdTheme === 'all' || m.theme === S.mdTheme) g.appendChild(modelCard(m));
      mdKey = modelsKey();
      return;
    }
    const k = modelsKey();
    if (k !== mdKey) {
      mdKey = k;
      for (const c of $$('.mc', g)) { if (!c._m) continue; c._dirty = true; if (!mio || c._vis) queueModel(c); }
    }
  }
  const modelsKey = () => [S.mdSrc, S.mdSrc === 'mine' ? S.text : '', S.tkLevel].join('|');
  let mdT = 0;
  function renderModelsSoon() { clearTimeout(mdT); mdT = setTimeout(() => renderModels(false), 250); }
  function importModelCard() {
    const l = document.createElement('label');
    l.className = 'mc mc-import';
    l.innerHTML = '<input type="file" accept="image/png,image/jpeg,image/webp" class="sr"><span class="plus" aria-hidden="true">+</span><strong>Imiter un tableau</strong><span>Importez la photo d’un tableau qui vous plaît : l’atelier reconnaît son écriture, ses couleurs et sa composition, et vous propose un modèle qui s’en approche.</span>';
    l.querySelector('input').addEventListener('change', ev => { const file = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (file) startImitate(file); });
    return l;
  }
  async function saveUserModel(m, refBlob) {
    const rec = { id: m.id, name: m.name, note: m.note, ex: m.ex, look: m.look, date: Date.now(), ref: refBlob || null };
    try { await IDB.put('models', rec); } catch (e) { status('Ce navigateur ne peut pas enregistrer le modèle.', true); return false; }
    addUserModel(rec);
    buildModelFilters();
    renderModels(true);
    return true;
  }
  function addUserModel(rec) {
    const old = userModels.find(x => x.id === rec.id);
    if (old && old.refUrl) URL.revokeObjectURL(old.refUrl);
    userModels = userModels.filter(x => x.id !== rec.id);
    userModels.unshift({ id: rec.id, theme: 'mine', user: true, name: String(rec.name || 'Mon modèle').slice(0, 80), note: String(rec.note || '').slice(0, 300), ex: String(rec.ex || '').slice(0, 600), look: rec.look || {}, refUrl: rec.ref instanceof Blob ? URL.createObjectURL(rec.ref) : null });
  }
  async function removeUserModel(id) {
    await IDB.del('models', id);
    const m = userModels.find(x => x.id === id);
    if (m && m.refUrl) URL.revokeObjectURL(m.refUrl);
    userModels = userModels.filter(x => x.id !== id);
    buildModelFilters(); renderModels(true);
    status('Modèle supprimé.');
  }
  function buildModels() {
    $('#variBtn').addEventListener('click', showVariations);
    seg($('#mdSrc'), [['mine', 'Votre phrase'], ['ex', 'L’exemple de chaque modèle']], () => S.mdSrc, v => { S.mdSrc = v; saveSoon(); renderModels(false); }, true);
    $('#saveModelBtn').addEventListener('click', async () => {
      const f = currentFont();
      const n = userModels.length + 1;
      const ok = await saveUserModel({ id: 'u' + Date.now(), name: 'Mon modèle ' + n, note: 'Vos réglages : ' + (f ? f.name : '') + ', ' + (SHAPES.find(x => x.id === S.shape.type) || SHAPES[0]).name.toLowerCase() + '.', ex: S.text, look: currentLook() });
      if (ok) { S.mdTheme = 'mine'; buildModelFilters(); renderModels(true); status('Style enregistré dans « Mes modèles » : appliquez-le à n’importe quelle phrase.'); }
    });
    buildModelFilters();
    IDB.all('models').then(recs => {
      for (const r of (recs || []).sort((a, b) => (a.date || 0) - (b.date || 0))) addUserModel(r);
      buildModelFilters();
      if (S.gtab === 'models') renderModels(true);
    });
  }

  // ------------------------------------------------------------------ imiter un tableau (image de référence)
  const imDlg = $('#imitate');
  let im = null; // { file, url, img, sendBlob, thumbBlob, look, text, name, note, ctl }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  const toHex = c => '#' + c.map(v => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')).join('');
  // couleurs dominantes (k-moyennes) : fond = couleur des bords, encre = couleur la plus contrastée
  function imagePalette(img) {
    const N = 72, k = N / Math.max(img.naturalWidth, img.naturalHeight);
    const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data, px = [], border = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 128) continue;
      const p = [d[i], d[i + 1], d[i + 2]];
      px.push(p);
      if (x < 3 || y < 3 || x >= w - 3 || y >= h - 3) border.push(p);
    }
    if (!px.length) return null;
    const K5 = 5, cent = [];
    for (let c = 0; c < K5; c++) cent.push(px[Math.floor((c + 0.5) / K5 * px.length)].slice());
    let lab = new Array(px.length).fill(0);
    for (let it = 0; it < 12; it++) {
      const sum = cent.map(() => [0, 0, 0, 0]);
      px.forEach((p, i) => {
        let best = 0, bd = Infinity;
        cent.forEach((c, j) => { const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (dd < bd) { bd = dd; best = j; } });
        lab[i] = best; const s = sum[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
      });
      sum.forEach((s, j) => { if (s[3]) cent[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    }
    const count = cent.map(() => 0);
    lab.forEach(j => count[j]++);
    const near = p => { let best = 0, bd = Infinity; cent.forEach((c, j) => { const dd = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (dd < bd) { bd = dd; best = j; } }); return best; };
    const bcount = cent.map(() => 0);
    border.forEach(p => bcount[near(p)]++);
    const bgI = bcount.indexOf(Math.max.apply(null, bcount));
    const bgHex = toHex(cent[bgI]);
    let inkI = -1, best = -1;
    cent.forEach((c, j) => {
      if (j === bgI || count[j] < px.length * 0.02) return;
      const cr = (Math.max(lum(toHex(c)), lum(bgHex)) + 0.05) / (Math.min(lum(toHex(c)), lum(bgHex)) + 0.05);
      const score = cr * Math.sqrt(count[j]);
      if (score > best) { best = score; inkI = j; }
    });
    const inkHex = inkI >= 0 ? toHex(cent[inkI]) : (lum(bgHex) > 0.4 ? '#1b1712' : '#ffffff');
    const [hh, ss, ll] = rgb2hsl.apply(null, cent[inkI >= 0 ? inkI : bgI]);
    const gold = inkI >= 0 && hh >= 30 && hh <= 58 && ss > 0.3 && ll > 0.3 && ll < 0.8;
    return { bg: bgHex, ink: inkHex, gold };
  }
  function scaledJpeg(img, max, q) {
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(img.naturalWidth * k)); cv.height = Math.max(1, Math.round(img.naturalHeight * k));
    const ctx = cv.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    return toBlob(cv, 'image/jpeg', q || 0.88);
  }
  const SCRIPT_FONT = { thuluth: 'layla-thuluth', diwani: 'layla-diwani', naskh: 'amiri', ruqaa: 'aref-ruqaa', kufi: 'reem-kufi', maghribi: 'bouazzi-maghribi', nastaliq: 'gulzar', soudani: 'ruwudu', decorative: 'lalezar', modern: 'cairo' };
  const SCRIPT_FR = { thuluth: 'Thuluth', diwani: 'Diwani', naskh: 'Naskh', ruqaa: 'Ruqʿa', kufi: 'Kufi', maghribi: 'Maghribi', nastaliq: 'Nastaʿlīq', soudani: 'Soudani', decorative: 'Décoratif', modern: 'Moderne' };
  // réponse de Claude → apparence de l'atelier (chaque valeur est vérifiée)
  function lookFromAnalysis(a, pal) {
    const str = v => typeof v === 'string' ? v : '';
    const hexes = arr => (Array.isArray(arr) ? arr : []).map(normHex).filter(Boolean).slice(0, 6);
    const script = Object.keys(SCRIPT_FONT).includes(str(a.script)) ? a.script : null;
    let font = fontById(str(a.styleId)) ? a.styleId : (script ? SCRIPT_FONT[script] : S.fontId);
    const inkC = hexes(a.ink && a.ink.colors), bgC = hexes(a.background && a.background.colors);
    const look = { font };
    look.fill = inkC.length >= 2 && a.ink.gradient ? LIN(inkC) : SOL(inkC[0] || (pal && pal.ink) || '#1b1712');
    const bt = str(a.background && a.background.type);
    look.bg = bt === 'none' ? NONE : bt === 'gradient' && bgC.length >= 2 ? LIN(bgC.slice(0, 4)) : SOL(bgC[0] || (pal && pal.bg) || '#ffffff');
    const shape = SHAPES.some(x => x.id === a.shape) ? a.shape : 'straight';
    look.shape = { type: shape === 'free' ? 'straight' : shape, repeat: REPEATS.some(r => r[0] === a.repeat) ? a.repeat : 'none' };
    if (shape === 'circle') Object.assign(look.shape, { cover: 92, ring: 'single' });
    const fr = FRAMES.some(f => f[0] === a.frame) ? a.frame : 'none';
    if (fr !== 'none') { look.frame = { type: fr, width: 1.6, pad: 18 }; const fc = normHex(a.frameColor); if (fc) Object.assign(look.frame, { ink: false, color: fc }); }
    const pt = PATTERNS.some(p => p[0] === a.pattern) ? a.pattern : 'none';
    if (pt !== 'none') look.pattern = { type: pt, color: paintAvg(look.fill), opacity: 0.14, scale: 10 };
    const e = a.effects || {}, avg = paintAvg(look.fill);
    look.fx = {};
    if (e.glow === true) look.fx.glow = { on: true, color: avg, size: 12, strength: 0.75 };
    if (e.relief === true) look.fx.extrude = { on: true, angle: 45, depth: 6, color: KX.mix(avg, '#000000', 0.45), shade: true };
    if (e.outline === true) look.fx.outline = { on: true, color: lum(avg) > 0.5 ? '#111111' : '#ffffff', gap: 1, width: 5 };
    if (e.hollow === true) look.fx.hollow = { on: true, width: 3 };
    if (e.coloredMarks === true) look.fx.marks = { on: true, color: '#b3261e' };
    if (e.coloredDots === true) look.fx.dots = { on: true, color: '#b3261e' };
    if (e.shadow === true) look.shadow = { on: true, color: '#000000', opacity: 0.4, dist: 4, blur: 8 };
    look.format = FORMATS.some(f => f.id === a.format && f.id !== 'custom') ? a.format : 'auto';
    const text = str(a.text).replace(/\r/g, '').trim().slice(0, 600);
    return { look, script, text: /[؀-ۿ]/.test(text) ? text : '', name: str(a.name).slice(0, 60), note: str(a.description).slice(0, 300) };
  }
  function lookFromPalette(pal) {
    return { font: S.fontId, fill: pal.gold ? LIN(GOLD2) : SOL(pal.ink), bg: SOL(pal.bg), shape: { type: 'straight' }, format: 'auto' };
  }
  function imSetBusy(on) {
    $('#imStop').hidden = !on;
    $('#imApply').disabled = on || !im || !im.look;
    $('#imSave').disabled = on || !im || !im.look;
    $('#imRetry').hidden = on || !im || !im.canAsk;
  }
  async function imRenderPreview() {
    const box = $('#imPrev');
    if (!im || !im.look) { box.hidden = true; return; }
    const m = { look: im.look, ex: im.text || S.text, name: im.name };
    const f = fontById(im.look.font);
    try {
      await ensureFont(f, true);
      if (fxLookNeedsClipper(im.look)) await ensureClipper();
      const sc = modelScene(m, S.text.trim() ? S.text : (im.text || 'الخط العربي'));
      box.innerHTML = sc && !sc.empty ? KX.sceneToSVG(sc, { inline: true, idPrefix: 'im' + (++mdSeq) }) : '';
      box.hidden = false;
    } catch (e) { box.hidden = true; }
    const facts = $('#imFacts');
    const sw = c => '<span class="swc" style="background:' + c + '"></span>';
    const fill = im.look.fill, bg = im.look.bg;
    const fillHTML = fill.type === 'solid' ? sw(fill.color) + fill.color.toUpperCase() : fill.stops.map(s => sw(s.c)).join('') + ' dégradé';
    const bgHTML = bg.type === 'none' ? 'transparent' : bg.type === 'solid' ? sw(bg.color) + bg.color.toUpperCase() : bg.stops.map(s => sw(s.c)).join('') + ' dégradé';
    let html = '';
    if (im.script) html += '<dt>Écriture</dt><dd>' + esc(SCRIPT_FR[im.script] || im.script) + '</dd>';
    html += '<dt>Style proposé</dt><dd>' + esc(fontLabel(im.look.font)) + '</dd>';
    html += '<dt>Encre</dt><dd>' + fillHTML + '</dd><dt>Fond</dt><dd>' + bgHTML + '</dd>';
    const shp = SHAPES.find(x => x.id === im.look.shape.type);
    html += '<dt>Composition</dt><dd>' + esc((shp ? shp.name : 'Droite') + (im.look.shape.repeat !== 'none' ? ', ' + (REPEATS.find(r => r[0] === im.look.shape.repeat) || [, ''])[1].toLowerCase() : '')) + '</dd>';
    if (im.look.frame) html += '<dt>Cadre</dt><dd>' + esc((FRAMES.find(f => f[0] === im.look.frame.type) || [, ''])[1]) + '</dd>';
    if (im.text) html += '<dt>Texte lu</dt><dd lang="ar" dir="rtl">' + esc(im.text).replace(/\n/g, '<br>') + '</dd>';
    facts.innerHTML = html; facts.hidden = false;
  }
  function analysisPrompt() {
    const cat = FONTS.map(f => f.id + ' | ' + (famOf(f).fr || f.fam) + ' | ' + f.name + ' | ' + (f.note || '')).join('\n');
    return 'You are an expert in Arabic calligraphy and graphic design. The image shows a work of Arabic calligraphy chosen by the user. Describe its STYLE so that a design tool can imitate it with its own fonts; do not try to copy the artwork itself.\n' +
      'Reply with ONLY one JSON object with exactly these keys:\n' +
      '{"name": "short French name for this style, 2 to 4 words", "description": "one or two sentences in French describing the style: script, colours, composition", ' +
      '"script": one of ["thuluth","naskh","diwani","ruqaa","kufi","maghribi","nastaliq","soudani","decorative","modern"], ' +
      '"styleId": "the id of the closest style in the catalogue below: match the script first, then the stroke weight and the mood", ' +
      '"text": "the Arabic text written in the image, exactly as written, with \\n between lines; empty string if not legible", ' +
      '"shape": one of ' + JSON.stringify(SHAPES.filter(x => x.id !== 'free').map(x => x.id)) + ', ' +
      '"repeat": one of ["none","mirror","rosette"], ' +
      '"ink": {"colors": ["#rrggbb", 1 to 4 colours of the letters], "gradient": true or false}, ' +
      '"background": {"type": "none" or "solid" or "gradient", "colors": ["#rrggbb", ...]}, ' +
      '"frame": one of ' + JSON.stringify(FRAMES.map(f => f[0])) + ', "frameColor": "#rrggbb or empty string", ' +
      '"pattern": one of ' + JSON.stringify(PATTERNS.map(p => p[0])) + ', ' +
      '"effects": {"shadow": bool, "glow": bool, "relief": bool, "outline": bool, "hollow": bool, "coloredMarks": bool, "coloredDots": bool}, ' +
      '"format": one of ["auto","square","portrait","landscape","story","banner"]}\n\n' +
      'Catalogue of styles (id | family | name | description):\n' + cat;
  }
  async function startImitate(file) {
    if (file.size > 25e6) return status('Cette image dépasse 25 Mo.', true);
    if (im && im.url) URL.revokeObjectURL(im.url);
    if (im && im.ctl) im.ctl.abort();
    const url = URL.createObjectURL(file), img = new Image();
    try { await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; }); }
    catch (e) { URL.revokeObjectURL(url); return status('Cette image n’a pas pu être lue.', true); }
    im = { file, url, img, look: null, text: '', name: '', note: '', script: null, canAsk: false };
    $('#imRef').src = url;
    $('#imPrev').hidden = true; $('#imFacts').hidden = true; $('#imApplyText').hidden = true;
    openDialog(imDlg);
    const st = $('#imStatus');
    st.textContent = 'Analyse des couleurs…';
    try {
      im.thumbBlob = await scaledJpeg(img, 360, 0.82);
      im.sendBlob = await scaledJpeg(img, 1600, 0.88);
      const pal = imagePalette(img);
      im.pal = pal;
      if (pal) { im.look = lookFromPalette(pal); im.name = 'D’après votre image'; im.note = 'Couleurs relevées sur votre image.'; }
    } catch (e) { console.warn(e); }
    await imRenderPreview();
    // l'analyse par Claude n'est proposée que si cette vue peut lui envoyer une image
    const sample = await sampleP;
    const lim = sample && typeof sample.limits === 'function' ? await sample.limits().catch(() => null) : null;
    im.canAsk = !!(lim && lim.images);
    if (!im.canAsk) {
      st.textContent = 'Couleurs relevées sur votre image. La reconnaissance de l’écriture et de la composition par Claude n’est pas disponible dans cette vue.';
      imSetBusy(false);
      return;
    }
    await imAnalyze();
  }
  async function imAnalyze() {
    const sample = await sampleP;
    if (!im || !sample || !im.canAsk) return;
    const st = $('#imStatus'), cur = im;
    cur.ctl = new AbortController();
    imSetBusy(true);
    st.textContent = 'Claude examine l’écriture, les couleurs et la composition… (quelques secondes à une minute)';
    try {
      const a = await sample.json(analysisPrompt(), { images: [cur.sendBlob || cur.file], signal: cur.ctl.signal, modelTier: 'default' });
      if (im !== cur) return;
      if (!a || typeof a !== 'object') throw { code: 'invalid_json' };
      const r = lookFromAnalysis(a, cur.pal);
      Object.assign(cur, { look: r.look, text: r.text, name: r.name || 'D’après votre image', note: r.note || '', script: r.script });
      st.textContent = (r.note ? r.note + ' ' : '') + 'Voici le style que l’atelier vous propose.';
      $('#imApplyText').hidden = !r.text;
      await imRenderPreview();
    } catch (e) {
      if (im !== cur) return;
      const c = e && e.code;
      if (c === 'cancelled') st.textContent = 'Analyse arrêtée. Les couleurs relevées restent proposées.';
      else if (c === 'not_granted' || c === 'sampling_disabled' || c === 'images_unavailable' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') { st.textContent = 'L’analyse par Claude n’est pas autorisée ici : seules les couleurs de votre image sont reprises.'; cur.canAsk = false; }
      else if (c === 'rate_limited') st.textContent = 'Trop de demandes pour le moment : réessayez dans un instant. Les couleurs relevées restent proposées.';
      else if (c === 'session_expired') st.textContent = 'Votre session Claude a expiré : reconnectez-vous puis relancez l’analyse. Les couleurs relevées restent proposées.';
      else if (c === 'refused') st.textContent = 'Cette image n’a pas pu être analysée par Claude. Les couleurs relevées restent proposées.';
      else if (c === 'image_rejected') st.textContent = 'Cette image n’a pas pu être analysée (format ou taille). Les couleurs relevées restent proposées.';
      else st.textContent = 'L’analyse a échoué (' + (c || 'erreur') + '). Les couleurs relevées restent proposées ; vous pouvez relancer.';
    } finally {
      if (im === cur) { cur.ctl = null; imSetBusy(false); }
    }
  }
  function buildImitate() {
    $('#imApply').addEventListener('click', () => { if (!im || !im.look) return; applyModel({ name: im.name || 'D’après votre image', look: im.look, ex: im.text }, false); closeDialog(imDlg); });
    $('#imApplyText').addEventListener('click', () => { if (!im || !im.look) return; applyModel({ name: im.name || 'D’après votre image', look: im.look, ex: im.text }, true); closeDialog(imDlg); });
    $('#imSave').addEventListener('click', async () => {
      if (!im || !im.look) return;
      const ok = await saveUserModel({ id: 'u' + Date.now(), name: im.name || 'D’après votre image', note: im.note || 'Style imité d’après votre image.', ex: im.text || S.text, look: im.look }, im.thumbBlob);
      if (ok) { S.mdTheme = 'mine'; buildModelFilters(); showToolRef('modeles'); renderModels(true); status('Modèle enregistré dans « Mes modèles ».'); closeDialog(imDlg); }
    });
    $('#imRetry').addEventListener('click', imAnalyze);
    $('#imStop').addEventListener('click', () => { if (im && im.ctl) im.ctl.abort(); });
    $('#imClose').addEventListener('click', () => closeDialog(imDlg));
    imDlg.addEventListener('close', () => { if (im && im.ctl) im.ctl.abort(); });
  }
