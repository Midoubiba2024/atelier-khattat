// Assemble l'atelier à partir des sources :
//   src/app.html (gabarit) + modules du moteur (src/*.js) + application (src/app/*.js, dans l'ordre des noms)
// Produit :
//   site/index.html      page complète, à servir telle quelle (GitHub Pages, serveur local, tout hébergeur statique)
//   artifact/index.html  même page sans l'enveloppe <html>/<head>, pour la publier comme artefact Claude
// Les polices, harfbuzz.wasm, hb-fallback.js et clipper.js sont déjà dans site/ et ne changent pas.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

let html = rd('src/app.html');
const mods = {
  '/*@ENGINE@*/': 'src/engine.js', '/*@SHAPE@*/': 'src/shape.js', '/*@FX@*/': 'src/fx.js',
  '/*@ORNAMENT@*/': 'src/ornament.js', '/*@EXPORT@*/': 'src/export.js', '/*@MOCKUP@*/': 'src/mockup.js'
};
const scripts = [];
for (const [mark, file] of Object.entries(mods)) {
  if (!html.includes(mark)) throw new Error('emplacement absent dans src/app.html : ' + mark);
  const js = rd(file);
  scripts.push([file, js]);
  html = html.split(mark).join(js);
}

// application : parties concaténées dans une seule fonction (variables partagées)
const parts = fs.readdirSync(path.join(ROOT, 'src/app')).filter(f => /\.js$/.test(f)).sort();
let app = "(function () {\n  'use strict';\n";
for (const f of parts) app += '\n  // ===== ' + f + '\n' + rd(path.join('src/app', f));
app += '\n})();\n';
if (!html.includes('/*@APP@*/')) throw new Error('emplacement absent dans src/app.html : /*@APP@*/');
if (!app.includes('/*@COPYRIGHTS@*/{}')) throw new Error('emplacement des copyrights absent');
app = app.split('/*@COPYRIGHTS@*/{}').join(rd('copyrights.json').trim());
scripts.push(['src/app/*.js', app]);
html = html.split('/*@APP@*/').join(app);

// contrôles : syntaxe de chaque script (compilé sans être exécuté) et aucune balise </script> dans le code
for (const [name, js] of scripts) {
  try { new vm.Script(js, { filename: name }); }
  catch (e) { throw new Error('erreur de syntaxe dans ' + name + ' : ' + e.message); }
  if (/<\/script>/i.test(js)) throw new Error('balise </script> dans ' + name);
}

// page complète (même enveloppe que celle ajoutée par Claude autour d'un artefact, plus la langue et une icône)
const icon = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' rx='14' fill='#101b3d'/>" +
  "<text x='32' y='45' font-size='38' text-anchor='middle' fill='#e3c06a' font-family='serif'>خ</text></svg>";
const head = '<!doctype html><html lang="fr"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(icon) + '">' +
  '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
  'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>';
fs.writeFileSync(path.join(ROOT, 'site/index.html'), head + html + '</body></html>\n');
fs.mkdirSync(path.join(ROOT, 'artifact'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'artifact/index.html'), html);
console.log('site/index.html et artifact/index.html : ' + Math.round(html.length / 1024) + ' Ko');
