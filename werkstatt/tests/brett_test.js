// Tests für S-W02 (Brettspiele: Zug zurück, Stufen, Tipp, Spielgefühl).
// Aufruf: node werkstatt/tests/brett_test.js [ORDNER]
// Jeder Test läuft in einem frischen Browser-Kontext (leerer Speicher).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;
const SPIELE = ['tictactoe', 'connect4', 'othello', 'muehle', 'mangala', 'chess'];
const OHNE_SCHACH = SPIELE.filter(s => s !== 'chess');

let browser;
async function seite(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, reducedMotion: opts.reducedMotion || 'no-preference' });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  if (opts.vorher) await p.addInitScript(opts.vorher);
  await p.addInitScript(() => {
    window.__vibriert = [];
    try { Object.defineProperty(navigator, 'vibrate', { configurable: true, value: (m) => { window.__vibriert.push(m); return true; } }); } catch (e) { }
  });
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.tictactoe, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=tictactoe]').click());   // S-W25: die Seite beginnt mit der Auswahl
  await p.waitForTimeout(300);
  return p;
}
const zu = async p => p.context().close();
// Holt ein Spiel und setzt einen festen Zufall.
const B = (name) => `window.__brett.${name}`;

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// ---------- B3: Zug zurück ----------
test('zurueck_zweispieler', async () => {
  const p = await seite();
  const r = await p.evaluate(async () => {
    const g = window.__brett, out = {};
    const vorher = (c) => JSON.stringify({ b: c.getBoardState(), p: c.getCurrentPlayer() });
    // TTT
    let c = g.tictactoe.control; let s0 = vorher(c); c.playerMove(0); out.ttt = c.undoMove().invalid === false && vorher(c) === s0;
    // Vier gewinnt
    c = g.connect4.control; s0 = vorher(c); c.playerMove(3); out.c4 = c.undoMove().invalid === false && vorher(c) === s0;
    // Reversi mit Umdrehen
    c = g.othello.control; s0 = vorher(c); const [r0, k0] = c.getValidMoves()[0]; c.playerMove(r0, k0);
    out.otGeaendert = vorher(c) !== s0; out.ot = c.undoMove().invalid === false && vorher(c) === s0;
    // Mangala
    c = g.mangala.control; s0 = vorher(c); c.playerMove(c.getValidMoves()[0]); out.ma = c.undoMove().invalid === false && vorher(c) === s0;
    // Mühle: Setzphase, dann Ziehphase per gespeichertem Zustand
    c = g.muehle.control; s0 = vorher(c); c.handlePointClick(0); out.mu = c.undoMove().invalid === false && vorher(c) === s0;
    // Missbrauch: 10x zurück nach 3 Zügen
    c = g.tictactoe.control; c.restartGame(); s0 = vorher(c); c.playerMove(4); c.playerMove(0); c.playerMove(8);
    for (let i = 0; i < 10; i++) c.undoMove();
    out.zehnmal = vorher(c) === s0;
    return out;
  });
  await zu(p);
  for (const [k, v] of Object.entries(r)) pruefe(v === true, `${k}: ${v}`);
});

test('zurueck_mühle_ziehphase', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const c = window.__brett.muehle.control, e = window.__brett.muehle.entity;
    // Ziehphase herstellen: alle Steine gesetzt
    // Je 4 Steine (unter 3 wäre das Spiel vorbei)
    const zellen = Array(24).fill(null); [0, 3, 9, 21].forEach(i => zellen[i] = 'W'); [2, 6, 14, 23].forEach(i => zellen[i] = 'B');
    e.loadFromJSON({ cells: zellen,
      currentPlayer: 'W', piecesToPlace: { W: 0, B: 0 }, piecesOnBoard: { W: 4, B: 4 }, phase: 'moving', pendingRemoval: false, lastMillLine: null, finished: false, winner: null });
    const s0 = JSON.stringify(e.toJSON());
    c.handlePointClick(0); const zug = c.handlePointClick(1);
    const bewegt = e.cells[1] === 'W' && e.cells[0] === null;
    c.undoMove();
    return { zug: !zug.invalid, bewegt, gleich: JSON.stringify(e.toJSON()) === s0 };
  });
  await zu(p);
  pruefe(r.zug && r.bewegt && r.gleich, JSON.stringify(r));
});

test('zurueck_gegen_ki', async () => {
  const p = await seite();
  const r = await p.evaluate(async () => {
    const g = window.__brett, out = {};
    const st = (c) => JSON.stringify({ b: c.getBoardState(), p: c.getCurrentPlayer() });
    // TTT gegen KI über die UI-Abläufe
    let c = g.tictactoe.control; c.setMode(true); const s0 = st(c);
    c.playerMove(4); const ki = await c.computeAiMove(); c.playerMove(ki);
    out.tttZweiZuege = c.getBoardState().filter(Boolean).length === 2;
    out.ttt = c.undoMove().invalid === false && st(c) === s0 && !c.isAiTurn();
    // Mangala: Mensch, dann zwei KI-Aktionen (Zusatzzug simuliert über direkte Züge)
    c = g.mangala.control; c.setMode(true); const m0 = st(c);
    c.playerMove(0);              // Mensch A
    const z1 = c.getValidMoves()[0]; c.playerMove(z1);   // KI B
    if (c.getCurrentPlayer() === 'B') c.playerMove(c.getValidMoves()[0]); // ggf. Zusatzzug
    c.undoMove();
    out.ma = st(c) === m0 && c.getCurrentPlayer() === 'A';
    return out;
  });
  await zu(p);
  for (const [k, v] of Object.entries(r)) pruefe(v === true, `${k}: ${v}`);
});

test('zurueck_gesperrt', async () => {
  const p = await seite();
  const r = await p.evaluate(async () => {
    const g = window.__brett, out = {};
    let c = g.tictactoe.control;
    out.leer = c.canUndo() === false && c.undoMove().invalid === true;
    // Spielende: X gewinnt
    [0, 3, 1, 4, 2].forEach(i => c.playerMove(i));
    const stat = JSON.stringify(c.getStats()); const b = JSON.stringify(c.getBoardState());
    out.ende = c.isGameOver() && c.canUndo() === false && c.undoMove().invalid === true && JSON.stringify(c.getBoardState()) === b && JSON.stringify(c.getStats()) === stat;
    // KI am Zug
    c.setMode(true); c.playerMove(0);
    out.kiAmZug = c.isAiTurn() && c.canUndo() === false;
    // Neustart leert
    c.restartGame(); out.neustart = c.canUndo() === false;
    // Moduswechsel leert
    c.setMode(false); c.playerMove(0); c.setMode(false); out.modus = c.canUndo() === false;
    return out;
  });
  await zu(p);
  for (const [k, v] of Object.entries(r)) pruefe(v === true, `${k}: ${v}`);
});

test('zurueck_knopf_ui', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const out = {};
    for (const s of ['tictactoe', 'connect4', 'othello', 'muehle', 'mangala', 'chess']) {
      const v = document.getElementById(s + '-view');
      out[s] = !!v.querySelector('button.zurueck, #chundoBtn') && !!v.querySelector('button.tipp-knopf');
    }
    return out;
  });
  await zu(p);
  for (const [k, v] of Object.entries(r)) pruefe(v === true, `Knöpfe fehlen in ${k}`);
});

// ---------- B2: Stufen ----------
test('stufen_tabelle', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const T = { connect4: [2, 4, 6], othello: [1, 3, 4], mangala: [2, 5, 8], muehle: [1, 2, 4] };
    const F = { tictactoe: [0.45, 0.15, 0], connect4: [0.25, 0.05, 0], othello: [0.3, 0.05, 0], muehle: [0.4, 0.15, 0], mangala: [0.25, 0.05, 0] };
    const out = [];
    for (const [s, f] of Object.entries(F)) {
      const c = window.__brett[s].control;
      ['leicht', 'mittel', 'stark'].forEach((k, i) => {
        c.setDifficulty(k);
        if (c.getDifficulty() !== k) out.push(`${s} ${k} nicht gesetzt`);
        if (Math.abs(c.fehlerquote - f[i]) > 1e-9) out.push(`${s} ${k} Fehler ${c.fehlerquote}`);
        if (T[s] && c.searchDepth !== T[s][i]) out.push(`${s} ${k} Tiefe ${c.searchDepth}`);
      });
      c.setDifficulty('unsinn'); if (c.getDifficulty() !== 'mittel') out.push(`${s} unsinn -> ${c.getDifficulty()}`);
    }
    const ch = window.__brett.chess.control; ch.setDifficulty('unsinn'); if (ch.getDifficulty() !== 'mittel') out.push('chess unsinn');
    // Stufenwahl in der UI für alle 6 Spiele
    for (const s of ['tictactoe', 'connect4', 'othello', 'muehle', 'mangala', 'chess']) {
      const v = document.getElementById(s + '-view');
      if (v.querySelectorAll('.stufen input[type=radio], #chdiff input[type=radio]').length !== 3) out.push(`${s}: keine 3 Stufen in der UI`);
    }
    return out;
  });
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

test('stufen_fehlerquote', async () => {
  const p = await seite();
  const r = await p.evaluate(async () => {
    const out = [];
    const gueltig = {
      tictactoe: c => c.getBoardState().map((v, i) => v === null ? i : -1).filter(i => i >= 0),
      connect4: c => [0, 1, 2, 3, 4, 5, 6].filter(k => c.getBoardState()[k] === null),
      mangala: c => c.getValidMoves(),
    };
    for (const [s, valid] of Object.entries(gueltig)) {
      const c = window.__brett[s].control; c.setMode(true);
      if (s === 'tictactoe') c.playerMove(4); else if (s === 'connect4') c.playerMove(3); else c.playerMove(0);
      if (!c.isAiTurn()) { out.push(`${s}: KI nicht am Zug`); continue; }
      c.setDifficulty('leicht');
      // Zufall 0: Fehlerzug, und zwar der erste gültige Zug
      c.setZufall(() => 0);
      const z0 = await c.computeAiMove();
      if (JSON.stringify(z0) !== JSON.stringify(valid(c)[0])) out.push(`${s}: Zufall 0 -> ${JSON.stringify(z0)} statt ${valid(c)[0]}`);
      // Zufall 0,999: Engine-Zug (= Stark-Zug)
      c.setZufall(() => 0.999);
      const zE = await c.computeAiMove();
      if (!valid(c).some(v => JSON.stringify(v) === JSON.stringify(zE))) out.push(`${s}: Engine-Zug ungültig`);
    }
    // Anteil über 400 Würfe (TTT, deterministischer Zufall)
    const c = window.__brett.tictactoe.control; c.restartGame(); c.setMode(true); c.playerMove(0);
    c.setDifficulty('leicht');
    let seed = 7; const lcg = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    let zufaellig = 0;
    for (let i = 0; i < 400; i++) { c.setZufall(lcg); if (c._entscheideFehler()) zufaellig++; }
    const anteil = zufaellig / 400;
    if (Math.abs(anteil - 0.45) > 0.06) out.push(`Anteil ${anteil}`);
    // Wiederholbarkeit
    const folge = () => { let s = 3; const f = () => (s = (s * 16807) % 2147483647) / 2147483647; c.setZufall(f); return Array.from({ length: 20 }, () => c._entscheideFehler()).join(); };
    if (folge() !== folge()) out.push('nicht wiederholbar');
    // Mühle und Reversi: Zufallszug gültig
    window.__brett.muehle.ui._uebungUeberspringen(); // S-W15: Übung beim ersten Start pausiert den Computer
    const mu = window.__brett.muehle.control; mu.setMode(true); mu.handlePointClick(0); mu.setDifficulty('leicht'); mu.setZufall(() => 0);
    const vorher = mu.getBoardState().filter(Boolean).length; await mu.performAiAction();
    if (mu.getBoardState().filter(Boolean).length !== vorher + 1) out.push('Mühle Zufallszug nicht gesetzt');
    const ot = window.__brett.othello.control; ot.setMode(true); const [a, b] = ot.getValidMoves()[0]; ot.playerMove(a, b);
    ot.setDifficulty('leicht'); ot.setZufall(() => 0); const oz = await ot.computeAiMove();
    if (JSON.stringify(oz) !== JSON.stringify(ot.getValidMoves()[0])) out.push('Reversi Zufallszug');
    return out;
  });
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

test('stufen_stark_ttt', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const c = window.__brett.tictactoe.control;
    let seed = 11; const lcg = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
    let niederlagen = 0;
    for (let n = 0; n < 200; n++) {
      c.setMode(true); c.setDifficulty('stark'); c.setZufall(lcg);
      while (!c.isGameOver()) {
        if (c.isAiTurn()) { c.playerMove(c._engineZugSync()); continue; }
        const frei = c.getBoardState().map((v, i) => v === null ? i : -1).filter(i => i >= 0);
        const out = c.playerMove(frei[Math.floor(lcg() * frei.length)]);
        if (out.result && out.result.winner === 'X') niederlagen++;
      }
    }
    return niederlagen;
  });
  await zu(p);
  pruefe(r === 0, `${r} Niederlagen`);
});

test('einstellungen_speicher', async () => {
  const out = [];
  for (const kaputt of ['{kaputt', '{"formatversion":99,"ton":false}', 'null']) {
    const p = await seite({ vorher: `localStorage.setItem('brettspiele.einstellungen', ${JSON.stringify(kaputt)})` });
    const r = await p.evaluate(() => ({ ton: window.__brett.einstellungen.istTonAn(), st: window.__brett.tictactoe.control.getDifficulty() }));
    if (!(r.ton === true && r.st === 'mittel')) out.push(`${kaputt}: ${JSON.stringify(r)}`);
    if (p.fehler.length) out.push(`${kaputt}: ${p.fehler[0]}`);
    await zu(p);
  }
  // Wiederholbarkeit über Neuladen
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const p = await ctx.newPage();
  await p.goto(URL_); await p.waitForFunction(() => window.__brett && window.__brett.tictactoe);
  await p.evaluate(() => {
    document.querySelector('#tictactoe-view .stufen input[value=leicht]').click();
    document.querySelector('.ton-schalter').click();
  });
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.tictactoe);
  const r = await p.evaluate(() => ({
    st: window.__brett.tictactoe.control.getDifficulty(), ton: window.__brett.einstellungen.istTonAn(),
    gespeichert: JSON.parse(localStorage.getItem('brettspiele.einstellungen'))
  }));
  if (r.st !== 'leicht' || r.ton !== false || r.gespeichert.formatversion !== 1) out.push(`nach Neuladen: ${JSON.stringify(r)}`);
  await ctx.close();
  pruefe(out.length === 0, out.join('; '));
});

// ---------- B3: Tipp ----------
test('tipp_zug', async () => {
  const p = await seite();
  const r = await p.evaluate(async () => {
    const g = window.__brett, out = [];
    // TTT: X auf 0 und 1, O auf 3 und 4 -> X am Zug, Tipp 2
    let c = g.tictactoe.control; [0, 3, 1, 4].forEach(i => c.playerMove(i));
    let t = await c.computeHint(); if (t !== 2) out.push(`TTT Tipp ${t}`);
    // Vier gewinnt: Rot hat 3 unten (0,1,2), Gelb am Zug muss 3 blocken
    c = g.connect4.control; [0, 0, 1, 1, 2].forEach(k => c.playerMove(k));
    t = await c.computeHint(); if (t !== 3) out.push(`C4 Tipp ${t}`);
    // Startstellung aller Spiele: Tipp gültig
    c = g.othello.control; t = await c.computeHint(); if (!c.getValidMoves().some(m => JSON.stringify(m) === JSON.stringify(t))) out.push('Reversi Tipp ungültig');
    c = g.mangala.control; t = await c.computeHint(); if (!c.getValidMoves().includes(t)) out.push('Mangala Tipp ungültig');
    c = g.muehle.control; t = await c.computeHint(); if (!(t && t.setzen !== undefined && c.getBoardState()[t.setzen] === null)) out.push(`Mühle Tipp ${JSON.stringify(t)}`);
    c = g.chess.control; t = await c.computeHint(); if (!(t && t.from && t.to && g.chess.boundary.canMove(t.from, t.to))) out.push(`Schach Tipp ${JSON.stringify(t)}`);
    // Kein Tipp nach Ende und bei KI am Zug
    c = g.tictactoe.control; c.playerMove(2); if (!c.isGameOver()) out.push('TTT nicht beendet');
    if ((await c.computeHint()) !== null) out.push('Tipp nach Ende');
    c.setMode(true); c.playerMove(0); if ((await c.computeHint()) !== null) out.push('Tipp bei KI am Zug');
    return out;
  });
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

test('tipp_anzeige', async () => {
  const p = await seite();
  await p.evaluate(() => { const c = window.__brett.tictactoe.control; [0, 3, 1, 4].forEach(i => c.playerMove(i)); window.__brett.tictactoe.ui.render(); });
  for (let i = 0; i < 5; i++) await p.click('#tictactoe-view button.tipp-knopf');
  await p.waitForSelector('#board .tipp', { timeout: 3000 });
  const r = await p.evaluate(() => ({ n: document.querySelectorAll('#board .tipp').length, idx: [...document.querySelectorAll('#board > *')].findIndex(e => e.classList.contains('tipp')) }));
  await p.waitForTimeout(2100);
  const weg = await p.evaluate(() => document.querySelectorAll('#board .tipp').length);
  await zu(p);
  pruefe(r.n === 1 && r.idx === 2 && weg === 0, JSON.stringify({ ...r, weg }));
});

// ---------- B1: Spielgefühl ----------
test('animation_klassen', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const g = window.__brett, out = [];
    const neu = sel => [...document.querySelectorAll(sel)].map((e, i) => e.classList.contains('neu') ? i : -1).filter(i => i >= 0);
    // TTT
    g.tictactoe.ui.handleCellClick(4); if (JSON.stringify(neu('#board > *')) !== '[4]') out.push(`TTT neu ${neu('#board > *')}`);
    // Vier gewinnt: erster Stein in Spalte 2 landet in Zeile 5 -> --fall 6
    document.querySelector('.tabBtn[data-tab=connect4]').click();
    g.connect4.ui.handleColumnClick(2);
    const c4 = [...document.querySelectorAll('#c4board > *')].filter(e => e.classList.contains('neu'));
    if (c4.length !== 1 || c4[0].style.getPropertyValue('--fall').trim() !== '6') out.push(`C4 ${c4.length} fall=${c4[0] && c4[0].style.getPropertyValue('--fall')}`);
    // Reversi: ein gedrehter Stein
    document.querySelector('.tabBtn[data-tab=othello]').click();
    const [a, b] = g.othello.control.getValidMoves()[0]; g.othello.ui.handleCellClick(a, b);
    const gedreht = document.querySelectorAll('#otboard .dreht').length;
    if (gedreht < 1) out.push('Reversi kein gedrehter Stein');
    if (document.querySelectorAll('#otboard .neu').length !== 1) out.push('Reversi neu != 1');
    // Schach e2-e4
    document.querySelector('.tabBtn[data-tab=chess]').click();
    const idx = sq => (8 - +sq[1]) * 8 + 'abcdefgh'.indexOf(sq[0]);
    g.chess.ui.handleSquareClick(idx('e2')); g.chess.ui.handleSquareClick(idx('e4'));
    const felder = [...document.querySelectorAll('#chboard > *')];
    const fig = felder[idx('e4')].querySelector('.ch-piece');
    if (!fig || !fig.classList.contains('gleitet') || fig.style.getPropertyValue('--dy').trim() !== '2' || fig.style.getPropertyValue('--dx').trim() !== '0') out.push(`Schach gleitet ${fig && fig.className} dy=${fig && fig.style.getPropertyValue('--dy')}`);
    if (!felder[idx('e2')].classList.contains('zuletzt') || !felder[idx('e4')].classList.contains('zuletzt')) out.push('Schach letzter Zug nicht markiert');
    // Mangala: geänderte Gruben pulsieren
    document.querySelector('.tabBtn[data-tab=mangala]').click();
    g.mangala.ui.handlePitClick(0);
    if (document.querySelectorAll('#maboard .neu').length < 2) out.push('Mangala neu < 2');
    // Mühle: gesetzter Stein
    document.querySelector('.tabBtn[data-tab=muehle]').click();
    if (g.muehle.ui.uebung.aktiv()) g.muehle.ui._uebungUeberspringen(); // S-W15: Übung beim ersten Start
    g.muehle.ui.handlePointClick(5);
    if (document.querySelectorAll('#mupoints .neu').length !== 1) out.push('Mühle neu != 1');
    return out;
  });
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

test('ton_vibration', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const g = window.__brett, klaenge = [];
    g.klang.spiele = (n) => klaenge.push(n);
    const ui = g.tictactoe.ui;
    ui.handleCellClick(0); ui.handleCellClick(3); ui.handleCellClick(1); ui.handleCellClick(4); ui.handleCellClick(2);
    const an = { klaenge: [...klaenge], vib: [...window.__vibriert] };
    klaenge.length = 0; window.__vibriert.length = 0;
    g.einstellungen.setzeTon(false);
    ui.handleReset(); ui.handleCellClick(0); ui.handleCellClick(1);
    return { an, aus: { klaenge: [...klaenge], vib: [...window.__vibriert] } };
  });
  await zu(p);
  pruefe(r.an.klaenge.filter(k => k === 'zug').length === 4 && r.an.klaenge.includes('sieg'), `Klänge ${r.an.klaenge}`);
  pruefe(r.an.vib.filter(v => v === 12).length === 4 && r.an.vib.some(v => Array.isArray(v)), `Vibration ${JSON.stringify(r.an.vib)}`);
  pruefe(r.aus.klaenge.length === 0 && r.aus.vib.length === 0, `Ton aus: ${JSON.stringify(r.aus)}`);
});

test('konfetti', async () => {
  let p = await seite();
  const r = await p.evaluate(async () => {
    const ui = window.__brett.tictactoe.ui;
    [0, 3, 1, 4, 2].forEach(i => ui.handleCellClick(i));
    const da = !!document.querySelector('canvas.konfetti');
    await new Promise(r => setTimeout(r, 3000));
    return { da, weg: !document.querySelector('canvas.konfetti') };
  });
  // KI gewinnt: kein Konfetti
  const r2 = await p.evaluate(() => {
    const c = window.__brett.tictactoe.control, ui = window.__brett.tictactoe.ui;
    c.setMode(true); ui.render();
    // O (KI) gewinnt: Stellung direkt herstellen und KI-Zug ausführen
    window.__brett.tictactoe.entity.loadFromJSON({ cells: ['X', 'X', null, 'O', 'O', null, 'X', null, null], currentPlayer: 'O', finished: false });
    const out = c.playerMove(5); ui.afterMove(out.result);
    return { gewinner: out.result && out.result.winner, konfetti: !!document.querySelector('canvas.konfetti') };
  });
  await zu(p);
  p = await seite({ reducedMotion: 'reduce' });
  const r3 = await p.evaluate(() => { const ui = window.__brett.tictactoe.ui; [0, 3, 1, 4, 2].forEach(i => ui.handleCellClick(i)); return !!document.querySelector('canvas.konfetti'); });
  await zu(p);
  pruefe(r.da && r.weg, `Konfetti Mensch ${JSON.stringify(r)}`);
  pruefe(r2.gewinner === 'O' && !r2.konfetti, `KI-Sieg ${JSON.stringify(r2)}`);
  pruefe(!r3, 'Konfetti trotz reduzierter Bewegung');
});

test('keine_skriptfehler', async () => {
  const p = await seite();
  await p.evaluate(async () => {
    for (const t of ['tictactoe', 'connect4', 'othello', 'muehle', 'chess', 'mangala']) {
      document.querySelector(`.tabBtn[data-tab=${t}]`).click();
      document.querySelector(`#${t}-view button.tipp-knopf`)?.click();
      await new Promise(r => setTimeout(r, 150));
    }
  });
  await p.waitForTimeout(1500);
  const f = p.fehler; await zu(p);
  pruefe(f.length === 0, f.join(' | '));
});

(async () => {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ordner, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  browser = await chromium.launch({ args: ['--no-sandbox'] });
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
