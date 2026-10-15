// Lance les tests : node tests/run.js [--tout]
//   tests du moteur (Node seul), puis tests de l'atelier dans le navigateur (serveur local démarré automatiquement)
//   --tout ajoute la comparaison des rendus SVG / Canvas / PDF / EPS (Linux : poppler-utils, ghostscript, Python + Pillow + numpy)
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { ROOT, PORT, out } = require('./env');

const NODE_TESTS = ['exports.node.js', 'formes.node.js', 'kashida.node.js', 'decoupe.node.js', 'tatweel.node.js', 'compositions.node.js', 'tashkil.node.js'];
const BROWSER_TESTS = ['fumee.test.js', 'atelier.test.js', 'interface.test.js', 'csp-et-polices.test.js', 'formes-interface.test.js',
  'couleurs-interface.test.js', 'telechargements.test.js', 'claude-simule.test.js', 'apprendre.test.js', 'ecrans.test.js', 'nouveautes.test.js'];
const EXTRA = process.argv.includes('--tout') ? ['rendu-moteurs.node.js'] : [];

if (!fs.existsSync(path.join(ROOT, 'site/index.html'))) {
  console.error('site/index.html est absent : lancez d’abord « npm run build ».');
  process.exit(1);
}
for (const d of ['dl', 'dl2', 'dlg', 'v5', 'smoke', 'render']) out(d);

function run(file) {
  console.log('\n=== ' + file);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], { cwd: ROOT, stdio: 'inherit', env: process.env });
  const ok = r.status === 0;
  console.log((ok ? '--- réussi ' : '--- ÉCHEC ') + file + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  return { file, ok };
}

(async () => {
  const results = NODE_TESTS.map(run);
  // serveur local : on réutilise celui qui tourne déjà sur le port, sinon on en démarre un
  let server = null;
  const busy = await new Promise(res => {
    const s = require('net').connect(PORT, '127.0.0.1', () => { s.end(); res(true); });
    s.on('error', () => res(false));
  });
  if (!busy) { server = require('../tools/serve.js'); await new Promise(r => server.listening ? r() : server.once('listening', r)); }
  else console.log('\n(serveur déjà actif sur le port ' + PORT + ')');
  for (const f of BROWSER_TESTS.concat(EXTRA)) results.push(run(f));
  if (server) server.close();
  const failed = results.filter(r => !r.ok);
  console.log('\n' + (failed.length ? failed.length + ' test(s) en échec : ' + failed.map(r => r.file).join(', ') : 'Tous les tests sont réussis (' + results.length + ').'));
  process.exit(failed.length ? 1 : 0);
})();
