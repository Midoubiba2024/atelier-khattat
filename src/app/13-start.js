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
  buildImitate();
  buildDesigns();
  buildDownloads();
  buildLicences();
  updateTextUI();
  syncTabDots();
  $('#q').addEventListener('input', () => { query = fold($('#q').value.trim()); applyGridFilter(); });
  $('#cardColors').checked = S.cardColors;
  $('#cardColors').addEventListener('change', () => { S.cardColors = $('#cardColors').checked; saveSoon(); renderAllCards(); });
  const savedFontId = S.fontId;
  if (!currentFont()) S.fontId = DEFAULT.fontId;
  selectFont(S.fontId, true);
  histInit();
  renderBrand();
  // effets et cadres : la bibliothèque de géométrie se charge en parallèle des polices
  ensureClipper().then(ok => { syncFxWait(); if (ok) { scheduleBench(); renderModelsSoon(); } });
  IDB.all('fonts').then(async recs => {
    for (const r of recs || []) { try { await addUserFont(r.name, r.buf, false); } catch (e) { /* police illisible ignorée */ } }
    if (recs && recs.length) { setFilter(S.filter); if (savedFontId !== S.fontId && fontById(savedFontId)) selectFont(savedFontId, true); }
  });
