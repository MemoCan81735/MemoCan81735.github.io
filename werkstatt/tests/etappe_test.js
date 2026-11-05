// S-W17: Alpenetappe auf der Seite. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/etappe_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  for (const gesperrt of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const hosts = new Set(), fe = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('pageerror', e => fe.push(String(e)));
    if (gesperrt) await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); });
    await p.goto(`http://localhost:${port}/etappenrennen/`); await p.waitForTimeout(1500);
    const n = gesperrt ? 'PS-3 Speicher gesperrt' : 'PS-1';
    ok(`${n}: kein fremder Host`, hosts.size === 0, [...hosts].join());
    ok(`${n}: keine Prüfhaken`, await p.evaluate(() => typeof window.__proto === 'undefined'));
    ok(`${n}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    const a = await p.screenshot();
    await p.click('#start').catch(() => {}); await p.waitForTimeout(3500);
    const c = await p.screenshot(); ok(`${n}: Bild verändert sich`, Buffer.compare(a, c) !== 0);
    const breit = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); ok(`${n}: kein waagerechtes Scrollen`, breit);
    if (!gesperrt) { await p.screenshot({ path: process.env.BILD || '/tmp/etappe_seite.png' }); }
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
