const { launch, BASE } = require('./env');
const fs = require('fs');
(async () => {
  const browser = await launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 }, acceptDownloads: true });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text() + ' @ ' + JSON.stringify(m.location())); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
  const t0 = Date.now();
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#preview svg', { timeout: 20000 });
  console.log('preview ready in', Date.now() - t0, 'ms');
  await page.waitForFunction(() => document.querySelectorAll('.card-art svg').length >= 12, null, { timeout: 20000 });
  await page.waitForTimeout(1200);
  console.log('cards rendered:', await page.$$eval('.card-art svg', a => a.length), 'engine:', await page.textContent('#engineInfo'));
  await page.screenshot({ path: 'out/ui_desktop.png' });
  // exports
  fs.mkdirSync('out/dl', { recursive: true });
  for (const x of ['png', 'jpg', 'webp', 'svg', 'pdf', 'cut', 'zip']) {
    const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.click(`.dl button[data-x="${x}"]`)]);
    const p = 'out/dl/' + dl.suggestedFilename();
    await dl.saveAs(p);
    console.log('download', x, '->', dl.suggestedFilename(), fs.statSync(p).size, 'bytes', '| status:', await page.textContent('#status'));
  }
  // change text, style, format, mood
  await page.fill('#txt', 'بسم الله الرحمن الرحيم\nالحمد لله');
  await page.click('.card[data-id="gulzar"]');
  await page.click('#tab-fmt');
  await page.click('.fmt[data-v="square"]');
  await page.click('.mood:nth-child(2)');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'out/ui_desktop2.png' });
  console.log('meta:', await page.textContent('#meta'));
  // dark + mobile
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark', deviceScaleFactor: 2 });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errors.push('mobile pageerror: ' + e.message));
  await p2.goto(BASE + 'index.html');
  await p2.waitForSelector('#preview svg', { timeout: 20000 });
  await p2.waitForTimeout(1500);
  await p2.screenshot({ path: 'out/ui_mobile_dark.png' });
  const overflowX = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log('mobile horizontal overflow px:', overflowX);
  await p2.screenshot({ path: 'out/ui_mobile_full.png', fullPage: true });
  console.log('ERRORS/WARNINGS:', errors.length ? '\n' + errors.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('TEST FAIL', e); process.exit(1); });
