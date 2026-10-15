  const K = window.Khatt, KX = window.KhattExport, KSH = window.KhattShape, ORN = window.KhattOrn, KFX = window.KhattFX, KM = window.KhattMockup;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const clone = o => JSON.parse(JSON.stringify(o));
  const nf0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const fold = s => String(s).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const ICON = d => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + d + '</svg>';

  // ------------------------------------------------------------------ catalogue des styles
  const COPYRIGHTS = /*@COPYRIGHTS@*/{};
  // licences autres que la SIL Open Font License
  const LICNAME = {
    tanha: 'licences Bitstream Vera et Apache 2.0, modifications dans le domaine public',
    nahid: 'licences Bitstream Vera et Apache 2.0, modifications dans le domaine public'
  };
  const FAMILIES = [
    { id: 'all', fr: 'Tous', note: 'Toutes les écritures disponibles, de la plus classique à la plus moderne.' },
    { id: 'fav', fr: '★ Favoris', note: 'Vos styles favoris (touchez ☆ sur une carte) : comparez-les en plein écran, imprimez leur planche PDF ou exportez-les en lot.' },
    { id: 'naskh', fr: 'Naskh', ar: 'النسخ', note: 'Naskh : l’écriture des livres et des corans imprimés, régulière et très lisible ; avec le khush khat d’Asie du Sud.' },
    { id: 'thuluth', fr: 'Thuluth', ar: 'الثلث', note: 'Thuluth : l’écriture monumentale des mosquées et des grands panneaux, aux hampes hautes et aux courbes amples.' },
    { id: 'diwani', fr: 'Diwani', ar: 'الديواني', note: 'Diwani : l’écriture de la chancellerie ottomane, aux lettres enlacées et penchées.' },
    { id: 'ruqaa', fr: 'Ruqʿa', ar: 'الرقعة', note: 'Ruqʿa : l’écriture rapide du quotidien, née à l’époque ottomane, aux traits courts et serrés.' },
    { id: 'kufi', fr: 'Kufi', ar: 'الكوفي', note: 'Kufi : la plus ancienne des écritures, anguleuse et monumentale, celle des inscriptions.' },
    { id: 'maghribi', fr: 'Maghribi', ar: 'المغربي', note: 'Maghribi : l’écriture d’Afrique du Nord et d’Andalousie, aux courbes généreuses et aux boucles ouvertes.' },
    { id: 'nastaliq', fr: 'Nastaʿlīq', ar: 'النستعليق', note: 'Nastaʿlīq : l’écriture « suspendue » persane, dont les mots descendent en cascade.' },
    { id: 'soudani', fr: 'Soudani', ar: 'السوداني', note: 'Soudani : les écritures d’Afrique de l’Ouest, héritières du maghribi, au calame épais.' },
    { id: 'deco', fr: 'Décoratif', ar: 'زخرفي', note: 'Décoratif : styles d’affiche et de titrage, lettres ombrées, ajourées, pixel, pour les enseignes et les visuels.' },
    { id: 'couleur', fr: 'Couleur', ar: 'ملوّن', note: 'Polices en couleur : chaque lettre porte ses propres teintes, conservées dans tous les formats vectoriels.' },
    { id: 'moderne', fr: 'Moderne', ar: 'حديث', note: 'Moderne : lettres contemporaines, pour les logos et les supports numériques.' },
    { id: 'mine', fr: 'Mes polices', note: 'Vos polices importées. Elles restent enregistrées dans ce navigateur.' }
  ];
  // chaque style = un fichier de police + éventuellement une graisse ou d'autres axes (police variable)
  const WN = { 100: 'Fin', 200: 'Extra-léger', 300: 'Léger', 400: '', 500: 'Medium', 600: 'Demi-gras', 700: 'Gras', 800: 'Extra-gras', 900: 'Noir', 1000: 'Ultra-noir' };
  const FONTS = [];
  function fam(famId, fname, note, lic, variants, feat) {
    // variants : [id, fichier, graisse|null, libellé|null, autres axes]
    for (const [id, file, w, label, extra] of variants) {
      const wl = label != null ? label : (w ? WN[w] : '');
      FONTS.push({
        id, file, fam: famId, fname, lic, state: 'idle', feat: feat || null,
        name: fname + (wl ? ' ' + wl : ''),
        note: note + (wl ? ' · ' + wl.toLowerCase() : ''),
        vars: w || extra ? Object.assign(w ? { wght: w } : {}, extra || {}) : null
      });
    }
  }
  const NOLIGA = ['-liga']; // ligature « Allah » défectueuse dans les polices Layla
  // Naskh
  fam('naskh', 'Amiri', 'Naskh de Boulaq, le classique des livres', 'amiri', [['amiri', 'amiri', null], ['amiri-bold', 'amiri-bold', null, 'Gras'], ['amiri-italic', 'amiri-italic', null, 'Italique'], ['amiri-bolditalic', 'amiri-bolditalic', null, 'Gras italique']]);
  fam('naskh', 'Amiri Quran', 'Naskh coranique, signes de récitation', 'amiriquran', [['amiri-quran', 'amiri-quran', null]]);
  fam('naskh', 'Kitab', 'Naskh classique des livres anciens', 'kitab', [['kitab', 'kitab', null], ['kitab-bold', 'kitab-bold', null, 'Gras']]);
  fam('naskh', 'Scheherazade New', 'Naskh traditionnel, très lisible', 'scheherazadenew', [['scheherazade', 'scheherazade', null], ['scheherazade-bold', 'scheherazade-bold', null, 'Gras']]);
  fam('naskh', 'Noto Naskh Arabic', 'Naskh d’édition, sobre et net', 'notonaskharabic', [['noto-naskh', 'noto-naskh', 400], ['noto-naskh-bold', 'noto-naskh', 700]]);
  fam('naskh', 'Markazi Text', 'Naskh de lecture aux formes douces', 'markazitext', [['markazi', 'markazi', 400], ['markazi-bold', 'markazi', 700]]);
  fam('naskh', 'Mirza', 'Naskh d’inspiration persane', 'mirza', [['mirza', 'mirza', null], ['mirza-bold', 'mirza-bold', null, 'Gras']]);
  fam('naskh', 'Katibeh', 'Naskh de titrage à la plume large', 'katibeh', [['katibeh', 'katibeh', null]]);
  fam('naskh', 'Lateef', 'Naskh sindhi, plume fine', 'lateef', [['lateef-light', 'lateef-light', null, 'Léger'], ['lateef', 'lateef', null], ['lateef-bold', 'lateef-bold', null, 'Gras'], ['lateef-extrabold', 'lateef-extrabold', null, 'Extra-gras']]);
  fam('naskh', 'Parastoo', 'Naskh persan contemporain', 'parastoo', [['parastoo', 'parastoo', 400], ['parastoo-bold', 'parastoo', 700]]);
  fam('naskh', 'Mothanna', 'Naskh robuste à la plume carrée', 'mothanna', [['mothanna', 'mothanna', null], ['mothanna-bold', 'mothanna-bold', null, 'Gras'], ['mothanna-oblique', 'mothanna-oblique', null, 'Penché'], ['mothanna-bold-oblique', 'mothanna-bold-oblique', null, 'Gras penché']]);
  fam('naskh', 'XB Zar', 'Naskh persan des livres', 'xbzar', [['xb-zar', 'xb-zar', null], ['xb-zar-bold', 'xb-zar-bold', null, 'Gras']]);
  fam('naskh', 'Noon', 'Naskh contemporain aux courbes souples', 'noon', [['noon', 'noon', null]]);
  fam('naskh', 'Layla Basic Arabic', 'Naskh simple et régulier', 'layla', [['layla-basicarabic', 'layla-basicarabic', null]], NOLIGA);
  fam('naskh', 'Jameel Khushkhati', 'Khush khat d’Asie du Sud, plume large', 'jameelkhushkhati', [['jameel-khushkhati', 'jameel-khushkhati', null]]);
  fam('naskh', 'Dehalvi Khush Khat', 'Khush khat de Delhi, tracé fin', 'dehalvikhushkhat', [['dehalvi-khushkhat', 'dehalvi-khushkhat', null]]);
  fam('naskh', 'Urdu Khush Khati', 'Khush khat ourdou, souple', 'urdukhushkhati', [['urdu-khushkhati', 'urdu-khushkhati', null]]);
  fam('naskh', 'Qurran Arabic', 'Naskh coranique d’Asie du Sud', 'qurranarabic', [['qurran-arabic', 'qurran-arabic', null]]);
  // Thuluth, Diwani
  fam('thuluth', 'Layla Thuluth', 'Thuluth aux hampes hautes et aux courbes amples', 'layla', [['layla-thuluth', 'layla-thuluth', null]], NOLIGA);
  fam('diwani', 'Layla Diwani', 'Diwani ottoman, lettres enlacées et penchées', 'layla', [['layla-diwani', 'layla-diwani', null]], NOLIGA);
  // Ruqʿa
  fam('ruqaa', 'Aref Ruqaa', 'Ruqʿa ottomane, vive et serrée', 'arefruqaa', [['aref-ruqaa', 'aref-ruqaa', null], ['aref-ruqaa-bold', 'aref-ruqaa-bold', null, 'Gras']]);
  fam('ruqaa', 'Rakkas', 'Ruqʿa d’affiche, très noire', 'rakkas', [['rakkas', 'rakkas', null]]);
  fam('ruqaa', 'Layla Ruqaa', 'Ruqʿa à la plume, trait vif', 'layla', [['layla-ruqaa', 'layla-ruqaa', null]], NOLIGA);
  // Kufi
  fam('kufi', 'Reem Kufi', 'Kufi fatimide aux angles nets', 'reemkufi', [['reem-kufi', 'reem-kufi', 400], ['reem-kufi-bold', 'reem-kufi', 700]]);
  fam('kufi', 'Qahiri', 'Kufi mamelouk du Caire', 'qahiri', [['qahiri', 'qahiri', null]]);
  fam('kufi', 'Kufam', 'Kufi contemporain', 'kufam', [['kufam', 'kufam', 400], ['kufam-black', 'kufam', 900], ['kufam-italic', 'kufam-italic', 400, 'Italique'], ['kufam-black-italic', 'kufam-italic', 900, 'Noir italique']]);
  fam('kufi', 'Noto Kufi Arabic', 'Kufi typographique', 'notokufiarabic', [['noto-kufi-thin', 'noto-kufi', 100], ['noto-kufi', 'noto-kufi', 400], ['noto-kufi-black', 'noto-kufi', 900]]);
  fam('kufi', 'Layla Koufi', 'Kufi géométrique en blocs', 'layla', [['layla-koufi', 'layla-koufi', null]], NOLIGA);
  // Maghribi
  fam('maghribi', 'Bouazzi Maghribi', 'Maghribi d’Afrique du Nord, d’après Ahmed Bouazzi', 'bouazzimaghribi', [['bouazzi-maghribi', 'bouazzi-maghribi', null]]);
  // Nastaʿlīq
  fam('nastaliq', 'Gulzar', 'Nastaʿlīq de Lahore, lignes en cascade', 'gulzar', [['gulzar', 'gulzar', null]]);
  fam('nastaliq', 'Noto Nastaliq Urdu', 'Nastaʿlīq ourdou', 'notonastaliqurdu', [['noto-nastaliq', 'noto-nastaliq', 400], ['noto-nastaliq-bold', 'noto-nastaliq', 700]]);
  // Soudani
  fam('soudani', 'Alkalami', 'Style de Kano (Nigeria)', 'alkalami', [['alkalami', 'alkalami', null]]);
  fam('soudani', 'Ruwudu', 'Style manga du Niger', 'ruwudu', [['ruwudu', 'ruwudu', null], ['ruwudu-bold', 'ruwudu-bold', null, 'Gras']]);
  fam('soudani', 'Harmattan', 'Naskh d’Afrique de l’Ouest', 'harmattan', [['harmattan', 'harmattan', null], ['harmattan-bold', 'harmattan-bold', null, 'Gras']]);
  // Décoratif
  fam('deco', 'Lalezar', 'Affiche persane', 'lalezar', [['lalezar', 'lalezar', null]]);
  fam('deco', 'Jomhuria', 'Titrage massif', 'jomhuria', [['jomhuria', 'jomhuria', null]]);
  fam('deco', 'Badeen Display', 'Affiche géométrique', 'badeendisplay', [['badeen', 'badeen', null]]);
  fam('deco', 'Blaka', 'Gothique arabe', 'blaka', [['blaka', 'blaka', null]]);
  fam('deco', 'Blaka Hollow', 'Gothique arabe ajouré', 'blakahollow', [['blaka-hollow', 'blaka-hollow', null]]);
  fam('deco', 'XB Kayhan', 'Titrage persan à effet', 'xbkayhan', [['xb-kayhan-pook', 'xb-kayhan-pook', null, 'Contour'], ['xb-kayhan-sayeh', 'xb-kayhan-sayeh', null, 'Ombré'], ['xb-kayhan-navaar', 'xb-kayhan-navaar', null, 'Rayé']]);
  fam('deco', 'Vibes', 'Monoligne aérien', 'vibes', [['vibes', 'vibes', null]]);
  fam('deco', 'Oi', 'Lettres gonflées, très noires', 'oi', [['oi', 'oi', null]]);
  fam('deco', 'Ario', 'Affiche très noire', 'ario', [['ario', 'ario', null]]);
  fam('deco', 'Handjet', 'Modulaire, esprit mosaïque', 'handjet', [['handjet-thin', 'handjet', 100], ['handjet', 'handjet', 400], ['handjet-black', 'handjet', 900]]);
  fam('deco', 'Lemonada', 'Rondeurs d’affiche', 'lemonada', [['lemonada-light', 'lemonada', 300], ['lemonada-bold', 'lemonada', 700]]);
  fam('deco', 'Baloo Bhaijaan', 'Rond et joyeux', 'baloobhaijaan2', [['baloo', 'baloo-bhaijaan', 400], ['baloo-extrabold', 'baloo-bhaijaan', 800]]);
  fam('deco', 'Marhey', 'Manuscrit décontracté', 'marhey', [['marhey-light', 'marhey', 300], ['marhey-bold', 'marhey', 700]]);
  fam('deco', 'Playpen Sans Arabic', 'Écriture à la main, souple', 'playpensansarabic', [['playpen-thin', 'playpen', 100], ['playpen', 'playpen', 400], ['playpen-extrabold', 'playpen', 800]]);
  fam('deco', 'Amiri Typewriter', 'Naskh de machine à écrire', 'amiritypewriter', [['amiri-typewriter', 'amiri-typewriter', null], ['amiri-typewriter-bold', 'amiri-typewriter-bold', null, 'Gras']]);
  fam('deco', 'Layla Boxer', 'Lettres carrées et trapues', 'layla', [['layla-boxer', 'layla-boxer', null]], NOLIGA);
  fam('deco', 'Layla ArcyArc', 'Arrondi et aérien', 'layla', [['layla-arcyarc', 'layla-arcyarc', null]], NOLIGA);
  fam('deco', 'Layla Digital', 'Esprit écran numérique', 'layla', [['layla-digital', 'layla-digital', null]], NOLIGA);
  fam('deco', 'SI47ASH Sole', 'Blocs géométriques, esprit pochoir', 'si47ashsole', [['sole-light', 'sole-light', null, 'Léger'], ['sole-bold', 'sole-bold', null, 'Gras']]);
  fam('deco', 'Sorena', 'Lettres pixel', 'sorena', [['sorena', 'sorena', null], ['sorena-pixel', 'sorena-pixel', null, 'Pixel']]);
  fam('deco', 'Rooyin', 'Pixel arrondi', 'rooyin', [['rooyin', 'rooyin', null], ['rooyin-bold', 'rooyin-bold', null, 'Gras']]);
  // Couleur (COLR)
  fam('couleur', 'Cairo Play', 'Points et signes en couleur', 'cairoplay', [['cairo-play-light', 'cairo-play', 200, 'Léger'], ['cairo-play', 'cairo-play', 400], ['cairo-play-black', 'cairo-play', 900], ['cairo-play-slant', 'cairo-play', 700, 'Gras penché', { slnt: 11 }]]);
  fam('couleur', 'Reem Kufi Fun', 'Kufi aux ornements colorés', 'reemkufifun', [['reem-kufi-fun', 'reem-kufi-fun', 400], ['reem-kufi-fun-bold', 'reem-kufi-fun', 700]]);
  // Moderne
  fam('moderne', 'El Messiri', 'Moderne aux courbes rondes', 'elmessiri', [['el-messiri', 'el-messiri', 400], ['el-messiri-bold', 'el-messiri', 700]]);
  fam('moderne', 'Cairo', 'Sans-serif contemporaine', 'cairo', [['cairo-extralight', 'cairo', 200], ['cairo', 'cairo', 400], ['cairo-black', 'cairo', 1000]]);
  fam('moderne', 'Alyamama', 'Moderne aux pleins marqués', 'alyamama', [['alyamama-light', 'alyamama', 300], ['alyamama', 'alyamama', 400], ['alyamama-black', 'alyamama', 900]]);
  fam('moderne', 'Alexandria', 'Géométrique élégante', 'alexandria', [['alexandria-thin', 'alexandria', 100], ['alexandria', 'alexandria', 400], ['alexandria-black', 'alexandria', 900]]);
  fam('moderne', 'Almarai', 'Moderne et très lisible', 'almarai', [['almarai-light', 'almarai-light', null, 'Léger'], ['almarai', 'almarai', null], ['almarai-bold', 'almarai-bold', null, 'Gras'], ['almarai-extrabold', 'almarai-extrabold', null, 'Extra-gras']]);
  fam('moderne', 'Beiruti', 'Moderne aux angles doux', 'beiruti', [['beiruti-extralight', 'beiruti', 200], ['beiruti', 'beiruti', 400], ['beiruti-black', 'beiruti', 900]]);
  fam('moderne', 'Changa', 'Carrée et dynamique', 'changa', [['changa-extralight', 'changa', 200], ['changa', 'changa', 400], ['changa-extrabold', 'changa', 800]]);
  fam('moderne', 'Estedad', 'Moderne persane', 'estedad', [['estedad-thin', 'estedad', 100], ['estedad', 'estedad', 400], ['estedad-black', 'estedad', 900]]);
  fam('moderne', 'Fustat', 'Moderne inspirée du Caire', 'fustat', [['fustat-extralight', 'fustat', 200], ['fustat', 'fustat', 400], ['fustat-extrabold', 'fustat', 800]]);
  fam('moderne', 'IBM Plex Sans Arabic', 'Sobre et technique', 'ibmplexsansarabic', [['plex-thin', 'plex-thin', null, 'Fin'], ['plex', 'plex', null], ['plex-bold', 'plex-bold', null, 'Gras']]);
  fam('moderne', 'Mada', 'Moderne inspirée de la signalétique', 'mada', [['mada-extralight', 'mada', 200], ['mada', 'mada', 400], ['mada-black', 'mada', 900]]);
  fam('moderne', 'Noto Sans Arabic', 'Sans-serif universelle', 'notosansarabic', [['noto-sans-thin', 'noto-sans', 100], ['noto-sans', 'noto-sans', 400], ['noto-sans-black', 'noto-sans', 900], ['noto-sans-condensed', 'noto-sans', 700, 'Étroit gras', { wdth: 62.5 }]]);
  fam('moderne', 'Readex Pro', 'Moderne très ouverte', 'readexpro', [['readex-light', 'readex', 200, 'Léger'], ['readex', 'readex', 400], ['readex-bold', 'readex', 700]]);
  fam('moderne', 'Rubik', 'Moderne aux coins arrondis', 'rubik', [['rubik-light', 'rubik', 300], ['rubik', 'rubik', 400], ['rubik-black', 'rubik', 900], ['rubik-italic', 'rubik-italic', 400, 'Italique'], ['rubik-black-italic', 'rubik-italic', 900, 'Noir italique']]);
  fam('moderne', 'Tajawal', 'Moderne légère et nette', 'tajawal', [['tajawal-extralight', 'tajawal-extralight', null, 'Extra-léger'], ['tajawal', 'tajawal', null], ['tajawal-bold', 'tajawal-bold', null, 'Gras'], ['tajawal-black', 'tajawal-black', null, 'Noir']]);
  fam('moderne', 'Vazirmatn', 'Moderne persane de référence', 'vazirmatn', [['vazirmatn-thin', 'vazirmatn', 100], ['vazirmatn', 'vazirmatn', 400], ['vazirmatn-black', 'vazirmatn', 900]]);
  fam('moderne', 'Zain', 'Moderne aux formes amples', 'zain', [['zain-extralight', 'zain-extralight', null, 'Extra-léger'], ['zain', 'zain', null], ['zain-black', 'zain-black', null, 'Noir'], ['zain-italic', 'zain-italic', null, 'Italique'], ['zain-lightitalic', 'zain-lightitalic', null, 'Léger italique']]);
  fam('moderne', 'Alan Sans', 'Moderne géométrique', 'alansans', [['alan-sans-light', 'alan-sans', 300], ['alan-sans', 'alan-sans', 400], ['alan-sans-black', 'alan-sans', 900]]);
  fam('moderne', 'Thabit', 'Chasse fixe, esprit machine', 'thabit', [['thabit', 'thabit', null], ['thabit-bold', 'thabit-bold', null, 'Gras']]);
  fam('moderne', 'Kawkab Mono', 'Chasse fixe aux lettres ouvertes', 'kawkabmono', [['kawkab-mono-light', 'kawkab-mono-light', null, 'Léger'], ['kawkab-mono', 'kawkab-mono', null], ['kawkab-mono-bold', 'kawkab-mono-bold', null, 'Gras']]);
  fam('moderne', 'XB Kayhan', 'Titrage persan net', 'xbkayhan', [['xb-kayhan', 'xb-kayhan', null]]);
  fam('moderne', 'XP Paatch', 'Moderne persane légère', 'xppaatch', [['xp-paatch', 'xp-paatch', null], ['xp-paatch-bold', 'xp-paatch-bold', null, 'Gras']]);
  fam('moderne', 'Sahel', 'Moderne persane ronde', 'sahel', [['sahel', 'sahel', 400], ['sahel-black', 'sahel', 900]]);
  fam('moderne', 'Samim', 'Moderne persane ouverte', 'samim', [['samim', 'samim', null], ['samim-bold', 'samim-bold', null, 'Gras']]);
  fam('moderne', 'Shabnam', 'Moderne persane douce', 'shabnam', [['shabnam-light', 'shabnam-light', null, 'Léger'], ['shabnam', 'shabnam', null], ['shabnam-bold', 'shabnam-bold', null, 'Gras']]);
  fam('moderne', 'Tanha', 'Moderne persane droite', 'tanha', [['tanha', 'tanha', null]]);
  fam('moderne', 'Nahid', 'Moderne persane fine', 'nahid', [['nahid', 'nahid', null]]);
  fam('moderne', 'Gandom', 'Naskh moderne à empattements', 'gandom', [['gandom', 'gandom', null]]);
  fam('moderne', 'AQ Normal Sans', 'Moderne sobre, nombreuses graisses', 'aqnormalsans', [['aq-normal-thin', 'aq-normal-sans', 100], ['aq-normal', 'aq-normal-sans', 400], ['aq-normal-black', 'aq-normal-sans', 900]]);
  fam('moderne', 'Arad', 'Moderne persane de titrage', 'arad', [['arad-thin', 'arad', 100], ['arad', 'arad', 400], ['arad-black', 'arad', 900]]);
  fam('moderne', 'Mikhak', 'Moderne persane, liaisons extensibles', 'mikhak', [['mikhak', 'mikhak', 400], ['mikhak-black', 'mikhak', 900], ['mikhak-kashida', 'mikhak', 700, 'Étiré', { KSHD: 200 }]]);
  fam('moderne', 'Sepehr', 'Moderne persane élancée', 'sepehr', [['sepehr-light', 'sepehr-light', null, 'Léger'], ['sepehr', 'sepehr', null], ['sepehr-bold', 'sepehr-bold', null, 'Gras']]);
  fam('moderne', 'Behdad', 'Moderne persane compacte', 'behdad', [['behdad', 'behdad', null]]);
  fam('moderne', 'Farbod', 'Moderne persane légère', 'farbod', [['farbod', 'farbod', null]]);
  fam('moderne', 'Ganjnameh Sans', 'Moderne persane géométrique', 'ganjnameh', [['ganjnameh', 'ganjnameh', null]]);
  fam('moderne', 'Nika', 'Moderne persane aux terminaisons vives', 'nika', [['nika', 'nika', null]]);
  fam('moderne', 'Shahab', 'Moderne persane de titrage', 'shahab', [['shahab', 'shahab', null]]);

  // ------------------------------------------------------------------ couleurs, ambiances
  // couleurs régulièrement espacées → arrêts de dégradé
  const stopsOf = cols => cols.map((c, i) => ({ c: c.toLowerCase(), p: cols.length > 1 ? Math.round(i / (cols.length - 1) * 1000) / 1000 : 0 }));
  const GOLD = ['#F3D688', '#9A7420'];
  const GOLD2 = ['#FBE7A1', '#D4A537', '#8A6116', '#E9C664'];
  const PARCH = ['#F7EDD5', '#E6D2A4'];
  const LIN = (cols, angle) => ({ type: 'linear', stops: stopsOf(cols), angle: angle == null ? 90 : angle });
  const RAD = cols => ({ type: 'radial', stops: stopsOf(cols), angle: 90 });
  const SOL = c => ({ type: 'solid', color: c });
  const NONE = { type: 'none' };
  // ambiance = encre, fond, ombre, contour, effets, cadre, motif (ce qui n'est pas précisé est désactivé)
  const MOODS = [
    { id: 'lapis', name: 'Or sur lapis', ink: LIN(GOLD), bg: SOL('#0E1A3A'), shadow: { color: '#000000', opacity: 0.45, dist: 4, blur: 6 } },
    { id: 'papier', name: 'Encre sur papier', ink: SOL('#1B1712'), bg: LIN(PARCH) },
    { id: 'logo', name: 'Noir sans fond', ink: SOL('#111111'), bg: NONE },
    { id: 'nuit', name: 'Blanc sur noir', ink: SOL('#FFFFFF'), bg: SOL('#0C0C0C') },
    { id: 'emeraude', name: 'Émeraude et or', ink: LIN(GOLD2), bg: RAD(['#13563F', '#05221A']), shadow: { color: '#000000', opacity: 0.35, dist: 3, blur: 5 } },
    { id: 'grenat', name: 'Grenat et or', ink: LIN(GOLD), bg: LIN(['#5A1424', '#2A0810']), shadow: { color: '#000000', opacity: 0.4, dist: 4, blur: 6 } },
    { id: 'crepuscule', name: 'Crépuscule', ink: SOL('#FFF4E0'), bg: LIN(['#2E1A47', '#8E3B5E', '#E07A5F', '#F2B66D']), shadow: { color: '#1A0B24', opacity: 0.4, dist: 3, blur: 8 } },
    { id: 'neon', name: 'Néon', ink: SOL('#F2FFFC'), bg: RAD(['#1D1B3A', '#06050D']), fx: { glow: { on: true, color: '#00f5d4', size: 14, strength: 0.9 } } },
    { id: 'relief', name: 'Relief doré', ink: LIN(GOLD2), bg: LIN(['#1B2A5C', '#070B1A']), shadow: { color: '#000000', opacity: 0.45, dist: 6, blur: 10 }, fx: { extrude: { on: true, angle: 45, depth: 7, color: '#6b4f1d', shade: true } } },
    { id: 'sticker', name: 'Autocollant', ink: SOL('#1B1712'), bg: NONE, shadow: { color: '#000000', opacity: 0.3, dist: 3, blur: 8 }, fx: { outline: { on: true, color: '#ffffff', gap: 0, width: 6 } } },
    { id: 'enluminure', name: 'Enluminure', ink: LIN(GOLD2), bg: LIN(PARCH), fx: { marks: { on: true, color: '#b3261e' }, dots: { on: true, color: '#b3261e' } }, frame: { type: 'cartouche', width: 1.8, double: true, pad: 18 } },
    { id: 'ardoise', name: 'Ardoise', ink: SOL('#F4F1EA'), bg: SOL('#2F3437'), fx: { hollow: { on: true, width: 2.5 } } },
    { id: 'zellige', name: 'Zellige', ink: SOL('#0F4C81'), bg: SOL('#F6F1E7'), pattern: { type: 'stars8', color: '#1b7f79', opacity: 0.16, scale: 9 }, frame: { type: 'octagon', width: 1.6, pad: 16, ink: false, color: '#1b7f79', panelOn: true, panel: '#ffffff' } },
    { id: 'tampon', name: 'Tampon rouge', ink: SOL('#B3261E'), bg: NONE, fx: { weight: 1 }, frame: { type: 'round', width: 3, double: true, pad: 12 } }
  ];
  // nuancier commun (encre, fond, couleurs des dégradés)
  const PALETTE = [
    ['#1B1712', 'Midad, noir d’encre'], ['#000000', 'Noir'], ['#3A3A3A', 'Anthracite'], ['#8A8D95', 'Gris'], ['#C9CDD3', 'Argent'], ['#FFFFFF', 'Blanc'], ['#FFF8E7', 'Ivoire'], ['#F2E6C9', 'Papier ahar'],
    ['#F3D688', 'Or clair'], ['#C9A227', 'Or'], ['#9A7420', 'Or antique'], ['#F4A300', 'Safran'], ['#E07B00', 'Ambre'], ['#B8733A', 'Cuivre'], ['#8A5A1F', 'Bronze'], ['#5B3A1E', 'Sépia'],
    ['#F4D3D8', 'Rose poudré'], ['#E9A0B4', 'Rose'], ['#E86A5A', 'Corail'], ['#C62828', 'Rouge'], ['#7B1E2B', 'Grenat'], ['#4A1020', 'Bordeaux'], ['#7A4BA0', 'Améthyste'], ['#4A1F45', 'Prune'],
    ['#93E2C2', 'Vert d’eau'], ['#1BA3A3', 'Turquoise'], ['#0F5E4A', 'Émeraude'], ['#0B3B2E', 'Vert profond'], ['#6B7A2A', 'Olive'], ['#3E8EDE', 'Azur'], ['#1E3A8A', 'Lapis'], ['#0E1A3A', 'Bleu nuit']
  ];
  const MINI = ['#ffffff', '#000000', '#c9a227', '#f3d688', '#c62828', '#b3261e', '#00f5d4', '#f15bb5', '#1e3a8a', '#0f5e4a', '#6b4f1d'];
  // dégradés prêts à l'emploi : [nom, couleurs, type facultatif]
  const INK_PRESETS = [
    ['Or', GOLD], ['Or brillant', GOLD2], ['Or rose', ['#F7D1C4', '#C98A7A', '#8E5244']],
    ['Cuivre', ['#F2B07A', '#8A4517']], ['Argent', ['#FFFFFF', '#B8BCC4', '#6F737B', '#D9DCE1']], ['Lapis', ['#86A6F0', '#1E3A8A']],
    ['Émeraude', ['#93E2C2', '#0F5E4A']], ['Feu', ['#FFE066', '#FF8C1A', '#C1121F']], ['Océan', ['#90E0EF', '#0096C7', '#023E8A']],
    ['Néon', ['#00F5D4', '#9B5DE5', '#F15BB5']], ['Arc-en-ciel', ['#E53935', '#FB8C00', '#FDD835', '#43A047', '#1E88E5', '#8E24AA']], ['Lumière', ['#FFFFFF', '#F3D688', '#9A7420'], 'radial']
  ];
  const BG_PRESETS = [
    ['Parchemin', PARCH], ['Nuit', ['#1B2A5C', '#070B1A']], ['Aube', ['#FCE7D2', '#E7B49B']], ['Sable', ['#F3DDB0', '#C99A5B']],
    ['Crépuscule', ['#2E1A47', '#8E3B5E', '#E07A5F', '#F2B66D']], ['Lagon', ['#CDEFEA', '#5FB7B0', '#1F6F78']], ['Rose poudré', ['#FDF0F2', '#F4C6D0']],
    ['Halo', ['#2B3F7A', '#070B1A'], 'radial'], ['Vignette', ['#FBF4E2', '#C9A86A'], 'radial'], ['Émeraude', ['#13563F', '#05221A'], 'radial']
  ];
  const MM = 96 / 25.4;
  const FORMATS = [
    { id: 'auto', label: 'Ajusté au texte', sub: 'marge réglable' },
    { id: 'square', label: 'Carré 1:1', w: 1080, h: 1080, sub: '1080 × 1080' },
    { id: 'portrait', label: 'Portrait 4:5', w: 1080, h: 1350, sub: '1080 × 1350' },
    { id: 'story', label: 'Story 9:16', w: 1080, h: 1920, sub: '1080 × 1920' },
    { id: 'landscape', label: 'Paysage 16:9', w: 1920, h: 1080, sub: '1920 × 1080' },
    { id: 'banner', label: 'Bannière 3:1', w: 1500, h: 500, sub: '1500 × 500' },
    { id: 'a4p', label: 'A4 portrait', w: 210 * MM, h: 297 * MM, sub: '210 × 297 mm' },
    { id: 'a4l', label: 'A4 paysage', w: 297 * MM, h: 210 * MM, sub: '297 × 210 mm' },
    { id: 'custom', label: 'Personnalisé', sub: 'largeur × hauteur' }
  ];

  // ------------------------------------------------------------------ formes, compositions, cadres, motifs
  const SPIRAL_ICON = (() => { let d = ''; for (let i = 0; i <= 60; i++) { const t = i / 60 * Math.PI * 5, r = 1 + 1.6 * t / Math.PI; d += (i ? 'L' : 'M') + (12 + r * Math.cos(t)).toFixed(1) + ' ' + (12 + r * Math.sin(t)).toFixed(1); } return '<path d="' + d + '"/>'; })();
  const RING_OPTS = [['none', 'Aucune'], ['single', 'Simple'], ['double', 'Double']];
  const ringW = st => st.ring !== 'none';
  // mise en page empilée (téléphone, tablette en portrait) : même condition que dans la feuille de style
  const STACK_MQ = window.matchMedia ? window.matchMedia('(max-width:899px) and (orientation:portrait),(max-width:899px) and (min-height:521px),(max-width:639px)') : { matches: false, addEventListener() {} };
  // chargement à l'approche : les galeries défilent dans leur panneau (racine = le panneau), sur ordinateur comme sur téléphone
  function lazyObserver(cb, margin) {
    if (!('IntersectionObserver' in window)) return null;
    const io = new IntersectionObserver(cb, { root: document.getElementById('panels'), rootMargin: margin + ' 0px' });
    return { observe: t => io.observe(t), unobserve: t => io.unobserve(t) };
  }
  // outils de l'atelier (barre verticale sur ordinateur, barre du bas sur téléphone)
  const TOOLS = ['texte', 'styles', 'modeles', 'forme', 'couleurs', 'effets', 'cadre', 'fond', 'format'];
  const SHAPE_GROUPS = [['line', 'Lignes'], ['closed', 'Formes fermées'], ['compo', 'Compositions'], ['warp', 'Déformations']];
  const FILL_OPTS = [['tri', 'Pyramide'], ['oval', 'Ovale'], ['egg', 'Œuf'], ['circle', 'Cercle'], ['capsule', 'Cartouche'], ['drop', 'Goutte'], ['arch', 'Mihrab'], ['diamond', 'Losange'], ['hexagon', 'Hexagone'], ['octagon', 'Octogone'], ['heart', 'Cœur']];
  const TILE_OPTS = [['capsule', 'Cartouche'], ['arch', 'Arc'], ['round', 'Arrondi'], ['circle', 'Rond'], ['hexagon', 'Hexagone'], ['octagon', 'Octogone'], ['diamond', 'Losange'], ['drop', 'Goutte']];
  const SEP_OPTS = [['none', 'Aucun'], ['star', 'Étoile'], ['dot', 'Point'], ['diamond', 'Losange']];
  const SHAPES = [
    { id: 'straight', g: 'line', name: 'Droite', params: [] },
    { id: 'arc', g: 'line', name: 'Arc', params: [['bend', 'Courbure', 10, 270, 5, '°']] },
    { id: 'arcInv', g: 'line', name: 'Arc inversé', params: [['bend', 'Courbure', 10, 270, 5, '°']] },
    { id: 'bridge', g: 'line', name: 'Pont', params: [['height', 'Hauteur', -100, 100, 1, ' %']] },
    { id: 'wave', g: 'line', name: 'Vague', params: [['amp', 'Amplitude', 0, 120, 1, ' %'], ['waves', 'Ondulations', 0.5, 5, 0.5, '']] },
    { id: 'rise', g: 'line', name: 'Montée', params: [['amp', 'Montée', -150, 150, 1, ' %']] },
    { id: 'spiral', g: 'line', name: 'Spirale', params: [['gap', 'Écartement', 105, 250, 5, ' %']] },
    { id: 'free', g: 'line', name: 'Tracé libre', params: [] },
    { id: 'circle', g: 'closed', name: 'Cercle', params: [['cover', 'Couverture', 20, 100, 1, ' %'], ['side', 'Position', [['top', 'Dessus'], ['bottom', 'Dessous']]], ['spin', 'Rotation', -180, 180, 1, '°'], ['ring', 'Bordure', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW]] },
    { id: 'oval', g: 'closed', name: 'Ovale', params: [['cover', 'Couverture', 20, 100, 1, ' %'], ['ratio', 'Hauteur', 25, 100, 1, ' %'], ['ring', 'Bordure', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW]] },
    { id: 'seal', g: 'closed', name: 'Sceau', params: [['cover', 'Couverture', 30, 95, 1, ' %'], ['ring', 'Bordure', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW], ['sep', 'Séparateurs', [['none', 'Aucun'], ['star', 'Étoile'], ['dot', 'Point'], ['diamond', 'Losange']]]], hint: 'Sceau : écrivez 2 ou 3 lignes. La 1re suit le haut du cercle, la dernière le bas, celle du milieu reste au centre.' },
    { id: 'heart', g: 'closed', name: 'Cœur', params: [['cover', 'Couverture', 20, 100, 1, ' %'], ['ring', 'Bordure', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW]] },
    { id: 'polygon', g: 'closed', name: 'Polygone', params: [['sides', 'Côtés', 3, 12, 1, ''], ['round', 'Arrondi', 0, 100, 1, ' %'], ['cover', 'Couverture', 20, 100, 1, ' %'], ['ring', 'Bordure', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW]] },
    { id: 'fill', g: 'compo', name: 'Remplir une forme', params: [['fillShape', 'Forme', FILL_OPTS], ['wrap', 'Lignes', [['auto', 'Automatiques'], ['off', 'Comme écrites']]], ['fratio', 'Proportion', 40, 250, 5, ' %'], ['grow', 'Remplissage', 0, 100, 5, ' %'], ['stretch', 'Étirement', 0, 60, 5, ' %'], ['lead', 'Interligne', 0, 80, 1, ' %'], ['ring', 'Bordure', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW]], hint: 'La phrase remplit la forme ligne par ligne. « Automatiques » coupe une phrase écrite sur une seule ligne ; sinon, vos retours à la ligne sont gardés.' },
    { id: 'rings', g: 'compo', name: 'Anneaux', params: [['center', 'Lignes au centre', 1, 4, 1, ''], ['rgap', 'Écart', 0, 60, 1, ' %'], ['rfill', 'Anneaux', [['on', 'Complétés'], ['off', 'Tels quels']]], ['rlines', 'Filets', [['none', 'Aucun'], ['thin', 'Fins']]], ['sep', 'Séparateurs', SEP_OPTS], ['ring', 'Bordure', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW]], hint: 'Médaillon : la 1re ligne (ou les premières) au centre, chaque ligne suivante en anneau autour. Un anneau trop court est complété en répétant sa ligne.' },
    { id: 'tiles', g: 'compo', name: 'Mosaïque', params: [['tile', 'Tuile', TILE_OPTS], ['title', 'Titre', [['top', 'En haut'], ['center', 'Au centre'], ['none', 'Aucun']]], ['palette', 'Couleurs', [['pastel', 'Pastel'], ['jewel', 'Émaux'], ['earth', 'Terre'], ['gold', 'Or'], ['none', 'Sans']]], ['cols', 'Colonnes', 0, 12, 1, '', null, x => x ? String(x) : 'auto'], ['fratio', 'Proportion', 40, 250, 5, ' %'], ['tgap', 'Écart', 0, 40, 1, ' %'], ['ring', 'Bordure', [['none', 'Aucune'], ['single', 'Filet']]]], hint: 'Chaque ligne devient une tuile ; séparez des paragraphes par une ligne vide pour mettre plusieurs lignes par tuile. La 1re ligne sert de titre.' },
    { id: 'tughra', g: 'compo', name: 'Tughra', params: [['height', 'Hampes', -100, 100, 1, ' %']], hint: 'Le monogramme ottoman : les hampes du nom s’élancent, deux boucles s’ouvrent à gauche et deux traits filent vers la droite. Les lignes suivantes se placent dessous, plus petites.' },
    { id: 'wings', g: 'compo', name: 'Médaillon et ailes', params: [['ring', 'Cercle', RING_OPTS], ['ringW', 'Épaisseur', 2, 25, 1, ' %', ringW], ['swash', 'Trait de liaison', [['on', 'Oui'], ['off', 'Non']]]], init: sh => { if (sh.ring === 'none') sh.ring = 'single'; }, hint: 'Trois lignes : la 1re dans le médaillon, la 2e à droite, la 3e à gauche, reliées par un long trait ; les suivantes se placent dessous. Une couleur par ligne : onglet Couleurs.' },
    { id: 'hilye', g: 'compo', name: 'Panneau hilye', params: [['palette', 'Couleurs', [['gold', 'Or'], ['pastel', 'Pastel'], ['earth', 'Terre'], ['jewel', 'Émaux']]]], init: sh => { if (sh.palette === 'none' || sh.palette === 'pastel') sh.palette = 'gold'; }, hint: 'Une ligne par compartiment. Avec 8 lignes : bandeau du haut, rond central, 4 médaillons d’angle (de droite à gauche, haut puis bas), bandeau du verset, panneau du bas. Avec moins de lignes, le rond central et les bandeaux sont remplis d’abord.' },
    { id: 'flag', g: 'warp', name: 'Drapeau', params: [['amp', 'Amplitude', 0, 120, 1, ' %'], ['waves', 'Ondulations', 0.5, 5, 0.5, '']] },
    { id: 'bulge', g: 'warp', name: 'Bombé', params: [['intensity', 'Intensité', -80, 150, 1, ' %']] },
    { id: 'dome', g: 'warp', name: 'Dôme', params: [['intensity', 'Intensité', -80, 150, 1, ' %']] },
    { id: 'cup', g: 'warp', name: 'Coupe', params: [['intensity', 'Intensité', -80, 150, 1, ' %']] },
    { id: 'persp', g: 'warp', name: 'Perspective', params: [['intensity', 'Intensité', -85, 85, 1, ' %']] },
    { id: 'cylinder', g: 'warp', name: 'Cylindre', params: [['intensity', 'Courbure', 10, 95, 1, ' %']] },
    { id: 'fisheye', g: 'warp', name: 'Loupe', params: [['intensity', 'Grossissement', -60, 120, 1, ' %']] }
  ];
  const REPEATS = [['none', 'Simple'], ['mirror', 'Miroir'], ['rosette', 'Rosace'], ['kaleido', 'Kaléidoscope']];
  const FRAMES = [['none', 'Aucun'], ['rect', 'Rectangle'], ['round', 'Arrondi'], ['oval', 'Ovale'], ['circle', 'Cercle'], ['cartouche', 'Cartouche'], ['arch', 'Mihrab'], ['octagon', 'Octogone'], ['hexagon', 'Hexagone'], ['diamond', 'Losange'], ['star8', 'Étoile'], ['drop', 'Goutte'], ['egg', 'Œuf'], ['triangle', 'Triangle'], ['heart', 'Cœur'], ['shield', 'Écu'], ['scallop', 'Festonné']];
  const PATTERNS = [['none', 'Aucun'], ['stars8', 'Étoiles à 8'], ['stars6', 'Étoiles à 6'], ['hex', 'Nid d’abeille'], ['diamonds', 'Losanges'], ['circles', 'Cercles'], ['chevrons', 'Chevrons'], ['dots', 'Points'], ['nuqat', 'Points du calame'], ['words', 'Écriture répétée']];
  // effets : réglages [clé, libellé, min, max, pas, unité] ou [clé, libellé, 'color'|'check']
  const FX_UI = [
    { k: 'outline', label: 'Liseré', note: 'bordure détachée autour des lettres, effet autocollant', fields: [['color', 'Couleur', 'color'], ['gap', 'Écart', 0, 15, 0.5, ' %'], ['width', 'Épaisseur', 0.5, 20, 0.5, ' %']] },
    { k: 'extrude', label: 'Relief 3D', note: 'volume en profondeur sous les lettres', fields: [['color', 'Couleur', 'color'], ['depth', 'Profondeur', 1, 40, 0.5, ' %'], ['angle', 'Direction', 0, 355, 5, '°'], ['shade', 'Dégradé d’ombre', 'check']] },
    { k: 'glow', label: 'Néon', note: 'halo lumineux autour des lettres', fields: [['color', 'Couleur', 'color'], ['size', 'Rayonnement', 2, 40, 1, ' %'], ['strength', 'Intensité', 0.1, 1, 0.05, '']] },
    { k: 'hollow', label: 'Lettres creuses', note: 'seul le contour des lettres est tracé', fields: [['width', 'Trait', 0.5, 12, 0.25, ' %']] },
    { k: 'scatter', label: 'Lettres semées', note: 'petites lettres posées dans les vides autour du texte', fields: [['color', 'Couleur', 'color'], ['density', 'Densité', 5, 100, 5, ' %'], ['size', 'Taille', 5, 60, 1, ' %'], ['alpha', 'Tout l’alphabet (sinon : les lettres de la phrase)', 'check']] },
    { k: 'counters', label: 'Contre-formes', note: 'remplit l’intérieur des boucles des lettres (ه، و، م، ص…)', fields: [['color', 'Couleur', 'color']] },
    { k: 'marks', label: 'Harakat en couleur', note: 'voyelles et chadda d’une autre couleur, comme dans les manuscrits', fields: [['color', 'Couleur', 'color']] },
    { k: 'dots', label: 'Points en couleur', note: 'points des lettres d’une autre couleur', fields: [['color', 'Couleur', 'color']] }
  ];
  const SAMPLES = ['بسم الله الرحمن الرحيم', 'الخط العربي', 'السلام عليكم', 'أهلاً وسهلاً', 'الحمد لله', 'ما شاء الله'];
