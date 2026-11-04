// Tests für S-W15 (Mühle verstehen und gut spielen, Stufe 1).
// Aufruf: node werkstatt/tests/muehle_test.js [ORDNER]   (NUR=name1,name2 wählt Tests, BILDER=ordner speichert Bilder)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;
const SCHLUESSEL = 'brettspiele.einstellungen';

let browser;
// opts.gesehen: Einführung schon gesehen (Einstellungen vorbelegt); opts.vorher: eigenes Init-Skript
async function seite(opts = {}) {
  const ctx = opts.ctx || await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  if (opts.gesehen) await p.addInitScript((k) => { try { if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify({ formatversion: 1, ton: false, stufen: {}, ansicht: {}, lernen: {}, muehleEinfuehrung: true })); } catch (e) { } }, SCHLUESSEL);
  if (opts.vorher) await p.addInitScript(opts.vorher);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.muehle, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=muehle]').click());
  await p.waitForTimeout(250);
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// Hilfsfunktionen im Browser: Stellung laden (W/B: Punktlisten)
const HILFE = () => {
  window.__stand = (o) => {
    const cells = Array(24).fill(null);
    (o.W || []).forEach(i => cells[i] = 'W'); (o.B || []).forEach(i => cells[i] = 'B');
    const set = o.set || { W: 0, B: 0 };
    return { cells, currentPlayer: o.p || 'W', piecesToPlace: { ...set },
      piecesOnBoard: { W: (o.W || []).length, B: (o.B || []).length },
      phase: (set.W || set.B) ? 'placing' : 'moving', pendingRemoval: !!o.pend, lastMillLine: o.linie || null,
      finished: false, winner: null, stellungen: o.stellungen || {} };
  };
  window.__klassen = (k) => [...document.querySelectorAll('#mupoints .mu-point')].map((e, i) => e.classList.contains(k) ? i : -1).filter(i => i >= 0);
};

// ---------- AK-1, AK-2: Übung beim ersten Start ----------
test('mu_uebung', async () => {
  const p = await seite();
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], ui = window.__brett.muehle.ui, warte = ms => new Promise(r => setTimeout(r, ms));
    const banner = document.getElementById('muuebung');
    if (!banner || banner.hidden) return ['Übung nicht sichtbar beim ersten Start'];
    const titel = () => banner.querySelector('.mu-uebung-titel').textContent;
    const status = () => document.getElementById('mustatus').textContent;
    const brett = () => JSON.stringify(ui.uebung.getBoardState());
    let schritte = 0;
    for (let n = 1; n <= 5; n++) {
      if (!titel().includes(`${n} von 5`)) { out.push(`Titel Schritt ${n}: ${titel()}`); break; }
      schritte++;
      const ziele = window.__klassen('ziel');
      if (ziele.length !== 1) out.push(`Schritt ${n}: ${ziele.length} Zielpunkte`);
      const blase = document.querySelectorAll('#muboard .mu-blase');
      if (blase.length !== 1 || !/Hier tippen/.test(blase[0].textContent)) out.push(`Schritt ${n}: Sprechblase fehlt`);
      // PS-2: falscher Punkt ändert nichts, zeigt Hinweis
      const falsch = [...Array(24).keys()].find(i => i !== ziele[0]);
      const vorher = brett();
      ui.handlePointClick(falsch);
      if (brett() !== vorher) out.push(`Schritt ${n}: falscher Punkt ändert das Brett`);
      if (!/Nicht dort/.test(status())) out.push(`Schritt ${n}: kein Hinweis bei falschem Punkt (${status()})`);
      if (n === 3) {
        const geschuetzt = window.__klassen('geschuetzt');
        if (geschuetzt.length !== 3 || document.querySelectorAll('#mupoints .geschuetzt .mu-schild').length !== 3) out.push(`Schritt 3: Schilder ${geschuetzt}`);
        ui.handlePointClick(geschuetzt[0]);
        if (brett() !== vorher) out.push('Schritt 3: geschützter Stein wurde genommen');
      }
      if (n === 4 || n === 5) {
        const sel = ui.uebung.getSelected();
        const nachbar = window.__brett.muehle.boundary.getAdjacent(sel).includes(ziele[0]);
        if (n === 4 && !nachbar) out.push('Schritt 4: Ziel ist kein Nachbar');
        if (n === 5 && nachbar) out.push('Schritt 5: Ziel ist ein Nachbar (kein Springen)');
      }
      ui.handlePointClick(ziele[0]);
      if (n === 2) {
        if (document.querySelectorAll('#mulines .mu-muehle').length < 1) out.push('Schritt 2: keine Mühlenlinie');
        if (!/Mühle! Nimm einen Stein von Schwarz/.test(status())) out.push(`Schritt 2: Status ${status()}`);
        await warte(800);
        if (document.querySelectorAll('#mulines .mu-muehle').length < 1) out.push('Schritt 2: Mühlenlinie kürzer als 0,8 s');
      }
      await warte(1700);
    }
    if (schritte !== 5) out.push(`${schritte} Schritte statt 5`);
    if (!/Geschafft/.test(banner.textContent)) out.push(`kein Abschluss: ${banner.textContent}`);
    banner.querySelector('.mu-los').click();
    await warte(100);
    if (!banner.hidden) out.push('Übung nach "Los" noch sichtbar');
    if (window.__brett.muehle.control.getBoardState().some(Boolean)) out.push('echte Partie durch Übung verändert');
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-3: Einführung gespeichert ----------
test('mu_uebung_speicher', async () => {
  const out = [];
  // PS-3: Überspringen speichert, Neuladen ohne Übung
  let ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  let p = await seite({ ctx });
  await p.evaluate(() => document.querySelector('#muuebung .mu-ueberspringen').click());
  const gespeichert = await p.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)).muehleEinfuehrung; } catch (e) { return 'kaputt'; } }, SCHLUESSEL);
  if (gespeichert !== true) out.push(`nicht gespeichert: ${gespeichert}`);
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.muehle);
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=muehle]').click());
  if (!(await p.evaluate(() => document.getElementById('muuebung').hidden))) out.push('Übung kommt nach Neuladen wieder');
  out.push(...p.fehler); await ctx.close();
  // nach vollständiger Übung ebenfalls gespeichert (Abschluss)
  ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
  p = await seite({ ctx });
  const fertig = await p.evaluate(async (k) => {
    const ui = window.__brett.muehle.ui;
    for (let n = 0; n < 5; n++) {
      ui.handlePointClick([...document.querySelectorAll('#mupoints .mu-point')].findIndex(e => e.classList.contains('ziel')));
      await new Promise(r => setTimeout(r, 1600));
    }
    try { return JSON.parse(localStorage.getItem(k)).muehleEinfuehrung; } catch (e) { return 'kaputt'; }
  }, SCHLUESSEL);
  if (fertig !== true) out.push(`Abschluss nicht gespeichert: ${fertig}`);
  await ctx.close();
  // PS-4: kaputte Einstellungen
  p = await seite({ vorher: `try { localStorage.setItem('${SCHLUESSEL}', '{kaputt'); } catch (e) { }` });
  if (await p.evaluate(() => document.getElementById('muuebung').hidden)) out.push('kaputte Einstellungen: keine Übung');
  out.push(...p.fehler.map(f => 'kaputt: ' + f)); await zu(p);
  // PS-5: Speicher blockiert
  p = await seite({ vorher: () => { const w = () => { throw new Error('gesperrt'); }; Storage.prototype.getItem = w; Storage.prototype.setItem = w; } });
  const r = await p.evaluate(() => {
    const sichtbar = !document.getElementById('muuebung').hidden;
    document.querySelector('#muuebung .mu-ueberspringen').click();
    const c = window.__brett.muehle.control; c.handlePointClick(0);
    return { sichtbar, gesetzt: c.getBoardState()[0] === 'W' };
  });
  if (!r.sichtbar) out.push('blockiert: keine Übung'); if (!r.gesetzt) out.push('blockiert: Spiel läuft nicht');
  out.push(...p.fehler.map(f => 'blockiert: ' + f)); await zu(p);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-4, AK-7: Weiß beginnt, Statuszeile, Vorrat ----------
test('mu_status', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.muehle, c = g.control, ui = g.ui, e = g.entity;
    const status = () => document.getElementById('mustatus').textContent;
    const vorrat = s => document.querySelectorAll(`#muvorrat${s} .mu-stein`).length;
    c.setMode(false); ui.render();
    if (c.getCurrentPlayer() !== 'W') out.push(`Start ${c.getCurrentPlayer()}`);
    if (!/Weiß/.test(status()) || !/Setze/.test(status()) || !/noch 9/.test(status())) out.push(`Setzen: ${status()}`);
    if (vorrat('W') !== 9 || vorrat('B') !== 9) out.push(`Vorrat ${vorrat('W')}/${vorrat('B')}`);
    ui.handlePointClick(0);
    if (vorrat('W') !== 8) out.push(`Vorrat nach Setzen ${vorrat('W')}`);
    // PS-7: Vorrat 1 und 0
    const lade = (o) => { e.loadFromJSON(window.__stand(o)); ui.render(); };
    lade({ W: [0], B: [5, 6], set: { W: 1, B: 1 }, p: 'W' });
    if (vorrat('W') !== 1 || !/noch 1\b/.test(status())) out.push(`Vorrat 1: ${vorrat('W')} ${status()}`);
    lade({ W: [0, 3], B: [5, 6], set: { W: 0, B: 1 }, p: 'B' });
    if (vorrat('W') !== 0) out.push(`Vorrat 0: ${vorrat('W')}`);
    const texte = [];
    // Ziehen
    lade({ W: [0, 3, 9, 21], B: [2, 6, 14, 23], p: 'W' }); texte.push(status());
    if (!/Ziehen/.test(status())) out.push(`Ziehen: ${status()}`);
    // Springen
    lade({ W: [0, 3, 21], B: [2, 6, 14, 23], p: 'W' }); texte.push(status());
    if (!/Springen/.test(status())) out.push(`Springen: ${status()}`);
    // Wegnehmen
    lade({ W: [0, 1, 2, 9], B: [5, 6, 14, 23], p: 'W', pend: true, linie: [0, 1, 2] }); texte.push(status());
    if (!/Mühle!/.test(status()) || !/Nimm/.test(status())) out.push(`Wegnehmen: ${status()}`);
    // Ende: Weiß zieht in eine Mühle und nimmt den dritten Stein von Schwarz
    lade({ W: [0, 1, 3, 9], B: [5, 6, 14], p: 'W' });
    c.handlePointClick(3); c.handlePointClick(2);
    const res = c.handlePointClick(5);
    ui.afterMove(res.result); texte.push(status());
    if (!/gewinnt/.test(status())) out.push(`Ende: ${status()}`);
    if (texte.some(t => /Fliegen/.test(t))) out.push('Wort "Fliegen" kommt vor');
    if (texte.some(t => t.length > 110)) out.push('Statuszeile zu lang');
    // PS-22: alter Spielstand ohne Zähler mit Schwarz am Zug lädt weiter
    const alt = window.__stand({ W: [0, 3, 9, 21], B: [2, 6, 14, 23], p: 'B' }); delete alt.stellungen;
    g.boundary.restoreEntity(alt); ui.render();
    if (c.getCurrentPlayer() !== 'B') out.push('alter Stand: Schwarz nicht am Zug');
    c.handlePointClick(2); const z = c.handlePointClick(1);
    if (z.invalid || c.getBoardState()[1] !== 'B') out.push('alter Stand: Zug geht nicht');
    // PS-22b: alter Stand gegen den Computer: der Computer behält Weiß bis zum Neustart
    await g.boundary._gameRepo.save({ vsAI: true, entity: alt });
    await c.restoreGame();
    if (c.aiPlayer !== 'W' || c.isAiTurn()) out.push(`alter Computer-Stand: Computer ${c.aiPlayer}`);
    c.restartGame();
    if (c.aiPlayer !== 'B') out.push('nach Neustart spielt der Computer nicht Schwarz');
    const neu = window.__stand({ W: [0, 3, 9, 21], B: [2, 6, 14, 23], p: 'W' });
    await g.boundary._gameRepo.save({ vsAI: true, entity: neu });
    await c.restoreGame();
    if (c.aiPlayer !== 'B') out.push('neuer Computer-Stand: Computer nicht Schwarz');
    c.restartGame(); c.setMode(false);
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-5: Markierungen und Größe ----------
test('mu_markierung', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], g = window.__brett.muehle, c = g.control, ui = g.ui, e = g.entity;
    const lade = (o) => { e.loadFromJSON(window.__stand(o)); c.selected = null; ui.render(); };
    c.setMode(false); ui.render();
    // Größe: jeder Punkt mindestens 44 x 44 px
    const pts = [...document.querySelectorAll('#mupoints .mu-point')];
    if (pts.length !== 24) out.push(`${pts.length} Punkte`);
    const klein = pts.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
    if (klein.length) out.push(`${klein.length} Punkte kleiner als 44 px (${pts[0].getBoundingClientRect().width})`);
    const breite = document.getElementById('muehle-view').scrollWidth;
    if (breite > 412) out.push(`Mühle breiter als der Bildschirm: ${breite}`);
    // Setzen: alle freien leuchten
    lade({ W: [0, 4], B: [8], set: { W: 7, B: 8 }, p: 'B' });
    if (window.__klassen('ziel').length !== 21) out.push(`Setzen: ${window.__klassen('ziel').length} Ziele`);
    // Ziehen: Ringe genau auf eigenen ziehbaren Steinen
    lade({ W: [0, 1, 7, 21], B: [2, 6, 3, 9], p: 'W' });
    const ziehbar = window.__klassen('ziehbar').join();
    if (ziehbar !== '7,21') out.push(`Ringe ${ziehbar} statt 7,21`);
    if (window.__klassen('ziel').length) out.push('Ziehen: Ziele vor der Auswahl');
    ui.handlePointClick(21);
    if (window.__klassen('selected').join() !== '21') out.push('Auswahl nicht markiert');
    const ziele = window.__klassen('ziel').join();
    if (ziele !== '20,22,13') { const erw = [13, 20, 22]; if (window.__klassen('ziel').sort((a, b) => a - b).join() !== erw.join()) out.push(`Ziele ${ziele}`); }
    // Wegnehmen: genau die nehmbaren, Schild auf geschützten
    lade({ W: [0, 1, 2, 9], B: [16, 17, 18, 5, 23], p: 'W', pend: true, linie: [0, 1, 2] });
    if (window.__klassen('removable').join() !== '5,23') out.push(`nehmbar ${window.__klassen('removable')}`);
    if (window.__klassen('geschuetzt').join() !== '16,17,18') out.push(`Schild ${window.__klassen('geschuetzt')}`);
    if (document.querySelectorAll('#mulines .mu-muehle').length !== 1) out.push('Mühlenlinie fehlt beim Wegnehmen');
    // PS-9: alle gegnerischen in Mühlen -> alle nehmbar, kein Schild
    lade({ W: [0, 1, 2, 9], B: [16, 17, 18], p: 'W', pend: true, linie: [0, 1, 2] });
    if (window.__klassen('removable').join() !== '16,17,18') out.push(`alle in Mühlen: nehmbar ${window.__klassen('removable')}`);
    if (window.__klassen('geschuetzt').length) out.push('alle in Mühlen: trotzdem Schild');
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-6: Drohungen ----------
test('mu_drohung', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], g = window.__brett.muehle, b = g.boundary, e = g.entity, ui = g.ui, c = g.control;
    const fall = (name, o, s, erwartet) => {
      e.loadFromJSON(window.__stand(o));
      const ist = b.getDrohungen(s).join();
      if (ist !== erwartet.join()) out.push(`${name}: ${ist} statt ${erwartet.join()}`);
    };
    fall('Setzphase', { W: [0, 1], B: [8], set: { W: 7, B: 8 }, p: 'B' }, 'W', [2]);
    fall('Ziehphase erreichbar', { W: [0, 1, 3, 20], B: [8, 10, 12, 14], p: 'B' }, 'W', [2]);
    fall('PS-11 unerreichbar', { W: [0, 1, 20, 22], B: [3, 8, 10, 12], p: 'B' }, 'W', []);
    fall('Springen', { W: [0, 1, 20], B: [3, 8, 10, 12], p: 'B' }, 'W', [2]);
    fall('keine Linie', { W: [0, 4, 20, 22], B: [3, 8, 10, 12], p: 'B' }, 'W', []);
    fall('Linie besetzt', { W: [0, 1, 3, 20], B: [2, 8, 10, 12], p: 'B' }, 'W', []);
    // UI: Lernhilfe an -> Ausrufezeichen und Warnsatz; aus -> nichts (PS-12)
    c.setMode(false);
    e.loadFromJSON(window.__stand({ W: [0, 1], B: [8], set: { W: 7, B: 8 }, p: 'B' }));
    ui.setzeLernen(true); ui.render();
    const status = () => document.getElementById('mustatus').textContent;
    if (window.__klassen('drohung').join() !== '2' || !document.querySelector('#mupoints .drohung .mu-warn')) out.push(`Lernhilfe an: ${window.__klassen('drohung')}`);
    if (!/droht/.test(status())) out.push(`kein Warnsatz: ${status()}`);
    // Zeilen zählen über die Textrechtecke (unabhängig von der Mindesthöhe des Feldes)
    const rg = document.createRange(); rg.selectNodeContents(document.getElementById('mustatus'));
    const zeilen = new Set([...rg.getClientRects()].map(r => Math.round(r.top))).size;
    if (zeilen > 2) out.push(`Statuszeile mit Warnsatz hat ${zeilen} Zeilen`);
    ui.setzeLernen(false); ui.render();
    if (window.__klassen('drohung').length || /droht/.test(status())) out.push('Lernhilfe aus: trotzdem Warnung');
    if (window.__brett.einstellungen.lernen('muehle') !== false) out.push('Lernhilfe aus nicht gespeichert');
    if (!document.querySelector('#muehle-view .lernen-knopf')) out.push('kein Lernhilfe-Knopf');
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-8: Stärke gegen den bisherigen 1-Zug-Computer ----------
test('mu_staerke', async () => {
  const p = await seite({ gesehen: true });
  const r = await p.evaluate(async () => {
    const out = [];
    const c = window.__brett.muehle.control;
    // Die Steuerung reicht die Tiefe der Stufe an die Suche weiter
    const echt = c.aiStrategy, gesehen = [];
    c.aiStrategy = { chooseMove: (e, a) => { gesehen.push(a[2]); return Promise.resolve(AIEngines[e](...a)); } };
    c.setZufall(() => 0.999);
    for (const k of ['leicht', 'mittel', 'stark']) { c.restartGame(); c.setMode(true); c.setDifficulty(k); c.handlePointClick(0); await c.performAiAction(); }
    c.aiStrategy = echt; c.setMode(false);
    if (gesehen.join() !== '1,2,4') out.push(`Tiefe an die Suche: ${gesehen.join()}`);
    const T = [1, 2, 4];
    ['leicht', 'mittel', 'stark'].forEach((k, i) => { c.setDifficulty(k); if (c.searchDepth !== T[i]) out.push(`${k} Tiefe ${c.searchDepth}`); });
    // Knotengrenze: knapp gesetzt liefert sie wiederholbar den Zug einer vollständigen Tiefe
    const st = new MuehleEntity(); [0, 9, 4, 13].forEach(i => st.place(i));
    const k1 = JSON.stringify(AIEngines.muehle(st.toJSON(), 'W', 4, 300)), k2 = JSON.stringify(AIEngines.muehle(st.toJSON(), 'W', 4, 300));
    const voll = [1, 2, 3].map(d => JSON.stringify(AIEngines.muehle(st.toJSON(), 'W', d, 1e9)));
    if (k1 !== k2) out.push('Knotengrenze nicht wiederholbar');
    if (!voll.includes(k1)) out.push(`Knotengrenze: ${k1} ist keine vollständige Tiefe`);
    // Bisheriger Computer (vor S-W15), unverändert nachgebaut: 1 Zug voraus, Steinbilanz + 5 für eine Mühle
    const alt = (e) => {
      const sp = e.currentPlayer, op = sp === 'B' ? 'W' : 'B';
      const wert = (k) => k.finished ? (k.winner === sp ? 100000 : k.winner === op ? -100000 : 0)
        : (k.piecesOnBoard[sp] - k.piecesOnBoard[op]) + (k.pendingRemoval ? 5 : 0);
      let best = null, bw = -Infinity;
      if (e.pendingRemoval) {
        for (let i = 0; i < 24; i++) { if (!e.canRemove(i)) continue; const k = e.clone(); k.removePiece(i); const w = wert(k) + MuehleEntity.ADJACENCY[i].length * 0.1; if (w > bw) { bw = w; best = { entfernen: i }; } }
      } else if (e.phase === 'placing') {
        for (const i of e.getValidPlacements()) { const k = e.clone(); k.place(i); const w = wert(k); if (w > bw) { bw = w; best = { setzen: i }; } }
      } else {
        for (const [a, b] of e.getValidMovePairs(sp)) { const k = e.clone(); k.move(a, b); const w = wert(k); if (w > bw) { bw = w; best = { von: a, nach: b }; } }
      }
      return best;
    };
    const fuehreAus = (e, z) => {
      if (z.setzen !== undefined) e.place(z.setzen);
      else if (z.von !== undefined) e.move(z.von, z.nach);
      if (z.entfernen !== undefined && e.pendingRemoval) e.removePiece(z.entfernen);
    };
    const zeiten = [];
    const partie = (saat, starkIst) => {
      let s = saat; const zufall = () => (s = (s * 16807) % 2147483647) / 2147483647;
      const e = new MuehleEntity(), zuege = [];
      for (let k = 0; k < 4; k++) { const frei = e.getValidPlacements(); e.place(frei[Math.floor(zufall() * frei.length)]); }
      for (let n = 0; n < 400 && !e.finished; n++) {
        let z;
        if (e.currentPlayer === starkIst) {
          const t0 = performance.now();
          z = AIEngines.muehle(e.toJSON(), e.currentPlayer, MuehleControl.STUFEN.stark.tiefe, MuehleControl.KNOTEN);
          zeiten.push(performance.now() - t0);
        } else z = alt(e);
        zuege.push(JSON.stringify(z));
        fuehreAus(e, z);
      }
      return { sieger: e.finished ? e.winner : 'offen', zuege };
    };
    // Gegen sich selbst mit Tiefe 1 (= leicht ohne Fehlerzüge): Tiefe muss messbar zählen
    const gegenFlach = (saat, starkIst) => {
      let s = saat; const zufall = () => (s = (s * 16807) % 2147483647) / 2147483647;
      const e = new MuehleEntity();
      for (let k = 0; k < 4; k++) { const frei = e.getValidPlacements(); e.place(frei[Math.floor(zufall() * frei.length)]); }
      for (let n = 0; n < 400 && !e.finished; n++) {
        const t = e.currentPlayer === starkIst ? MuehleControl.STUFEN.stark.tiefe : 1;
        fuehreAus(e, AIEngines.muehle(e.toJSON(), e.currentPlayer, t, MuehleControl.KNOTEN));
      }
      return e.finished ? e.winner : 'offen';
    };
    let fSiege = 0, fNieder = 0;
    for (let i = 0; i < 20; i++) { const st = i % 2 ? 'B' : 'W', w = gegenFlach(1000 + i * 7919, st); if (w === st) fSiege++; else if (w === 'W' || w === 'B') fNieder++; }
    if (fSiege < 10) out.push(`gegen Tiefe 1 nur ${fSiege} Siege`);
    if (fNieder > 0) out.push(`gegen Tiefe 1 ${fNieder} Niederlagen`);
    let siege = 0, niederlagen = 0, remis = 0;
    for (let i = 0; i < 20; i++) {
      const stark = i % 2 ? 'B' : 'W';
      const { sieger } = partie(1000 + i * 7919, stark);
      if (sieger === stark) siege++; else if (sieger === 'W' || sieger === 'B') niederlagen++; else remis++;
    }
    const mittel = zeiten.reduce((a, b) => a + b, 0) / zeiten.length, max = Math.max(...zeiten);
    // PS-15: gleiche Saat, gleiche Züge
    const a = partie(4242, 'W').zuege.join('|'), b = partie(4242, 'W').zuege.join('|');
    if (a !== b) out.push('nicht wiederholbar');
    // Wiederholung in der Suche: Weiß steht besser (5 gegen 4 Steine) und meidet den Zug in die dritte Wiederholung
    const zl = Array(24).fill(null); [0, 4, 10, 20, 15].forEach(i => zl[i] = 'W'); [2, 6, 12, 22].forEach(i => zl[i] = 'B');
    const remisStand = (stellungen) => ({ cells: zl.slice(), currentPlayer: 'W', piecesToPlace: { W: 0, B: 0 }, piecesOnBoard: { W: 5, B: 4 },
      phase: 'moving', pendingRemoval: false, lastMillLine: null, finished: false, winner: null, stellungen });
    const ohne = AIEngines.muehle(remisStand({}), 'W', 1, MuehleControl.KNOTEN);
    const nach = zl.slice(); nach[ohne.von] = null; nach[ohne.nach] = 'W';
    const mit = AIEngines.muehle(remisStand({ [nach.map(x => x || '-').join('') + 'B']: 2 }), 'W', 1, MuehleControl.KNOTEN);
    if (mit.von === ohne.von && mit.nach === ohne.nach) out.push(`Suche zieht im Vorteil in die dritte Wiederholung (${ohne.von}->${ohne.nach})`);
    // PS-14: Endspiel mit Springen auf beiden Seiten
    const e = new MuehleEntity();
    e.loadFromJSON({ cells: Array(24).fill(null).map((_, i) => [0, 5, 12].includes(i) ? 'W' : [3, 18, 22].includes(i) ? 'B' : null),
      currentPlayer: 'W', piecesToPlace: { W: 0, B: 0 }, piecesOnBoard: { W: 3, B: 3 }, phase: 'moving', pendingRemoval: false, lastMillLine: null, finished: false, winner: null });
    const t0 = performance.now(); const zs = AIEngines.muehle(e.toJSON(), 'W', 4, MuehleControl.KNOTEN); const tSpr = performance.now() - t0;
    if (!zs || !e.canMoveTo(zs.von, zs.nach)) out.push(`Springen: ungültiger Zug ${JSON.stringify(zs)}`);
    if (tSpr > 1500) out.push(`Springen dauert ${Math.round(tSpr)} ms`);
    if (siege < 16) out.push(`nur ${siege} Siege von 20`);
    if (niederlagen > 2) out.push(`${niederlagen} Niederlagen`);
    if (mittel >= 400) out.push(`Mittel ${Math.round(mittel)} ms`);
    if (max > 1500) out.push(`Höchstwert ${Math.round(max)} ms`);
    return { out, mess: `Siege ${siege}, Niederlagen ${niederlagen}, Remis ${remis}; gegen Tiefe 1: ${fSiege} Siege, ${fNieder} Niederlagen; Mittel ${Math.round(mittel)} ms, Max ${Math.round(max)} ms, Springen ${Math.round(tSpr)} ms` };
  });
  const f = p.fehler; await zu(p);
  console.log('       Messwerte mu_staerke: ' + r.mess);
  pruefe(r.out.length === 0 && f.length === 0, [...r.out, ...f].join('; '));
});

// ---------- AK-9: Unentschieden bei dritter Wiederholung ----------
test('mu_remis', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.muehle, c = g.control, e = g.entity, ui = g.ui;
    c.setMode(false);
    await c.resetStats();
    // Erste Ziehstellung zählt: letzter Setzzug
    e.loadFromJSON(window.__stand({ W: [0, 4, 10, 20, 15, 13, 17, 19, 22], B: [2, 6, 12, 23, 9, 11, 14, 16], set: { W: 0, B: 1 }, p: 'B' }));
    c.handlePointClick(8);
    if (Object.keys(e.toJSON().stellungen || {}).length !== 1) out.push('erste Ziehstellung nicht gezählt');
    // Pendeln: W 0<->1, B 2<->3; Start zählt einmal
    const start = { W: [0, 4, 10, 20], B: [2, 6, 12, 22], p: 'W' };
    const s0 = window.__stand(start); const schl = s0.cells.map(x => x || '-').join('') + 'W';
    e.loadFromJSON({ ...s0, stellungen: { [schl]: 1 } }); ui.render();
    const zug = (a, b) => { c.handlePointClick(a); return c.handlePointClick(b); };
    const folge = [[0, 1], [2, 3], [1, 0], [3, 2]];
    let res = null;
    for (let k = 0; k < 7; k++) { res = zug(...folge[k % 4]); }
    if (e.finished) out.push('nach zweiter Wiederholung schon beendet');
    // Zug zurück nimmt die Zählung mit
    c.undoMove();
    const nachZurueck = e.toJSON().stellungen[schl];
    if (nachZurueck !== 2) out.push(`Zählung nach Zug zurück ${nachZurueck}`);
    zug(1, 0); // Zug 7 noch einmal
    if (e.finished) out.push('nach Zug 7 beendet');
    res = zug(3, 2); // Zug 8: Startstellung zum dritten Mal
    if (!e.finished || e.winner !== 'Draw') out.push(`kein Unentschieden: ${e.finished} ${e.winner}`);
    ui.afterMove(c.isGameOver() ? { winner: e.winner, line: null } : null);
    if (!/Unentschieden/.test(document.getElementById('mustatus').textContent)) out.push(`Status ${document.getElementById('mustatus').textContent}`);
    if (c.getStats().draws !== 1) out.push(`Statistik Remis ${c.getStats().draws}`);
    if (!document.getElementById('mustatDraw') || document.getElementById('mustatDraw').textContent !== '1') out.push('Remis-Anzeige fehlt');
    // PS-17: Zug zurück nach dem Unentschieden ändert nichts
    const vorher = JSON.stringify(e.toJSON());
    if (!c.undoMove().invalid || JSON.stringify(e.toJSON()) !== vorher) out.push('Zug zurück nach Unentschieden');
    // Wegnahme leert die Zählung
    e.loadFromJSON(window.__stand({ W: [0, 1, 3, 9], B: [5, 6, 14, 22, 23], p: 'W', stellungen: { abc: 2 } }));
    zug(3, 2); c.handlePointClick(23);
    if (Object.keys(e.toJSON().stellungen).length !== 1) out.push(`Zählung nach Wegnahme ${JSON.stringify(e.toJSON().stellungen)}`);
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-10: Regelkarten hinter "?" ----------
test('mu_hilfe', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.muehle, c = g.control, ui = g.ui, warte = ms => new Promise(r => setTimeout(r, ms));
    const stand = () => JSON.stringify(g.boundary.getEntitySnapshot());
    const knopf = document.querySelector('#muehle-view .mu-hilfe-knopf');
    if (!knopf) return ['kein ?-Knopf'];
    c.setMode(false); ui.render();
    ui.handlePointClick(0); ui.handlePointClick(5);
    const s0 = stand();
    knopf.click();
    const hilfe = document.getElementById('muhilfe');
    if (hilfe.hidden) out.push('Karten nicht sichtbar');
    if (hilfe.querySelectorAll('.mu-karte').length !== 3) out.push(`${hilfe.querySelectorAll('.mu-karte').length} Karten`);
    if (hilfe.querySelectorAll('.mu-karte svg').length !== 3) out.push('Mini-Bretter fehlen');
    hilfe.querySelector('.mu-hilfe-schliessen').click();
    if (!hilfe.hidden) out.push('Schließen schließt nicht');
    if (stand() !== s0) out.push('Schließen ändert die Partie');
    // Übung wiederholen, danach Partie wie vorher
    knopf.click(); hilfe.querySelector('.mu-hilfe-uebung').click();
    const banner = document.getElementById('muuebung');
    if (banner.hidden || !/1 von 5/.test(banner.textContent)) out.push('Übung startet nicht');
    banner.querySelector('.mu-ueberspringen').click();
    if (stand() !== s0) out.push('Übung ändert die Partie');
    if (!/Setze/.test(document.getElementById('mustatus').textContent)) out.push('Status nach Übung falsch');
    // PS-19: ? während der Computer gleich zieht, zehnmal schnell tippen
    c.restartGame(); c.setMode(true); ui.render();
    ui.handlePointClick(0); // jetzt ist der Computer dran
    for (let i = 0; i < 10; i++) knopf.click();
    const s1 = stand();
    await warte(1500);
    if (hilfe.hidden) out.push('nach zehnmal Tippen nicht offen');
    if (stand() !== s1) out.push('Computer zieht, während die Karten offen sind');
    hilfe.querySelector('.mu-hilfe-schliessen').click();
    await warte(2500);
    if (c.getCurrentPlayer() !== 'W' || c.getBoardState().filter(Boolean).length !== 2) out.push('Computer zieht nach dem Schließen nicht');
    // PS-19b: Karten öffnen, während der Computer schon rechnet (Rechnung dauert hier 800 ms)
    const echt = c.aiStrategy;
    c.aiStrategy = { chooseMove: (e, a) => new Promise(r => setTimeout(() => r(AIEngines[e](...a)), 800)) };
    c.setZufall(() => 0.999);         // kein Fehlerzug: der Computer rechnet wirklich
    c.restartGame(); ui.render();
    ui.handlePointClick(0);
    await warte(600);                  // Verzögerung (400 ms) vorbei, Rechnung läuft
    knopf.click();
    const s2 = stand();
    await warte(1200);
    if (stand() !== s2) out.push('Computerzug landet, obwohl die Karten offen sind');
    hilfe.querySelector('.mu-hilfe-schliessen').click();
    await warte(2200);
    if (c.getBoardState().filter(Boolean).length !== 2) out.push('Computer zieht nach Pause während der Rechnung nicht');
    // Befund 4: Neustart während der Rechnung, dann sofort ein Zug: Computer zieht trotzdem
    c.restartGame(); ui.render();
    ui.handlePointClick(3);
    await warte(600);
    c.restartGame(); ui.render(); ui.handlePointClick(5);
    await warte(2500);
    if (c.getBoardState().filter(Boolean).length !== 2 || c.getCurrentPlayer() !== 'W') out.push(`Partie hängt nach Neustart während der Rechnung (${c.getBoardState().filter(Boolean).length} Steine)`);
    c.aiStrategy = echt;
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-11: Bilder aus Spielersicht ----------
// Zählt Bildpunkte nahe einer Farbe im Bildschirmfoto (im Browser dekodiert).
async function zaehle(p, png, farben) {
  return p.evaluate(async ({ b64, farben }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    const d = cx.getImageData(0, 0, cv.width, cv.height).data, out = {};
    for (const [name, [r, g, b]] of Object.entries(farben)) {
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - r) < 26 && Math.abs(d[i + 1] - g) < 26 && Math.abs(d[i + 2] - b) < 26) n++;
      out[name] = n;
    }
    return out;
  }, { b64: png.toString('base64'), farben });
}
const FARBEN = { linie: [255, 214, 10], ring: [10, 132, 255], schild: [90, 200, 250], ziel: [52, 199, 89] };
test('mu_bilder', async () => {
  const ziel = process.env.BILDER;
  if (ziel) fs.mkdirSync(ziel, { recursive: true });
  const p = await seite();
  await p.evaluate(HILFE);
  const out = [], bilder = {};
  const foto = async (name) => {
    await p.waitForTimeout(150);
    const png = await p.screenshot();
    bilder[name] = png;
    if (ziel) fs.writeFileSync(path.join(ziel, `muehle-${name}.png`), png);
    return zaehle(p, png, FARBEN);
  };
  // Übung, Schritt für Schritt
  for (let n = 1; n <= 5; n++) {
    const z = await foto(`uebung-${n}`);
    if (z.ziel < 200) out.push(`Übung ${n}: Zielpunkt ${z.ziel} Bildpunkte`);
    if (n === 3 && z.schild < 200) out.push(`Übung 3: Schild ${z.schild} Bildpunkte`);
    if (n === 3 && z.linie < 200) out.push(`Übung 3: Mühlenlinie ${z.linie} Bildpunkte`);
    await p.evaluate(() => { const u = window.__brett.muehle.ui; u.handlePointClick(window.__klassen('ziel')[0]); });
    if (n === 2) { const zm = await foto('uebung-2-muehle'); if (zm.linie < 200) out.push(`Übung 2: Mühlenlinie ${zm.linie} Bildpunkte`); }
    await p.waitForTimeout(1700);
  }
  await foto('uebung-geschafft');
  await p.evaluate(() => document.querySelector('#muuebung .mu-los').click());
  // Partie: Setzen, Ziehen (Ringe), Wegnehmen, Ende
  await p.evaluate(() => { window.__brett.muehle.control.setMode(false); window.__brett.muehle.ui.render(); });
  await foto('partie-setzen');
  const lade = (o) => p.evaluate((o) => { const g = window.__brett.muehle; g.entity.loadFromJSON(window.__stand(o)); g.control.selected = null; g.ui.render(); }, o);
  await lade({ W: [0, 1, 7, 21], B: [2, 6, 3, 9], p: 'W' });
  const zz = await foto('partie-ziehen');
  if (zz.ring < 200) out.push(`Ziehen: Ringe ${zz.ring} Bildpunkte`);
  await lade({ W: [0, 1, 7, 21], B: [2, 6, 3], p: 'W' });
  await foto('partie-springen');
  await lade({ W: [0, 1, 2, 9], B: [16, 17, 18, 5, 23], p: 'W', pend: true, linie: [0, 1, 2] });
  const zw = await foto('partie-wegnehmen');
  if (zw.schild < 200) out.push(`Wegnehmen: Schild ${zw.schild} Bildpunkte`);
  if (zw.linie < 200) out.push(`Wegnehmen: Mühlenlinie ${zw.linie} Bildpunkte`);
  // PS-21: dasselbe Bild zweimal gleich
  const nochmal = await p.screenshot();
  if (Buffer.compare(nochmal, bilder['partie-wegnehmen']) !== 0) out.push('Bild nicht wiederholbar');
  await p.evaluate(() => { const g = window.__brett.muehle; const r = g.control.handlePointClick(5); g.ui.afterMove(r.result); });
  await foto('partie-ende');
  await p.evaluate(() => document.querySelector('#muehle-view .mu-hilfe-knopf').click());
  await foto('hilfe-karten');
  out.push(...p.fehler);
  await zu(p);
  pruefe(out.length === 0, out.join('; '));
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
    catch (e) { rot++; console.log(`FEHLER ${t.name}: ${String(e.message).slice(0, 400)}`); }
  }
  await browser.close(); server.kill();
  console.log(rot ? `\n${rot} Test(s) rot.` : '\nAlle Tests grün.');
  process.exit(rot ? 1 : 0);
})();
