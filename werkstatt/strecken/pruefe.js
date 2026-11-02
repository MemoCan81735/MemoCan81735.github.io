// Prüft eine gebaute Strecke mit dem Spielkern: Computerfahrer fahren 3 Runden (6 Karts, schwerste Stufe), gezählt werden Wandkontakte und Zieleinläufe.
// Aufruf: node werkstatt/strecken/pruefe.js <strecke.json> <ordner-mit-driftpokal> <ausgabe.json>
// Auch als Baustein (require): fahrt(page, id, optionen) und seite(ordner).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function seite(ordner, port) {
  const srv = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: ordner, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch();
  const ctx = await browser.newContext(); const p = await ctx.newPage();
  p.fehler = []; p.on('pageerror', e => p.fehler.push(e.message));
  await p.goto(`http://127.0.0.1:${port}/driftpokal/`);
  await p.waitForFunction(() => typeof RaceEntity !== 'undefined' && typeof TRACK_DEFS !== 'undefined', null, { timeout: 60000 });
  p.schliessen = async () => { await browser.close(); srv.kill(); };
  return p;
}

// Eine Fahrt ohne Bild: nur der Rechenkern (RaceEntity mit lauter Computerfahrern).
async function fahrt(p, id, { wetter = 'basis', seed = 5, runden = 3 } = {}) {
  return p.evaluate(({ id, wetter, seed, runden }) => {
    const race = new RaceEntity({ trackId: id, demo: true, laps: runden, difficulty: 'hard', seed, weather: wetter });
    let walls = 0, steps = 0;
    while (steps < 60 * 500) {
      const ev = race.step(1 / 60, { steer: 0, gas: 0, brake: 0, drift: false }) || [];
      for (const e of ev) if (e.type === 'wall') walls++;
      steps++;
      if (race.karts.every(k => k.finished)) break;
    }
    const best = Math.min(...race.karts.map(k => k.lapTimes.length ? Math.min(...k.lapTimes) : 999));
    return { walls, karts: race.karts.length, finished: race.karts.filter(k => k.finished).length, bestLap: +best.toFixed(2), sekunden: +(steps / 60).toFixed(1), wetter: race.weather, nass: race.wet, laenge: Math.round(race.track.length) };
  }, { id, wetter, seed, runden });
}

module.exports = { seite, fahrt };

if (require.main === module) {
  (async () => {
    const [, , streckeP, ordner, ausP] = process.argv;
    if (!streckeP || !ordner || !ausP) { console.error('Aufruf: node pruefe.js <strecke.json> <ordner> <ausgabe.json>'); process.exit(2); }
    const s = JSON.parse(fs.readFileSync(streckeP, 'utf8'));
    const p = await seite(path.resolve(ordner), 8700 + Math.floor(Math.random() * 90));
    // Strecke zur Prüfung vorübergehend in den Speicher der Seite legen (die Datei der Seite bleibt unverändert)
    const eingefuegt = await p.evaluate((def) => { if (TRACK_DEFS.some(t => t.id === def.id)) return false; TRACK_DEFS.push(JSON.parse(JSON.stringify(def))); return true; }, s.def);
    const laeufe = [];
    for (const seed of [5, 9, 13]) laeufe.push(await fahrt(p, s.def.id, { seed }));
    await p.schliessen();
    const zeiten = laeufe.map(l => l.sekunden).sort((a, b) => a - b), mitte = zeiten[Math.floor(zeiten.length / 2)];
    const erg = {
      id: s.def.id, karts: laeufe[0].karts, finished: Math.min(...laeufe.map(l => l.finished)), walls: Math.max(...laeufe.map(l => l.walls)),
      bestLap: Math.min(...laeufe.map(l => l.bestLap)), bestLapMax: Math.max(...laeufe.map(l => l.bestLap)), rennen_s: mitte, laenge: laeufe[0].laenge,
      par: Math.round(mitte * 0.98 / 0.5) * 0.5, laeufe,
    };
    fs.writeFileSync(ausP, JSON.stringify(erg, null, 1) + '\n');
    console.log(JSON.stringify({ ...erg, laeufe: undefined }));
    const ok = erg.walls === 0 && erg.finished === erg.karts && erg.bestLap >= 15 && erg.bestLapMax <= 40;
    if (!ok) console.error('FEHLER: Prüfung nicht bestanden (Wandkontakte, nicht alle im Ziel oder Rundenzeit außerhalb 15 bis 40 s)');
    process.exit(ok ? 0 : 1);
  })().catch(e => { console.error('FEHLER: ' + e.message); process.exit(1); });
}
