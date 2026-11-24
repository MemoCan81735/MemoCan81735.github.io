// S-W27: Neon Ada auf der Seite. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/neon_ada_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
const linkInfo = (p, sel = 'a.ng-zurueck') => p.evaluate((sel) => { const a = document.querySelector(sel); if (!a) return null; const b = a.getBoundingClientRect();
  return { h: b.height, l: b.left, r: b.right, t: b.top, u: b.bottom, vw: innerWidth, vh: innerHeight, sicht: b.width > 0 && a.getClientRects().length > 0 && getComputedStyle(a).visibility !== 'hidden', href: a.getAttribute('href') }; }, sel);
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  let man = null; try { man = JSON.parse(fs.readFileSync(path.join(wurzel, 'neon-ada/manifest.webmanifest'), 'utf8')); } catch (e) { /* fehlt */ }
  ok('Symbol im Manifest', !!man && ['192x192', '512x512'].every(g => man.icons.some(i => i.sizes === g && fs.existsSync(path.join(wurzel, 'neon-ada', i.src)))));
  const start = fs.readFileSync(path.join(wurzel, 'index.html'), 'utf8');
  ok('AK-5 Karte auf der Startseite in der Rubrik Strategie', /<section id="strategie"[\s\S]*?<a class="karte" href="neon-ada\/">\s*<img src="bilder\/neon-ada.jpg"[^>]*>[\s\S]*?<h3>Neon Ada<\/h3>/.test(start) && fs.existsSync(path.join(wurzel, 'bilder/neon-ada.jpg')));
  for (const [gesperrt, n] of [[false, 'PS-1'], [true, 'PS-3 Speicher gesperrt']]) {
    const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage(); const hosts = new Set(), fe = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('pageerror', e => fe.push(String(e))); p.on('console', m => { if (m.type() === 'error') fe.push(m.text()); });
    if (gesperrt) await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); });
    const t0 = Date.now(); await p.goto(`http://localhost:${port}/neon-ada/`);
    let da = false; try { await p.waitForFunction(() => { const c = document.getElementById('welt'); return c && c.width > 0 && document.getElementById('kartentaste'); }, null, { timeout: 3000 }); da = true; } catch (e) { /* zu langsam */ }
    ok(`${n}: Spiel in unter 3 s da`, da, (Date.now() - t0) + ' ms');
    ok(`${n}: Seitentitel`, (await p.title()) === 'Neon Ada', await p.title());
    await p.waitForTimeout(800);
    const a = await p.screenshot(); await p.waitForTimeout(1500); const c = await p.screenshot();
    ok(`${n}: Bild bewegt sich ohne Tippen`, Buffer.compare(a, c) !== 0);
    ok(`${n}: Karten-Taste sichtbar`, await p.locator('#kartentaste').isVisible());
    const f0 = await linkInfo(p, '#ngfest'); ok(`${n}: fester Zurück-Link beim Start sichtbar, frei von der Karten-Taste`, f0 && f0.sicht && f0.h >= 44 && f0.l >= 0 && f0.r <= (await p.locator('#kartentaste').boundingBox()).x, JSON.stringify(f0));
    await p.click('#kartentaste'); await p.waitForTimeout(300);
    const l = await linkInfo(p, '#kartenmenue a.ng-zurueck'); ok(`${n}: Zurück-Link im Kartenmenü`, l && l.sicht && l.h >= 44 && l.l >= 0 && l.r <= l.vw && l.t >= 0 && l.u <= l.vh && l.href === '../', JSON.stringify(l));
    ok(`${n}: Karte 1-1 spielbar im Menü`, (await p.locator('#kartenliste button:not([disabled])').count()) >= 1);
    if (!gesperrt) { await p.setViewportSize({ width: 915, height: 412 }); await p.waitForTimeout(400);
      const q = await linkInfo(p, '#kartenmenue a.ng-zurueck'); ok('PS-2 Querformat: Zurück-Link ganz im Bild', q && q.sicht && q.h >= 44 && q.l >= 0 && q.r <= q.vw && q.t >= 0 && q.u <= q.vh, JSON.stringify(q));
      await p.setViewportSize({ width: 360, height: 640 }); await p.waitForTimeout(400);
      { const f = await linkInfo(p, '#ngfest'); const kb = await p.locator('#kartentaste').boundingBox();
        ok('PS-5 schmales Handy 360 px: fester Zurück-Link im Bild und überdeckt die Karten-Taste nicht', f && f.sicht && f.l >= 0 && f.r <= f.vw && f.h >= 44 && (f.r <= kb.x || f.u <= kb.y || f.l >= kb.x + kb.width), JSON.stringify(f) + JSON.stringify(kb)); }
      await p.setViewportSize({ width: 412, height: 915 }); await p.waitForTimeout(300);
      await p.goto(`http://localhost:${port}/neon-ada/#karte=3-1`); await p.waitForTimeout(800); await p.reload(); await p.waitForTimeout(800);
      await p.click('#kartentaste'); await p.waitForTimeout(300);
      ok('PS-4 Missbrauch: gesperrte Karte per Adresse nicht startbar (Karte 3-1 bleibt gesperrt)', await p.locator('[data-karte="3-1"][disabled]').count() === 1);
      await p.screenshot({ path: process.env.BILD || '/tmp/neon-ada-seite.png' }); }
    ok(`${n}: kein fremder Host`, hosts.size === 0, [...hosts].join());
    ok(`${n}: keine Prüfhaken`, await p.evaluate(() => ['__bilder', '__karte', '__takt', '__halt'].every(k => typeof window[k] === 'undefined')));
    ok(`${n}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    ok(`${n}: kein waagerechtes Scrollen`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (!gesperrt) { await p.click('#kartenmenue a.ng-zurueck'); await p.waitForTimeout(500); ok('U-3 Zurück-Link führt zur Startseite', new URL(p.url()).pathname === '/'); }
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
