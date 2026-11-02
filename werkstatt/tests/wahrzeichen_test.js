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

test('w_label_einbau', async () => {
  const p = await seite(); const s = strecke();
  const r = await p.evaluate(() => Object.fromEntries(Object.entries(TRACK_LOOK).map(([k, v]) => [k, (v.landmarks || []).map(l => l.label)])));
  pruefe(r.oer.length === s.wahrzeichen.length, 'Anzahl Wahrzeichen im Spiel');
  s.wahrzeichen.forEach((w, i) => pruefe(r.oer[i] === w.anzeige && typeof w.anzeige === 'string', `Label ${i + 1}: ${r.oer[i]} statt ${w.anzeige}`));
  for (const [k, v] of Object.entries(r)) if (k !== 'oer') pruefe(v.every(x => x === undefined), `Strecke ${k} hat Labels`);
  await p.context().close();
});

test('w_label_alpha', async () => {
  const p = await seite();
  const a = await p.evaluate(() => [0, 120, 270, 420, 1000, NaN, -5, 'x', null].map(d => TrackSceneUI.labelAlpha(d)));
  const soll = [1, 1, 0.5, 0, 0, 0, 0, 0, 0];
  soll.forEach((v, i) => pruefe(typeof a[i] === 'number' && Math.abs(a[i] - v) <= 0.01, `alpha-Fall ${i}: ${a[i]} statt ${v}`));
  await p.context().close();
});

const szene = (id) => `(() => {
  const geom = new TrackEntity(TrackCatalog.def('${id}')).geometry();
  const look = TrackLookUI.look(new RaceBoundary().trackInfo('${id}'));
  return new TrackSceneUI(new KitUI(1), geom, look, 'fast');
})()`;

test('w_label_szene', async () => {
  const p = await seite();
  const r = await p.evaluate((code) => {
    const w = eval(code.oer), lm = w.look.landmarks, out = { n: w.labels.length, hoch: w.labels.every((l, i) => l.sprite.position.y > 5), andere: eval(code.erken).labels.length };
    const cam = (d) => ({ position: new THREE.Vector3(lm[0].x + d, 40, lm[0].y) });
    const l0 = w.labels[0];
    w.updateLabels(cam(60)); out.nah = [l0.sprite.visible, l0.sprite.material.opacity];
    w.updateLabels(cam(600)); out.fern = l0.sprite.visible;
    w.updateLabels(cam(60)); out.nah2 = [l0.sprite.visible, l0.sprite.material.opacity];
    return out;
  }, { oer: szene('oer'), erken: szene('erken') });
  pruefe(r.n === 12, 'Schilder in der Oer-Runde: ' + r.n);
  pruefe(r.hoch, 'Schilder nicht über dem Boden');
  pruefe(r.andere === 0, 'Schilder in Strecke erken: ' + r.andere);
  pruefe(r.nah[0] === true && Math.abs(r.nah[1] - 1) < 0.01, 'nah nicht voll sichtbar ' + r.nah);
  pruefe(r.fern === false, 'fern nicht ausgeblendet');
  pruefe(JSON.stringify(r.nah) === JSON.stringify(r.nah2), 'Wiederholung weicht ab');
  await p.context().close();
});

test('w_label_text', async () => {
  const p = await seite(); const s = strecke();
  const lang = s.wahrzeichen.map(w => w.anzeige).sort((a, b) => b.length - a.length)[0];
  const r = await p.evaluate((txt) => {
    const c = TrackSceneUI.labelCanvas(txt), g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height).data;
    let hell = 0, minx = c.width, maxx = 0, lum = [];
    for (let i = 0, n = 0; i < d.length; i += 4, n++) {
      const L = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      if (d[i + 3] > 200 && L > 200) { hell++; const x = n % c.width; if (x < minx) minx = x; if (x > maxx) maxx = x; }
    }
    const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const px = (x, y) => { const q = g.getImageData(x, y, 1, 1).data; return 0.2126 * lin(q[0]) + 0.7152 * lin(q[1]) + 0.0722 * lin(q[2]); };
    const feld = px(Math.floor(c.width / 2), 6), text = 1;
    return { w: c.width, h: c.height, anteil: hell / (c.width * c.height), breite: (maxx - minx + 1) / c.width, kontrast: (text + 0.05) / (feld + 0.05) };
  }, lang);
  pruefe(r.breite <= 0.92, `Text zu breit: ${(r.breite * 100).toFixed(0)} %`);
  pruefe(r.anteil >= 0.03 && r.anteil <= 0.4, `Helle Punkte: ${(r.anteil * 100).toFixed(1)} %`);
  pruefe(r.kontrast >= 7, `Kontrast ${r.kontrast.toFixed(1)}`);
  console.log(`  Messwerte: "${lang}" Breite ${(r.breite * 100).toFixed(0)} %, helle Punkte ${(r.anteil * 100).toFixed(1)} %, Kontrast ${r.kontrast.toFixed(1)}`);
  await p.context().close();
});

test('w_fuss_einbau', async () => {
  const p = await seite(); const s = strecke();
  const r = await p.evaluate(() => TRACK_LOOK.oer.landmarks.map(l => l.foot || null));
  s.wahrzeichen.forEach((w, i) => pruefe(JSON.stringify(r[i]) === JSON.stringify(w.fuss || null), `Grundriss ${i + 1} (${w.name}) weicht ab`));
  pruefe(r.filter(Boolean).length >= 9, 'zu wenige Grundrisse im Spiel');
  await p.context().close();
});

test('w_fuss_teile', async () => {
  const p = await seite();
  const r = await p.evaluate(() => TRACK_LOOK.oer.landmarks.filter(l => l.foot).map(l => {
    const parts = KitUI.footParts(l.type, l.foot);
    const bb = (g) => { g.computeBoundingBox(); return g.boundingBox; };
    const k0 = bb(parts[0].geo), all = parts.map(q => bb(q.geo));
    const xs = l.foot.map(q => q[0]), zs = l.foot.map(q => q[1]);
    return { type: l.type, n: parts.length, keys: parts.map(q => q.key), h: k0.max.y - k0.min.y,
      w: k0.max.x - k0.min.x, tw: Math.max(...xs) - Math.min(...xs), d: k0.max.z - k0.min.z, td: Math.max(...zs) - Math.min(...zs),
      top: Math.max(...all.map(b => b.max.y)), minx: k0.min.x, tminx: Math.min(...xs) };
  }));
  const H = { mosque: 22, kirche: 20, rathaus: 22, markt: 16 }, TOP = { mosque: 40, kirche: 40, rathaus: 40, markt: 14 };
  for (const q of r) {
    pruefe(q.n >= 3, `${q.type}: nur ${q.n} Teile`);
    pruefe(Math.abs(q.h - H[q.type]) < 0.1, `${q.type}: Höhe ${q.h}`);
    pruefe(Math.abs(q.w - q.tw) < 0.5 && Math.abs(q.d - q.td) < 0.5 && Math.abs(q.minx - q.tminx) < 0.5, `${q.type}: Körper weicht vom Umriss ab`);
    pruefe(q.top >= TOP[q.type], `${q.type}: Merkmal (Turm, Minarett, Schild) fehlt, Höhe ${q.top}`);
  }
  pruefe(r.filter(q => q.type === 'mosque').every(q => q.keys.filter(x => x === 'dome').length >= 3 && q.keys.length >= 5), 'Moschee ohne Kuppel');
  pruefe(r.some(q => q.type === 'kirche') && r.some(q => q.type === 'markt') && r.some(q => q.type === 'rathaus'), 'Typen fehlen');
  console.log(`  Messwerte: ${r.length} Bauwerke, Höhen ${[...new Set(r.map(q => q.h.toFixed(0)))].join('/')}`);
  await p.context().close();
});

test('w_fuss_szene', async () => {
  const p = await seite();
  const r = await p.evaluate((code) => {
    const w = eval(code), out = [];
    for (const lm of w.look.landmarks.filter(l => l.foot)) {
      const ms = w.group.children.filter(o => o.isMesh && Math.abs(o.position.x - lm.x) < 0.01 && Math.abs(o.position.z - lm.y) < 0.01);
      out.push({ n: ms.length, einfach: ms.every(o => Math.abs(o.scale.x - 1) < 1e-6) });
    }
    return out;
  }, szene('oer'));
  pruefe(r.length >= 9, 'Grundriss-Gebäude in der Szene: ' + r.length);
  r.forEach((q, i) => pruefe(q.n >= 3 && q.einfach, `Gebäude ${i + 1}: ${q.n} Teile, Maßstab 1: ${q.einfach}`));
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
