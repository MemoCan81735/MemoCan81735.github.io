// S-W23: Kalorien-Tracker auf der Seite. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/kalorien_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
async function konto(p) {
  await p.fill('#name', 'Gast'); await p.getByRole('button', { name: 'Frau', exact: true }).click();
  await p.fill('#alter', '35'); await p.fill('#groesse', '168'); await p.fill('#gewicht', '64'); await p.click('#konto-speichern');
  await p.waitForSelector('#rest');
}
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port, url = `http://localhost:${port}/kalorien/`;
  const b = await chromium.launch();
  for (const fall of ['PS-1', 'PS-3 Speicher gesperrt', 'PS-2 Querformat']) {
    const quer = fall.includes('Quer'), gesperrt = fall.includes('gesperrt');
    const ctx = await b.newContext({ viewport: quer ? { width: 915, height: 412 } : { width: 412, height: 915 }, deviceScaleFactor: 1, hasTouch: true, timezoneId: 'Europe/Berlin' });
    const p = await ctx.newPage(), hosts = new Set(), fe = [], fehlt = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('response', r => { if (r.status() >= 400) fehlt.push(r.url()); });
    p.on('pageerror', e => fe.push(String(e)));
    await p.addInitScript(g => { if (g) Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); }, gesperrt);
    const t0 = Date.now(); await p.goto(url); await p.waitForSelector('#name'); // U-1
    ok(`${fall}: lädt in unter 3 s`, Date.now() - t0 < 3000, (Date.now() - t0) + ' ms');
    const sym = await p.evaluate(async () => { const m = await (await fetch(document.querySelector('link[rel=manifest]').href)).json(); const i = m.icons.find(x => x.sizes === '512x512'); const r = await fetch(new URL(i.src, document.querySelector('link[rel=manifest]').href)); return [m.name, r.status]; });
    ok(`${fall}: Symbol im Manifest`, sym[0] === 'Kalorien-Tracker' && sym[1] === 200, JSON.stringify(sym)); // U-4
    ok(`${fall}: kein Artifact-Betrachter`, await p.evaluate(() => typeof window.claude === 'undefined'));
    const z = await p.evaluate(() => { const a = document.querySelector('a.ng-zurueck'), r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), h: r.height, sichtbar: r.width > 0 && getComputedStyle(a).display !== 'none' }; });
    ok(`${fall}: Zurück-Link sichtbar`, z.href === '../' && z.h >= 44 && z.sichtbar, JSON.stringify(z)); // U-3
    await konto(p); // U-2
    const rest = Number((await p.locator('#rest').innerText()).replace(/\D/g, ''));
    ok(`${fall}: Richtwert berechnet`, rest > 1200 && rest < 3500, String(rest));
    ok(`${fall}: Hinweis Foto nur in Claude`, /Foto-Erkennung und Tipps gehen nur in der Claude-App/.test(await p.locator('#ng-hinweis').innerText()));
    await p.click('#manuell-knopf'); await p.fill('#suche', 'Apfel'); await p.locator('#treffer button').first().click();
    await p.click('#speichern'); await p.waitForSelector('#rest');
    const nach = Number((await p.locator('#rest').innerText()).replace(/\D/g, ''));
    ok(`${fall}: Apfel eingetragen`, nach < rest && rest - nach >= 50 && rest - nach <= 150, `${rest} -> ${nach}`);
    ok(`${fall}: kein AR-Knopf ohne Claude`, (await p.locator('#ar-messen').count()) === 0);
    if (!quer && !gesperrt) await p.screenshot({ path: process.env.BILD || '/tmp/kalorien_seite.png' });
    if (!gesperrt) { await p.reload(); await p.waitForSelector('#rest'); ok(`${fall}: bleibt nach Neuladen`, Number((await p.locator('#rest').innerText()).replace(/\D/g, '')) === nach); } // PS-5
    const breit = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); ok(`${fall}: kein waagerechtes Scrollen`, breit);
    ok(`${fall}: kein fremder Host`, hosts.size === 0, [...hosts].join()); ok(`${fall}: alle Dateien da`, fehlt.length === 0, fehlt.join());
    ok(`${fall}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
