// Tests für S-W11 (Strecken aus echten Straßen), Teil Spiel: Computerfahrer, Einbau, Bild.
// Aufruf: node werkstatt/tests/strecken_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/driftpokal/`;
const WK = path.join(ordner, 'werkstatt', 'strecken');
let browser;

async function seite() {
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true });
  const p = await ctx.newPage();
  p.fehler = []; p.fremd = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  p.on('request', r => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${PORT}/`) && !u.startsWith('data:') && !u.startsWith('blob:')) p.fremd.push(u); });
  await p.goto(URL_);
  await p.waitForFunction(() => typeof RaceEntity !== 'undefined' && typeof TRACK_LOOK !== 'undefined', null, { timeout: 90000 });
  return p;
}
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const strecke = () => JSON.parse(fs.readFileSync(path.join(WK, 'strecken', 'oer.json'), 'utf8'));

async function fahrt(p, id, { wetter = 'basis', seed = 5 } = {}) {
  return p.evaluate(({ id, wetter, seed }) => {
    const race = new RaceEntity({ trackId: id, demo: true, laps: 3, difficulty: 'hard', seed, weather: wetter });
    let walls = 0, steps = 0;
    while (steps < 60 * 500) {
      const ev = race.step(1 / 60, { steer: 0, gas: 0, brake: 0, drift: false }) || [];
      for (const e of ev) if (e.type === 'wall') walls++;
      steps++;
      if (race.karts.every(k => k.finished)) break;
    }
    const best = Math.min(...race.karts.map(k => k.lapTimes.length ? Math.min(...k.lapTimes) : 999));
    return { walls, karts: race.karts.length, finished: race.karts.filter(k => k.finished).length, best, wetter: race.weather, nass: race.wet };
  }, { id, wetter, seed });
}

test('st_einbau', async () => {
  const p = await seite();
  const s = strecke();
  const r = await p.evaluate(async () => {
    const ids = TRACK_DEFS.map(t => t.id);
    const o = JSON.stringify([TRACK_DEFS.filter(t => t.id !== 'oer'), Object.entries(CHALLENGE_DEFS).filter(([k]) => k !== 'oer'), Object.keys(TRACK_LOOK).filter(k => k !== 'oer').map(k => TRACK_LOOK[k]), CUP_DEFS.filter(c => c.id !== 'heimat')]);
    const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(o));
    const heimat = CUP_DEFS.find(c => c.id === 'heimat').tracks;
    const def = TRACK_DEFS.find(t => t.id === 'oer');
    return { ids, hash: [...new Uint8Array(h)].map(b => b.toString(16).padStart(2, '0')).join(''), heimat, def: def && JSON.parse(JSON.stringify(def)), par: CHALLENGE_DEFS.oer && CHALLENGE_DEFS.oer.par, look: TRACK_LOOK.oer && { name: TRACK_LOOK.oer.name, sub: TRACK_LOOK.oer.sub, landmarks: TRACK_LOOK.oer.landmarks }, wetter: WEATHER_RULES.tracks.oer, wetBase: WEATHER_RULES.wetBase };
  });
  pruefe(r.ids.includes('oer') && r.ids.length === 15, 'Strecken: ' + r.ids.join());
  pruefe(r.hash === fs.readFileSync(path.join(WK, 'alt_strecken.sha256'), 'utf8').trim(), 'die alten Strecken sind verändert (Prüfsumme)');
  pruefe(JSON.stringify(r.heimat) === JSON.stringify(['caycuma', 'erken', 'muenchen', 'oer']), 'Heimat-Cup: ' + r.heimat.join());
  pruefe(JSON.stringify(r.def.points) === JSON.stringify(s.def.points) && r.def.width === s.def.width, 'Seite und gebaute Strecke weichen ab (neu einbauen)');
  pruefe(typeof r.par === 'number' && r.par > 30 && r.par < 150, 'par ' + r.par);
  pruefe(r.look && r.look.name === s.name && r.look.sub === s.sub, 'Aussehen: Name oder Untertitel');
  pruefe(/© OpenStreetMap-Mitwirkende/.test(r.look.sub), 'Quelle fehlt im Untertitel');
  pruefe(Array.isArray(r.wetter) && r.wetter.includes('abend') && r.wetter.includes('nacht'), 'Wetterregeln fehlen');
  pruefe(r.wetBase.includes('oer'), 'Grundwetter nass nicht eingetragen');
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  pruefe(p.fremd.length === 0, 'fremde Anfrage ' + p.fremd[0]);
  // Kopie der Seite: erst entfernen (saubere Seite ohne "oer"), dann erstmals einbauen, dann nochmal: immer dasselbe Ergebnis
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'einbau-'));
  const kopie = path.join(tmp, 'index.html'); fs.copyFileSync(path.join(ordner, 'driftpokal', 'index.html'), kopie);
  const original = fs.readFileSync(kopie);
  const py = (...a) => spawnSync('python3', [path.join(WK, 'einbauen.py'), ...a], { encoding: 'utf8' });
  const sj = path.join(WK, 'strecken', 'oer.json'), pj = path.join(WK, 'strecken', 'oer.pruefung.json');
  let e = py('--entfernen', 'oer', kopie);
  pruefe(e.status === 0, 'Entfernen schlug fehl: ' + e.stderr);
  const sauber = fs.readFileSync(kopie).toString('utf8');
  pruefe(!/@@strecke oer/.test(sauber) && !/"oer"/.test(sauber), 'Entfernen ließ Reste zurück');
  for (let i = 0; i < 2; i++) { e = py(sj, pj, kopie); pruefe(e.status === 0, 'Einbauen schlug fehl: ' + e.stderr); }
  pruefe(Buffer.compare(original, fs.readFileSync(kopie)) === 0, 'Erstmals einbauen und Wiederholen ergeben nicht die Seite des Repos');
  pruefe((original.toString('utf8').match(/@@strecke oer/g) || []).length === 4, 'Einträge doppelt oder fehlend');
  // schlechte Prüfergebnisse werden nicht eingebaut und lassen die Seite unverändert
  const gut = JSON.parse(fs.readFileSync(pj, 'utf8'));
  for (const [name, aend] of [['Wandkontakt', { walls: 3 }], ['nicht alle im Ziel', { finished: 4 }], ['falsche Strecke', { id: 'andere' }], ['zu langsam', { bestLap: 50, bestLapMax: 52 }], ['Feld fehlt', { karts: undefined }]]) {
    fs.writeFileSync(kopie, sauber);
    const bad = path.join(tmp, 'bad.json'); fs.writeFileSync(bad, JSON.stringify({ ...gut, ...aend }));
    e = py(sj, bad, kopie);
    pruefe(e.status === 1 && /FEHLER/.test(e.stderr) && !/Traceback/.test(e.stderr), `${name}: wurde nicht abgelehnt (${e.status}) ${e.stderr}`);
    pruefe(fs.readFileSync(kopie).toString('utf8') === sauber, `${name}: Seite trotz Fehler verändert`);
  }
  await p.context().close();
});

test('st_cup', async () => {
  const p = await seite();
  await p.evaluate(() => { WeatherRules.pick = () => 'basis'; });
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('btnCup').click()); await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('driverGo').click()); await p.waitForTimeout(1200);
  const r = await p.evaluate(() => {
    const karten = [...document.querySelectorAll('.cup-card')];
    return karten.map(k => { const cs = [...k.querySelectorAll('.cup-maps canvas')].map(c => c.getBoundingClientRect()); return { n: cs.length, tops: cs.map(c => Math.round(c.top)), breite: cs.map(c => Math.round(c.width)), hoehe: Math.round(k.getBoundingClientRect().height), text: k.textContent }; });
  });
  const heimat = r.find(k => /Heimat/i.test(k.text));
  pruefe(heimat && heimat.n === 4, 'Heimat-Cup hat ' + (heimat && heimat.n) + ' Karten statt 4');
  pruefe(Math.max(...heimat.tops) - Math.min(...heimat.tops) <= 2, 'Heimat-Cup: Streckenbilder nicht in einer Reihe ' + heimat.tops.join());
  pruefe(Math.min(...heimat.breite) >= 20, 'Streckenbilder zu schmal');
  const andere = r.filter(k => k !== heimat);
  pruefe(andere.every(k => Math.abs(k.hoehe - heimat.hoehe) <= 6), 'Heimat-Cup ist höher als die anderen: ' + heimat.hoehe + ' gegen ' + andere.map(k => k.hoehe).join());
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  await p.context().close();
});

test('st_fahrt', async () => {
  const p = await seite();
  const erg = [];
  for (const [wetter, seed] of [['basis', 5], ['basis', 9], ['abend', 5], ['nacht', 5]]) {
    const r = await fahrt(p, 'oer', { wetter, seed }); erg.push(r);
    pruefe(r.wetter === wetter, 'Wetter nicht gesetzt: ' + r.wetter);
    pruefe(r.walls === 0, `${wetter}/${seed}: ${r.walls} Wandkontakte`);
    pruefe(r.finished === r.karts, `${wetter}/${seed}: nur ${r.finished} von ${r.karts} im Ziel`);
    pruefe(r.best >= 15 && r.best <= 40, `${wetter}/${seed}: beste Runde ${r.best.toFixed(1)} s`);
  }
  pruefe(erg[0].nass === true, 'Grundwetter sollte nass sein');
  console.log('  Messwerte: beste Runden ' + erg.map(r => r.best.toFixed(1)).join(' / ') + ' s');
  await p.context().close();
});

test('st_bild', async () => {
  const p = await seite();
  await p.evaluate(() => { WeatherRules.pick = () => 'basis'; });
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('btnSingle').click()); await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('driverGo').click()); await p.waitForTimeout(800);
  const idx = await p.evaluate(() => TrackCatalog.baseIds().indexOf('oer'));
  pruefe(idx >= 0, 'Strecke nicht im Katalog');
  const karte = await p.evaluate((i) => { const c = document.querySelectorAll('#trackGrid > *')[i]; return c ? c.textContent : null; }, idx);
  pruefe(karte && /Oer-Runde/.test(karte), 'Streckenkarte ohne Namen: ' + karte);
  pruefe(/OpenStreetMap-Mitwirkende/.test(karte), 'Quelle im Streckenmenü nicht sichtbar: ' + karte);
  await p.evaluate((i) => document.querySelectorAll('#trackGrid > *')[i].click(), idx); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('trackGo').click()); await p.waitForTimeout(7000);
  const png = await p.screenshot({ timeout: 90000 });
  const bildreich = await p.evaluate(async (b64) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, img.width, img.height).data; const f = new Set();
    for (let i = 0; i < d.length; i += 4 * 97) f.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4));
    return f.size;
  }, png.toString('base64'));
  pruefe(bildreich > 60, 'Bild leer oder einfarbig (' + bildreich + ' Farben)');
  const text = await p.evaluate(() => document.body.innerText);
  pruefe(/Oer-Runde/i.test(text), 'Streckenname im Rennen nicht zu sehen');
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  pruefe(p.fremd.length === 0, 'fremde Anfrage ' + p.fremd[0]);
  if (process.env.BILD) fs.writeFileSync(process.env.BILD, png);
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
  console.log(rot ? `${rot} Test(s) rot` : 'Alle Streckentests (Spiel) grün');
  process.exit(rot ? 1 : 0);
})();
