// S-W17/S-W18: Kleine Rundfahrt auf der Seite. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/etappe_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
const linkInfo = p => p.evaluate(() => { const a = document.querySelector('#info a.ng-zurueck'); if (!a) return null; const b = a.getBoundingClientRect();
  return { h: b.height, l: b.left, r: b.right, vw: innerWidth, sicht: b.width > 0 && getComputedStyle(a).visibility !== 'hidden', href: a.getAttribute('href'), erst: document.querySelector('a.ng-zurueck') === a }; });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  for (const [gesperrt, lauf] of [[false, 1], [false, 2], [true, 1]]) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage(); const hosts = new Set(), fe = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('pageerror', e => fe.push(String(e)));
    if (gesperrt) await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); });
    await p.goto(`http://localhost:${port}/etappenrennen/`); await p.waitForTimeout(400);
    const n = gesperrt ? 'PS-3 Speicher gesperrt' : lauf === 2 ? 'PS-5 zweites Laden' : 'PS-1';
    const z = await p.evaluate(() => { const e = document.getElementById('zielband'); return { menue: !document.getElementById('einst').hidden, band: e && !e.hidden ? e.textContent : null }; });
    ok(`${n}: Sofortstart ohne Menü`, !z.menue && z.band === 'ETAPPE 1/3 · ZIEL ★★★ unter 1:16', JSON.stringify(z));
    const a = await p.screenshot(); await p.waitForTimeout(3500);
    const c = await p.screenshot(); ok(`${n}: Bild verändert sich ohne Tippen`, Buffer.compare(a, c) !== 0);
    ok(`${n}: kein fremder Host`, hosts.size === 0, [...hosts].join());
    ok(`${n}: keine Prüfhaken`, await p.evaluate(() => typeof window.__proto === 'undefined'));
    ok(`${n}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    const l = await linkInfo(p); ok(`${n}: Zurück-Link im Infostreifen`, l && l.sicht && l.erst && l.h >= 44 && l.l >= 0 && l.r <= l.vw && l.href === '../', JSON.stringify(l));
    ok(`${n}: kein waagerechtes Scrollen`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (!gesperrt && lauf === 1) {
      await p.screenshot({ path: process.env.BILD || '/tmp/etappe_seite.png' });
      await p.setViewportSize({ width: 915, height: 412 }); await p.waitForTimeout(500);
      const q = await linkInfo(p); ok('PS-2 Querformat: Zurück-Link im Bild', q && q.sicht && q.h >= 44 && q.l >= 0 && q.r <= q.vw, JSON.stringify(q));
      await p.setViewportSize({ width: 412, height: 915 }); await p.click('#menue'); await p.waitForTimeout(400);
      const m = await p.evaluate(() => ({ h1: document.querySelector('#einst h1').textContent, karten: document.querySelectorAll('#etappen .etappe').length, alle: [...document.querySelectorAll('#einst a[href="../"]')].some(a => a.offsetParent && /Alle Spiele/.test(a.textContent)) }));
      ok('PS-1 Menü: Kleine Rundfahrt, 3 Karten, Alle Spiele', m.h1 === 'Kleine Rundfahrt' && m.karten === 3 && m.alle, JSON.stringify(m));
      if (process.env.BILD_MENUE) await p.screenshot({ path: process.env.BILD_MENUE });
    }
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
