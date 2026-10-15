  // ------------------------------------------------------------------ saisie
  const txt = $('#txt');
  let textT = 0;
  function textChanged(now) {
    clearTimeout(textT);
    const run = () => { prepareText(); renderAllCards(); updateTextUI(); buildLineInkUI(); scheduleBench(); saveSoon(); record(); renderModelsSoon(); if (tkOpen()) buildTashkilPanel(); };
    if (now) run(); else textT = setTimeout(run, 110);
  }
  txt.value = S.text;
  txt.addEventListener('input', () => { S.text = txt.value; textChanged(); });
  // position du curseur mémorisée : le clavier virtuel ne prend pas le focus
  let caret = null;
  const saveCaret = () => { caret = { a: txt.selectionStart, b: txt.selectionEnd }; };
  ['keyup', 'mouseup', 'touchend', 'select', 'input', 'focus'].forEach(ev => txt.addEventListener(ev, saveCaret));
  function setText(v, pos) {
    txt.value = v; S.text = v;
    caret = { a: pos, b: pos };
    try { if (document.activeElement === txt) txt.setSelectionRange(pos, pos); } catch (e) { /* champ non sélectionnable */ }
    textChanged();
  }
  function insertText(str) {
    const v = txt.value;
    const a = caret ? Math.min(caret.a, v.length) : v.length, b = caret ? Math.min(Math.max(caret.a, caret.b), v.length) : a;
    setText(v.slice(0, a) + str + v.slice(b), a + str.length);
  }
  function backspace() {
    const v = txt.value;
    const a = caret ? Math.min(caret.a, v.length) : v.length, b = caret ? Math.min(Math.max(caret.a, caret.b), v.length) : a;
    if (a !== b) return setText(v.slice(0, a) + v.slice(b), a);
    if (a === 0) return;
    const last = Array.from(v.slice(0, a)).pop() || '';
    setText(v.slice(0, a - last.length) + v.slice(a), a - last.length);
  }
  function buildSamples() {
    const box = $('#samples');
    for (const s of SAMPLES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip chip-ar'; b.lang = 'ar'; b.dir = 'rtl'; b.textContent = s;
      b.addEventListener('click', () => { setText(s, s.length); textChanged(true); });
      box.appendChild(b);
    }
  }
  function buildKeyboard() {
    const rows = [
      ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
      ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
      ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ'],
      ['أ', 'إ', 'آ', 'ٱ', 'ـ', '،', '؛', '؟', '!', '«', '»'],
      ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠']
    ];
    const marks = [['َ', 'fatha'], ['ً', 'tanwin fatha'], ['ُ', 'damma'], ['ٌ', 'tanwin damma'], ['ِ', 'kasra'], ['ٍ', 'tanwin kasra'], ['ْ', 'soukoun'], ['ّ', 'chadda'], ['ٰ', 'alif suscrit']];
    const orn = [['﴾', 'parenthèse ornée ouvrante'], ['﴿', 'parenthèse ornée fermante'], ['۞', 'rub el-hizb'], ['۩', 'signe de prosternation'], ['٭', 'étoile'], ['﷽', 'basmala en un signe'], ['ﷲ', 'Allah en un signe'], ['ﷺ', 'salla Allahu ʿalayhi wa sallam'], ['ﷻ', 'jalla jalaluhu']];
    const kb = $('#kbd');
    const mk = (label, onPress, cls, aria) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'key' + (cls ? ' ' + cls : ''); b.textContent = label;
      if (aria) { b.setAttribute('aria-label', aria); b.title = aria; }
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', onPress);
      return b;
    };
    for (const r of rows) {
      const row = document.createElement('div'); row.className = 'krow';
      for (const k of r) row.appendChild(mk(k, () => insertText(k)));
      kb.appendChild(row);
    }
    const mr = document.createElement('div'); mr.className = 'krow';
    for (const [m, name] of marks) mr.appendChild(mk('◌' + m, () => insertText(m), 'mark', name));
    kb.appendChild(mr);
    const or = document.createElement('div'); or.className = 'krow';
    for (const [c, name] of orn) or.appendChild(mk(c, () => insertText(c), 'orn', name));
    kb.appendChild(or);
    const cr = document.createElement('div'); cr.className = 'krow';
    cr.appendChild(mk('Effacer', backspace, 'wide', 'Effacer le caractère précédent'));
    cr.appendChild(mk('Espace', () => insertText(' '), 'wide space'));
    cr.appendChild(mk('À la ligne', () => insertText('\n'), 'wide'));
    kb.appendChild(cr);
    $('#kbdBtn').addEventListener('click', () => {
      const open = kb.hidden;
      kb.hidden = !open;
      $('#kbdBtn').setAttribute('aria-expanded', String(open));
    });
  }

  // ------------------------------------------------------------------ bibliothèque de textes
  let libCat = LIBRARY[0].id, libMode = 'replace';
  function buildLibrary() {
    const cats = $('#libCats');
    for (const c of LIBRARY) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.dataset.v = c.id;
      b.innerHTML = esc(c.fr) + ' <span class="n">' + c.items.length + '</span>';
      b.addEventListener('click', () => { libCat = c.id; syncSeg(cats, libCat); renderLib(); });
      cats.appendChild(b);
    }
    syncSeg(cats, libCat);
    seg($('#libMode'), [['replace', 'Remplacer le texte'], ['line', 'Ajouter une ligne']], () => libMode, v => { libMode = v; }, true);
    renderLib();
    const dlg = $('#lib');
    $('#libBtn').addEventListener('click', () => openDialog(dlg));
    $('#libClose').addEventListener('click', () => closeDialog(dlg));
  }
  function renderLib() {
    const g = $('#libGrid'), c = LIBRARY.find(x => x.id === libCat) || LIBRARY[0];
    g.innerHTML = '';
    for (const [ar, fr] of c.items) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'libitem';
      b.innerHTML = '<span class="ar" lang="ar">' + esc(ar).replace(/\n/g, '<br>') + '</span><small>' + esc(fr) + '</small>';
      b.addEventListener('click', () => {
        const v = libMode === 'line' && txt.value.trim() ? txt.value.replace(/\s+$/, '') + '\n' + ar : ar;
        setText(v, v.length);
        if (hasMarks(ar) && !S.harakat) { S.harakat = true; }
        // légende affichée : elle reprend le nom ou le sens du texte choisi
        if (S.caption.on && libMode !== 'line') { S.caption.text = libraryMeaning(ar) || captionOf(fr); $('#capText').value = S.caption.text; }
        textChanged(true);
        closeDialog($('#lib'));
        status('Texte placé : ' + fr.replace(/\s*\(.*\)$/, '') + '.');
      });
      g.appendChild(b);
    }
  }

  // nom ou sens d'un texte de la bibliothèque, pour la légende (sans la mention « vœu de… » ni les précisions entre parenthèses)
  const captionOf = fr => String(fr || '').replace(/\s*\((?!Coran)[^)]*\)/g, '').trim();
  let libMeaning = null;
  function libraryMeaning(t) {
    if (!libMeaning) { libMeaning = new Map(); for (const c of LIBRARY) for (const it of c.items) { const k = bareKey(it[0]); if (!libMeaning.has(k)) libMeaning.set(k, captionOf(it[1])); } }
    return libMeaning.get(bareKey(t)) || '';
  }

  // ------------------------------------------------------------------ tashkīl (التشكيل)
  const VOWELS = ['َ', 'ُ', 'ِ', 'ْ', 'ً', 'ٌ', 'ٍ', 'ٰ']; // fatha damma kasra soukoun tanwins alif suscrit
  const SHADDA = 'ّ';
  const isMarkCh = ch => K.isMark(ch.charCodeAt(0));
  const isLetterCh = ch => /[ؠ-يٮ-ۓەۺ-ۿݐ-ݿࢠ-ࣉ]/.test(ch);
  // texte découpé en grappes : un caractère de base suivi de ses signes
  function clusters(s) {
    const out = [];
    for (const ch of Array.from(s)) {
      if (isMarkCh(ch) && out.length) out[out.length - 1].marks += ch;
      else out.push({ base: ch, marks: '' });
    }
    return out;
  }
  const joinClusters = cs => cs.map(c => c.base + c.marks).join('');
  let tkSel = -1;
  const tkOpen = () => !$('#tkPanel').hidden;
  function tkStatus(msg, kind) { const el = $('#tkStatus'); el.textContent = msg || ''; el.className = 'tk-status' + (kind ? ' ' + kind : ''); }
  function buildTashkilPanel() {
    const box = $('#tkLetters');
    const cs = clusters(S.text);
    box.innerHTML = '';
    let first = -1;
    cs.forEach((c, i) => {
      if (c.base === '\n') { box.appendChild(Object.assign(document.createElement('span'), { className: 'tk-br' })); return; }
      if (/\s/.test(c.base)) { box.appendChild(Object.assign(document.createElement('span'), { className: 'tk-gap' })); return; }
      if (!isLetterCh(c.base) && c.base !== 'ـ') { const s = document.createElement('span'); s.className = 'tk-other'; s.textContent = c.base; box.appendChild(s); return; }
      if (first < 0) first = i;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tkl'; b.dataset.i = i; b.lang = 'ar';
      b.setAttribute('role', 'option');
      b.textContent = c.base + c.marks;
      b.setAttribute('aria-label', 'Lettre ' + c.base + (c.marks ? ' avec signes' : ''));
      b.setAttribute('aria-selected', String(i === tkSel));
      b.addEventListener('click', () => { tkSel = i; syncTkSel(true); });
      b.addEventListener('keydown', tkKey);
      box.appendChild(b);
    });
    if (tkSel < 0 || !cs[tkSel] || !box.querySelector('[data-i="' + tkSel + '"]')) tkSel = first;
    syncTkSel(false);
  }
  function tkLetterIdx() { return $$('#tkLetters .tkl').map(b => +b.dataset.i); }
  function syncTkSel(focus) {
    $$('#tkLetters .tkl').forEach(b => {
      const on = +b.dataset.i === tkSel;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus({ preventScroll: false });
    });
    const c = clusters(S.text)[tkSel];
    const marks = c ? c.marks : '';
    $$('#tkMarks .tkm').forEach(b => {
      const m = b.dataset.m;
      b.disabled = !c;
      b.setAttribute('aria-pressed', String(m === 'none' ? !marks : m === SHADDA ? marks.includes(SHADDA) : marks.includes(m)));
    });
  }
  function tkKey(e) {
    const idx = tkLetterIdx(), p = idx.indexOf(tkSel);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); if (p < idx.length - 1) { tkSel = idx[p + 1]; syncTkSel(true); } }
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); if (p > 0) { tkSel = idx[p - 1]; syncTkSel(true); } }
    else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); setMark('none'); }
  }
  // signe choisi pour la lettre sélectionnée : une voyelle remplace la précédente, la chadda s'ajoute ou se retire
  function setMark(m) {
    const cs = clusters(S.text), c = cs[tkSel];
    if (!c) return;
    let marks = c.marks;
    if (m === 'none') marks = Array.from(marks).filter(ch => !VOWELS.includes(ch) && ch !== SHADDA).join('');
    else if (m === SHADDA) marks = marks.includes(SHADDA) ? marks.replace(SHADDA, '') : SHADDA + marks;
    else {
      const had = marks.includes(m);
      marks = Array.from(marks).filter(ch => !VOWELS.includes(ch)).join('');
      if (!had) marks = marks.includes(SHADDA) ? marks.replace(SHADDA, SHADDA + m) : marks + m;
    }
    c.marks = marks;
    const v = joinClusters(cs);
    txt.value = v; S.text = v;
    if (!S.harakat) S.harakat = true;
    textChanged(true);
    // passe à la lettre suivante après une voyelle
    if (m !== SHADDA && m !== 'none') {
      const idx = tkLetterIdx(), p = idx.indexOf(tkSel);
      if (p >= 0 && p < idx.length - 1) tkSel = idx[p + 1];
    }
    buildTashkilPanel();
    syncTkSel(true);
  }
  function buildTashkil() {
    const mk = $('#tkMarks');
    const list = [['َ', 'fatha'], ['ُ', 'damma'], ['ِ', 'kasra'], ['ْ', 'soukoun'], [SHADDA, 'chadda'], ['ً', 'tanwīn fatha'], ['ٌ', 'tanwīn damma'], ['ٍ', 'tanwīn kasra'], ['ٰ', 'alif suscrit']];
    for (const [m, name] of list) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'tkm'; b.dataset.m = m; b.lang = 'ar';
      b.textContent = '◌' + m; b.title = name; b.setAttribute('aria-label', name);
      b.addEventListener('click', () => setMark(m));
      mk.appendChild(b);
    }
    const none = document.createElement('button');
    none.type = 'button'; none.className = 'tkm txt'; none.dataset.m = 'none'; none.textContent = 'Aucun signe';
    none.addEventListener('click', () => setMark('none'));
    mk.appendChild(none);
    $('#tkEdit').addEventListener('click', () => showTkPanel($('#tkPanel').hidden));
    $('#tkToggle').addEventListener('click', tkToggle);
    $('#tkAuto').addEventListener('click', autoTashkil);
    $('#tkStop').addEventListener('click', () => { if (tkCtl) tkCtl.abort(); });
    // vocalisation automatique : disponible quand l'atelier peut interroger Claude
    sampleP.then(fn => { tkClaude = !!fn; $('#tkAuto').hidden = !fn; syncTkUI(); });
    syncTkUI();
  }
  function showTkPanel(open) {
    $('#tkPanel').hidden = !open;
    $('#tkEdit').setAttribute('aria-expanded', String(open));
    if (open) { buildTashkilPanel(); const b = $('#tkLetters .tkl[aria-selected="true"]'); if (b) b.focus(); }
  }

  // ------------------------------------------------------------------ tashkīl : retirer, afficher, remettre, ajouter
  // Un seul bouton, dont l'action suit le texte :
  //   texte vocalisé → « Retirer » (la version vocalisée est gardée) ; signes masqués → « Afficher » ;
  //   tashkīl retiré → « Remettre » ; texte connu de l'atelier → « Ajouter » (bibliothèque, modèles, exemples) ;
  //   autre texte → « Ajouter » ouvre l'éditeur lettre par lettre (avec Claude : « Vocaliser automatiquement »).
  let tkClaude = false;
  // un texte sans ses signes : lettres seules, espaces et retours à la ligne réduits
  const bareKey = t => K.stripMarks(String(t)).replace(/ٱ/g, 'ا').replace(/ـ/g, '').replace(/\s+/g, ' ').trim();
  let tkCat = null;
  function tkCatalogue() {
    if (tkCat) return tkCat;
    tkCat = new Map();
    const add = v => { if (typeof v === 'string' && hasMarks(v)) { const k = bareKey(v); if (k && !tkCat.has(k)) tkCat.set(k, v); } };
    for (const c of LIBRARY) for (const it of c.items) { add(it[2]); add(it[0]); }
    for (const v of TK_EXTRA) add(v);
    for (const m of MODELS) add(m.ex);
    return tkCat;
  }
  // tashkīl d'après le catalogue : le texte entier, sinon chaque ligne connue ; les lettres restent celles de l'utilisateur
  function catalogMarks(t) {
    const cat = tkCatalogue(), whole = cat.get(bareKey(t));
    const w = whole ? remapMarks(t, whole) : null;
    if (w) return { v: w, all: true };
    let n = 0, m = 0;
    const v = t.split('\n').map(line => {
      if (!line.trim()) return line;
      m++;
      const voc = hasMarks(line) ? null : cat.get(bareKey(line)), r = voc ? remapMarks(line, voc) : null;
      if (r) n++;
      return r || line;
    }).join('\n');
    return n ? { v, all: n === m } : null;
  }
  // tashkīl retiré puis remis : à l'identique si les lettres n'ont pas changé, sinon sur les mots restés les mêmes
  function carryMarks(t, voc) {
    if (!voc || !hasMarks(voc)) return null;
    if (bareKey(t) === bareKey(voc)) { const r = remapMarks(t, voc); if (r) return { v: r, all: true }; }
    const pool = new Map();
    for (const w of voc.split(/\s+/)) { if (!w) continue; const k = bareKey(w); if (!pool.has(k)) pool.set(k, []); pool.get(k).push(w); }
    let n = 0, m = 0;
    const v = t.replace(/\S+/g, w => {
      m++;
      const list = hasMarks(w) ? null : pool.get(bareKey(w));
      const r = list ? remapMarks(w, list.length > 1 ? list.shift() : list[0]) : null;
      if (r) n++;
      return r || w;
    });
    return n ? { v, all: n === m } : null;
  }
  function tkPlan() {
    const t = S.text;
    if (!t.trim()) return { m: 'none' };
    if (hasMarks(t)) return { m: S.harakat ? 'clear' : 'show' };
    const back = S.tkBackup ? carryMarks(t, S.tkBackup) : null;
    if (back) return Object.assign({ m: 'restore' }, back);
    const cat = catalogMarks(t);
    if (cat) return Object.assign({ m: 'catalog' }, cat);
    return { m: 'add' };
  }
  const TK_LABEL = { clear: 'Retirer le tashkīl', show: 'Afficher le tashkīl', restore: 'Remettre le tashkīl', catalog: 'Ajouter le tashkīl', add: 'Ajouter le tashkīl' };
  function syncTkUI() {
    const b = $('#tkToggle');
    if (!b) return;
    const p = tkPlan();
    // sans signe ni texte connu, la vocalisation de Claude (bouton voisin) fait l'ajout
    b.hidden = p.m === 'none' || (p.m === 'add' && tkClaude);
    b.textContent = TK_LABEL[p.m] || TK_LABEL.clear;
    b.dataset.mode = p.m;
    b.classList.toggle('prim', p.m === 'restore' || p.m === 'catalog');
  }
  function tkToggle() {
    const p = tkPlan(), before = S.text;
    if (p.m === 'clear') {
      S.tkBackup = before;
      setText(K.stripMarks(before), 0);
      textChanged(true);
      tkStatus('Tashkīl retiré. « Remettre le tashkīl » le rétablit.', 'ok');
    } else if (p.m === 'show') {
      S.harakat = true;
      textChanged(true);
      tkStatus('Tashkīl affiché.', 'ok');
    } else if (p.m === 'restore' || p.m === 'catalog') {
      txt.value = p.v; S.text = p.v; S.harakat = true;
      textChanged(true);
      if (p.m === 'restore') tkStatus(p.all ? 'Tashkīl remis.' : 'Tashkīl remis sur les mots qui n’ont pas changé.', 'ok');
      else tkStatus((p.all ? 'Tashkīl ajouté' : 'Tashkīl ajouté sur les lignes que l’atelier connaît') + ' (texte de la bibliothèque ou des modèles). Vérifiez-le ; « Annuler » revient au texte d’avant.', 'ok');
    } else if (p.m === 'add') {
      showTkPanel(true);
      tkStatus('Ce texte n’est pas dans la bibliothèque de l’atelier : ajoutez les signes lettre par lettre ci-dessous.');
    }
    if (before !== S.text) commitHist();
  }
  const sampleP = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('sample').catch(() => null) : Promise.resolve(null);
  let tkCtl = null;
  // replace les signes de la réponse sur le texte d'origine : lettres, espaces et retours à la ligne restent ceux de l'utilisateur
  function remapMarks(orig, answer) {
    const norm = ch => ch === 'ٱ' ? 'ا' : ch;
    const keep = c => !/\s/.test(c.base) && c.base !== 'ـ';
    const A = clusters(orig), B = clusters(answer.normalize('NFC'));
    const a = A.filter(keep), b = B.filter(keep);
    if (a.length !== b.length) return null;
    for (let i = 0; i < a.length; i++) if (norm(a[i].base) !== norm(b[i].base)) return null;
    for (let i = 0; i < a.length; i++) {
      const m = Array.from(b[i].marks).filter(ch => K.isMark(ch.charCodeAt(0))).join('');
      if (m) a[i].marks = m;
    }
    return joinClusters(A);
  }
  async function autoTashkil() {
    const sample = await sampleP;
    if (!sample) return;
    const src = S.text.trim() ? S.text : '';
    if (!src) return tkStatus('Écrivez d’abord une phrase en arabe.', 'err');
    if (src.length > 1500) return tkStatus('Texte trop long pour la vocalisation automatique (1 500 caractères au plus).', 'err');
    const btn = $('#tkAuto');
    btn.setAttribute('aria-busy', 'true'); btn.disabled = true;
    $('#tkStop').hidden = false;
    tkStatus('Vocalisation en cours… (Claude vérifie la grammaire de la phrase)');
    tkCtl = new AbortController();
    const prompt = 'You are an expert in Arabic grammar and orthography. Add complete and correct diacritics (tashkīl: fatḥa, ḍamma, kasra, sukūn, shadda, tanwīn) to the Arabic text below, including case endings (iʿrāb) according to the grammar of the sentence. If the text is a verse of the Qurʾān, follow the standard Ḥafṣ vocalization. ' +
      'Keep the text EXACTLY as written: the same letters, the same hamza forms, the same spaces, punctuation and line breaks. Never add, remove, replace or reorder a letter or a word, never use alef waṣla (ٱ), and keep any diacritic that is already present. ' +
      'Reply with only this JSON object: {"text": "<the fully vocalized text, with \\n for line breaks>"}\n\nText:\n<<<\n' + src + '\n>>>';
    try {
      const res = await sample.json(prompt, { signal: tkCtl.signal, modelTier: 'default' });
      const out = res && typeof res.text === 'string' ? res.text : '';
      const merged = out ? remapMarks(S.text, out) : null;
      if (!merged) { tkStatus('La proposition modifiait des lettres : elle n’a pas été appliquée. Réessayez ou utilisez l’éditeur lettre par lettre.', 'err'); return; }
      txt.value = merged; S.text = merged; S.harakat = true;
      textChanged(true); commitHist();
      tkStatus('Tashkīl ajouté. Vérifiez-le et corrigez une lettre au besoin avec l’éditeur ; « Annuler » revient au texte d’avant.', 'ok');
    } catch (e) {
      const c = e && e.code;
      if (c === 'cancelled') tkStatus('Vocalisation arrêtée.');
      else if (c === 'not_granted' || c === 'sampling_disabled' || c === 'not_declared' || c === 'capability_disabled' || c === 'capability_removed') { tkStatus('La vocalisation automatique n’est pas autorisée ici. L’éditeur lettre par lettre reste disponible.', 'err'); $('#tkAuto').hidden = true; tkClaude = false; syncTkUI(); }
      else if (c === 'rate_limited') tkStatus('Trop de demandes pour le moment : réessayez dans un instant.', 'err');
      else if (c === 'session_expired') tkStatus('Votre session Claude a expiré : reconnectez-vous puis réessayez.', 'err');
      else if (c === 'refused') tkStatus('Ce texte n’a pas pu être vocalisé.', 'err');
      else tkStatus('La vocalisation a échoué (' + (c || 'erreur') + '). Réessayez.', 'err');
    } finally {
      btn.removeAttribute('aria-busy'); btn.disabled = false;
      $('#tkStop').hidden = true;
      tkCtl = null;
    }
  }
