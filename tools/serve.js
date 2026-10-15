// Petit serveur local pour site/ : node tools/serve.js [port]  →  http://localhost:8766
// (les polices et le moteur sont chargés par l'atelier : il faut un serveur, une ouverture directe du fichier ne suffit pas)
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'site');
const PORT = +(process.argv[2] || process.env.KHATTAT_PORT || 8766);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.wasm': 'application/wasm',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch (e) { res.writeHead(400); return res.end('Requête invalide'); }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('Interdit'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Introuvable'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
});
server.listen(PORT, '127.0.0.1', () => console.log('Atelier Khattat : http://localhost:' + PORT + '  (Ctrl+C pour arrêter)'));
// « localhost » peut désigner l'adresse IPv6 ::1 (Windows) : on répond aussi sur celle-ci quand elle existe
const v6 = http.createServer(server.listeners('request')[0]);
v6.on('error', () => {});
v6.listen(PORT, '::1');
server.on('close', () => v6.close());
module.exports = server;
