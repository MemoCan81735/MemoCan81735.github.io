// Tests für S-W23 (Driftpokal: Zusammenstoß nach Außenmaßen, gleiche Regel wie Driftpokal Version 37 und die Godot-App).
// Aufruf: node werkstatt/tests/aussenmasse_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/driftpokal/`;
let browser;

async function seite() {
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 } });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  await p.goto(URL_, { timeout: 120000 });
  await p.waitForFunction(() => typeof RaceEntity !== 'undefined' && typeof Geo !== 'undefined', null, { timeout: 90000 });
  return p;
}
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// Hilfen im Seitenkontext: zwei Fahrzeuge an festen Lagen, Spalt zweier Kapseln
const HILFE = `
window.__paar = (va, vb) => {
  const r = new RaceEntity({ trackId: "wiese", playerDriverId: "kai", seed: 3, vehicles: [va, vb, "kart", "kart", "kart", "kart"] });
  r.karts.forEach((k, i) => { k.x = -2000 - i * 100; k.y = -2000; k.speed = 0; k.heading = 0; k.moveAngle = 0; k.z = 0; });
  const [a, b] = r.karts; a.x = 500; a.y = 500; b.x = 500; b.y = 500;
  return [r, a, b];
};
window.__spalt = (a, b) => {
  const c = Geo.capsuleNearest(a.x, a.y, a.heading, a.half, b.x, b.y, b.heading, b.half);
  return Math.hypot(c.qx - c.px, c.qy - c.py) - a.radius - b.radius;
};`;

test('s_masse', async () => {
  const p = await seite();
  const v = await p.evaluate(() => [2 * (VEHICLES.kart.half + VEHICLES.kart.radius), 2 * VEHICLES.kart.radius,
    2 * (VEHICLES.bike.half + VEHICLES.bike.radius), 2 * VEHICLES.bike.radius].map(x => Math.round(x * 1e9) / 1e9));
  pruefe(JSON.stringify(v) === '[18.4,12.2,16.7,3.7]', 'Maße ' + JSON.stringify(v));
});

test('s_grenzwerte', async () => {
  const p = await seite();
  await p.evaluate(HILFE);
  const out = await p.evaluate(() => [["kart", 0, 12.1, true], ["kart", 0, 12.3, false], ["kart", 18.3, 0, true], ["kart", 18.5, 0, false],
    ["bike", 0, 4.5, false], ["bike", 0, 3.5, true], ["bike", 16, 0, true]].map(([v, dx, dy, soll]) => {
    const [r, a, b] = window.__paar(v, v); b.x += dx; b.y += dy; r._collide([]);
    const ist = b.x !== 500 + dx || b.y !== 500 + dy;
    return ist === soll ? '' : `${v} ${dx}/${dy}: ${ist}`;
  }).filter(Boolean));
  pruefe(out.length === 0, 'falsch: ' + out.join(', '));
});

test('s_auffahren', async () => {
  const p = await seite();
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const [race, a, b] = window.__paar("kart", "kart"); b.x = 515; a.speed = 150; b.speed = 90;
    const ev = []; race._collide(ev);
    const c = ev.find(e => e.type === "collide");
    return { spalt: window.__spalt(a, b), stoss: a.speed < 150 && b.speed > 90, x: c && c.x };
  });
  pruefe(Math.abs(r.spalt) < 1e-9, 'Spalt ' + r.spalt);
  pruefe(r.stoss, 'kein Stoß');
  pruefe(r.x !== undefined && Math.abs(r.x - 507.5) < 1e-9, 'Funken bei ' + r.x);
});

test('s_quer', async () => {
  const p = await seite();
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const [race, a, b] = window.__paar("kart", "kart"); b.x = 502; b.heading = Math.PI / 2; race._collide([]);
    return { ok: [a.x, a.y, b.x, b.y].every(Number.isFinite), dx: b.x - a.x };
  });
  pruefe(r.ok && r.dx > 2, 'quer ineinander: ' + JSON.stringify(r));
});

// Kriterium: ein KI-Rennen (Wiese, Karts und Motorräder, 3 Runden) ohne Überlappung über 0,5 WE nach einem Schritt
test('s_rennen', async () => {
  const p = await seite();
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const race = new RaceEntity({ trackId: "wiese", playerDriverId: "kai", seed: 2, demo: true, vehicles: ["kart", "bike", "kart", "bike", "kart", "bike"], laps: 3 });
    let worst = 0, n = 0;
    for (; n < 60 * 240 && !race.karts.every(k => k.finished); n++) {
      race.step(1 / 60, null);
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) {
        const a = race.karts[i], b = race.karts[j];
        if (Math.abs(a.z - b.z) <= 8) worst = Math.min(worst, window.__spalt(a, b));
      }
    }
    return { worst, alle: race.karts.every(k => k.finished) };
  });
  console.log(`  Messwert: größte Überlappung ${(-r.worst).toFixed(2)} WE`);
  pruefe(r.alle, 'nicht alle im Ziel');
  pruefe(r.worst > -0.5, 'Überlappung ' + (-r.worst).toFixed(2) + ' WE');
  pruefe(p.fehler.length === 0, 'Seitenfehler: ' + p.fehler.join('; '));
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
  console.log(rot ? `${rot} Test(s) rot` : 'Alle Außenmaß-Tests grün');
  process.exit(rot ? 1 : 0);
})();
