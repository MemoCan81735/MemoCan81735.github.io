// Tests für S-W07 (Schach lernen beim Spielen: Tipp mit Satz, Warnung vor Patzern, Schalter Lernhilfe).
// Aufruf: node werkstatt/tests/lernen_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;

let browser;
// einst: Inhalt von brettspiele.einstellungen (Objekt) oder ein roher Text; null = nichts gespeichert
async function seite({ ansicht = '2d', einst, breite = 412 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: 915 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  const roh = einst === undefined ? JSON.stringify({ formatversion: 1, ton: false, stufen: {}, ansicht: { chess: ansicht } })
    : (typeof einst === 'string' ? einst : (einst === null ? null : JSON.stringify(einst)));
  await p.addInitScript((r) => { if (!sessionStorage.getItem('geladen')) { sessionStorage.setItem('geladen', '1'); localStorage.clear(); if (r !== null) localStorage.setItem('brettspiele.einstellungen', r); } }, roh);
  await p.goto(URL_);
  await oeffne(p, ansicht);
  return p;
}
async function oeffne(p, ansicht) {
  await p.waitForFunction(() => window.__brett && window.__brett.chess, null, { timeout: 20000 });
  await p.evaluate(t => document.querySelector(`.tabBtn[data-tab=${t}]`).click(), 'chess');   // S-W25: Kachel der Auswahl, auch wenn das Spiel schon offen ist
  if (ansicht === '3d') await p.waitForFunction(() => window.__brett.chess.ui.ansicht3d && window.__brett.chess.ui.ansicht3d.aktiv, null, { timeout: 20000 });
  await p.waitForTimeout(200);
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const idx = (sq) => (8 - Number(sq[1])) * 8 + 'abcdefgh'.indexOf(sq[0]);

// Stellung laden (zu zweit oder gegen Computer) und Zug per Klick wie ein Mensch
const STELLUNG = async (p, fen, vsAI = false) => p.evaluate(([fen, vsAI]) => {
  const g = window.__brett.chess;
  g.control.setMode(vsAI);
  g.control.boundary.restoreEntity({ fen });
  g.ui.render();
}, [fen, vsAI]);
const ZUG = async (p, von, nach) => p.evaluate(([a, b]) => { const g = window.__brett.chess; g.ui.handleSquareClick(a); g.ui.handleSquareClick(b); }, [idx(von), idx(nach)]);
const ZUSTAND = async (p) => p.evaluate(() => {
  const g = window.__brett.chess, w = document.getElementById('chwarnung'), s = document.getElementById('chlernsatz');
  return { fen: g.control.boundary.getFEN(), warnung: g.control.getWarnung(), warnSichtbar: !!w && !w.hidden && w.offsetHeight > 0,
    warnText: w ? w.textContent : '', satz: s && !s.hidden ? s.textContent.trim() : '' };
});

const GRUENDE = [
  ['PS-3', 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', 'h5', 'f7', 'matt'],
  ['PS-4', '4k3/8/8/n7/8/8/8/R3K3 w - - 0 1', 'a1', 'a5', 'schlaegt'],
  ['PS-5', '4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1', 'e4', 'c3', 'rettet'],
  ['PS-6', '4k3/8/8/8/8/8/8/4K2R w K - 0 1', 'e1', 'g1', 'rochade'],
  ['PS-7a', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'g1', 'f3', 'entwickelt'],
  ['PS-7b', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2', 'e4', 'mitte'],
  ['PS-8', 'r5k1/8/8/8/8/8/5PPP/6K1 w - - 0 1', 'h2', 'h3', 'verhindertMatt'],
  ['PS-9', '4k3/8/8/1r6/8/8/8/3BK3 w - - 0 1', 'd1', 'a4', 'greiftAn,entwickelt'],
  ['PS-10', '4k3/8/8/8/8/8/8/4K3 w - - 0 1', 'e1', 'f1', 'stellung'],
  ['Schach', '4k3/8/8/8/8/8/8/R3K3 w - - 0 1', 'a1', 'a8', 'schach'],
  ['PS-9b', '4k3/P7/8/8/8/8/8/4K3 w - - 0 1', 'a7', 'a8', 'umwandlung,schach'],
  ['PS-9c', '6k1/5ppp/8/8/8/8/7R/6K1 w - - 0 1', 'h2', 'a2', 'drohtMatt'],
];

test('l_gruende', async () => {
  const p = await seite();
  const r = await p.evaluate((G) => G.map(([n, fen, a, b]) => [n, window.__brett.chess.control.boundary.zugGruende(fen, a, b).map(g => g.art)]), GRUENDE);
  // Satz nennt höchstens zwei Gründe, in der Reihenfolge des Vorrangs
  const satz = await p.evaluate(() => ChessUI.tippSatz('n', { from: 'e3', to: 'd5' }, [{ art: 'schlaegt', figur: 'q', punkte: 9 }, { art: 'schach' }, { art: 'mitte' }]));
  const f = p.fehler; await zu(p);
  pruefe(satz === 'Springer e3 nach d5: Schlägt die Dame (9 Punkte). Gibt Schach.', `Satz mit drei Gründen: "${satz}"`);
  // erwartete Liste: vollständig (alle Gründe in Reihenfolge)
  const falsch = r.filter(([n, arten], i) => arten.join(',') !== GRUENDE[i][4]).map(([n, arten]) => `${n}: ${arten.join(',')}`);
  console.log(`       ${r.map(([n, a]) => `${n}=${a[0]}`).join(' ')}`);
  pruefe(!falsch.length, `Gründe falsch: ${falsch.join(' | ')} (erwartet ${GRUENDE.map(g => g[4]).join(',')})`);
  pruefe(f.length === 0, f.join(' | '));
});

test('l_tipp_satz', async () => {
  const p = await seite();
  await p.evaluate(() => { const g = window.__brett.chess; g.control.setMode(false); g.ui.handleReset(); });
  const t0 = Date.now();
  await p.click('#chess-view .tipp-knopf');
  await p.waitForFunction(() => { const s = document.getElementById('chlernsatz'); return s && !s.hidden && s.textContent.trim().length > 0; }, null, { timeout: 2000 });
  const dauer = Date.now() - t0;
  const satz = (await ZUSTAND(p)).satz;
  console.log(`       Satz nach ${dauer} ms: "${satz}"`);
  pruefe(/(Bauer|Springer|Läufer|Turm|Dame|König) [a-h][1-8] nach [a-h][1-8]: .{8,}/.test(satz), `Satz unvollständig: "${satz}"`);
  // PS-2: ein Zug, dann ist der Satz weg
  await ZUG(p, 'e2', 'e4');
  const nach = await ZUSTAND(p);
  const f = p.fehler; await zu(p);
  pruefe(nach.satz === '', `Satz bleibt nach dem Zug stehen: "${nach.satz}"`);
  pruefe(f.length === 0, f.join(' | '));
});

const PATZER = [
  ['PS-11', '4k3/8/8/3p4/8/8/Q7/4K3 w - - 0 1', 'a2', 'c4', { art: 'haengt', figur: 'q', feld: 'c4', punkte: 9 }],
  ['PS-12', 'rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2', 'g2', 'g4', { art: 'matt', von: 'd8', nach: 'h4' }],
  ['PS-13', '4k3/8/2p5/3n4/8/4N3/8/4K3 w - - 0 1', 'e3', 'd5', null],
  ['PS-13b', '4k3/8/8/2r5/8/8/1P6/1N2K3 w - - 0 1', 'b1', 'c3', null],
  ['PS-14', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'e2', 'e4', null],
  ['PS-15', '4k3/8/8/3r4/8/8/3P4/4K3 w - - 0 1', 'e1', 'f1', null],
  ['PS-16', 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4', 'h5', 'f7', null],
  ['Schwarz', 'rnbqkbnr/pppp1ppp/8/4p3/3P4/8/PPP1PPPP/RNBQKBNR b KQkq - 0 2', 'd8', 'h4', null],
  ['Schwarz hängt', '4k3/8/8/8/3P4/8/8/4K3 b - - 0 1', 'e8', 'e7', null],
  ['Schwarz Dame', '4kq2/8/8/8/3P4/8/8/4K3 b - - 0 1', 'f8', 'c5', { art: 'haengt', figur: 'q', feld: 'c5', punkte: 9 }],
];

test('l_patzer', async () => {
  const p = await seite();
  const r = [];
  for (const [n, fen, a, b] of PATZER) {
    await STELLUNG(p, fen, false);
    await ZUG(p, a, b);
    const z = await ZUSTAND(p);
    pruefe(z.fen !== fen, `${n}: Zug ${a}-${b} wurde nicht ausgeführt`);
    r.push([n, z.warnung, z.warnSichtbar, z.warnText]);
    await p.evaluate(() => { const g = window.__brett.chess; if (g.control.getWarnung()) g.control.warnungWeiter(); });
  }
  const f = p.fehler; await zu(p);
  const falsch = [];
  r.forEach(([n, w, sichtbar, text], i) => {
    const soll = PATZER[i][4];
    if (!soll) { if (w || sichtbar) falsch.push(`${n}: Fehlalarm ${JSON.stringify(w)}`); return; }
    if (!w || !sichtbar) { falsch.push(`${n}: keine Warnung`); return; }
    for (const k of Object.keys(soll)) {
      const ist = k === 'von' ? w.zug && w.zug.from : k === 'nach' ? w.zug && w.zug.to : w[k];
      if (ist !== soll[k]) falsch.push(`${n}: ${k}=${ist} statt ${soll[k]}`);
    }
    if (!/Vorsicht/.test(text)) falsch.push(`${n}: Text "${text}"`);
  });
  console.log(`       ${r.map(([n, w]) => `${n}=${w ? w.art : '-'}`).join(' ')}`);
  pruefe(!falsch.length, falsch.join(' | '));
  pruefe(f.length === 0, f.join(' | '));
});

test('l_warnung_ablauf', async () => {
  const p = await seite();
  const fen = '4k3/8/8/3p4/8/8/Q7/4K3 w - - 0 1';
  // PS-17: gegen Computer, Patzer, 2 s warten: Computer zieht nicht, Brett und Tipp gesperrt
  await STELLUNG(p, fen, true);
  await ZUG(p, 'a2', 'c4');
  const nachZug = await ZUSTAND(p);
  pruefe(nachZug.warnung && nachZug.warnSichtbar, 'keine Warnung gegen Computer');
  await p.waitForTimeout(2000);
  const gewartet = await ZUSTAND(p);
  pruefe(gewartet.fen === nachZug.fen, `Computer zog trotz Warnung: ${gewartet.fen}`);
  const tippAus = await p.evaluate(() => document.querySelector('#chess-view .tipp-knopf').disabled);
  pruefe(tippAus, 'Tipp nicht gesperrt während der Warnung');
  pruefe(await p.evaluate(async () => (await window.__brett.chess.control.computeHint()) === null), 'Tipp in der Control nicht gesperrt während der Warnung');
  await ZUG(p, 'e8', 'e7');   // schwarze Figur ziehen wollen
  await ZUG(p, 'c4', 'c5');   // weiße Figur ziehen wollen
  pruefe((await ZUSTAND(p)).fen === nachZug.fen, 'Brett nicht gesperrt während der Warnung');
  // PS-18: Zurücknehmen
  await p.click('#chwarnung .warn-zurueck');
  const zurueck = await ZUSTAND(p);
  pruefe(zurueck.fen === fen, `Zurücknehmen: ${zurueck.fen} statt ${fen}`);
  pruefe(!zurueck.warnung && !zurueck.warnSichtbar, 'Warnung bleibt nach Zurücknehmen');
  // PS-18b: mit Vorgeschichte (zu zweit) wird genau ein Halbzug zurückgenommen
  await STELLUNG(p, fen, false);
  await ZUG(p, 'e1', 'd1'); await ZUG(p, 'e8', 'd8');
  const vorDemPatzer = (await ZUSTAND(p)).fen;
  await ZUG(p, 'a2', 'c4');
  pruefe((await ZUSTAND(p)).warnSichtbar, 'Warnung mit Vorgeschichte fehlt');
  await p.click('#chwarnung .warn-zurueck');
  const zurueck2 = (await ZUSTAND(p)).fen;
  pruefe(zurueck2 === vorDemPatzer, `Zurücknehmen mit Vorgeschichte: ${zurueck2} statt ${vorDemPatzer}`);
  await STELLUNG(p, fen, true);
  // PS-19: Trotzdem weiter → Computer zieht innerhalb von 3 s
  await ZUG(p, 'a2', 'c4');
  pruefe((await ZUSTAND(p)).warnSichtbar, 'zweite Warnung fehlt');
  const t0 = Date.now();
  await p.click('#chwarnung .warn-weiter');
  await p.waitForFunction(() => window.__brett.chess.control.getCurrentPlayer() === 'w', null, { timeout: 3000 });
  console.log(`       Computer zog ${Date.now() - t0} ms nach "Trotzdem weiter"`);
  // PS-20: zu zweit wird Schwarz gewarnt, während der Warnung ist nichts wählbar
  await STELLUNG(p, '4kq2/8/8/8/3P4/8/8/4K3 b - - 0 1', false);
  await ZUG(p, 'f8', 'c5');
  const zz = await ZUSTAND(p);
  pruefe(zz.warnung && zz.warnung.art === 'haengt', 'zu zweit keine Warnung für Schwarz');
  await ZUG(p, 'd4', 'c5');
  await ZUG(p, 'e8', 'd8');
  pruefe((await ZUSTAND(p)).fen === zz.fen, 'zu zweit Brett nicht gesperrt');
  // PS-26: Neu starten und Moduswechsel beenden die Warnung
  await p.click('#chresetBtn');
  pruefe(!(await ZUSTAND(p)).warnung && !(await ZUSTAND(p)).warnSichtbar, 'Warnung bleibt nach Neustart');
  await STELLUNG(p, fen, false); await ZUG(p, 'a2', 'c4');
  await p.click('#chmode label:nth-child(2)');
  pruefe(!(await ZUSTAND(p)).warnSichtbar, 'Warnung bleibt nach Moduswechsel');
  // PS-27: Knopf "Zug zurück" bei offener Warnung nimmt genau den Patzer zurück
  await STELLUNG(p, fen, true); await ZUG(p, 'a2', 'c4');
  await p.click('#chundoBtn');
  const zr = await ZUSTAND(p);
  pruefe(zr.fen === fen && !zr.warnung && !zr.warnSichtbar, `Zug zurück bei Warnung: ${zr.fen}`);
  // PS-28: Lernhilfe bei offener Warnung ausschalten → Warnung weg, Computer zieht
  await ZUG(p, 'a2', 'c4');
  pruefe((await ZUSTAND(p)).warnSichtbar, 'Warnung vor dem Ausschalten fehlt');
  await p.click('#chess-view .lernen-knopf');
  pruefe(!(await ZUSTAND(p)).warnSichtbar, 'Warnung bleibt nach Ausschalten');
  await p.waitForFunction(() => window.__brett.chess.control.getCurrentPlayer() === 'w', null, { timeout: 3000 });
  await p.click('#chess-view .lernen-knopf');
  const f = p.fehler; await zu(p);
  pruefe(f.length === 0, f.join(' | '));
});

test('l_schalter', async () => {
  // PS-22: ohne Feld und mit kaputtem Wert → an
  for (const einst of [{ formatversion: 1, ton: false, stufen: {}, ansicht: { chess: '2d' } }, { formatversion: 1, ton: false, stufen: {}, ansicht: { chess: '2d' }, lernen: 'kaputt' }, { formatversion: 1, ton: false, stufen: {}, ansicht: { chess: '2d' }, lernen: { chess: 'kaputt' } }, '{kaputt', null]) {
    const p = await seite({ einst });
    const an = await p.evaluate(() => window.__brett.chess.control.istLernen());
    const text = await p.evaluate(() => document.querySelector('#chess-view .lernen-knopf').textContent);
    await zu(p);
    pruefe(an === true && /an/.test(text), `Standard nicht an bei ${JSON.stringify(einst)}: ${an} "${text}"`);
  }
  // PS-21: ausschalten, neu laden → aus; Patzer ohne Warnung, Tipp ohne Satz
  const p = await seite();
  await p.click('#chess-view .lernen-knopf');
  await p.reload();
  await oeffne(p, '2d');
  const r = await p.evaluate(() => ({ an: window.__brett.chess.control.istLernen(), text: document.querySelector('#chess-view .lernen-knopf').textContent, roh: localStorage.getItem('brettspiele.einstellungen') }));
  pruefe(r.an === false && /aus/.test(r.text), `nach Neuladen: ${JSON.stringify(r)}`);
  pruefe(JSON.parse(r.roh).formatversion === 1, `Formatversion fehlt: ${r.roh}`);
  await STELLUNG(p, '4k3/8/8/3p4/8/8/Q7/4K3 w - - 0 1', false);
  await ZUG(p, 'a2', 'c4');
  const z = await ZUSTAND(p);
  pruefe(z.fen !== '4k3/8/8/3p4/8/8/Q7/4K3 w - - 0 1', 'Zug a2-c4 nicht ausgeführt');
  pruefe(!z.warnung && !z.warnSichtbar, 'Warnung trotz ausgeschalteter Lernhilfe');
  await p.click('#chess-view .tipp-knopf');
  await p.waitForTimeout(1500);
  pruefe((await ZUSTAND(p)).satz === '', 'Tipp-Satz trotz ausgeschalteter Lernhilfe');
  // wieder an
  await p.click('#chess-view .lernen-knopf');
  pruefe(await p.evaluate(() => window.__brett.chess.control.istLernen()), 'Einschalten wirkt nicht');
  const f = p.fehler; await zu(p);
  pruefe(f.length === 0, f.join(' | '));
});

test('l_last', async () => {
  const p = await seite();
  const r = await p.evaluate(() => {
    const b = window.__brett.chess.control.boundary;
    // feste Zufallsfolge (nur im Test), 200 Stellungen aus Zufallspartien
    let s = 12345; const zz = () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    const proben = [];
    while (proben.length < 200) {
      const c = new Chess();
      for (let i = 0; i < 60 && !c.game_over() && proben.length < 200; i++) {
        const ms = c.moves({ verbose: true });
        const m = ms[Math.floor(zz() * ms.length)];
        if (i % 3 === 0) proben.push([c.fen(), m.from, m.to, m.promotion]);
        c.move(m);
      }
    }
    const lauf = () => proben.map(([fen, a, z, pr]) => JSON.stringify([b.zugGruende(fen, a, z, pr), b.patzer(fen, a, z, pr)]));
    let fehler = 0, eins;
    const t0 = performance.now();
    try { eins = lauf(); } catch (e) { fehler = String(e); }
    const ms = (performance.now() - t0) / proben.length;
    const zwei = lauf();
    return { ms, fehler, gleich: JSON.stringify(eins) === JSON.stringify(zwei), warnungen: eins ? eins.filter(x => !x.endsWith(',null]')).length : 0 };
  });
  const f = p.fehler; await zu(p);
  console.log(`       ${r.ms.toFixed(1)} ms je Zug im Mittel, ${r.warnungen} von 200 Zügen gewarnt`);
  pruefe(!r.fehler, `Ausnahme: ${r.fehler}`);
  pruefe(r.ms <= 50, `zu langsam: ${r.ms.toFixed(1)} ms`);
  pruefe(r.gleich, 'zweiter Lauf anders');
  pruefe(f.length === 0, f.join(' | '));
});

test('l_handy', async () => {
  for (const ansicht of ['2d', '3d']) {
    const p = await seite({ ansicht });
    await STELLUNG(p, '4k3/8/8/3p4/8/8/Q7/4K3 w - - 0 1', true);
    await ZUG(p, 'a2', 'c4');
    const r = await p.evaluate(() => {
      const w = document.getElementById('chwarnung');
      const kn = [...w.querySelectorAll('button')].map(b => b.getBoundingClientRect().height);
      return { quer: document.documentElement.scrollWidth - window.innerWidth, sichtbar: !w.hidden && w.offsetHeight > 0, knoepfe: kn };
    });
    pruefe(r.sichtbar, `${ansicht}: Warnung nicht sichtbar`);
    pruefe(r.quer <= 0, `${ansicht}: Querscroll ${r.quer} px`);
    pruefe(r.knoepfe.length === 2 && Math.min(...r.knoepfe) >= 44, `${ansicht}: Knöpfe ${JSON.stringify(r.knoepfe)}`);
    await p.click('#chwarnung .warn-zurueck');
    await p.evaluate(() => window.__brett.chess.control.setMode(false));
    await p.click('#chess-view .tipp-knopf');
    await p.waitForFunction(() => { const s = document.getElementById('chlernsatz'); return s && !s.hidden && s.offsetHeight > 0 && s.textContent.trim().length > 0; }, null, { timeout: 3000 });
    const satz = await p.evaluate(() => { const s = document.getElementById('chlernsatz'), b = s.getBoundingClientRect(); return { quer: document.documentElement.scrollWidth - window.innerWidth, links: b.left, rechts: b.right }; });
    pruefe(satz.quer <= 0 && satz.links >= 0 && satz.rechts <= 412, `${ansicht}: Satz ragt heraus ${JSON.stringify(satz)}`);
    if (ansicht === '2d') console.log(`       Knöpfe ${r.knoepfe.map(h => h.toFixed(0)).join('/')} px hoch`);
    const f = p.fehler; await zu(p);
    pruefe(f.length === 0, `${ansicht}: ${f.join(' | ')}`);
  }
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
