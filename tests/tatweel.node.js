globalThis.self = globalThis;
const fs = require('fs'); require('../src/engine.js');
const K = globalThis.Khatt;
(async () => {
  await K.HB.initWasm(fs.readFileSync('site/harfbuzz.wasm'));
  for (const f of fs.readdirSync('site/fonts').filter(x => x.endsWith('.ttf')).sort()) {
    const font = new K.Font(fs.readFileSync('site/fonts/' + f));
    const sp = font.shape(' ', false), tw = font.shape('بـــب', true), b2 = font.shape('بب', true);
    const twAdv = tw.ax.reduce((a, b) => a + b, 0) - b2.ax.reduce((a, b) => a + b, 0);
    console.log(f.padEnd(24), 'tatweel', font.hasChar(0x640) ? 'yes' : 'NO ', 'stretch+', String(Math.round(twAdv / font.upem * 1000)).padStart(5), '‰em', ' space', Math.round(sp.ax[0] / font.upem * 1000), '‰em');
  }
})();
