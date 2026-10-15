  // ------------------------------------------------------------------ divers
  $('#removeFontBtn').addEventListener('click', () => { const f = currentFont(); if (f && f.user) { removeUserFont(f.id); status('Police retirée de la galerie et de ce navigateur.'); } });

  function buildLicences() {
    const ul = $('#licList');
    const seen = new Set();
    for (const f of FONTS) {
      if (!f.lic || seen.has(f.lic)) continue;
      seen.add(f.lic);
      const li = document.createElement('li');
      li.innerHTML = '<b>' + esc(f.fname || f.name) + '</b> : ' + esc(COPYRIGHTS[f.lic] || '') + ' ' + esc(LICNAME[f.lic] ? 'Licences : ' + LICNAME[f.lic] + '.' : 'Licence SIL OFL 1.1.');
      ul.appendChild(li);
    }
  }
  // ------------------------------------------------------------------ version et nouveautés
  // un point signale une version plus récente que la dernière vue dans ce navigateur (rien à la première visite)
  const verDlg = $('#verDlg');
  function buildVersion() {
    $('#verNum').textContent = 'Version ' + APP_VERSION;
    $('#verBtn').setAttribute('aria-label', 'Version ' + APP_VERSION + ' : voir les nouveautés');
    const LVL = { minime: 'petite mise à jour', moyenne: 'mise à jour moyenne', grande: 'grande mise à jour' };
    const fmtDate = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return d; } };
    $('#verList').innerHTML = VERSIONS.map((x, i) => '<li' + (i ? '' : ' class="cur"') + '><h3>Version ' + esc(x.v) + '<small>' + esc(fmtDate(x.date)) + (LVL[x.level] ? ' · ' + LVL[x.level] : ' · première version') + '</small></h3><ul>' +
      x.notes.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul></li>').join('');
    let seen = '';
    try { seen = localStorage.getItem('khattat:version') || ''; } catch (e) { seen = ''; }
    const newer = (a, b) => Math.round(parseFloat(a) * 100) > Math.round(parseFloat(b) * 100);
    if (!seen) { try { localStorage.setItem('khattat:version', APP_VERSION); } catch (e) { /* stockage indisponible */ } }
    else if (newer(APP_VERSION, seen)) $('#verDot').hidden = false;
    $('#verBtn').addEventListener('click', () => {
      openDialog(verDlg);
      $('#verDot').hidden = true;
      try { localStorage.setItem('khattat:version', APP_VERSION); } catch (e) { /* stockage indisponible */ }
    });
    $('#verClose').addEventListener('click', () => closeDialog(verDlg));
  }
  const aboutDlg = $('#about');
  $('#aboutBtn').addEventListener('click', () => openDialog(aboutDlg));
  $('#aboutClose').addEventListener('click', () => closeDialog(aboutDlg));
  // clic sur le voile : ferme la boîte de dialogue
  for (const d of $$('dialog')) d.addEventListener('click', e => { if (e.target === d) closeDialog(d); });

  async function renderBrand() {
    try {
      const f = fontById('aref-ruqaa');
      await ensureFont(f, true);
      const r = K.buildText(f.hb, 'خطّاط', { size: 64 });
      const b = r.bbox;
      $('#brandMark').innerHTML = '<svg viewBox="' + [b.x - 2, b.y - 2, b.w + 4, b.h + 4].map(v => v.toFixed(1)).join(' ') + '" aria-hidden="true"><path d="' + K.toSVGPath(r.cmds, 1) + '"/></svg>';
    } catch (e) { /* le texte de repli reste affiché */ }
  }

  // ------------------------------------------------------------------ démarrage
  prepareText();
  buildSamples();
  buildKeyboard();
  buildLibrary();
  buildTashkil();
  buildFilters();
  buildGrid();
  buildControls();
  buildViewer();
  buildModels();
  showToolRef(S.tool);
  buildLearn();
  buildImitate();
  buildDesigns();
  buildShare();
  buildDownloads();
  buildLicences();
  buildVersion();
  updateTextUI();
  syncTabDots();
  $('#q').addEventListener('input', () => { query = fold($('#q').value.trim()); applyGridFilter(); });
  $('#cardColors').checked = S.cardColors;
  $('#cardColors').addEventListener('change', () => { S.cardColors = $('#cardColors').checked; saveSoon(); renderAllCards(); });
  const savedFontId = S.fontId;
  if (!currentFont()) S.fontId = DEFAULT.fontId;
  selectFont(S.fontId, true);
  histInit();
  importFromHash();
  renderBrand();
  // effets et cadres : la bibliothèque de géométrie se charge en parallèle des polices
  ensureClipper().then(ok => { syncFxWait(); if (ok) { scheduleBench(); renderModelsSoon(); } });
  IDB.all('fonts').then(async recs => {
    for (const r of recs || []) { try { await addUserFont(r.name, r.buf, false); } catch (e) { /* police illisible ignorée */ } }
    if (recs && recs.length) { setFilter(S.filter); if (savedFontId !== S.fontId && fontById(savedFontId)) selectFont(savedFontId, true); }
  });
