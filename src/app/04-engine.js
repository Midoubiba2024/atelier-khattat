  // ------------------------------------------------------------------ moteur
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = () => res(); s.onerror = () => { s.remove(); rej(new Error('Échec du chargement de ' + src)); };
      document.head.appendChild(s);
    });
  }
  const engineP = (async () => {
    try {
      if (typeof WebAssembly !== 'object') throw new Error('WebAssembly absent');
      const r = await fetch('harfbuzz.wasm');
      if (!r.ok) throw new Error('harfbuzz.wasm : ' + r.status);
      await K.HB.initWasm(await r.arrayBuffer());
    } catch (e) {
      console.warn('[Khattat] WebAssembly indisponible, moteur JavaScript utilisé :', e && e.message);
      await loadScript('hb-fallback.js');
      K.HB.initAsm(window.__hbAsm);
    }
    $('#engineInfo').textContent = K.HB.mode === 'wasm' ? 'Moteur : WebAssembly.' : 'Moteur : JavaScript (WebAssembly bloqué ici).';
  })();
  engineP.catch(e => {
    console.error(e);
    showMsg('Le moteur d’écriture n’a pas pu démarrer. Rechargez la page.');
  });
  // Clipper (effets, cadres, fusion des contours) : copie locale, sinon CDN
  let clipperP = null;
  function ensureClipper() {
    if (window.ClipperLib) return Promise.resolve(true);
    if (!clipperP) {
      clipperP = loadScript('clipper.js')
        .catch(() => loadScript('https://cdn.jsdelivr.net/npm/clipper-lib@6.4.2/clipper.js'))
        .then(() => !!window.ClipperLib, () => { clipperP = null; return false; });
    }
    return clipperP;
  }

  const fontById = id => FONTS.find(f => f.id === id);
  // Fichiers de police partagés entre les styles (une police variable sert à plusieurs graisses)
  const FILES = new Map();
  const fileRec = id => { let r = FILES.get(id); if (!r) { r = { id, state: 'idle', promise: null, hb: null }; FILES.set(id, r); } return r; };
  const queue = [];
  let active = 0;
  function pump() { while (active < 4 && queue.length) queue.shift()(); }
  function fetchFont(path) {
    return fetch(path).then(r => { if (!r.ok) throw new Error(path + ' : ' + r.status); return r.arrayBuffer(); });
  }
  function syncStyles(rec) {
    for (const f of FONTS) {
      if (f.user || f.file !== rec.id) continue;
      f.state = rec.state; f.hb = rec.hb;
      renderCard(f);
    }
  }
  function ensureFile(id, priority) {
    const rec = fileRec(id);
    if (rec.state === 'ready') return Promise.resolve(rec);
    if (rec.promise) { if (priority) bump(id); return rec.promise; }
    rec.state = 'loading';
    syncStyles(rec);
    rec.promise = new Promise((resolve, reject) => {
      const job = async () => {
        active++;
        try {
          const buf = await fetchFont('fonts/' + id + '.ttf');
          await engineP;
          rec.hb = new K.Font(buf);
          const st = FONTS.find(x => x.file === id && x.feat);
          if (st) rec.hb.defaultFeatures = st.feat;
          rec.state = 'ready';
          resolve(rec);
        } catch (e) {
          console.warn(e);
          rec.state = 'error'; rec.promise = null;
          reject(e);
        } finally { active--; syncStyles(rec); pump(); }
      };
      job.file = id;
      if (priority) queue.unshift(job); else queue.push(job);
      pump();
    });
    return rec.promise;
  }
  function bump(id) { const i = queue.findIndex(j => j.file === id); if (i > 0) queue.unshift(queue.splice(i, 1)[0]); }
  function ensureFont(f, priority) {
    if (!f) return Promise.reject(new Error('style inconnu'));
    if (f.user || f.state === 'ready') return Promise.resolve(f);
    return ensureFile(f.file, priority).then(() => f);
  }
  // police réglée pour un style (graisse imposée par le style ou par le curseur de graisse du style courant)
  function hbFor(f, useUserWeight) {
    const hb = f.hb, v = Object.assign({}, f.vars || {});
    if (useUserWeight && S.wght != null) {
      const ax = hb.axes.find(a => a.tag === 'wght');
      if (ax) v.wght = Math.min(ax.max, Math.max(ax.min, S.wght));
    }
    hb.setVariations(v);
    return hb;
  }

  // ------------------------------------------------------------------ texte
  let prepared = '', preparedK = '';
  function prepText(raw, harakat, kashida) {
    let t = String(raw || '').replace(/\r/g, '');
    if (!harakat) t = K.stripMarks(t);
    return { t, k: kashida ? t.split('\n').map(l => K.addKashida(l, kashida)).join('\n') : t };
  }
  function prepareText() {
    const p = prepText(S.text, S.harakat, S.kashida);
    prepared = p.t; preparedK = p.k;
    return prepared;
  }
  // texte à dessiner pour une police : la kashida n'est appliquée que si la police sait l'étirer
  const textFor = hb => (S.kashida && hb.kashidaOK ? preparedK : prepared);
  const hasMarks = t => /[ً-ٰٟۖ-ۭ]/.test(t);
