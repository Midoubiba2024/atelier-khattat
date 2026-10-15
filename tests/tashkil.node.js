// Tashkīl des textes de l'atelier : chaque texte vocalisé garde exactement les lettres du texte d'origine,
// chaque texte d'exemple (modèles, exemples rapides) trouve sa vocalisation dans le catalogue,
// et les niveaux du tashkīl (complet, partiel, fins de mots…) suivent leurs règles sur tous ces textes
globalThis.self = globalThis;
const fs = require('fs'), path = require('path');
require('../src/engine.js');
const K = globalThis.Khatt;
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };

// données de l'atelier (02-data.js), sans le navigateur
const src = fs.readFileSync(path.join(__dirname, '../src/app/02-data.js'), 'utf8');
const stub = () => null;
const { LIBRARY, MODELS, TK_EXTRA } = new Function('SOL', 'LIN', 'RAD', 'NONE', 'GOLD', 'GOLD2', 'PARCH', src + '\nreturn { LIBRARY, MODELS, TK_EXTRA };')(stub, stub, stub, null, [], [], []);
const base = fs.readFileSync(path.join(__dirname, '../src/app/01-base.js'), 'utf8');
const SAMPLES = new Function('return ' + base.match(/const SAMPLES = (\[[^\]]*\]);/)[1])();

const hasMarks = t => /[ً-ٰۖ-ۭ]/.test(t);
const bareKey = t => K.stripMarks(String(t)).replace(/ٱ/g, 'ا').replace(/ـ/g, '').replace(/\s+/g, ' ').trim();
// lettres de base dans l'ordre (sans espaces ni tatwīl), comme l'alignement de l'atelier
const letters = t => Array.from(String(t)).filter(ch => !K.isMark(ch.charCodeAt(0)) && !/\s/.test(ch) && ch !== 'ـ').map(ch => ch === 'ٱ' ? 'ا' : ch).join('');
const VOWELS = new Set(['َ', 'ُ', 'ِ', 'ْ', 'ً', 'ٌ', 'ٍ']);
// au plus une voyelle par lettre (la chadda et l'alif suscrit s'y ajoutent), aucun signe en début de mot
function wellFormed(v) {
  for (const w of v.split(/\s+/)) {
    if (w && K.isMark(w.charCodeAt(0))) return 'signe en début de mot : ' + w;
    let n = 0;
    for (const ch of Array.from(w)) {
      if (!K.isMark(ch.charCodeAt(0))) { n = 0; continue; }
      if (VOWELS.has(ch) && ++n > 1) return 'deux voyelles sur une lettre : ' + w;
    }
  }
  return '';
}

// 1. bibliothèque : le texte vocalisé a les mêmes lettres que le texte d'origine
let nVoc = 0, bad = [];
for (const c of LIBRARY) for (const it of c.items) {
  if (!it[2]) continue;
  nVoc++;
  const why = letters(it[2]) !== letters(it[0]) ? 'lettres différentes' : !hasMarks(it[2]) ? 'sans tashkīl' : wellFormed(it[2]);
  if (why) bad.push(it[0] + ' → ' + why);
}
ok(nVoc > 100 && !bad.length, 'bibliothèque : ' + nVoc + ' textes vocalisés, lettres identiques' + (bad.length ? ' — ' + bad.join(' ; ') : ''));
// textes déjà vocalisés dans la bibliothèque et les modèles : bien formés
const already = [].concat(...LIBRARY.map(c => c.items.map(it => it[0]))).concat(MODELS.map(m => m.ex)).filter(hasMarks);
bad = already.map(v => wellFormed(v)).filter(Boolean);
ok(!bad.length, 'textes déjà vocalisés : ' + already.length + ' bien formés' + (bad.length ? ' — ' + bad.join(' ; ') : ''));

// 2. catalogue (même construction que dans l'atelier)
const cat = new Map();
const add = v => { if (typeof v === 'string' && hasMarks(v)) { const k = bareKey(v); if (k && !cat.has(k)) cat.set(k, v); } };
for (const c of LIBRARY) for (const it of c.items) { add(it[2]); add(it[0]); }
for (const v of TK_EXTRA) add(v);
for (const m of MODELS) add(m.ex);
// chaque entrée de TK_EXTRA correspond à un exemple réel, bien formé
const examples = MODELS.map(m => m.ex).concat(SAMPLES);
bad = TK_EXTRA.filter(v => !examples.some(e => bareKey(e) === bareKey(v)) || wellFormed(v));
ok(!bad.length, 'TK_EXTRA : ' + TK_EXTRA.length + ' textes, tous utilisés par un modèle ou un exemple' + (bad.length ? ' — ' + bad.join(' ; ') : ''));
// tous les textes d'exemple des modèles et les exemples rapides ont leur tashkīl
const missing = examples.filter(e => !hasMarks(e) && !cat.has(bareKey(e)));
ok(!missing.length, 'modèles et exemples : ' + examples.length + ' textes, tous vocalisables' + (missing.length ? ' — manquent : ' + missing.join(' | ') : ''));
// les lettres du texte d'exemple et de sa vocalisation s'alignent
bad = examples.filter(e => !hasMarks(e)).filter(e => letters(cat.get(bareKey(e))) !== letters(e));
ok(!bad.length, 'alignement lettre à lettre des exemples' + (bad.length ? ' — ' + bad.join(' | ') : ''));
// le texte par défaut de l'atelier
ok(cat.get(bareKey('الخط العربي')) === 'الْخَطُّ الْعَرَبِيُّ', 'texte par défaut : الْخَطُّ الْعَرَبِيُّ');

// 3. niveaux du tashkīl : à partir du texte vocalisé, chaque niveau garde une partie des signes, par des règles fixes
const LV = K.TASHKIL_LEVELS;
ok(LV.join(',') === 'full,nosukun,partial,body,ends,shaddatanwin,shadda,none', 'niveaux : ' + LV.join(', '));
const SUKUN = new Set(['ْ', 'ۡ']), SHADDA = 'ّ', TANWIN = new Set(['ً', 'ٌ', 'ٍ', 'ࣰ', 'ࣱ', 'ࣲ']), SHORT = new Set(['َ', 'ُ', 'ِ']);
// grappes (lettre + signes), comme le moteur
function grappes(t) {
  const out = [];
  for (const ch of Array.from(t)) {
    if (K.isMark(ch.codePointAt(0)) && out.length && !/\s/.test(out[out.length - 1].b)) out[out.length - 1].m.push(ch);
    else out.push({ b: K.isMark(ch.codePointAt(0)) ? '' : ch, m: K.isMark(ch.codePointAt(0)) ? [ch] : [] });
  }
  return out;
}
const sub = (a, b) => { let j = 0; for (const x of a) { while (j < b.length && b[j] !== x) j++; if (j++ >= b.length) return false; } return true; };
const ALL = [...new Set([].concat(...LIBRARY.map(c => c.items.map(it => it[2]).filter(Boolean)), ...LIBRARY.map(c => c.items.map(it => it[0]).filter(hasMarks)), TK_EXTRA, MODELS.map(m => m.ex).filter(hasMarks)))];
const probs = [];
for (const v of ALL) for (const l of LV) {
  const r = K.tashkilLevel(v, l), A = grappes(v), B = grappes(r);
  const why = [];
  if (A.length !== B.length || A.some((x, i) => (x.b === 'ٱ' ? 'ا' : x.b) !== (B[i].b === 'ٱ' ? 'ا' : B[i].b))) why.push('lettres changées');
  else if (A.some((x, i) => !sub(B[i].m, x.m))) why.push('signe ajouté ou déplacé');
  const all = Array.from(r).filter(ch => K.isMark(ch.codePointAt(0)));
  if (l === 'full' && r !== v) why.push('complet modifié');
  if (l === 'nosukun' && r !== Array.from(v).filter(ch => !SUKUN.has(ch)).join('')) why.push('autre chose que le soukoun retiré');
  if (l === 'shadda' && all.some(ch => ch !== SHADDA)) why.push('autre signe que la chadda');
  if (l === 'shaddatanwin' && all.some(ch => ch !== SHADDA && !TANWIN.has(ch))) why.push('autre signe que chadda et tanwīn');
  if ((l === 'shadda' || l === 'shaddatanwin' || l === 'partial') && (r.split(SHADDA).length !== v.split(SHADDA).length)) why.push('chadda perdue');
  if ((l === 'shaddatanwin' || l === 'partial' || l === 'ends') && Array.from(r).filter(ch => TANWIN.has(ch)).length !== Array.from(v).filter(ch => TANWIN.has(ch)).length) why.push('tanwīn perdu');
  if (l === 'partial' && Array.from(r).some(ch => SUKUN.has(ch))) why.push('soukoun gardé');
  if (l === 'partial' && A.length === B.length && A.some((x, i) => x.m.filter(ch => !B[i].m.includes(ch)).some(ch => !SUKUN.has(ch) && !SHORT.has(ch) && /[ًٌٍَُِّْٰ]/.test(ch)))) why.push('signe non évident retiré');
  if (l === 'none' && K.hasTashkil(r)) why.push('signes restants');
  if (l === 'ends') for (const w of r.split(/\s+/)) { const g = grappes(w), withM = g.filter(x => x.m.some(ch => !/[ٓ-ٕ]/.test(ch))).length; if (withM > 1) why.push('plusieurs lettres vocalisées dans ' + w); }
  if (['nosukun', 'shadda', 'shaddatanwin', 'none', 'ends'].includes(l) && K.tashkilLevel(r, l) !== r) why.push('deuxième passage différent');
  if (why.length) probs.push(l + ' : ' + v.replace(/\n/g, ' / ') + ' → ' + why.join(', '));
}
ok(!probs.length, 'niveaux : ' + ALL.length + ' textes vocalisés × ' + LV.length + ' niveaux, lettres intactes, aucun signe ajouté, chaque niveau garde ce qu’il doit' + (probs.length ? ' — ' + probs.slice(0, 6).join(' ; ') : ''));
// « Sans les fins » et « Fins de mots » se partagent les signes : la dernière lettre d'un côté, le reste de l'autre
// (textes sans signes coraniques ni alif waṣla, que ces deux niveaux traitent à part)
const quranic = v => Array.from(v).some(ch => { const c = ch.codePointAt(0); return c === 0x0671 || (c >= 0x0610 && c <= 0x061A) || (c >= 0x06D6 && c <= 0x06ED) || (c >= 0x08CA && c <= 0x08FF); });
const split = ALL.filter(v => !quranic(v)).filter(v => {
  const F = grappes(v), Bd = grappes(K.tashkilLevel(v, 'body')), E = grappes(K.tashkilLevel(v, 'ends'));
  return F.some((x, i) => { const keep = x.m.filter(ch => Bd[i].m.includes(ch) || E[i].m.includes(ch)); return keep.length !== x.m.length; });
});
ok(!split.length, '« Sans les fins » + « Fins de mots » redonnent tout le tashkīl' + (split.length ? ' — ' + split.slice(0, 4).join(' ; ') : ''));
// exemples vérifiés à la main
const GOLD = {
  'الْكِتَابُ مُفِيدٌ جِدًّا': ['الْكِتَابُ مُفِيدٌ جِدًّا', 'الكِتَابُ مُفِيدٌ جِدًّا', 'الكِتابُ مُفيدٌ جِدًّا', 'الْكِتَاب مُفِيد جِدّا', 'الكتابُ مفيدٌ جدًّا', 'الكتاب مفيدٌ جدًّا', 'الكتاب مفيد جدّا', 'الكتاب مفيد جدا'],
  'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ': ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'بِسمِ اللَّهِ الرَّحمَٰنِ الرَّحِيمِ', 'بِسمِ اللَّهِ الرَّحمَٰنِ الرَّحيمِ', 'بِسْم اللَّه الرَّحْمَٰن الرَّحِيم', 'بسمِ اللهِ الرحمنِ الرحيمِ', 'بسم اللّه الرّحمن الرّحيم', 'بسم اللّه الرّحمن الرّحيم', 'بسم الله الرحمن الرحيم'],
  'إِنَّ مَعَ الْعُسْرِ يُسْرًا': ['إِنَّ مَعَ الْعُسْرِ يُسْرًا', 'إِنَّ مَعَ العُسرِ يُسرًا', 'إنَّ مَعَ العُسرِ يُسرًا', 'إِنّ مَع الْعُسْر يُسْرا', 'إنَّ معَ العسرِ يسرًا', 'إنّ مع العسر يسرًا', 'إنّ مع العسر يسرا', 'إن مع العسر يسرا'],
  'وَضُحَاهَا عَلَى هُدًى': ['وَضُحَاهَا عَلَى هُدًى', 'وَضُحَاهَا عَلَى هُدًى', 'وَضُحاها عَلى هُدًى', 'وَضُحَاهَا عَلَى هُدى', 'وضحاها على هدًى', 'وضحاها على هدًى', 'وضحاها على هدى', 'وضحاها على هدى'],
  'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ': ['ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', 'ٱلحَمدُ لِلَّهِ رَبِّ ٱلعَٰلَمِينَ', 'الحَمدُ لِلَّهِ رَبِّ العَٰلَمينَ', 'ٱلْحَمْد لِلَّه رَبّ ٱلْعَٰلَمِين', 'الحمدُ للهِ ربِّ العٰلمينَ', 'الحمد للّه ربّ العٰلمين', 'الحمد للّه ربّ العٰلمين', 'الحمد لله رب العلمين']
};
const gbad = [];
for (const [v, want] of Object.entries(GOLD)) LV.forEach((l, i) => { const r = K.tashkilLevel(v, l); if (r !== want[i]) gbad.push(l + ' : ' + v + ' → ' + r + ' (attendu ' + want[i] + ')'); });
ok(!gbad.length, 'niveaux : ' + Object.keys(GOLD).length + ' phrases vérifiées à la main' + (gbad.length ? ' — ' + gbad.join(' ; ') : ''));
// textes du Coran (tanzil.net, quran.com / KFGQPC, indo-pakistanais), tatwīl porteur de signes, ponctuation collée,
// formes de présentation (ﷲ, textes copiés d'un PDF), hamza décomposée : cas relevés à la relecture, vérifiés un à un
// (chaînes écrites en \u pour garder l'encodage exact : une normalisation NFC les changerait)
const SPECIAL = [
  ['\u0639\u064E\u0645\u0652\u0631\u064C\u0648', 'ends', '\u0639\u0645\u0631\u064C\u0648'],
  ['\u0639\u064E\u0645\u0652\u0631\u064C\u0648', 'body', '\u0639\u064E\u0645\u0652\u0631\u0648'],
  ['\u062C\u0650\u062F\u0651\u0627\u064B', 'ends', '\u062C\u062F\u0651\u0627\u064B'],
  ['\u062C\u0650\u062F\u0651\u0627\u064B', 'body', '\u062C\u0650\u062F\u0651\u0627'],
  ['\u0634\u064E\u064A\u0652\u0640\u064B\u0654\u0627', 'ends', '\u0634\u064A\u0640\u064B\u0654\u0627'],
  ['\u0643\u062A\u0628\u0640\u064E', 'ends', '\u0643\u062A\u0628\u0640\u064E'],
  ['\u063A\u0650\u0634\u064E\u0670\u0648\u064E\u0629\u065E\u06D6', 'shaddatanwin', '\u063A\u0634\u0670\u0648\u0629\u065E'],
  ['\u0647\u064F\u062F\u0657\u0649', 'ends', '\u0647\u062F\u0657\u0649'],
  ['\u0628\u064E\u0635\u0650\u064A\u0631\u0657\u0627', 'ends', '\u0628\u0635\u064A\u0631\u0657\u0627'],
  ['\u0633\u064E\u0645\u0650\u064A\u0639\u064E\u06E2\u0627', 'partial', '\u0633\u064E\u0645\u064A\u0639\u064E\u06E2\u0627'],
  ['\u0623\u064E\u0644\u0650\u064A\u0645\u064F\u06E2', 'partial', '\u0623\u064E\u0644\u064A\u0645\u064F\u06E2'],
  ['\u0644\u064E\u0647\u0657', 'shaddatanwin', '\u0644\u0647'],
  ['\u0628\u0650\u0647\u0656', 'shaddatanwin', '\u0628\u0647'],
  ['\u0625\u0650\u0628\u0652\u0631\u064E\u0670\u0647\u0650\u0640\u06E7\u0645\u064E', 'partial', '\u0625\u0628\u0631\u064E\u0670\u0647\u0650\u0640\u06E7\u0645\u064E'],
  ['\u0625\u0650\u0628\u0652\u0631\u064E\u0670\u0647\u0650\u0640\u06E7\u0645\u064E', 'none', '\u0625\u0628\u0631\u0647\u0645'],
  ['\u062C\u064E\u0632\u064E\u0670\u0653\u0624\u064F\u0627\u06DF', 'ends', '\u062C\u0632\u0670\u0624\u064F\u0627'],
  ['\u0671\u0645\u06E1\u0631\u064F\u0624\u064C\u0627\u0652 \u0648\u064E\u0671\u0644\u0644\u0651\u064E\u0647\u064F', 'ends', '\u0627\u0645\u0631\u0624\u064C\u0627 \u0648\u0627\u0644\u0644\u0647\u064F'],
  ['\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0671\u0644\u0652\u0643\u0650\u062A\u064E\u0640\u0670\u0628\u064F \u0644\u064E\u0627 \u0631\u064E\u064A\u0652\u0628\u064E \u06DB \u0641\u0650\u064A\u0647\u0650 \u06DB \u0647\u064F\u062F\u064B\u0649 \u0644\u0651\u0650\u0644\u0652\u0645\u064F\u062A\u0651\u064E\u0642\u0650\u064A\u0646\u064E', 'partial', '\u0630\u064E\u0670\u0644\u0650\u0643\u064E \u0627\u0644\u0643\u0650\u062A\u064E\u0640\u0670\u0628\u064F \u0644\u0627 \u0631\u064E\u064A\u0628\u064E \u0641\u064A\u0647\u0650 \u0647\u064F\u062F\u064B\u0649 \u0644\u0651\u0650\u0644\u0645\u064F\u062A\u0651\u064E\u0642\u064A\u0646\u064E'],
  ['\u0648\u064E\u0645\u064E\u0627\u0653 \u0623\u064F\u0648\u06DF\u0644\u064E\u0640\u0670\u0653\u0626\u0650\u0643\u064E', 'none', '\u0648\u0645\u0627 \u0623\u0648\u0644\u0626\u0643'],
  ['\u0643\u064E\u062A\u064E\u0628\u064E\u060C\u0642\u064E\u0631\u064E\u0623\u064E', 'ends', '\u0643\u062A\u0628\u064E\u060C\u0642\u0631\u0623\u064E'],
  ['\u0643\u064E\u062A\u064E\u0628\u064E\u060C\u0642\u064E\u0631\u064E\u0623\u064E', 'body', '\u0643\u064E\u062A\u064E\u0628\u060C\u0642\u064E\u0631\u064E\u0623'],
  ['\u0644\u0650\uFDF2\u0650', 'body', '\u0644\u0650\uFDF2'],
  ['\u0644\u0650\uFDF2\u0650', 'ends', '\u0644\uFDF2\u0650'],
  ['\uFEDB\u0650\uFE98\u064E\uFE8E\uFE8F\u064C', 'ends', '\uFEDB\uFE98\uFE8E\uFE8F\u064C'],
  ['\uFEDB\uFE77\uFE98\uFE8E\uFE8F\uFE70', 'none', '\uFEDB\u0640\uFE98\uFE8E\uFE8F'],
  ['\u0627\u0655\u0650\u0646\u064E\u0651', 'partial', '\u0627\u0655\u0646\u064E\u0651'],
  ['\u0641\u0650\u0649', 'partial', '\u0641\u0649']
];
const sbad = SPECIAL.filter(([t, l, w]) => K.tashkilLevel(t, l) !== w).map(([t, l, w]) => l + ' : ' + t + ' → ' + K.tashkilLevel(t, l) + ' (attendu ' + w + ')');
ok(!sbad.length, 'niveaux : ' + SPECIAL.length + ' cas particuliers (Coran en trois encodages, ʿAmr, tanwīn sur l’alif, tatwīl, ﷲ…)' + (sbad.length ? ' — ' + sbad.join(' ; ') : ''));
// tashkīl complet sans soukoun ou avec signes sur le tatwīl : reconnu comme complet
const covLow = ['\u0645\u0640\u064F\u062D\u0640\u064E\u0645\u0640\u064E\u0651\u062F\u064C', '\u0628\u0640\u0650\u0633\u0640\u0652\u0645\u0650 \u0627\u0644\u0640\u0644\u0651\u0640\u0647\u0650', '\u0627\u0644\u0639\u0650\u0644\u0645\u064F \u0646\u064F\u0648\u0631\u064C', '\u0635\u064E\u0628\u0631', '\u0647\u0650\u0646\u062F'].filter(v => K.tashkilCoverage(v) < 0.6);
ok(!covLow.length, 'tashkīl complet reconnu sans soukoun et sur tatwīl (مـُحـَمـَّدٌ، العِلمُ نُورٌ، صَبر)' + (covLow.length ? ' — ' + covLow.join(' ; ') : ''));
// textes mêlés : latin, chiffres, ponctuation et hamza combinante restent tels quels
const mix = 'Atelier ٢٠٢٦ : «اللَّهُ أَكْبَرُ»، Café';
ok(K.tashkilLevel(mix, 'none') === 'Atelier ٢٠٢٦ : «الله أكبر»، Café' && K.tashkilLevel('أ', 'none') === 'أ', 'niveaux : latin, chiffres, ponctuation et hamza combinante gardés');
// part vocalisée : les textes vocalisés de l'atelier passent pour complets, les textes « de presse » pour partiels
const lowFull = [...new Set([].concat(...LIBRARY.map(c => c.items.map(it => it[2]).filter(Boolean)), TK_EXTRA))].filter(v => K.tashkilCoverage(v) < 0.6);
ok(!lowFull.length, 'tashkīl complet reconnu sur tous les textes vocalisés du catalogue' + (lowFull.length ? ' — ' + lowFull.join(' ; ') : ''));
ok(['أهلاً وسهلاً', 'محمّد رسول الله', 'شكراً'].every(v => K.tashkilCoverage(v) < 0.6) && K.tashkilCoverage('الخط العربي') === 0, 'tashkīl partiel reconnu (أهلاً وسهلاً, محمّد, شكراً)');

console.log(fails ? fails + ' échec(s)' : 'tashkīl : tout est bon');
process.exitCode = fails ? 1 : 0;
