// Numéros de version de l'atelier (versions.json, la plus récente en premier).
// Règle : le numéro avance de 0,01 pour une petite mise à jour (minime), de 0,1 pour une moyenne et de 1 pour une grande.
//   7.42 → minime 7.43 · moyenne 7.52 · grande 8.42
// Nouvelle version : node tools/versions.js <minime|moyenne|grande> "nouveauté" ["autre nouveauté" …]
//   (ou npm run nouvelle-version -- moyenne "…") : ajoute l'entrée datée du jour en tête de versions.json
//   et met package.json au même numéro ; il reste à lancer npm run build.
// build.js et les tests utilisent check() : un numéro qui ne suit pas la règle arrête la construction.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STEP = { minime: 1, moyenne: 10, grande: 100 }; // en centièmes
const LEVELS = Object.keys(STEP);
const LABEL = { minime: 'petite mise à jour', moyenne: 'mise à jour moyenne', grande: 'grande mise à jour' };

// "7.42" → 742 (centièmes) ; au plus deux décimales
function hund(v) {
  if (typeof v !== 'string' || !/^\d+(\.\d{1,2})?$/.test(v)) throw new Error('numéro de version invalide : ' + v);
  return Math.round(parseFloat(v) * 100);
}
// 742 → "7.42", 750 → "7.5", 800 → "8.0"
const fmt = h => (h / 100).toFixed(2).replace(/0$/, '');
function next(v, level) {
  if (!STEP[level]) throw new Error('niveau « ' + level + ' » inconnu (' + LEVELS.join(', ') + ')');
  return fmt(hund(v) + STEP[level]);
}
// numéro pour package.json : les centièmes deviennent le second nombre (7.42 → 7.42.0, 7.5 → 7.50.0, 8.05 → 8.5.0),
// ce qui garde le même ordre que les décimales
const semver = v => { const h = hund(v); return Math.floor(h / 100) + '.' + (h % 100) + '.0'; };

// vérifie la liste entière ; renvoie la liste
function check(list) {
  if (!Array.isArray(list) || !list.length) throw new Error('versions.json : aucune version');
  list.forEach((x, i) => {
    const ok = x && typeof x.v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date || '') && Array.isArray(x.notes) && x.notes.length &&
      x.notes.every(n => typeof n === 'string' && n.trim());
    if (!ok) throw new Error('version incomplète (numéro, date AAAA-MM-JJ, nouveautés) : ' + JSON.stringify(x).slice(0, 90));
    if (fmt(hund(x.v)) !== x.v) throw new Error('version ' + x.v + ' : à écrire ' + fmt(hund(x.v)));
    const prev = list[i + 1];
    if (!prev) return; // la première version n'a pas de niveau
    if (!STEP[x.level]) throw new Error('version ' + x.v + ' : niveau « ' + x.level + ' » inconnu (' + LEVELS.join(', ') + ')');
    const want = next(prev.v, x.level);
    if (x.v !== want) throw new Error('version ' + x.v + ' : une mise à jour ' + x.level + ' après ' + prev.v + ' donne ' + want);
    if (x.date < prev.date) throw new Error('version ' + x.v + ' : datée avant la version ' + prev.v);
  });
  return list;
}

// même mise en forme que le fichier écrit à la main : une entrée par bloc, une nouveauté par ligne
function serialize(list) {
  const J = s => JSON.stringify(s);
  return '[\n' + list.map(x => '  {\n    "v": ' + J(x.v) + ', "date": ' + J(x.date) + ', "level": ' + J(x.level || '') + ',\n    "notes": [\n' +
    x.notes.map(n => '      ' + J(n)).join(',\n') + '\n    ]\n  }').join(',\n') + '\n]\n';
}

// date du jour à Paris, AAAA-MM-JJ
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

// ajoute une version en tête de versions.json et met package.json au même numéro ; renvoie { from, to }
function bump(root, level, notes, date) {
  const vf = path.join(root, 'versions.json'), pf = path.join(root, 'package.json');
  const list = check(JSON.parse(fs.readFileSync(vf, 'utf8')));
  notes = (notes || []).map(n => String(n).trim()).filter(Boolean);
  if (!notes.length) throw new Error('indiquez au moins une nouveauté');
  const entry = { v: next(list[0].v, level), date: date || today(), level, notes };
  const all = check([entry].concat(list));
  const pkg = fs.readFileSync(pf, 'utf8');
  if (!/"version":\s*"[^"]*"/.test(pkg)) throw new Error('package.json : champ « version » absent');
  fs.writeFileSync(vf, serialize(all));
  fs.writeFileSync(pf, pkg.replace(/("version":\s*)"[^"]*"/, '$1"' + semver(entry.v) + '"'));
  return { from: list[0].v, to: entry.v };
}

module.exports = { STEP, LEVELS, LABEL, hund, fmt, next, semver, check, serialize, today, bump };

if (require.main === module) {
  const [level, ...notes] = process.argv.slice(2);
  if (!STEP[level] || !notes.length) {
    console.error('Usage : node tools/versions.js <' + LEVELS.join('|') + '> "nouveauté" ["autre nouveauté" …]\n' +
      '  minime +0.01 · moyenne +0.1 · grande +1');
    process.exit(1);
  }
  try {
    const r = bump(ROOT, level, notes);
    console.log('version ' + r.from + ' → ' + r.to + ' (' + LABEL[level] + ') : versions.json et package.json mis à jour ; lancez npm run build');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
