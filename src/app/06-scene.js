  // ------------------------------------------------------------------ scène (réglages → dessin)
  let bgImage = null; // { url, img, name, blob }
  let lastScene = null;
  function resolveFormat(fm) {
    fm = fm || S.format;
    if (fm.id === 'auto') return { id: 'auto', margin: fm.margin };
    if (fm.id === 'custom') return { id: 'custom', w: Math.max(50, +fm.w || 1200), h: Math.max(50, +fm.h || 800) };
    const F = FORMATS.find(x => x.id === fm.id) || FORMATS[0];
    return F.id === 'auto' ? { id: 'auto', margin: fm.margin } : { id: F.id, w: F.w, h: F.h };
  }
  const UNIT_MM = { mm: 1, cm: 10, m: 1000 };
  const physMm = () => Math.max(0.1, +S.phys.value || 0) * (UNIT_MM[S.phys.unit] || 10);
  const isA4 = () => S.format.id === 'a4p' || S.format.id === 'a4l';
  // réglages de dessin d'un état (S ou un modèle)
  function settingsOf(st, opt) {
    opt = opt || {};
    const sh = st.shadow, d = sh.dist / Math.SQRT2;
    const bg = Object.assign({}, st.bg, { stops: st.bg.stops.map(x => ({ c: x.c, p: x.p })) });
    if (bg.type === 'image' && !(opt.image !== undefined ? opt.image : bgImage)) bg.type = 'none';
    const fr = st.frame;
    return {
      size: st.size, lineHeight: st.lineHeight, align: st.align, wordSpace: st.wordSpace, colorFont: st.colorFont,
      fill: st.fill.type === 'solid' ? { type: 'solid', color: st.fill.color } : { type: st.fill.type, stops: st.fill.stops.map(x => ({ c: x.c, p: x.p })), angle: st.fill.angle },
      stroke: { on: st.stroke.on, color: st.stroke.color, width: st.stroke.width },
      shadow: { on: sh.on, color: sh.color, opacity: sh.opacity, dx: d, dy: d, blur: sh.blur },
      fx: clone(st.fx),
      frame: { type: fr.type, width: fr.width, double: fr.double, pad: fr.pad, color: fr.ink ? 'ink' : fr.color, panel: fr.panelOn ? fr.panel : 'none', fit: fr.fit },
      pattern: Object.assign({}, st.pattern),
      bg, format: opt.format || resolveFormat(st.format),
      shape: Object.assign({}, st.shape),
      phys: opt.phys || { on: st.phys.on && !(st.format.id === 'a4p' || st.format.id === 'a4l'), widthMm: Math.max(0.1, +st.phys.value || 0) * (UNIT_MM[st.phys.unit] || 10) }
    };
  }
  const sceneSettings = () => settingsOf(S);
  // dimensions dans une seule unité, choisie d'après le plus grand côté
  function unitFor(mm) { return mm >= 1000 ? ['m', 1000, nf2] : mm >= 100 ? ['cm', 10, nf1] : ['mm', 1, nf1]; }
  function fmtDims(wmm, hmm) {
    const [u, k, nf] = unitFor(Math.max(wmm, hmm));
    return nf.format(wmm / k) + ' × ' + nf.format(hmm / k) + ' ' + u;
  }
  function fmtLen(mm, ref) { const [u, k, nf] = unitFor(ref); return nf.format(mm / k) + ' ' + u; }
  function benchHB(f) { return hbFor(f, true); }
  function currentScene(quality) {
    const f = currentFont();
    if (!f || f.state !== 'ready') return null;
    const hb = benchHB(f);
    const chk = K.checkSupport(hb, textFor(hb));
    const sc = KX.buildScene(hb, chk.text, sceneSettings(), null, { quality: quality || 'preview' });
    sc.missing = chk.missing;
    sc.font = f;
    return sc;
  }
  // scène d'export : contours effets calculés finement ; Clipper chargé d'abord si un effet en a besoin
  async function exportScene() {
    await ensureClipper();
    return currentScene('export');
  }

  // ------------------------------------------------------------------ aperçu zoomable
  // box : conteneur (overflow caché) ; stage : élément positionné qui reçoit le SVG
  function makeZoomer(box, stage, o) {
    let z = 1, px = 0, py = 0, W = 0, H = 0, fitK = 1, drag = null;
    const pointers = new Map();
    let pinch = null;
    const pad = () => (o.pad ? o.pad() : 12);
    function sizes() {
      const P = pad(), bw = box.clientWidth;
      const maxH = o.maxH ? o.maxH() : box.clientHeight;
      fitK = Math.max(1e-6, Math.min((bw - 2 * P) / W, (maxH - 2 * P) / H));
      if (o.autoHeight) box.style.height = Math.max(180, Math.round(H * fitK + 2 * P)) + 'px';
      return { bw, bh: box.clientHeight };
    }
    const zMax = () => Math.max(1, Math.min(48, 60000 / Math.max(1, Math.max(W, H) * fitK)));
    function clampPan(bw, bh) {
      const sw = W * fitK * z, sh = H * fitK * z;
      const mx = Math.max(0, (sw - bw) / 2 + 30), my = Math.max(0, (sh - bh) / 2 + 30);
      px = Math.min(mx, Math.max(-mx, px)); py = Math.min(my, Math.max(-my, py));
    }
    function layout() {
      if (!W || !H) return;
      const { bw, bh } = sizes();
      if (z <= 1) { z = 1; px = 0; py = 0; }
      clampPan(bw, bh);
      const sw = W * fitK * z, sh = H * fitK * z;
      stage.style.width = Math.max(1, sw) + 'px'; stage.style.height = Math.max(1, sh) + 'px';
      stage.style.transform = 'translate(' + ((bw - sw) / 2 + px).toFixed(1) + 'px,' + ((bh - sh) / 2 + py).toFixed(1) + 'px)';
      box.classList.toggle('zoomed', z > 1.001);
      if (o.onZoom) o.onZoom(fitK * z, z);
    }
    function setScene(w, h) {
      if (w !== W || h !== H) { const first = !W; W = w; H = h; if (first) { z = 1; px = py = 0; } }
      layout();
    }
    function zoomAt(nz, cx, cy) {
      nz = Math.min(zMax(), Math.max(1, nz));
      const r = box.getBoundingClientRect();
      const bx = cx == null ? r.width / 2 : cx - r.left, by = cy == null ? r.height / 2 : cy - r.top;
      // point du dessin sous le curseur, conservé pendant le zoom
      const ox = bx - r.width / 2 - px, oy = by - r.height / 2 - py;
      const k = nz / z;
      px = bx - r.width / 2 - ox * k; py = by - r.height / 2 - oy * k;
      z = nz;
      layout();
    }
    box.addEventListener('wheel', e => {
      if (!W) return;
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(z * Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); }
      else if (z > 1.001) { e.preventDefault(); px -= e.deltaX; py -= e.deltaY; layout(); }
    }, { passive: false });
    box.addEventListener('pointerdown', e => {
      if (o.blocked && o.blocked()) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, z, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        drag = null;
      } else if (z > 1.001 && e.button === 0) {
        drag = { x: e.clientX, y: e.clientY, px, py };
        box.classList.add('panning');
      }
      if (drag || pinch) { try { box.setPointerCapture(e.pointerId); } catch (err) { /* sans capture */ } }
    });
    box.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && pointers.size >= 2) {
        const [a, b] = Array.from(pointers.values());
        zoomAt(pinch.z * (Math.hypot(a.x - b.x, a.y - b.y) || 1) / pinch.d, (a.x + b.x) / 2, (a.y + b.y) / 2);
      } else if (drag) {
        px = drag.px + e.clientX - drag.x; py = drag.py + e.clientY - drag.y; layout();
      }
    });
    const up = e => { pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null; if (!pointers.size) { drag = null; box.classList.remove('panning'); } };
    box.addEventListener('pointerup', up); box.addEventListener('pointercancel', up); box.addEventListener('lostpointercapture', up);
    box.addEventListener('dblclick', e => { if (o.blocked && o.blocked()) return; zoomAt(z > 1.5 ? 1 : 3, e.clientX, e.clientY); });
    box.addEventListener('keydown', e => {
      if (e.target !== box) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomAt(z * 1.5); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomAt(z / 1.5); }
      else if (e.key === '0') { e.preventDefault(); zoomAt(1); }
      else if (z > 1.001 && /^Arrow/.test(e.key)) {
        e.preventDefault();
        const s = e.shiftKey ? 120 : 40;
        if (e.key === 'ArrowLeft') px += s; else if (e.key === 'ArrowRight') px -= s; else if (e.key === 'ArrowUp') py += s; else py -= s;
        layout();
      }
    });
    if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(box);
    return {
      setScene, layout,
      zoomIn: () => zoomAt(z * 1.5), zoomOut: () => zoomAt(z / 1.5), fit: () => zoomAt(1),
      real: () => zoomAt(1 / fitK),
      get scale() { return fitK * z; }
    };
  }

  const pv = $('#preview'), stage = $('#stage');
  const pvPad = () => (S.dims ? 36 : 12);
  const zoomer = makeZoomer(pv, stage, {
    // la hauteur de l'aperçu vient de la mise en page (scène de l'atelier, ou bandeau collé en haut sur téléphone)
    pad: pvPad,
    blocked: () => !!drawing,
    onZoom: k => { $('#zoomVal').textContent = nf0.format(Math.round(k * 100)) + ' %'; }
  });
  function showMsg(msg) {
    const m = $('#pvMsg');
    m.textContent = msg; m.hidden = false;
    stage.hidden = true;
  }
  function hideMsg() { $('#pvMsg').hidden = true; stage.hidden = false; }
  function dimsHTML(sc) {
    const mpp = sc.mmPerPx, w = sc.W * mpp, h = sc.H * mpp, ref = Math.max(w, h);
    return '<div class="dims" aria-hidden="true"><span class="dim-w"><span class="dlab">' + fmtLen(w, ref) + '</span></span><span class="dim-h"><span class="dlab">' + fmtLen(h, ref) + '</span></span></div>';
  }
  function syncPreviewBg() {
    pv.classList.remove('pv-check', 'pv-light', 'pv-dark');
    pv.classList.add('pv-' + S.pvBg);
  }

  let raf = 0;
  function scheduleBench() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; renderBench(); }); }
  function renderBench() {
    if (drawing) return;
    const f = currentFont();
    $('#benchFont').textContent = f ? f.name : '';
    $('#removeFontBtn').hidden = !(f && f.user);
    if (!f || f.state !== 'ready') {
      lastScene = null;
      if (f && f.state === 'error') showMsg('La police n’a pas pu être chargée. Choisissez un autre style ou réessayez.');
      else if (!stage.querySelector('svg')) showMsg('Chargement de la police…');
      return;
    }
    const sc = currentScene();
    lastScene = sc;
    if (!prepared.trim() || sc.empty) {
      showMsg('Écrivez une phrase en arabe à gauche pour la voir ici.');
      $('#meta').innerHTML = '';
      $('#overflow').hidden = true; $('#missing').hidden = true;
      return;
    }
    hideMsg();
    stage.innerHTML = KX.sceneToSVG(sc, { inline: true, idPrefix: 'pv', imageHref: bgImage && bgImage.url }) + (S.dims ? dimsHTML(sc) : '');
    pv.classList.toggle('see-through', sc.st.bg.type === 'none');
    pv.setAttribute('aria-label', 'Aperçu : ' + S.text.replace(/\s+/g, ' ') + '. Ctrl + molette ou deux doigts pour zoomer.');
    zoomer.setScene(sc.W, sc.H);
    const note = $('#pvNote');
    note.hidden = !sc.pending;
    note.textContent = sc.pending ? 'Effets en préparation…' : '';
    const W = sc.W, H = sc.H, k = S.scale, mpp = sc.mmPerPx, dpi = Math.round(25.4 * k / mpp);
    $('#meta').innerHTML = '<span><b>' + fmtDims(W * mpp, H * mpp) + '</b> · ' + nf0.format(W) + ' × ' + nf0.format(H) + ' px</span>' +
      '<span>Image ×' + k + ' : ' + nf0.format(Math.round(W * k)) + ' × ' + nf0.format(Math.round(H * k)) + ' px · ' + nf0.format(dpi) + ' ppp</span>';
    $('#scaleVal').textContent = nf0.format(Math.round(W * k)) + ' × ' + nf0.format(Math.round(H * k)) + ' px';
    updateShapeHint(sc);
    renderShapeThumbs();
    const ph = $('#physHint');
    if (S.phys.on && !isA4() && dpi < 150) ph.textContent = 'À cette taille, les images PNG et JPG ne font que ' + dpi + ' ppp : pour l’impression, prenez le PDF ou le SVG, qui restent nets à toutes les tailles.';
    else ph.textContent = isA4() ? 'Le format A4 fixe déjà la taille réelle (21 × 29,7 cm).' : 'Pour une enseigne, une gravure ou une découpe : le PDF, l’EPS, le SVG et le DXF sortent à cette largeur exacte.';
    $('#overflow').hidden = !sc.overflow;
    const ms = $('#missing');
    ms.hidden = !sc.missing.length;
    if (sc.missing.length) ms.textContent = 'Cette police ne contient pas : ' + sc.missing.join(' ') + '. Ces caractères n’apparaissent pas.';
    if (viewerOpen()) refreshViewer();
  }
