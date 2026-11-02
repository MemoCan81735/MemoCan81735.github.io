// Tests für S-W12 (Wahrzeichen der Oer-Runde), Teil Spiel: Eintrag, neue Bautypen, Szene.
// Aufruf: node werkstatt/tests/wahrzeichen_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/driftpokal/`;
let browser;

async function seite() {
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true });
  const p = await ctx.newPage();
  p.fehler = []; p.fremd = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  p.on('console', m => { if (m.type() === 'error') p.fehler.push('console: ' + m.text().slice(0, 150)); });
  p.on('request', r => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${PORT}/`) && !u.startsWith('data:') && !u.startsWith('blob:')) p.fremd.push(u); });
  await p.goto(URL_);
  await p.waitForFunction(() => typeof KitUI !== 'undefined' && typeof TRACK_LOOK !== 'undefined', null, { timeout: 90000 });
  return p;
}
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const strecke = () => JSON.parse(fs.readFileSync(path.join(ordner, 'werkstatt', 'strecken', 'strecken', 'oer.json'), 'utf8'));

test('w_einbau', async () => {
  const p = await seite(); const s = strecke();
  const lm = await p.evaluate(() => JSON.parse(JSON.stringify(TRACK_LOOK.oer.landmarks)));
  pruefe(lm.length === s.wahrzeichen.length && lm.length >= 9, `Wahrzeichen im Spiel: ${lm.length}, gebaut: ${s.wahrzeichen.length}`);
  s.wahrzeichen.forEach((w, i) => {
    const l = lm[i];
    pruefe(l.type === w.typ && l.x === w.x && l.y === w.y && l.rot === w.rot && l.s === w.s && l.r === w.r, `Wahrzeichen ${i + 1} (${w.name}) weicht ab`);
  });
  const typen = new Set(lm.map(l => l.type));
  for (const t of ['mosque', 'rathaus', 'markt', 'arena', 'headframe', 'kirche']) pruefe(typen.has(t), 'Typ fehlt im Spiel-Eintrag: ' + t);
  pruefe(lm.filter(l => l.type === 'mosque').length === 2, 'Moscheen im Spiel');
  const html = fs.readFileSync(path.join(ordner, 'driftpokal', 'index.html'), 'utf8');
  for (const w of s.wahrzeichen) pruefe(html.includes(w.name), 'Name fehlt als Kommentar: ' + w.name);
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  await p.context().close();
});

test('w_typen', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const kit = new KitUI(1), out = {};
    for (const t of ['mosque', 'arena', 'headframe', 'rathaus', 'markt', 'kirche']) {
      const teile = kit.decorParts(t, true);
      out[t] = teile.map(x => ({ key: x.key, n: x.geo && x.geo.attributes && x.geo.attributes.position ? x.geo.attributes.position.count : 0 }));
    }
    return out;
  });
  for (const t of ['rathaus', 'markt', 'kirche']) {
    pruefe(r[t].length >= 2, `${t}: nur ${r[t].length} Teile`);
    pruefe(r[t].every(x => x.n > 8), `${t}: leeres Teil`);
  }
  for (const t of ['mosque', 'arena', 'headframe']) pruefe(r[t].length >= 1, `${t}: keine Teile (Bestand kaputt)`);
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  await p.context().close();
});

test('w_szene', async () => {
  const p = await seite();
  await p.evaluate(() => { WeatherRules.pick = () => 'basis'; });
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('btnSingle').click()); await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('driverGo').click()); await p.waitForTimeout(800);
  const idx = await p.evaluate(() => [...document.querySelectorAll('#trackGrid > *')].findIndex(c => /Oer-Runde/.test(c.textContent)));
  pruefe(idx >= 0, 'Karte Oer-Runde nicht gefunden');
  await p.evaluate((i) => document.querySelectorAll('#trackGrid > *')[i].click(), idx); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('trackGo').click()); await p.waitForTimeout(9000);
  const png = await p.screenshot({ timeout: 90000 });
  if (process.env.BILD) fs.writeFileSync(process.env.BILD, png);
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  pruefe(p.fremd.length === 0, 'fremde Anfrage ' + p.fremd[0]);
  pruefe((await p.evaluate(() => document.body.innerText)).match(/Oer-Runde/i), 'Rennen nicht gestartet');
  await p.context().close();
});

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ordner, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const nur = process.env.NUR; let rot = 0;
  for (const t of tests) {
    if (nur && t.name !== nur) continue;
    try { await t.fn(); console.log('OK     ' + t.name); } catch (e) { rot++; console.log('FEHLER ' + t.name + ': ' + e.message); }
    for (const c of browser.contexts()) await c.close().catch(() => { });
  }
  await browser.close(); srv.kill();
  console.log(rot ? `${rot} Test(s) rot` : 'Alle Wahrzeichentests (Spiel) grün');
  process.exit(rot ? 1 : 0);
})();
