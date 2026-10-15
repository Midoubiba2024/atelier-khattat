// Tashkīl des textes de l'atelier : chaque texte vocalisé garde exactement les lettres du texte d'origine,
// et chaque texte d'exemple (modèles, exemples rapides) trouve sa vocalisation dans le catalogue
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

console.log(fails ? fails + ' échec(s)' : 'tashkīl : tout est bon');
process.exitCode = fails ? 1 : 0;
