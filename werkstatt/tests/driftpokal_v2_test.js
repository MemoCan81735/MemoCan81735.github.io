// S-W28: Driftpokal v2 auf der Seite. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/driftpokal_v2_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/json' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
const WARTE = 240000;   // ohne Grafikkarte und bei laufenden Prüfungen anderer Spiele ist das Übersetzen der Schattierer langsam
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  let man = null; try { man = JSON.parse(fs.readFileSync(path.join(wurzel, 'driftpokal-v2/manifest.webmanifest'), 'utf8')); } catch (e) { /* fehlt */ }
  ok('Symbol im Manifest', !!man && ['192x192', '512x512'].every(g => man.icons.some(i => i.sizes === g && fs.existsSync(path.join(wurzel, 'driftpokal-v2', i.src)))));
  const start = fs.readFileSync(path.join(wurzel, 'index.html'), 'utf8');
  ok('AK-5 Karte auf der Startseite in der Rubrik Rennspiele', /<section id="rennspiele"[\s\S]*?<a class="karte" href="driftpokal-v2\/">\s*<img src="bilder\/driftpokal-v2.jpg"[^>]*>[\s\S]*?<h3>Driftpokal v2<\/h3>[\s\S]*?<section id="brettspiele"/.test(start) && fs.existsSync(path.join(wurzel, 'bilder/driftpokal-v2.jpg')));
  for (const [gesperrt, n] of [[false, 'PS-1'], [true, 'PS-3 Speicher gesperrt']]) {
    const ctx = await b.newContext({ viewport: { width: 915, height: 412 }, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage(); const hosts = new Set(), fe = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('pageerror', e => fe.push(String(e)));
    if (gesperrt) await p.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); });
    await p.goto(`http://localhost:${port}/driftpokal-v2/`);
    let da = false; try { await p.waitForFunction(() => window.DP && DP.app.getState() === 'title', null, { timeout: WARTE }); da = true; } catch (e) { /* zu langsam */ }
    ok(`${n}: Titelbild da (ohne Grafikkarte dauert das Übersetzen der Schattierer etwa 10 s)`, da);
    ok(`${n}: Seitentitel`, (await p.title()) === 'Driftpokal v2', await p.title());
    const l = await p.evaluate(() => { const a = document.querySelector('a.ng-zurueck'); if (!a) return null; const r = a.getBoundingClientRect(); return { h: r.height, w: r.width, l: r.left, r: r.right, t: r.top, u: r.bottom, vw: innerWidth, vh: innerHeight, href: a.getAttribute('href') }; });
    ok(`${n}: Zurück-Link ganz im Bild, mindestens 44 px, Ziel ../`, l && l.h >= 44 && l.w > 0 && l.l >= 0 && l.r <= l.vw && l.t >= 0 && l.u <= l.vh && l.href === '../', JSON.stringify(l));
    await p.click('#btnSingle'); await p.click('#driverGo'); await p.click('#trackGo');
    let rennen = false; try { await p.waitForFunction(() => DP.app.getState() === 'race' && DP.app.getRaceView() && DP.app.getRaceView().karts.length === 6, null, { timeout: WARTE }); rennen = true; } catch (e) { /* zu langsam */ }
    ok(`${n}: Rennen mit 6 Fahrzeugen startet`, rennen);
    let laeuft = false;
    try {
      await p.waitForFunction(() => DP.app.getRaceView().phase === 'racing', null, { timeout: WARTE });
      await p.evaluate(() => DP.app.input.setJoystickPixels(0, 100));
      await p.waitForFunction(() => DP.app.getRaceView().time > 1, null, { timeout: WARTE }); laeuft = true;
    } catch (e) { /* zu langsam: Prüfung unten meldet es */ }
    ok(`${n}: Countdown vorbei, Rennzeit läuft`, laeuft);   // ohne Grafikkarte kommen nur wenige Bilder je Sekunde
    const v = !laeuft ? { t: 0, s: 0, ok: false } : await p.evaluate(() => { const r = DP.app.getRaceView(); const k = r.karts.find(q => q.isPlayer); return { t: r.time, s: k.speed, ok: r.karts.every(q => Number.isFinite(q.x) && Number.isFinite(q.y)) }; });
    ok(`${n}: Spieler fährt (Tempo über 5, Zeit läuft, Werte endlich)`, v.t > 0.5 && v.s > 5 && v.ok, JSON.stringify(v));
    ok(`${n}: kein fremder Host`, hosts.size === 0, [...hosts].join());
    { const h = await p.evaluate(() => Object.keys(window).filter(k => k.startsWith('__') && k !== '__THREE__' && k !== '__fxRenderer')); ok(`${n}: keine weiteren Prüfhaken (__fxRenderer stammt aus Driftpokal selbst)`, h.length === 0, h.join()); }
    ok(`${n}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    ok(`${n}: kein waagerechtes Scrollen`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (!gesperrt) {
      await p.screenshot({ path: process.env.BILD || '/tmp/driftpokal-v2-seite.png' });
      await p.evaluate(() => { DP.app.pause(); });
      await p.goto(`http://localhost:${port}/driftpokal-v2/`); await p.waitForFunction(() => window.DP && DP.app.getState() === 'title', null, { timeout: WARTE });
      await p.click('a.ng-zurueck'); await p.waitForTimeout(800); ok('U-3 Zurück-Link führt zur Startseite', new URL(p.url()).pathname === '/');
    }
    await ctx.close();
  }
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
