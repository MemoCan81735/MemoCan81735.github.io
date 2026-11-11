// Tests für S-W08 (Schachschule: Figuren-Schule, Matt in 1, Figur gewinnen, Computerzug erklärt).
// Aufruf: node werkstatt/tests/schule_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;

let browser;
// Freigabe des Betreibers zum Speichern des Fortschritts (S-W08): erteilt am 01.11.2026, 18:14.
const FREIGABE_SPEICHERN = true;
// schule: Inhalt von brettspiele.schule (roher Text) oder null
async function seite({ schule = null, breite = 412, tab = 'schule' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: 915 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  await p.addInitScript((s) => {
    if (sessionStorage.getItem('geladen')) return;
    sessionStorage.setItem('geladen', '1'); localStorage.clear();
    localStorage.setItem('brettspiele.einstellungen', JSON.stringify({ formatversion: 1, ton: false, stufen: {}, ansicht: { chess: '2d' } }));
    if (s !== null) localStorage.setItem('brettspiele.schule', s);
  }, schule);
  await p.goto(URL_);
  await oeffne(p, tab);
  return p;
}
async function oeffne(p, tab) {
  await p.waitForFunction(() => window.__brett && window.__brett.schule && window.__brett.chess, null, { timeout: 20000 });
  await p.evaluate(t => document.querySelector(`.tabBtn[data-tab=${t}]`).click(), tab);   // S-W25: Kachel der Auswahl, auch wenn das Spiel schon offen ist
  await p.waitForTimeout(200);
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const idx = (sq) => (8 - Number(sq[1])) * 8 + 'abcdefgh'.indexOf(sq[0]);
const KLICK = async (p, sq) => p.click(`#scboard .ch-square:nth-child(${idx(sq) + 1})`);
const ANSICHT = async (p) => p.evaluate(() => {
  const a = window.__brett.schule.control.getAnsicht();
  const m = document.getElementById('scmeldung');
  return { ...a, meldung: m ? m.textContent.trim() : '' };
});

test('s_uebersicht', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const g = id => [...document.querySelectorAll(`#${id} .sc-eintrag`)].filter(e => e.offsetHeight > 0).length;
    return { reiter: !!document.querySelector('.tabBtn[data-tab=schule]'), l: g('sclektionen'), m: g('scmatt'), w: g('scgewinn') };
  });
  const f = p.fehler; await zu(p);
  pruefe(r.reiter && r.l === 6 && r.m === 12 && r.w === 7, `Übersicht ${JSON.stringify(r)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('s_zuege', async () => {
  const p = await seite();
  const F = [['r', 'd4', [], 14], ['b', 'd4', [], 13], ['q', 'd4', [], 27], ['n', 'd4', [], 8], ['k', 'd4', [], 8], ['p', 'e2', [], 2],
    ['n', 'a1', [], 2], ['k', 'a1', [], 3], ['r', 'a1', ['a3'], 9], ['p', 'e2', ['e3'], 0], ['p', 'e2', ['d3'], 3], ['p', 'e3', [], 1], ['b', 'c1', ['e3'], 4],
    ['n', 'a1', ['b3'], 2], ['q', 'd4', ['d6'], 25], ['p', 'e2', ['e4'], 1], ['p', 'e8', [], 0]];
  const r = await p.evaluate(([F, I]) => F.map(([fig, sq, st]) => {
    const i = s => (8 - Number(s[1])) * 8 + 'abcdefgh'.indexOf(s[0]);
    return SchuleEntity.ziele(fig, i(sq), new Set(st.map(i))).length;
  }), [F]);
  const f = p.fehler; await zu(p);
  const falsch = F.filter((x, k) => r[k] !== x[3]).map((x, k) => `${x[0]} ${x[1]} Sterne ${x[2]}: ${r[F.indexOf(x)]} statt ${x[3]}`);
  pruefe(!falsch.length, falsch.join(' | '));
  pruefe(f.length === 0, f.join(' | '));
});

test('s_lektion', async () => {
  const p = await seite();
  const ids = await p.evaluate(() => window.__brett.schule.control.uebersicht().lektionen.map(l => l.id));
  const ergebnis = [];
  for (const id of ids) {
    await p.click(`.sc-eintrag[data-id=${id}]`);
    const a = await ANSICHT(p);
    pruefe(a.art === 'lektion' && a.brett.filter(x => x === '*').length >= 2, `${id}: Lektion ohne Sterne ${JSON.stringify(a.brett)}`);
    const weg = await p.evaluate(() => { const a = window.__brett.schule.control.getAnsicht(); return SchuleEntity.bestweg(a.figur, a.feld, new Set(a.brett.map((x, i) => x === '*' ? i : -1).filter(i => i >= 0))); });
    pruefe(weg && weg.length === a.bestwert, `${id}: Bestwert ${a.bestwert}, Weg ${weg && weg.length}`);
    // eigene Suche im Test: alle Zugfolgen der Länge 1, 2, ... bis alle Sterne gesammelt sind
    const minimal = await p.evaluate(() => {
      const a = window.__brett.schule.control.getAnsicht(), sterne = a.brett.map((x, i) => x === '*' ? i : -1).filter(i => i >= 0);
      let stand = [{ f: a.feld, rest: sterne }];
      for (let n = 1; n <= 8; n++) {
        const neu = [];
        for (const s of stand) for (const z of SchuleEntity.ziele(a.figur, s.f, new Set(s.rest))) {
          const rest = s.rest.filter(x => x !== z);
          if (!rest.length) return n;
          neu.push({ f: z, rest });
        }
        stand = neu;
      }
      return -1;
    });
    pruefe(minimal === a.bestwert, `${id}: eigene Suche ${minimal}, Bestwert ${a.bestwert}`);
    // Tipp in der Lektion: markiert ein Ziel, von dem aus der Rest in Bestwert-1 Zügen geht
    await p.click('#schule-view .sc-tipp');
    const tipp = await p.evaluate(() => { const c = window.__brett.schule.control, a = c.getAnsicht(), z = a.markiert[0];
      const sterne = new Set(a.brett.map((x, i) => x === '*' ? i : -1).filter(i => i >= 0)), ok = SchuleEntity.ziele(a.figur, a.feld, sterne).includes(z);
      sterne.delete(z); const rest = sterne.size ? SchuleEntity.bestweg(a.figur, z, sterne).length : 0; return { ok, rest, anzahl: a.markiert.length }; });
    pruefe(tipp.anzahl === 1 && tipp.ok && tipp.rest === a.bestwert - 1, `${id}: Tipp ${JSON.stringify(tipp)}`);
    // PS-6: Feld ohne Ziel antippen
    const ohne = await p.evaluate(() => { const c = window.__brett.schule.control, a = c.getAnsicht(); c.handleFeld(a.feld); const z = new Set(c.getAnsicht().ziele); for (let i = 0; i < 64; i++) if (!z.has(i) && i !== a.feld) { c.handleFeld(i); return i; } return -1; });
    pruefe((await ANSICHT(p)).zuege === 0, `${id}: Fehltipp auf ${ohne} zählt als Zug`);
    let von = a.feld;
    for (const ziel of weg) {
      await p.click(`#scboard .ch-square:nth-child(${von + 1})`);
      await p.click(`#scboard .ch-square:nth-child(${ziel + 1})`);
      von = ziel;
    }
    const e = await ANSICHT(p);
    ergebnis.push(`${id}=${e.zuege}`);
    pruefe(e.fertig && e.zuege === a.bestwert && /Geschafft in \d+ Z/.test(e.meldung) && !/Bestwert/.test(e.meldung), `${id}: ${JSON.stringify({ fertig: e.fertig, zuege: e.zuege, meldung: e.meldung })}`);
    // PS-7: Nochmal
    await p.click('#schule-view .sc-nochmal');
    const n = await ANSICHT(p);
    pruefe(n.zuege === 0 && !n.fertig && n.feld === a.feld && JSON.stringify(n.brett) === JSON.stringify(a.brett), `${id}: Nochmal stellt nicht zurück`);
    await p.click('#schule-view .sc-zurueck');
    pruefe(await p.evaluate(id => document.querySelector(`.sc-eintrag[data-id=${id}]`).classList.contains('geloest'), id), `${id}: kein Haken nach dem Lösen`);
  }
  // Umweg: Turm-Lektion in 5 statt 3 Zügen → Meldung nennt den Bestwert
  await p.click('.sc-eintrag[data-id=L1]');
  for (const [a, b] of [['a1', 'a3'], ['a3', 'a6'], ['a6', 'f6'], ['f6', 'f4'], ['f4', 'f2']]) { await p.click(`#scboard .ch-square:nth-child(${idx(a) + 1})`); await p.click(`#scboard .ch-square:nth-child(${idx(b) + 1})`); }
  const umweg = await ANSICHT(p);
  pruefe(umweg.fertig && /Geschafft in 5 Zügen\. Bestwert: 3/.test(umweg.meldung), `Umweg: ${umweg.meldung}`);
  console.log(`       Bestwerte ${ergebnis.join(' ')}`);
  const f = p.fehler; await zu(p);
  pruefe(f.length === 0, f.join(' | '));
});

test('s_matt', async () => {
  const p = await seite();
  const aufg = await p.evaluate(() => window.__brett.schule.control.uebersicht().matt.map(m => m.id));
  pruefe(aufg.length === 12, `${aufg.length} Matt-Aufgaben`);
  let geprueft = 0;
  for (const id of aufg) {
    const r = await p.evaluate((id) => {
      const c = window.__brett.schule.control;
      c.oeffne(id);
      const fen = c.getAnsicht().fen, g = new Chess(fen);
      const alle = g.moves({ verbose: true });
      const matt = alle.filter(m => { g.move(m); const x = g.in_checkmate(); g.undo(); return x; });
      const anders = alle.find(m => !matt.includes(m));
      window.__brett.schule.ui.render();
      return { fen, matt: matt.map(m => [m.from, m.to]), anders: anders && [anders.from, anders.to], vorbei: g.game_over(), seite: g.turn() };
    }, id);
    pruefe(!r.vorbei && r.matt.length >= 1, `${id}: kein Mattzug in ${r.fen}`);
    // PS-9: erlaubter Zug ohne Matt
    if (r.anders) {
      await KLICK(p, r.anders[0]); await KLICK(p, r.anders[1]);
      const a = await ANSICHT(p);
      pruefe(!a.fertig && a.fen === r.fen && /Noch nicht/.test(a.meldung), `${id}: falscher Zug ${r.anders.join('-')} angenommen ${JSON.stringify({ fertig: a.fertig, fen: a.fen, meldung: a.meldung })}`);
    }
    // PS-10: gegnerische Figur antippen
    const gegner = await p.evaluate(() => { const a = window.__brett.schule.control.getAnsicht(); return a.brett.findIndex(x => x && x !== '*' && x[0] !== a.amZug); });
    if (gegner >= 0) { await p.click(`#scboard .ch-square:nth-child(${gegner + 1})`); pruefe((await ANSICHT(p)).ausgewaehlt === null, `${id}: gegnerische Figur wählbar`); }
    // unerlaubter Zug: eigene Figur, dann ein Feld ohne Punkt
    await p.click('#schule-view .sc-nochmal');
    const unerlaubt = await p.evaluate(() => { const c = window.__brett.schule.control, a = c.getAnsicht();
      const eigen = a.brett.findIndex(x => x && x !== '*' && x[0] === a.amZug); c.handleFeld(eigen);
      const z = new Set(c.getAnsicht().ziele); const leer = a.brett.findIndex((x, i) => !x && !z.has(i)); c.handleFeld(leer);
      const b = c.getAnsicht(); return { fen: b.fen === a.fen, status: b.status }; });
    pruefe(unerlaubt.fen && !unerlaubt.status, `${id}: unerlaubter Zug ${JSON.stringify(unerlaubt)}`);
    await p.click('#schule-view .sc-nochmal');
    // PS-8: jeder Mattzug wird angenommen
    for (const [a, b] of r.matt) {
      await p.click('#schule-view .sc-nochmal');
      await KLICK(p, a); await KLICK(p, b);
      const e = await ANSICHT(p);
      pruefe(e.fertig && /Matt/.test(e.meldung), `${id}: Mattzug ${a}-${b} nicht angenommen (${e.meldung})`);
      geprueft++;
    }
  }
  console.log(`       ${geprueft} Mattzüge in 12 Aufgaben angenommen`);
  const f = p.fehler; await zu(p);
  pruefe(f.length === 0, f.join(' | '));
});

test('s_gewinn', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const c = window.__brett.schule.control, V = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const mat = (g, f) => g.board().flat().filter(Boolean).reduce((s, x) => s + (x.color === f ? V[x.type] : -V[x.type]), 0);
    const mm = (g, d, max, f, a, b) => {
      if (g.game_over()) return g.in_checkmate() ? (g.turn() === f ? -1000 : 1000) : mat(g, f);
      if (!d) return mat(g, f);
      let best = max ? -1e9 : 1e9;
      for (const m of g.moves({ verbose: true })) { g.move(m); const s = mm(g, d - 1, !max, f, a, b); g.undo();
        if (max) { best = Math.max(best, s); a = Math.max(a, s); } else { best = Math.min(best, s); b = Math.min(b, s); } if (b <= a) break; }
      return best;
    };
    return c.uebersicht().gewinn.map(({ id }) => {
      c.oeffne(id);
      const a = c.getAnsicht(), g = new Chess(a.fen), f = g.turn(), basis = mat(g, f);
      const gut = g.moves({ verbose: true }).filter(m => { g.move(m); const s = mm(g, 3, false, f, -1e9, 1e9); g.undo(); return s - basis >= 2; }).map(m => m.from + m.to).sort();
      return { id, fen: a.fen, gut, loesung: c.loesungen(id).map(l => l.from + l.to).sort() };
    });
  });
  for (const x of r) pruefe(x.loesung.length && JSON.stringify(x.gut) === JSON.stringify(x.loesung), `${x.id}: gewinnt ${x.gut.join(',')} / Liste ${x.loesung.join(',')}`);
  // spielen: Lösung angenommen, anderer Zug abgelehnt
  for (const x of r) {
    await p.evaluate(id => window.__brett.schule.control.oeffne(id), x.id);
    await p.evaluate(() => window.__brett.schule.ui.render());
    const anders = await p.evaluate((fen) => { const g = new Chess(fen); return g.moves({ verbose: true }).map(m => [m.from, m.to]); }, x.fen);
    const falsch = anders.find(([a, b]) => !x.loesung.includes(a + b));
    if (falsch) {
      await KLICK(p, falsch[0]); await KLICK(p, falsch[1]);
      const a = await ANSICHT(p);
      pruefe(!a.fertig && a.fen === x.fen, `${x.id}: falscher Zug ${falsch.join('-')} angenommen`);
    }
    const l = x.loesung[0];
    await KLICK(p, l.slice(0, 2)); await KLICK(p, l.slice(2, 4));
    pruefe((await ANSICHT(p)).fertig, `${x.id}: Lösung ${l} nicht angenommen`);
  }
  console.log(`       ${r.map(x => `${x.id}:${x.loesung.join('/')}`).join(' ')}`);
  const f = p.fehler; await zu(p);
  pruefe(f.length === 0, f.join(' | '));
});

test('s_tipp_loesung', async () => {
  const p = await seite();
  await p.click('.sc-eintrag[data-id=M1]');
  await p.click('#schule-view .sc-tipp');
  const t = await p.evaluate(() => ({ markiert: [...document.querySelectorAll('#scboard .ch-square')].map((e, i) => e.classList.contains('tipp') ? i : -1).filter(i => i >= 0), loes: window.__brett.schule.control.loesungen('M1') }));
  const vonFelder = t.loes.map(l => idx(l.from));
  pruefe(t.markiert.length === 1 && vonFelder.includes(t.markiert[0]), `Tipp markiert ${JSON.stringify(t.markiert)}, erwartet eins von ${vonFelder}`);
  await p.click('#schule-view .sc-loesung');
  const l = await p.evaluate(() => [...document.querySelectorAll('#scboard .ch-square')].map((e, i) => e.classList.contains('tipp') ? i : -1).filter(i => i >= 0));
  pruefe(l.length === 2, `Lösung markiert ${JSON.stringify(l)}`);
  const z = t.loes[0];
  await KLICK(p, z.from); await KLICK(p, z.to);
  const a = await ANSICHT(p);
  pruefe(a.fertig, 'Zug nach Lösung nicht ausgeführt');
  await p.click('#schule-view .sc-zurueck');
  const haken = await p.evaluate(() => document.querySelector('.sc-eintrag[data-id=M1]').classList.contains('geloest'));
  pruefe(!haken, 'Aufgabe nach "Lösung" als gelöst markiert');
  // Lösung zeigen, Nochmal, dann selbst spielen: zählt weiter nicht (auch bei einer Gewinn-Aufgabe)
  for (const id of ['M2', 'G1']) {
    await p.click(`.sc-eintrag[data-id=${id}]`);
    await p.click('#schule-view .sc-loesung'); await p.click('#schule-view .sc-nochmal');
    const l = await p.evaluate(id => window.__brett.schule.control.loesungen(id)[0], id);
    await KLICK(p, l.from); await KLICK(p, l.to);
    pruefe((await ANSICHT(p)).fertig, `${id}: Zug nicht ausgeführt`);
    await p.click('#schule-view .sc-zurueck');
    pruefe(!(await p.evaluate(id => document.querySelector(`.sc-eintrag[data-id=${id}]`).classList.contains('geloest'), id)), `${id}: nach Lösung und Nochmal als gelöst markiert`);
  }
  // Tipp bei Gewinn-Aufgaben und für Schwarz
  for (const id of ['G1', 'G7', 'M11', 'M12']) {
    const r = await p.evaluate(id => { const c = window.__brett.schule.control; c.oeffne(id); const m = c.tipp(); const a = c.getAnsicht();
      return { m, von: c.loesungen(id).map(l => SchuleControl.idx(l.from)), farbe: a.brett[m[0]] && a.brett[m[0]][0], amZug: a.amZug }; }, id);
    pruefe(r.m.length === 1 && r.von.includes(r.m[0]) && r.farbe === r.amZug, `${id}: Tipp ${JSON.stringify(r)}`);
  }
  const f = p.fehler; await zu(p);
  pruefe(f.length === 0, f.join(' | '));
});

test('s_fortschritt', async () => {
  const p = await seite();
  await p.click('.sc-eintrag[data-id=M1]');
  const z = await p.evaluate(() => window.__brett.schule.control.loesungen('M1')[0]);
  await KLICK(p, z.from); await KLICK(p, z.to);
  await p.click('#schule-view .sc-zurueck');
  pruefe(await p.evaluate(() => document.querySelector('.sc-eintrag[data-id=M1]').classList.contains('geloest')), 'kein Haken nach dem Lösen');
  // Ohne Freigabe zum Speichern (SchuleBoundary.SPEICHERN = false) bleibt nichts nach dem Neuladen
  const freigabe = FREIGABE_SPEICHERN;
  await p.reload(); await oeffne(p, 'schule');
  const r = await p.evaluate(() => ({ haken: document.querySelector('.sc-eintrag[data-id=M1]').classList.contains('geloest'), roh: localStorage.getItem('brettspiele.schule') }));
  if (freigabe) pruefe(r.haken && JSON.parse(r.roh).formatversion === 1, `mit Freigabe: Haken nach Neuladen weg: ${r.roh}`);
  else pruefe(!r.haken && r.roh === null, `ohne Freigabe gespeichert: ${r.roh}`);
  // Speicherweg selbst (wie nach der Freigabe): speichern, neu laden, kaputte Daten
  const s = await p.evaluate(() => {
    const vorher = SchuleBoundary.SPEICHERN; SchuleBoundary.SPEICHERN = true;
    try {
      localStorage.removeItem('brettspiele.schule');
      const c = new SchuleControl(new SchuleBoundary(localStorage, Chess));
      c.oeffne('M1'); const l = c.loesungen('M1')[0];
      c.handleFeld(SchuleControl.idx(l.from)); c.handleFeld(SchuleControl.idx(l.to));
      const roh = localStorage.getItem('brettspiele.schule');
      const wieder = new SchuleControl(new SchuleBoundary(localStorage, Chess)).uebersicht().matt[0].geloest;
      const kaputt = ['{kaputt', JSON.stringify({ formatversion: 1, geloest: ['X9', 5] }), JSON.stringify({ formatversion: 2, geloest: ['M1'] }), JSON.stringify({ formatversion: 1, geloest: 'M1' })].map(k => {
        localStorage.setItem('brettspiele.schule', k);
        const u = new SchuleControl(new SchuleBoundary(localStorage, Chess)).uebersicht();
        return [...u.lektionen, ...u.matt, ...u.gewinn].filter(x => x.geloest).length;
      });
      return { roh, wieder, kaputt };
    } finally { SchuleBoundary.SPEICHERN = vorher; localStorage.removeItem('brettspiele.schule'); }
  });
  const f = p.fehler; await zu(p);
  pruefe(JSON.parse(s.roh).formatversion === 1 && s.wieder, `Speicherweg: ${JSON.stringify(s)}`);
  pruefe(s.kaputt.every(n => n === 0), `kaputte Daten ergeben Haken: ${s.kaputt}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('s_computer_satz', async () => {
  const p = await seite({ tab: 'chess' });
  await p.evaluate(() => { const g = window.__brett.chess; g.ui.aiDelayMs = 50; g.ui.handleModeChange(true); });
  await p.evaluate(() => { const g = window.__brett.chess.ui; g.handleSquareClick(52); g.handleSquareClick(36); });
  await p.waitForFunction(() => window.__brett.chess.control.getCurrentPlayer() === 'w', null, { timeout: 10000 });
  await p.waitForTimeout(200);
  const satz = await p.evaluate(() => { const s = document.getElementById('chlernsatz'); return s.hidden ? '' : s.textContent; });
  console.log(`       "${satz}"`);
  pruefe(/^Computer: (Bauer|Springer|Läufer|Turm|Dame|König) [a-h][1-8] nach [a-h][1-8]: .{8,}/.test(satz), `Satz nach Computerzug: "${satz}"`);
  // PS-18: Lernhilfe aus
  await p.click('#chess-view .lernen-knopf');
  await p.evaluate(() => { const g = window.__brett.chess.ui; g.handleSquareClick(51); g.handleSquareClick(35); });
  await p.waitForFunction(() => window.__brett.chess.control.getCurrentPlayer() === 'w', null, { timeout: 10000 });
  await p.waitForTimeout(200);
  const aus = await p.evaluate(() => { const s = document.getElementById('chlernsatz'); return s.hidden ? '' : s.textContent; });
  // Control: Gründe nur mit Lernhilfe; nach "Zug zurück" ist der Satz weg
  const r = await p.evaluate(() => {
    const g = window.__brett.chess, c = g.control, fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    c.setMode(false);
    c.setLernen(false); c.boundary.restoreEntity({ fen }); c.performAiMove({ from: 'e7', to: 'e5' }); const ohne = c.holeKiGrund();
    c.setLernen(true); c.boundary.restoreEntity({ fen }); c.performAiMove({ from: 'e7', to: 'e5' }); const mit = c.holeKiGrund();
    return { ohne, mit: !!(mit && mit.gruende.length) };
  });
  pruefe(r.ohne === null && r.mit, `Gründe des Computerzugs: ${JSON.stringify(r)}`);
  await p.evaluate(() => { const g = window.__brett.chess; g.ui.handleReset(); g.ui.handleModeChange(true); g.ui.handleSquareClick(52); g.ui.handleSquareClick(36); });
  await p.waitForFunction(() => window.__brett.chess.control.getCurrentPlayer() === 'w', null, { timeout: 10000 });
  await p.waitForTimeout(200);
  const vorUndo = await p.evaluate(() => !document.getElementById('chlernsatz').hidden);
  await p.click('#chundoBtn');
  const nachUndo = await p.evaluate(() => !document.getElementById('chlernsatz').hidden);
  pruefe(vorUndo && !nachUndo, `Satz vor/nach Zug zurück: ${vorUndo}/${nachUndo}`);
  const f = p.fehler; await zu(p);
  pruefe(aus === '', `Satz trotz Lernhilfe aus: "${aus}"`);
  pruefe(f.length === 0, f.join(' | '));
});

test('s_handy', async () => {
  const p = await seite();
  await p.click('.sc-eintrag[data-id=L1]');
  const r = await p.evaluate(() => {
    const feld = document.querySelector('#scboard .ch-square').getBoundingClientRect();
    const reiter = [...document.querySelectorAll('.tabBtn')].map(b => b.getBoundingClientRect()), leiste = document.getElementById('tabs').getBoundingClientRect();
    return { quer: document.documentElement.scrollWidth - window.innerWidth, feld: feld.width, reiter: reiter.length, raus: reiter.filter(x => x.left < leiste.left - 0.5 || x.right > leiste.right + 0.5).length };
  });
  const f = p.fehler; await zu(p);
  console.log(`       Feld ${r.feld.toFixed(0)} px, ${r.reiter} Reiter`);
  pruefe(r.quer <= 0 && r.feld >= 44 && r.reiter >= 7 && r.raus === 0, JSON.stringify(r));
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
    catch (e) { rot++; console.log(`FEHLER ${t.name}: ${String(e.message).slice(0, 400)}`); }
  }
  await browser.close(); server.kill();
  console.log(rot ? `\n${rot} Test(s) rot.` : '\nAlle Tests grün.');
  process.exit(rot ? 1 : 0);
})();
