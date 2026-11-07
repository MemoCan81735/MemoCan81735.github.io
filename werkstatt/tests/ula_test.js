// S-W20: Ula Çarpsana! auf der Seite. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/ula_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
const linkInfo = p => p.evaluate(() => { const a = document.querySelector('a.ng-zurueck'); if (!a) return null; const b = a.getBoundingClientRect();
  return { h: b.height, l: b.left, r: b.right, t: b.top, u: b.bottom, vw: innerWidth, vh: innerHeight, sicht: b.width > 0 && a.offsetParent !== null, href: a.getAttribute('href') }; });
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  // Symbol im Manifest (U-4) und Karte auf der Startseite (AK-5)
  let man = null; try { man = JSON.parse(fs.readFileSync(path.join(wurzel, 'ula/manifest.webmanifest'), 'utf8')); } catch (e) { /* fehlt */ }
  ok('Symbol im Manifest', !!man && ['192x192', '512x512'].every(g => man.icons.some(i => i.sizes === g && fs.existsSync(path.join(wurzel, 'ula', i.src)))));
  const start = fs.readFileSync(path.join(wurzel, 'index.html'), 'utf8');
  ok('AK-5 Karte auf der Startseite', /<a class="karte" href="ula\/">\s*<img src="bilder\/ula.jpg"[^>]*>[\s\S]*?<h3>Ula Çarpsana!<\/h3>/.test(start) && fs.existsSync(path.join(wurzel, 'bilder/ula.jpg')));
  for (const [gesperrt, n] of [[false, 'PS-1'], [true, 'PS-3 Speicher gesperrt']]) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage(); const hosts = new Set(), fe = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('pageerror', e => fe.push(String(e)));
    if (gesperrt) await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); });
    const t0 = Date.now(); await p.goto(`http://localhost:${port}/ula/`);
    let titel = false; try { await p.waitForFunction(() => /Ula\s*Çarpsana!/.test((document.querySelector('#card h1') || {}).textContent || '') && document.getElementById('goBtn'), null, { timeout: 3000 }); titel = true; } catch (e) { /* zu langsam */ }
    ok(`${n}: Titel in unter 3 s`, titel, (Date.now() - t0) + ' ms');
    ok(`${n}: Seitentitel`, (await p.title()) === 'Ula Çarpsana!', await p.title());
    const h = await p.evaluate(() => { const e = document.querySelector('#card h1'), c = document.getElementById('card').getBoundingClientRect(), r = document.createRange(); r.selectNodeContents(e); const t = r.getBoundingClientRect(); return { l: t.left, r: t.right, cl: c.left, cr: c.right }; });
    ok(`${n}: Titel ganz zu sehen`, h.l >= h.cl - 1 && h.r <= h.cr + 1, JSON.stringify(h));
    const lb = await p.evaluate(() => { const a = document.querySelector('a.ng-zurueck').getBoundingClientRect(), m = document.getElementById('mute').getBoundingClientRect(); return a.right <= m.left || a.bottom <= m.top || a.top >= m.bottom; });
    ok(`${n}: Zurück-Link frei vom Ton-Knopf`, lb);
    const l = await linkInfo(p); ok(`${n}: Zurück-Link im Titelbild`, l && l.sicht && l.h >= 44 && l.l >= 0 && l.r <= l.vw && l.t >= 0 && l.u <= l.vh && l.href === '../', JSON.stringify(l));
    if (!gesperrt) { await p.setViewportSize({ width: 915, height: 412 }); await p.waitForTimeout(400);
      const q = await linkInfo(p); ok('PS-2 Querformat: Zurück-Link ganz im Bild', q && q.sicht && q.h >= 44 && q.l >= 0 && q.r <= q.vw && q.t >= 0 && q.u <= q.vh, JSON.stringify(q));
      await p.setViewportSize({ width: 412, height: 915 }); await p.waitForTimeout(300); }
    if (titel) await p.click('#goBtn'); await p.waitForTimeout(500);
    const a = await p.screenshot(); await p.waitForTimeout(1500); const c = await p.screenshot();
    ok(`${n}: Runde läuft`, titel && Buffer.compare(a, c) !== 0);
    if (!gesperrt && process.env.BILD) await p.screenshot({ path: process.env.BILD });
    ok(`${n}: kein fremder Host`, hosts.size === 0, [...hosts].join());
    ok(`${n}: keine Prüfhaken`, await p.evaluate(() => typeof window.__dm === 'undefined'));
    ok(`${n}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    ok(`${n}: kein waagerechtes Scrollen`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
