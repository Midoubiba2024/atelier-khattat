  // ------------------------------------------------------------------ messages
  const statusEl = $('#status'), toastEl = $('#toast');
  let toastT = 0;
  function status(msg, err) {
    statusEl.textContent = msg || ''; statusEl.classList.toggle('err', !!err);
    if (!msg) return;
    toastEl.textContent = msg; toastEl.classList.toggle('err', !!err); toastEl.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), err ? 6000 : 3500);
  }
  function openDialog(d) { if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  function closeDialog(d) { if (d.close) d.close(); else d.removeAttribute('open'); }

  // ------------------------------------------------------------------ téléchargement
  // 1) capacité « downloads » de Claude : la fenêtre de Claude demande la confirmation, puis enregistre ;
  // 2) page ouverte seule (hors cadre) : lien de téléchargement direct ;
  // 3) cadre protégé sans téléchargement (application Claude sur ordinateur…) : fenêtre « Votre fichier est prêt »
  //    (ouvrir l'atelier dans le navigateur avec le code de la création, copier l'image ou le SVG, lien direct)
  const VIEW_URL = 'https://claude.ai/artifact/TBG6v5iUzAMH6rLZfFhuFg';
  const downloadsP = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('downloads').catch(() => null) : Promise.resolve(null);
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const fmtBytes = n => n < 1048576 ? nf1.format(Math.max(0.1, n / 1024)) + ' Ko' : nf1.format(n / 1048576) + ' Mo';
  function anchorDownload(name, blob) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  // note : avertissement à joindre (texte coupé par le format…)
  async function saveFile(name, data, note) {
    const blob = data instanceof Blob ? data : new Blob([data]);
    const dl = await downloadsP;
    if (dl) {
      // la confirmation reste ouverte le temps de répondre : l'atelier n'est pas bloqué pendant ce temps
      dl.save({ filename: name, data: blob }).then(
        () => status(name + ' enregistré.' + (note ? ' ' + note : ''), !!note),
        e => {
          const c = e && e.code;
          if (c === 'declined') status('Téléchargement annulé.');
          else if (c === 'rate_limited') status('Une demande de téléchargement est déjà ouverte : répondez-y puis réessayez.', true);
          else if (c === 'too_large') status('Fichier trop lourd pour cette destination : choisissez une résolution plus basse.', true);
          else offerFile(name, blob, note, 'enregistrement refusé par cette fenêtre (' + (c || 'erreur inconnue') + ')');
        });
      return;
    }
    if (!framed) { anchorDownload(name, blob); status(name + ' téléchargé.' + (note ? ' ' + note : ''), !!note); return; }
    offerFile(name, blob, note, window.claude ? 'cette fenêtre ne propose pas les téléchargements' : 'page intégrée sans téléchargement');
  }
  // copie de texte : presse-papiers asynchrone, sinon ancienne commande de copie (autorisée dans plus de fenêtres)
  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) { /* refusée ici */ }
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
    (document.querySelector('dialog[open]') || document.body).appendChild(ta);
    let ok = false;
    try { ta.select(); ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  async function copyImage(blob) {
    if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) throw new Error('copie d’image non prise en charge');
    // promesse passée à ClipboardItem : la copie reste rattachée au clic
    const png = blob.type === 'image/png' ? blob : createImageBitmap(blob).then(bmp => {
      const cv = document.createElement('canvas'); cv.width = bmp.width; cv.height = bmp.height;
      cv.getContext('2d').drawImage(bmp, 0, 0);
      return toBlob(cv, 'image/png');
    });
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
  }
  const fbDlg = $('#dlfb');
  let fb = null; // { name, blob, url, kind }
  async function offerFile(name, blob, note, why) {
    if (fb && fb.url) URL.revokeObjectURL(fb.url);
    const ext = (name.split('.').pop() || '').toLowerCase();
    fb = { name, blob, url: URL.createObjectURL(blob), kind: /^(png|jpe?g|webp)$/.test(ext) ? 'image' : ext === 'svg' ? 'svg' : null };
    $('#dlfbName').textContent = name;
    $('#dlfbSize').textContent = fmtBytes(blob.size);
    const nt = $('#dlfbNote'); nt.textContent = note || ''; nt.hidden = !note;
    $('#dlfbCopyWay').hidden = !fb.kind;
    if (fb.kind === 'image') {
      $('#dlfbCopy').textContent = 'Copier l’image';
      $('#dlfbCopyHint').textContent = 'Collez-la ensuite (Ctrl+V) dans Word, PowerPoint, Paint, un e-mail ou WhatsApp.';
    } else if (fb.kind === 'svg') {
      $('#dlfbCopy').textContent = 'Copier le SVG';
      $('#dlfbCopyHint').textContent = 'Collez-le ensuite (Ctrl+V) dans Illustrator, Inkscape ou Figma : le dessin reste vectoriel. Collé dans le Bloc-notes puis enregistré avec l’extension .svg, il redevient un fichier.';
    }
    const direct = $('#dlfbDirect'); direct.href = fb.url; direct.download = name;
    $('#dlfbTech').textContent = 'Détail : ' + why + '.';
    $('#dlfbUrl').textContent = VIEW_URL;
    $('#dlfbOpen').href = VIEW_URL;
    const code = $('#dlfbCode');
    code.value = '';
    openDialog(fbDlg);
    status('Ce fichier ne peut pas être enregistré directement dans cette fenêtre : voyez les solutions proposées.', true);
    try { code.value = await creationCode(); } catch (e) { code.value = ''; }
  }
  function buildDownloads() {
    // cadre sans capacité de téléchargement : on le dit avant le clic
    downloadsP.then(dl => { if (!dl && framed) $('#dlHint').hidden = false; });
    $('#dlfbClose').addEventListener('click', () => closeDialog(fbDlg));
    fbDlg.addEventListener('close', () => { if (fb && fb.url) setTimeout(() => { if (fb && !fbDlg.open) { URL.revokeObjectURL(fb.url); fb = null; } }, 60000); });
    $('#dlfbOpen').addEventListener('click', () => {
      const t = $('#dlfbCode').value;
      if (!t) return;
      copyText(t).then(ok => status(ok ? 'Code de la création copié : dans l’atelier ouvert dans le navigateur, collez-le dans la zone de texte (Ctrl+V).'
        : 'Copiez le code affiché (sélection puis Ctrl+C), puis collez-le dans l’atelier ouvert dans le navigateur.', !ok));
    });
    $('#dlfbCode').addEventListener('focus', e => e.target.select());
    $('#dlfbCopy').addEventListener('click', async () => {
      if (!fb || !fb.kind) return;
      try {
        if (fb.kind === 'image') await copyImage(fb.blob);
        else if (!(await copyText(await fb.blob.text()))) throw new Error('copie refusée');
        status(fb.kind === 'image' ? 'Image copiée : collez-la (Ctrl+V) dans le logiciel de votre choix.' : 'SVG copié : collez-le (Ctrl+V) dans Illustrator, Inkscape ou Figma.');
      } catch (e) { status('La copie n’est pas autorisée dans cette fenêtre : passez par le navigateur.', true); }
    });
  }
  function fileBase(f) {
    f = f || currentFont();
    return 'calligraphie-' + (f ? (f.user ? slug(f.name) : f.id) : 'arabe');
  }
  function toBlob(cv, type, q) { return new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('Image trop grande pour ce navigateur.')), type, q)); }
  async function rasterBlob(sc, kind, scale, maxSide) {
    const MAXSIDE = maxSide || 12000;
    let k = scale;
    if (Math.max(sc.W, sc.H) * k > MAXSIDE) k = MAXSIDE / Math.max(sc.W, sc.H);
    if (sc.W * sc.H * k * k > 120e6) k = Math.sqrt(120e6 / (sc.W * sc.H));
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(sc.W * k)); cv.height = Math.max(1, Math.round(sc.H * k));
    const ctx = cv.getContext('2d');
    if (kind === 'jpg' && (sc.st.bg.type === 'none')) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, cv.width, cv.height); }
    KX.drawScene(ctx, sc, k, bgImage && bgImage.img);
    const type = kind === 'png' ? 'image/png' : kind === 'jpg' ? 'image/jpeg' : 'image/webp';
    const blob = await toBlob(cv, type, 0.93);
    if (kind === 'webp') return blob;
    // la résolution (ppp) inscrite dans le fichier donne la bonne taille à l'impression
    const dpi = 25.4 * k / (sc.mmPerPx || 25.4 / 96);
    let bytes = new Uint8Array(await blob.arrayBuffer());
    bytes = kind === 'png' ? KX.setPngDpi(bytes, dpi) : KX.setJpegDpi(bytes, dpi);
    return new Blob([bytes], { type });
  }
  function b64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  async function bakedBackground(sc) {
    if (sc.st.bg.type !== 'image' || !bgImage) return null;
    const r = Math.min(2, 3200 / Math.max(sc.W, sc.H));
    const w = Math.max(1, Math.round(sc.W * r)), h = Math.max(1, Math.round(sc.H * r));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'), img = bgImage.img;
    const iw = img.naturalWidth, ih = img.naturalHeight, k = Math.max(w / iw, h / ih);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, (w - iw * k) / 2, (h - ih * k) / 2, iw * k, ih * k);
    if (sc.st.bg.veil > 0) { ctx.globalAlpha = sc.st.bg.veil; ctx.fillStyle = sc.st.bg.veilColor === 'light' ? '#FFFFFF' : '#000000'; ctx.fillRect(0, 0, w, h); }
    const jpeg = new Uint8Array(await (await toBlob(cv, 'image/jpeg', 0.9)).arrayBuffer());
    return { jpeg, w, h, href: 'data:image/jpeg;base64,' + b64(jpeg) };
  }
  function readme(sc, merged) {
    const f = sc.font, fm = famOf(f);
    const W = sc.W, H = sc.H, base = fileBase();
    const lines = [
      'Atelier Khattat : fichiers de votre calligraphie',
      '',
      'Texte : ' + S.text.replace(/\s+/g, ' ').trim(),
      'Style : ' + f.name + (fm.fr ? ' (' + fm.fr + ')' : ''),
      'Forme : ' + ((SHAPES.find(x => x.id === S.shape.type) || SHAPES[0]).name) + (S.shape.repeat !== 'none' ? ', composition ' + (REPEATS.find(r => r[0] === S.shape.repeat) || [, ''])[1].toLowerCase() : '') + (S.shape.width !== 100 ? ', largeur des lettres ' + S.shape.width + ' %' : ''),
      'Taille réelle (PDF, EPS, SVG, DXF) : ' + fmtDims(W * sc.mmPerPx, H * sc.mmPerPx) + ' ; images : ' + nf0.format(Math.round(W * S.scale)) + ' × ' + nf0.format(Math.round(H * S.scale)) + ' px à ' + Math.round(25.4 * S.scale / sc.mmPerPx) + ' ppp',
      '',
      'Contenu du pack (formats vectoriels : nets à toutes les tailles)',
      '- ' + base + '.svg : vectoriel avec couleurs, effets et fond (Illustrator, Inkscape, Figma, navigateur).',
      '- ' + base + '.pdf : vectoriel, prêt pour l’imprimeur, à la taille réelle.',
      '- ' + base + '.eps : vectoriel PostScript (Illustrator, CorelDRAW, logiciels d’imprimerie).',
      '- ' + base + '-decoupe.dxf : contours ' + (merged ? 'fusionnés' : 'non fusionnés') + ' en millimètres pour découpe laser, CNC ou plasma (AutoCAD, LibreCAD, LightBurn).',
      '- ' + base + '-decoupe.svg : mêmes contours, en noir, pour plotter de découpe vinyle (Cricut, Silhouette).',
      '- ' + base + '.png : image ×' + S.scale + (sc.st.bg.type === 'none' ? ', fond transparent.' : '.'),
      '',
      'Remarques',
      '- Les fichiers de découpe contiennent les lettres et le cadre (sans fond, motif, ombre ni effets lumineux).',
      '- En PDF et EPS, l’ombre est nette et le halo néon devient des anneaux translucides ; le flou n’existe qu’en PNG, JPG, WEBP et SVG.',
      f.user ? '- Police importée : vérifiez sa licence avant un usage commercial.' : '- Police sous licence libre (' + (LICNAME[f.lic] || 'SIL Open Font License 1.1') + ') : voir LICENCE-POLICE.txt.'
    ];
    if (!merged) lines.push('- La fusion des contours n’a pas pu être chargée : les lettres liées se chevauchent dans le DXF.');
    return '﻿' + lines.join('\r\n') + '\r\n';
  }
  async function licenceText(f) {
    if (!f || !f.lic) return '';
    try { const r = await fetch('fonts/licenses/' + f.lic + '.txt'); if (r.ok) return await r.text(); } catch (e) { /* licence absente */ }
    return '';
  }
  // styles à exporter en lot ou en planche : favoris, sinon styles affichés dans la galerie
  function batchList(max) {
    let list = FONTS.filter(f => isFav(f.id)), src = 'fav';
    if (!list.length) { list = FONTS.filter(f => f.wrap && !f.wrap.hidden); src = 'filter'; }
    return { list: list.slice(0, max), src, total: list.length };
  }
  function updateBatchLabels() {
    const b = batchList(60);
    const n = Math.min(b.total, 60);
    $('#sheetSub').textContent = b.src === 'fav' ? n + ' favori' + (n > 1 ? 's' : '') : n + ' style' + (n > 1 ? 's' : '') + ' affiché' + (n > 1 ? 's' : '');
    const n2 = Math.min(b.total, 40);
    $('#batchSub').textContent = 'SVG + PNG · ' + (b.src === 'fav' ? n2 + ' favori' + (n2 > 1 ? 's' : '') : n2 + ' style' + (n2 > 1 ? 's' : ''));
  }
  // scène d'un autre style avec tous les réglages en cours
  function sceneForFont(f, quality, extra) {
    const hb = hbFor(f, f.id === S.fontId);
    const t = textFor(hb);
    const chk = K.checkSupport(hb, t);
    const st = Object.assign(sceneSettings(), extra || {});
    const sc = KX.buildScene(hb, chk.text, st, null, { quality: quality || 'preview' });
    sc.font = f; sc.missing = chk.missing;
    return sc;
  }
  async function loadAll(list, label) {
    let done = 0;
    await Promise.all(list.map(f => ensureFont(f).then(() => { done++; status(label + ' : chargement des polices ' + done + '/' + list.length + '…'); }, () => { done++; })));
    return list.filter(f => f.state === 'ready');
  }
  let busy = false;
  async function doExport(kind, btn) {
    if (busy) return;
    if (!(kind === 'sheet' || kind === 'batch')) {
      const cur = currentFont();
      if (!cur || cur.state !== 'ready' || !prepared.trim()) return status('Écrivez d’abord une phrase et choisissez un style.', true);
    }
    busy = true; btn.setAttribute('aria-busy', 'true');
    const base = fileBase();
    // texte plus grand que le format fixe : le fichier le coupe, comme l'aperçu
    const cutNote = sc => sc && sc.overflow ? 'Attention : le texte dépasse du format, il est coupé dans ce fichier. « Ajuster la taille » corrige cela.' : '';
    try {
      if (kind === 'png' || kind === 'jpg' || kind === 'webp') {
        status('Création de l’image…');
        const sc = await exportScene();
        await saveFile(base + '.' + kind, await rasterBlob(sc, kind, S.scale), cutNote(sc));
      } else if (kind === 'svg') {
        const sc = await exportScene();
        const bg = await bakedBackground(sc);
        await saveFile(base + '.svg', new Blob([KX.sceneToSVG(sc, { title: S.text, imageHref: bg && bg.href, veilBaked: true })], { type: 'image/svg+xml' }), cutNote(sc));
      } else if (kind === 'pdf') {
        status('Création du PDF vectoriel…');
        const sc = await exportScene();
        const bg = await bakedBackground(sc);
        await saveFile(base + '.pdf', new Blob([await KX.sceneToPDF(sc, { title: S.text, image: bg })], { type: 'application/pdf' }), cutNote(sc));
      } else if (kind === 'cut') {
        status('Fusion des contours…');
        const sc = await exportScene();
        const ok = !!window.ClipperLib;
        await saveFile(base + '-decoupe.svg', new Blob([KX.sceneToCutSVG(sc, '#000000')], { type: 'image/svg+xml' }), ok ? cutNote(sc) : 'Contours non fusionnés : la bibliothèque de fusion n’a pas pu être chargée.');
      } else if (kind === 'zip') {
        status('Préparation du pack vectoriel…');
        const sc = await exportScene();
        const merged = !!window.ClipperLib;
        const bg = await bakedBackground(sc);
        const lic = sc.font.user ? '' : await licenceText(sc.font);
        const files = [
          { name: base + '.svg', data: KX.sceneToSVG(sc, { title: S.text, imageHref: bg && bg.href, veilBaked: true }) },
          { name: base + '.pdf', data: await KX.sceneToPDF(sc, { title: S.text, image: bg }) },
          { name: base + '.eps', data: KX.sceneToEPS(sc, { titleAscii: base, image: bg }) },
          { name: base + '-decoupe.dxf', data: KX.sceneToDXF(sc) },
          { name: base + '-decoupe.svg', data: KX.sceneToCutSVG(sc, '#000000') },
          { name: base + '.png', data: new Uint8Array(await (await rasterBlob(sc, 'png', S.scale)).arrayBuffer()) },
          { name: 'LISEZ-MOI.txt', data: readme(sc, merged) }
        ];
        if (lic) files.push({ name: 'LICENCE-POLICE.txt', data: lic });
        const zip = await KX.makeZip(files);
        await saveFile(base + '.zip', new Blob([zip], { type: 'application/zip' }), cutNote(sc));
      } else if (kind === 'copy') {
        if (!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem)) throw new Error('la copie d’image n’est pas prise en charge par ce navigateur ; téléchargez le PNG');
        const scP = exportScene();
        // ClipboardItem reçoit une promesse : la copie reste liée au clic (Safari)
        const item = new ClipboardItem({ 'image/png': scP.then(sc => rasterBlob(sc, 'png', Math.min(S.scale, 2), 4000)) });
        try { await navigator.clipboard.write([item]); status('Image copiée : collez-la dans un message ou un document.'); }
        catch (e) { throw new Error('la copie n’est pas autorisée ici ; téléchargez le PNG'); }
      } else if (kind === 'sheet') {
        await ensureClipper();
        const { list, src } = batchList(60);
        if (!list.length) throw new Error('aucun style à mettre sur la planche');
        const ready = await loadAll(list, 'Planche');
        const cells = [];
        for (let i = 0; i < ready.length; i++) {
          const f = ready[i];
          status('Planche : ' + (i + 1) + '/' + ready.length + ' styles…');
          try { cells.push({ sc: sceneForFont(f, 'preview'), label: f.name, sub: (famOf(f).fr || '') + (f.user ? ' · police importée' : '') }); } catch (e) { console.warn(e); }
          if (i % 4 === 3) await sleep(0);
        }
        const d = new Date();
        const pdf = await KX.sheetToPDF(cells, { title: 'Atelier Khattat - planche de styles', subtitle: cells.length + ' styles ' + (src === 'fav' ? 'favoris' : 'affichés') + ' - ' + d.toLocaleDateString('fr-FR') });
        await saveFile('planche-calligraphie.pdf', new Blob([pdf], { type: 'application/pdf' }));
      } else if (kind === 'batch') {
        await ensureClipper();
        const { list } = batchList(40);
        if (!list.length) throw new Error('aucun style à exporter');
        const ready = await loadAll(list, 'Lot');
        const files = [], lics = new Map(), cells = [];
        for (let i = 0; i < ready.length; i++) {
          const f = ready[i];
          status('Lot : ' + (i + 1) + '/' + ready.length + ' styles…');
          try {
            const sc = sceneForFont(f, 'export');
            const n = String(i + 1).padStart(2, '0') + '-' + (f.user ? slug(f.name) : f.id);
            const bg = await bakedBackground(sc);
            files.push({ name: n + '.svg', data: KX.sceneToSVG(sc, { title: S.text, imageHref: bg && bg.href, veilBaked: true }) });
            files.push({ name: n + '.png', data: new Uint8Array(await (await rasterBlob(sc, 'png', Math.min(S.scale, 2), 3000)).arrayBuffer()) });
            cells.push({ sc, label: f.name, sub: famOf(f).fr || '' });
            if (f.lic && !lics.has(f.lic)) lics.set(f.lic, await licenceText(f));
          } catch (e) { console.warn(e); }
          await sleep(0);
        }
        files.push({ name: 'planche.pdf', data: await KX.sheetToPDF(cells, { title: 'Atelier Khattat - lot de styles', subtitle: cells.length + ' styles' }) });
        for (const [lic, t] of lics) if (t) files.push({ name: 'licences/' + lic + '.txt', data: t });
        files.push({ name: 'LISEZ-MOI.txt', data: '﻿Atelier Khattat : lot de styles\r\n\r\nTexte : ' + S.text.replace(/\s+/g, ' ').trim() + '\r\n\r\nChaque style est livré en SVG (vectoriel, net à toutes les tailles) et en PNG.\r\nplanche.pdf : tous les styles sur une planche A4 vectorielle.\r\nlicences/ : licences libres des polices utilisées.\r\n' });
        status('Compression du lot…');
        await saveFile('lot-calligraphie.zip', new Blob([await KX.makeZip(files)], { type: 'application/zip' }));
      }
    } catch (e) {
      console.error(e);
      status('L’export a échoué : ' + (e && e.message ? e.message : e), true);
    } finally { busy = false; btn.removeAttribute('aria-busy'); }
  }
