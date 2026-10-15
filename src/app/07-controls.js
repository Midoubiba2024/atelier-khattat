  // ------------------------------------------------------------------ contrôles : composants
  // REG : fonctions de synchronisation des contrôles avec l'état (annuler, ouvrir une création, appliquer un modèle)
  const REG = [];
  const reg = fn => { REG.push(fn); return fn; };
  function changed() { scheduleBench(); saveSoon(); record(); syncTabDots(); }
  function seg(el, items, get, set, noReg) {
    el.innerHTML = '';
    for (const [val, label] of items) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label; b.dataset.v = String(val);
      b.addEventListener('click', () => { set(val); syncSeg(el, get()); });
      el.appendChild(b);
    }
    syncSeg(el, get());
    if (!noReg) reg(() => syncSeg(el, get()));
  }
  function syncSeg(el, v) { $$('button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v)))); }
  function syncSw(el, v) { $$('button', el).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === String(v).toLowerCase()))); }
  // dégradé CSS pour les aperçus (barre, pastilles, ambiances). cssDeg : angle CSS imposé (90 = de gauche à droite)
  function cssGrad(pt, cssDeg) {
    const s = KX.gradStops(pt).map(x => x.c + ' ' + +(x.p * 100).toFixed(2) + '%').join(',');
    if (pt.type === 'radial' && cssDeg == null) return 'radial-gradient(' + s + ')';
    return 'linear-gradient(' + (cssDeg != null ? cssDeg : (+pt.angle || 0) + 90) + 'deg,' + s + ')';
  }
  const lum = hex => { const c = KX.hex2rgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const stopsKey = st => st.map(x => x.c.toLowerCase() + '@' + (+x.p).toFixed(3)).join(',');
  const isGradT = t => t === 'linear' || t === 'radial';
  const paintAvg = p => (isGradT(p.type) ? KX.sampleStops(KX.gradStops(p), 0.5) : p.color || '#000000');

  // Nuancier (32 couleurs) + sélecteur libre + code hexadécimal
  function colorPicker(root, get, set, label) {
    root.classList.add('cpick');
    root.innerHTML = '<div class="pal" role="group" aria-label="' + esc(label) + ' : nuancier"></div>' +
      '<div class="cp-row"><input type="color" aria-label="' + esc(label) + ' : choisir une couleur libre"><input type="text" class="hex" maxlength="7" spellcheck="false" autocomplete="off" aria-label="' + esc(label) + ' : code hexadécimal"><span class="hint">ou un code comme #C9A227</span></div>';
    const pal = root.querySelector('.pal'), inp = root.querySelector('input[type=color]'), hex = root.querySelector('.hex');
    for (const [c, name] of PALETTE) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.style.background = c; b.title = name; b.setAttribute('aria-label', name); b.dataset.v = c.toLowerCase();
      b.addEventListener('click', () => { set(c.toLowerCase()); sync(); });
      pal.appendChild(b);
    }
    inp.addEventListener('input', () => { set(inp.value.toLowerCase()); sync(); });
    const apply = () => { const v = normHex(hex.value); if (v) set(v); hex.classList.toggle('bad', !v); sync(true); };
    hex.addEventListener('change', apply);
    hex.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    hex.addEventListener('input', () => { if (/^#?[0-9a-f]{6}$/i.test(hex.value.trim())) { hex.classList.remove('bad'); set(normHex(hex.value)); sync(); } });
    hex.addEventListener('blur', () => sync(true));
    function sync(force) {
      const v = normHex(get()) || '#000000';
      if (inp.value.toLowerCase() !== v) inp.value = v;
      if (force || document.activeElement !== hex) hex.value = v.toUpperCase();
      syncSw(pal, v);
    }
    sync(true);
    return { sync };
  }
  // petit sélecteur : quelques pastilles + couleur libre
  function miniColor(root, get, set, label) {
    root.classList.add('msw');
    root.innerHTML = '';
    for (const c of MINI) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sw'; b.style.background = c; b.dataset.v = c; b.setAttribute('aria-label', label + ' ' + c);
      b.addEventListener('click', () => { set(c); sync(); changed(); });
      root.appendChild(b);
    }
    const inp = document.createElement('input');
    inp.type = 'color'; inp.setAttribute('aria-label', label + ' : couleur libre');
    inp.addEventListener('input', () => { set(inp.value.toLowerCase()); sync(); changed(); });
    root.appendChild(inp);
    function sync() { const v = normHex(get()) || '#000000'; inp.value = v; syncSw(root, v); }
    sync();
    reg(sync);
    return { sync };
  }

  // Éditeur de dégradé : modèles, barre avec pastilles déplaçables (2 à 8 couleurs), couleur de la pastille choisie,
  // type linéaire ou circulaire, direction
  const MAXSTOPS = 8;
  function gradEditor(root, getP, presets, what, onChange) {
    root.innerHTML =
      '<div class="sws gpre" role="group" aria-label="Dégradés prêts à l’emploi pour ' + esc(what) + '"></div>' +
      '<div class="gbar-wrap"><div class="gbar" role="group" aria-label="Couleurs du dégradé : cliquez sur la barre pour en ajouter une, faites glisser une pastille pour la déplacer"></div></div>' +
      '<div class="gtools2"><span class="gsel" aria-live="polite"></span><span class="gbtns">' +
      '<button type="button" class="mini add" data-a="add">+ Couleur</button><button type="button" class="mini" data-a="del">Retirer</button><button type="button" class="mini rev" data-a="rev">Inverser</button></span></div>' +
      '<div class="gpick"></div>' +
      '<div class="row"><span class="lbl">Type</span><div class="ctl"><div class="seg gkind" role="group" aria-label="Type de dégradé"></div></div></div>' +
      '<div class="row grow-angle"><span class="lbl">Direction</span><div class="ctl"><input type="range" min="0" max="355" step="5" aria-label="Direction du dégradé"><span class="garrow" aria-hidden="true">→</span><span class="val"></span></div></div>' +
      '<p class="hint">Cliquez sur la barre pour ajouter une couleur, faites glisser les pastilles pour régler les transitions. Deux pastilles au même endroit donnent une séparation nette.</p>';
    const pre = root.querySelector('.gpre'), bar = root.querySelector('.gbar'), selLbl = root.querySelector('.gsel');
    const kind = root.querySelector('.gkind'), ang = root.querySelector('input[type=range]'), arrow = root.querySelector('.garrow'), angVal = root.querySelector('.val'), angRow = root.querySelector('.grow-angle');
    const bAdd = root.querySelector('[data-a=add]'), bDel = root.querySelector('[data-a=del]'), bRev = root.querySelector('[data-a=rev]');
    let sel = 0, handles = [], drag = null;
    const P = () => getP(), stops = () => P().stops;
    const r3 = v => Math.round(Math.min(1, Math.max(0, v)) * 1000) / 1000;
    function reorder(st) { const a = stops(); a.sort((x, y) => x.p - y.p); sel = Math.max(0, a.indexOf(st)); }
    function emit() { onChange(); }
    for (const [name, cols, type] of presets) {
      const b = document.createElement('button'), st = stopsOf(cols);
      b.type = 'button'; b.className = 'gp'; b.textContent = name; b.title = name + (type === 'radial' ? ' (circulaire)' : '');
      b.dataset.v = stopsKey(st) + (type ? '|' + type : '');
      b.style.background = cssGrad({ type: 'linear', stops: st }, 90);
      if (lum(KX.sampleStops(st, 0.5)) < 0.18) b.classList.add('dark');
      b.addEventListener('click', () => {
        const p = P();
        p.stops = clone(st);
        if (type) { p.type = type; p.gk = type; }
        sel = 0; sync(); emit();
      });
      pre.appendChild(b);
    }
    function buildHandles() {
      bar.innerHTML = '';
      handles = stops().map((s, i) => {
        const h = document.createElement('button');
        h.type = 'button'; h.className = 'gstop'; h.dataset.i = i;
        h.addEventListener('keydown', e => onKey(e, i));
        bar.appendChild(h);
        return h;
      });
    }
    function placeHandles() {
      const a = stops();
      if (handles.length !== a.length) buildHandles();
      a.forEach((s, i) => {
        const h = handles[i];
        h.style.left = (s.p * 100) + '%'; h.style.background = s.c;
        h.setAttribute('aria-pressed', String(i === sel));
        h.setAttribute('aria-label', 'Couleur ' + (i + 1) + ' sur ' + a.length + ', position ' + Math.round(s.p * 100) + ' %');
      });
      bar.style.background = cssGrad({ type: 'linear', stops: a }, 90);
      const s = a[sel];
      selLbl.textContent = s ? 'Couleur ' + (sel + 1) + ' sur ' + a.length + ' · ' + Math.round(s.p * 100) + ' %' : '';
      bAdd.disabled = a.length >= MAXSTOPS; bDel.disabled = a.length <= 2;
    }
    function onKey(e, i) {
      const a = stops(), s = a[i];
      if (!s) return;
      let p = s.p;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') p -= e.shiftKey ? 0.1 : 0.01;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') p += e.shiftKey ? 0.1 : 0.01;
      else if (e.key === 'Home') p = 0;
      else if (e.key === 'End') p = 1;
      else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); sel = i; remove(); if (handles[sel]) handles[sel].focus(); return; }
      else return;
      e.preventDefault();
      s.p = r3(p); reorder(s); sync(); emit();
      if (handles[sel]) handles[sel].focus();
    }
    function remove() {
      const a = stops();
      if (a.length <= 2) return;
      a.splice(sel, 1); sel = Math.min(sel, a.length - 1); sync(); emit();
    }
    bar.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const r = bar.getBoundingClientRect(), a = stops();
      const h = e.target.closest('.gstop');
      let st;
      if (h) st = a[+h.dataset.i];
      else {
        if (a.length >= MAXSTOPS) { selLbl.textContent = MAXSTOPS + ' couleurs au maximum'; return; }
        const p = r3((e.clientX - r.left) / r.width);
        st = { c: KX.sampleStops(KX.gradStops({ stops: a }), p), p };
        a.push(st);
        emit();
      }
      if (!st) return;
      reorder(st);
      drag = { st };
      bar.classList.add('dragging');
      try { bar.setPointerCapture(e.pointerId); } catch (err) { /* sans capture : le glissement s'arrête hors de la barre */ }
      e.preventDefault();
      sync();
      if (handles[sel]) handles[sel].focus({ preventScroll: true });
    });
    bar.addEventListener('pointermove', e => {
      if (!drag) return;
      const r = bar.getBoundingClientRect();
      drag.st.p = r3((e.clientX - r.left) / r.width);
      reorder(drag.st); placeHandles(); emit();
    });
    const endDrag = () => { if (!drag) return; drag = null; bar.classList.remove('dragging'); sync(); };
    bar.addEventListener('pointerup', endDrag);
    bar.addEventListener('pointercancel', endDrag);
    bar.addEventListener('lostpointercapture', endDrag);
    bAdd.addEventListener('click', () => {
      const a = stops();
      if (a.length >= MAXSTOPS) return;
      const pts = [0].concat(a.map(s => s.p), [1]);
      let best = 0, at = 0.5;
      for (let i = 0; i < pts.length - 1; i++) if (pts[i + 1] - pts[i] > best) { best = pts[i + 1] - pts[i]; at = (pts[i] + pts[i + 1]) / 2; }
      const st = { c: KX.sampleStops(KX.gradStops({ stops: a }), at), p: r3(at) };
      a.push(st); reorder(st); sync(); emit();
    });
    bDel.addEventListener('click', remove);
    bRev.addEventListener('click', () => {
      const a = stops();
      for (const s of a) s.p = r3(1 - s.p);
      a.reverse(); sel = a.length - 1 - sel; sync(); emit();
    });
    const pick = colorPicker(root.querySelector('.gpick'), () => (stops()[sel] || stops()[0]).c, c => { const s = stops()[sel]; if (s) { s.c = c; placeHandles(); syncPresets(); emit(); } }, 'Couleur choisie du dégradé');
    seg(kind, [['linear', 'Linéaire'], ['radial', 'Circulaire']], () => P().type, v => { P().type = v; P().gk = v; sync(); emit(); }, true);
    ang.addEventListener('input', () => { P().angle = +ang.value; syncAngle(); emit(); });
    function syncAngle() {
      const a = ((+P().angle % 360) + 360) % 360;
      ang.value = a; angVal.textContent = a + '°'; arrow.style.transform = 'rotate(' + a + 'deg)';
    }
    function syncPresets() {
      const k = stopsKey(stops());
      $$('button', pre).forEach(b => {
        const [key, type] = b.dataset.v.split('|');
        b.setAttribute('aria-pressed', String(key === k && (!type || type === P().type)));
      });
    }
    function sync() {
      const a = stops();
      if (sel >= a.length) sel = a.length - 1;
      if (sel < 0) sel = 0;
      placeHandles(); syncPresets(); pick.sync();
      syncSeg(kind, P().type);
      angRow.hidden = P().type === 'radial';
      syncAngle();
    }
    sync();
    return { sync };
  }
  function bindRange(id, get, set, fmt, valId) {
    const el = $('#' + id), out = valId ? $('#' + valId) : null;
    const sync = () => { el.value = get(); if (out) out.textContent = fmt(get()); };
    sync();
    el.addEventListener('input', () => { set(parseFloat(el.value)); if (out) out.textContent = fmt(get()); changed(); });
    reg(sync);
    return el;
  }
  function bindColor(id, get, set, after) {
    const el = $('#' + id);
    const sync = () => { el.value = get(); };
    sync();
    el.addEventListener('input', () => { set(el.value.toLowerCase()); if (after) after(); changed(); });
    reg(sync);
    return el;
  }
  function bindCheck(id, get, set, after) {
    const el = $('#' + id);
    const sync = () => { el.checked = !!get(); };
    sync();
    el.addEventListener('change', () => { set(el.checked); if (after) after(); changed(); });
    reg(sync);
    return el;
  }
  // icône d'une boucle (cadre) dans un carré 24 × 24
  function loopIcon(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let i = 0; i < pts.length; i += 2) { x0 = Math.min(x0, pts[i]); x1 = Math.max(x1, pts[i]); y0 = Math.min(y0, pts[i + 1]); y1 = Math.max(y1, pts[i + 1]); }
    const k = 19 / Math.max(x1 - x0, y1 - y0), ox = 12 - (x0 + x1) / 2 * k, oy = 12 - (y0 + y1) / 2 * k;
    let d = '';
    for (let i = 0; i < pts.length; i += 2) d += (i ? 'L' : 'M') + (ox + pts[i] * k).toFixed(1) + ' ' + (oy + pts[i + 1] * k).toFixed(1);
    return ICON('<path d="' + d + 'Z"/>');
  }

  // ------------------------------------------------------------------ formes
  let drawing = null;
  let showTabRef = null, showToolRef = null;
  const thumbEls = {}, compEls = {};
  let shapeGroup = (SHAPES.find(x => x.id === S.shape.type) || SHAPES[0]).g;
  function buildShapeThumbs() {
    const gr = $('#shapeGroups');
    gr.innerHTML = '';
    for (const [id, label] of SHAPE_GROUPS) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.v = id; b.textContent = label;
      b.addEventListener('click', () => { shapeGroup = id; syncShapeGroup(); });
      gr.appendChild(b);
    }
    const g = $('#shapeThumbs');
    g.innerHTML = '';
    for (const d of SHAPES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sthumb'; b.dataset.v = d.id; b.dataset.g = d.g;
      b.setAttribute('aria-label', 'Forme : ' + d.name);
      b.innerHTML = '<span class="art"><span class="sk"></span></span>' + esc(d.name);
      b.addEventListener('click', () => {
        stopDraw();
        // réglages de départ propres à la forme (le médaillon a besoin de son cercle…)
        if (d.id !== S.shape.type && d.init) d.init(S.shape);
        if (d.id !== S.shape.type) { requestFit('always'); if (d.id === 'hilye') readableInk('#F1DFA8'); }
        S.shape.type = d.id;
        syncSeg(g, d.id); buildShapeParams();
        if (d.id !== 'straight' && showTabRef) showTabRef('forme');
        changed();
      });
      thumbEls[d.id] = b;
      g.appendChild(b);
    }
    const c = $('#compThumbs');
    for (const [id, label] of REPEATS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sthumb'; b.dataset.v = id;
      b.setAttribute('aria-label', 'Composition : ' + label);
      b.innerHTML = '<span class="art"><span class="sk"></span></span>' + esc(label);
      b.addEventListener('click', () => { if (S.shape.repeat !== id) requestFit('always'); S.shape.repeat = id; syncSeg(c, id); buildCompParams(); if (id !== 'none' && showTabRef) showTabRef('forme'); changed(); });
      compEls[id] = b;
      c.appendChild(b);
    }
    reg(() => {
      const d = SHAPES.find(x => x.id === S.shape.type) || SHAPES[0];
      shapeGroup = d.g; syncShapeGroup();
      syncSeg(g, S.shape.type); syncSeg(c, S.shape.repeat);
    });
    syncShapeGroup();
    syncSeg(g, S.shape.type); syncSeg(c, S.shape.repeat);
  }
  function syncShapeGroup() {
    syncSeg($('#shapeGroups'), shapeGroup);
    for (const d of SHAPES) if (thumbEls[d.id]) thumbEls[d.id].hidden = d.g !== shapeGroup;
  }
  // aperçus de la phrase dans chaque forme (première ligne, 40 caractères au plus ; le sceau garde 3 lignes)
  let thumbKey = '';
  function thumbSVG(cmds) {
    if (!cmds.length) return '';
    const b = K.pathBBox(cmds), p = Math.max(1, Math.max(b.w, b.h) * 0.04);
    return '<svg viewBox="' + [b.x - p, b.y - p, b.w + 2 * p, b.h + 2 * p].map(v => v.toFixed(1)).join(' ') + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><path d="' + K.toSVGPath(cmds, 1) + '"/></svg>';
  }
  function renderShapeThumbs() {
    const f = currentFont();
    if (!f || f.state !== 'ready') return;
    const hb = benchHB(f);
    const lines = textFor(hb).split('\n').map(l => l.trim()).filter(Boolean);
    let txt = lines[0] || 'الخط العربي';
    if (txt.length > 40) txt = txt.slice(0, 40);
    const multi = lines.slice(0, 3).map(l => l.slice(0, 30)).join('\n') || txt;
    const chk = K.checkSupport(hb, txt), chkM = K.checkSupport(hb, multi);
    const key = [f.id, S.wght, chk.text, chkM.text, JSON.stringify(Object.assign({}, S.shape, { rotate: 0 }))].join('|');
    if (key === thumbKey) return;
    thumbKey = key;
    const one = K.buildText(hb, chk.text, { size: 40, lineHeight: 1.05, align: 'center' });
    const many = K.buildText(hb, chkM.text, { size: 40, lineHeight: 1.05, align: 'center' });
    // compositions : une phrase d'une seule ligne est répartie (forme remplie) ou découpée en mots (anneaux, mosaïque)
    const words = chk.text.split(/\s+/).filter(Boolean).slice(0, 7);
    const multiText = lines.length > 1 ? chkM.text : words.length > 1 ? words.join('\n') : chk.text;
    const fillText = lines.length > 1 ? chkM.text : KX.wrapForShape(hb, chk.text, { size: 40, shape: Object.assign({}, S.shape, { type: 'fill', wrap: 'auto' }) });
    const ringText = lines.length > 1 ? chkM.text : KX.wrapForShape(hb, chk.text, { size: 40, shape: { type: 'rings' } });
    const wingText = lines.length > 1 ? chkM.text : KX.wrapForShape(hb, chk.text, { size: 40, shape: { type: 'wings' } });
    const B = t => K.buildText(hb, t, { size: 40, lineHeight: 1.05, align: 'center' });
    const multiB = B(multiText);
    const compo = { fill: B(fillText), rings: B(ringText), tiles: multiB, wings: B(wingText), hilye: multiB };
    const shapeOf = (t, type) => {
      if (!t.cmds.length) return [];
      if (type === 'straight' && S.shape.width === 100) return t.cmds;
      const r = KSH.applyShape(t.cmds, Object.assign({}, S.shape, { type, rotate: 0 }), 40, t.baseline, t.spans, t);
      let out = r.cmds.concat(r.rings);
      if (r.lineRings) for (const v of r.lineRings.values()) out = out.concat(v);
      return out;
    };
    const thumbSrc = id => compo[id] || (id === 'seal' && lines.length > 1 ? many : one);
    for (const d of SHAPES) {
      const art = thumbEls[d.id] && thumbEls[d.id].querySelector('.art');
      if (art) art.innerHTML = thumbSVG(shapeOf(thumbSrc(d.id), d.id));
    }
    // compositions avec la forme courante
    const base = shapeOf(thumbSrc(S.shape.type), S.shape.type);
    for (const [id] of REPEATS) {
      const art = compEls[id] && compEls[id].querySelector('.art');
      if (!art) continue;
      const parts = id === 'none' ? [base] : KSH.compose([base], Object.assign({}, S.shape, { repeat: id }));
      art.innerHTML = thumbSVG(parts[0]);
    }
  }
  function paramRows(box, params, obj, rebuild) {
    for (const p of params) {
      const key = p[0], label = p[1];
      const row = document.createElement('div');
      row.className = 'row';
      if (Array.isArray(p[2])) {
        row.innerHTML = '<span class="lbl" id="lbl-sh-' + key + '">' + esc(label) + '</span><div class="ctl"><div class="seg" role="group" aria-labelledby="lbl-sh-' + key + '"></div></div>';
        box.appendChild(row);
        seg(row.querySelector('.seg'), p[2], () => obj()[key], v => { obj()[key] = v; rebuild(); requestFit('overflow'); changed(); }, true);
      } else {
        const min = p[2], max = p[3], step = p[4], unit = p[5], cond = p[6], show = p[7];
        if (cond && !cond(obj())) continue;
        row.innerHTML = '<label for="sh-' + key + '">' + esc(label) + '</label><div class="ctl"><input type="range" id="sh-' + key + '" min="' + min + '" max="' + max + '" step="' + step + '"><span class="val"></span></div>';
        box.appendChild(row);
        const r = row.querySelector('input'), v = row.querySelector('.val');
        const fmt = x => show ? show(x) : (step < 1 ? nf1.format(x) : nf0.format(x)) + unit;
        const cur = Math.min(max, Math.max(min, +obj()[key]));
        r.value = cur; v.textContent = fmt(cur);
        r.addEventListener('input', () => { obj()[key] = +r.value; v.textContent = fmt(obj()[key]); changed(); });
        r.addEventListener('change', () => { requestFit('overflow'); scheduleBench(); });
      }
    }
  }
  function buildShapeParams() {
    const box = $('#shapeParams');
    box.innerHTML = '';
    const d = SHAPES.find(x => x.id === S.shape.type) || SHAPES[0];
    $('#shapeTitle').textContent = d.id === 'straight' ? 'Écriture droite : choisissez une forme ci-dessus, ou réglez ici la largeur, l’inclinaison et la composition.' : 'Réglages de la forme : ' + d.name;
    paramRows(box, d.params, () => S.shape, buildShapeParams);
    // anneaux et mosaïque : la composition (miroir, rosace…) ne s'applique pas
    $('#compThumbs').hidden = ['rings', 'tiles', 'tughra', 'wings', 'hilye'].includes(d.id);
    $('#compParams').hidden = $('#compThumbs').hidden;
    if (d.id === 'free') {
      const wrap = document.createElement('div');
      wrap.className = 'tp-inner';
      wrap.innerHTML = '<div class="btnrow"><button class="chip" type="button" id="drawBtn">Dessiner le tracé</button><button class="chip" type="button" id="flipBtn">Retourner le texte</button><button class="chip" type="button" id="resetFreeBtn">Courbe par défaut</button></div>' +
        '<p class="hint">Tracez dans l’aperçu, à la souris ou au doigt, la ligne que le texte doit suivre : vague, boucle, signature… Le texte occupe toute la longueur du tracé.</p>';
      box.appendChild(wrap);
      $('#drawBtn').addEventListener('click', startDraw);
      $('#flipBtn').addEventListener('click', () => { S.shape.flip = !S.shape.flip; changed(); });
      $('#resetFreeBtn').addEventListener('click', () => { S.shape.free = null; S.shape.flip = false; changed(); });
    }
    if (d.hint) { const h = document.createElement('p'); h.className = 'hint'; h.textContent = d.hint; box.appendChild(h); }
  }
  function buildCompParams() {
    const box = $('#compParams');
    box.innerHTML = '';
    const rep = S.shape.repeat;
    if (rep === 'mirror') paramRows(box, [['mgap', 'Écart du miroir', -20, 60, 1, ' %']], () => S.shape, buildCompParams);
    else if (rep === 'rosette') paramRows(box, [['copies', 'Copies', 2, 16, 1, ''], ['spread', 'Écartement', 40, 250, 5, ' %']], () => S.shape, buildCompParams);
    else if (rep === 'kaleido') paramRows(box, [['copies', 'Copies', 4, 16, 2, ''], ['spread', 'Écartement', 40, 250, 5, ' %']], () => S.shape, buildCompParams);
  }
  function updateShapeHint(sc) {
    const h = $('#shapeHint'), t = S.shape.type, info = sc.shapeInfo || {};
    let msg = 'Largeur : resserre ou étale les lettres sans changer leur hauteur.';
    if ((t === 'circle' || t === 'oval' || t === 'heart' || t === 'polygon' || t === 'seal') && info.coverage != null) {
      msg = 'Le texte couvre ' + Math.round(Math.min(1, info.coverage) * 100) + ' % du contour.';
      if (info.clamped) msg += ' Texte court : augmentez la largeur des lettres pour en couvrir davantage.';
    } else if ((t === 'arc' || t === 'arcInv') && info.clamped) {
      msg = 'Courbure limitée à ' + Math.round(info.angle) + '° pour garder les lettres lisibles. Augmentez la largeur pour courber davantage.';
    } else if (t === 'spiral') msg = 'La phrase part du bord extérieur et s’enroule vers le centre.';
    else if (t === 'fill') msg = 'La phrase remplit la forme' + (info.rows ? ' en ' + info.rows + ' ligne' + (info.rows > 1 ? 's' : '') : '') + ' : chaque ligne prend la largeur disponible à sa hauteur.';
    else if (t === 'rings') msg = 'Médaillon : la 1re ligne au centre, les suivantes en anneaux.' + (info.coverage != null && info.coverage < 0.98 ? ' Un anneau ne fait pas tout le tour : choisissez « Complétés » ou allongez sa ligne.' : '');
    else if (t === 'tughra') msg = 'Tughra : les hampes du nom s’élancent ; réglez leur hauteur.';
    else if (t === 'wings') msg = 'Médaillon et ailes : la 1re ligne au centre, la 2e à droite, la 3e à gauche.';
    else if (t === 'hilye') msg = 'Panneau hilye : ' + (info.compartments || 8) + ' compartiments, une ligne de texte chacun.';
    else if (t === 'tiles') msg = 'Mosaïque de ' + (info.tiles || 0) + ' tuile' + ((info.tiles || 0) > 1 ? 's' : '') + ' : une par ligne, ou une par paragraphe si vous séparez par une ligne vide.';
    if (S.shape.repeat === 'mirror') msg += ' Miroir : la phrase est doublée par son reflet (musanna).';
    else if (S.shape.repeat === 'rosette') msg += ' Rosace : la phrase est répétée autour d’un centre.';
    else if (S.shape.repeat === 'kaleido') msg += ' Kaléidoscope : la phrase rayonne depuis le centre, une copie sur deux en miroir.';
    h.textContent = msg;
  }
  function startDraw() {
    if (drawing || !lastScene) return;
    zoomer.fit();
    const pad = document.createElement('canvas'), tip = document.createElement('div');
    pad.className = 'drawpad'; tip.className = 'drawtip';
    tip.innerHTML = '<span>Tracez la ligne que suivra le texte.</span><button type="button">Annuler</button>';
    pv.append(pad, tip);
    try { pv.scrollIntoView({ block: 'nearest', behavior: 'auto' }); } catch (e) { pv.scrollIntoView(); }
    const dpr = window.devicePixelRatio || 1, r0 = pv.getBoundingClientRect();
    pad.width = Math.max(1, Math.round(r0.width * dpr)); pad.height = Math.max(1, Math.round(r0.height * dpr));
    const g = pad.getContext('2d');
    g.scale(dpr, dpr); g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--bench-gold').trim() || '#E3C06A';
    const pts = [];
    let down = false;
    const pos = e => { const r = pad.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    pad.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation(); down = true;
      try { pad.setPointerCapture(e.pointerId); } catch (err) { /* capture non disponible */ }
      pts.length = 0; const p = pos(e); pts.push(p[0], p[1]);
      g.clearRect(0, 0, pad.width, pad.height); g.beginPath(); g.moveTo(p[0], p[1]);
    });
    pad.addEventListener('pointermove', e => {
      if (!down) return;
      const p = pos(e), n = pts.length;
      if (Math.hypot(p[0] - pts[n - 2], p[1] - pts[n - 1]) < 2) return;
      pts.push(p[0], p[1]); g.lineTo(p[0], p[1]); g.stroke();
    });
    const finish = () => {
      if (!down) return;
      down = false;
      let len = 0;
      for (let i = 2; i < pts.length; i += 2) len += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
      const norm = len > 40 ? KSH.normalizeFree(pts) : null;
      if (!norm) { status('Tracé trop court : tracez une ligne plus longue.', true); g.clearRect(0, 0, pad.width, pad.height); return; }
      S.shape.free = norm; S.shape.flip = false;
      stopDraw(); changed();
      status('Tracé enregistré : le texte le suit maintenant.');
    };
    pad.addEventListener('pointerup', finish);
    pad.addEventListener('pointercancel', () => { down = false; });
    tip.querySelector('button').addEventListener('click', () => { stopDraw(); scheduleBench(); });
    drawing = { pad, tip };
  }
  function stopDraw() {
    if (!drawing) return;
    drawing.pad.remove(); drawing.tip.remove();
    drawing = null;
  }

  // ------------------------------------------------------------------ effets
  function buildFx() {
    bindRange('fxWeight', () => S.fx.weight, v => { S.fx.weight = v; }, v => (v > 0 ? '+' : '') + nf2.format(v) + ' %', 'fxWeightVal');
    const list = $('#fxList');
    list.innerHTML = '';
    for (const item of FX_UI) {
      const o = () => S.fx[item.k];
      const box = document.createElement('div');
      box.className = 'fxitem';
      box.innerHTML = '<div class="fxhead"><label class="check"><input type="checkbox"> ' + esc(item.label) + '</label><span class="hint">' + esc(item.note) + '</span></div><div class="sub-ctl"></div>';
      list.appendChild(box);
      const cb = box.querySelector('input'), sub = box.querySelector('.sub-ctl');
      cb.addEventListener('change', () => { o().on = cb.checked; sub.hidden = !cb.checked; if (cb.checked) ensureClipper().then(scheduleBench); changed(); });
      for (const fdef of item.fields) {
        const [key, label] = fdef;
        const row = document.createElement('div');
        row.className = 'row';
        if (fdef[2] === 'color') {
          row.innerHTML = '<span class="lbl">' + esc(label) + '</span><div class="ctl"></div>';
          sub.appendChild(row);
          miniColor(row.querySelector('.ctl'), () => o()[key], v => { o()[key] = v; }, item.label + ' : ' + label);
        } else if (fdef[2] === 'check') {
          row.innerHTML = '<span class="lbl"></span><div class="ctl"><label class="check"><input type="checkbox"> ' + esc(label) + '</label></div>';
          sub.appendChild(row);
          const c2 = row.querySelector('input');
          const sync = () => { c2.checked = !!o()[key]; };
          c2.addEventListener('change', () => { o()[key] = c2.checked; changed(); });
          sync(); reg(sync);
        } else {
          const [, , min, max, step, unit] = fdef;
          row.innerHTML = '<label>' + esc(label) + '</label><div class="ctl"><input type="range" min="' + min + '" max="' + max + '" step="' + step + '" aria-label="' + esc(item.label + ' : ' + label) + '"><span class="val"></span></div>';
          sub.appendChild(row);
          const r = row.querySelector('input'), v = row.querySelector('.val');
          const fmt = x => (step < 1 ? nf2.format(x) : nf0.format(x)) + unit;
          const sync = () => { r.value = o()[key]; v.textContent = fmt(o()[key]); };
          r.addEventListener('input', () => { o()[key] = +r.value; v.textContent = fmt(o()[key]); changed(); });
          sync(); reg(sync);
        }
      }
      const sync = () => { cb.checked = !!o().on; sub.hidden = !o().on; };
      sync(); reg(sync);
    }
    reg(syncFxWait);
  }
  const fxNeedsClipper = () => S.fx.weight !== 0 || S.fx.hollow.on || S.fx.outline.on || S.fx.extrude.on;
  function syncFxWait() { $('#fxWait').hidden = !(fxNeedsClipper() && !window.ClipperLib); }
  function syncTabDots() {
    const fx = S.fx;
    $('#fxDot').hidden = !(fx.weight !== 0 || ['hollow', 'outline', 'extrude', 'glow', 'scatter', 'counters', 'marks', 'dots'].some(k => fx[k].on));
    $('#frDot').hidden = S.frame.type === 'none';
  }

  // ------------------------------------------------------------------ cadre
  function buildFrameUI() {
    const box = $('#frameThumbs');
    box.innerHTML = '';
    for (const [id, label] of FRAMES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sthumb'; b.dataset.v = id;
      b.setAttribute('aria-label', 'Cadre : ' + label);
      let icon = ICON('<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>');
      if (id !== 'none') { const u = ORN.unitShape(id, 1.45); if (u) icon = loopIcon(u); }
      b.innerHTML = '<span class="ico">' + icon + '</span>' + esc(label);
      b.addEventListener('click', () => {
        S.frame.type = id; syncFrameUI();
        if (id !== 'none') ensureClipper().then(scheduleBench);
        changed();
      });
      box.appendChild(b);
    }
    bindRange('frW', () => S.frame.width, v => { S.frame.width = v; }, v => nf1.format(v) + ' %', 'frWVal');
    bindRange('frPad', () => S.frame.pad, v => { S.frame.pad = v; }, v => nf0.format(v) + ' %', 'frPadVal');
    bindCheck('frDouble', () => S.frame.double, v => { S.frame.double = v; });
    bindCheck('frDash', () => S.frame.dash, v => { S.frame.dash = v; });
    seg($('#frInk'), [[true, 'Comme l’encre'], [false, 'Autre']], () => S.frame.ink, v => { S.frame.ink = v; syncFrameUI(); changed(); });
    bindColor('frColor', () => S.frame.color, v => { S.frame.color = v; S.frame.ink = false; syncFrameUI(); });
    bindCheck('frPanelOn', () => S.frame.panelOn, v => { S.frame.panelOn = v; }, syncFrameUI);
    bindColor('frPanel', () => S.frame.panel, v => { S.frame.panel = v; S.frame.panelOn = true; syncFrameUI(); });
    seg($('#frFit'), [['text', 'Autour du texte'], ['page', 'Bord du format']], () => S.frame.fit, v => { S.frame.fit = v; syncFrameUI(); changed(); });
    reg(syncFrameUI);
    syncFrameUI();
  }
  function syncFrameUI() {
    syncSeg($('#frameThumbs'), S.frame.type);
    const on = S.frame.type !== 'none';
    $('#frameCtl').hidden = !on;
    syncSeg($('#frInk'), S.frame.ink);
    $('#frColor').value = S.frame.color;
    $('#frPanelOn').checked = S.frame.panelOn;
    $('#frPanel').value = S.frame.panel;
    const auto = S.format.id === 'auto';
    $$('#frFit button').forEach(b => { b.disabled = auto && b.dataset.v === 'page'; });
    syncSeg($('#frFit'), auto ? 'text' : S.frame.fit);
    $('#frHint').textContent = auto ? 'Choisissez un format fixe (onglet Format) pour placer le cadre au bord de l’image.' : '';
  }

  // ------------------------------------------------------------------ fond et motif
  function buildPatternUI() {
    const box = $('#patThumbs');
    box.innerHTML = '';
    for (const [id, label] of PATTERNS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'sthumb'; b.dataset.v = id;
      b.setAttribute('aria-label', 'Motif : ' + label);
      let icon = ICON('<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>');
      if (id !== 'none') {
        const P = ORN.pattern(id, 40, 40, 13);
        if (P) icon = '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false" style="overflow:hidden"><path d="' + K.toSVGPath(P.cmds, 1) + '"' + (P.fill ? ' fill="currentColor" stroke="none"' : ' fill="none" stroke="currentColor" stroke-width="1.4"') + '/></svg>';
      }
      b.innerHTML = '<span class="ico">' + icon + '</span>' + esc(label);
      b.addEventListener('click', () => { S.pattern.type = id; syncPatternUI(); changed(); });
      box.appendChild(b);
    }
    bindColor('patColor', () => S.pattern.color, v => { S.pattern.color = v; });
    bindRange('patOp', () => S.pattern.opacity, v => { S.pattern.opacity = v; }, v => Math.round(v * 100) + ' %', 'patOpVal');
    bindRange('patScale', () => S.pattern.scale, v => { S.pattern.scale = v; }, v => v + ' %', 'patScaleVal');
    bindRange('patW', () => S.pattern.width, v => { S.pattern.width = v; }, v => v + ' %', 'patWVal');
    bindCheck('patColorful', () => S.pattern.colorful, v => { S.pattern.colorful = v; });
    const pt = $('#patText');
    pt.addEventListener('input', () => { S.pattern.text = pt.value.slice(0, 60); changed(); });
    reg(syncPatternUI);
    syncPatternUI();
  }
  function syncPatternUI() {
    syncSeg($('#patThumbs'), S.pattern.type);
    $('#patCtl').hidden = S.pattern.type === 'none';
    $('#patColorfulRow').hidden = S.pattern.type !== 'nuqat';
    $('#patTextRow').hidden = S.pattern.type !== 'words';
    $('#patColorful').checked = !!S.pattern.colorful;
    if ($('#patText').value !== S.pattern.text) $('#patText').value = S.pattern.text || '';
  }
  // couleur par ligne : une pastille par ligne du texte (8 au plus)
  let lineInkN = -1;
  function buildLineInkUI(force) {
    const n = Math.max(1, Math.min(8, S.text.split('\n').length));
    $('#lineInkOn').checked = S.lineInk.on;
    $('#lineInkCtl').hidden = !S.lineInk.on;
    if (n === lineInkN && !force) { $$('#lineInkList input').forEach((inp, i) => { inp.value = S.lineInk.colors[i]; }); return; }
    lineInkN = n;
    const box = $('#lineInkList');
    box.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const l = document.createElement('label');
      l.innerHTML = 'Ligne ' + (i + 1) + ' <input type="color">';
      const inp = l.querySelector('input');
      inp.value = S.lineInk.colors[i];
      inp.addEventListener('input', () => { S.lineInk.colors[i] = inp.value.toLowerCase(); changed(); });
      box.appendChild(l);
    }
  }

  // ------------------------------------------------------------------ écriture, couleurs, format
  function updateKashidaUI() {
    const f = currentFont(), ok = !(f && f.state === 'ready') || f.hb.kashidaOK;
    $$('#kashida button').forEach(b => { b.disabled = !ok && b.dataset.v !== '0'; });
    $('#kashidaHint').textContent = ok ? 'Kashida : allonge la liaison avant la dernière lettre de chaque mot' : 'Ce style ne s’étire pas : la kashida n’existe pas dans cette police.';
  }
  function updateWeightUI() {
    updateKashidaUI();
    const f = currentFont(), row = $('#rowWeight'), ctl = $('#weightCtl');
    const ready = f && f.state === 'ready' && f.hb;
    $('#rowColorFont').hidden = !(ready && f.hb.hasColorLayers);
    const ax = ready && f.hb.axes.find(a => a.tag === 'wght');
    ctl.innerHTML = '';
    if (ax && ax.max > ax.min) {
      row.hidden = false;
      const base = f.vars && f.vars.wght != null ? f.vars.wght : ax.def;
      const v = S.wght == null ? base : Math.min(ax.max, Math.max(ax.min, S.wght));
      ctl.innerHTML = '<input type="range" id="wght" min="' + ax.min + '" max="' + ax.max + '" step="10" aria-labelledby="lblWeight"><span class="val" id="wghtVal"></span>';
      const r = $('#wght'), o = $('#wghtVal');
      r.value = v; o.textContent = Math.round(v);
      r.addEventListener('input', () => { S.wght = +r.value; o.textContent = Math.round(S.wght); changed(); });
    } else row.hidden = true;
  }
  function syncSize() {
    $('#size').value = Math.min(480, S.size); $('#sizeNum').value = Math.round(S.size);
    $('#sizePt').textContent = nf0.format(S.size * 0.75) + ' pt';
  }
  function updateTextUI() {
    const multi = S.text.includes('\n');
    $('#rowAlign').hidden = !multi; $('#rowLh').hidden = !multi;
    const hm = hasMarks(S.text), cb = $('#harakat');
    cb.disabled = !hm; cb.checked = S.harakat;
    cb.parentElement.style.opacity = hm ? '1' : '.55';
    syncTkUI();
  }
  let inkPick = null, inkGrad = null, bgPick = null, bgGrad = null;
  function updateColorUI() {
    const g = isGradT(S.fill.type);
    $('#rowInkSolid').hidden = g; $('#rowInkGrad').hidden = !g;
    syncSeg($('#inkType'), g ? 'grad' : 'solid');
    if (inkPick) inkPick.sync();
    if (inkGrad) inkGrad.sync();
    $('#strokeOn').checked = S.stroke.on; $('#strokeCtl').hidden = !S.stroke.on;
    $('#strokeColor').value = S.stroke.color; $('#strokeW').value = S.stroke.width; $('#strokeWVal').textContent = S.stroke.width + ' px';
    $('#shadowOn').checked = S.shadow.on; $('#shadowCtl').hidden = !S.shadow.on;
    $('#shadowColor').value = S.shadow.color; $('#shadowOp').value = S.shadow.opacity; $('#shadowOpVal').textContent = Math.round(S.shadow.opacity * 100) + ' %';
    $('#shadowDist').value = S.shadow.dist; $('#shadowDistVal').textContent = S.shadow.dist + ' px';
    $('#shadowBlur').value = S.shadow.blur; $('#shadowBlurVal').textContent = S.shadow.blur + ' px';
  }
  function updateBgUI() {
    const t = S.bg.type, g = isGradT(t);
    syncSeg($('#bgType'), g ? 'grad' : t);
    $('#rowBgSolid').hidden = t !== 'solid'; $('#rowBgGrad').hidden = !g; $('#rowBgImg').hidden = t !== 'image';
    $('#bgHint').hidden = t !== 'none';
    if (bgPick) bgPick.sync();
    if (bgGrad) bgGrad.sync();
    $('#veil').value = S.bg.veil; $('#veilVal').textContent = Math.round(S.bg.veil * 100) + ' %';
    syncSeg($('#veilColor'), S.bg.veilColor);
    $('#bgFileName').textContent = bgImage ? bgImage.name + ' · ' + bgImage.img.naturalWidth + ' × ' + bgImage.img.naturalHeight + ' px' : 'Aucune image choisie. La photo remplit le format, recadrée au centre.';
  }
  function updateFormatUI() {
    const id = S.format.id;
    syncSeg($('#formats'), id);
    $('#rowMargin').hidden = id !== 'auto';
    $('#rowCustom').hidden = id !== 'custom';
    $('#rowFit').hidden = id === 'auto';
    $('#margin').value = S.format.margin; $('#marginVal').textContent = S.format.margin + ' px';
    $('#cw').value = Math.round(S.format.w); $('#ch').value = Math.round(S.format.h);
    const a4 = isA4();
    $('#physOn').disabled = a4; $('#physOn').checked = S.phys.on && !a4;
    $('#physVal').value = S.phys.value; $('#physVal').disabled = a4 || !S.phys.on;
    $$('#physUnit button').forEach(b => { b.disabled = a4 || !S.phys.on; });
    syncSeg($('#physUnit'), S.phys.unit);
    syncFrameUI();
  }
  // ------------------------------------------------------------------ légende en lettres latines
  function buildCaptionUI() {
    const C = () => S.caption;
    const sync = () => {
      $('#capOn').checked = C().on; $('#capCtl').hidden = !C().on;
      if (document.activeElement !== $('#capText')) $('#capText').value = C().text;
      $('#capUpper').checked = C().upper;
      $('#capColor').value = C().custom; $('#capColor').hidden = C().color !== 'custom';
    };
    $('#capOn').addEventListener('change', () => {
      C().on = $('#capOn').checked;
      // légende vide : le nom ou le sens du texte s'il vient de la bibliothèque
      if (C().on && !C().text.trim()) C().text = libraryMeaning(S.text) || '';
      sync(); requestFit('overflow'); changed();
      if (C().on && !C().text) $('#capText').focus();
    });
    $('#capText').addEventListener('input', () => { C().text = $('#capText').value.replace(/[\r\n]+/g, ' '); changed(); });
    $('#capText').addEventListener('change', () => { requestFit('overflow'); scheduleBench(); });
    seg($('#capFont'), [['serif', 'Classique'], ['sans', 'Moderne'], ['thin', 'Fine'], ['bold', 'Grasse']], () => C().font, v => { C().font = v; changed(); });
    seg($('#capPos'), [['below', 'Dessous'], ['above', 'Dessus']], () => C().pos, v => { C().pos = v; changed(); });
    $('#capUpper').addEventListener('change', () => { C().upper = $('#capUpper').checked; requestFit('overflow'); changed(); });
    bindRange('capSize', () => C().size, v => { C().size = v; }, v => v + ' %', 'capSizeVal').addEventListener('change', () => { requestFit('overflow'); scheduleBench(); });
    bindRange('capGap', () => C().gap, v => { C().gap = v; }, v => v + ' %', 'capGapVal').addEventListener('change', () => { requestFit('overflow'); scheduleBench(); });
    seg($('#capColorMode'), [['ink', 'Encre du texte'], ['custom', 'Autre couleur']], () => C().color, v => { C().color = v; sync(); changed(); });
    $('#capColor').addEventListener('input', () => { C().custom = $('#capColor').value; changed(); });
    reg(sync); sync();
  }
  // composition à compartiments clairs (hilye) : une encre trop claire (or, blanc) y serait illisible
  function readableInk(panel) {
    const a = lum(paintAvg(S.fill)), b = lum(panel), c = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    if (c >= 3) return;
    S.fill = Object.assign({}, S.fill, { type: 'solid', color: '#1B1712' });
    updateColorUI();
    status('Encre passée en brun foncé : elle reste lisible sur les compartiments clairs (onglet Couleurs pour la changer).');
  }
  function fitToFormat() {
    const f = currentFont();
    if (!f || f.state !== 'ready' || S.format.id === 'auto' || !prepared.trim()) return;
    const hb = benchHB(f);
    const st = sceneSettings();
    const chk = K.checkSupport(hb, textFor(hb));
    S.size = Math.min(2000, KX.fitSize(hb, chk.text, st, null, 0.84));
    syncSize(); changed();
  }
  // ambiance : encre, fond, ombre, contour, effets, cadre et motif d'un coup
  function applyMood(m) {
    S.fill = Object.assign({}, S.fill, clone(m.ink));
    S.bg = Object.assign({}, S.bg, clone(m.bg));
    if (isGradT(S.fill.type)) S.fill.gk = S.fill.type;
    if (isGradT(S.bg.type)) S.bg.gk = S.bg.type;
    S.shadow = m.shadow ? Object.assign({}, S.shadow, m.shadow, { on: true }) : Object.assign({}, S.shadow, { on: false });
    S.stroke = m.stroke ? Object.assign({}, S.stroke, m.stroke, { on: true }) : Object.assign({}, S.stroke, { on: false });
    S.fx = mergeDeep(FX_OFF, m.fx || {});
    S.frame = Object.assign(clone(DEFAULT.frame), m.frame || {});
    S.pattern = Object.assign(clone(DEFAULT.pattern), m.pattern || {});
    if (fxNeedsClipper() || S.frame.type !== 'none') ensureClipper().then(scheduleBench);
    syncAllUI(); changed();
  }

  // ------------------------------------------------------------------ synchronisation générale
  function syncAllUI() {
    if (txt.value !== S.text) txt.value = S.text;
    prepareText();
    updateTextUI(); syncSize(); updateWeightUI();
    for (const fn of REG) fn();
    buildShapeParams(); buildCompParams();
    updateColorUI(); updateBgUI(); updateFormatUI(); syncPatternUI(); syncFrameUI(); syncFxWait(); syncTabDots(); buildLineInkUI();
    syncCardSelection();
    renderAllCardsSoon();
    if (tkOpen()) buildTashkilPanel();
    syncPreviewBg();
    $('#dimsBtn').setAttribute('aria-pressed', String(S.dims));
    scheduleBench();
  }
  // après un changement d'état global (annuler, création ouverte, modèle appliqué)
  function afterStateChange() {
    syncAllUI();
    const f = currentFont() || fontById(DEFAULT.fontId);
    if (!currentFont()) S.fontId = f.id;
    ensureFont(f, true).then(() => { updateWeightUI(); scheduleBench(); }).catch(() => scheduleBench());
    if (fxNeedsClipper() || S.frame.type !== 'none') ensureClipper().then(scheduleBench);
    renderModelsSoon();
    saveSoon();
  }

  function buildControls() {
    // ambiances
    const moods = $('#moods');
    for (const m of MOODS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mood';
      const bg = m.bg.type === 'solid' ? m.bg.color : isGradT(m.bg.type) ? cssGrad(m.bg) : 'repeating-conic-gradient(var(--check-a) 0 25%,var(--check-b) 0 50%) 0 0/8px 8px';
      const ink = isGradT(m.ink.type) ? m.ink.stops[0].c : m.ink.color;
      b.innerHTML = '<span class="dot" style="background:' + bg + ';color:' + ink + '" aria-hidden="true">خ</span>' + esc(m.name);
      b.addEventListener('click', () => applyMood(m));
      moods.appendChild(b);
    }
    // outils : un seul panneau ouvert à la fois, l'aperçu reste visible
    const rail = $$('#rail .rt');
    const OLD_TABS = { ecr: 'texte', forme: 'forme', col: 'couleurs', fx: 'effets', cadre: 'cadre', bg: 'fond', fmt: 'format' };
    function showTool(id, focus) {
      if (!TOOLS.includes(id)) id = OLD_TABS[id] || 'texte';
      const changedTool = S.tool !== id;
      S.tool = id;
      for (const t of rail) {
        const on = t.id === 'tool-' + id;
        t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
        $('#' + t.getAttribute('aria-controls')).hidden = !on;
        if (on && focus) t.focus();
      }
      showGTab(id === 'modeles' ? 'models' : 'styles');
      if (changedTool) $('#panels').scrollTop = 0;
      saveSoon();
    }
    rail.forEach((t, i) => {
      t.addEventListener('click', () => showTool(t.id.slice(5)));
      t.addEventListener('keydown', e => {
        const k = e.key;
        let n = -1;
        if (k === 'ArrowDown' || k === 'ArrowRight') n = (i + 1) % rail.length;
        else if (k === 'ArrowUp' || k === 'ArrowLeft') n = (i + rail.length - 1) % rail.length;
        else if (k === 'Home') n = 0;
        else if (k === 'End') n = rail.length - 1;
        if (n < 0) return;
        e.preventDefault();
        showTool(rail[n].id.slice(5), true);
      });
    });
    showTabRef = showTool;
    showToolRef = showTool;
    // téléphone et tablette en portrait : l'aperçu se réduit quand on descend dans les réglages, et reprend
    // sa taille en haut du panneau (seuils écartés : pas de va-et-vient) ; seulement si le panneau est assez long
    const pnEl = $('#panels'), studioEl = $('#studio');
    let compactPv = false;
    const setCompact = c => { if (c !== compactPv) { compactPv = c; studioEl.classList.toggle('compact', c); } };
    pnEl.addEventListener('scroll', () => {
      if (!STACK_MQ.matches) return setCompact(false);
      const t = pnEl.scrollTop, room = pnEl.scrollHeight - pnEl.clientHeight;
      setCompact(compactPv ? t > 4 : t > 48 && room > 260);
    }, { passive: true });
    STACK_MQ.addEventListener('change', () => setCompact(false));
    // téléphone : la barre d'outils défile ; le fondu à droite disparaît quand on arrive au bout
    const railEl = $('#rail');
    const railEnd = () => railEl.classList.toggle('at-end', railEl.scrollLeft + railEl.clientWidth >= railEl.scrollWidth - 4);
    railEl.addEventListener('scroll', railEnd, { passive: true });
    window.addEventListener('resize', railEnd);
    railEnd();

    // forme
    buildShapeThumbs(); buildShapeParams(); buildCompParams();
    bindRange('shWidth', () => S.shape.width, v => { S.shape.width = v; }, v => v + ' %', 'shWidthVal');
    bindRange('shRot', () => S.shape.rotate, v => { S.shape.rotate = v; }, v => v + '°', 'shRotVal');

    // légende en lettres latines
    buildCaptionUI();

    // écriture
    syncSize();
    $('#size').addEventListener('input', () => { S.size = +$('#size').value; syncSize(); changed(); });
    $('#sizeNum').addEventListener('change', () => { S.size = Math.min(2000, Math.max(8, +$('#sizeNum').value || S.size)); syncSize(); changed(); });
    seg($('#kashida'), [[0, 'Aucun'], [1, '1'], [2, '2'], [3, '3'], [5, '5']], () => S.kashida, v => { S.kashida = v; textChanged(true); });
    $('#harakat').addEventListener('change', () => { S.harakat = $('#harakat').checked; textChanged(true); });
    seg($('#align'), [['right', 'Droite'], ['center', 'Centre'], ['left', 'Gauche']], () => S.align, v => { S.align = v; changed(); });
    bindRange('lh', () => S.lineHeight, v => { S.lineHeight = v; }, v => nf1.format(v), 'lhVal');
    bindRange('ws', () => S.wordSpace, v => { S.wordSpace = v; }, v => '×' + nf2.format(v), 'wsVal');
    bindCheck('colorFont', () => S.colorFont, v => { S.colorFont = v; }, renderAllCardsSoon);

    // couleurs
    seg($('#inkType'), [['solid', 'Unie'], ['grad', 'Dégradé']], () => isGradT(S.fill.type) ? 'grad' : 'solid', v => { S.fill.type = v === 'grad' ? S.fill.gk || 'linear' : 'solid'; updateColorUI(); changed(); if (S.cardColors) renderAllCardsSoon(); });
    inkPick = colorPicker($('#inkPick'), () => S.fill.color, c => { S.fill.color = c; changed(); if (S.cardColors) renderAllCardsSoon(); }, 'Couleur de l’encre');
    inkGrad = gradEditor($('#rowInkGrad'), () => S.fill, INK_PRESETS, 'l’encre', () => { changed(); if (S.cardColors) renderAllCardsSoon(); });
    $('#strokeOn').addEventListener('change', () => { S.stroke.on = $('#strokeOn').checked; updateColorUI(); changed(); });
    bindColor('strokeColor', () => S.stroke.color, v => { S.stroke.color = v; });
    bindRange('strokeW', () => S.stroke.width, v => { S.stroke.width = v; }, v => v + ' px', 'strokeWVal');
    $('#shadowOn').addEventListener('change', () => { S.shadow.on = $('#shadowOn').checked; updateColorUI(); changed(); });
    bindColor('shadowColor', () => S.shadow.color, v => { S.shadow.color = v; });
    bindRange('shadowOp', () => S.shadow.opacity, v => { S.shadow.opacity = v; }, v => Math.round(v * 100) + ' %', 'shadowOpVal');
    bindRange('shadowDist', () => S.shadow.dist, v => { S.shadow.dist = v; }, v => v + ' px', 'shadowDistVal');
    bindRange('shadowBlur', () => S.shadow.blur, v => { S.shadow.blur = v; }, v => v + ' px', 'shadowBlurVal');
    $('#lineInkOn').addEventListener('change', () => { S.lineInk.on = $('#lineInkOn').checked; buildLineInkUI(); changed(); });
    buildLineInkUI(true);
    updateColorUI();

    // effets, cadre
    buildFx();
    buildFrameUI();

    // fond
    seg($('#bgType'), [['none', 'Transparent'], ['solid', 'Uni'], ['grad', 'Dégradé'], ['image', 'Photo']], () => isGradT(S.bg.type) ? 'grad' : S.bg.type, v => { S.bg.type = v === 'grad' ? S.bg.gk || 'linear' : v; updateBgUI(); changed(); if (S.cardColors) renderAllCardsSoon(); });
    bgPick = colorPicker($('#bgPick'), () => S.bg.color, c => { S.bg.color = c; changed(); if (S.cardColors) renderAllCardsSoon(); }, 'Couleur du fond');
    bgGrad = gradEditor($('#rowBgGrad'), () => S.bg, BG_PRESETS, 'le fond', () => { changed(); if (S.cardColors) renderAllCardsSoon(); });
    bindRange('veil', () => S.bg.veil, v => { S.bg.veil = v; }, v => Math.round(v * 100) + ' %', 'veilVal');
    seg($('#veilColor'), [['dark', 'Sombre'], ['light', 'Clair']], () => S.bg.veilColor, v => { S.bg.veilColor = v; changed(); });
    $('#bgFile').addEventListener('change', ev => {
      const file = ev.target.files && ev.target.files[0];
      ev.target.value = '';
      if (file) setBgImage(file, file.name).then(() => { S.bg.type = 'image'; updateBgUI(); changed(); }, () => status('Cette image n’a pas pu être lue.', true));
    });
    updateBgUI();
    buildPatternUI();

    // format
    const fg = $('#formats');
    for (const F of FORMATS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'fmt'; b.dataset.v = F.id;
      b.innerHTML = esc(F.label) + '<small>' + esc(F.sub) + '</small>';
      b.addEventListener('click', () => {
        const was = S.format.id;
        S.format.id = F.id;
        updateFormatUI();
        if (F.id !== 'auto' && F.id !== was) fitToFormat();
        changed();
      });
      fg.appendChild(b);
    }
    bindRange('margin', () => S.format.margin, v => { S.format.margin = v; }, v => v + ' px', 'marginVal');
    $('#cw').addEventListener('change', () => { S.format.w = Math.min(12000, Math.max(50, +$('#cw').value || 1200)); updateFormatUI(); requestFit('always'); changed(); });
    $('#ch').addEventListener('change', () => { S.format.h = Math.min(12000, Math.max(50, +$('#ch').value || 800)); updateFormatUI(); requestFit('always'); changed(); });
    $('#fitBtn').addEventListener('click', fitToFormat);
    $('#fitBtn2').addEventListener('click', fitToFormat);
    $('#physOn').addEventListener('change', () => { S.phys.on = $('#physOn').checked; updateFormatUI(); changed(); });
    $('#physVal').addEventListener('input', () => { const v = parseFloat(String($('#physVal').value).replace(',', '.')); if (v > 0) { S.phys.value = v; changed(); } });
    seg($('#physUnit'), [['mm', 'mm'], ['cm', 'cm'], ['m', 'm']], () => S.phys.unit, v => { S.phys.unit = v; changed(); });
    updateFormatUI();

    // aperçu
    const pvb = $('#pvBg');
    for (const [id, label, col] of [['check', 'Damier', 'repeating-conic-gradient(#bbb 0 25%,#fff 0 50%) 0 0/8px 8px'], ['light', 'Fond clair', '#ffffff'], ['dark', 'Fond sombre', '#14161b']]) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.v = id; b.title = 'Aperçu de la transparence : ' + label.toLowerCase(); b.setAttribute('aria-label', label);
      b.innerHTML = '<i style="background:' + col + '"></i>';
      b.addEventListener('click', () => { S.pvBg = id; syncSeg(pvb, id); syncPreviewBg(); saveSoon(); });
      pvb.appendChild(b);
    }
    syncSeg(pvb, S.pvBg); syncPreviewBg();
    $('#zoomIn').addEventListener('click', () => zoomer.zoomIn());
    $('#zoomOut').addEventListener('click', () => zoomer.zoomOut());
    $('#zoomFit').addEventListener('click', () => zoomer.fit());
    $('#zoomVal').addEventListener('click', () => zoomer.real());
    $('#dimsBtn').setAttribute('aria-pressed', String(S.dims));
    $('#dimsBtn').addEventListener('click', () => { S.dims = !S.dims; $('#dimsBtn').setAttribute('aria-pressed', String(S.dims)); saveSoon(); renderBench(); zoomer.layout(); });
    $('#guidesBtn').setAttribute('aria-pressed', String(!!S.guides));
    $('#guidesBtn').addEventListener('click', () => { S.guides = !S.guides; $('#guidesBtn').setAttribute('aria-pressed', String(S.guides)); saveSoon(); renderBench(); });
    $('#undoBtn').addEventListener('click', undo);
    $('#redoBtn').addEventListener('click', redo);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && drawing) { stopDraw(); scheduleBench(); return; }
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const t = e.target, typing = t && (t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && /^(text|search|number)$/.test(t.type)));
      if (typing) return;
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    });

    // export
    seg($('#scale'), [[1, '×1'], [2, '×2'], [4, '×4'], [8, '×8']], () => S.scale, v => { S.scale = v; saveSoon(); renderBench(); });
    $$('button[data-x]').forEach(b => b.addEventListener('click', () => doExport(b.dataset.x, b)));
    // tiroir « Télécharger »
    const xdlg = $('#exportDlg');
    const openExport = () => openDialog(xdlg);
    $('#dlOpen').addEventListener('click', openExport);
    $('#pvDl').addEventListener('click', openExport);
    $('#qdlMore').addEventListener('click', openExport);
    $('#exportClose').addEventListener('click', () => closeDialog(xdlg));
  }
  // photo de fond (fichier ou Blob enregistré)
  function setBgImage(blob, name) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(blob), img = new Image();
      img.onload = () => {
        if (bgImage) URL.revokeObjectURL(bgImage.url);
        bgImage = { url, img, name: name || 'photo', blob };
        res(bgImage);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image illisible')); };
      img.src = url;
    });
  }
