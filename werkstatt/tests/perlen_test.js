// S-W19: Perlenwerkstatt auf der Seite. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/perlen_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch();
  for (const fall of ['PS-1', 'PS-3 Speicher gesperrt', 'PS-2 Querformat']) {
    const quer = fall.includes('Quer'), ctx = await b.newContext({ viewport: quer ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage(), hosts = new Set(), fe = [], fehlt = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('response', r => { if (r.status() >= 400) fehlt.push(r.url()); });
    p.on('pageerror', e => fe.push(String(e)));
    await p.addInitScript(gesperrt => { if (gesperrt) Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); }, fall.includes('gesperrt'));
    const t0 = Date.now(); await p.goto(`http://localhost:${port}/perlen/`); await p.waitForSelector('.ideen [data-idee]:nth-child(12)');
    ok(`${fall}: lädt in unter 3 s`, Date.now() - t0 < 3000, (Date.now() - t0) + ' ms');
    const sym = await p.evaluate(async () => { const m = await (await fetch(document.querySelector('link[rel=manifest]').href)).json(); const i = m.icons.find(x => x.sizes === '512x512'); const r = await fetch(new URL(i.src, document.querySelector('link[rel=manifest]').href)); return [m.name, r.status]; });
    ok(`${fall}: Symbol im Manifest`, sym[0] === 'Perlenwerkstatt' && sym[1] === 200, JSON.stringify(sym));
    ok(`${fall}: kein Artifact-Betrachter`, await p.evaluate(() => typeof window.claude === 'undefined'));
    const z = await p.evaluate(() => { const a = document.querySelector('a.ng-zurueck'), r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), h: r.height, sichtbar: r.width > 0 && getComputedStyle(a).display !== 'none' }; });
    ok(`${fall}: Zurück-Link sichtbar`, z.href === '../' && z.h >= 44 && z.sichtbar, JSON.stringify(z));
    await p.click('[data-idee="0"]'); await p.waitForTimeout(300);
    const ring = await p.evaluate(() => { const c = document.getElementById('vorschau'); if (!c) return 0; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 0) n++; return n; });
    ok(`${fall}: Idee zeigt Ringvorschau`, ring > 1000, String(ring));
    if (!quer) await p.screenshot({ path: process.env.BILD || '/tmp/perlen_seite.png' });
    await p.click('[data-reiter="einkauf"]'); await p.waitForTimeout(200);
    const zeilen = await p.$$eval('.liste li', l => l.length); ok(`${fall}: Einkaufsliste gefüllt`, zeilen >= 5, String(zeilen));
    await p.click('[data-reiter="anleitung"]'); await p.waitForTimeout(200);
    const schritte = await p.$$eval('ol.schritte li', l => l.length); ok(`${fall}: Anleitung mit Schritten`, schritte >= 5, String(schritte));
    const breit = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); ok(`${fall}: kein waagerechtes Scrollen`, breit);
    ok(`${fall}: kein fremder Host`, hosts.size === 0, [...hosts].join()); ok(`${fall}: alle Dateien da`, fehlt.length === 0, fehlt.join());
    ok(`${fall}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
