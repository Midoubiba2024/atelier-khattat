// Réglages communs des tests
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = +(process.env.KHATTAT_PORT || 8766);
const BASE = process.env.KHATTAT_URL || 'http://localhost:' + PORT + '/';

// navigateur : CHROME_PATH s'il est défini, sinon le Chromium de l'environnement d'intégration, sinon Google Chrome installé
function launchOptions() {
  if (process.env.CHROME_PATH) return { executablePath: process.env.CHROME_PATH };
  const ci = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  if (fs.existsSync(ci)) return { executablePath: ci };
  return { channel: 'chrome' };
}
const launch = () => require('playwright-core').chromium.launch(launchOptions());

// dossier de sortie (captures, fichiers téléchargés), créé au besoin
function out(...p) {
  const d = path.join(ROOT, 'out', ...p);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

module.exports = { ROOT, PORT, BASE, launch, out };
