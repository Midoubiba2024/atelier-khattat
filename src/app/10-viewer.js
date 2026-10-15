  // ------------------------------------------------------------------ plein écran : aperçu, mise en situation, comparaison
  const viewer = $('#viewer');
  let vTab = 'pv', mockId = 'wall', cmpSrc = 'fav', cmpRun = 0;
  function viewerOpen() { const v = document.getElementById('viewer'); return !!(v && v.open); }
  const vzoomer = makeZoomer($('#vpreview'), $('#vstage'), {
    pad: () => 16, nav: true,
    onZoom: (k, z, canOut) => { $('#vzVal').textContent = nf0.format(Math.round(k * 100)) + ' %'; $('#vzOut').disabled = !canOut; }
  });
  function showVTab(id) {
    vTab = id;
    for (const t of $$('#viewer .tab')) {
      const on = t.id === 'vt-' + id;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    }
    refreshViewer();
  }
  function refreshViewer() {
    const sc = lastScene;
    if (vTab === 'pv') {
      if (!sc || sc.empty) { $('#vstage').innerHTML = ''; return; }
      $('#vstage').innerHTML = KX.sceneToSVG(sc, { inline: true, idPrefix: 'vw', imageHref: bgImage && bgImage.url, overflowMark: true });
      $('#vpreview').classList.toggle('see-through', sc.st.bg.type === 'none');
      vzoomer.setScene(sc.W, sc.H, overflowExtent(sc));
      vzoomer.navSource(() => KX.sceneToSVG(sc, { inline: true, idPrefix: 'vn', imageHref: bgImage && bgImage.url }));
    } else if (vTab === 'mock') renderMock();
    else if (vTab === 'cmp') renderCompare();
  }
  let mockSeq = 0;
  function renderMock() {
    const sc = lastScene, box = $('#mockBox');
    if (!sc || sc.empty) { box.innerHTML = ''; return; }
    const inner = KX.sceneToSVG(sc, { inline: true, idPrefix: 'mk' + (++mockSeq), imageHref: bgImage && bgImage.url });
    const light = lum(paintAvg(S.fill)) > 0.55;
    box.innerHTML = KM.render(mockId, inner, sc.W / sc.H, { transparent: sc.st.bg.type === 'none', light }, 'm' + mockSeq);
  }
  async function downloadMock() {
    const svg = $('#mockBox svg');
    if (!svg) return;
    const src = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(svg).replace('<svg ', '<svg width="2400" height="1600" ');
    const name = fileBase() + '-' + mockId;
    try {
      const url = URL.createObjectURL(new Blob([src], { type: 'image/svg+xml' }));
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const cv = document.createElement('canvas'); cv.width = 2400; cv.height = 1600;
      cv.getContext('2d').drawImage(img, 0, 0, 2400, 1600);
      URL.revokeObjectURL(url);
      await saveFile(name + '.png', await toBlob(cv, 'image/png'));
    } catch (e) {
      // dessin impossible (image distante, navigateur) : la mise en situation part en SVG, vectorielle
      await saveFile(name + '.svg', new Blob([src], { type: 'image/svg+xml' }));
    }
  }
  function cmpList() {
    let list = cmpSrc === 'fav' ? FONTS.filter(f => isFav(f.id)) : FONTS.filter(f => f.wrap && !f.wrap.hidden);
    if (!list.length && cmpSrc === 'fav') list = FONTS.filter(f => f.fam === (currentFont() || {}).fam);
    return list.slice(0, 24);
  }
  async function renderCompare() {
    const run = ++cmpRun, g = $('#cmpGrid');
    const list = cmpList();
    $('#cmpHint').textContent = cmpSrc === 'fav' && !S.favs.length ? 'Pas encore de favoris : voici la famille du style choisi. Ajoutez des favoris avec ☆ dans la galerie.' : list.length + ' styles avec vos réglages actuels. Touchez-en un pour le choisir.';
    g.innerHTML = '';
    const cells = list.map(f => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cmpcell';
      b.setAttribute('aria-pressed', String(f.id === S.fontId));
      b.innerHTML = '<span class="art"><span class="sk"></span></span><b>' + esc(f.name) + '</b><small>' + esc(famOf(f).fr || '') + '</small>';
      b.addEventListener('click', () => { selectFont(f.id); $$('.cmpcell', g).forEach(c => c.setAttribute('aria-pressed', String(c === b))); });
      g.appendChild(b);
      return { f, b };
    });
    await ensureClipper();
    for (const { f, b } of cells) {
      if (run !== cmpRun || !viewer.open || vTab !== 'cmp') return;
      try {
        await ensureFont(f);
        if (run !== cmpRun) return;
        const sc = sceneForFont(f, 'preview');
        b.querySelector('.art').innerHTML = sc.empty ? '' : KX.sceneToSVG(sc, { inline: true, idPrefix: 'c' + run + '-' + f.id.replace(/[^a-z0-9]/gi, ''), imageHref: bgImage && bgImage.url });
      } catch (e) { b.querySelector('.art').innerHTML = '<small>indisponible</small>'; }
      await sleep(0);
    }
  }
  function buildViewer() {
    $('#fullBtn').addEventListener('click', () => { openDialog(viewer); showVTab(vTab); requestAnimationFrame(() => vzoomer.layout()); });
    $('#viewerClose').addEventListener('click', () => closeDialog(viewer));
    viewer.addEventListener('close', () => { cmpRun++; });
    const tabs = $$('#viewer .tab');
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => showVTab(t.id.slice(3)));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        showVTab(n.id.slice(3)); n.focus();
      });
    });
    $('#vzIn').addEventListener('click', () => vzoomer.zoomIn());
    $('#vzOut').addEventListener('click', () => vzoomer.zoomOut());
    $('#vzFit').addEventListener('click', () => vzoomer.fit());
    $('#vzVal').addEventListener('click', () => vzoomer.real());
    const chips = $('#mockChips');
    for (const [id, label] of KM.LIST) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = id; b.textContent = label;
      b.addEventListener('click', () => { mockId = id; syncSeg(chips, id); renderMock(); });
      chips.appendChild(b);
    }
    syncSeg(chips, mockId);
    $('#mockDl').addEventListener('click', downloadMock);
    seg($('#cmpSrc'), [['fav', 'Mes favoris'], ['filter', 'Styles affichés dans la galerie']], () => cmpSrc, v => { cmpSrc = v; renderCompare(); }, true);
  }
