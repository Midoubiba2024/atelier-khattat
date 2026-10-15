  // ------------------------------------------------------------------ Apprendre à écrire
  // Les lettres (familles × écritures), l'étude d'une lettre (formes, mesure en points du calame, cercle d'Ibn Muqla,
  // tracé à la souris ou au doigt), les grandes écritures, les genres de composition et leurs gabarits géométriques,
  // et une feuille d'exercice A4 en PDF. Tout est dessiné avec les polices de l'atelier.
  const ZWJ = '‍';
  const LN_SCRIPTS = [
    { id: 'naskh', fr: 'Naskh', ar: 'النسخ', font: 'amiri' },
    { id: 'thuluth', fr: 'Thuluth', ar: 'الثلث', font: 'layla-thuluth' },
    { id: 'nastaliq', fr: 'Nastaʿlīq', ar: 'النستعليق', font: 'gulzar' },
    { id: 'diwani', fr: 'Diwani', ar: 'الديواني', font: 'layla-diwani' },
    { id: 'ruqaa', fr: 'Ruqʿa', ar: 'الرقعة', font: 'aref-ruqaa' },
    { id: 'kufi', fr: 'Kufi', ar: 'الكوفي', font: 'qahiri' },
    { id: 'maghribi', fr: 'Maghribi', ar: 'المغربي', font: 'bouazzi-maghribi' }
  ];
  // [lettre, nom arabe, translittération, se lie à la lettre suivante]
  const LN_LETTERS = [
    ['ا', 'ألف', 'alif', 0], ['ب', 'باء', 'bāʾ', 1], ['ت', 'تاء', 'tāʾ', 1], ['ث', 'ثاء', 'thāʾ', 1], ['ج', 'جيم', 'jīm', 1], ['ح', 'حاء', 'ḥāʾ', 1], ['خ', 'خاء', 'khāʾ', 1],
    ['د', 'دال', 'dāl', 0], ['ذ', 'ذال', 'dhāl', 0], ['ر', 'راء', 'rāʾ', 0], ['ز', 'زاي', 'zāy', 0], ['س', 'سين', 'sīn', 1], ['ش', 'شين', 'shīn', 1], ['ص', 'صاد', 'ṣād', 1],
    ['ض', 'ضاد', 'ḍād', 1], ['ط', 'طاء', 'ṭāʾ', 1], ['ظ', 'ظاء', 'ẓāʾ', 1], ['ع', 'عين', 'ʿayn', 1], ['غ', 'غين', 'ghayn', 1], ['ف', 'فاء', 'fāʾ', 1], ['ق', 'قاف', 'qāf', 1],
    ['ك', 'كاف', 'kāf', 1], ['ل', 'لام', 'lām', 1], ['م', 'ميم', 'mīm', 1], ['ن', 'نون', 'nūn', 1], ['ه', 'هاء', 'hāʾ', 1], ['و', 'واو', 'wāw', 0], ['ي', 'ياء', 'yāʾ', 1],
    ['لا', 'لام ألف', 'lām-alif', 0]
  ];
  const LN_FAMILIES = [['ا'], ['ب', 'ت', 'ث'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'], ['س', 'ش'], ['ص', 'ض'], ['ط', 'ظ'], ['ع', 'غ'], ['ف'], ['ق'], ['ك'], ['ل'], ['م'], ['ن'], ['ه'], ['و'], ['لا'], ['ي']];
  const LN_INFO = {
    kufi: ['Irak, puis tout le monde musulman · dès le VIIe siècle', 'La plus ancienne des grandes écritures : anguleuse, tracée comme à la règle, elle doit son nom à la ville de Koufa. Elle a servi aux premiers corans et à l’architecture ; on en a tiré le koufi fleuri et le koufi carré, géométrique.'],
    naskh: ['L’une des six écritures canoniques', 'Arrondie et très lisible, c’est l’écriture des livres et du Coran, et l’ancêtre des caractères d’imprimerie. Repère des maîtres : l’alif mesure environ cinq points.'],
    thuluth: ['L’une des six écritures canoniques', 'Monumentale, aux hampes hautes et aux courbes amples, réputée la plus difficile. Elle orne les titres, les mosquées et les grands panneaux ; ses mots s’empilent volontiers. Repère : un alif de sept à neuf points selon les écoles.'],
    nastaliq: ['Iran, fin du XIVe – XVe siècle', 'Née de la rencontre du naskh et du taʿlīq : les mots descendent en diagonale, les traits horizontaux s’allongent. C’est l’écriture de la poésie persane et de l’ourdou.'],
    diwani: ['Chancellerie ottomane, à partir du XVe siècle', 'L’écriture des firmans du Divan impérial : lettres serrées et enlacées, lignes qui montent doucement vers la gauche. On dit que sa complexité rendait les décrets difficiles à imiter.'],
    ruqaa: ['Époque ottomane, fixée au XIXe siècle', 'L’écriture rapide de tous les jours : traits courts, peu de courbes, lettres posées sur la ligne. C’est encore l’écriture manuscrite la plus courante dans le monde arabe.'],
    maghribi: ['Afrique du Nord et al-Andalus', 'Issue du koufi, elle a des courbes larges et des finales en grandes boucles. Particularité : le fāʾ (ف) porte son point en dessous et le qāf (ق) un seul point au-dessus.']
  };
  const LN_GENRES = [
    ['Musanna (miroir)', 'La phrase et son reflet, symétriques autour d’un axe. Les calligraphes ottomans l’ont beaucoup pratiquée ; les confréries soufies y voyaient le reflet du divin.', 'musanna'],
    ['Cercle et shamsa', 'La phrase tourne en couronne autour d’un centre, comme le « petit soleil » (shamsa) des frontispices de manuscrits.', 'shamsa'],
    ['Sceau et médaillon', 'Plusieurs lignes dans un rond : la première suit le haut du cercle, la dernière le bas ; ou des anneaux concentriques autour d’un nom.', 'medaillon-noms'],
    ['Goutte', 'Le texte remplit une forme de goutte, pointe en haut : une silhouette fréquente des panneaux ottomans.', 'goutte'],
    ['Formes remplies', 'Pyramide, œuf, ovale : chaque ligne prend la largeur de la forme à sa hauteur, du sommet à la base.', 'pyramide'],
    ['Mosaïque de cartouches', 'Une phrase par cartouche, assemblés en panneau : une manière de réunir des maximes ou les noms divins.', 'vertus'],
    ['Tughra', 'Le monogramme des sultans ottomans : le nom en bas (sere), trois hampes verticales (tuğ), deux boucles à gauche (beyze) et des traits qui filent vers la droite (hançer).', 'tughra'],
    ['Hilye', 'Le panneau fixé par Hafız Osman : un bandeau en haut, un rond central entouré d’un croissant, quatre médaillons aux coins, un bandeau pour un verset, puis la suite du texte.', 'hilye'],
    ['Médaillon ailé', 'Une formule coupée en trois : le début dans un médaillon, la suite en deux ailes de part et d’autre, souvent reliées par un long trait (kashida).', 'medaillon-ailes'],
    ['Lettres semées', 'Un mot en grand, entouré de petites lettres qui flottent autour de lui : un écho contemporain entre le mot et l’alphabet.', 'lettres-semees'],
    ['Koufi carré', 'Les lettres deviennent un dédale de lignes droites qui remplit un carré, les vides répondant aux pleins. On le voit sur les murs, en brique et en céramique.', null],
    ['Figures', 'Des phrases qui dessinent un visage, un lion ou un cheval : un genre prisé à l’époque ottomane.', null]
  ];
  const lnState = { tab: 'lettres', letter: 'ب', script: 'naskh', nib: 1, model: true, exScript: 'naskh', exNib: 2.4, built: false };
  const lnScript = id => LN_SCRIPTS.find(s => s.id === id) || LN_SCRIPTS[0];
  async function lnReady(sid) {
    const f = fontById(lnScript(sid).font);
    if (!f) throw new Error('police absente');
    await ensureFont(f);
    return hbFor(f, false);
  }
  const lnBuild = (hb, text, size) => K.buildText(hb, text, { size: size || 100, lineHeight: 1, align: 'center', color: false });
  function lnSvg(cmds, box, y0, y1) {
    const p = Math.max(1, Math.max(box.w, box.h) * 0.06);
    const top = y0 == null ? box.y - p : y0 - p, h = y0 == null ? box.h + 2 * p : y1 - y0 + 2 * p;
    return '<svg viewBox="' + [box.x - p, top, box.w + 2 * p, h].map(v => v.toFixed(1)).join(' ') + '" aria-hidden="true" focusable="false"><path d="' + K.toSVGPath(cmds, 1) + '"/></svg>';
  }
  // mesures d'une police : point du calame (losange de ب ou d'une lettre voisine), alif et ligne de base
  function lnMetrics(hb) {
    const al = lnBuild(hb, 'ا', 100), ab = al.bbox;
    let dot = null;
    for (const c of ['ب', 'ن', 'ف', 'ج', 'ي']) {
      const r = lnBuild(hb, c, 100), ctrs = K.splitContours(r.cmds), fl = K.dotContours(ctrs, 100), i = fl.findIndex(Boolean);
      if (i >= 0) { const b = K.pathBBox(ctrs[i]); dot = { cmds: ctrs[i], b, d: Math.max(b.w, b.h) }; break; }
    }
    if (!dot || !(dot.d > 0)) dot = { cmds: null, b: null, d: ab.h / 5 };
    return { ab, base: al.lineBase[0], dot, N: ab.h / dot.d };
  }
  // un point du calame posé au centre (x, y) : la forme de la police, sinon un losange
  function lnDot(M, x, y) {
    const d = M.dot;
    if (d.cmds) return K.transformPath(d.cmds, 1, x - (d.b.x + d.b.w / 2), y - (d.b.y + d.b.h / 2));
    const r = d.d / 2;
    return [0, x, y - r, 1, x + r, y, 1, x, y + r, 1, x - r, y, 4];
  }

  // ---------- onglets et espace « Apprendre »
  function showSpace(id) {
    const learn = id === 'learn';
    $('#studio').hidden = learn; $('#learn').hidden = !learn;
    if (learn) { $('#spLearn').setAttribute('aria-current', 'page'); $('#spStudio').removeAttribute('aria-current'); lnInit(); }
    else { $('#spStudio').setAttribute('aria-current', 'page'); $('#spLearn').removeAttribute('aria-current'); zoomer.layout(); scheduleBench(); }
    window.scrollTo(0, 0);
  }
  function lnShowTab(id, focus) {
    lnState.tab = id;
    for (const t of $$('.ln-tab')) {
      const on = t.id === 'lt-' + id;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    }
    if (id === 'etude') lnRenderStudy();
    else if (id === 'ecritures') lnScriptCards();
    else if (id === 'exercice') lnRenderSheet();
    const L = $('#learn');
    if (L.scrollTop > 200) L.scrollTop = Math.min(L.scrollTop, $('.ln-tabs').offsetTop);
  }
  function lnInit() {
    if (lnState.built) return;
    lnState.built = true;
    lnHeaderArt();
    lnBuildTable(); lnFillTable();
    lnBuildPickers();
    lnGenres(); lnGeometry();
    lnExerciseUI();
  }
  async function lnHeaderArt() {
    try {
      const hb = await lnReady('thuluth');
      const r = K.buildText(hb, 'تعلّم\nالخطّ العربي', { size: 100, lineHeight: 0.95, align: 'center', color: false });
      if (r.cmds.length) $('#lnArt').innerHTML = lnSvg(r.cmds, r.bbox);
    } catch (e) { /* le titre en texte reste affiché */ }
  }

  // ---------- 1. tableau des lettres
  function lnBuildTable() {
    let h = '<thead><tr><th scope="col">Famille</th>' + LN_SCRIPTS.map(s => '<th scope="col">' + esc(s.fr) + '<span lang="ar">' + s.ar + '</span></th>').join('') + '</tr></thead><tbody>';
    for (const fam of LN_FAMILIES) {
      const names = fam.map(ch => (LN_LETTERS.find(l => l[0] === ch) || [])[2]);
      h += '<tr><th scope="row"><b lang="ar">' + fam.join(' ') + '</b><small>' + esc(names.join(', ')) + '</small></th>';
      for (const s of LN_SCRIPTS) h += '<td><button type="button" class="ln-cell" data-l="' + fam[0] + '" data-s="' + s.id + '" aria-label="' + esc(names[0] + ' en ' + s.fr + ' : étudier') + '"><span class="sk"></span></button></td>';
      h += '</tr>';
    }
    $('#lnTable').insertAdjacentHTML('beforeend', h + '</tbody>');
    $('#lnTable').addEventListener('click', e => {
      const b = e.target.closest('.ln-cell');
      if (!b) return;
      lnState.letter = b.dataset.l; lnState.script = b.dataset.s;
      lnShowTab('etude');
    });
  }
  async function lnFillTable() {
    for (const s of LN_SCRIPTS) {
      let hb = null;
      try { hb = await lnReady(s.id); } catch (e) { /* écriture indisponible : la case reste vide */ }
      for (const b of $$('#lnTable .ln-cell[data-s="' + s.id + '"]')) {
        if (!hb) { b.innerHTML = ''; continue; }
        const r = lnBuild(hb, b.dataset.l, 100);
        b.innerHTML = r.cmds.length ? lnSvg(r.cmds, r.bbox) : '';
      }
      await sleep(0);
    }
  }

  // ---------- 2. étudier une lettre
  function lnBuildPickers() {
    const L = $('#lnLetters');
    for (const l of LN_LETTERS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ln-l'; b.lang = 'ar'; b.textContent = l[0]; b.dataset.v = l[0];
      b.setAttribute('aria-label', l[2]);
      b.addEventListener('click', () => { lnState.letter = l[0]; lnRenderStudy(); });
      L.appendChild(b);
    }
    const S2 = $('#lnScripts');
    for (const s of LN_SCRIPTS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = s.id;
      b.innerHTML = esc(s.fr) + ' <span lang="ar">' + s.ar + '</span>';
      b.addEventListener('click', () => { lnState.script = s.id; lnRenderStudy(); });
      S2.appendChild(b);
    }
    const nib = $('#lnNib');
    [['Fin', 0], ['Calame du modèle', 1], ['Large', 2]].forEach(([lab, v]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = v; b.textContent = lab;
      b.addEventListener('click', () => { lnState.nib = v; syncChips(nib, v); });
      nib.appendChild(b);
    });
    syncChips(nib, lnState.nib);
    $('#lnModel').addEventListener('click', () => { lnState.model = !lnState.model; $('#lnModel').setAttribute('aria-pressed', String(lnState.model)); trDraw(); });
    $('#lnClear').addEventListener('click', () => { if (tr.strokes) tr.strokes.getContext('2d').clearRect(0, 0, tr.w, tr.h); trDraw(); $('#lnScore').textContent = 'Effacé. Recommencez en suivant le modèle.'; });
    lnTraceEvents();
    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (lnState.tab === 'etude' && !$('#learn').hidden && tr.hb) lnTraceSetup(tr.hb, tr.ch, true); }, 200); });
  }
  const syncChips = (box, v) => $$('button', box).forEach(b => b.setAttribute('aria-pressed', String(String(b.dataset.v) === String(v))));
  let lnSeq = 0;
  async function lnRenderStudy() {
    const seq = ++lnSeq;
    $$('#lnLetters .ln-l').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.v === lnState.letter)));
    syncChips($('#lnScripts'), lnState.script);
    const sc = lnScript(lnState.script), info = LN_LETTERS.find(l => l[0] === lnState.letter) || LN_LETTERS[1];
    let hb;
    try { hb = await lnReady(sc.id); } catch (e) { $('#lnForms').textContent = 'Cette écriture n’a pas pu être chargée.'; return; }
    if (seq !== lnSeq) return;
    const ch = info[0], joins = !!info[3];
    // les formes : la jonction est demandée par le caractère « liant sans chasse » (ZWJ)
    const forms = joins ? [['Isolée', ch], ['Initiale', ch + ZWJ], ['Médiane', ZWJ + ch + ZWJ], ['Finale', ZWJ + ch]] : [['Isolée', ch], ['Finale', ZWJ + ch]];
    const built = forms.map(([lab, t]) => [lab, lnBuild(hb, t, 100)]);
    let y0 = Infinity, y1 = -Infinity;
    for (const [, r] of built) if (r.cmds.length) { y0 = Math.min(y0, r.bbox.y); y1 = Math.max(y1, r.bbox.y + r.bbox.h); }
    $('#lnForms').innerHTML = built.map(([lab, r]) => '<div class="ln-form">' + (r.cmds.length ? lnSvg(r.cmds, r.bbox, y0, y1) : '') + '<small>' + lab + '</small></div>').join('');
    $('#lnFormsNote').textContent = joins ? 'La lettre change de forme selon sa place dans le mot : seule, au début, au milieu ou à la fin.' : 'Cette lettre ne se lie jamais à la lettre qui la suit : elle n’a que deux formes, seule et finale.';
    const M = lnMetrics(hb), L = lnBuild(hb, ch, 100);
    lnRenderMeasure(M, L, hb);
    // fiche
    const fam = LN_FAMILIES.find(f => f.includes(ch)) || [ch];
    const rows = [
      ['Lettre', '<bdi class="ar" lang="ar">' + ch + '</bdi> · <bdi lang="ar">' + info[1] + '</bdi> · ' + esc(info[2])],
      ['Famille', '<bdi class="ar" lang="ar">' + fam.join(' ') + '</bdi>' + (fam.length > 1 ? ' · même squelette, points différents' : '')],
      ['Liaison', joins ? 'se lie à la lettre suivante' : 'ne se lie pas à la lettre suivante'],
      ['Formes', joins ? 'quatre : isolée, initiale, médiane, finale' : 'deux : isolée et finale'],
      ['Écriture', esc(sc.fr) + ' <bdi lang="ar">' + sc.ar + '</bdi>'],
      ['Dans cette police', 'alif d’environ <b>' + nf1.format(Math.round(M.N * 2) / 2) + ' points</b> ; cette lettre fait environ ' + nf1.format(Math.round(L.bbox.w / M.dot.d * 2) / 2) + ' points de large']
    ];
    if (sc.id === 'naskh') rows.push(['Repère des maîtres', 'en naskh, l’alif mesure environ cinq points']);
    if (sc.id === 'thuluth') rows.push(['Repère des maîtres', 'en thuluth, l’alif mesure de sept à neuf points selon les écoles']);
    if (sc.id === 'maghribi' && (ch === 'ف' || ch === 'ق')) rows.push(['Particularité', 'en maghribi, le fāʾ porte son point en dessous et le qāf un seul point au-dessus']);
    $('#lnFacts').innerHTML = rows.map(r => '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>').join('');
    lnTraceSetup(hb, ch);
  }
  // figure : cercle d'Ibn Muqla, alif et son échelle de points, la lettre et sa largeur en points, lignes de guidage
  function lnRenderMeasure(M, L, hb) {
    const d = M.dot.d, ab = M.ab, base = M.base, Ha = ab.h, lb = L.bbox, R = Ha / 2;
    const cx = d + R, cy = ab.y + R, gap = d * 2.4;
    const alifX = cx + R + gap, alifDx = alifX - ab.x;
    const ladX = alifX + ab.w + d * 1.2;
    const letX = ladX + d * 2.2 + gap, letDx = letX - lb.x;
    const W = letX + lb.w + d * 1.5;
    const botLet = Math.max(lb.y + lb.h, base);
    const hy = botLet + d * 1.2;
    const top = Math.min(ab.y, lb.y) - d * 1.4, H = hy + d * 2.6 - top;
    const fs = Ha * 0.085;
    let s = '<svg viewBox="0 ' + top.toFixed(1) + ' ' + W.toFixed(1) + ' ' + H.toFixed(1) + '" role="img" aria-label="Mesure en points : alif et lettre étudiée">';
    const sw = Math.max(0.3, d * 0.06);
    s += '<line x1="0" x2="' + W.toFixed(1) + '" y1="' + base.toFixed(1) + '" y2="' + base.toFixed(1) + '" stroke="#8C7B5E" stroke-width="' + sw.toFixed(2) + '"/>';
    s += '<line x1="0" x2="' + W.toFixed(1) + '" y1="' + ab.y.toFixed(1) + '" y2="' + ab.y.toFixed(1) + '" stroke="#B9AE96" stroke-width="' + sw.toFixed(2) + '" stroke-dasharray="' + (d * 0.4).toFixed(1) + ' ' + (d * 0.3).toFixed(1) + '"/>';
    // cercle d'Ibn Muqla : diamètre = alif
    s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + R.toFixed(1) + '" fill="none" stroke="#B08A52" stroke-width="' + (sw * 1.4).toFixed(2) + '"/>';
    s += '<line x1="' + cx.toFixed(1) + '" x2="' + cx.toFixed(1) + '" y1="' + (cy - R).toFixed(1) + '" y2="' + (cy + R).toFixed(1) + '" stroke="#1B1712" stroke-width="' + (d * 0.32).toFixed(2) + '" stroke-linecap="round"/>';
    s += '<line x1="' + (cx - R).toFixed(1) + '" x2="' + (cx + R).toFixed(1) + '" y1="' + cy.toFixed(1) + '" y2="' + cy.toFixed(1) + '" stroke="#B08A52" stroke-width="' + sw.toFixed(2) + '" stroke-dasharray="' + (d * 0.4).toFixed(1) + ' ' + (d * 0.3).toFixed(1) + '"/>';
    s += '<text x="' + cx.toFixed(1) + '" y="' + (cy + R + fs * 1.8).toFixed(1) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" fill="#6B6457">cercle d’Ibn Muqla</text>';
    // alif et ses points
    s += '<path d="' + K.toSVGPath(K.transformPath(lnBuild(hb, 'ا', 100).cmds, 1, alifDx, 0), 1) + '" fill="#1B1712"/>';
    const n = Math.max(1, Math.ceil(M.N - 0.08));
    let dots = '';
    for (let k = 0; k < n; k++) {
      const c = k % 2 ? '#C9A227' : '#1F7A7A';
      dots += '<path d="' + K.toSVGPath(lnDot(M, ladX + d * 0.5 + (k % 2 ? d * 0.45 : 0), ab.y + ab.h - (k + 0.5) * d), 1) + '" fill="' + c + '"/>';
    }
    s += dots + '<text x="' + (ladX + d * 0.7).toFixed(1) + '" y="' + (base + fs * 1.9).toFixed(1) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" fill="#6B6457">' + nf1.format(Math.round(M.N * 2) / 2) + ' points</text>';
    // la lettre et sa largeur
    s += '<path d="' + K.toSVGPath(K.transformPath(L.cmds, 1, letDx, 0), 1) + '" fill="#1B1712"/>';
    const m = Math.max(1, Math.ceil(lb.w / d - 0.08));
    for (let k = 0; k < m; k++) {
      const c = k % 2 ? '#C9A227' : '#1F7A7A';
      s += '<path d="' + K.toSVGPath(lnDot(M, letX + (k + 0.5) * d, hy + (k % 2 ? d * 0.45 : 0)), 1) + '" fill="' + c + '"/>';
    }
    s += '<text x="' + (letX + lb.w / 2).toFixed(1) + '" y="' + (hy + d * 1.5 + fs).toFixed(1) + '" font-size="' + fs.toFixed(1) + '" text-anchor="middle" fill="#6B6457">largeur : ' + nf1.format(Math.round(lb.w / d * 2) / 2) + ' points</text>';
    $('#lnMeasure').innerHTML = s + '</svg>';
  }

  // tracé : un calame à bec plat, incliné, laisse un trait large ou fin selon la direction
  const tr = { hb: null, ch: '', strokes: null, model: null, w: 0, h: 0, base: 0, alifTop: 0, nibBase: 6, drawing: false, last: null, raf: 0 };
  const NIB_ANGLE = -35 * Math.PI / 180;
  function lnTraceSetup(hb, ch, keep) {
    tr.hb = hb; tr.ch = ch;
    const cv = $('#lnCanvas'), rect = cv.getBoundingClientRect();
    if (!rect.width) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(rect.width * dpr); cv.height = Math.round(rect.height * dpr);
    tr.w = cv.width; tr.h = cv.height;
    const M = lnMetrics(hb), r = lnBuild(hb, ch, 100), b = r.bbox;
    const top = Math.min(b.y, M.ab.y), bot = Math.max(b.y + b.h, M.base);
    const k = Math.min(tr.h * 0.78 / Math.max(1, bot - top), tr.w * 0.8 / Math.max(1, b.w));
    const ox = (tr.w - b.w * k) / 2 - b.x * k, oy = (tr.h - (bot - top) * k) / 2 - top * k;
    tr.model = new Path2D(K.toSVGPath(K.transformPath(r.cmds, k, ox, oy), 2));
    tr.base = M.base * k + oy; tr.alifTop = M.ab.y * k + oy;
    tr.nibBase = Math.max(2, M.dot.d * k / Math.SQRT2);
    const old = tr.strokes;
    tr.strokes = document.createElement('canvas'); tr.strokes.width = tr.w; tr.strokes.height = tr.h;
    if (keep && old) tr.strokes.getContext('2d').drawImage(old, 0, 0, tr.w, tr.h);
    else $('#lnScore').textContent = 'Suivez le modèle gris : le calame laisse un trait épais dans un sens, fin dans l’autre.';
    trDraw();
  }
  function trDraw() {
    const cv = $('#lnCanvas'), g = cv.getContext('2d');
    g.clearRect(0, 0, tr.w, tr.h);
    if (!tr.model) return;
    g.save();
    g.lineWidth = Math.max(1, tr.w / 900);
    g.strokeStyle = 'rgba(140,123,94,.55)';
    g.beginPath(); g.moveTo(0, tr.base); g.lineTo(tr.w, tr.base); g.stroke();
    g.setLineDash([8, 6]); g.strokeStyle = 'rgba(185,174,150,.6)';
    g.beginPath(); g.moveTo(0, tr.alifTop); g.lineTo(tr.w, tr.alifTop); g.stroke();
    g.restore();
    if (lnState.model) { g.fillStyle = '#E4DCCA'; g.fill(tr.model); }
    g.drawImage(tr.strokes, 0, 0);
  }
  function trSeg(p0, p1) {
    const g = tr.strokes.getContext('2d'), w = tr.nibBase * [0.7, 1, 1.4][lnState.nib] / 2;
    const nx = Math.cos(NIB_ANGLE) * w, ny = Math.sin(NIB_ANGLE) * w;
    g.fillStyle = '#1B1712';
    g.beginPath();
    g.moveTo(p0.x + nx, p0.y + ny); g.lineTo(p1.x + nx, p1.y + ny); g.lineTo(p1.x - nx, p1.y - ny); g.lineTo(p0.x - nx, p0.y - ny);
    g.closePath(); g.fill();
    if (!tr.raf) tr.raf = requestAnimationFrame(() => { tr.raf = 0; trDraw(); });
  }
  function lnTraceEvents() {
    const cv = $('#lnCanvas');
    const pt = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * tr.w / r.width, y: (e.clientY - r.top) * tr.h / r.height }; };
    cv.addEventListener('pointerdown', e => {
      if (!tr.strokes) return;
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* sans capture */ }
      tr.drawing = true; tr.last = pt(e); trSeg(tr.last, tr.last);
      e.preventDefault();
    });
    cv.addEventListener('pointermove', e => { if (!tr.drawing) return; const p = pt(e); trSeg(tr.last, p); tr.last = p; });
    const end = () => { if (!tr.drawing) return; tr.drawing = false; trScore(); };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end); cv.addEventListener('lostpointercapture', end);
  }
  // note : part du modèle couverte, part de l'encre hors du modèle (image réduite de moitié)
  function trScore() {
    if (!tr.model) return;
    const s = 0.5, w = Math.max(1, Math.round(tr.w * s)), h = Math.max(1, Math.round(tr.h * s));
    const a = document.createElement('canvas'); a.width = w; a.height = h;
    const ga = a.getContext('2d'); ga.scale(s, s); ga.fill(tr.model);
    const md = ga.getImageData(0, 0, w, h).data;
    const b = document.createElement('canvas'); b.width = w; b.height = h;
    const gb = b.getContext('2d'); gb.drawImage(tr.strokes, 0, 0, w, h);
    const sd = gb.getImageData(0, 0, w, h).data;
    let model = 0, ink = 0, both = 0;
    for (let i = 3; i < md.length; i += 4) { const m = md[i] > 127, k = sd[i] > 127; if (m) model++; if (k) { ink++; if (m) both++; } }
    const cov = model ? both / model : 0, out = ink ? (ink - both) / ink : 0;
    const pct = v => nf0.format(Math.round(v * 100)) + ' %';
    let msg = 'Modèle couvert : <b>' + pct(cov) + '</b> · encre hors du modèle : <b>' + pct(out) + '</b>.';
    if (cov >= 0.8 && out <= 0.2) msg += ' Très bien : passez à la forme suivante, ou masquez le modèle pour écrire seul.';
    else if (cov >= 0.5) msg += out > 0.3 ? ' Restez dans le modèle : ralentissez dans les courbes.' : ' Continuez : il reste des parties à couvrir.';
    $('#lnScore').innerHTML = msg;
  }

  // ---------- 3. les écritures
  let lnCardsDone = false;
  async function lnScriptCards() {
    if (lnCardsDone) return;
    lnCardsDone = true;
    const box = $('#lnScriptCards');
    const order = ['kufi', 'naskh', 'thuluth', 'nastaliq', 'diwani', 'ruqaa', 'maghribi'];
    box.innerHTML = order.map(id => {
      const s = lnScript(id), i = LN_INFO[id];
      return '<article class="ln-sc" data-s="' + id + '"><div class="ln-sc-art"><span class="sk"></span></div><div class="ln-sc-b"><h4>' + esc(s.fr) + '<span lang="ar">' + s.ar + '</span></h4>' +
        '<p class="meta2">' + esc(i[0]) + '</p><p>' + esc(i[1]) + '</p><div class="btnrow"><button class="btn" type="button" data-use="' + id + '">Écrire avec cette écriture</button><button class="btn" type="button" data-study="' + id + '">Étudier ses lettres</button></div></div></article>';
    }).join('');
    box.addEventListener('click', e => {
      const u = e.target.closest('[data-use]'), st = e.target.closest('[data-study]');
      if (u) { selectFont(lnScript(u.dataset.use).font); showSpace('studio'); showToolRef('styles'); status('Écriture ' + lnScript(u.dataset.use).fr + ' choisie pour votre phrase.'); }
      else if (st) { lnState.script = st.dataset.study; lnShowTab('etude'); }
    });
    for (const id of order) {
      const art = $('.ln-sc[data-s="' + id + '"] .ln-sc-art', box);
      try {
        const hb = await lnReady(id);
        const r = lnBuild(hb, 'بسم الله الرحمن الرحيم', 100);
        art.innerHTML = r.cmds.length ? lnSvg(r.cmds, r.bbox) : '';
      } catch (e) { art.textContent = ''; }
    }
  }

  // ---------- 4. composer : genres et gabarits géométriques
  function lnGenres() {
    const box = $('#lnGenres');
    box.innerHTML = LN_GENRES.map((g, i) => '<article class="ln-g"><h4>' + esc(g[0]) + '</h4><p>' + esc(g[1]) + '</p>' +
      (g[2] && MODELS.some(m => m.id === g[2]) ? '<div class="btnrow"><button class="btn" type="button" data-model="' + g[2] + '">Essayer ce modèle</button></div>' : '') + '</article>').join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-model]');
      if (!b) return;
      const m = MODELS.find(x => x.id === b.dataset.model);
      if (m) { applyModel(m, true); showSpace('studio'); }
    });
  }
  // gabarit appliqué à la phrase : forme remplie
  function lnTryShape(kind) {
    Object.assign(S.shape, { type: 'fill', fillShape: kind, repeat: 'none' });
    if (kind === 'tri') Object.assign(S.shape, { grow: 100, stretch: 20 });
    if (S.shape.ring === 'none') S.shape.ring = 'single';
    showSpace('studio'); showToolRef('forme');
    syncAllUI(); changed();
  }
  function lnGeometry() {
    const C = '#B08A52', I = '#1B1712', G = '#9A9080';
    const f = v => v.toFixed(1);
    const svg = b => '<svg viewBox="0 0 200 190" aria-hidden="true" focusable="false">' + b + '</svg>';
    const circ = (x, y, r, col, w, dash) => '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 1) + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    const line = (x1, y1, x2, y2, col, w, dash) => '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + col + '" stroke-width="' + (w || 1) + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>';
    const poly = (pts, col, w) => '<polygon points="' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 2) + '" stroke-linejoin="round"/>';
    const dot = (x, y, col) => '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="2.6" fill="' + (col || I) + '"/>';
    const lab = (x, y, t) => '<text x="' + f(x) + '" y="' + f(y) + '" font-size="11" fill="' + G + '" font-family="sans-serif">' + t + '</text>';
    const arcP = (cx, cy, r, a0, a1) => { const p = []; for (let i = 0; i <= 40; i++) { const a = a0 + (a1 - a0) * i / 40; p.push(f(cx + r * Math.cos(a)) + ' ' + f(cy + r * Math.sin(a))); } return p.join(' L'); };
    // hexagone et triangle : le rayon reporté six fois
    const hx = 100, hy = 95, hr = 72, H6 = [];
    for (let k = 0; k < 6; k++) H6.push([hx + hr * Math.cos(-Math.PI / 2 + k * Math.PI / 3), hy + hr * Math.sin(-Math.PI / 2 + k * Math.PI / 3)]);
    let hex = circ(hx, hy, hr, C, 1);
    for (const p of H6) hex += '<path d="M' + arcP(p[0], p[1], hr, Math.atan2(hy - p[1], hx - p[0]) - 0.5, Math.atan2(hy - p[1], hx - p[0]) + 0.5) + '" fill="none" stroke="' + G + '" stroke-width=".8" stroke-dasharray="3 3"/>' + dot(p[0], p[1]);
    hex += poly(H6, I, 2) + poly([H6[0], H6[2], H6[4]], C, 1.3);
    // octogone : diamètres et bissectrices
    let oct = circ(hx, hy, hr, C, 1);
    const O8 = [];
    for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 - Math.PI / 8 + k * Math.PI / 4; O8.push([hx + hr * Math.cos(a), hy + hr * Math.sin(a)]); }
    for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 - Math.PI / 8 + k * Math.PI / 4; oct += line(hx + hr * Math.cos(a), hy + hr * Math.sin(a), hx - hr * Math.cos(a), hy - hr * Math.sin(a), G, 0.8, true); }
    for (const p of O8) oct += dot(p[0], p[1]);
    oct += poly(O8, I, 2);
    // ellipse du jardinier : deux foyers et une ficelle
    const ea = 82, eb = 52, ec = Math.sqrt(ea * ea - eb * eb), ex = 100, ey = 95, ang = 1.1, P = [ex + ea * Math.cos(ang), ey - eb * Math.sin(ang)];
    let ell = '<ellipse cx="' + ex + '" cy="' + ey + '" rx="' + ea + '" ry="' + eb + '" fill="none" stroke="' + I + '" stroke-width="2"/>';
    ell += line(ex - ec, ey, P[0], P[1], C, 1.2) + line(ex + ec, ey, P[0], P[1], C, 1.2) + dot(ex - ec, ey, C) + dot(ex + ec, ey, C) + dot(P[0], P[1]);
    ell += lab(ex - ec - 6, ey + 16, 'F1') + lab(ex + ec - 6, ey + 16, 'F2');
    // œuf : demi-cercle en bas, deux arcs de rayon AB, un petit arc de centre C
    const ox = 100, oy = 118, orr = 46, A = [ox - orr, oy], B = [ox + orr, oy], Cc = [ox, oy - orr], r2 = 2 * orr, q = Math.SQRT1_2;
    const E = [A[0] + r2 * q, A[1] - r2 * q], F = [B[0] - r2 * q, B[1] - r2 * q], rc = Math.hypot(E[0] - Cc[0], E[1] - Cc[1]);
    const eggPath = 'M' + arcP(ox, oy, orr, Math.PI, 0) + ' L' + arcP(A[0], A[1], r2, 0, -Math.PI / 4) + ' L' + arcP(Cc[0], Cc[1], rc, -Math.PI / 4, -3 * Math.PI / 4) + ' L' + arcP(B[0], B[1], r2, -3 * Math.PI / 4, -Math.PI);
    let egg = circ(ox, oy, orr, C, 1, true) + line(A[0], A[1], B[0], B[1], G, 0.8) + line(A[0], A[1], E[0] + 8, E[1] - 8, G, 0.8, true) + line(B[0], B[1], F[0] - 8, F[1] - 8, G, 0.8, true);
    egg += '<path d="' + eggPath + '" fill="none" stroke="' + I + '" stroke-width="2" stroke-linejoin="round"/>' + dot(A[0], A[1], C) + dot(B[0], B[1], C) + dot(Cc[0], Cc[1], C);
    egg += lab(A[0] - 14, A[1] + 4, 'A') + lab(B[0] + 5, B[1] + 4, 'B') + lab(Cc[0] + 4, Cc[1] + 13, 'C');
    // goutte : cercle et deux tangentes depuis la pointe
    const gx = 100, gy = 120, gr = 50, T = [gx, 18], gd = gy - T[1], al = Math.acos(gr / gd);
    const t1 = [gx + gr * Math.cos(-Math.PI / 2 + al), gy + gr * Math.sin(-Math.PI / 2 + al)], t2 = [gx - gr * Math.cos(-Math.PI / 2 + al), t1[1]];
    let drop = circ(gx, gy, gr, C, 1, true) + '<path d="M' + f(T[0]) + ' ' + f(T[1]) + ' L' + f(t1[0]) + ' ' + f(t1[1]) + ' L' + arcP(gx, gy, gr, -Math.PI / 2 + al, 1.5 * Math.PI - al) + ' Z" fill="none" stroke="' + I + '" stroke-width="2" stroke-linejoin="round"/>' + dot(T[0], T[1], C) + dot(t1[0], t1[1]) + dot(t2[0], t2[1]);
    // arc brisé du mihrab : deux arcs de rayon égal à l'ouverture, centrés aux naissances
    const mL = [55, 112], mR = [145, 112], mw = mR[0] - mL[0];
    let mih = '<path d="M' + f(mL[0]) + ' 178 L' + f(mL[0]) + ' ' + f(mL[1]) + ' L' + arcP(mR[0], mR[1], mw, Math.PI, Math.PI + Math.PI / 3) + ' L' + arcP(mL[0], mL[1], mw, -Math.PI / 3, 0) + ' L' + f(mR[0]) + ' 178 Z" fill="none" stroke="' + I + '" stroke-width="2" stroke-linejoin="round"/>';
    mih += line(mL[0], mL[1], mR[0], mR[1], G, 0.8, true) + dot(mL[0], mL[1], C) + dot(mR[0], mR[1], C);
    const figs = [
      ['Hexagone et triangle', hex, ['Tracez un cercle.', 'Sans changer l’écartement du compas, reportez le rayon sur le cercle : il le coupe en six points.', 'Reliez les six points : un hexagone. Un point sur deux : un triangle équilatéral.'], [['hexagon', 'Remplir un hexagone'], ['tri', 'Remplir une pyramide']]],
      ['Octogone', oct, ['Tracez un cercle et deux diamètres perpendiculaires.', 'Coupez chaque angle droit en deux : le cercle porte maintenant huit points.', 'Reliez-les : un octogone régulier.'], [['octagon', 'Remplir un octogone']]],
      ['Ellipse du jardinier', ell, ['Plantez deux clous, les foyers, et nouez une boucle de ficelle plus longue que leur écart.', 'Tendez la ficelle avec le crayon et faites le tour : il trace une ellipse.', 'Plus les clous sont proches, plus l’ellipse est ronde.'], [['oval', 'Remplir un ovale']]],
      ['Œuf', egg, ['Tracez un cercle, son diamètre AB, et marquez C en haut du cercle.', 'Tracez les droites AC et BC, prolongées.', 'Compas ouvert de AB : un arc de centre A depuis B, un arc de centre B depuis A, jusqu’aux droites.', 'Fermez le haut par un petit arc de centre C ; le bas reste le demi-cercle.'], [['egg', 'Remplir un œuf']]],
      ['Goutte', drop, ['Tracez un cercle et choisissez la pointe au-dessus.', 'Depuis la pointe, menez les deux droites qui touchent le cercle.', 'Le contour suit les droites puis le bas du cercle.'], [['drop', 'Remplir une goutte']]],
      ['Arc brisé du mihrab', mih, ['Tracez la ligne de naissance de l’arc et ses deux extrémités.', 'Compas ouvert de toute la largeur : un arc depuis chaque extrémité.', 'Les deux arcs se croisent en pointe au sommet.'], [['arch', 'Remplir un mihrab']]]
    ];
    const box = $('#lnGeo');
    box.innerHTML = figs.map(g => '<figure>' + svg(g[1]) + '<figcaption><b>' + esc(g[0]) + '</b><ol>' + g[2].map(t => '<li>' + esc(t) + '</li>').join('') + '</ol></figcaption><div class="btnrow">' +
      g[3].map(t => '<button class="btn" type="button" data-fill="' + t[0] + '">' + esc(t[1]) + '</button>').join('') + '</div></figure>').join('');
    box.addEventListener('click', e => { const b = e.target.closest('[data-fill]'); if (b) lnTryShape(b.dataset.fill); });
  }

  // ---------- 5. feuille d'exercice
  const LN_NIBS = [1.5, 2.4, 3, 3.8, 6];
  function lnExerciseUI() {
    const sb = $('#lnExScript'), nb = $('#lnExNib');
    for (const s of LN_SCRIPTS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = s.id; b.textContent = s.fr;
      b.addEventListener('click', () => { lnState.exScript = s.id; syncChips(sb, s.id); lnRenderSheet(); });
      sb.appendChild(b);
    }
    for (const n of LN_NIBS) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = n; b.textContent = nf1.format(n) + ' mm';
      b.addEventListener('click', () => { lnState.exNib = n; syncChips(nb, n); lnRenderSheet(); });
      nb.appendChild(b);
    }
    syncChips(sb, lnState.exScript); syncChips(nb, lnState.exNib);
    let t = 0;
    $('#lnExText').addEventListener('input', () => { clearTimeout(t); t = setTimeout(lnRenderSheet, 300); });
    $('#lnExPdf').addEventListener('click', async ev => {
      const b = ev.currentTarget;
      b.setAttribute('aria-busy', 'true');
      try {
        const sh = await lnSheet();
        if (!sh) return;
        const bytes = await KX.practiceToPDF(sh);
        await saveFile('exercice-' + lnState.exScript + '.pdf', new Blob([bytes], { type: 'application/pdf' }));
      } catch (e) { status('La feuille n’a pas pu être préparée.', true); }
      finally { b.removeAttribute('aria-busy'); }
    });
  }
  // page A4 (96 px par pouce) : lignes à la hauteur de l'alif, échelle de points, modèle puis copies de plus en plus pâles
  async function lnSheet() {
    const sc = lnScript(lnState.exScript);
    let hb;
    try { hb = await lnReady(sc.id); } catch (e) { $('#lnExInfo').textContent = 'Cette écriture n’a pas pu être chargée.'; return null; }
    const raw = ($('#lnExText').value || '').trim().replace(/\s+/g, ' ').slice(0, 40) || 'بسم الله';
    const text = K.checkSupport(hb, raw).text;
    const M = lnMetrics(hb), N = M.N, pxmm = 1 / KX.PX2MM;
    const nib = lnState.exNib, dotPx = nib * Math.SQRT2 * pxmm, alifMm = N * nib * Math.SQRT2;
    let alifPx = alifMm * pxmm;
    const W = 794, H = 1123, mx = 45, top0 = 96, bottom = 40;
    const ladW = dotPx * 1.6 + 14;
    let size = 100 * alifPx / M.ab.h, t = lnBuild(hb, text, size), shrink = 1;
    // texte trop long pour une ligne à cette largeur de calame : on réduit (et on le dit)
    const avail = W - 2 * mx - ladW;
    if (t.bbox.w > avail) { shrink = avail / t.bbox.w; size *= shrink; alifPx *= shrink; t = lnBuild(hb, text, size); }
    const base = t.lineBase[0], bb = t.bbox;
    const asc = Math.max(base - bb.y, alifPx), desc = Math.max(bb.y + bb.h - base, alifPx * 0.3);
    const rowH = asc + desc + alifPx * 0.5;
    const rows = Math.max(1, Math.floor((H - top0 - bottom) / rowH));
    const layers = [], labels = [];
    const solidP = c => ({ type: 'solid', color: c });
    const hline = (x0, x1, y, col, w, dash) => {
      const p = [];
      if (!dash) p.push(0, x0, y, 1, x1, y);
      else for (let x = x0; x < x1; x += dash * 1.8) p.push(0, x, y, 1, Math.min(x1, x + dash), y);
      layers.push({ role: 'pattern', path: p, stroke: { color: col, width: w } });
    };
    labels.push({ x: mx, y: 50, size: 17, text: 'Feuille d’exercice - ' + sc.fr, color: '#1B1712' });
    labels.push({ x: mx, y: 70, size: 9.5, text: 'Calame de ' + nf1.format(nib) + ' mm - alif d’environ ' + nf1.format(Math.round(N * 2) / 2) + ' points, soit ' + nf0.format(alifMm * shrink) + ' mm' + (shrink < 0.999 ? ' (réduit pour tenir sur la ligne)' : '') + ' - Atelier Khattat', color: '#6B6457' });
    for (let r = 0; r < rows; r++) {
      const yb = top0 + r * rowH + asc;
      hline(mx, W - mx, yb, '#8C7B5E', 0.9);
      hline(mx, W - mx, yb - alifPx, '#B9AE96', 0.6, 5);
      hline(mx, W - mx, yb - alifPx / 2, '#E2DACB', 0.5, 3);
      // échelle de points en début de ligne (à droite)
      const n = Math.max(1, Math.ceil(N - 0.08)), kd = dotPx / M.dot.d * shrink;
      for (let k = 0; k < n; k++) {
        const c = lnDot(M, 0, 0), p = K.transformPath(c, kd, W - mx - dotPx * 0.6 - (k % 2 ? dotPx * 0.45 : 0), yb - (k + 0.5) * dotPx * shrink);
        layers.push({ role: 'dots', path: p, fill: solidP(k % 2 ? '#C9A227' : '#1F7A7A') });
      }
      // modèle puis copies de plus en plus pâles : sur la même ligne si elles tiennent, sinon une ligne chacune
      const step = bb.w + alifPx * 0.9, op = [1, 0.34, 0.2, 0.11];
      const perRow = Math.max(1, Math.floor((avail + alifPx * 0.9) / step));
      const first = perRow > 1 ? 0 : r, count = perRow > 1 ? Math.min(op.length, perRow >= 3 ? perRow - 1 : perRow) : (r < op.length ? 1 : 0);
      let xr = W - mx - ladW;
      for (let k = 0; k < count; k++) {
        const o = op[first + k];
        layers.push({ role: 'text', path: K.transformPath(t.cmds, 1, xr - (bb.x + bb.w), yb - base), fill: solidP(first + k ? '#5B5348' : '#1B1712'), opacity: o });
        xr -= step;
      }
    }
    const info = 'Avec un calame de ' + nf1.format(nib) + ' mm, l’alif de cette écriture mesure environ ' + nf1.format(Math.round(N * 2) / 2) + ' points, soit ' + nf0.format(alifMm * shrink) + ' mm. La feuille compte ' + rows + ' ligne' + (rows > 1 ? 's' : '') + '.' + (shrink < 0.999 ? ' Le texte a été réduit pour tenir sur une ligne : prenez un calame plus fin ou un texte plus court.' : '');
    $('#lnExInfo').textContent = info;
    return { W, H, layers, labels, title: 'Feuille d’exercice - ' + sc.fr };
  }
  let lnSheetSeq = 0;
  async function lnRenderSheet() {
    const seq = ++lnSheetSeq;
    const sh = await lnSheet();
    if (!sh || seq !== lnSheetSeq) return;
    let svg = KX.sceneToSVG({ W: sh.W, H: sh.H, layers: sh.layers, st: { bg: { type: 'solid', color: '#ffffff' } }, mmPerPx: KX.PX2MM }, { inline: true, idPrefix: 'lnx' });
    const txt = sh.labels.map(l => '<text x="' + l.x + '" y="' + l.y + '" font-size="' + l.size + '" fill="' + l.color + '" font-family="Alegreya Sans, sans-serif">' + esc(l.text) + '</text>').join('');
    svg = svg.replace('</svg>', txt + '</svg>');
    $('#lnExPrev').innerHTML = svg;
  }

  function buildLearn() {
    $('#spLearn').addEventListener('click', () => showSpace('learn'));
    $('#spStudio').addEventListener('click', () => showSpace('studio'));
    const tabs = $$('.ln-tab');
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => lnShowTab(t.id.slice(3)));
      t.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        lnShowTab(n.id.slice(3), true);
      });
    });
  }
