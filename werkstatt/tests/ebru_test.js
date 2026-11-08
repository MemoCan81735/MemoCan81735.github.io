// S-W18: Ebru auf der Seite (seit S-W21 Ebru 2.0 mit klassischer Fassung für Geräte ohne WebGL 2). Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/ebru_test.js [Ordner]
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
    await p.addInitScript(gesperrt => { window.__laden = []; navigator.share = undefined; navigator.canShare = undefined;
      const k = HTMLAnchorElement.prototype.click; HTMLAnchorElement.prototype.click = function () { if (this.download) { window.__laden.push(this.download); return; } return k.call(this); };
      if (gesperrt) Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); }, fall.includes('gesperrt'));
    await p.goto(`http://localhost:${port}/ebru/`); await p.waitForFunction(() => window.__ebru && window.__ebru.sitzung());
    const sym = await p.evaluate(async () => { const m = await (await fetch(document.querySelector('link[rel=manifest]').href)).json(); const i = m.icons.find(x => x.sizes === '512x512'); const r = await fetch(new URL(i.src, document.querySelector('link[rel=manifest]').href)); return [m.name, r.status]; });
    ok(`${fall}: Symbol im Manifest`, sym[0] === 'Ebru' && sym[1] === 200, JSON.stringify(sym));
    ok(`${fall}: kein Artifact-Betrachter`, await p.evaluate(() => typeof window.claude === 'undefined'));
    const z = await p.evaluate(() => { const a = document.querySelector('a.ng-zurueck'), r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), h: r.height, sichtbar: r.width > 0 && getComputedStyle(a).display !== 'none' }; });
    ok(`${fall}: Zurück-Link sichtbar`, z.href === '../' && z.h >= 44 && z.sichtbar, JSON.stringify(z));
    await p.waitForTimeout(9500); const n0 = await p.evaluate(() => window.__ebru.sitzung().becken.polys.length);
    const fl = await p.evaluate(() => { const r = document.getElementById('flaeche').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height * 0.7]; });
    await p.mouse.click(...fl); await p.waitForTimeout(400); const n1 = await p.evaluate(() => window.__ebru.sitzung().becken.polys.length);
    ok(`${fall}: Tippen setzt Tropfen`, n1 > n0, n0 + ' -> ' + n1);
    if (!quer) await p.screenshot({ path: process.env.BILD || '/tmp/ebru_seite.png' });
    await p.click('#abdruck'); await p.waitForFunction(() => window.__ebru.sitzung().phase === 'ergebnis', null, { timeout: 6000 }); await p.waitForTimeout(300);
    await p.click('#teilen'); await p.waitForTimeout(800); const geladen = await p.evaluate(() => window.__laden);
    ok(`${fall}: Teilen ohne Betrachter lädt ebru.png`, geladen.length === 1 && geladen[0] === 'ebru.png', JSON.stringify(geladen));
    const breit = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); ok(`${fall}: kein waagerechtes Scrollen`, breit);
    ok(`${fall}: kein fremder Host`, hosts.size === 0, [...hosts].join()); ok(`${fall}: alle Dateien da`, fehlt.length === 0, fehlt.join());
    ok(`${fall}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    await ctx.close();
  }
  // S-W21: Ebru 2.0 zeichnet über die Grafikkarte; ohne WebGL 2 führt der Hinweis zur klassischen Fassung, die selbst läuft
  { const ctx = await b.newContext({ viewport: { width: 412, height: 915 } }), p = await ctx.newPage(), fe = []; p.on('pageerror', e => fe.push(String(e)));
    await p.goto(`http://localhost:${port}/ebru/`); await p.waitForFunction(() => window.__ebru && window.__ebru.sitzung());
    const gl = await p.evaluate(() => (window.__ebru.gl ? window.__ebru.gl() : null)); ok('PS-6: Ebru 2.0 mit WebGL 2 (Grafikkarte)', !!gl && gl.version === 2 && !gl.verloren, JSON.stringify(gl));
    ok('PS-6: Titel Ebru', (await p.title()) === 'Ebru', await p.title()); ok('PS-6: keine Seitenfehler', fe.length === 0, fe.join(' | ')); await ctx.close(); }
  { const ctx = await b.newContext({ viewport: { width: 412, height: 915 } }), p = await ctx.newPage(), fe = [], fehlt = []; p.on('pageerror', e => fe.push(String(e))); p.on('response', r => { if (r.status() >= 400) fehlt.push(r.url()); });
    await p.addInitScript(() => { const alt = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return t === 'webgl2' ? null : alt.call(this, t, ...a); }; });
    await p.goto(`http://localhost:${port}/ebru/`); await p.waitForTimeout(1500);
    const h = await p.evaluate(() => { const d = document.getElementById('ohne-webgl'), a = d && d.querySelector('a'); return { sichtbar: !!d && !d.hidden, href: a && a.getAttribute('href') }; });
    ok('PS-7: ohne WebGL 2 Hinweis mit Verweis auf die klassische Fassung', h.sichtbar && h.href === '../ebru-klassisch/', JSON.stringify(h));
    await p.click('#ohne-webgl a'); await p.waitForFunction(() => window.__ebru && window.__ebru.sitzung(), null, { timeout: 10000 });
    ok('PS-7: klassische Fassung läuft', p.url().endsWith('/ebru-klassisch/'), p.url()); ok('PS-7: alle Dateien da, keine Seitenfehler', fehlt.length === 0 && fe.length === 0, fehlt.concat(fe).join(' | ')); await ctx.close(); }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
