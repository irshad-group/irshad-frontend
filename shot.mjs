import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1280, height: 1200 }, deviceScaleFactor: 1 })).newPage();
const evs = [];
p.on('console', (m) => evs.push(m.type() + ': ' + m.text().slice(0, 120)));
p.on('pageerror', (e) => evs.push('pageerror: ' + String(e).slice(0, 160)));
await p.goto('http://localhost:3182/ar/directorates/directorate-of-public-health', { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(9000);
const box = await p.locator('aside a[href*="openstreetmap.org"]').first();
await box.scrollIntoViewIfNeeded();
await p.waitForTimeout(3000);
await box.screenshot({ path: 'map-box.png' });
const info = await p.evaluate(() => ({
  markers: document.querySelectorAll('aside .maplibregl-marker').length,
  canvasPixelsNonBlank: (() => {
    const c = document.querySelector('aside canvas');
    if (!c) return null;
    // read back through a 2d copy
    const t = document.createElement('canvas'); t.width = c.width; t.height = c.height;
    t.getContext('2d').drawImage(c, 0, 0);
    const d = t.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const seen = new Set();
    for (let i = 0; i < d.length; i += 4 * 97) seen.add(`${d[i]},${d[i+1]},${d[i+2]}`);
    return { distinctColours: seen.size, sample: [...seen].slice(0, 5) };
  })(),
}));
console.log(JSON.stringify(info, null, 1));
console.log('console:', evs.filter(e => /error|warn/i.test(e)).slice(0, 6).join('\n') || '(clean)');
await b.close();
