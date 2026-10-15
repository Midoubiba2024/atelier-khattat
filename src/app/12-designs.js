  // ------------------------------------------------------------------ mes créations
  const dDlg = $('#designs');
  let designs = [];
  const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  function syncDesignsCount() { $('#designsCount').textContent = designs.length ? designs.length : ''; }
  async function thumbBlob() {
    const sc = lastScene;
    if (!sc || sc.empty) return null;
    try { return await rasterBlob(sc, 'png', Math.min(1, 360 / Math.max(sc.W, sc.H))); } catch (e) { return null; }
  }
  function stateForSave() { const o = {}; for (const k of Object.keys(S)) if (!UI_KEYS.includes(k)) o[k] = S[k]; return JSON.stringify(o); }
  async function saveDesign(name) {
    const f = currentFont();
    const nm = String(name || '').trim() || (S.text.replace(/\s+/g, ' ').trim().slice(0, 40) || 'Création') + ' · ' + (f ? f.name : '');
    const rec = { id: 'd' + Date.now(), name: nm.slice(0, 80), date: Date.now(), state: stateForSave(), thumb: await thumbBlob(), bg: S.bg.type === 'image' && bgImage ? bgImage.blob || null : null, bgName: bgImage ? bgImage.name : '' };
    try { await IDB.put('designs', rec); }
    catch (e) { status('Ce navigateur ne peut pas enregistrer de création (stockage indisponible).', true); return; }
    designs.unshift(rec);
    syncDesignsCount();
    if (dDlg.open) renderDesigns();
    status('« ' + rec.name + ' » est enregistrée dans Mes créations.');
  }
  let dUrls = [];
  function renderDesigns() {
    for (const u of dUrls) URL.revokeObjectURL(u);
    dUrls = [];
    const g = $('#dgrid');
    g.innerHTML = '';
    $('#dempty').hidden = designs.length > 0;
    for (const d of designs) {
      const c = document.createElement('div');
      c.className = 'dcard';
      let img = '';
      if (d.thumb instanceof Blob) { const u = URL.createObjectURL(d.thumb); dUrls.push(u); img = '<img src="' + u + '" alt="">'; }
      c.innerHTML = img + '<b></b><small>' + esc(dateFmt.format(new Date(d.date || 0))) + '</small><div class="acts"><button type="button" data-a="open">Ouvrir</button><button type="button" data-a="dup">Dupliquer</button><button type="button" class="danger" data-a="del">Supprimer</button></div>';
      c.querySelector('b').textContent = d.name;
      c.querySelector('[data-a=open]').addEventListener('click', () => openDesign(d));
      c.querySelector('[data-a=dup]').addEventListener('click', async () => {
        const rec = Object.assign({}, d, { id: 'd' + Date.now(), name: (d.name + ' (copie)').slice(0, 80), date: Date.now() });
        try { await IDB.put('designs', rec); designs.unshift(rec); syncDesignsCount(); renderDesigns(); } catch (e) { status('Copie impossible.', true); }
      });
      const del = c.querySelector('[data-a=del]');
      del.addEventListener('click', () => confirmClick(del, 'Confirmer ?', async () => {
        await IDB.del('designs', d.id);
        designs = designs.filter(x => x.id !== d.id);
        syncDesignsCount(); renderDesigns();
      }));
      g.appendChild(c);
    }
  }
  async function openDesign(d) {
    let o;
    try { o = JSON.parse(d.state); } catch (e) { return status('Cette création est illisible.', true); }
    if (d.bg instanceof Blob) { try { await setBgImage(d.bg, d.bgName); } catch (e) { /* photo illisible : fond transparent */ } }
    commitHist();
    replaceState(o);
    commitHist();
    if (o.fontId && !fontById(o.fontId)) status('La police de cette création n’est plus dans la galerie : un autre style est utilisé.', true);
    else status('« ' + d.name + ' » ouverte. « Annuler » revient à la création précédente.');
    closeDialog(dDlg);
  }
  // ------------------------------------------------------------------ code d'une création
  // une ligne de texte (« KHATTAT1:… ») qui transporte le texte et tous les réglages d'une fenêtre ou d'un appareil
  // à l'autre (application de bureau → navigateur, ordinateur → téléphone) ; la photo de fond n'y est pas
  const b64u = bytes => b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  function unb64u(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function pipeBytes(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
  async function creationCode() {
    const bytes = new TextEncoder().encode(stateForSave());
    if (window.CompressionStream) { try { return 'KHATTAT1:' + b64u(await pipeBytes(bytes, new CompressionStream('deflate-raw'))); } catch (e) { /* compression indisponible */ } }
    return 'KHATTAT0:' + b64u(bytes);
  }
  const CODE_RE = /KHATTAT([01]):([A-Za-z0-9_-]{8,})/;
  const isCode = t => CODE_RE.test(String(t || '').replace(/\s+/g, ''));
  async function importCreation(text) {
    const m = CODE_RE.exec(String(text || '').replace(/\s+/g, ''));
    if (!m) return false;
    let o;
    try {
      let bytes = unb64u(m[2]);
      if (m[1] === '1') {
        if (!window.DecompressionStream) throw new Error('décompression indisponible');
        bytes = await pipeBytes(bytes, new DecompressionStream('deflate-raw'));
      }
      o = JSON.parse(new TextDecoder().decode(bytes));
      if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error('code vide');
    } catch (e) { status('Ce code de création est incomplet ou abîmé : recopiez-le en entier.', true); return true; }
    commitHist();
    replaceState(o);
    commitHist();
    if (dDlg.open) closeDialog(dDlg);
    if (o.fontId && !fontById(o.fontId)) status('Création importée, mais sa police (importée sur l’autre appareil) n’est pas ici : un autre style est utilisé.', true);
    else status('Création importée. « Annuler » revient à la précédente.');
    return true;
  }
  // ------------------------------------------------------------------ partage : lien de la création, partage natif
  // le lien mène toujours au site public, qui s'ouvre partout (même depuis l'application Claude ou un serveur local)
  const SHARE_BASE = 'https://midoubiba2024.github.io/atelier-khattat/';
  async function shareUrl() { return SHARE_BASE + '#' + await creationCode(); }
  function buildShare() {
    $('#shareNative').hidden = typeof navigator.share !== 'function';
    let files = false;
    try { files = !!(navigator.canShare && navigator.canShare({ files: [new File([new Uint8Array(8)], 'a.png', { type: 'image/png' })] })); } catch (e) { files = false; }
    $('#shareImg').hidden = !files;
    $('#shareLink').addEventListener('click', async () => {
      const url = await shareUrl(), out = $('#shareOut');
      if (await copyText(url)) { out.hidden = true; status('Lien copié : envoyez-le, il ouvre votre création dans l’atelier en ligne.'); }
      else { out.value = url; out.hidden = false; out.focus(); out.select(); status('Copiez le lien affiché (Ctrl+C), puis envoyez-le.', true); }
    });
    $('#shareOut').addEventListener('focus', e => e.target.select());
    $('#shareNative').addEventListener('click', async () => {
      const url = await shareUrl();
      try { await navigator.share({ title: 'Atelier Khattat', text: S.text.replace(/\s+/g, ' ').trim(), url }); }
      catch (e) {
        if (e && e.name === 'AbortError') return;
        if (await copyText(url)) status('Partage indisponible dans cette fenêtre : le lien a été copié.');
        else status('Partage indisponible dans cette fenêtre : utilisez « Copier le lien ».', true);
      }
    });
    $('#shareImg').addEventListener('click', async () => {
      try {
        const sc = await exportScene();
        const blob = await rasterBlob(sc, 'png', 2, 4096);
        await navigator.share({ files: [new File([blob], fileBase() + '.png', { type: 'image/png' })], title: 'Atelier Khattat' });
      } catch (e) { if (e && e.name !== 'AbortError') status('Le partage de l’image n’est pas possible ici : téléchargez le PNG.', true); }
    });
    window.addEventListener('hashchange', importFromHash);
  }
  // un lien de partage (…#KHATTAT1:…) ouvre la création ; l'adresse est ensuite nettoyée
  function importFromHash() {
    let h = '';
    try { h = decodeURIComponent(location.hash || ''); } catch (e) { h = location.hash || ''; }
    if (!isCode(h)) return;
    importCreation(h.slice(1)).then(() => { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* adresse inchangée */ } });
  }
  function buildDesigns() {
    $('#designsBtn').addEventListener('click', () => { renderDesigns(); openDialog(dDlg); $('#dname').focus(); });
    $('#designsClose').addEventListener('click', () => closeDialog(dDlg));
    // un code collé n'importe où dans l'atelier (zone de texte comprise) est importé au lieu d'être inséré
    document.addEventListener('paste', e => {
      const t = e.clipboardData && e.clipboardData.getData('text/plain');
      if (t && t.length < 200000 && isCode(t)) { e.preventDefault(); e.stopPropagation(); importCreation(t); }
    }, true);
    $('#dcodeIn').addEventListener('input', e => { if (isCode(e.target.value)) { const v = e.target.value; e.target.value = ''; importCreation(v); } });
    $('#dcodeCopy').addEventListener('click', async () => {
      const code = await creationCode();
      const out = $('#dcodeOut');
      if (await copyText(code)) { out.hidden = true; status('Code copié : collez-le (Ctrl+V) dans l’atelier ouvert sur l’autre appareil ou dans le navigateur.'); }
      else { out.value = code; out.hidden = false; out.focus(); out.select(); status('Copiez le code affiché (Ctrl+C), puis collez-le dans l’atelier ouvert ailleurs.', true); }
    });
    $('#dcodeOut').addEventListener('focus', e => e.target.select());
    $('#dsaveForm').addEventListener('submit', e => { e.preventDefault(); saveDesign($('#dname').value); $('#dname').value = ''; });
    $('#saveBtn').addEventListener('click', () => saveDesign(''));
    IDB.all('designs').then(recs => { designs = (recs || []).sort((a, b) => (b.date || 0) - (a.date || 0)); syncDesignsCount(); });
  }
