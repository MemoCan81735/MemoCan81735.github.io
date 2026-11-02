// Tests für S-W10 (Driftpokal Farbstimmung je Strecke).
// Aufruf: node werkstatt/tests/stimmung_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
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
  p.on('request', r => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${PORT}/`) && !u.startsWith('data:') && !u.startsWith('blob:')) p.fremd.push(u); });
  await p.goto(URL_);
  await p.waitForFunction(() => typeof TRACK_LOOK !== 'undefined' && typeof POST_LOOK !== 'undefined', null, { timeout: 90000 });
  return p;
}
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const GRENZEN = `
  window.__gueltig = (g, satMin = 0.85, satOpt = false, lumMin = 0.93) => {
    const f = [];
    if (!g) return ['kein grade'];
    if (!/^#[0-9a-fA-F]{6}$/.test(g.tint || '')) f.push('Tönung ungültig ' + g.tint);
    else { const n = parseInt(g.tint.slice(1), 16), l = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; if (l < lumMin) f.push('Tönung zu dunkel ' + l.toFixed(3)); }
    if (!((satOpt && g.sat == null) || (g.sat >= satMin && g.sat <= 1.25))) f.push('Sättigung ' + g.sat);
    if (!(g.vignette >= 0.2 && g.vignette <= 0.5)) f.push('Vignette ' + g.vignette);
    return f;
  };`;

test('s_daten', async () => {
  const p = await seite();
  await p.evaluate(GRENZEN);
  const r = await p.evaluate(() => {
    const ids = Object.keys(TRACK_LOOK), fehler = [], tints = new Set(); let satEins = 0;
    for (const id of ids) { const g = TRACK_LOOK[id].grade; for (const f of window.__gueltig(g)) fehler.push(id + ': ' + f); if (g) { tints.add(String(g.tint).toLowerCase()); if (g.sat === 1 || g.sat == null) satEins++; } }
    return { n: ids.length, fehler, verschieden: tints.size, satEins };
  });
  pruefe(r.n >= 14, "Strecken: " + r.n);
  pruefe(r.fehler.length === 0, r.fehler.join('; '));
  pruefe(r.verschieden >= 10, 'verschiedene Tönungen ' + r.verschieden);
  pruefe(r.satEins <= 2, 'Strecken mit Sättigung 1: ' + r.satEins);
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  await p.context().close();
});

test('s_wetter', async () => {
  const p = await seite();
  await p.evaluate(GRENZEN);
  const r = await p.evaluate(() => {
    const fehler = []; let n = 0, gleich = true;
    const arten = Object.keys(WEATHER_LOOK).filter(k => WEATHER_LOOK[k].make);
    for (const id of Object.keys(TRACK_LOOK)) for (const k of arten) {
      const a = TrackLookUI.withWeather(TRACK_LOOK[id], k), b = TrackLookUI.withWeather(TRACK_LOOK[id], k);
      n++; if (a !== b) gleich = false;
      for (const f of window.__gueltig(a.grade, 0.5, true, 0)) fehler.push(id + '/' + k + ': ' + f);
    }
    return { n, arten, fehler, gleich };
  });
  pruefe(r.arten.length >= 4, 'Wetterarten: ' + r.arten.join());
  pruefe(r.n >= 14 * 4, 'zu wenige Abwandlungen ' + r.n);
  pruefe(r.fehler.length === 0, r.fehler.slice(0, 6).join('; '));
  pruefe(r.gleich, 'withWeather nicht wiederholbar');
  await p.context().close();
});

test('s_schalter', async () => {
  const p = await seite();
  const g = await p.evaluate(() => POST_LOOK.grade);
  pruefe(g === true, 'POST_LOOK.grade ist ' + g);
  await p.context().close();
});

// Echtes Rennen Herbstwald (Wetter "Grund"), je mit Schalter aus und an; gemessen wird das Bild.
async function rennenBild(an) {
  const p = await seite();
  await p.evaluate((an) => { POST_LOOK.grade = an; }, an);
  await p.evaluate(() => { WeatherRules.pick = () => 'basis'; });
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.getElementById('btnSingle').click()); await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('driverGo').click()); await p.waitForTimeout(800);
  const idx = await p.evaluate(() => { const ids = Object.keys(TRACK_LOOK); return ids.indexOf('herbst'); });
  await p.evaluate((i) => document.querySelectorAll('#trackGrid > *')[i].click(), idx); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('trackGo').click()); await p.waitForTimeout(7000);
  const png = await p.screenshot({ timeout: 90000 });
  const werte = await p.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    // Mitte des Bildes (Strecke und Umgebung), ohne die Oberfläche am Rand
    const w = Math.floor(img.width * 0.5), h = Math.floor(img.height * 0.6), d = x.getImageData(Math.floor(img.width * 0.25), Math.floor(img.height * 0.15), w, h).data;
    let r = 0, g = 0, bl = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; bl += d[i + 2]; n++; }
    r /= n; g /= n; bl /= n; return { r, g, b: bl, lum: 0.2126 * r + 0.7152 * g + 0.0722 * bl, rb: r / bl };
  }, png.toString('base64'));
  const out = { werte, fehler: p.fehler.slice(), fremd: p.fremd.slice() };
  await p.context().close();
  return out;
}
test('s_bild', async () => {
  const aus1 = await rennenBild(false), aus2 = await rennenBild(false), an = await rennenBild(true);
  for (const x of [aus1, aus2, an]) { pruefe(x.fehler.length === 0, 'Skriptfehler ' + x.fehler[0]); pruefe(x.fremd.length === 0, 'fremde Anfrage ' + x.fremd[0]); }
  const rauschen = Math.abs(aus1.werte.rb / aus2.werte.rb - 1);
  pruefe(rauschen < 0.02, 'Messrauschen zu groß (Fehlalarmprobe): ' + (rauschen * 100).toFixed(1) + ' %');
  const plus = an.werte.rb / aus1.werte.rb - 1;
  pruefe(plus >= 0.08, 'Rot/Blau nur +' + (plus * 100).toFixed(1) + ' %');
  const hell = an.werte.lum / aus1.werte.lum - 1;
  pruefe(Math.abs(hell) <= 0.12, 'Helligkeit verändert um ' + (hell * 100).toFixed(1) + ' %');
  console.log(`  Messwerte: Rot/Blau +${(plus * 100).toFixed(1)} %, Helligkeit ${(hell * 100).toFixed(1)} %, Rauschen ${(rauschen * 100).toFixed(2)} %`);
});

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ordner, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const nur = process.env.NUR; let rot = 0;
  for (const t of tests) {
    if (nur && t.name !== nur) continue;
    try { await t.fn(); console.log('OK     ' + t.name); } catch (e) { rot++; console.log('FEHLER ' + t.name + ': ' + e.message); }
    for (const c of browser.contexts()) await c.close().catch(() => { });   // auch nach Fehlern aufräumen (sonst rechnet die Seite weiter)
  }
  await browser.close(); srv.kill();
  console.log(rot ? `${rot} Test(s) rot` : 'Alle Stimmungstests grün');
  process.exit(rot ? 1 : 0);
})();
