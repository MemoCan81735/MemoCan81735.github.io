// Tests für S-W03 (Luftdrift: Geist der Bestzeit und drei Strecken).
// Aufruf: node werkstatt/tests/luft_test.js [ORDNER]   (NUR=name1,name2 wählt Tests aus)
// WebGL läuft im Container in Software; Flüge laufen mit dem Testspieler "perfekt" im Zeitraffer.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/luftdrift/`;
const IDS = ['dorf', 'kueste', 'berge'];

let browser;
async function seite(vorher) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  if (vorher) await p.addInitScript(vorher);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__proto && window.__proto.Geist, null, { timeout: 20000 });
  return p;
}
const zu = async p => p.context().close();
// Fliegt eine Ringjagd mit dem Testspieler "perfekt" bis zum Ende (Spielzeit bleibt echt, nur schneller gerechnet).
const fliegen = (p, id) => p.evaluate(async (id) => {
  const P = window.__proto; P.streckeWaehlen(id); P.auto = true; P.turbo = 20; P.neustart('ringe');
  const t0 = performance.now();
  while (P.s.phase === 'spiel' && performance.now() - t0 < 150000) await new Promise(r => setTimeout(r, 100));
  P.turbo = 1; P.auto = false;
  return { phase: P.s.phase, zeit: P.s.zeit, ringe: P.s.ringIndex, treffer: P.s.treffer };
}, id);

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// ---------- L2: Strecken ----------
test('strecken_aufbau', async () => {
  const p = await seite();
  const r = await p.evaluate((IDS) => {
    const P = window.__proto, out = {};
    for (const id of IDS) {
      P.streckeWaehlen(id);
      const tief = P.RINGE.map(q => q.y - Math.max(P.gelaende(q.x, q.z), P.wasserHoehe(q.x, q.z)) - P.RING_RADIUS).reduce((a, b) => Math.min(a, b), 1e9);
      const nass = P.PYLONEN.filter(q => P.wasserHoehe(q.x, q.z) > -999).length;
      out[id] = { id: P.strecke.id, tuerme: P.PYLONEN.length, ringe: P.RINGE.length, tief, nass, knopf: document.querySelector('#strecken button.an')?.dataset.strecke, einst: P.einst.strecke };
    }
    P.streckeWaehlen('mond'); out.mond = { id: P.strecke.id, einst: P.einst.strecke };
    return out;
  }, IDS);
  const f = p.fehler; await zu(p);
  for (const id of IDS) {
    const x = r[id];
    pruefe(x.id === id && x.tuerme === 9 && x.ringe === 9, `${id}: ${JSON.stringify(x)}`);
    pruefe(x.tief >= 12 - 1e-6, `${id}: Ring nur ${x.tief.toFixed(1)} m über Gelände (mindestens 12)`);
    pruefe(x.nass === 0, `${id}: ${x.nass} Türme im Wasser`);
    pruefe(x.knopf === id && x.einst === id, `${id}: Auswahl ${x.knopf}/${x.einst}`);
  }
  pruefe(r.mond.id === 'dorf' && r.mond.einst === 'dorf', `unbekannte Strecke: ${JSON.stringify(r.mond)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('strecken_fliegbar', async () => {
  const p = await seite();
  const out = {};
  for (const id of IDS) out[id] = await fliegen(p, id);
  const f = p.fehler; await zu(p);
  for (const id of IDS) pruefe(out[id].phase === 'ende' && out[id].ringe === 9 && out[id].zeit < 200, `${id}: ${JSON.stringify(out[id])}`);
  console.log('       Messzeiten perfekt: ' + IDS.map(id => `${id} ${out[id].zeit.toFixed(1)} s`).join(', '));
  pruefe(f.length === 0, f.join(' | '));
});

test('strecken_wechsel', async () => {
  const p = await seite();
  const r = await p.evaluate(async (IDS) => {
    const P = window.__proto, zaehle = () => { let n = 0; P.szene.traverse(() => n++); return n; };
    const warte = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const mess = () => ({ obj: zaehle(), geo: P.renderer.info.memory.geometries, tex: P.renderer.info.memory.textures });
    const werte = {};
    for (const id of IDS) { P.streckeWaehlen(id); await warte(); werte[id] = [mess()]; }
    for (let i = 0; i < 10; i++) for (const id of IDS) { P.streckeWaehlen(id); await warte(); werte[id].push(mess()); }
    return werte;
  }, IDS);
  const f = p.fehler; await zu(p);
  for (const id of IDS) {
    // Vergleich ab der zweiten Runde: geteilte Teile (Ringe, Wasser) werden beim ersten Besuch einmal hochgeladen und bleiben.
    const a = r[id][1], e = r[id][r[id].length - 1];
    pruefe(r[id][0].obj === e.obj, `${id}: Objekte ${r[id][0].obj} -> ${e.obj}`);
    pruefe(a.obj === e.obj && e.geo <= a.geo && e.tex <= a.tex, `${id}: vorher ${JSON.stringify(a)}, nach 10 Wechseln ${JSON.stringify(e)}`);
  }
  pruefe(f.length === 0, f.join(' | '));
});

test('strecken_last', async () => {
  const p = await seite();
  const r = await p.evaluate((IDS) => {
    const P = window.__proto, out = {};
    for (const id of IDS) {
      P.streckeWaehlen(id);
      let n = 0;
      P.szene.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry; n += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1); } });
      out[id] = Math.round(n);
    }
    return out;
  }, IDS);
  await zu(p);
  console.log('       Dreiecke in der Szene: ' + IDS.map(id => `${id} ${r[id]}`).join(', '));
  for (const id of ['kueste', 'berge']) pruefe(r[id] <= 1.3 * r.dorf, `${id}: ${r[id]} Dreiecke, Grenze ${Math.round(1.3 * r.dorf)}`);
});

// ---------- L1: Geist ----------
test('geist_speichern', async () => {
  // Reine Regel (PS-7 und Fehlalarm): gleich schnell ersetzt nicht, schneller ersetzt, zu viele Punkte nie.
  let p = await seite();
  const regel = await p.evaluate(() => {
    const G = window.__proto.Geist, e = (zeit, n = 3) => ({ zeit, ringe: [1, 2], punkte: Array.from({ length: n }, () => [0, 0, 0, 0, 0]) });
    return { leer: G.ersetzt(undefined, e(50)), gleich: G.ersetzt(e(50), e(50)), langsamer: G.ersetzt(e(50), e(50.1)), schneller: G.ersetzt(e(50), e(49.9)), zuViele: G.ersetzt(undefined, e(40, 2401)), grenze: G.ersetzt(undefined, e(40, 2400)) };
  });
  pruefe(regel.leer && !regel.gleich && !regel.langsamer && regel.schneller && !regel.zuViele && regel.grenze, `Regel ${JSON.stringify(regel)}`);
  // PS-8: abgebrochene Runde speichert nichts
  const abbruch = await p.evaluate(async () => {
    const P = window.__proto; P.streckeWaehlen('berge'); P.auto = true; P.turbo = 10; P.neustart('ringe');
    while (P.s.zeit < 4) await new Promise(r => setTimeout(r, 50));
    P.auto = false; P.turbo = 1; P.beenden(); P.zumMenue();
    return localStorage.getItem('luftdrift3d.geist');
  });
  pruefe(abbruch === null, `Abbruch hat gespeichert: ${String(abbruch).slice(0, 80)}`);
  // PS-6: vollständige Runde speichert mit Formatversion 1
  const flug = await fliegen(p, 'berge');
  const d1 = await p.evaluate(() => JSON.parse(localStorage.getItem('luftdrift3d.geist')));
  const g1 = d1 && d1.strecken && d1.strecken.berge;
  pruefe(d1 && d1.formatversion === 1 && g1, `nicht gespeichert: ${JSON.stringify(d1).slice(0, 100)}`);
  pruefe(Math.abs(g1.zeit - flug.zeit) < 0.01 && g1.ringe.length === 9 && g1.punkte.length <= 2400 && Math.abs(g1.punkte.length - flug.zeit * 10) <= 2, `Inhalt zeit ${g1.zeit}/${flug.zeit} ringe ${g1.ringe.length} punkte ${g1.punkte.length}`);
  pruefe(Object.keys(d1.strecken).join() === 'berge', `andere Strecken betroffen: ${Object.keys(d1.strecken)}`);
  await zu(p);
  // PS-7 im Spiel: ein schnellerer Geist bleibt, die langsamere Runde ersetzt ihn nicht
  const schnell = JSON.stringify({ formatversion: 1, strecken: { berge: { zeit: 12.5, ringe: [1, 2, 3, 4, 5, 6, 7, 8, 9], punkte: [[0, 80, -1250, 0, 0], [0, 80, -1240, 0, 0]] } } });
  p = await seite(`localStorage.setItem('luftdrift3d.geist', ${JSON.stringify(schnell)})`);
  await fliegen(p, 'berge');
  const d2 = await p.evaluate(() => JSON.parse(localStorage.getItem('luftdrift3d.geist')));
  pruefe(d2.strecken.berge.zeit === 12.5, `schnellerer Geist ersetzt: ${d2.strecken.berge.zeit}`);
  // PS-9: Aufnahme über 240 s endet bei 2400 Punkten
  const lang = await p.evaluate(async () => {
    const P = window.__proto; P.neustart('ringe'); P.s.zeit = 300;
    await new Promise(r => setTimeout(r, 400));
    const n = P.Geist.aufnahme.punkte.length; P.zumMenue(); return n;
  });
  const f = p.fehler; await zu(p);
  pruefe(lang === 2400, `Aufnahme über 240 s: ${lang} Punkte`);
  pruefe(f.length === 0, f.join(' | '));
});

test('geist_abspielen', async () => {
  const p = await seite();
  const r = await p.evaluate(async () => {
    const G = window.__proto.Geist, pk = [[0, 50, 0, 0, 0], [10, 60, -20, 0.2, 0.4], [20, 40, -40, 0.4, 0]];
    const out = {
      mitte: G.position(pk, 0.13), vorher: G.position(pk, -1), null_: G.position(pk, 0), genau: G.position(pk, 0.1),
      ende: G.position(pk, 0.2), danach: G.position(pk, 0.25), leer: G.position([], 0), nan: G.position(pk, NaN),
    };
    // Im Spiel: Geist sichtbar, solange Punkte da sind, danach weg
    const P = window.__proto, warte = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    P.streckeWaehlen('dorf');
    const a = P.s; P.neustart('ringe'); a.geist = { zeit: 4, ringe: [4], punkte: Array.from({ length: 40 }, (_, i) => [a.x, a.y, a.z + 40 + 4 * i, 0, 0]) };
    P.einst.hilfe = 2; P.auto = 'passiv';
    a.zeit = 0.15; await warte(); out.sichtbar = G.flieger.visible; out.z = G.flieger.position.z - a.geist.punkte[0][2];
    a.zeit = 10; await warte(); out.nachEnde = G.flieger.visible;
    P.auto = false; P.zumMenue(); await warte(); out.menue = G.flieger.visible;
    return out;
  });
  const f = p.fehler; await zu(p);
  const nah = (a, b) => a && a.every((v, i) => Math.abs(v - b[i]) < 0.01);
  pruefe(nah(r.mitte, [13, 54, -26, 0.26, 0.28]), `Mischung bei 0,13 s: ${JSON.stringify(r.mitte)}`);
  pruefe(nah(r.vorher, [0, 50, 0, 0, 0]) && nah(r.null_, [0, 50, 0, 0, 0]), `vor Beginn: ${JSON.stringify(r.vorher)}`);
  pruefe(nah(r.genau, [10, 60, -20, 0.2, 0.4]) && nah(r.ende, [20, 40, -40, 0.4, 0]), `genau auf Punkt: ${JSON.stringify([r.genau, r.ende])}`);
  pruefe(r.danach === null && r.leer === null && r.nan === null, `nach dem Ende: ${JSON.stringify(r.danach)}`);
  pruefe(r.sichtbar && r.z > 0 && r.z < 156 && !r.nachEnde && !r.menue, `im Spiel: ${JSON.stringify(r)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('geist_kaputt', async () => {
  const gut = [[0, 50, 0, 0, 0]];
  const faelle = {
    unlesbar: '{x',
    format2: JSON.stringify({ formatversion: 2, strecken: { dorf: { zeit: 50, ringe: [1], punkte: gut } } }),
    zuViele: JSON.stringify({ formatversion: 1, strecken: { dorf: { zeit: 50, ringe: [1], punkte: Array.from({ length: 5000 }, () => [0, 50, 0, 0, 0]) } } }),
    text: JSON.stringify({ formatversion: 1, strecken: { dorf: { zeit: 50, ringe: [1], punkte: [[0, 'fünfzig', 0, 0, 0]] } } }),
    leer: null,
  };
  const out = {};
  for (const [name, wert] of Object.entries(faelle)) {
    const p = await seite(wert === null ? null : `localStorage.setItem('luftdrift3d.geist', ${JSON.stringify(wert)})`);
    out[name] = await p.evaluate(async () => {
      const P = window.__proto; P.streckeWaehlen('dorf'); P.neustart('ringe');
      await new Promise(r => setTimeout(r, 300));
      const r = { geister: Object.keys(P.Geist.geister).length, geist: !!P.s.geist, sichtbar: P.Geist.flieger.visible, phase: P.s.phase };
      P.zumMenue(); return r;
    });
    out[name].fehler = p.fehler.length;
    await zu(p);
  }
  for (const [name, r] of Object.entries(out)) pruefe(r.geister === 0 && !r.geist && !r.sichtbar && r.phase === 'spiel' && r.fehler === 0, `${name}: ${JSON.stringify(r)}`);
  // Gegenstück: gültige Daten werden gelesen
  const p = await seite(`localStorage.setItem('luftdrift3d.geist', ${JSON.stringify(JSON.stringify({ formatversion: 1, strecken: { dorf: { zeit: 50, ringe: [1], punkte: gut } } }))})`);
  const n = await p.evaluate(() => Object.keys(window.__proto.Geist.geister).join());
  await zu(p);
  pruefe(n === 'dorf', `gültiger Geist nicht gelesen: "${n}"`);
});

test('geist_abstand', async () => {
  const p = await seite();
  const r = await p.evaluate(async () => {
    const G = window.__proto.Geist, P = window.__proto;
    const out = { schneller: G.abstand(10, 11.25), langsamer: G.abstand(12.8, 12), gleich: G.abstand(5, 5), ohne: G.abstand(5, undefined) };
    // Im Spiel: Ring 1 mit Geist, dann ohne Geist
    const durchRing = async (geist) => {
      P.streckeWaehlen('dorf'); P.neustart('ringe'); P.s.geist = geist;
      P.auto = true; P.turbo = 10;
      while (P.s.ringIndex < 1 && P.s.zeit < 60) await new Promise(r => setTimeout(r, 30));
      const text = document.getElementById('meldung').textContent, zeit = P.s.zeit;
      P.auto = false; P.turbo = 1; P.zumMenue(); return { text, zeit };
    };
    out.mit = await durchRing({ zeit: 99, ringe: [1, 2, 3, 4, 5, 6, 7, 8, 9], punkte: [[0, 0, 0, 0, 0]] });
    out.kein = await durchRing(null);
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.schneller === '−1,3 s' && r.langsamer === '+0,8 s' && r.gleich === '±0,0 s' && r.ohne === '', `Text ${JSON.stringify(r)}`);
  pruefe(/^Ring 1 von 9 · \+\d+,\d s$/.test(r.mit.text), `Meldung mit Geist: "${r.mit.text}"`);
  pruefe(r.kein.text === 'Ring 1 von 9', `Meldung ohne Geist: "${r.kein.text}"`);
  pruefe(f.length === 0, f.join(' | '));
});

test('bestwerte_je_strecke', async () => {
  const p = await seite(() => {
    if (!sessionStorage.getItem('vorbereitet')) {
      localStorage.setItem('luftdrift3d.bestwerte', JSON.stringify({ drift: 3000, ringe: 80, rennen: 2 }));
      localStorage.setItem('luftdrift3d.sterne', JSON.stringify({ drift: 1, ringe: 2, rennen: 2 }));
      sessionStorage.setItem('vorbereitet', '1');
    }
  });
  const r = await p.evaluate(() => {
    const P = window.__proto, out = {};
    P.streckeWaehlen('kueste'); P.neustart('ringe'); P.s.ringIndex = 9; P.s.zeit = 60; P.beenden(); P.zumMenue();
    out.kueste = { best: document.getElementById('bw_ringe').textContent, sterne: document.getElementById('st_ringe').textContent, ende: document.getElementById('endeText').textContent };
    P.streckeWaehlen('dorf');
    out.dorf = { best: document.getElementById('bw_ringe').textContent, sterne: document.getElementById('st_ringe').textContent, drift: document.getElementById('bw_drift').textContent };
    P.streckeWaehlen('berge');
    out.berge = { best: document.getElementById('bw_ringe').textContent, sterne: document.getElementById('st_ringe').textContent };
    out.speicher = JSON.parse(localStorage.getItem('luftdrift3d.bestwerte'));
    out.sternSpeicher = JSON.parse(localStorage.getItem('luftdrift3d.sterne'));
    return out;
  });
  // Wiederholbarkeit: nach Neuladen bleibt die Strecke gewählt und die Werte stehen
  await p.reload(); await p.waitForFunction(() => window.__proto && window.__proto.Geist);
  const nachLaden = await p.evaluate(() => ({ strecke: window.__proto.strecke.id, best: document.getElementById('bw_ringe').textContent }));
  const f = p.fehler; await zu(p);
  pruefe(r.kueste.best.startsWith('Best 60.0 s') && r.kueste.sterne === '★★★', `Küste ${JSON.stringify(r.kueste)}`);
  pruefe(r.dorf.best.startsWith('Best 80.0 s') && r.dorf.sterne === '★★☆' && r.dorf.drift === 'Best 3.000', `Dorf ${JSON.stringify(r.dorf)}`);
  pruefe(r.berge.best === 'noch kein Wert' && r.berge.sterne === '☆☆☆', `Berge ${JSON.stringify(r.berge)}`);
  pruefe(r.speicher.ringe === 80 && r.speicher['ringe@kueste'] === 60 && r.sternSpeicher.ringe === 2 && r.sternSpeicher['ringe@kueste'] === 3, `Speicher ${JSON.stringify([r.speicher, r.sternSpeicher])}`);
  pruefe(/3 Sterne unter 65 s, 2 unter 85 s/.test(r.kueste.ende), `Sternzeiten Küste: ${r.kueste.ende}`);
  pruefe(nachLaden.strecke === 'berge' && nachLaden.best === 'noch kein Wert', `nach Neuladen ${JSON.stringify(nachLaden)}`);
  pruefe(f.length === 0, f.join(' | '));
});

(async () => {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ordner, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  browser = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const nur = process.env.NUR ? process.env.NUR.split(',') : null;
  let rot = 0;
  for (const t of tests) {
    if (nur && !nur.includes(t.name)) continue;
    const start = Date.now();
    try { await t.fn(); console.log(`OK     ${t.name} (${Date.now() - start} ms)`); }
    catch (e) { rot++; console.log(`FEHLER ${t.name}: ${String(e.message).slice(0, 300)}`); }
  }
  await browser.close(); server.kill();
  console.log(rot ? `\n${rot} Test(s) rot.` : '\nAlle Tests grün.');
  process.exit(rot ? 1 : 0);
})();
