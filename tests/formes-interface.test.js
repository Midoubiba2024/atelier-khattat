const { launch, BASE } = require('./env');
const fs = require('fs');
(async () => {
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 940 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|404/.test(m.text())) errs.push(m.text()); });
  await page.goto(BASE + 'index.html');
  await page.waitForSelector('#preview svg');
  await page.fill('#txt', 'بسم الله الرحمن الرحيم');
  await page.click('#tool-forme');
  const shots = [];
  const grp = { arc: 'line', circle: 'closed', wave: 'line', spiral: 'line', bulge: 'warp', free: 'line' };
  for (const id of ['arc', 'circle', 'wave', 'spiral', 'bulge']) {
    await page.click(`#shapeGroups button[data-v="${grp[id]}"]`);
    await page.click(`#shapeThumbs .sthumb[data-v="${id}"]`);
    await page.waitForTimeout(250);
    console.log(id, '| meta:', (await page.textContent('#meta')).replace(/\s+/g, ' '), '| hint:', await page.textContent('#shapeHint'));
    if (id === 'circle') {
      await page.click('#shapeParams .seg button:has-text("Double")');
      await page.waitForTimeout(200);
    }
    await page.screenshot({ path: `out/forme_${id}.png`, clip: { x: 500, y: 110, width: 930, height: 690 } });
  }
  // tracé libre : dessin à la souris
  await page.click('#shapeGroups button[data-v="line"]');
  await page.click('#shapeThumbs .sthumb[data-v="free"]');
  await page.click('#drawBtn');
  const box = await page.locator('.drawpad').boundingBox();
  await page.mouse.move(box.x + box.width * 0.85, box.y + box.height * 0.3);
  await page.mouse.down();
  for (let i = 0; i <= 30; i++) { const t = i / 30; await page.mouse.move(box.x + box.width * (0.85 - 0.7 * t), box.y + box.height * (0.5 + 0.25 * Math.sin(t * 6.28))); }
  await page.mouse.up();
  await page.waitForTimeout(300);
  console.log('free | status:', await page.textContent('#status'), '| drawpad gone:', !(await page.$('.drawpad')));
  await page.screenshot({ path: 'out/forme_free.png', clip: { x: 500, y: 110, width: 930, height: 690 } });
  // largeur + taille réelle
  await page.click('#shapeThumbs .sthumb[data-v="arc"]');
  await page.fill('#shWidth', '150'); await page.dispatchEvent('#shWidth', 'input');
  await page.click('#tool-format');
  await page.check('#physOn');
  await page.fill('#physVal', '120'); await page.dispatchEvent('#physVal', 'input');
  await page.waitForTimeout(300);
  console.log('phys | meta:', (await page.textContent('#meta')).replace(/\s+/g, ' '), '| hint:', await page.textContent('#physHint'));
  fs.mkdirSync('out/dl2', { recursive: true });
  await page.click('#dlOpen');
  for (const x of ['pdf', 'png', 'zip']) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`#exportBox .dl button[data-x="${x}"]`)]);
    await dl.saveAs('out/dl2/' + dl.suggestedFilename());
    console.log('download', dl.suggestedFilename());
  }
  await page.click('#exportClose');
  await page.screenshot({ path: 'out/forme_panel.png' });
  console.log('errors:', errs.length ? errs.join('\n') : 'none');
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
