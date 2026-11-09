// Tests für S-W22 (Driftpokal Bildeffekte: Sonnenblendung, Tempo-Sog). Aufruf: node werkstatt/tests/effekte_test.js [ORDNER]   (NUR=name wählt Tests aus)
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
  await p.goto(URL_, { timeout: 120000 });
  await p.waitForFunction(() => typeof POST_LOOK !== 'undefined', null, { timeout: 90000 });
  await p.evaluate(SONNE_VOR);
  return p;
}
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// Rennen Königspark (Wetter "basis" = klarer Tag) starten, ohne Ergebnis zu warten
async function rennen(p, wetter = 'basis', strecke = 'Königspark') {
  await p.evaluate((w) => { WeatherRules.pick = () => w; }, wetter);
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.getElementById('btnSingle').click()); await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('driverGo').click()); await p.waitForTimeout(800);
  const idx = await p.evaluate((n) => [...document.querySelectorAll('#trackGrid > *')].findIndex(c => c.textContent.includes(n)), strecke);
  if (idx < 0) throw new Error('Karte ' + strecke + ' nicht gefunden');
  await p.evaluate((i) => document.querySelectorAll('#trackGrid > *')[i].click(), idx); await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('trackGo').click()); await p.waitForTimeout(6000);
  pruefe(await p.evaluate(() => !!window.__fxRenderer), 'Renderer nicht erreichbar');
}

// Sonne in Blickrichtung der Kamera, 0,2 rad über dem Horizont (Winkel zur Blickrichtung etwa 20°)
const SONNE_VOR = `window.__sonneVor = (R, el = 0.2) => { const f = R.camera.getWorldDirection(new THREE.Vector3()), h = Math.hypot(f.x, f.z) || 1;
  R.sunDir.set(f.x / h * Math.cos(el), Math.sin(el), f.z / h * Math.cos(el)); };`;

// ---- reine Rechnung (AK-1, AK-2) ----
test('s_blendung', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const g = (a, t) => FxMathUI.glare(a, t || { rain: false, night: false, el: 0.7 });
    return {
      schalter: typeof FX_LOOK === 'object' && FX_LOOK.glare === true && FX_LOOK.sog === true,
      nah: g(0), g19: g(19.9), g20: g(20), g40: g(40), g60: g(60), g61: g(61), g180: g(180),
      regen: g(0, { rain: true, night: false, el: 0.7 }), nacht: g(0, { rain: false, night: true, el: 0.7 }),
      horizont: g(0, { rain: false, night: false, el: -0.1 }), zenit: g(0, { rain: false, night: false, el: 1.5 }),
      nan: g(NaN), undef: g(undefined), neg: g(-5), kein: FxMathUI.glare(0, null), inf: g(Infinity),
      winkel0: FxMathUI.angle({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }), winkel90: FxMathUI.angle({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 1 }),
      winkelNaN: FxMathUI.angle({ x: NaN, y: 0, z: 1 }, { x: 0, y: 0, z: 1 }),
    };
  });
  pruefe(r.schalter, 'FX_LOOK fehlt oder Schalter aus');
  pruefe(r.nah >= 0.3 && r.nah <= 0.6, 'Blick zur Sonne: ' + r.nah);                       // PS-1
  pruefe(r.g19 >= 0.3 && r.g20 >= 0.3 && r.g20 <= 0.6, 'Grenze 20°: ' + r.g20);            // PS-2
  pruefe(r.g40 > 0 && r.g40 < r.g20, 'dazwischen weicher Übergang: ' + r.g40);
  pruefe(r.g60 === 0 && r.g61 === 0 && r.g180 === 0, 'weg von der Sonne: ' + [r.g60, r.g61, r.g180]);
  pruefe(r.horizont === 0, 'Sonne unter dem Horizont: ' + r.horizont);
  pruefe(r.zenit <= 0.6, 'nie über 0,6: ' + r.zenit);
  pruefe(r.regen === 0 && r.nacht === 0, 'Regen/Nacht: ' + [r.regen, r.nacht]);               // PS-3
  pruefe([r.nan, r.undef, r.neg, r.kein, r.inf].every(x => x === 0 || (x >= 0 && x <= 0.6 && Number.isFinite(x))), 'Missbrauch: ' + [r.nan, r.undef, r.neg, r.kein, r.inf]);   // PS-4
  pruefe(r.nan === 0 && r.undef === 0 && r.kein === 0 && r.inf === 0, 'NaN/undefined/Infinity müssen 0 geben');
  pruefe(r.winkel0 === 180 && r.winkelNaN === 180, 'Winkel bei Länge 0 oder NaN: ' + [r.winkel0, r.winkelNaN]);
  pruefe(Math.abs(r.winkel90 - 90) < 1e-6, 'Winkel 90: ' + r.winkel90);
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  await p.context().close();
});

test('s_sog', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const dt = 1 / 60, S = (v, b) => FxMathUI.sogStep(v, b, dt);
    let v = 0, tAuf = null, n = 0;
    for (; n < 120; n++) { v = S(v, true); if (v >= 0.5 && tAuf == null) tAuf = (n + 1) * dt; }
    const oben = v; let tAb = null; n = 0;
    for (; n < 240; n++) { v = S(v, false); if (v < 0.05) { tAb = (n + 1) * dt; break; } }
    // zehnmal hintereinander: gleiche Kurve (Wiederholbarkeit), Turbo unter 0,1 s, große dt (Pause), schlechte Eingaben
    const lauf = () => { let x = 0; for (let i = 0; i < 12; i++) x = S(x, true); for (let i = 0; i < 40; i++) x = S(x, false); return x; };
    const ersterLauf = lauf(); let gleich = true; for (let k = 0; k < 10; k++) if (lauf() !== ersterLauf) gleich = false;
    let kurz = 0; for (let i = 0; i < 5; i++) kurz = S(kurz, true); let kurzEnde = kurz; for (let i = 0; i < 60; i++) kurzEnde = S(kurzEnde, false);
    return { tAuf, oben, tAb, ersterLauf, gleich, kurz, kurzEnde, gross: FxMathUI.sogStep(0.5, true, 5), negativ: FxMathUI.sogStep(0.5, false, -1),
      nan: FxMathUI.sogStep(NaN, true, dt) === FxMathUI.sogStep(0, true, dt), nandt: FxMathUI.sogStep(0.3, true, NaN), aus: FxMathUI.sogStep(0, false, dt) };
  });
  pruefe(r.tAuf != null && r.tAuf <= 0.25, 'Aufbau auf 0,5 in ' + r.tAuf);                  // PS-5
  pruefe(r.oben >= 0.5 && r.oben <= 1, 'Stärke bei Turbo: ' + r.oben);
  pruefe(r.tAb != null && r.tAb <= 0.6, 'Abklingen auf unter 0,05 in ' + r.tAb);
  pruefe(r.gleich && r.ersterLauf < 0.05, 'Wiederholbarkeit: ' + r.ersterLauf);              // PS-6
  pruefe(r.kurz > 0 && r.kurz < 0.5 && r.kurzEnde === 0, 'Turbo unter 0,1 s: ' + [r.kurz, r.kurzEnde]);   // PS-7
  pruefe(r.gross === 1 && r.negativ === 0.5 && r.nan === true && r.nandt === 0.3 && r.aus === 0, 'Randwerte: ' + JSON.stringify(r));
  await p.context().close();
});

// ---- Verdrahtung im echten Rennen (AK-1, AK-2, AK-4, AK-6, AK-7) ----
test('s_verdrahtung', async () => {
  const p = await seite();
  await rennen(p);
  const r = await p.evaluate(() => {
    const R = window.__fxRenderer, F = { boosting: true }, U = R.postChain.uFinal;
    const hat = !!(U.uGlare && U.uSog);
    window.__sonneVor(R);
    R._updateFx(F, 1 / 60); const g1 = U.uGlare.value.z; let s1 = U.uSog.value; for (let i = 0; i < 20; i++) R._updateFx(F, 1 / 60); const s2 = U.uSog.value;
    FX_LOOK.glare = false; FX_LOOK.sog = false; for (let i = 0; i < 3; i++) R._updateFx(F, 1 / 60); const aus = [U.uGlare.value.z, U.uSog.value];
    FX_LOOK.glare = true; FX_LOOK.sog = true;
    const alt = R.look; R.look = Object.assign({}, alt, { rain: true }); R._updateFx({ boosting: false }, 1 / 60); const regen = U.uGlare.value.z;
    R.look = Object.assign({}, alt, { night: true }); R._updateFx({ boosting: false }, 1 / 60); const nacht = U.uGlare.value.z; R.look = alt;
    for (let i = 0; i < 60; i++) R._updateFx({ boosting: false }, 1 / 60); const ab = U.uSog.value;
    return { hat, g1, s2, aus, regen, nacht, ab };
  });
  pruefe(r.hat, 'Uniforms uGlare/uSog fehlen im Schlussdurchgang');
  pruefe(r.g1 >= 0.3, 'Blendung im Rennen: ' + r.g1);
  pruefe(r.s2 >= 0.5, 'Sog bei Turbo: ' + r.s2);
  pruefe(r.aus[0] === 0 && r.aus[1] === 0, 'Schalter aus, Werte: ' + r.aus);                 // AK-7, Verstoß-Gegenprobe
  pruefe(r.regen === 0 && r.nacht === 0, 'Blendung bei Regen/Nacht: ' + [r.regen, r.nacht]);
  pruefe(r.ab < 0.05, 'Sog nach Turbo: ' + r.ab);
  pruefe(p.fehler.length === 0 && p.fremd.length === 0, 'Fehler/fremd ' + (p.fehler[0] || p.fremd[0]));   // AK-6
  await p.context().close();
});

// ---- Bild (AK-4, AK-7, PS-10, PS-11) ----
async function bildWerte(p, uv) {
  const png = await p.screenshot({ timeout: 90000 });
  return p.evaluate(async ({ b64, uv }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0);
    const lum = (fx, fy, fw, fh) => { const d = x.getImageData(Math.floor(img.width * fx), Math.floor(img.height * fy), Math.floor(img.width * fw), Math.floor(img.height * fh)).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4) { s += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; n++; } return s / n; };
    // Sonnenbereich 30 % × 30 % um die Sonne auf dem Bild, Rand: Fläche rechts oben (Himmel und Bäume, kein Fahrzeug)
    const fx = Math.max(0, Math.min(0.7, uv[0] - 0.15)), fy = Math.max(0, Math.min(0.7, 1 - uv[1] - 0.15));
    return { mitte: lum(fx, fy, 0.3, 0.3), rand: lum(0.78, 0.12, 0.12, 0.13) };
  }, { b64: png.toString('base64'), uv });
}
async function lauf(an, sonne) {
  const p = await seite();
  await rennen(p);
  await p.evaluate(({ an, sonne }) => {
    const R = window.__fxRenderer; FX_LOOK.glare = an; FX_LOOK.sog = an;
    if (sonne) window.__sonneVor(R);
  }, { an, sonne });
  // Lage der Sonne im Bild einmal mit eingeschalteter Rechnung bestimmen, dann erst Schalter setzen
  const uv = await p.evaluate(({ an }) => { const R = window.__fxRenderer; FX_LOOK.glare = true; R._updateFx({ boosting: false }, 0); const v = R.postChain.uFinal.uGlare.value; const o = [v.x, v.y]; FX_LOOK.glare = an; return o; }, { an });
  await p.waitForTimeout(1500);
  const w = await bildWerte(p, uv), fehler = p.fehler.slice(), fremd = p.fremd.slice();
  await p.context().close(); return { w, fehler, fremd };
}
test('s_bild', async () => {
  const aus1 = await lauf(false, true), aus2 = await lauf(false, true), an = await lauf(true, true);
  for (const x of [aus1, aus2, an]) { pruefe(x.fehler.length === 0, 'Skriptfehler ' + x.fehler[0]); pruefe(x.fremd.length === 0, 'fremde Anfrage ' + x.fremd[0]); }
  console.log('  roh', JSON.stringify([aus1.w, aus2.w, an.w]));
  const rausch = Math.abs(aus1.w.mitte / aus2.w.mitte - 1);
  pruefe(rausch < 0.02, 'Messrauschen zu groß (Fehlalarmprobe): ' + (rausch * 100).toFixed(2) + ' %');   // PS-11
  const plus = an.w.mitte / aus1.w.mitte - 1, rest = an.w.rand / aus1.w.rand - 1;
  pruefe(plus >= 0.08, 'Mitte nur +' + (plus * 100).toFixed(1) + ' %');                     // PS-10
  pruefe(Math.abs(rest) <= 0.04, 'Rand verändert um ' + (rest * 100).toFixed(1) + ' %');
  console.log(`  Messwerte: Sonnenbereich +${(plus * 100).toFixed(1)} %, Rand ${(rest * 100).toFixed(2)} %, Rauschen ${(rausch * 100).toFixed(2)} %`);
});

// ---- Leistung (AK-5, PS-12) ----
async function zeit(an) {
  const p = await seite();
  await rennen(p);
  const r = await p.evaluate(({ an }) => {
    const R = window.__fxRenderer; FX_LOOK.glare = an; FX_LOOK.sog = an;
    window.__sonneVor(R);
    const F = { boosting: true }; for (let i = 0; i < 20; i++) R._updateFx(F, 1 / 60);
    for (let i = 0; i < 5; i++) R._draw();
    const t = []; for (let k = 0; k < 5; k++) { const a = performance.now(); for (let i = 0; i < 15; i++) { R._updateFx(F, 1 / 60); R._draw(); } R.renderer.getContext().finish(); t.push((performance.now() - a) / 15); }
    t.sort((a, b) => a - b); return { ms: t[2], calls: R.stats.calls };
  }, { an });
  await p.context().close(); return r;
}
test('s_leistung', async () => {
  const aus = [], an = [];
  for (let i = 0; i < 3; i++) { aus.push(await zeit(false)); an.push(await zeit(true)); }
  const med = (a) => a.map(x => x.ms).sort((x, y) => x - y)[1];
  const plus = med(an) / med(aus) - 1, calls = Math.max(...an.map(x => x.calls)) - Math.min(...aus.map(x => x.calls));
  console.log(`  Messwerte: Bildzeit ${med(aus).toFixed(1)} → ${med(an).toFixed(1)} ms (${(plus * 100).toFixed(1)} %), Zeichenaufrufe +${calls}`);
  pruefe(plus <= 0.10, 'Bildzeit +' + (plus * 100).toFixed(1) + ' %');
  pruefe(calls <= 12, 'Zeichenaufrufe +' + calls);
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
  console.log(rot ? `${rot} Test(s) rot` : 'Alle Effekt-Tests grün');
  process.exit(rot ? 1 : 0);
})();
