  // ------------------------------------------------------------------ stockage local (polices importées, créations, modèles)
  const IDB = {
    p: null,
    open() {
      if (this.p) return this.p;
      this.p = new Promise((res, rej) => {
        if (!window.indexedDB) return rej(new Error('IndexedDB absent'));
        const r = indexedDB.open('khattat', 2);
        r.onupgradeneeded = () => {
          const db = r.result;
          for (const s of ['fonts', 'designs', 'models']) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id' });
        };
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
        r.onblocked = () => rej(new Error('base bloquée'));
      });
      this.p.catch(() => { this.p = null; });
      return this.p;
    },
    async run(store, mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const tx = db.transaction(store, mode), st = tx.objectStore(store);
        const q = fn(st);
        tx.oncomplete = () => res(q && q.result);
        tx.onerror = () => rej(tx.error);
        tx.onabort = () => rej(tx.error || new Error('transaction annulée'));
      });
    },
    all(store) { return this.run(store, 'readonly', st => st.getAll()).catch(() => []); },
    put(store, rec) { return this.run(store, 'readwrite', st => st.put(rec)); },
    del(store, id) { return this.run(store, 'readwrite', st => st.delete(id)).catch(() => null); }
  };

  // ------------------------------------------------------------------ galerie des styles
  const grid = $('#grid');
  const famOf = f => FAMILIES.find(x => x.id === f.fam) || {};
  const isFav = id => S.favs.includes(id);
  function matchesQuery(f, q) {
    if (!q) return true;
    const fm = famOf(f);
    const hay = fold([f.name, f.note, fm.fr || '', fm.id].join(' ')) + ' ' + (fm.ar || '');
    return q.split(/\s+/).filter(Boolean).every(w => hay.includes(w));
  }
  let query = '';
  function styleVisible(f) {
    const id = S.filter;
    const famOk = id === 'all' || (id === 'fav' ? isFav(f.id) : f.fam === id);
    return famOk && matchesQuery(f, query);
  }
  function buildFilters() {
    const box = $('#filters');
    box.innerHTML = '';
    for (const fm of FAMILIES) {
      const n = fm.id === 'all' ? FONTS.length : fm.id === 'fav' ? S.favs.filter(fontById).length : FONTS.filter(f => f.fam === fm.id).length;
      if ((fm.id === 'mine') && !n) continue;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.fam = fm.id;
      b.innerHTML = esc(fm.fr) + (fm.ar ? ' <span lang="ar">' + fm.ar + '</span>' : '') + ' <span class="n">' + n + '</span>';
      b.setAttribute('aria-pressed', String(S.filter === fm.id));
      b.addEventListener('click', () => setFilter(fm.id));
      box.appendChild(b);
    }
    $('#styleCount').textContent = FONTS.length;
  }
  function setFilter(id) {
    if (!FAMILIES.some(f => f.id === id)) id = 'all';
    S.filter = id;
    $$('#filters .chip').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.fam === id)));
    applyGridFilter();
    const fm = FAMILIES.find(f => f.id === id) || FAMILIES[0];
    $('#famNote').textContent = fm.note;
    saveSoon();
  }
  function applyGridFilter() {
    let shown = 0;
    for (const f of FONTS) if (f.wrap) { const v = styleVisible(f); f.wrap.hidden = !v; if (v) shown++; }
    const imp = $('#importCard');
    if (imp) imp.hidden = !((S.filter === 'all' || S.filter === 'mine') && !query);
    $('#gridEmpty').hidden = shown > 0 || (S.filter === 'fav' && !query);
    if (S.filter === 'fav' && !S.favs.some(fontById)) $('#famNote').textContent = 'Aucun favori pour l’instant : touchez l’étoile ☆ d’une carte pour l’ajouter ici.';
    updateBatchLabels();
  }
  // les cartes se chargent et se redessinent quand elles approchent de l'écran
  const io = lazyObserver(entries => {
    for (const e of entries) {
      const f = fontById(e.target.dataset.id);
      if (!f) continue;
      f.visible = e.isIntersecting;
      if (!e.isIntersecting) continue;
      if (f.state === 'ready') { if (f.dirty) renderCard(f); }
      else ensureFont(f).catch(() => {});
    }
  }, '700px');

  function makeCard(f) {
    const w = document.createElement('div');
    w.className = 'cw'; w.dataset.id = f.id;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'card'; b.dataset.id = f.id;
    const fm = famOf(f);
    b.setAttribute('aria-pressed', String(S.fontId === f.id));
    b.setAttribute('aria-label', f.name + ', ' + (fm.fr || '') + (f.note ? ', ' + f.note : ''));
    b.innerHTML = '<span class="card-art"><span class="sk"></span></span>' +
      '<span class="card-meta"><span class="card-name">' + esc(f.name) + '</span><span class="card-fam" lang="ar">' + (fm.ar || '') + '</span></span>' +
      '<span class="card-note">' + esc(f.note || '') + '</span><span class="card-tick" aria-hidden="true">✓</span><span class="card-warn" aria-hidden="true">lettres manquantes</span>';
    b.addEventListener('click', () => selectFont(f.id));
    const fav = document.createElement('button');
    fav.type = 'button'; fav.className = 'fav';
    fav.addEventListener('click', e => { e.stopPropagation(); toggleFav(f.id); });
    w.append(b, fav);
    f.el = b; f.favEl = fav; f.wrap = w;
    syncFav(f);
    return w;
  }
  function syncFav(f) {
    if (!f.favEl) return;
    const on = isFav(f.id);
    f.favEl.textContent = on ? '★' : '☆';
    f.favEl.setAttribute('aria-pressed', String(on));
    f.favEl.setAttribute('aria-label', (on ? 'Retirer ' : 'Ajouter ') + f.name + (on ? ' des favoris' : ' aux favoris'));
    f.favEl.title = on ? 'Retirer des favoris' : 'Ajouter aux favoris';
  }
  function toggleFav(id) {
    const i = S.favs.indexOf(id);
    if (i >= 0) S.favs.splice(i, 1); else S.favs.push(id);
    const f = fontById(id);
    if (f) syncFav(f);
    buildFilters(); setFilter(S.filter);
    saveSoon();
  }
  function buildGrid() {
    grid.innerHTML = '';
    for (const f of FONTS) {
      grid.appendChild(makeCard(f));
      if (io) io.observe(f.wrap); else ensureFont(f).catch(() => {});
    }
    const imp = document.createElement('label');
    imp.className = 'card card-import'; imp.id = 'importCard';
    imp.innerHTML = '<input type="file" id="fontFile" accept=".ttf,.otf,font/ttf,font/otf,application/font-sfnt" class="sr"><span class="plus" aria-hidden="true">+</span><strong>Importer une police</strong><span>Thuluth, Diwani, Maghribi… votre fichier .ttf ou .otf</span>';
    grid.appendChild(imp);
    $('#fontFile').addEventListener('change', onFontFile);
    setFilter(S.filter);
    for (const f of FONTS) renderCard(f);
  }
  // aperçus en couleurs : encre et fond de la création appliqués aux cartes
  function cardPaint(prefix) {
    const p = S.fill;
    if (p.type === 'solid') return { defs: '', fill: p.color };
    const st = KX.gradStops(p).map(x => '<stop offset="' + (+x.p).toFixed(3) + '" stop-color="' + x.c + '"/>').join('');
    if (p.type === 'radial') return { defs: '<radialGradient id="' + prefix + '" cx=".5" cy=".5" r=".6">' + st + '</radialGradient>', fill: 'url(#' + prefix + ')' };
    const a = ((+p.angle || 0) % 360) * Math.PI / 180, dx = Math.cos(a) / 2, dy = Math.sin(a) / 2;
    return { defs: '<linearGradient id="' + prefix + '" x1="' + (0.5 - dx).toFixed(3) + '" y1="' + (0.5 - dy).toFixed(3) + '" x2="' + (0.5 + dx).toFixed(3) + '" y2="' + (0.5 + dy).toFixed(3) + '">' + st + '</linearGradient>', fill: 'url(#' + prefix + ')' };
  }
  function cardBg() {
    const b = S.bg;
    if (b.type === 'solid') return b.color;
    if (b.type === 'linear' || b.type === 'radial') return cssGrad(b);
    return '';
  }
  let cardSeq = 0;
  function renderCard(f) {
    const card = f.el;
    if (!card) return;
    const art = card.querySelector('.card-art');
    if (f.state === 'error') {
      art.innerHTML = '<span class="card-err">Échec du chargement. Touchez pour réessayer.</span>';
      return;
    }
    if (f.state !== 'ready') { if (!art.querySelector('.sk')) art.innerHTML = '<span class="sk"></span>'; return; }
    f.dirty = false;
    const hb = hbFor(f, false);
    const chk = K.checkSupport(hb, textFor(hb) || ' ');
    const r = K.buildText(hb, chk.text.trim() ? chk.text : ' ', { size: 64, lineHeight: 1.05, align: 'center', color: S.colorFont });
    card.classList.toggle('missing', chk.missing.length > 0);
    card.title = chk.missing.length ? 'Caractères absents de cette police : ' + chk.missing.join(' ') : '';
    if (!r.cmds.length) { art.innerHTML = ''; return; }
    const colored = S.cardColors;
    art.classList.toggle('colored', colored);
    art.style.background = colored ? cardBg() : '';
    const pid = 'cg' + (++cardSeq);
    const paint = colored ? cardPaint(pid) : { defs: '', fill: 'currentColor' };
    // calques d'une police en couleur : groupés par couleur
    const groups = new Map();
    for (const s of r.spans) {
      const key = s.color || '';
      if (!groups.has(key)) groups.set(key, []);
      const g = groups.get(key);
      for (let i = s.i0; i < s.i1; i++) g.push(r.cmds[i]);
    }
    let paths = '';
    for (const [c, cmds] of groups) paths += '<path d="' + K.toSVGPath(cmds, 1) + '" fill="' + (c || paint.fill) + '"/>';
    const b = r.bbox, p = Math.max(2, b.h * 0.04);
    art.innerHTML = '<svg viewBox="' + [b.x - p, b.y - p, b.w + 2 * p, b.h + 2 * p].map(v => v.toFixed(1)).join(' ') +
      '" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">' + (paint.defs ? '<defs>' + paint.defs + '</defs>' : '') + paths + '</svg>';
  }
  function renderAllCards() {
    for (const f of FONTS) {
      if (f.state !== 'ready') continue;
      if (!io || f.visible) renderCard(f); else f.dirty = true;
    }
  }
  let cardsT = 0;
  function renderAllCardsSoon() { clearTimeout(cardsT); cardsT = setTimeout(renderAllCards, 160); }

  function selectFont(id, keepWeight) {
    const f = fontById(id);
    if (!f) return;
    if (f.state === 'error') f.state = 'idle';
    if (S.fontId !== id) { S.fontId = id; if (!keepWeight) S.wght = null; requestFit('overflow'); }
    syncCardSelection();
    ensureFont(f, true).then(() => { updateWeightUI(); scheduleBench(); }).catch(() => scheduleBench());
    updateWeightUI(); scheduleBench(); changed();
  }
  function syncCardSelection() { $$('#grid .card[data-id]').forEach(c => c.setAttribute('aria-pressed', String(c.dataset.id === S.fontId))); }
  const currentFont = () => fontById(S.fontId);

  // ------------------------------------------------------------------ polices importées
  function slug(s) { return String(s).normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').toLowerCase().slice(0, 40) || 'police'; }
  async function addUserFont(name, buf, persist) {
    await engineP;
    const sig = String.fromCharCode.apply(null, new Uint8Array(buf.slice(0, 4)));
    if (sig === 'wOFF' || sig === 'wOF2') throw new Error('Les polices WOFF ne sont pas lues ici. Utilisez la version .ttf ou .otf de la police.');
    let hb;
    try { hb = new K.Font(buf.slice(0)); } catch (e) { throw new Error('Ce fichier n’est pas une police lisible.'); }
    if (!hb.hasChar(0x0628) && !hb.hasChar(0x0627)) throw new Error('Cette police ne contient pas de lettres arabes.');
    const id = 'user-' + slug(name);
    let f = fontById(id);
    if (!f) {
      f = { id, file: null, name, fname: name, fam: 'mine', note: 'Police importée', user: true, state: 'ready', hb };
      FONTS.push(f);
      grid.insertBefore(makeCard(f), $('#importCard'));
      if (io) io.observe(f.wrap);
    } else { f.hb = hb; f.state = 'ready'; }
    if (persist) IDB.put('fonts', { id, name, buf }).catch(() => status('La police est ajoutée pour cette visite, mais ce navigateur ne peut pas l’enregistrer.', true));
    buildFilters();
    renderCard(f);
    return f;
  }
  async function onFontFile(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (file.size > 40e6) return status('Ce fichier dépasse 40 Mo.', true);
    try {
      const f = await addUserFont(file.name.replace(/\.(ttf|otf)$/i, ''), await file.arrayBuffer(), true);
      setFilter('mine'); selectFont(f.id);
      status('Police « ' + f.name + ' » ajoutée à la galerie.');
    } catch (e) { status(e.message, true); }
  }
  async function removeUserFont(id) {
    const i = FONTS.findIndex(f => f.id === id);
    if (i < 0) return;
    const f = FONTS[i];
    if (f.wrap) f.wrap.remove();
    FONTS.splice(i, 1);
    IDB.del('fonts', id);
    buildFilters();
    if (S.fontId === id) selectFont(DEFAULT.fontId);
    if (S.filter === 'mine' && !FONTS.some(x => x.fam === 'mine')) setFilter('all'); else setFilter(S.filter);
  }
