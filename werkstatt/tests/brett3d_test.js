// Tests für S-W05 (3D-Ansicht für Vier gewinnt und Schach).
// Aufruf: node werkstatt/tests/brett3d_test.js [ORDNER]   (NUR=name1,name2 wählt Tests aus)
// WebGL läuft im Container in Software.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;

let browser;
async function seite(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  if (opts.vorher) await p.addInitScript(opts.vorher);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.chess && window.__brett.connect4, null, { timeout: 20000 });
  if (opts.tab) await oeffne(p, opts.tab, opts.ohne3d);
  return p;
}
async function oeffne(p, tab, ohne3d) {
  await p.click(`.tabBtn[data-tab=${tab}]`);
  if (!ohne3d) await p.waitForFunction((t) => window.__brett[t].ui.ansicht3d && window.__brett[t].ui.ansicht3d.aktiv, tab, { timeout: 20000 });
  await p.waitForTimeout(300);
}
const zu = async p => p.context().close();
const ruhe = (p) => p.waitForFunction((t) => { const a = window.__brett[t].ui.ansicht3d; return !a.anim.length; }, 'connect4', { timeout: 10000 }).catch(() => { });
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const klick = async (p, spiel, feld, hoehe) => {
  const pt = await p.evaluate(([s, f, h]) => window.__brett[s].ui.ansicht3d.bildschirmPunkt(f, h), [spiel, feld, hoehe]);
  await p.mouse.click(pt.x, pt.y);
  await p.waitForTimeout(80);
};

test('d3_stellung', async () => {
  const p = await seite({ tab: 'connect4' });
  const r = await p.evaluate(async () => {
    const g = window.__brett.connect4, c = g.control, ui = g.ui, a = ui.ansicht3d, out = {};
    c.setMode(false); ui.handleReset();
    for (const col of [3, 3, 2, 4, 6]) ui.handleColumnClick(col);
    await new Promise(r => setTimeout(r, 1500));
    const vergleich = () => {
      const b = c.getBoardState(), fehler = [];
      b.forEach((v, i) => {
        const m = a.stuecke.get(i);
        if (!v && m) fehler.push('zu viel ' + i);
        if (v && (!m || m.userData.wert !== v || m.position.distanceTo(a._c4Pos(i)) > 0.01)) fehler.push('falsch ' + i);
      });
      return { anzahl: a.stuecke.size, fehler };
    };
    out.nachFuenf = vergleich();
    ui.handleUndo(); out.nachZurueck = vergleich();
    ui.handleReset(); out.nachNeustart = vergleich();
    return out;
  });
  pruefe(r.nachFuenf.anzahl === 5 && !r.nachFuenf.fehler.length, `Vier gewinnt ${JSON.stringify(r.nachFuenf)}`);
  pruefe(r.nachZurueck.anzahl === 4 && !r.nachZurueck.fehler.length, `nach Zug zurück ${JSON.stringify(r.nachZurueck)}`);
  pruefe(r.nachNeustart.anzahl === 0, `nach Neustart ${JSON.stringify(r.nachNeustart)}`);
  await oeffne(p, 'chess');
  const s = await p.evaluate(async () => {
    const g = window.__brett.chess, a = g.ui.ansicht3d;
    const vergleich = () => { const b = g.control.getBoardState(), fehler = []; b.forEach((v, i) => { const m = a.stuecke.get(i); if (!!v !== !!m || (v && (m.userData.wert !== v || m.position.distanceTo(a._feldPos(i)) > 0.01))) fehler.push(i); }); return { anzahl: a.stuecke.size, fehler }; };
    const out = { start: vergleich() };
    g.control.setMode(false);
    for (const [v, n] of [[52, 36], [11, 27], [36, 27]]) { g.ui.handleSquareClick(v); g.ui.handleSquareClick(n); }
    await new Promise(r => setTimeout(r, 800)); out.nachSchlag = vergleich();
    g.ui.handleUndo(); out.nachZurueck = vergleich();
    g.ui.handleReset(); out.nachNeustart = vergleich();
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(s.start.anzahl === 32 && !s.start.fehler.length, `Schach Startstellung ${JSON.stringify(s.start)}`);
  pruefe(s.nachSchlag.anzahl === 31 && !s.nachSchlag.fehler.length, `Schach nach Schlagen ${JSON.stringify(s.nachSchlag)}`);
  pruefe(s.nachZurueck.anzahl === 32 && !s.nachZurueck.fehler.length && s.nachNeustart.anzahl === 32 && !s.nachNeustart.fehler.length, `Schach zurück/Neustart ${JSON.stringify([s.nachZurueck, s.nachNeustart])}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_tippen', async () => {
  const p = await seite({ tab: 'connect4' });
  const fehlt = [];
  for (let col = 0; col < 7; col++) for (const h of [0.1, 0.5, 0.9]) {
    await p.evaluate(() => { const g = window.__brett.connect4; g.control.setMode(false); g.ui.handleReset(); });
    await klick(p, 'connect4', col, h);
    const unten = await p.evaluate(() => window.__brett.connect4.control.getBoardState().slice(35));
    if (unten.findIndex(v => v) !== col || unten.filter(v => v).length !== 1) fehlt.push(`${col}/${h}: ${JSON.stringify(unten)}`);
  }
  pruefe(!fehlt.length, `Spalten falsch: ${fehlt.join(' ; ')}`);
  // PS-7: neben das Brett
  await p.evaluate(() => window.__brett.connect4.ui.handleReset());
  const box = await p.evaluate(() => { const r = window.__brett.connect4.ui.ansicht3d.renderer.domElement.getBoundingClientRect(); return { x: r.left + 3, y: r.top + 3 }; });
  await p.mouse.click(box.x, box.y); await p.waitForTimeout(80);
  const leer = await p.evaluate(() => window.__brett.connect4.control.getBoardState().every(v => !v));
  pruefe(leer, 'Tippen neben das Brett hat gesetzt');
  // PS-8: KI am Zug
  await p.evaluate(() => { const c = window.__brett.connect4.control; c._kiTest = c.isAiTurn; c.isAiTurn = () => true; });
  await klick(p, 'connect4', 3, 0.5);
  const leer2 = await p.evaluate(() => { const c = window.__brett.connect4.control; c.isAiTurn = c._kiTest; return c.getBoardState().every(v => !v); });
  pruefe(leer2, 'Tippen während KI am Zug hat gesetzt');
  // Schach: e2 (52), dann e4 (36); PS-6: Ecken bei gedrehtem Brett
  await oeffne(p, 'chess');
  await p.evaluate(() => { const g = window.__brett.chess; g.control.setMode(false); g.ui.handleReset(); });
  await klick(p, 'chess', 52); await klick(p, 'chess', 36);
  const e4 = await p.evaluate(() => window.__brett.chess.control.getBoardState()[36]);
  pruefe(e4 === 'wp', `e2-e4 per Tippen: e4 = ${e4}`);
  const ecken = await p.evaluate(() => {
    const a = window.__brett.chess.ui.ansicht3d, out = {};
    for (const w of [Ansicht3D.DREH_MAX, -Ansicht3D.DREH_MAX, 0]) { a.drehen(w); for (const f of [0, 7, 56, 63, 27]) { const pt = a.bildschirmPunkt(f); out[`${w.toFixed(2)}:${f}`] = a.feldBei(pt.x, pt.y); } }
    return out;
  });
  const falsch = Object.entries(ecken).filter(([k, v]) => Number(k.split(':')[1]) !== v);
  // Echte Klicks bei gedrehtem Brett: Turm a1 (56) auswählen, dann h1 (63) wählt den anderen Turm; Rand des Bildes wählt nichts
  const echt = [];
  for (const w of [1, -1]) {
    await p.evaluate((w) => { const g = window.__brett.chess; g.ui.handleReset(); g.ui.ansicht3d.drehen(w * Ansicht3D.DREH_MAX); }, w);
    for (const f of [56, 63, 48]) { await klick(p, 'chess', f); echt.push([w, f, await p.evaluate(() => { const s = window.__brett.chess.control.getSelected(); return s && ChessControl._indexFromSquare(s); })]); }
  }
  await p.evaluate(() => { const g = window.__brett.chess; g.ui.handleReset(); g.ui.ansicht3d.drehen(0); });
  const rand = await p.evaluate(() => { const r = window.__brett.chess.ui.ansicht3d.renderer.domElement.getBoundingClientRect(); return { x: r.left + 3, y: r.top + 3 }; });
  await p.mouse.click(rand.x, rand.y); await p.waitForTimeout(80);
  const nichts = await p.evaluate(() => window.__brett.chess.control.getSelected());
  pruefe(echt.every(([w, f, s]) => s === f), `echte Klicks gedreht: ${JSON.stringify(echt)}`);
  pruefe(nichts === null, `Tippen neben das Schachbrett wählt ${nichts}`);
  const f = p.fehler; await zu(p);
  pruefe(!falsch.length, `Ecken falsch: ${JSON.stringify(falsch)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_drehen', async () => {
  const p = await seite({ tab: 'connect4' });
  const ziehe = async (dx) => {
    await p.evaluate(() => { const g = window.__brett.connect4; g.control.setMode(false); g.ui.handleReset(); g.ui.ansicht3d.drehen(0); });
    const pt = await p.evaluate(() => window.__brett.connect4.ui.ansicht3d.bildschirmPunkt(3, 0.5));
    await p.mouse.move(pt.x, pt.y); await p.mouse.down();
    const schritte = Math.max(1, Math.ceil(Math.abs(dx) / 20));
    for (let i = 1; i <= schritte; i++) await p.mouse.move(pt.x + dx * i / schritte, pt.y);
    await p.mouse.up(); await p.waitForTimeout(80);
    return p.evaluate(() => ({ drehung: window.__brett.connect4.ui.ansicht3d.drehung, steine: window.__brett.connect4.control.getBoardState().filter(v => v).length }));
  };
  const r7 = await ziehe(7), r8 = await ziehe(8), r9 = await ziehe(9), weit = await ziehe(2000), weitL = await ziehe(-2000);
  const max = await p.evaluate(() => Ansicht3D.DREH_MAX);
  const f = p.fehler; await zu(p);
  pruefe(r7.steine === 1 && r7.drehung === 0, `7 px ist Tippen: ${JSON.stringify(r7)}`);
  pruefe(r8.steine === 1, `8 px ist noch Tippen: ${JSON.stringify(r8)}`);
  pruefe(r9.steine === 0 && r9.drehung !== 0, `9 px ist Drehen: ${JSON.stringify(r9)}`);
  pruefe(Math.abs(Math.abs(weit.drehung) - max) < 1e-9 && Math.abs(Math.abs(weitL.drehung) - max) < 1e-9 && weit.steine === 0, `Grenze ±35°: ${weit.drehung} ${weitL.drehung}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_animation', async () => {
  const p = await seite({ tab: 'connect4' });
  const r = await p.evaluate(async () => {
    const g = window.__brett.connect4, a = g.ui.ansicht3d, out = {};
    g.control.setMode(false); g.ui.handleReset();
    g.ui.handleColumnClick(3);
    const unten = a.stuecke.get(38); out.unten = { ...unten.userData.fall };
    out.startUeber = unten.userData.fall.start > 6.25;
    // obersten Platz in Spalte 0 (Feld 0): sechs Steine abwechselnder Farbe, also kein Sieg
    g.ui.handleReset(); for (let i = 0; i < 6; i++) g.ui.handleColumnClick(0);
    const oben = a.stuecke.get(0); out.oben = oben ? { ...oben.userData.fall } : null;
    await new Promise(r => setTimeout(r, 1500));
    out.endeOben = oben ? Math.abs(oben.position.y - a._c4Pos(0).y) : 99;
    out.erwartetUnten = Ansicht3D.fallzeit(out.unten.start - out.unten.ziel);
    out.erwartetOben = out.oben ? Ansicht3D.fallzeit(out.oben.start - out.oben.ziel) : null;
    out.formel = Math.sqrt(2 * (7.4 - 0.5) / 30);
    // Zweiter Zug 200 ms nach dem ersten (wie die KI): der erste Stein fällt weiter
    g.ui.handleReset(); g.ui.handleColumnClick(2); const erster = a.stuecke.get(37);
    await new Promise(r => setTimeout(r, 200)); g.ui.handleColumnClick(4);
    out.gleicherStein = a.stuecke.get(37) === erster; out.faelltNoch = a.anim.some(x => x.mesh === erster);
    await new Promise(r => setTimeout(r, 1200)); out.ersterLiegt = Math.abs(erster.position.y - a._c4Pos(37).y) < 0.01;
    return out;
  });
  pruefe(r.startUeber, 'Stein startet nicht über dem Ständer');
  pruefe(Math.abs(r.unten.dauer - r.formel) < 0.02 && Math.abs(r.unten.dauer - r.erwartetUnten) < 0.02, `Fallzeit unten ${r.unten.dauer} statt ${r.formel}`);
  pruefe(r.oben && Math.abs(r.oben.dauer - r.erwartetOben) < 0.02 && r.oben.dauer < r.unten.dauer, `Fallzeit oben ${JSON.stringify(r.oben)}`);
  pruefe(r.endeOben < 0.01, `Stein endet nicht auf dem Feld: ${r.endeOben}`);
  pruefe(Math.abs(r.unten.dauer - 0.678) < 0.02 && Math.abs(r.oben.dauer - 0.356) < 0.02, `Fallzeiten laut Spec 0,68 und 0,36 s: ${r.unten.dauer} ${r.oben.dauer}`);
  pruefe(r.gleicherStein && r.faelltNoch && r.ersterLiegt, `zweiter Zug unterbricht den Fall: ${JSON.stringify([r.gleicherStein, r.faelltNoch, r.ersterLiegt])}`);
  await oeffne(p, 'chess');
  const s = await p.evaluate(async () => {
    const g = window.__brett.chess, a = g.ui.ansicht3d;
    g.control.setMode(false); g.ui.handleReset();
    g.ui.handleSquareClick(52); g.ui.handleSquareClick(36);
    const m = a.stuecke.get(36), gleitet = m && m.userData.gleitet;
    await new Promise(r => setTimeout(r, 1200));
    return { gleitet, abstand: m.position.distanceTo(a._feldPos(36)) };
  });
  const f = p.fehler; await zu(p);
  pruefe(s.gleitet && s.gleitet.von === 52 && s.gleitet.nach === 36 && s.abstand < 0.01, `Schach gleiten ${JSON.stringify(s)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_markierung', async () => {
  const p = await seite({ tab: 'chess' });
  const s = await p.evaluate(async () => {
    const g = window.__brett.chess, a = g.ui.ansicht3d, ui = g.ui, out = {};
    g.control.setMode(false); ui.handleReset();
    ui.handleSquareClick(52);
    const marken = (art) => a.markGruppe.children.filter(m => m.userData.art === art).map(m => m.userData.feld).sort((x, y) => x - y);
    out.auswahl = marken('auswahl'); out.ziele = marken('ziel'); out.gehoben = a.stuecke.get(52).position.y;
    ui.handleSquareClick(52);
    // Narrenmatt: f3 e5 g4 Dh4#
    g.control.setLernen(false);   // Narrenmatt absichtlich: ohne Warnung der Lernhilfe (S-W07)
    for (const [v, n] of [[53, 45], [12, 28], [54, 38], [3, 39]]) { ui.handleSquareClick(v); ui.handleSquareClick(n); }
    await new Promise(r => setTimeout(r, 500));
    out.schach = marken('schach'); out.zuletzt = marken('zuletzt');
    ui.handleReset();
    await ui.handleTipp(); out.tipp = a.marken.length;
    await new Promise(r => setTimeout(r, 2000)); out.tippWeg = a.marken.length;
    await ui.handleTipp(); ui.handleSquareClick(52); ui.handleSquareClick(36); out.tippNachZug = a.marken.length;
    return out;
  });
  pruefe(JSON.stringify(s.auswahl) === '[52]' && JSON.stringify(s.ziele) === '[36,44]' && s.gehoben > 0.1, `Auswahl ${JSON.stringify(s)}`);
  pruefe(JSON.stringify(s.schach) === '[60]' && s.zuletzt.includes(39), `Schach ${JSON.stringify(s)}`);
  pruefe(s.tipp === 2 && s.tippWeg === 0 && s.tippNachZug === 0, `Tipp ${JSON.stringify(s)}`);
  await oeffne(p, 'connect4');
  const c = await p.evaluate(async () => {
    const g = window.__brett.connect4, a = g.ui.ansicht3d;
    g.control.setMode(false); g.ui.handleReset();
    for (const col of [0, 6, 1, 6, 2, 6, 3]) g.ui.handleColumnClick(col);
    await new Promise(r => setTimeout(r, 300));
    return [...a.stuecke.values()].filter(m => a._leucht && Object.values(a._leucht).includes(m.material)).map(m => m.userData.feld).sort((x, y) => x - y);
  });
  const f = p.fehler; await zu(p);
  pruefe(JSON.stringify(c) === '[35,36,37,38]', `Gewinnsteine ${JSON.stringify(c)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_schalter', async () => {
  let p = await seite({ tab: 'connect4' });
  const vorher = await p.evaluate(() => ({ text: document.querySelector('#connect4-view .ansicht-knopf').textContent }));
  await p.click('#connect4-view .ansicht-knopf'); await p.waitForTimeout(200);
  const nach = await p.evaluate(() => {
    const ui = window.__brett.connect4.ui;
    return { aktiv: ui.ansicht3d.aktiv, brett2d: getComputedStyle(ui.boardEl).display !== 'none', huelle: !ui.ansicht3d.huelle.hidden, text: document.querySelector('#connect4-view .ansicht-knopf').textContent,
      gespeichert: JSON.parse(localStorage.getItem('brettspiele.einstellungen')).ansicht };
  });
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.connect4);
  await oeffne(p, 'connect4', true); await p.waitForTimeout(1500);
  const neu = await p.evaluate(() => ({ aktiv: !!(window.__brett.connect4.ui.ansicht3d && window.__brett.connect4.ui.ansicht3d.aktiv) }));
  await p.click('#connect4-view .ansicht-knopf');
  await p.waitForFunction(() => window.__brett.connect4.ui.ansicht3d.aktiv, null, { timeout: 10000 });
  const f = p.fehler; await zu(p);
  pruefe(vorher.text === '2D', `Knopftext in 3D: ${vorher.text}`);
  pruefe(!nach.aktiv && nach.brett2d && !nach.huelle && nach.text === '3D' && nach.gespeichert.connect4 === '2d', `nach Umschalten ${JSON.stringify(nach)}`);
  pruefe(!neu.aktiv, 'nach Neuladen nicht 2D');
  // PS-16: alte Daten ohne Feld und unbekannter Wert → 3D
  for (const daten of ['{"formatversion":1,"ton":true,"stufen":{}}', '{"formatversion":1,"ton":true,"stufen":{},"ansicht":{"chess":"mond"}}', '{kaputt']) {
    p = await seite({ vorher: `localStorage.setItem('brettspiele.einstellungen', ${JSON.stringify(daten)})`, tab: 'chess' });
    const a = await p.evaluate(() => window.__brett.chess.ui.ansicht3d.aktiv);
    const f2 = p.fehler; await zu(p);
    pruefe(a && f2.length === 0, `Daten ${daten}: aktiv=${a} ${f2.join(' | ')}`);
  }
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_ohne_webgl', async () => {
  const p = await seite({
    vorher: () => { const alt = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (art, ...r) { return /webgl/.test(art) ? null : alt.call(this, art, ...r); }; },
    tab: 'connect4', ohne3d: true,
  });
  await p.waitForTimeout(800);
  const r = await p.evaluate(() => {
    const ui = window.__brett.connect4.ui, k = document.querySelector('#connect4-view .ansicht-knopf');
    return { aktiv: !!(ui.ansicht3d && ui.ansicht3d.aktiv), brett2d: getComputedStyle(ui.boardEl).display !== 'none', gesperrt: k.disabled, text: k.textContent };
  });
  const f = p.fehler; await zu(p);
  pruefe(!r.aktiv && r.brett2d && r.gesperrt && r.text === '3D nicht möglich', `ohne WebGL ${JSON.stringify(r)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_ruhe', async () => {
  const p = await seite({ tab: 'connect4' });
  const r = await p.evaluate(async () => {
    const g = window.__brett.connect4, a = g.ui.ansicht3d, out = {};
    g.control.setMode(false); g.ui.handleReset();
    await new Promise(r => setTimeout(r, 1000));
    const geo0 = a.renderer.info.memory.geometries, tex0 = a.renderer.info.memory.textures;
    for (let i = 0; i < 30; i++) { if (g.control.isGameOver() || i % 12 === 11) g.ui.handleReset(); g.ui.handleColumnClick((i * 3) % 7); }
    g.ui.handleReset();
    await new Promise(r => setTimeout(r, 1500));
    const b0 = a.bilder; await new Promise(r => setTimeout(r, 3000)); out.bilder = a.bilder - b0;
    out.geo = [geo0, a.renderer.info.memory.geometries]; out.tex = [tex0, a.renderer.info.memory.textures];
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.bilder <= 3, `in 3 s Ruhe ${r.bilder} Bilder`);
  pruefe(r.geo[1] <= r.geo[0] + 1 && r.tex[1] <= r.tex[0], `Lecks ${JSON.stringify(r)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('d3_handy', async () => {
  const p = await seite();
  const ttt = await p.evaluate(async () => { await new Promise(r => setTimeout(r, 800)); return { three: !!window.THREE, breite: document.documentElement.scrollWidth }; });
  await oeffne(p, 'connect4');
  const c4 = await p.evaluate(() => document.documentElement.scrollWidth);
  await oeffne(p, 'chess');
  const ch = await p.evaluate(() => document.documentElement.scrollWidth);
  const f = p.fehler; await zu(p);
  pruefe(!ttt.three, 'three.js schon bei Tic Tac Toe geladen');
  pruefe(ttt.breite <= 412 && c4 <= 412 && ch <= 412, `Querscroll ${ttt.breite}/${c4}/${ch}`);
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
