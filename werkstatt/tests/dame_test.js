// Tests für S-W23 (Dame, türkische Regeln: Regeln, Schlagzwang, Dame, Ende, Übung, Markierung, Stärke, Hilfe, Speicher, Bilder).
// Aufruf: node werkstatt/tests/dame_test.js [ORDNER]   (NUR=name1,name2 wählt Tests, BILDER=ordner speichert Bilder)
// Felder 0 bis 63, Feld 0 oben links, Weiß steht unten (40 bis 55) und zieht nach oben.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;
const SCHLUESSEL = 'brettspiele.einstellungen';
const HOCH = { width: 412, height: 915 }, QUER = { width: 915, height: 412 };

let browser;
// opts.gesehen: Übung schon gesehen; opts.dreid: räumliches Brett (sonst flaches); opts.bewegung: Animationen und Konfetti erlaubt;
// opts.einstRoh: Text statt der vorbelegten Einstellungen; opts.vorher: eigenes Init-Skript; opts.ctx: vorhandener Kontext; opts.vp: Bildschirm
async function seite(opts = {}) {
  const ctx = opts.ctx || await browser.newContext({ viewport: opts.vp || HOCH, hasTouch: true, isMobile: true, deviceScaleFactor: 1, reducedMotion: opts.bewegung ? 'no-preference' : 'reduce' });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  const wert = opts.einstRoh !== undefined ? opts.einstRoh
    : JSON.stringify({ formatversion: 1, ton: false, stufen: {}, ansicht: opts.dreid ? {} : { dame: '2d' }, lernen: {}, muehleEinfuehrung: true, ...(opts.gesehen ? { dameEinfuehrung: true } : {}) });
  await p.addInitScript(([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch (e) { } }, [SCHLUESSEL, wert]);
  if (opts.vorher) await p.addInitScript(opts.vorher);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.dame, null, { timeout: 8000 });
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=dame]').click());
  await p.waitForTimeout(250);
  if (opts.dreid) await p.waitForFunction(() => { const u = window.__brett.dame.ui; return u.ansicht3d && u.ansicht3d.aktiv; }, null, { timeout: 15000 });
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// Hilfsfunktionen im Browser. Stellung: W, B (Steine), WD, BD (Damen) als Feldlisten, p = Spieler am Zug.
const HILFE = () => {
  window.__stand = (o) => {
    const cells = Array(64).fill(null);
    for (const k of ['W', 'B', 'WD', 'BD']) (o[k] || []).forEach(i => cells[i] = k);
    return { formatversion: 1, cells, currentPlayer: o.p || 'W', finished: false, winner: null, ruhe: o.ruhe || 0, stellungen: o.stellungen || {} };
  };
  window.__klassen = (k) => [...document.querySelectorAll('#daboard .da-feld')].map((e, i) => e.classList.contains(k) ? i : -1).filter(i => i >= 0);
  window.__lade = (o) => { const g = window.__brett.dame; g.entity.loadFromJSON(window.__stand(o)); g.control._auswahlWeg(); g.control._verlauf = []; g.ui._letzter = null; g.ui.render(); };
  window.__key = z => `${z.von}>${z.pfad.join('>')}`;
  window.__liste = (o, s) => DameEntity.dameZuege(window.__stand(o).cells, s).map(window.__key).sort().join(' ');
  window.__tippe = (c, ...felder) => { let r = null; for (const f of felder) r = c.handleFeldClick(f); return r; };
  window.__snap = () => JSON.stringify(window.__brett.dame.boundary.getEntitySnapshot());
};

// ---------- AK-1, AK-2: Aufstellung und Zugregeln (PS-1, PS-2, PS-3, PS-28) ----------
test('da_regeln', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], g = window.__brett.dame, c = g.control, e = g.entity, ui = g.ui;
    const L = window.__liste, S = window.__stand;
    c.setMode(false); c.restartGame(); ui.render();
    // PS-1 / AK-1: Aufstellung und erste Züge
    const b = c.getBoardState();
    const felder = (w) => b.map((v, i) => v === w ? i : -1).filter(i => i >= 0);
    if (felder('W').join() !== [...Array(16).keys()].map(i => 40 + i).join()) out.push(`Weiß steht auf ${felder('W')}`);
    if (felder('B').join() !== [...Array(16).keys()].map(i => 8 + i).join()) out.push(`Schwarz steht auf ${felder('B')}`);
    if (b.filter(Boolean).length !== 32 || b.length !== 64) out.push('nicht 64 Felder mit 32 Steinen');
    if (c.getCurrentPlayer() !== 'W') out.push('Weiß beginnt nicht');
    const erstW = KOMBI_(DameEntity.dameZuege(b, 'W').map(window.__key));
    if (erstW !== KOMBI_([...Array(8).keys()].map(i => `${40 + i}>${32 + i}`))) out.push(`erste Züge Weiß: ${erstW}`);
    ui.handleSquareClick(43);
    if (window.__klassen('ziel').join() !== '35') out.push(`Ziele nach Antippen von 43: ${window.__klassen('ziel')}`);
    ui.handleSquareClick(35);
    if (c.getBoardState()[35] !== 'W' || c.getBoardState()[43] !== null || c.getCurrentPlayer() !== 'B') out.push('Zug 43 nach 35 nicht ausgeführt');
    const erstB = KOMBI_(DameEntity.dameZuege(c.getBoardState(), 'B').map(window.__key));
    if (erstB !== KOMBI_([...Array(8).keys()].map(i => `${16 + i}>${24 + i}`))) out.push(`erste Züge Schwarz: ${erstB}`);
    function KOMBI_(l) { return l.slice().sort().join(' '); }
    // PS-2: Rand und letzte Reihe, keine Züge ins Leere
    if (L({ W: [32] }, 'W') !== KOMBI_(['32>24', '32>33'])) out.push(`Rand links: ${L({ W: [32] }, 'W')}`);
    if (L({ W: [39] }, 'W') !== KOMBI_(['39>31', '39>38'])) out.push(`Rand rechts: ${L({ W: [39] }, 'W')}`);
    if (L({ W: [3] }, 'W') !== KOMBI_(['3>2', '3>4'])) out.push(`Stein auf der letzten Reihe: ${L({ W: [3] }, 'W')}`);
    if (L({ B: [48] }, 'B') !== KOMBI_(['48>49', '48>56'])) out.push(`Schwarz links unten: ${L({ B: [48] }, 'B')}`);
    if (L({ B: [55] }, 'B') !== KOMBI_(['55>54', '55>63'])) out.push(`Schwarz rechts unten: ${L({ B: [55] }, 'B')}`);
    if (L({ W: [40] }, 'W') !== KOMBI_(['40>32', '40>41'])) out.push(`Rand: kein Umbruch von 40 nach 39: ${L({ W: [40] }, 'W')}`);
    if (L({ W: [47] }, 'W') !== KOMBI_(['47>39', '47>46'])) out.push(`Rand: kein Umbruch von 47 nach 48: ${L({ W: [47] }, 'W')}`);
    // Stein zieht seitwärts (erlaubt), nie rückwärts, nie schräg
    if (L({ W: [35] }, 'W') !== KOMBI_(['35>27', '35>34', '35>36'])) out.push(`Weißer Stein auf 35: ${L({ W: [35] }, 'W')}`);
    if (L({ B: [27] }, 'B') !== KOMBI_(['27>26', '27>28', '27>35'])) out.push(`Schwarzer Stein auf 27: ${L({ B: [27] }, 'B')}`);
    // PS-3: Rückwärtszug und Schrägzug werden abgelehnt (Bedienung und Entity)
    __lade({ W: [35], B: [2] });
    const vor = window.__snap();
    ui.handleSquareClick(35); ui.handleSquareClick(43);
    if (window.__snap() !== vor || c.getBoardState()[43] !== null) out.push('Rückwärtszug wurde ausgeführt');
    ui.handleSquareClick(26);
    if (window.__snap() !== vor) out.push('Schrägzug wurde ausgeführt');
    if (e.kannZiehen(35, [43]) || e.kannZiehen(35, [26]) || e.kannZiehen(35, [28]) || e.zieh(35, [43]) !== null) out.push('Entity erlaubt Rückwärts- oder Schrägzug');
    if (!e.kannZiehen(35, [34]) || !e.kannZiehen(35, [36]) || !e.kannZiehen(35, [27])) out.push('Entity verbietet erlaubten Zug (vor oder seitwärts)');
    ui.handleSquareClick(34);
    if (c.getBoardState()[34] !== 'W') out.push('Seitwärtszug 35 nach 34 nicht ausgeführt');
    // Dame: beliebig weit gerade, auch zurück, nicht schräg
    const dame = DameEntity.dameZuege(S({ WD: [35] }).cells, 'W').map(z => z.pfad[0]).sort((x, y) => x - y).join();
    const soll = [...[0, 1, 2, 3, 4, 5, 6, 7].filter(r => r !== 4).map(r => r * 8 + 3), 32, 33, 34, 36, 37, 38, 39].sort((x, y) => x - y).join();
    if (dame !== soll) out.push(`Dame auf 35: ${dame}`);
    if (DameEntity.dameZuege(S({ WD: [35], W: [43] }).cells, 'W').some(z => z.von === 35 && (z.pfad[0] === 43 || z.pfad[0] === 51 || z.pfad[0] === 59))) out.push('Dame zieht durch oder auf einen eigenen Stein');
    // PS-28: Tipp auf leeres Feld, fremden Stein, unzulässiges Feld, Doppeltipp
    c.restartGame(); ui.render();
    const s0 = window.__snap();
    for (const f of [27, 63, 0, 12, 20]) { const o = ui.control.handleFeldClick(f); if (!o.invalid) out.push(`Tipp auf Feld ${f} (leer oder fremd) wurde angenommen`); }
    if (window.__snap() !== s0 || c.getSelected() !== null) out.push('Tipp auf leeres oder fremdes Feld ändert etwas');
    ui.handleSquareClick(43);
    ui.handleSquareClick(8);                       // fremder Stein bei gewähltem Stein
    ui.handleSquareClick(9);
    ui.handleSquareClick(60);                      // unzulässiges, leeres oder besetztes Feld
    if (window.__snap() !== s0 || c.getSelected() !== 43) out.push(`Auswahl nach unzulässigen Tipps: ${c.getSelected()}`);
    ui.handleSquareClick(43);                      // Doppeltipp auf denselben Stein hebt die Auswahl auf
    if (c.getSelected() !== null || window.__snap() !== s0) out.push('Doppeltipp auf denselben Stein');
    ui.handleSquareClick(43); ui.handleSquareClick(35); ui.handleSquareClick(35);   // zweiter Tipp auf das Zielfeld: Schwarz ist dran
    if (c.getBoardState()[35] !== 'W' || c.getBoardState().filter(v => v === 'W').length !== 16 || c.getCurrentPlayer() !== 'B') out.push('Doppeltipp auf das Zielfeld');
    // Wiederholbarkeit: gleiche Eingaben, gleicher Stand
    const lauf = () => { c.restartGame(); ui.render(); ui.handleSquareClick(41); ui.handleSquareClick(33); ui.handleSquareClick(22); ui.handleSquareClick(30); return window.__snap(); };
    if (lauf() !== lauf()) out.push('gleiche Eingaben, anderer Stand');
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-3, AK-4: Schlagzwang, Mehrheitsregel, Mehrfachsprung (PS-4 bis PS-8, PS-26, PS-27, PS-30) ----------
test('da_schlag', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.dame, c = g.control, e = g.entity, ui = g.ui;
    const L = window.__liste, S = window.__stand, K = (...l) => l.slice().sort().join(' ');
    c.setMode(false); ui.render();
    // PS-4: einfacher Schlag mit Pflicht
    __lade({ W: [35, 46], B: [27, 4, 6] });
    if (L({ W: [35, 46], B: [27, 4, 6] }, 'W') !== '35>19') out.push(`PS-4 Züge: ${L({ W: [35, 46], B: [27, 4, 6] }, 'W')}`);
    if (window.__klassen('ziehbar').join() !== '35' || !ui.control.ansicht().pflicht) out.push(`PS-4: Ring ${window.__klassen('ziehbar')} Pflicht ${ui.control.ansicht().pflicht}`);
    if (!/Schlagen ist Pflicht/.test(document.getElementById('dastatus').textContent)) out.push(`PS-4: Statuszeile ${document.getElementById('dastatus').textContent}`);
    // PS-5: nicht schlagen, obwohl möglich: abgelehnt
    const s0 = window.__snap();
    ui.handleSquareClick(46);
    if (c.getSelected() !== null || window.__snap() !== s0) out.push('PS-5: Stein ohne Schlag ließ sich wählen');
    if (e.kannZiehen(46, [38]) || e.zieh(46, [38]) !== null || window.__snap() !== s0) out.push('PS-5: Entity erlaubt Zug ohne Schlag');
    ui.handleSquareClick(35);
    if (window.__klassen('ziel').join() !== '19') out.push(`PS-4: Ziel ${window.__klassen('ziel')}`);
    ui.handleSquareClick(19);
    if (c.getBoardState()[19] !== 'W' || c.getBoardState()[27] !== null || c.getBoardState()[35] !== null) out.push('PS-4: Schlag nicht ausgeführt');
    if (c.getBoardState().filter(v => v === 'B').length !== 2) out.push('PS-4: geschlagener Stein bleibt');
    // PS-6: gleiche Zahl, beide erlaubt; Folge mit 2 Steinen verdrängt den Schlag mit 1 Stein
    const gleich = { W: [35, 44], B: [27, 43, 4] };   // 35 schlägt 27 nach 19, 44 schlägt 43 seitwärts nach 42
    if (L(gleich, 'W') !== K('35>19', '44>42')) out.push(`PS-6 gleich lange Schläge: ${L(gleich, 'W')}`);
    const lang = { W: [35, 46], B: [27, 38, 22, 4] };   // 46 schlägt 38 nach 30, dann 22 nach 14
    if (L(lang, 'W') !== '46>30>14') out.push(`PS-6 Folge mit 2 Steinen: ${L(lang, 'W')}`);
    __lade(lang);
    if (window.__klassen('ziehbar').join() !== '46') out.push(`PS-6: Ringe ${window.__klassen('ziehbar')}`);
    ui.handleSquareClick(35);
    if (c.getSelected() !== null) out.push('PS-6: Stein mit kürzerem Schlag wählbar');
    // PS-7: Mehrfachsprung über 3 Steine, jeder Stein verschwindet sofort
    const sprung = { W: [42], B: [34, 27, 20, 4] };
    __lade(sprung);
    const vorSprung = window.__snap();
    ui.handleSquareClick(42);
    if (window.__klassen('ziel').join() !== '26') out.push(`PS-7: erstes Ziel ${window.__klassen('ziel')}`);
    ui.handleSquareClick(26);
    let a = c.ansicht();
    if (a.brett[34] !== null || a.brett[26] !== 'W' || a.brett[42] !== null) out.push('PS-7: nach dem ersten Sprung bleibt der Stein stehen');
    if (window.__klassen('ziel').join() !== '28' || window.__klassen('selected').join() !== '26' || window.__klassen('weg').join() !== '42') out.push(`PS-7: Zwischenbild Ziel ${window.__klassen('ziel')} Auswahl ${window.__klassen('selected')} Weg ${window.__klassen('weg')}`);
    if (window.__snap() !== vorSprung) out.push('PS-7: Entity verändert sich vor Ende des Zugs');
    if (!/Weiter schlagen/.test(document.getElementById('dastatus').textContent)) out.push(`PS-7: Statuszeile ${document.getElementById('dastatus').textContent}`);
    ui.handleSquareClick(26);                      // Doppeltipp mitten im Zug: nichts passiert
    ui.handleSquareClick(28);
    a = c.ansicht();
    if (a.brett[27] !== null || a.brett[28] !== 'W') out.push('PS-7: zweiter Sprung');
    ui.handleSquareClick(13);                      // unzulässig mitten im Pfad (leeres Feld)
    ui.handleSquareClick(50);                      // anderer eigener Stein mitten im Pfad: kein Wechsel
    if (c.getSelected() !== 42 || window.__klassen('selected').join() !== '28') out.push('PS-7: Auswahl mitten im Pfad geändert');
    if (window.__klassen('ziel').join() !== '12') out.push(`PS-7: drittes Ziel ${window.__klassen('ziel')}`);
    ui.handleSquareClick(12);
    const nach = c.getBoardState();
    if (nach[12] !== 'W' || [42, 34, 27, 20, 26, 28].some(i => nach[i]) || nach.filter(v => v === 'B').length !== 1) out.push(`PS-7: Endstand ${JSON.stringify(nach.map((v, i) => v ? i + v : null).filter(Boolean))}`);
    if (c.getCurrentPlayer() !== 'B') out.push('PS-7: nach dem Zug ist nicht Schwarz dran');
    // PS-8: Dame darf im Zug nicht um 180 Grad wenden; abbiegen ist erlaubt
    const kehr = { WD: [35], B: [37, 33] };
    const kz = DameEntity.dameZuege(S(kehr).cells, 'W');
    if (kz.some(z => z.schlaege.length !== 1) || kz.length !== 3) out.push(`PS-8: Kehrtwende, Züge ${kz.map(window.__key)}`);
    if (L({ WD: [32], B: [34, 19] }, 'W') !== K('32>35>11', '32>35>3')) out.push(`PS-8: Abbiegen ${L({ WD: [32], B: [34, 19] }, 'W')}`);
    // PS-26: zwei gleich lange Folgen, eine schlägt eine Dame: beide erlaubt; Folge nicht vorzeitig beendbar
    const dm = { W: [35, 44], B: [27, 4], BD: [43] };
    if (L(dm, 'W') !== K('35>19', '44>42')) out.push(`PS-26: Dame zählt anders als Stein: ${L(dm, 'W')}`);
    __lade(sprung);
    if (e.kannZiehen(42, [26]) || e.zieh(42, [26]) !== null || window.__snap() !== vorSprung) out.push('PS-26: Folge ließ sich vorzeitig beenden');
    // PS-27: Folge über ein eben frei gewordenes Feld; kein Stein zweimal; Sperren
    const spirale = { WD: [32], B: [33, 19, 10, 49] };
    const sz = DameEntity.dameZuege(S(spirale).cells, 'W');
    if (sz.length !== 1 || sz[0].pfad.join() !== '35,11,9,57' || sz[0].schlaege.join() !== '33,19,10,49') out.push(`PS-27: Spirale ${sz.map(z => JSON.stringify(z))}`);
    if (L({ W: [35], B: [27, 19] }, 'W').includes('>19') || L({ W: [35], B: [27, 19] }, 'W') !== K('35>34', '35>36')) out.push(`PS-27: zwei Steine hintereinander sperren nicht: ${L({ W: [35], B: [27, 19] }, 'W')}`);
    if (DameEntity.dameZuege(S({ WD: [56], B: [24, 16] }).cells, 'W').some(z => z.schlaege.length)) out.push('PS-27: Dame schlägt über zwei Steine hintereinander');
    if (DameEntity.dameZuege(S({ WD: [56], B: [24], W: [16] }).cells, 'W').some(z => z.schlaege.length)) out.push('PS-27: Dame schlägt auf einen eigenen Stein');
    if (DameEntity.dameZuege(S({ WD: [56], W: [40], B: [24] }).cells, 'W').some(z => z.schlaege.length)) out.push('PS-27: eigener Stein im Weg sperrt nicht');
    // Eigenschaften über viele zufällige Stellungen (fester Zufall): einheitliche Länge, kein Stein doppelt, Schlagzwang
    let s = 99; const zuf = () => (s = (s * 16807) % 2147483647) / 2147483647;
    let geprueft = 0, mitSchlag = 0;
    for (let partie = 0; partie < 30; partie++) {
      const x = new DameEntity();
      for (let n = 0; n < 120 && !x.finished; n++) {
        const zz = x.zuege();
        const laengen = new Set(zz.map(z => z.schlaege.length));
        if (laengen.size > 1) out.push('Züge verschieden lang (Mehrheitsregel)');
        for (const z of zz) {
          if (new Set(z.schlaege).size !== z.schlaege.length) out.push('Stein zweimal geschlagen');
          if (z.schlaege.length && z.schlaege.some(q => !x.cells[q] || x.cells[q][0] === x.currentPlayer)) out.push('geschlagenes Feld ohne Gegner');
          if (z.schlaege.length && z.schlaege.length !== z.pfad.length) out.push('je Opfer genau ein Landefeld');
        }
        if (zz.some(z => z.schlaege.length) && zz.some(z => !z.schlaege.length)) out.push('Schlagzwang verletzt');
        if (zz.some(z => z.schlaege.length)) mitSchlag++;
        geprueft++;
        const z = zz[Math.floor(zuf() * zz.length)]; x.zieh(z.von, z.pfad);
      }
    }
    if (mitSchlag < 50) out.push(`zu wenig Schlagstellungen geprüft: ${mitSchlag}`);
    // PS-30: Computer liefert einen unzulässigen Zug: verworfen, ein zulässiger folgt
    const echt = c.aiStrategy;
    c.setZufall(() => 0.999); c.setDifficulty('stark');
    const frisch = () => { c.restartGame(); c.setMode(true); ui.render(); ui.handleSquareClick(43); ui.handleSquareClick(35); };
    for (const [name, antwort] of [['unmöglicher Zug', { von: 0, pfad: [63], schlaege: [] }], ['nichts', null], ['Unsinn', { von: 'x' }], ['Rückwärtszug', { von: 8, pfad: [0], schlaege: [] }]]) {
      c.aiStrategy = { chooseMove: () => Promise.resolve(antwort) };
      frisch();
      const vorAi = c.getBoardState().filter(Boolean).length;
      const o = await c.performAiAction();
      const b = c.getBoardState();
      if (o.invalid || b.filter(v => v === 'B').length !== 16 || c.getCurrentPlayer() !== 'W' || b.slice(8, 24).filter(v => v === 'B').length !== 15) out.push(`PS-30 ${name}: kein zulässiger Zug gefolgt`);
      if (vorAi !== 32) out.push(`PS-30 ${name}: Ausgangslage`);
    }
    // Der Computer ignoriert den Schlagzwang nicht: ein "ruhiger" Zug trotz möglichem Schlag wird verworfen
    c.aiStrategy = { chooseMove: () => Promise.resolve({ von: 8, pfad: [16], schlaege: [] }) };
    c.restartGame(); c.setMode(true);
    g.entity.loadFromJSON(S({ W: [35, 46], B: [27, 12, 8], p: 'B' })); c.selected = null; ui.render();
    const schlagzug = L({ W: [35, 46], B: [27, 12, 8], p: 'B' }, 'B');
    const oo = await c.performAiAction();
    const bb = c.getBoardState();
    if (oo.invalid || !oo.zug || oo.zug.schlaege.join() !== '35') out.push(`Computer ignoriert den Schlagzwang (${schlagzug} -> ${JSON.stringify(oo.zug)})`);
    if (bb.filter(v => v === 'W').length !== 1 || bb[8] !== 'B' || bb[43] !== 'B') out.push('Computer: nach Schlagzwang falscher Stand');
    // Computer mit echtem Rechner schlägt, wenn er kann
    c.aiStrategy = echt; c.setZufall(() => 0.999); c.setDifficulty('mittel');
    c.restartGame(); c.setMode(true);
    g.entity.loadFromJSON(S({ W: [35, 46], B: [27, 12, 8], p: 'B' })); ui.render();
    const og = await c.performAiAction();
    if (og.invalid || !og.zug || og.zug.schlaege.length === 0) out.push(`echter Rechner ignoriert Schlagzwang: ${JSON.stringify(og)}`);
    c.restartGame(); c.setMode(false); c.aiStrategy = echt;
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-5: Umwandlung und Dame (PS-9, PS-10, PS-24, PS-25) ----------
test('da_dame', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], g = window.__brett.dame, c = g.control, e = g.entity, ui = g.ui;
    const L = window.__liste, S = window.__stand, K = (...l) => l.slice().sort().join(' ');
    c.setMode(false); ui.render();
    // PS-9: Umwandlung durch einfachen Zug (Stein auf der vorletzten Reihe), dann Damenzug
    __lade({ W: [9, 50], B: [52, 20] });
    ui.handleSquareClick(9); ui.handleSquareClick(1);
    if (c.getBoardState()[1] !== 'WD') out.push(`PS-9: Weiß wird keine Dame (${c.getBoardState()[1]})`);
    if (!document.querySelector('#daboard .da-feld:nth-child(2) .da-krone')) out.push('PS-9: Dame ohne Krone im Bild');
    ui.handleSquareClick(20); ui.handleSquareClick(28);   // Schwarz zieht irgendwo
    const dz = DameEntity.dameZuege(c.getBoardState(), 'W').filter(z => z.von === 1).map(z => z.pfad[0]);
    if (!dz.includes(9) || !dz.includes(57)) out.push(`PS-9: Dame zieht nicht weit nach unten (${dz})`);
    if (!dz.includes(0) || !dz.includes(7)) out.push(`PS-9: Dame zieht nicht weit zur Seite (${dz})`);
    const e2 = new DameEntity(); e2.loadFromJSON(S({ B: [49], W: [9], p: 'B' }));
    e2.zieh(49, [57]);
    if (e2.cells[57] !== 'BD') out.push('PS-9: Schwarz wird keine Dame');
    // PS-10: Dame schlägt über weite Strecke; Stein dahinter blockiert
    if (L({ WD: [56], B: [24] }, 'W') !== K('56>16', '56>8', '56>0')) out.push(`PS-10: Fernschlag ${L({ WD: [56], B: [24] }, 'W')}`);
    if (L({ WD: [56], B: [24, 8] }, 'W') !== K('56>16>0')) out.push(`PS-10: Landefeld vor dem zweiten Stein ${L({ WD: [56], B: [24, 8] }, 'W')}`);
    const blockiert = DameEntity.dameZuege(S({ WD: [56], B: [24, 16] }).cells, 'W');
    if (blockiert.some(z => z.schlaege.length)) out.push('PS-10: blockierter Schlag wird angeboten');
    // Bedienung: Dame schlägt aus der Ferne und wählt das Landefeld
    __lade({ WD: [56], B: [24, 15, 23] });
    ui.handleSquareClick(56);
    if (window.__klassen('ziel').join() !== '0,8,16') out.push(`PS-10: Landefelder ${window.__klassen('ziel')}`);
    ui.handleSquareClick(16);
    if (c.getBoardState()[16] !== 'WD' || c.getBoardState()[24] !== null || c.getBoardState()[56] !== null) out.push('PS-10: Fernschlag nicht ausgeführt');
    // PS-24: Stein erreicht im Schlag die letzte Reihe und schlägt seitwärts weiter: bleibt Stein bis zum Ende, dann Dame
    if (L({ W: [17], B: [9, 2] }, 'W') !== '17>1>3') out.push(`PS-24: Fortsetzung auf der letzten Reihe ${L({ W: [17], B: [9, 2] }, 'W')}`);
    const x = new DameEntity(); x.loadFromJSON(S({ W: [17], B: [9, 2, 52] }));
    x.zieh(17, [1, 3]);
    if (x.cells[3] !== 'WD' || x.cells[9] !== null || x.cells[2] !== null) out.push(`PS-24: Ende der Folge: ${x.cells[3]}`);
    // als Stein darf er auf der letzten Reihe nicht aus der Ferne schlagen (hier wäre ein Fernschlag nach rechts möglich)
    if (L({ W: [17], B: [9, 4, 52] }, 'W') !== '17>1') out.push(`PS-24: Umwandlung mitten im Sprung ${L({ W: [17], B: [9, 4, 52] }, 'W')}`);
    const y = new DameEntity(); y.loadFromJSON(S({ W: [17], B: [9, 4, 52] }));
    y.zieh(17, [1]);
    if (y.cells[1] !== 'WD') out.push('PS-24: ohne Fortsetzung wird er keine Dame');
    // Schwarz entsprechend
    if (L({ B: [46], W: [54, 61] }, 'B') !== '46>62>60') out.push(`PS-24: Schwarz auf der letzten Reihe ${L({ B: [46], W: [54, 61] }, 'B')}`);
    // PS-25: zwei Landefelder, nur von einem geht es weiter: nur dieses ist erlaubt (in beiden Reihenfolgen)
    if (L({ WD: [32], B: [33, 19] }, 'W').split(' ').some(z => !/^32>35>/.test(z))) out.push(`PS-25: Landung ohne Fortsetzung (vorn): ${L({ WD: [32], B: [33, 19] }, 'W')}`);
    if (L({ WD: [32], B: [33, 20] }, 'W').split(' ').some(z => !/^32>36>/.test(z)) || L({ WD: [32], B: [33, 20] }, 'W') === '') out.push(`PS-25: Landung ohne Fortsetzung (hinten): ${L({ WD: [32], B: [33, 20] }, 'W')}`);
    __lade({ WD: [32], B: [33, 20] });
    ui.handleSquareClick(32);
    if (window.__klassen('ziel').join() !== '36') out.push(`PS-25: Zielfelder in der Bedienung ${window.__klassen('ziel')}`);
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-6: Ende, Unentschieden, Statistik, Konfetti (PS-11, PS-12, PS-29, PS-32) ----------
test('da_ende', async () => {
  const p = await seite({ gesehen: true, bewegung: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.dame, c = g.control, e = g.entity, ui = g.ui;
    const S = window.__stand, status = () => document.getElementById('dastatus').textContent;
    const klaenge = [];
    window.__brett.klang.spiele = (n) => klaenge.push(n);
    window.__brett.einstellungen.setzeTon(true);
    const aufraeumen = () => { document.querySelectorAll('canvas.konfetti').forEach(x => x.remove()); klaenge.length = 0; };
    const zug = (a, b) => { ui.handleSquareClick(a); ui.handleSquareClick(b); };
    c.setMode(false); await c.resetStats(); ui.renderStats();
    // PS-11: letzter Stein geschlagen, Partie endet; Sieg mit Konfetti und Ton
    __lade({ W: [35], B: [27] });
    zug(35, 19);
    if (!c.isGameOver() || e.winner !== 'W') out.push(`PS-11: Partie endet nicht (${e.finished} ${e.winner})`);
    if (!/Weiß gewinnt/.test(status()) || !/Schwarz hat keinen Stein mehr\./.test(status())) out.push(`PS-11: Statuszeile ${status()}`);
    if (c.getStats().wins.W !== 1 || document.getElementById('dastatW').textContent !== '1') out.push('PS-11: Statistik zählt den Sieg nicht');
    if (!ui.undoBtn.disabled || c.canUndo()) out.push('PS-11: Zug zurück nach Ende nicht gesperrt');
    if (!document.querySelector('canvas.konfetti')) out.push('Sieg: kein Konfetti');
    { const opt = [...document.querySelectorAll('#dame-view [data-abschnitt="optionen"] button')].filter(b => b.getClientRects().length).map(b => ({ t: b.textContent.trim(), r: b.getBoundingClientRect() })).sort((x, y) => (x.r.top - y.r.top) || (x.r.left - y.r.left));
      if (opt.length !== 4 || opt[3].t !== 'Teilen') out.push(`Optionen nach Partieende: ${opt.map(o => o.t).join('|')}`);
      if (opt.some(o => o.r.left < 0 || o.r.right > 412) || document.getElementById('dame-view').scrollWidth > 412) out.push('Optionen nach Partieende laufen über');
      if (opt.some(o => o.r.width < 44 || o.r.height < 44)) out.push('Optionen nach Partieende: Fläche unter 44 px'); }
    if (!klaenge.includes('sieg')) out.push(`Sieg: kein Siegerton (${klaenge})`);
    // PS-29: Spieler hat Steine, aber keinen Zug: verliert
    aufraeumen();
    __lade({ W: [56, 49, 50, 40, 35], B: [48] });
    zug(35, 27);
    if (!c.isGameOver() || e.winner !== 'W' || !/Schwarz kann nicht mehr ziehen\./.test(status())) out.push(`PS-29: ${e.finished} ${e.winner} ${status()}`);
    if (c.getStats().wins.W !== 2) out.push('PS-29: Statistik');
    // gegen den Computer: Niederlage ohne Konfetti und ohne Siegerton
    aufraeumen();
    c.setMode(true);
    __lade({ W: [35], B: [27, 12], p: 'B' });
    if (!c.handleFeldClick(27).invalid) out.push('Bedienung während der Computer am Zug ist');
    await ui.runAiTurn();
    if (!c.isGameOver() || e.winner !== 'B' || !/Der Computer gewinnt\./.test(status()) || !/Weiß hat keinen Stein mehr\./.test(status())) out.push(`Niederlage: ${e.winner} ${status()}`);
    if (document.querySelector('canvas.konfetti') || klaenge.includes('sieg')) out.push('Niederlage mit Konfetti oder Siegerton');
    // PS-12: Stellung zweimal, dann dreimal (zwei Damen pendeln, kein Steinzug, kein Schlag)
    c.setMode(false); aufraeumen();
    const start = { WD: [63], BD: [0], p: 'W' };
    const lade = (o) => { __lade(o); e.stellungen[e._schluessel()] = 1; };
    lade(start);
    const folge = [[63, 62], [0, 1], [62, 63], [1, 0]];
    for (let k = 0; k < 4; k++) zug(...folge[k]);
    if (e.stellungen[e._schluessel()] !== 2) out.push(`PS-12: Zählung nach vier Halbzügen ${e.stellungen[e._schluessel()]}`);
    if (c.isGameOver()) out.push('PS-12: nach der zweiten Wiederholung schon beendet');
    for (let k = 0; k < 3; k++) zug(...folge[k]);
    if (c.isGameOver()) out.push('PS-12: nach sieben Halbzügen beendet');
    zug(...folge[3]);
    if (!c.isGameOver() || e.winner !== 'Draw') out.push(`PS-12: kein Unentschieden bei der dritten Wiederholung (${e.finished} ${e.winner})`);
    if (!/Unentschieden: dieselbe Stellung kam dreimal vor\./.test(status())) out.push(`PS-12: Statuszeile ${status()}`);
    if (c.getStats().draws !== 1 || document.getElementById('dastatDraw').textContent !== '1') out.push('PS-12: Unentschieden nicht in der Statistik');
    if (document.querySelector('canvas.konfetti')) out.push('Unentschieden mit Konfetti');
    if (klaenge.includes('sieg')) out.push('Unentschieden mit Siegerton');
    if (!c.undoMove().invalid) out.push('Zug zurück nach dem Unentschieden');
    // Zähler nach Zug zurück (PS-12) und derselbe Zug erneut (PS-32)
    lade(start);
    for (let k = 0; k < 7; k++) zug(...folge[k % 4]);
    c.undoMove();
    zug(...folge[2]);
    const wieder = window.__snap();
    c.undoMove();
    zug(...folge[2]);
    if (window.__snap() !== wieder) out.push('PS-32: Zug zurück und derselbe Zug ergeben einen anderen Stand');
    zug(...folge[3]);
    if (!c.isGameOver() || e.winner !== 'Draw') out.push('PS-12: Zähler nach Zug zurück stimmt nicht (kein Unentschieden beim dritten Mal)');
    // Zähler nach Neuladen des Standes
    lade(start);
    for (let k = 0; k < 4; k++) zug(...folge[k]);
    const gespeichert = JSON.parse(window.__snap());
    e.loadFromJSON(gespeichert); c.selected = null; ui.render();
    for (let k = 0; k < 3; k++) zug(...folge[k]);
    if (c.isGameOver()) out.push('PS-12: nach Neuladen des Standes zu früh beendet');
    zug(...folge[3]);
    if (!c.isGameOver() || e.winner !== 'Draw') out.push('PS-12: nach Neuladen des Standes kein Unentschieden beim dritten Mal');
    // 59 und 60 Halbzüge ohne Schlag und ohne Steinzug
    for (const [ruhe, schluss] of [[57, false], [58, true]]) {
      __lade({ WD: [63], BD: [0], p: 'W', ruhe });
      zug(63, 62);
      if (c.isGameOver()) { out.push(`PS-12: Ende schon bei ${ruhe + 1} Halbzügen`); continue; }
      zug(0, 1);
      if (c.isGameOver() !== schluss) out.push(`PS-12: bei ${ruhe + 2} Halbzügen Ende ${c.isGameOver()} statt ${schluss}`);
      if (schluss && (e.winner !== 'Draw' || !/Unentschieden: 60 Züge ohne Schlag und ohne Schritt nach vorn\./.test(status()))) out.push(`PS-12: 60 Halbzüge ${e.winner} ${status()}`);
    }
    __lade({ WD: [63], BD: [0], W: [40], B: [8], p: 'W', ruhe: 40 });
    zug(40, 32);
    if (e.ruhe !== 0) out.push(`PS-12: Steinzug setzt den Zähler nicht zurück (${e.ruhe})`);
    __lade({ WD: [63], BD: [0], p: 'W', ruhe: 40 });
    zug(63, 62);
    if (e.ruhe !== 41) out.push(`PS-12: Damenzug zählt falsch (${e.ruhe})`);
    __lade({ WD: [63], BD: [0], W: [35], B: [27, 5], p: 'W', ruhe: 40 });
    zug(35, 19);
    if (e.ruhe !== 0 || Object.keys(e.stellungen).length !== 1) out.push(`PS-12: Schlag leert den Zähler nicht (${e.ruhe}, ${Object.keys(e.stellungen).length})`);
    // PS-34: Seitwärtszüge sind umkehrbar: zwei Steine pendeln, beim dritten Mal derselben Stellung ist Schluss
    const pendel = [[43, 42], [11, 10], [42, 43], [10, 11]];
    lade({ W: [43], B: [11], p: 'W' });
    for (let k = 0; k < 7; k++) zug(...pendel[k % 4]);
    if (c.isGameOver()) out.push('PS-34: Pendeln nach sieben Halbzügen schon beendet');
    if (e.ruhe !== 7) out.push(`PS-34: Seitwärtszüge setzen den Zähler zurück (${e.ruhe})`);
    zug(...pendel[3]);
    if (!c.isGameOver() || e.winner !== 'Draw') out.push(`PS-34: Pendeln ergibt kein Unentschieden (${e.finished} ${e.winner})`);
    // PS-34: 60 Halbzüge nur aus Seitwärts- und Damenzügen
    __lade({ W: [43], BD: [0], p: 'W', ruhe: 58 });
    zug(43, 42);
    if (c.isGameOver()) out.push('PS-34: Ende bei 59 Halbzügen');
    zug(0, 1);
    if (!c.isGameOver() || e.winner !== 'Draw') out.push(`PS-34: 60 Halbzüge aus Seitwärts- und Damenzügen ergeben kein Unentschieden (${e.ruhe})`);
    // PS-34: ein Schritt nach vorn setzt Zähler und Stellungen zurück
    __lade({ W: [43], BD: [0], p: 'W', ruhe: 40 });
    zug(43, 35);
    if (e.ruhe !== 0 || Object.keys(e.stellungen).length !== 1) out.push(`PS-34: Schritt nach vorn setzt nicht zurück (${e.ruhe}, ${Object.keys(e.stellungen).length})`);
    c.setMode(false);
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-7: Übung (PS-13, PS-14, PS-31) ----------
const ZEITEN_UEBUNG = 1700;
test('da_uebung', async () => {
  const out = [];
  let p = await seite();
  await p.evaluate(HILFE);
  const r = await p.evaluate(async (warteMs) => {
    const out = [], ui = window.__brett.dame.ui, warte = ms => new Promise(r => setTimeout(r, ms));
    const banner = document.getElementById('dauebung');
    if (!banner || banner.hidden) return ['Übung nicht sichtbar beim ersten Start'];
    const titel = () => banner.querySelector('.da-uebung-titel').textContent;
    const status = () => document.getElementById('dastatus').textContent;
    const brett = () => JSON.stringify(ui.uebung.getBoardState());
    const sicht = () => JSON.stringify([...document.querySelectorAll('#daboard .da-feld')].map(e => e.getAttribute('aria-label')));
    const SCHRITTE = DameUebungControl.SCHRITTE;
    if (SCHRITTE.length !== 5) out.push(`${SCHRITTE.length} Schritte statt 5`);
    // die Stellungen sind nach den Regeln geprüft: der geplante Zug ist zulässig, und es ist der einzige Weg
    SCHRITTE.forEach((s, i) => {
      const cells = Array(64).fill(null);
      for (const k of ['W', 'B', 'WD', 'BD']) (s[k] || []).forEach(f => cells[f] = k);
      const z = DameEntity.dameZuege(cells, 'W').filter(q => q.von === s.von && q.pfad.length === s.pfad.length && q.pfad.every((f, j) => f === s.pfad[j]));
      if (z.length !== 1) out.push(`Schritt ${i + 1}: geplanter Zug ist nach den Regeln nicht zulässig`);
      if (i === 1 && DameEntity.dameZuege(cells, 'W').some(q => q.von !== s.von)) out.push('Schritt 2: der zweite weiße Stein ist nicht gesperrt');
    });
    const erwartet = [1, 1, 3, 1, 1];
    for (let n = 1; n <= 5; n++) {
      if (!titel().includes(`${n} von 5`)) { out.push(`Titel Schritt ${n}: ${titel()}`); break; }
      for (let t = 0; t < erwartet[n - 1]; t++) {
        const ziele = window.__klassen('ziel');
        if (ziele.length !== 1) out.push(`Schritt ${n}, Tipp ${t + 1}: ${ziele.length} Zielfelder`);
        const blase = document.querySelectorAll('#daboard .da-blase');
        if (blase.length !== 1 || !/Hier tippen/.test(blase[0].textContent)) out.push(`Schritt ${n}: Sprechblase fehlt`);
        // PS-14: falsches Feld ändert nichts, zeigt Hinweis
        const falsch = [...Array(64).keys()].filter(i => i !== ziele[0] && i !== ui.uebung.getSelected()).find(i => i !== 0 && i !== 8);
        const vorher = brett(), vs = sicht();
        ui.handleSquareClick(falsch);
        if (brett() !== vorher || sicht() !== vs) out.push(`Schritt ${n}: falsches Feld ändert das Brett`);
        if (!/Nicht dort/.test(status())) out.push(`Schritt ${n}: kein Hinweis bei falschem Feld (${status()})`);
        if (window.__klassen('ziel').join() !== ziele.join()) out.push(`Schritt ${n}: falsches Feld verschiebt das Ziel`);
        if (n === 2) {
          const andere = window.__klassen('ziehbar');
          if (andere.length > 1 || window.__klassen('selected').join() !== '35') out.push(`Schritt 2: Ringe ${andere}`);
          ui.handleSquareClick(46);
          if (brett() !== vorher) out.push('Schritt 2: gesperrter Stein ließ sich bewegen');
        }
        ui.handleSquareClick(ziele[0]);
        if (t === erwartet[n - 1] - 1) {   // gelöst: Lobpause ohne Zielfeld, die Partie ist nicht zu Ende
          if (window.__klassen('ziel').length !== 0) out.push(`Schritt ${n}: nach dem letzten Tipp noch ${window.__klassen('ziel').length} Zielfelder`);
          if (ui.uebung.boundary.isGameOver()) out.push(`Schritt ${n}: die Übung beendet die Partie`);
          try { await ui.uebung.boundary.recordResult('W'); } catch (err) { out.push(`Übung: recordResult ohne Speicher wirft ${err}`); }
        }
        if (n === 3) {
          if (t === 0 && window.__klassen('weg').join() !== '42') out.push(`Schritt 3: Weg ${window.__klassen('weg')}`);
          if (t < 2 && window.__klassen('ziel').length !== 1) out.push(`Schritt 3 nach Tipp ${t + 1}: ${window.__klassen('ziel').length} Zielfelder`);
        }
      }
      await warte(warteMs);
    }
    if (!/Geschafft/.test(banner.textContent)) out.push(`kein Abschluss: ${banner.textContent}`);
    banner.querySelector('.da-los').click();
    await warte(100);
    if (!banner.hidden) out.push('Übung nach "Los" noch sichtbar');
    if (window.__brett.dame.control.getBoardState().filter(Boolean).length !== 32) out.push('echte Partie durch Übung verändert');
    return out;
  }, ZEITEN_UEBUNG);
  out.push(...r, ...p.fehler);
  await zu(p);
  // PS-13: Schritt 4 zeigt die Krone, Schritt 5 die Dame
  p = await seite();
  await p.evaluate(HILFE);
  const k = await p.evaluate(async () => {
    const ui = window.__brett.dame.ui, warte = ms => new Promise(r => setTimeout(r, ms));
    const tipp = () => ui.handleSquareClick(window.__klassen('ziel')[0]);
    tipp(); await warte(1700);                       // Schritt 1
    tipp(); await warte(1700);                       // Schritt 2
    tipp(); tipp(); tipp(); await warte(1700);       // Schritt 3
    const vorher = document.querySelectorAll('#daboard .da-krone').length;
    tipp();                                          // Schritt 4: Dame werden
    const nachher = document.querySelectorAll('#daboard .da-krone').length;
    await warte(1700);
    return { vorher, nachher, schritt5: document.querySelectorAll('#daboard .da-krone').length };
  });
  if (k.vorher !== 0 || k.nachher !== 1) out.push(`Schritt 4: Krone vorher ${k.vorher} nachher ${k.nachher}`);
  if (k.schritt5 !== 1) out.push(`Schritt 5: ${k.schritt5} Damen im Bild`);
  out.push(...p.fehler); await zu(p);
  // Neuladen mitten in der Übung: beginnt neu (nichts gespeichert)
  let ctx = await browser.newContext({ viewport: HOCH, hasTouch: true, isMobile: true });
  p = await seite({ ctx });
  await p.evaluate(HILFE);
  await p.evaluate(async () => { const ui = window.__brett.dame.ui; ui.handleSquareClick(window.__klassen('ziel')[0]); await new Promise(r => setTimeout(r, 1700)); });
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.dame);
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=dame]').click());
  if (!(await p.evaluate(() => /1 von 5/.test(document.querySelector('#dauebung .da-uebung-titel').textContent) && !document.getElementById('dauebung').hidden))) out.push('Neuladen mitten in der Übung: beginnt nicht neu');
  // PS-14 / AK-7: Überspringen speichert, Neuladen ohne Übung
  const gesp = () => p.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return 'kaputt'; } }, SCHLUESSEL);
  await p.evaluate(() => document.querySelector('#dauebung .da-ueberspringen').click());
  let s = await gesp();
  if (!s || s.dameEinfuehrung !== true) out.push(`Überspringen: nicht gespeichert (${JSON.stringify(s)})`);
  if (s && s.muehleEinfuehrung !== true) out.push('Dame-Merker überschreibt den Merker der Mühle');
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.dame);
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=dame]').click());
  if (!(await p.evaluate(() => document.getElementById('dauebung').hidden))) out.push('Übung kommt nach Überspringen und Neuladen wieder');
  out.push(...p.fehler); await ctx.close();
  // nach vollständiger Übung ebenfalls gespeichert; Merker überlebt Wechsel von Stufe und Ton (PS-31)
  ctx = await browser.newContext({ viewport: HOCH, hasTouch: true, isMobile: true });
  p = await seite({ ctx });
  await p.evaluate(HILFE);
  const fertig = await p.evaluate(async () => {
    const ui = window.__brett.dame.ui;
    for (let n = 0; n < 5; n++) {
      const t = n === 2 ? 3 : 1;
      for (let i = 0; i < t; i++) ui.handleSquareClick(window.__klassen('ziel')[0]);
      await new Promise(r => setTimeout(r, 1700));
    }
    return JSON.parse(localStorage.getItem('brettspiele.einstellungen'));
  });
  if (fertig.dameEinfuehrung !== true) out.push(`Abschluss nicht gespeichert: ${JSON.stringify(fertig)}`);
  await p.evaluate(() => { document.querySelector('#dauebung .da-los').click(); });
  await p.evaluate(() => { const ui = window.__brett.dame.ui; ui.control.setMode(true); ui.handleStufe('leicht'); ui.handleStufe('stark'); ui.setzeLernen(false); document.querySelector('.ton-schalter').click(); });
  s = await gesp();
  if (!s || s.dameEinfuehrung !== true) out.push(`Merker geht beim Speichern anderer Einstellungen verloren: ${JSON.stringify(s)}`);
  if (s && (s.stufen.dame !== 'stark' || s.ton !== true || s.lernen.dame !== false)) out.push(`andere Einstellungen nicht gespeichert: ${JSON.stringify(s)}`);
  if (s && s.zuletzt !== 'dame') out.push(`zuletzt gespieltes Spiel nicht gespeichert: ${s.zuletzt}`);
  out.push(...p.fehler); await ctx.close();
  // PS-31: Überspringen zehnmal schnell; Einstellungen anderer Spiele bleiben
  p = await seite();
  await p.evaluate(() => { for (let i = 0; i < 10; i++) { const b = document.querySelector('#dauebung .da-ueberspringen'); if (b) b.click(); } });
  s = await gesp();
  if (!s || s.dameEinfuehrung !== true || !(await p.evaluate(() => document.getElementById('dauebung').hidden))) out.push('zehnmal Überspringen: Zustand falsch');
  await p.evaluate(() => { const m = window.__brett.muehle.ui; if (m.uebung && m.uebung.aktiv()) m._uebungUeberspringen(); window.__brett.einstellungen.setzeStufe('muehle', 'leicht'); });
  s = await gesp();
  if (!s || s.dameEinfuehrung !== true || s.stufen.muehle !== 'leicht') out.push(`Speichern für Mühle verliert den Dame-Merker: ${JSON.stringify(s)}`);
  out.push(...p.fehler); await zu(p);
  // PS-14: kaputte Einstellungen: Übung läuft, kein Skriptfehler
  p = await seite({ einstRoh: '{kaputt' });
  if (await p.evaluate(() => document.getElementById('dauebung').hidden)) out.push('kaputte Einstellungen: keine Übung');
  out.push(...p.fehler.map(f => 'kaputt: ' + f)); await zu(p);
  // PS-14: Speicher blockiert: Übung läuft, Überspringen und Spiel gehen
  p = await seite({ vorher: () => { const w = () => { throw new Error('gesperrt'); }; Storage.prototype.getItem = w; Storage.prototype.setItem = w; } });
  const b = await p.evaluate(() => {
    const sichtbar = !document.getElementById('dauebung').hidden;
    document.querySelector('#dauebung .da-ueberspringen').click();
    const c = window.__brett.dame.control; c.handleFeldClick(43); c.handleFeldClick(35);
    return { sichtbar, gezogen: c.getBoardState()[35] === 'W' };
  });
  if (!b.sichtbar) out.push('blockiert: keine Übung'); if (!b.gezogen) out.push('blockiert: Spiel läuft nicht');
  out.push(...p.fehler.map(f => 'blockiert: ' + f)); await zu(p);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-8: Markierungen, Größen, Anordnung (PS-15, PS-33) ----------
test('da_markierung', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.dame, c = g.control, ui = g.ui;
    const status = () => document.getElementById('dastatus').textContent;
    c.setMode(false); c.restartGame(); ui.render();
    const felder = [...document.querySelectorAll('#daboard .da-feld')];
    if (felder.length !== 64) out.push(`${felder.length} Felder`);
    const klein = felder.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; });
    if (klein.length) out.push(`${klein.length} Felder kleiner als 44 px (${felder[0].getBoundingClientRect().width})`);
    if (document.getElementById('dame-view').scrollWidth > 412) out.push(`Dame breiter als der Bildschirm: ${document.getElementById('dame-view').scrollWidth}`);
    const r0 = felder[0].getBoundingClientRect(), r63 = felder[63].getBoundingClientRect();
    if (r0.left < 0 || r63.right > 412 || r63.bottom > 915) out.push('Brett ragt aus dem Bild');
    // aria-label je Feld
    if (!/^Feld \d+, weißer Stein/.test(felder[43].getAttribute('aria-label')) || !/^Feld \d+, schwarzer Stein/.test(felder[10].getAttribute('aria-label')) || !/^Feld \d+, frei/.test(felder[27].getAttribute('aria-label'))) out.push(`aria-label: ${felder[43].getAttribute('aria-label')} | ${felder[10].getAttribute('aria-label')} | ${felder[27].getAttribute('aria-label')}`);
    // Ziehen: Ringe genau auf ziehbaren Steinen, Ziele erst nach Antippen
    if (window.__klassen('ziehbar').join() !== [40, 41, 42, 43, 44, 45, 46, 47].join()) out.push(`Ringe ${window.__klassen('ziehbar')}`);
    if (window.__klassen('ziel').length) out.push('Ziele vor der Auswahl');
    if (!/Tippe einen Stein mit blauem Ring, dann ein grünes Feld/.test(status()) || !/^Weiß/.test(status())) out.push(`Statuszeile am Start: ${status()}`);
    ui.handleSquareClick(43);
    if (window.__klassen('selected').join() !== '43' || window.__klassen('ziel').join() !== '35') out.push(`Auswahl ${window.__klassen('selected')} Ziele ${window.__klassen('ziel')}`);
    // Lernhilfe aus: keine Ringe, Auswahl und Ziele bleiben
    ui.setzeLernen(false);
    if (window.__klassen('ziehbar').length || window.__klassen('ziel').join() !== '35') out.push('Lernhilfe aus: Ringe oder Ziele falsch');
    if (window.__brett.einstellungen.lernen('dame') !== false) out.push('Lernhilfe aus nicht gespeichert');
    __lade({ W: [35, 46], B: [27, 4, 6] });
    if (window.__klassen('ziehbar').length || /Pflicht/.test(status())) out.push('Lernhilfe aus: Pflicht-Hinweis trotzdem sichtbar');
    // ein Stein, der nicht ziehen darf: kurzer Hinweis, auch ohne Lernhilfe; die Stellung bleibt
    { const vor = window.__snap(); ui.handleSquareClick(46);
      if (!/Schlagen ist Pflicht\./.test(status())) out.push(`Lernhilfe aus: kein Hinweis beim gesperrten Stein (${status()})`);
      if (window.__snap() !== vor || c.getSelected() !== null) out.push('gesperrter Stein ändert die Stellung');
      ui.handleSquareClick(35);
      if (/Pflicht/.test(status()) || window.__klassen('ziel').join() !== '19') out.push(`Hinweis bleibt nach gültigem Tipp (${status()})`);
      ui.handleSquareClick(35); }
    ui.setzeLernen(true);
    // Schlagzwang: nur schlagfähige Steine tragen den Ring, Hinweis in der Statuszeile
    if (window.__klassen('ziehbar').join() !== '35' || !/Schlagen ist Pflicht/.test(status())) out.push(`Schlagzwang: Ringe ${window.__klassen('ziehbar')}, ${status()}`);
    // Mehrfachsprung: Weg, Auswahl und nächstes Ziel
    __lade({ W: [42], B: [34, 27, 20, 4] });
    ui.handleSquareClick(42); ui.handleSquareClick(26);
    if (window.__klassen('weg').join() !== '42' || window.__klassen('selected').join() !== '26' || window.__klassen('ziel').join() !== '28') out.push('Mehrfachsprung: Markierungen');
    if (window.__klassen('ziehbar').length) out.push('Mehrfachsprung: Ringe mitten im Zug');
    if (!/Weiter schlagen: tippe das nächste grüne Feld/.test(status())) out.push(`Mehrfachsprung: Statuszeile ${status()}`);
    ui.handleSquareClick(28);
    if (window.__klassen('weg').join() !== '26,42' && window.__klassen('weg').join() !== '42,26') out.push(`Mehrfachsprung: Weg nach dem zweiten Sprung ${window.__klassen('weg')}`);
    // Zug zurück mitten im Sprung: nur die Auswahl verfällt
    ui.handleUndo();
    if (window.__klassen('weg').length || window.__klassen('selected').length || c.getBoardState()[42] !== 'W') out.push('Zug zurück mitten im Sprung');
    // letzter Zug des Gegners bleibt sichtbar: von, Pfad, geschlagene Felder
    c.setMode(true); c.setZufall(() => 0.999); c.setDifficulty('leicht');
    g.entity.loadFromJSON(window.__stand({ W: [35, 46], B: [27, 12, 8], p: 'B' })); ui.render();
    await ui.runAiTurn();
    const zl = window.__klassen('zuletzt'), gs = window.__klassen('geschlagen');
    if (zl.length < 2 || gs.length < 1) out.push(`letzter Zug: zuletzt ${zl}, geschlagen ${gs}`);
    if (gs.some(i => c.getBoardState()[i] !== null)) out.push('geschlagenes Feld ist nicht leer');
    // Dame im Bild
    c.setMode(false);
    __lade({ WD: [56], BD: [7], W: [40], B: [9] });
    const f2 = [...document.querySelectorAll('#daboard .da-feld')];
    if (!/weiße Dame/.test(f2[56].getAttribute('aria-label')) || !/schwarze Dame/.test(f2[7].getAttribute('aria-label'))) out.push('aria-label der Dame');
    if (f2.filter(x => x.querySelector('.da-krone')).length !== 2) out.push('Kronen nicht nur an den Damen');
    // Zeile Optionen: genau 2D oder 3D, "?" und Lernhilfe
    const opt = [...document.querySelectorAll('#dame-view [data-abschnitt="optionen"] button')].filter(b => b.getClientRects().length).map(b => b.textContent.trim());
    if (opt.length !== 3 || !/^(2D|3D)$/.test(opt[0]) || opt[1] !== '?' || !/^Lernhilfe/.test(opt[2])) out.push(`Optionen: ${opt.join('|')}`);
    // alle sichtbaren Knöpfe mindestens 44 px
    const zuKlein = [...document.querySelectorAll('#dame-view button, #dame-view label')].filter(b => b.getClientRects().length).map(b => ({ b, r: b.getBoundingClientRect() })).filter(x => x.r.width < 44 || x.r.height < 44);
    if (zuKlein.length) out.push(`${zuKlein.length} Flächen unter 44 px: ${zuKlein.slice(0, 3).map(x => x.b.textContent.trim().slice(0, 12) + Math.round(x.r.width) + 'x' + Math.round(x.r.height))}`);
    // Aktionen: genau drei Knöpfe in einer Zeile
    const akt = [...document.querySelectorAll('#dacontrols button')].map(b => b.textContent.trim());
    if (akt.join('|') !== 'Neu starten|Zug zurück|Tipp') out.push(`Aktionen: ${akt.join('|')}`);
    const ak = document.getElementById('dacontrols').getBoundingClientRect().bottom;
    if (ak > 915) out.push(`Aktionen enden bei ${ak}`);
    return out;
  });
  // PS-33: Dame hält die gemeinsamen Regeln des Aufbaus (gemessen, nicht im Quelltext gesucht)
  const aufbauMass = await p.evaluate(() => {
    // Dame folgt auf die sieben älteren Spiele (Tavla kommt danach)
    const k = [...document.querySelectorAll('#tabs .tabBtn')], d = document.querySelector('.tabBtn[data-tab=dame]');
    const reihe = ['status', 'brett', 'aktionen', 'modus', 'optionen', 'statistik'].map(n => { const e = document.querySelector(`#dame-view [data-abschnitt="${n}"]`); const r = e && e.getBoundingClientRect(); return e && r.height > 0 ? r.top : null; });
    const gemessen = reihe.map(x => x === null ? -1 : x);
    return { letzte: k.indexOf(d) === k.findIndex(x => x.dataset.tab === 'tictactoe') + 1, kachelSvg: !!d.querySelector('svg'), name: d.querySelector('.kachel-name').textContent, reihe: gemessen, ak: document.getElementById('dacontrols').getBoundingClientRect().bottom };
  });
  if (!aufbauMass.letzte || !aufbauMass.kachelSvg || aufbauMass.name !== 'Dame') r.push(`PS-33: Kachel ${JSON.stringify([aufbauMass.letzte, aufbauMass.kachelSvg, aufbauMass.name])}`);
  if (aufbauMass.reihe.some(x => x < 0) || aufbauMass.reihe.some((x, i, a) => i && x < a[i - 1])) r.push(`PS-33: Abschnitte nicht in fester Reihenfolge ${aufbauMass.reihe}`);
  if (aufbauMass.ak > 915) r.push(`PS-33: Aktionen enden bei ${aufbauMass.ak}`);
  const f = p.fehler; await zu(p);
  // Querformat: Brett vollständig, Felder mindestens 32 px, Bedienung rechts
  const q = await seite({ gesehen: true, vp: QUER });
  await q.evaluate(HILFE);
  const x = await q.evaluate(() => { window.scrollTo(0, 0); const f = [...document.querySelectorAll('#daboard .da-feld')].map(e => e.getBoundingClientRect()); const br = document.getElementById('daboard').getBoundingClientRect(), st = document.getElementById('dastatus').getBoundingClientRect(), ak = document.getElementById('dacontrols').getBoundingClientRect();
    return { feld: Math.min(...f.map(m => Math.min(m.width, m.height))), br: [br.top, br.bottom, br.right], st: st.left, ak: [ak.left, ak.bottom], breit: document.documentElement.scrollWidth - innerWidth }; });
  if (x.feld < 32) r.push(`quer: Feld nur ${x.feld} px`);
  if (x.br[0] < 0 || x.br[1] > 412) r.push(`quer: Brett nicht vollständig sichtbar ${x.br}`);
  if (x.st < x.br[2] - 1 || x.ak[0] < x.br[2] - 1 || x.ak[1] > 412) r.push(`quer: Bedienung nicht rechts oder nicht sichtbar ${JSON.stringify(x)}`);
  if (x.breit > 0) r.push(`quer: ragt ${x.breit} px hinaus`);
  f.push(...q.fehler); await zu(q);
  // Räumliches Brett: ein Tipp trifft das Feld (PS-15, AK-8)
  const d = await seite({ gesehen: true, dreid: true });
  await d.evaluate(HILFE);
  const ziel3 = async (feld) => { const pt = await d.evaluate(f => window.__brett.dame.ui.ansicht3d.bildschirmPunkt(f), feld); await d.mouse.click(pt.x, pt.y); await d.waitForTimeout(120); };
  await ziel3(43);
  let sel = await d.evaluate(() => window.__brett.dame.control.getSelected());
  if (sel !== 43) r.push(`3D: Tipp auf Feld 43 wählt ${sel}`);
  await ziel3(35);
  const gez = await d.evaluate(() => window.__brett.dame.control.getBoardState()[35]);
  if (gez !== 'W') r.push(`3D: Tipp auf das Zielfeld zieht nicht (${gez})`);
  for (const feld of [0, 7, 28, 63]) {
    const t = await d.evaluate(([f]) => { const a = window.__brett.dame.ui.ansicht3d, pt = a.bildschirmPunkt(f); return a.feldBei(pt.x, pt.y); }, [feld]);
    if (t !== feld) r.push(`3D: Punkt von Feld ${feld} trifft Feld ${t}`);
  }
  if (!(await d.evaluate(() => /^(2D|3D)$/.test(document.querySelector('#dame-view .ansicht-knopf').textContent)))) r.push('3D: Knopf 2D/3D fehlt');
  f.push(...d.fehler); await zu(d);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- Räumliches Brett: Stimmigkeit mit Brett und Markierungen, Wechsel, Ruhe, ohne WebGL (PS-15, AK-8) ----------
test('da_dreid', async () => {
  const out = [];
  const p = await seite({ gesehen: true, dreid: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.dame, c = g.control, ui = g.ui, a = ui.ansicht3d, warte = ms => new Promise(r => setTimeout(r, ms));
    const knopf = () => document.querySelector('#dame-view .ansicht-knopf');
    const objekte = () => { const m = {}; a.figuren.children.forEach(o => { m[o.userData.feld] = o.userData.wert; }); return m; };
    const stimmt = (was) => { const b = c.teil.length ? c.ansicht(true).brett : c.getBoardState(), o = objekte(), n = b.filter(Boolean).length;
      if (a.figuren.children.length !== n) out.push(`${was}: ${a.figuren.children.length} Objekte für ${n} Steine`);
      b.forEach((v, i) => { if ((v || undefined) !== o[i]) out.push(`${was}: Feld ${i} Brett ${v} Objekt ${o[i]}`); }); };
    const marken = (art) => a.markGruppe.children.filter(m => m.userData.art === art).map(m => m.userData.feld).sort((x, y) => x - y);
    c.setMode(false);
    // Mehrfachsprung: geschlagene Steine sind weg
    __lade({ W: [42, 50], B: [34, 27, 20, 4] });
    stimmt('Start');
    for (const f of [42, 26, 28, 12]) ui.handleSquareClick(f);
    await warte(2200);
    stimmt('nach Mehrfachsprung');
    if (c.getBoardState().filter(v => v === 'B').length !== 1) out.push('Mehrfachsprung nicht ausgeführt');
    // Markierungen entsprechen control.ansicht()
    __lade({ W: [35, 46, 52], B: [27, 4, 6, 12] });
    let v = c.ansicht(true);
    if (marken('ziehbar').join() !== v.ziehbar.join() || v.ziehbar.length !== 1) out.push(`Ringe ${marken('ziehbar')} statt ${v.ziehbar}`);
    ui.handleSquareClick(35);
    v = c.ansicht(true);
    if (marken('ziel').join() !== v.ziele.join() || v.ziele.length !== 1) out.push(`Ziele ${marken('ziel')} statt ${v.ziele}`);
    if (marken('auswahl').join() !== '35') out.push(`Auswahl ${marken('auswahl')}`);
    ui.setzeLernen(false);
    if (marken('ziehbar').length) out.push('Lernhilfe aus: Ringe in 3D');
    ui.setzeLernen(true);
    // Tipp-Ring in anderer Farbe als der Ring
    __lade({ W: [43], B: [10] });
    await ui.handleTipp();
    if (!a.marken.length) out.push('Tipp: keine Markierung in 3D');
    else if (a.marken[0].mesh.material.color.getHex() === a.markMat.ring.color.getHex()) out.push('Tipp-Ring hat die Farbe des Ziehbar-Rings');
    // Wechsel 2D/3D mitten im Pfad: Auswahl und Teilpfad bleiben
    __lade({ W: [42], B: [34, 27, 20, 4] });
    ui.handleSquareClick(42); ui.handleSquareClick(26);
    knopf().click(); await warte(400);
    if (a.aktiv) out.push('Wechsel zu 2D ohne Wirkung');
    if (c.getSelected() !== 42 || c.teil.join() !== '26') out.push(`2D mitten im Pfad: Auswahl ${c.getSelected()} Teilpfad ${c.teil}`);
    if (window.__klassen('ziel').join() !== '28' || window.__klassen('weg').join() !== '42') out.push(`2D mitten im Pfad: Ziele ${window.__klassen('ziel')} Weg ${window.__klassen('weg')}`);
    knopf().click(); await warte(1500);
    if (!a.aktiv) out.push('Wechsel zurück zu 3D ohne Wirkung');
    if (marken('ziel').join() !== '28' || marken('weg').join() !== '42' || c.teil.join() !== '26') out.push(`3D mitten im Pfad: Ziele ${marken('ziel')} Weg ${marken('weg')} Teilpfad ${c.teil}`);
    stimmt('3D mitten im Pfad');
    ui.handleSquareClick(28); ui.handleSquareClick(12);
    await warte(2000);
    stimmt('Pfad zu Ende');
    // Ruhe: nach vielen Zügen wächst nichts
    __lade({ WD: [56], BD: [7], W: [40], B: [8] }); await warte(300);   // alle Formen einmal gezeichnet (Geometrien werden erst beim ersten Zeichnen hochgeladen)
    c.setMode(false); c.restartGame(); ui.render(); await warte(300);
    let s = 424242; const zuf = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const spiele = (n) => { for (let i = 0; i < n; i++) { if (c.isGameOver()) { ui.handleReset(); } const zz = c.boundary.getZuege(); const z = zz[Math.floor(zuf() * zz.length)]; ui.handleSquareClick(z.von); z.pfad.forEach(f => ui.handleSquareClick(f)); } };
    spiele(8); await warte(1500);
    const m0 = { szene: a.szene.children.length, geo: a.renderer.info.memory.geometries, tex: a.renderer.info.memory.textures };
    spiele(40); await warte(2500);
    const m1 = { szene: a.szene.children.length, geo: a.renderer.info.memory.geometries, tex: a.renderer.info.memory.textures };
    if (JSON.stringify(m0) !== JSON.stringify(m1)) out.push(`nach 40 Zügen wächst der Speicher: ${JSON.stringify(m0)} -> ${JSON.stringify(m1)}`);
    if (a.anim.length) out.push(`Animationen bleiben hängen: ${a.anim.length}`);
    stimmt('nach 40 Zügen');
    c.restartGame();
    return out;
  });
  out.push(...r, ...p.fehler); await zu(p);
  // ohne WebGL: Dame bleibt in 2D spielbar, der 3D-Knopf ist aus
  const q = await seite({
    vorher: () => { const alt = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (art, ...r) { return /webgl/.test(art) ? null : alt.call(this, art, ...r); }; },
    einstRoh: JSON.stringify({ formatversion: 1, ton: false, stufen: {}, ansicht: {}, lernen: {}, muehleEinfuehrung: true, dameEinfuehrung: true }),
  });
  await q.waitForTimeout(800);
  await q.evaluate(HILFE);
  const w = await q.evaluate(() => {
    const ui = window.__brett.dame.ui, k = document.querySelector('#dame-view .ansicht-knopf'), c = window.__brett.dame.control;
    c.setMode(false); c.restartGame(); ui.render(); ui.handleSquareClick(43); ui.handleSquareClick(35);
    return { aktiv: !!(ui.ansicht3d && ui.ansicht3d.aktiv), brett2d: getComputedStyle(ui.boardEl).display !== 'none', gesperrt: !k || k.disabled, gezogen: c.getBoardState()[35] === 'W', felder: document.querySelectorAll('#daboard .da-feld').length };
  });
  if (w.aktiv || !w.brett2d || !w.gesperrt || !w.gezogen || w.felder !== 64) out.push(`ohne WebGL: ${JSON.stringify(w)}`);
  out.push(...q.fehler.map(x => 'ohne WebGL: ' + x)); await zu(q);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-9: Stärke, Rechenzeit, Wiederholbarkeit, Worker (PS-16 bis PS-18, PS-23) ----------
test('da_staerke', async () => {
  const p = await seite({ gesehen: true });
  const r = await p.evaluate(async () => {
    const out = [], c = window.__brett.dame.control;
    const ST = DameControl.STUFEN;
    if (ST.leicht.tiefe !== 1 || ST.mittel.tiefe !== 2 || ST.stark.tiefe !== 4 || ST.leicht.fehler !== 0.4 || ST.mittel.fehler !== 0.15 || ST.stark.fehler !== 0 || DameControl.KNOTEN !== 60000) out.push(`Stufentabelle ${JSON.stringify(ST)} ${DameControl.KNOTEN}`);
    // PS-16: Partien mit fester Saat, Farben wechseln, Abbruch nach 200 Halbzügen
    const starkePositionen = [];
    const partie = (saat, wStufe, bStufe, sammle) => {
      let s = saat; const zuf = () => (s = (s * 16807) % 2147483647) / 2147483647;
      const e = new DameEntity(), zuege = []; let n = 0;
      while (!e.finished && n < 200) {
        const stufe = e.currentPlayer === 'W' ? wStufe : bStufe, cfg = ST[stufe], zz = e.zuege();
        let z;
        if (zuf() < cfg.fehler) z = zz[Math.min(zz.length - 1, Math.floor(zuf() * zz.length))];
        else { z = AIEngines.dame({ cells: [...e.cells] }, e.currentPlayer, cfg.tiefe, DameControl.KNOTEN); if (sammle && stufe === 'stark' && n % 3 === 0) starkePositionen.push({ cells: [...e.cells], p: e.currentPlayer }); }
        zuege.push(JSON.stringify(z));
        e.zieh(z.von, z.pfad); n++;
      }
      return { sieger: e.finished ? e.winner : 'offen', zuege };
    };
    const serie = (stufe, sammle) => {
      let siege = 0, nied = 0, remis = 0;
      for (let i = 0; i < 20; i++) {
        const farbe = i % 2 ? 'B' : 'W', w = farbe === 'W' ? stufe : 'leicht', b = farbe === 'W' ? 'leicht' : stufe;
        const { sieger } = partie(1000 + i * 7919, w, b, sammle);
        if (sieger === farbe) siege++; else if (sieger === 'W' || sieger === 'B') nied++; else remis++;
      }
      return { siege, nied, remis };
    };
    let starkMittel = '';
    const stark = serie('stark', true), mittel = serie('mittel', false);
    if (stark.siege < 18) out.push(`Stark gewinnt nur ${stark.siege} von 20`);
    if (mittel.siege < 14) out.push(`Mittel gewinnt nur ${mittel.siege} von 20`);
    // PS-17: gleiche Saat, gleiche Züge
    const a = partie(4242, 'stark', 'leicht').zuege.join('|'), b = partie(4242, 'stark', 'leicht').zuege.join('|');
    if (a !== b) out.push('PS-17: nicht wiederholbar');
    // Rechenzeit der Stufe Stark über den Worker (PS-18: auch mit mehreren Damen im Endspiel)
    const ai = c.aiStrategy;
    if (!ai._worker) out.push('kein Worker');
    const zeiten = [];
    const messe = async (cells, spieler, tiefe) => { const t0 = performance.now(); const z = await ai.chooseMove('dame', [{ cells }, spieler, tiefe, DameControl.KNOTEN]); const ms = performance.now() - t0; return { z, ms }; };
    for (const q of starkePositionen) { const m = await messe(q.cells, q.p, ST.stark.tiefe); zeiten.push(m.ms); }
    const mehrDamen = [
      { WD: [56, 58, 63], BD: [0, 5, 7], W: [44, 45], B: [18, 19] },
      { WD: [60, 61, 62, 63], BD: [0, 1, 2, 3], W: [], B: [] },
      { WD: [56, 57], BD: [6, 7], W: [40, 41, 42, 43], B: [20, 21, 22, 23] },
      { WD: [56, 58, 60, 62], BD: [1, 3, 5, 7], W: [41, 43], B: [17, 19, 21, 34, 36, 38] }   // viele Schlagwege
    ];
    const endspiel = [];
    for (const o of mehrDamen) { const cells = Array(64).fill(null); for (const k of ['W', 'B', 'WD', 'BD']) (o[k] || []).forEach(i => cells[i] = k); const m = await messe(cells, 'W', ST.stark.tiefe); endspiel.push(Math.round(m.ms)); zeiten.push(m.ms); if (!m.z) out.push('Endspiel: kein Zug'); }
    const mittelMs = zeiten.reduce((x, y) => x + y, 0) / zeiten.length, maxMs = Math.max(...zeiten);
    if (mittelMs >= 400) out.push(`Stark im Mittel ${Math.round(mittelMs)} ms`);
    if (maxMs > 1500) out.push(`Stark höchstens ${Math.round(maxMs)} ms`);
    // PS-35: Rechengrenze: nur vollständig bewertete Züge zählen, der erste gilt immer
    { const cells = Array(64).fill(null); [[40, 'W'], [50, 'W'], [32, 'B'], [24, 'B'], [33, 'B']].forEach(([i, v]) => cells[i] = v);
      const erster = DameEntity.dameZuege(cells, 'W')[0], key = z => `${z.von}>${z.pfad.join('>')}`;
      for (const grenze of [1, 5, 50]) {
        const z = AIEngines.dame({ cells }, 'W', 4, grenze);
        if (!z || !DameEntity.dameZuege(cells, 'W').some(q => key(q) === key(z))) out.push(`PS-35: Grenze ${grenze}: kein zulässiger Zug`);
        else if (grenze < 50 && key(z) !== key(erster)) out.push(`PS-35: Grenze ${grenze}: ${key(z)} statt des ersten vollständig bewerteten Zugs ${key(erster)}`);
      }
      const voll = AIEngines.dame({ cells }, 'W', 4, DameControl.KNOTEN);
      if (!voll || key(voll) === key(erster)) out.push(`PS-35: die Stellung unterscheidet die Züge nicht (${voll && key(voll)})`); }
    // PS-35: Stark gegen Mittel, 20 Partien mit fester Saat, Farben wechseln: mehr Siege als Niederlagen
    { let siege = 0, nied = 0;
      for (let i = 0; i < 20; i++) {
        const farbe = i % 2 ? 'B' : 'W', w = farbe === 'W' ? 'stark' : 'mittel', b = farbe === 'W' ? 'mittel' : 'stark';
        const { sieger } = partie(5000 + i * 104729, w, b, false);
        if (sieger === farbe) siege++; else if (sieger === 'W' || sieger === 'B') nied++;
      }
      starkMittel = `${siege}:${nied}`;
      if (siege <= nied) out.push(`PS-35: Stark gegen Mittel ${siege} Siege, ${nied} Niederlagen`); }
    // PS-23: Worker-Quelltext allein ausgeführt liefert für 10 Stellungen dieselben Züge; kein Rückfall auf die Seite
    const festeStellungen = [];
    { let s = 777; const zuf = () => (s = (s * 16807) % 2147483647) / 2147483647; const e = new DameEntity(); let n = 0;
      while (!e.finished && festeStellungen.length < 10 && n < 300) { if (n % 4 === 1) festeStellungen.push({ cells: [...e.cells], p: e.currentPlayer }); const zz = e.zuege(); const z = zz[Math.floor(zuf() * zz.length)]; e.zieh(z.von, z.pfad); n++; } }
    for (const o of [{ WD: [32], B: [33, 19, 10, 49] }, { WD: [56], B: [24, 15, 23] }, { W: [42], B: [34, 27, 20, 4] }]) { const cells = Array(64).fill(null); for (const k of ['W', 'B', 'WD', 'BD']) (o[k] || []).forEach(i => cells[i] = k); if (festeStellungen.length < 10) festeStellungen.push({ cells, p: 'W' }); else festeStellungen.push({ cells, p: 'W' }); }
    const src = `const AIEngines = { ${AIEngines.dameZuege.toString()}, ${AIEngines.dameSetze.toString()}, ${AIEngines.dame.toString()} };
      self.onmessage = (e) => { const { id, args } = e.data; try { self.postMessage({ id, zug: AIEngines.dame(...args) }); } catch (err) { self.postMessage({ id, fehler: String(err) }); } };`;
    const w = new Worker(URL.createObjectURL(new Blob([src], { type: 'application/javascript' })));
    const imWorker = (args) => new Promise((ok) => { w.onmessage = (m) => ok(m.data); w.postMessage({ id: 1, args }); });
    let gleich = 0;
    for (const q of festeStellungen) {
      const args = [{ cells: q.cells }, q.p, 2, DameControl.KNOTEN];
      const aus = await imWorker(args), hier = AIEngines.dame(...args);
      if (aus.fehler) { out.push(`PS-23: Worker allein rechnet nicht: ${aus.fehler}`); break; }
      if (JSON.stringify(aus.zug) === JSON.stringify(hier)) gleich++; else out.push(`PS-23: Worker und Seite weichen ab bei ${JSON.stringify(q.cells.map((v, i) => v ? i + v : null).filter(Boolean)).slice(0, 80)}`);
    }
    w.terminate();
    if (festeStellungen.length < 10 || gleich !== festeStellungen.length) out.push(`PS-23: ${gleich} von ${festeStellungen.length} Stellungen gleich`);
    // Rückfall: AIStrategy rechnet im Worker, der Zähler bleibt 0
    const s = new AIStrategy();
    if (typeof s.rueckfaelle !== 'number') out.push('PS-23: AIStrategy hat keinen Zähler rueckfaelle');
    for (const q of festeStellungen.slice(0, 5)) await s.chooseMove('dame', [{ cells: q.cells }, q.p, 2, DameControl.KNOTEN]);
    if (!s._worker || s.rueckfaelle !== 0) out.push(`PS-23: Rückfall auf die Seite ${s.rueckfaelle} (Worker ${!!s._worker})`);
    if (ai.rueckfaelle !== 0) out.push(`PS-23: gemeinsame AIStrategy mit Rückfällen: ${ai.rueckfaelle}`);
    // Partie über die Control mit dem Worker: Rückfälle bleiben 0
    c.setMode(true); c.restartGame(); c.setMode(true); c.setZufall(() => 0.999); c.setDifficulty('mittel');
    c.handleFeldClick(43); c.handleFeldClick(35);
    const o = await c.performAiAction();
    if (o.invalid || !o.zug) out.push('Computerzug über die Control fehlgeschlagen');
    if (c.aiStrategy.rueckfaelle !== 0) out.push(`PS-23: Rückfälle nach Computerzug ${c.aiStrategy.rueckfaelle}`);
    c.setMode(false);
    return { out, mess: `Stark ${stark.siege}/20 (Niederlagen ${stark.nied}, offen oder Remis ${stark.remis}), Mittel ${mittel.siege}/20 (Niederlagen ${mittel.nied}); Stark gegen Mittel ${starkMittel}; Rechenzeit Stark im Worker: Mittel ${Math.round(mittelMs)} ms, Höchstwert ${Math.round(maxMs)} ms bei ${zeiten.length} Stellungen; Endspiele mit Damen ${endspiel.join('/')} ms` };
  });
  const f = p.fehler; await zu(p);
  console.log('       Messwerte da_staerke: ' + r.mess);
  pruefe(r.out.length === 0 && f.length === 0, [...r.out, ...f].join('; '));
});

// ---------- AK-10: "?" und Regelkarten (PS-19) ----------
test('da_hilfe', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.dame, c = g.control, ui = g.ui, warte = ms => new Promise(r => setTimeout(r, ms));
    const stand = () => JSON.stringify(g.boundary.getEntitySnapshot());
    const knopf = document.querySelector('#dame-view .hilfe-knopf');
    if (!knopf) return ['kein ?-Knopf'];
    c.setMode(false); c.restartGame(); ui.render();
    ui.handleSquareClick(43); ui.handleSquareClick(35); ui.handleSquareClick(16); ui.handleSquareClick(24);
    const s0 = stand();
    knopf.click();
    const hilfe = document.getElementById('dahilfe');
    if (hilfe.hidden) out.push('Karten nicht sichtbar');
    if (hilfe.querySelectorAll('.da-karte').length !== 3) out.push(`${hilfe.querySelectorAll('.da-karte').length} Karten`);
    if (hilfe.querySelectorAll('.da-karte svg').length < 3) out.push('Mini-Bretter fehlen');
    const titel = [...hilfe.querySelectorAll('.da-karte h3')].map(h => h.textContent).join('|');
    if (!/Ziehen/.test(titel) || !/Schlagen/.test(titel) || !/Dame/.test(titel)) out.push(`Titel der Karten: ${titel}`);
    if (hilfe.getAttribute('aria-modal') !== 'true' || hilfe.getAttribute('role') !== 'dialog') out.push('Karten: kein modaler Dialog');
    if (document.activeElement !== hilfe) out.push('Karten: Fokus nicht im Dialog');
    hilfe.querySelector('.da-hilfe-schliessen').click();
    if (!hilfe.hidden) out.push('Schließen schließt nicht');
    if (document.activeElement !== knopf) out.push('Karten zu: Fokus kehrt nicht zum ?-Knopf zurück');
    if (stand() !== s0) out.push('Schließen ändert die Stellung');
    // Esc schließt, Stellung unverändert
    knopf.click();
    hilfe.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (!hilfe.hidden || stand() !== s0) out.push('Esc schließt die Karten nicht oder ändert die Stellung');
    // Übung wiederholen, danach Stellung wie vorher
    knopf.click(); hilfe.querySelector('.da-hilfe-uebung').click();
    const banner = document.getElementById('dauebung');
    if (banner.hidden || !/1 von 5/.test(banner.textContent)) out.push('Übung startet nicht');
    banner.querySelector('.da-ueberspringen').click();
    if (stand() !== s0) out.push('Übung ändert die Stellung');
    if (!/Tippe/.test(document.getElementById('dastatus').textContent)) out.push('Status nach Übung falsch');
    // PS-19: ? öffnen, während der Computer gleich zieht; zehnmal schnell tippen
    c.restartGame(); c.setMode(true); c.setZufall(() => 0.999); ui.render();
    ui.handleSquareClick(43); ui.handleSquareClick(35);   // jetzt ist der Computer dran
    for (let i = 0; i < 10; i++) knopf.click();
    const s1 = stand();
    await warte(1500);
    if (hilfe.hidden) out.push('nach zehnmal Tippen nicht offen');
    if (stand() !== s1) out.push('Computer zieht, während die Karten offen sind');
    hilfe.querySelector('.da-hilfe-schliessen').click();
    await warte(2500);
    if (c.getCurrentPlayer() !== 'W' || c.getBoardState().filter(v => v === 'B').length !== 16 || c.getBoardState().slice(24, 32).every(v => v === null)) out.push('Computer zieht nach dem Schließen nicht');
    // Karten öffnen, während der Computer schon rechnet (Rechnung dauert hier 800 ms)
    const echt = c.aiStrategy;
    c.aiStrategy = { chooseMove: (e, a) => new Promise(r => setTimeout(() => r(AIEngines[e](...a)), 800)) };
    c.restartGame(); c.setMode(true); ui.render();
    ui.handleSquareClick(43); ui.handleSquareClick(35);
    await warte(600);                  // Verzögerung vorbei, Rechnung läuft
    knopf.click();
    const s2 = stand();
    await warte(1200);
    if (stand() !== s2) out.push('Computerzug landet, obwohl die Karten offen sind');
    hilfe.querySelector('.da-hilfe-schliessen').click();
    await warte(2200);
    if (c.getBoardState().slice(24, 32).every(v => v === null)) out.push('Computer zieht nach der Pause während der Rechnung nicht');
    // Neustart während der Rechnung, dann sofort ein Zug: der Computer zieht trotzdem
    c.restartGame(); c.setMode(true); ui.render();
    ui.handleSquareClick(43); ui.handleSquareClick(35);
    await warte(600);
    c.restartGame(); ui.render(); ui.handleSquareClick(45); ui.handleSquareClick(37);
    await warte(2500);
    if (c.getCurrentPlayer() !== 'W' || c.getBoardState().filter(v => v === 'B').length !== 16 || c.getBoardState()[37] !== 'W') out.push('Partie hängt nach Neustart während der Rechnung');
    c.aiStrategy = echt; c.setMode(false);
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.length === 0 && f.length === 0, [...r, ...f].join('; '));
});

// ---------- AK-11: Zug zurück, Speichern, kaputter Stand (PS-20, PS-21, PS-32) ----------
test('da_speicher', async () => {
  const out = [];
  const ctx = await browser.newContext({ viewport: HOCH, hasTouch: true, isMobile: true });
  let p = await seite({ ctx, gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.dame, c = g.control, e = g.entity, ui = g.ui, S = window.__stand;
    c.setMode(false); c.restartGame(); ui.render();
    // PS-20: Zug zurück nach Mehrfachsprung: alle Steine wieder da
    __lade({ W: [42, 50], B: [34, 27, 20, 4] });
    const vor = window.__snap();
    ui.handleSquareClick(42); ui.handleSquareClick(26); ui.handleSquareClick(28); ui.handleSquareClick(12);
    if (c.getBoardState().filter(v => v === 'B').length !== 1) out.push('Sprung nicht ausgeführt');
    ui.handleUndo();
    if (window.__snap() !== vor) out.push('Zug zurück nach Mehrfachsprung: Stellung anders');
    if (c.getBoardState().filter(v => v === 'B').length !== 4) out.push('geschlagene Steine kommen nicht wieder');
    // PS-32: derselbe Zug erneut: dieselbe Stellung und derselber Spielstand
    ui.handleSquareClick(42); ui.handleSquareClick(26); ui.handleSquareClick(28); ui.handleSquareClick(12);
    const nachSprung = window.__snap();
    ui.handleUndo();
    ui.handleSquareClick(42); ui.handleSquareClick(26); ui.handleSquareClick(28); ui.handleSquareClick(12);
    if (window.__snap() !== nachSprung) out.push('PS-32: gleicher Zug nach Zug zurück ergibt anderen Stand');
    // Zug zurück mitten in der Sprungfolge: nur die Auswahl verfällt, frühere Züge bleiben
    __lade({ W: [42, 50], B: [26, 27, 20, 4] });
    ui.handleSquareClick(50); ui.handleSquareClick(49);   // Weiß zieht
    ui.handleSquareClick(26); ui.handleSquareClick(34);   // Schwarz zieht: jetzt muss Weiß schlagen (42 über 34, 27, 20)
    const mitte = window.__snap();
    ui.handleSquareClick(42); ui.handleSquareClick(26);
    if (!c.canUndo()) out.push('mitten in der Sprungfolge ist Zug zurück nicht möglich');
    ui.handleUndo();
    if (window.__snap() !== mitte || c.getSelected() !== null || window.__klassen('weg').length || window.__klassen('selected').length) out.push('mitten in der Sprungfolge: mehr als die Auswahl verfällt');
    if (c.getBoardState()[49] !== 'W' || c.getBoardState()[34] !== 'B') out.push('mitten in der Sprungfolge: früherer Zug zurückgenommen');
    ui.handleUndo();
    if (c.getBoardState()[34] === 'B' || c.getBoardState()[26] !== 'B') out.push('danach nimmt Zug zurück den letzten Zug nicht zurück');
    // gegen den Computer: der Mensch-Zug samt Computerzug wird zurückgenommen
    c.setMode(true); c.setZufall(() => 0.999); c.restartGame(); c.setMode(true); ui.render();
    const start = window.__snap();
    ui.handleSquareClick(43); ui.handleSquareClick(35);
    await c.performAiAction();
    if (!c.canUndo()) out.push('gegen den Computer: Zug zurück nicht möglich');
    ui.handleUndo();
    if (window.__snap() !== start) out.push('gegen den Computer: Zug zurück stellt Anfang nicht her');
    // nach Partieende aus
    c.setMode(false); __lade({ W: [35], B: [27] });
    ui.handleSquareClick(35); ui.handleSquareClick(19);
    if (!c.isGameOver() || c.canUndo() || !c.undoMove().invalid) out.push('nach Partieende ist Zug zurück nicht aus');
    c.restartGame(); ui.render();
    return out;
  });
  out.push(...r, ...p.fehler);
  // Neuladen mitten in der Partie: Stand bleibt, Zug zurück wird nicht gespeichert, Format steht
  await p.evaluate(() => { const g = window.__brett.dame; g.control.setMode(false); g.control.restartGame(); g.ui.render(); g.ui.handleSquareClick(43); g.ui.handleSquareClick(35); g.ui.handleSquareClick(17); g.ui.handleSquareClick(25); });
  await p.waitForTimeout(400);
  const vorReload = await p.evaluate(() => window.__snap());
  const doc = await p.evaluate(async () => { const d = await window.__brett.dame.boundary.loadGame(); return d; });
  if (!doc || !doc.entity || doc.entity.formatversion !== 1) out.push(`Spielstand ohne Formatversion: ${JSON.stringify(doc).slice(0, 120)}`);
  else if (Object.keys(doc.entity).sort().join() !== 'cells,currentPlayer,finished,formatversion,ruhe,stellungen,winner') out.push(`Felder des Spielstands: ${Object.keys(doc.entity)}`);
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.dame);
  await p.waitForTimeout(500);
  await p.evaluate(HILFE);
  const nachReload = await p.evaluate(() => ({ snap: window.__snap(), undo: window.__brett.dame.control.canUndo(), sel: window.__brett.dame.control.getSelected() }));
  if (nachReload.snap !== vorReload) out.push('Neuladen mitten in der Partie: Stand weicht ab');
  if (nachReload.undo || nachReload.sel !== null) out.push('Zug zurück oder Auswahl überlebt das Neuladen');
  // Neuladen gegen den Computer: Modus bleibt
  await p.evaluate(() => { const g = window.__brett.dame; g.control.setMode(true); g.control.setZufall(() => 0.999); g.ui.render(); });
  await p.evaluate(() => { const g = window.__brett.dame; g.ui.handleSquareClick(41); g.ui.handleSquareClick(33); });
  await p.waitForTimeout(2500);
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.dame);
  await p.waitForTimeout(500);
  const ki = await p.evaluate(() => ({ vs: window.__brett.dame.control.vsAI, radio: document.querySelector('#damode input[value=ai]').checked }));
  if (!ki.vs || !ki.radio) out.push(`Modus nach Neuladen: ${JSON.stringify(ki)}`);
  // PS-21: kaputte Stände: Neustart ohne Skriptfehler; Fehlalarm: alter gültiger Stand lädt weiter
  await p.evaluate(HILFE);
  const gut = await p.evaluate(() => { const g = window.__brett.dame; g.control.setMode(false); g.control.restartGame(); g.ui.handleSquareClick(44); g.ui.handleSquareClick(36); return g.boundary.getEntitySnapshot(); });
  const kaputt = (f) => { const x = JSON.parse(JSON.stringify(gut)); f(x); return x; };
  const FaelleKaputt = [
    ['falsche Version', kaputt(x => x.formatversion = 2)], ['keine Version', kaputt(x => delete x.formatversion)],
    ['zu kurz', kaputt(x => x.cells.pop())], ['zu lang', kaputt(x => x.cells.push(null))], ['kein Feld-Array', kaputt(x => x.cells = 'abc')],
    ['fremder Wert', kaputt(x => x.cells[30] = 'X')], ['Zahl im Feld', kaputt(x => x.cells[30] = 7)],
    ['17 weiße Steine', kaputt(x => { x.cells[25] = 'W'; x.cells[26] = 'W'; x.cells[27] = 'W'; x.cells[28] = 'W'; x.cells[29] = 'W'; })],
    ['weißer Stein auf der Umwandlungsreihe', kaputt(x => { x.cells[3] = 'W'; })], ['schwarzer Stein auf der Umwandlungsreihe', kaputt(x => { x.cells[60] = 'B'; })],
    ['beendete Partie', kaputt(x => { x.finished = true; x.winner = 'W'; })], ['Sieger ohne Ende', kaputt(x => { x.winner = 'B'; })],
    ['falscher Spieler', kaputt(x => x.currentPlayer = 'X')], ['Ruhezähler zu groß', kaputt(x => x.ruhe = 61)], ['Ruhezähler negativ', kaputt(x => x.ruhe = -1)], ['Ruhezähler Text', kaputt(x => x.ruhe = '3')],
    ['Zähler dreimal', kaputt(x => x.stellungen = { abc: 3 })], ['Zähler Liste', kaputt(x => x.stellungen = [1])], ['Zähler fehlt', kaputt(x => delete x.stellungen)],
    ['Spieler am Zug kann nicht ziehen', kaputt(x => { x.currentPlayer = 'W'; x.cells = x.cells.map(v => (v && v[0] === 'W') ? null : v); })]
  ];
  for (const [name, bad] of FaelleKaputt) {
    const res = await p.evaluate(async (bad) => {
      const g = window.__brett.dame, c = g.control;
      await g.boundary._gameRepo.save({ vsAI: false, entity: bad });
      let fehler = null;
      try { await c.restoreGame(); g.ui.render(); } catch (e) { fehler = String(e); }
      const b = c.getBoardState();
      const start = b.filter(v => v === 'W').length === 16 && b.filter(v => v === 'B').length === 16 && b[43] === 'W' && b[8] === 'B' && c.getCurrentPlayer() === 'W';
      await new Promise(r => setTimeout(r, 60));
      const gesp = await g.boundary.loadGame();
      return { fehler, start, geloescht: !gesp };
    }, bad);
    if (res.fehler) out.push(`kaputter Stand "${name}": Fehler ${res.fehler}`);
    else if (!res.start) out.push(`kaputter Stand "${name}": wurde geladen statt Neustart`);
    else if (!res.geloescht) out.push(`kaputter Stand "${name}": bleibt gespeichert`);
  }
  const alt = await p.evaluate(async (gut) => {
    const g = window.__brett.dame, c = g.control;
    await g.boundary._gameRepo.save({ vsAI: false, entity: gut });
    await c.restoreGame(); g.ui.render();
    return JSON.stringify(g.boundary.getEntitySnapshot()) === JSON.stringify(gut) && c.getBoardState()[36] === 'W';
  }, gut);
  if (!alt) out.push('alter gültiger Stand lädt nicht');
  // keine Daten: Neustart
  await p.evaluate(async () => { await window.__brett.dame.boundary._gameRepo.clear(); });
  await p.reload(); await p.waitForFunction(() => window.__brett && window.__brett.dame);
  await p.waitForTimeout(400);
  if ((await p.evaluate(() => window.__brett.dame.control.getBoardState()[43])) !== 'W') out.push('ohne gespeicherte Partie: kein Start');
  out.push(...p.fehler.map(f => 'Skriptfehler: ' + f));
  await ctx.close();
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-12: Bilder aus Spielersicht (PS-17, PS-22) ----------
// Liest Bildpunkte aus dem Bildschirmfoto (im Browser dekodiert): zählt Farben und liefert Farben an Punkten.
async function bildAuswertung(p, png, farben, punkte) {
  return p.evaluate(async ({ b64, farben, punkte }) => {
    const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
    const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
    const cx = cv.getContext('2d'); cx.drawImage(img, 0, 0);
    const k = img.width / window.innerWidth;
    const d = cx.getImageData(0, 0, cv.width, cv.height).data, zahl = {};
    for (const [name, [r, g, b]] of Object.entries(farben)) {
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - r) < 26 && Math.abs(d[i + 1] - g) < 26 && Math.abs(d[i + 2] - b) < 26) n++;
      zahl[name] = n;
    }
    const pix = {};
    for (const [name, [x, y]] of Object.entries(punkte || {})) { const q = cx.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data; pix[name] = [q[0], q[1], q[2]]; }
    return { zahl, pix };
  }, { b64: png.toString('base64'), farben, punkte });
}
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const kontrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const FARBEN = { ring: [10, 132, 255], ziel: [52, 199, 89], krone: [255, 204, 0] };
test('da_bilder', async () => {
  const ziel = process.env.BILDER;
  if (ziel) fs.mkdirSync(ziel, { recursive: true });
  const p = await seite({ vp: HOCH });
  await p.evaluate(HILFE);
  const out = [], bilder = {}, texte = [];
  const feldMitte = async (i) => p.evaluate(i => { const r = document.querySelectorAll('#daboard .da-feld')[i].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: r.left, t: r.top, w: r.width }; }, i);
  const foto = async (name, punkte) => {
    await p.waitForTimeout(150);
    texte.push(await p.evaluate(() => document.getElementById('dame-view').innerText + ' ' + [...document.querySelectorAll('#dame-view [aria-label]')].map(e => e.getAttribute('aria-label')).join(' ')));
    const png = await p.screenshot();
    bilder[name] = png;
    if (ziel) fs.writeFileSync(path.join(ziel, `dame-${name}.png`), png);
    return bildAuswertung(p, png, FARBEN, punkte);
  };
  // Übung, Schritt für Schritt
  for (let n = 1; n <= 5; n++) {
    const z = await foto(`uebung-${n}`);
    if (z.zahl.ziel < 100) out.push(`Übung ${n}: Zielfeld ${z.zahl.ziel} Bildpunkte`);
    if (n === 4) { const t = await p.evaluate(() => window.__klassen('ziel').length); if (t !== 1) out.push('Übung 4: kein Zielfeld'); }
    const tipps = n === 3 ? 3 : 1;
    for (let t = 0; t < tipps; t++) {
      await p.evaluate(() => { window.__brett.dame.ui.handleSquareClick(window.__klassen('ziel')[0]); });
      if (n === 3 && t === 0) { const zz = await foto('uebung-3-mitte'); if (zz.zahl.ziel < 100) out.push(`Übung 3 mitten im Sprung: Zielfeld ${zz.zahl.ziel} Bildpunkte`); }
    }
    await p.waitForTimeout(1700);
  }
  await foto('uebung-geschafft');
  await p.evaluate(() => document.querySelector('#dauebung .da-los').click());
  // Partie: Start, Ringe, Schlagzwang, Dame, Ende, Unentschieden
  await p.evaluate(() => { const c = window.__brett.dame.control; c.setMode(false); c.restartGame(); window.__brett.dame.ui.render(); });
  const w1 = await feldMitte(43), b1 = await feldMitte(10), leer = await feldMitte(27);
  const f27 = await p.evaluate(() => { const r = document.querySelectorAll('#daboard .da-feld')[27].getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width }; });
  const start = await foto('start', { weiss: [w1.x - w1.w * 0.35, w1.y], schwarz: [b1.x - b1.w * 0.35, b1.y], feld: [f27.l + f27.w * 0.1, f27.t + f27.w * 0.1] });
  const k1 = kontrast(start.pix.weiss, start.pix.feld), k2 = kontrast(start.pix.schwarz, start.pix.feld), k3 = kontrast(start.pix.weiss, start.pix.schwarz);
  if (k1 < 3) out.push(`Kontrast weißer Stein zu Feld ${k1.toFixed(2)}`);
  if (k2 < 3) out.push(`Kontrast schwarzer Stein zu Feld ${k2.toFixed(2)}`);
  if (k3 < 4.5) out.push(`Kontrast Weiß zu Schwarz ${k3.toFixed(2)}`);
  await p.evaluate(() => window.__brett.dame.ui.handleSquareClick(43));
  const ziehen = await foto('ziehen');
  if (ziehen.zahl.ring < 300) out.push(`Ringe: ${ziehen.zahl.ring} Bildpunkte`);
  if (ziehen.zahl.ziel < 100) out.push(`Zielfeld nach Antippen: ${ziehen.zahl.ziel} Bildpunkte`);
  await p.evaluate(() => window.__lade({ W: [35, 46, 52], B: [27, 4, 6, 12] }));
  const zwang = await foto('schlagzwang');
  if (zwang.zahl.ring < 100) out.push(`Schlagzwang: Ring ${zwang.zahl.ring} Bildpunkte`);
  await p.evaluate(() => window.__lade({ W: [42], B: [34, 27, 20, 4, 15] }));
  await p.evaluate(() => { const u = window.__brett.dame.ui; u.handleSquareClick(42); u.handleSquareClick(26); });
  const sprung = await foto('mehrfachsprung');
  if (sprung.zahl.ziel < 100) out.push(`Mehrfachsprung: Zielfeld ${sprung.zahl.ziel} Bildpunkte`);
  await p.evaluate(() => window.__lade({ WD: [56, 58], BD: [7], W: [41, 44], B: [9, 14, 21] }));
  const dame = await foto('dame');
  if (dame.zahl.krone < 150) out.push(`Dame: Krone nur ${dame.zahl.krone} Bildpunkte`);
  await p.evaluate(() => window.__lade({ WD: [56], B: [24, 15, 23] }));
  await p.evaluate(() => window.__brett.dame.ui.handleSquareClick(56));
  await foto('dame-schlaegt');
  // letzter Zug des Gegners
  await p.evaluate(async () => { const g = window.__brett.dame, c = g.control; c.setMode(true); c.setZufall(() => 0.999); c.setDifficulty('leicht'); g.entity.loadFromJSON(window.__stand({ W: [35, 46], B: [27, 12, 8], p: 'B' })); g.ui.render(); await g.ui.runAiTurn(); });
  await foto('computer-zug');
  await p.evaluate(() => { const g = window.__brett.dame; g.control.setMode(false); g.entity.loadFromJSON(window.__stand({ W: [35], B: [27] })); g.ui.render(); g.ui.handleSquareClick(35); g.ui.handleSquareClick(19); });
  await foto('ende-sieg');
  await p.evaluate(() => { const g = window.__brett.dame; g.control.setMode(false); g.ui.handleReset(); });
  await p.evaluate(() => { const g = window.__brett.dame; g.entity.loadFromJSON(window.__stand({ WD: [63], BD: [0], ruhe: 58 })); g.ui.render(); g.ui.handleSquareClick(63); g.ui.handleSquareClick(62); g.ui.handleSquareClick(0); g.ui.handleSquareClick(1); });
  await foto('ende-remis');
  const remisBrett = await p.locator('#daboard').screenshot(), remisText = await p.evaluate(() => document.getElementById('dastatus').textContent);
  // Wiederholbarkeit des Bildes (PS-17): ein zweiter, getrennter Lauf mit derselben Stellung ergibt dasselbe Bild
  { const p2 = await seite({ vp: HOCH, gesehen: true });
    await p2.evaluate(HILFE);
    await p2.evaluate(() => { const g = window.__brett.dame; g.control.setMode(false); g.entity.loadFromJSON(window.__stand({ WD: [63], BD: [0], ruhe: 58 })); g.ui.render(); g.ui.handleSquareClick(63); g.ui.handleSquareClick(62); g.ui.handleSquareClick(0); g.ui.handleSquareClick(1); });
    await p2.waitForTimeout(300);
    const b2 = await p2.locator('#daboard').screenshot(), t2 = await p2.evaluate(() => document.getElementById('dastatus').textContent);
    if (Buffer.compare(b2, remisBrett) !== 0 || t2 !== remisText) out.push('Bild nicht wiederholbar (zweiter Lauf weicht ab)');
    out.push(...p2.fehler); await zu(p2); }
  await p.evaluate(() => { window.__brett.dame.ui.handleReset(); });
  await p.evaluate(() => document.querySelector('#dame-view .hilfe-knopf').click());
  await foto('hilfe-karten');
  await p.evaluate(() => document.querySelector('#dahilfe .da-hilfe-schliessen').click());
  // keine Fachwörter, keine Unicode-Figuren, eigene Zeichnung für Steine und Kachel
  const alles = texte.join(' ');
  const fach = alles.match(/Mehrheitsregel|Kehrtwende|Halbzug|Halbzüge|Entity|Boundary|Control\b/i);
  if (fach) out.push(`Fachwort sichtbar: ${fach[0]}`);
  const figuren = await p.evaluate(() => { const t = document.getElementById('dame-view').innerHTML + document.querySelector('.tabBtn[data-tab=dame]').innerHTML; return /[♔-♟⛀-⛃]/.test(t); });
  if (figuren) out.push('Unicode-Spielfiguren im Bild von Dame');
  const kachel = await p.evaluate(() => { const k = document.querySelector('.tabBtn[data-tab=dame]'); return !!k && !!k.querySelector('svg') && /Dame/.test(k.textContent); });
  if (!kachel) out.push('Kachel Dame ohne Bild oder Namen');
  const steine = await p.evaluate(() => { window.__lade({ W: [43], WD: [40] }); const f = [...document.querySelectorAll('#daboard .da-feld')]; return f.filter(e => e.querySelector('svg.da-stein')).length; });
  if (steine !== 2) out.push(`Steine als eigene Zeichnung: ${steine}`);
  out.push(...p.fehler);
  await zu(p);
  // Querformat
  const q = await seite({ vp: QUER, gesehen: true });
  await q.evaluate(HILFE);
  await q.evaluate(() => { window.__lade({ W: [35, 46, 52], B: [27, 4, 6, 12] }); });
  if (ziel) fs.writeFileSync(path.join(ziel, 'dame-quer.png'), await q.screenshot());
  out.push(...q.fehler);
  await zu(q);
  pruefe(out.length === 0, out.join('; '));
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
    catch (e) { rot++; console.log(`FEHLER ${t.name}: ${String(e.message).slice(0, 600)}`); }
  }
  await browser.close(); server.kill();
  console.log(rot ? `\n${rot} Test(s) rot.` : '\nAlle Tests grün.');
  process.exit(rot ? 1 : 0);
})();
