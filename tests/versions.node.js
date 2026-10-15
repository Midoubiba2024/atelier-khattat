// Numéros de version : versions.json suit la règle (0,01 petite mise à jour, 0,1 moyenne, 1 grande),
// package.json porte le même numéro, et l'outil de nouvelle version calcule et écrit le bon numéro
const fs = require('fs'), path = require('path'), os = require('os');
const V = require('../tools/versions.js');
const ROOT = path.join(__dirname, '..');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fails++; };
const throws = (f, re) => { try { f(); return false; } catch (e) { return re.test(e.message); } };

// 1. le fichier du dépôt
const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'versions.json'), 'utf8'));
ok(!throws(() => V.check(list), /./), 'versions.json : ' + list.length + ' versions, chaque numéro suit la règle (actuelle : ' + list[0].v + ')');
ok(V.serialize(list) === fs.readFileSync(path.join(ROOT, 'versions.json'), 'utf8'), 'versions.json : mise en forme identique à celle de l’outil');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
ok(pkg.version === V.semver(list[0].v), 'package.json : ' + pkg.version + ' = version ' + list[0].v);

// 2. la règle
const cases = [['7.42', 'minime', '7.43'], ['7.42', 'moyenne', '7.52'], ['7.42', 'grande', '8.42'], ['7.49', 'minime', '7.5'],
  ['7.99', 'minime', '8.0'], ['7.95', 'moyenne', '8.05'], ['6.4', 'minime', '6.41'], ['9.9', 'moyenne', '10.0']];
const bad = cases.filter(([v, l, w]) => V.next(v, l) !== w).map(([v, l, w]) => v + ' + ' + l + ' → ' + V.next(v, l) + ' (attendu ' + w + ')');
ok(!bad.length, 'calcul : ' + cases.map(c => c[0] + ' ' + c[1] + ' → ' + c[2]).join(', ') + (bad.length ? ' — ' + bad.join(' ; ') : ''));
const e = (v, level, prev) => [{ v, date: '2026-10-16', level, notes: ['x'] }, { v: prev, date: '2026-10-15', level: '', notes: ['y'] }];
ok(throws(() => V.check(e('7.5', 'minime', '7.41')), /donne 7\.42/), 'refuse un saut qui ne suit pas la règle (7.41 → 7.5 en minime)');
ok(throws(() => V.check(e('7.42', 'petite', '7.41')), /inconnu/), 'refuse un niveau inconnu');
ok(throws(() => V.check(e('7.421', 'minime', '7.42')), /invalide/), 'refuse trois décimales');
ok(throws(() => V.check(e('7.50', 'moyenne', '7.4')), /à écrire 7\.5/), 'impose l’écriture courte (7.5 et non 7.50)');
ok(throws(() => V.check([{ v: '7.43', date: '2026-10-14', level: 'minime', notes: ['x'] }, { v: '7.42', date: '2026-10-15', level: '', notes: ['y'] }]), /datée avant/), 'refuse une date antérieure');
ok(throws(() => V.check([{ v: '7.43', date: '2026-10-16', level: 'minime', notes: [] }, { v: '7.42', date: '2026-10-15', level: '', notes: ['y'] }]), /incomplète/), 'refuse une version sans nouveauté');

// 3. le numéro de package.json garde l'ordre des décimales (7.49 < 7.5 < 7.51 ; 8.05 < 8.1)
const sv = v => V.semver(v).split('.').map(Number);
const less = (a, b) => { const x = sv(a), y = sv(b); return x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]); };
let walk = '5.1', order = true;
const levels = ['minime', 'minime', 'moyenne', 'minime', 'grande', 'moyenne'];
for (let i = 0; i < 400; i++) { const n = V.next(walk, levels[(i * 7 + (i >> 2)) % levels.length]); if (!less(walk, n)) order = false; walk = n; }
ok(order && less('7.49', '7.5') && less('8.05', '8.1'), 'package.json : l’ordre des numéros est celui des décimales (400 mises à jour, jusqu’à ' + walk + ')');

// 4. l'outil de nouvelle version, sur une copie
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'khattat-v-'));
for (const f of ['versions.json', 'package.json']) fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
const r = V.bump(tmp, 'moyenne', ['  Une nouveauté.  ', ''], '2099-01-01');
const after = JSON.parse(fs.readFileSync(path.join(tmp, 'versions.json'), 'utf8'));
const pk2 = JSON.parse(fs.readFileSync(path.join(tmp, 'package.json'), 'utf8'));
ok(r.to === V.next(list[0].v, 'moyenne') && after[0].v === r.to && after[0].level === 'moyenne' && after[0].notes.join('|') === 'Une nouveauté.' &&
  after.length === list.length + 1 && pk2.version === V.semver(r.to), 'outil : ' + r.from + ' → ' + r.to + ' en moyenne, versions.json et package.json à jour');
ok(throws(() => V.bump(tmp, 'grande', ['  ']), /nouveauté/), 'outil : refuse une version sans nouveauté');
fs.rmSync(tmp, { recursive: true, force: true });

console.log(fails ? fails + ' échec(s)' : 'versions : tout est bon');
process.exitCode = fails ? 1 : 0;
