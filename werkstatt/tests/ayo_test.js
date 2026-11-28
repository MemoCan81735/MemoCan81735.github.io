// Tests für S-W30 (Ayo, Ayò Ọlọ́pọ́n in den Brettspielen).
// Aufruf: node werkstatt/tests/ayo_test.js [ORDNER]   (NUR=name1,name2 wählt Tests, BILDER=ordner speichert Bilder)
// Mulden 0 bis 5 gehören Süd (A, Mensch), 6 bis 11 Nord (B, Computer); cells[12] und cells[13] sind die Sammelmulden von A und B.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;
const SCHLUESSEL = 'brettspiele.einstellungen';
const AYO = 'brettspiele.ayo';

let browser;
// opts.gesehen: Übung schon gesehen; opts.ton: Ton an; opts.vorher: eigenes Init-Skript; opts.quer: Querformat; opts.ohne3d: Ansicht 2D (Standard); opts.ctx
async function seite(opts = {}) {
  const ctx = opts.ctx || await browser.newContext({ viewport: opts.quer ? { width: 915, height: 412 } : { width: 412, height: 915 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  await p.addInitScript(([k, t, g, ton, ohne3d]) => {
    try {
      if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify({ formatversion: 1, ton: ton, stufen: {}, ansicht: ohne3d ? { ayo: '2d' } : {}, lernen: {}, muehleEinfuehrung: true, dameEinfuehrung: true }));
      if (g && !localStorage.getItem(t)) localStorage.setItem(t, JSON.stringify({ formatversion: 1, einfuehrung: true }));
    } catch (e) { }
  }, [SCHLUESSEL, AYO, !!opts.gesehen, !!opts.ton, opts.ohne3d !== false]);
  if (opts.vorher) await p.addInitScript(opts.vorher);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.ayo, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=ayo]').click());
  await p.waitForTimeout(250);
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// Hilfen im Browser: Referenzregeln (bewusst einfach und unabhängig vom Regelwerk der Seite), Stellungen, Zufall
const HILFE = () => {
  const SUED = [0, 1, 2, 3, 4, 5], NORD = [6, 7, 8, 9, 10, 11];
  const REF = {
    seite: p => (p === 'A' ? SUED : NORD),
    gegner: p => (p === 'A' ? 'B' : 'A'),
    saeen(c, von) {
      const n = [...c]; let k = n[von], i = von; n[von] = 0; const g = [];
      while (k > 0) { i = (i + 1) % 12; if (i === von) continue; n[i]++; g.push(i); k--; }
      return { n, last: i, g };
    },
    roh(c, p, von) {
      const { n, last, g } = REF.saeen(c, von), opp = REF.seite(REF.gegner(p)), geschl = [];
      if (opp.includes(last)) { let i = last; while (opp.includes(i) && (n[i] === 2 || n[i] === 3)) { geschl.push(i); i = (i + 11) % 12; } }
      const rest = opp.reduce((s, i) => s + (geschl.includes(i) ? 0 : n[i]), 0);
      return { n, last, g, geschl, gs: geschl.length > 0 && rest === 0 };
    },
    zuege(c, p) {
      let m = REF.seite(p).filter(i => c[i] > 0);
      const opp = REF.seite(REF.gegner(p));
      if (opp.every(i => c[i] === 0)) m = m.filter(i => REF.saeen(c, i).g.some(j => opp.includes(j)));
      const ohne = m.filter(i => !REF.roh(c, p, i).gs);
      return ohne.length ? ohne : m;
    },
    zug(c, p, von) {
      const r = REF.roh(c, p, von), n = r.n.slice(), s = p === 'A' ? 12 : 13;
      n[12] = c[12]; n[13] = c[13];
      if (!r.gs) { for (const i of r.geschl) { n[s] += n[i]; n[i] = 0; } }
      return { cells: n, geschl: r.gs ? [] : r.geschl, verfallen: r.gs };
    }
  };
  window.__ref = REF;
  // Stellung: o = { m: {index: Samen}, A, B, p } ; Rest bis 48 wird auf die Sammelmulden verteilt (je höchstens 24)
  window.__stand = (o) => {
    const c = Array(14).fill(0);
    for (const [i, v] of Object.entries(o.m || {})) c[+i] = v;
    c[12] = o.A || 0; c[13] = o.B || 0;
    let rest = 48 - c.reduce((a, b) => a + b, 0);
    if (rest < 0) throw new Error('Stellung hat mehr als 48 Samen');
    while (rest > 0) { const k = c[12] <= c[13] ? 12 : 13, add = Math.min(rest, 24 - c[k]); if (add <= 0) throw new Error('Füllung nicht möglich'); c[k] += add; rest -= add; }
    return { formatversion: 1, cells: c, currentPlayer: o.p || 'A', finished: false, winner: null, halbzuege: o.h || 0, historie: o.historie || [c.join(',') + ':' + (o.p || 'A')], grund: null };
  };
  window.__ent = (o) => { const e = new AyoEntity(); if (!e.loadFromJSON(window.__stand(o))) throw new Error('Stellung abgelehnt'); return e; };
  window.__zuf = (seed) => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
};

// ---------- AK-1, AK-2, AK-16: Grundregeln (PS-1 bis PS-5, PS-20, PS-38) ----------
test('ay_regeln', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = ayoRegelwerk(), gl = window.__gleich;
    // PS-1 Aufstellung
    const e0 = new AyoEntity(), c0 = e0.cells;
    for (let i = 0; i < 12; i++) if (c0[i] !== 4) out.push(`Mulde ${i}: ${c0[i]}`);
    if (c0[12] !== 0 || c0[13] !== 0 || c0.length !== 14) out.push('Sammelmulden oder Länge falsch');
    if (c0.reduce((a, b) => a + b, 0) !== 48) out.push('Summe Start');
    if (e0.currentPlayer !== 'A') out.push('Süd muss beginnen');
    // PS-3 Säen
    const s3 = R.saeen(c0, 0);
    if (s3.cells[0] !== 0 || !gl(s3.cells.slice(1, 5), [5, 5, 5, 5]) || !gl(s3.gesaet, [1, 2, 3, 4]) || s3.letzte !== 4) out.push('Säen 4 Samen aus Mulde 0 falsch');
    // PS-4 11 und 12 Samen
    const mit = n => { const c = Array(14).fill(0); c[0] = n; return c; };
    const s11 = R.saeen(mit(11), 0);
    if (s11.letzte !== 11 || s11.cells[0] !== 0 || s11.gesaet.length !== 11) out.push('11 Samen: letzter nicht in Mulde 11');
    const s12 = R.saeen(mit(12), 0);
    if (s12.cells[0] !== 0) out.push('12 Samen: Startmulde nicht übersprungen (' + s12.cells[0] + ')');
    if (s12.letzte !== 1 || s12.cells[1] !== 2 || s12.gesaet.length !== 12) out.push('12 Samen: zweiter Umlauf falsch ' + JSON.stringify(s12));
    // PS-5 23 und 48 Samen
    const s23 = R.saeen(mit(23), 0);
    if (s23.cells[0] !== 0 || s23.cells[1] !== 3 || s23.cells[11] !== 2 || s23.letzte !== 1) out.push('23 Samen falsch ' + JSON.stringify(s23.cells));
    const s48 = R.saeen(mit(48), 0);
    if (s48.cells.reduce((a, b) => a + b, 0) !== 48 || s48.cells[0] !== 0 || s48.cells[1] !== 5 || s48.cells[5] !== 4 || s48.letzte !== 4) out.push('48 Samen falsch ' + JSON.stringify(s48.cells));
    // PS-20 ungültige Züge
    const e5 = window.__ent({ m: { 0: 2, 3: 0, 7: 5 }, p: 'A' }), vorher = JSON.stringify(e5.toJSON());
    const wirft = f => { try { f(); return false; } catch (x) { return true; } };
    for (const z of [3, 7, 12, 13, -1, 1.5, 'x', null, undefined, 99, NaN]) if (!wirft(() => e5.applyMove(z))) out.push('Ungültiger Zug angenommen: ' + String(z));
    if (JSON.stringify(e5.toJSON()) !== vorher) out.push('Ungültige Züge ändern den Stand');
    if (R.zug(c0, 'A', 7) !== null || R.zug(c0, 'A', 99) !== null || R.zug(c0, 'A', 'x') !== null) out.push('Regelwerk nimmt ungültigen Zug an');
    // PS-2 und PS-38: Eigenschaft über zufällige Stellungen gegen die Referenz
    const zuf = window.__zuf(7);
    for (let n = 0; n < 400; n++) {
      const c = Array(14).fill(0); let rest = 40;
      while (rest > 0) { const i = Math.floor(zuf() * 12), k = Math.min(rest, 1 + Math.floor(zuf() * 6)); c[i] += k; rest -= k; }
      c[12] = Math.floor(zuf() * 4); c[13] = Math.floor(zuf() * 4);
      for (const p of ['A', 'B']) {
        const soll = window.__ref.zuege(c, p), ist = R.zuege(c, p);
        if (!gl(soll, ist)) { out.push(`zuege ${p} ${JSON.stringify(c)}: soll ${soll} ist ${ist}`); break; }
        for (const v of ist) {
          const a = window.__ref.zug(c, p, v), b = R.zug(c, p, v);
          if (!b || !gl(a.cells, b.cells) || !gl(a.geschl, b.geschlagen) || a.verfallen !== b.verfallen) { out.push(`zug ${p} ${v} ${JSON.stringify(c)}`); break; }
          if (b.cells.reduce((x, y) => x + y, 0) !== c.reduce((x, y) => x + y, 0)) out.push('Summe verändert');
          const gegn = window.__ref.seite(window.__ref.gegner(p));
          if (b.geschlagen.some(i => !gegn.includes(i))) out.push('Schlag auf eigener Seite');
        }
      }
    }
    // PS-2 zwei Partien "erster erlaubter Zug" enden gleich, Summe 48 nach jedem Zug
    const spiel = () => { const e = new AyoEntity(); let n = 0; const f = []; while (!e.finished && n < 800) { e.applyMove(e.getValidMoves()[0]); if (e.cells.reduce((a, b) => a + b, 0) !== 48) out.push('Summe nach Zug ' + n); f.push(e.cells.join()); n++; } return { n, f: f.join('|'), fin: e.finished }; };
    const g1 = spiel(), g2 = spiel();
    if (g1.f !== g2.f) out.push('Zwei gleiche Partien enden verschieden');
    if (!g1.fin) out.push('Partie "erster Zug" endet nicht innerhalb 800 Zügen');
    // AK-16: kein Zufall, keine Zeit in Regelwerk und Entity
    for (const [n, f] of [['ayoRegelwerk', ayoRegelwerk.toString()], ['AyoEntity', AyoEntity.toString()], ['AyoBoundary', AyoBoundary.toString()]]) if (/Math\.random|Date\.now|new Date|performance\.now/.test(f)) out.push(n + ' erzeugt Zufall oder Zeit');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-3: Schlagen (PS-6 bis PS-8, PS-37) ----------
test('ay_schlagen', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = ayoRegelwerk(), gl = window.__gleich;
    // Süd 5 (2 Samen) endet in Nord 7; vorher 1 -> 2: Schlag
    const zug = (m, p, v, extra) => R.zug(window.__stand({ m, p, ...(extra || {}) }).cells, p, v);
    let z = zug({ 5: 2, 7: 1, 9: 4 }, 'A', 5);
    if (!z || !gl(z.geschlagen, [7]) || z.cells[12] < 2) out.push('Schlag mit 2 fehlt ' + JSON.stringify(z && z.geschlagen));
    if (z && z.cells[7] !== 0) out.push('Geschlagene Mulde nicht leer');
    // vorher 2 -> 3: Schlag
    z = zug({ 5: 2, 7: 2, 9: 4 }, 'A', 5);
    if (!z || !gl(z.geschlagen, [7])) out.push('Schlag mit 3 fehlt');
    // PS-7 danach 1 und 4 (und mehr): kein Schlag
    z = zug({ 5: 2, 7: 0, 9: 4 }, 'A', 5);
    if (!z || z.geschlagen.length) out.push('Schlag bei 1 Samen');
    z = zug({ 5: 2, 7: 3, 9: 4 }, 'A', 5);
    if (!z || z.geschlagen.length) out.push('Schlag bei 4 Samen');
    z = zug({ 5: 2, 7: 9, 9: 4 }, 'A', 5);
    if (!z || z.geschlagen.length) out.push('Schlag bei 10 Samen');
    // PS-8 Fehlalarm: letzter Samen auf eigener Seite bei 2 oder 3: kein Schlag
    z = zug({ 0: 3, 3: 1, 9: 4 }, 'A', 0);
    if (!z || z.geschlagen.length || z.cells[3] !== 2) out.push('Schlag auf eigener Seite bei 2');
    z = zug({ 0: 3, 3: 2, 9: 4 }, 'A', 0);
    if (!z || z.geschlagen.length || z.cells[3] !== 3) out.push('Schlag auf eigener Seite bei 3');
    // PS-37 Spiegelung: Nord 11 (2 Samen) endet in Süd 1 (vorher 1): Schlag zugunsten von Nord
    z = zug({ 11: 2, 1: 1, 8: 4 }, 'B', 11);
    if (!z || !gl(z.geschlagen, [1]) || z.cells[13] < 2) out.push('Spiegelung: Nord schlägt nicht ' + JSON.stringify(z && z.geschlagen));
    // Entity: Schlag landet in der Sammelmulde des Spielers, Summe bleibt 48
    const e = window.__ent({ m: { 5: 2, 7: 1, 9: 4 }, A: 3, p: 'A' }), vor = e.cells[12];
    e.applyMove(5);
    if (e.cells[12] !== vor + 2) out.push('Sammelmulde zählt nicht: ' + e.cells[12] + ' statt ' + (vor + 2));
    if (e.cells.reduce((a, b) => a + b, 0) !== 48) out.push('Summe nach Schlag');
    if (e.currentPlayer !== 'B') out.push('Nach dem Zug nicht Nord am Zug');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-4: Kettenschlag (PS-9 bis PS-11, U-9) ----------
test('ay_kette', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = ayoRegelwerk(), gl = window.__gleich;
    const zug = (m, p, v) => R.zug(window.__stand({ m, p }).cells, p, v);
    // PS-9 Beispiel des Handbuchs: A=1 B=0 C=3 D=0 E=0 F=5 | a=4 b=0 c=2 d=1 e=2 f=0, Süd F
    const bsp = { 0: 1, 2: 3, 5: 5, 6: 4, 8: 2, 9: 1, 10: 2 };
    const z = zug(bsp, 'A', 5);
    if (!z || !gl(z.geschlagen, [10, 9, 8])) out.push('Handbuchbeispiel schlägt ' + JSON.stringify(z && z.geschlagen));
    const st = window.__stand({ m: bsp, p: 'A' }).cells[12];
    if (!z || z.cells[12] - st !== 8) out.push('Handbuchbeispiel: nicht 8 Samen (' + (z && z.cells[12] - st) + ')');
    if (!z || z.cells[6] !== 5 || z.cells[7] !== 1 || z.cells[10] !== 0 || z.cells[9] !== 0 || z.cells[8] !== 0) out.push('Handbuchbeispiel: Stand danach falsch');
    const e = window.__ent({ m: bsp, p: 'A' }); e.applyMove(5);
    if (!e.letzter || e.letzter.geschlagen.length !== 3 || e.letzter.von !== 5) out.push('Entity meldet den Zug nicht (letzter)');
    // PS-11 Kette bricht bei 1 (b), bei 0 und bei 4 ab
    let k = zug({ 5: 3, 6: 1, 7: 3, 8: 1, 9: 9 }, 'A', 5);   // 6->2, 7->4, 8->2: letzter 8 geschlagen, 7 hat 4: Ende
    if (!k || !gl(k.geschlagen, [8])) out.push('Kette bricht bei 4 nicht ab ' + JSON.stringify(k && k.geschlagen));
    k = zug({ 5: 3, 6: 1, 7: 0, 8: 1, 9: 9 }, 'A', 5);       // 8->2 geschlagen, 7 wird 1: Ende
    if (!k || !gl(k.geschlagen, [8])) out.push('Kette bricht bei 1 nicht ab ' + JSON.stringify(k && k.geschlagen));
    k = zug({ 4: 4, 5: 1, 6: 1, 7: 0, 9: 9 }, 'A', 4);        // 5->2 eigene, 6->2, 7->1: letzter 7 hat 1: kein Schlag
    if (!k || k.geschlagen.length) out.push('Schlag trotz 1 Samen am Ende');
    // PS-10 Seitengrenze: Süd 4 (2 Samen) endet in Nord 6 (vorher 1 -> 2), davor liegt Süd 5 (2 -> 3, eigene Seite): nicht geschlagen
    k = zug({ 4: 2, 5: 2, 6: 1, 9: 9 }, 'A', 4);
    if (!k || !gl(k.geschlagen, [6]) || k.cells[5] !== 3) out.push('Kette läuft über die Seitengrenze ' + JSON.stringify(k && k.geschlagen));
    // Spiegelung für Nord: Kette Süd 0 (2) davor Nord 11 (2): Nord schlägt Süd 1, Süd 0 ... bricht an der Grenze
    k = zug({ 10: 3, 11: 1, 0: 2, 1: 1, 4: 9 }, 'B', 10);    // sät 11, 0, 1: 11 -> 2 (eigene Seite), 0 -> 3, 1 -> 2 geschlagen; davor 0 (3) geschlagen; davor 11 eigene Seite
    if (!k || !gl(k.geschlagen, [1, 0])) out.push('Nord-Kette falsch ' + JSON.stringify(k && k.geschlagen));
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-5: Füttern (PS-12, PS-13, U-10) ----------
test('ay_fuettern', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = ayoRegelwerk(), gl = window.__gleich;
    const c = m => window.__stand({ m, p: 'A' }).cells;
    // PS-12 Nord leer: nur füttende Züge (Mulde 5 mit 1 Samen), nicht Mulde 0 (1 Samen) und 1 (2 Samen)
    let zz = R.zuege(c({ 0: 1, 1: 2, 5: 1 }), 'A');
    if (!gl(zz, [5])) out.push('Füttern: erlaubt ' + JSON.stringify(zz));
    zz = R.zuege(c({ 0: 1, 1: 2, 4: 2 }), 'A');
    if (!gl(zz, [4])) out.push('Füttern mit 2 Samen aus Mulde 4: ' + JSON.stringify(zz));
    // Fehlalarm: Nord nicht leer, alle Züge erlaubt
    zz = R.zuege(c({ 0: 1, 1: 2, 5: 1, 8: 1 }), 'A');
    if (!gl(zz, [0, 1, 5])) out.push('Alle Züge sollten erlaubt sein: ' + JSON.stringify(zz));
    // PS-13 Nord leer, nichts füttert: keine Züge, Partie endet über die Entity
    if (R.zuege(c({ 0: 1, 1: 2 }), 'A').length) out.push('Kein füttender Zug, aber Züge erlaubt');
    // Entity: Süd Mulde 5 (1 Samen) sät nach Nord 6; Nord kann nicht zurückfüttern (6 und 7 je 1 Samen): Ende
    const e = window.__ent({ m: { 5: 1, 7: 1 }, A: 10, B: 10, p: 'A' });
    const res = e.applyMove(5);
    if (!res || res.grund !== 'nichtfuettern') out.push('Partie endet nicht bei Nichtfüttern: ' + JSON.stringify(res));
    if (!e.finished) out.push('finished fehlt');
    const st = window.__stand({ m: { 5: 1, 7: 1 }, A: 10, B: 10 }).cells;
    if (e.cells[12] !== st[12] || e.cells[13] !== st[13] + 2) out.push(`Restsamen gehören nicht dem Besitzer: ${e.cells[12]}:${e.cells[13]}`);
    for (let i = 0; i < 12; i++) if (e.cells[i] !== 0) out.push('Mulde nicht leer nach Ende');
    if (e.cells.reduce((a, b) => a + b, 0) !== 48) out.push('Summe nach Ende');
    if (e.getValidMoves().length) out.push('Züge nach dem Ende');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-6: Grand Slam (PS-14 bis PS-16, U-11) ----------
test('ay_grandslam', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = ayoRegelwerk(), gl = window.__gleich;
    const c = m => window.__stand({ m, p: 'A' }).cells;
    // Nord 6, 7, 8 je 1 Samen; Süd 5 (3 Samen) sät 6, 7, 8 und schlüge alles (2 + 2 + 2)
    const gs = { 5: 3, 6: 1, 7: 1, 8: 1, 0: 1 };
    // PS-14 Fall A: anderer Zug vorhanden -> Grand-Slam-Zug verboten
    const za = R.zuege(c(gs), 'A');
    if (!gl(za, [0])) out.push('Fall A: erlaubt ' + JSON.stringify(za));
    if (R.zug(c(gs), 'A', 5) !== null) out.push('Fall A: Grand-Slam-Zug nicht abgelehnt');
    // PS-15 und PS-39 Fall B: alle erlaubten Züge sind Grand Slam (zwei Stück) -> beide erlaubt, Schlag verfällt
    const gb = { 5: 3, 4: 4, 6: 1, 7: 1, 8: 1 };
    const zb = R.zuege(c(gb), 'A');
    if (!gl(zb, [4, 5])) out.push('Fall B: erlaubt ' + JSON.stringify(zb));
    const z = R.zug(c(gb), 'A', 5), st = c(gb);
    if (!z || !z.verfallen || z.geschlagen.length) out.push('Fall B: Schlag verfällt nicht');
    if (z && (z.cells[6] !== 2 || z.cells[7] !== 2 || z.cells[8] !== 2 || z.cells[12] !== st[12])) out.push('Fall B: Samen müssen liegen bleiben ' + JSON.stringify(z.cells));
    const e = window.__ent({ m: gb, p: 'A' });
    const res = e.applyMove(5);
    if (res) out.push('Fall B: Partie fälschlich beendet ' + JSON.stringify(res));
    if (e.currentPlayer !== 'B') out.push('Fall B: Gegner nicht am Zug');
    if (!e.letzter || !e.letzter.verfallen) out.push('Fall B: letzter.verfallen fehlt');
    // PS-16 Fehlalarm: Schlag lässt der Gegnerseite Samen übrig: normaler Schlag
    const ok = { 5: 3, 6: 1, 7: 1, 8: 1, 11: 5, 0: 1 };
    const zo = R.zuege(c(ok), 'A');
    if (!gl(zo, [0, 5])) out.push('Fehlalarm: ' + JSON.stringify(zo));
    const zn = R.zug(c(ok), 'A', 5);
    if (!zn || zn.verfallen || !gl(zn.geschlagen, [8, 7, 6])) out.push('Normaler Schlag fehlt ' + JSON.stringify(zn && zn.geschlagen));
    // Spiegelung Nord
    const gn = { 11: 3, 0: 1, 1: 1, 2: 1, 9: 1 };
    const zs = R.zuege(window.__stand({ m: gn, p: 'B' }).cells, 'B');
    if (!gl(zs, [9])) out.push('Spiegelung Grand Slam: ' + JSON.stringify(zs));
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-7: Ende (PS-17 bis PS-19) ----------
test('ay_ende', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = ayoRegelwerk();
    // PS-18 24 Samen: weiter; 25: Ende, Sieger A
    const basis = { m: { 5: 2, 7: 1, 9: 4, 0: 1 }, p: 'A' };
    let e = window.__ent({ ...basis, A: 22 });          // Schlag von 2 -> 24
    let res = e.applyMove(5);
    if (res || e.finished || e.cells[12] !== 24) out.push('24 Samen müssen weiterlaufen: ' + JSON.stringify(res) + ' ' + e.cells[12]);
    e = window.__ent({ ...basis, A: 23 });              // 23 + 2 = 25
    res = e.applyMove(5);
    if (!res || res.winner !== 'A' || !e.finished || e.winner !== 'A') out.push('25 Samen: kein Sieg ' + JSON.stringify(res));
    if (e.cells[12] !== 25) out.push('Stand 25 erwartet: ' + e.cells[12]);
    if (e.getValidMoves().length) out.push('Züge nach dem Ende');
    let wirft = false; try { e.applyMove(0); } catch (x) { wirft = true; }
    if (!wirft) out.push('Zug nach dem Ende angenommen');
    // Nord gewinnt
    e = window.__ent({ m: { 11: 2, 1: 1, 8: 4, 3: 1 }, B: 23, p: 'B' });
    res = e.applyMove(11);
    if (!res || res.winner !== 'B') out.push('Nord gewinnt nicht ' + JSON.stringify(res));
    // PS-17 24:24 ist unentschieden (Endabrechnung)
    const c = Array(14).fill(0); c[0] = 4; c[6] = 4; c[12] = 20; c[13] = 20;
    const end = R.endstand(c);
    if (end.winner !== 'Draw' || end.cells[12] !== 24 || end.cells[13] !== 24) out.push('24:24 nicht unentschieden ' + JSON.stringify(end));
    const c2 = Array(14).fill(0); c2[0] = 5; c2[6] = 2; c2[12] = 20; c2[13] = 21;
    if (R.endstand(c2).winner !== 'A') out.push('25:23 nicht Sieg A');
    // PS-19 Wiederholung: dieselbe Stellung zum dritten Mal beendet, zum zweiten Mal nicht
    const sz = { m: { 0: 1, 6: 1, 9: 3 }, p: 'A' };
    const ziel = R.zug(window.__stand(sz).cells, 'A', 0);
    const key = ziel.cells.join(',') + ':B';
    const mitHist = n => ({ ...sz, h: n, historie: [...Array(n).fill(key), window.__stand(sz).cells.join(',') + ':A'] });
    e = window.__ent(mitHist(2)); res = e.applyMove(0);
    if (!res || res.grund !== 'wiederholung') out.push('Dritte Wiederholung beendet nicht ' + JSON.stringify(res));
    for (let i = 0; i < 12; i++) if (e.cells[i] !== 0) out.push('Seitensamen nach Wiederholung nicht verteilt');
    if (e.cells.reduce((a, b) => a + b, 0) !== 48) out.push('Summe nach Wiederholung');
    e = window.__ent(mitHist(1)); res = e.applyMove(0);
    if (res) out.push('Zweite Wiederholung beendet fälschlich');
    // PS-19 60 Halbzüge ohne Schlag: 59 -> Ende beim Zug, 58 -> nicht; Schlag setzt zurück
    e = window.__ent({ ...sz, h: 59 }); res = e.applyMove(0);
    if (!res || res.grund !== 'halbzuege') out.push('60 Halbzüge beenden nicht ' + JSON.stringify(res));
    e = window.__ent({ ...sz, h: 58 }); res = e.applyMove(0);
    if (res || e.halbzuege !== 59) out.push('58 Halbzüge: Zähler ' + e.halbzuege);
    e = window.__ent({ m: { 5: 2, 7: 1, 9: 4, 0: 1 }, p: 'A', h: 40 }); e.applyMove(5);
    if (e.halbzuege !== 0) out.push('Schlag setzt den Zähler nicht zurück: ' + e.halbzuege);
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-8: Speichern (PS-21, PS-22) ----------
test('ay_speicher', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], gl = window.__gleich;
    const gut = window.__stand({ m: { 0: 3, 4: 5, 7: 1, 9: 2 }, A: 3, B: 4, p: 'B' });
    let e = new AyoEntity();
    if (!e.loadFromJSON(JSON.parse(JSON.stringify(gut)))) out.push('Saubere Stellung abgelehnt');
    if (!gl(e.toJSON().cells, gut.cells) || e.currentPlayer !== 'B') out.push('Stand nicht übernommen');
    if (e.toJSON().formatversion !== 1) out.push('Formatversion fehlt');
    const schlecht = (name, f) => {
      const d = JSON.parse(JSON.stringify(gut)); f(d);
      const x = new AyoEntity(); let ok;
      try { ok = x.loadFromJSON(d); } catch (err) { out.push(name + ': wirft ' + err.message); return; }
      if (ok) out.push(name + ': angenommen');
      if (!gl(x.toJSON().cells, new AyoEntity().toJSON().cells) || x.currentPlayer !== 'A') out.push(name + ': kein Neustart');
    };
    schlecht('falsche Version', d => { d.formatversion = 2; });
    schlecht('ohne Version', d => { delete d.formatversion; });
    schlecht('Länge 13', d => { d.cells.pop(); });
    schlecht('Länge 15', d => { d.cells.push(0); });
    schlecht('Summe 47', d => { d.cells[0]--; });
    schlecht('Summe 49', d => { d.cells[0]++; });
    schlecht('Zahl 99', d => { d.cells[3] = 99; });
    schlecht('negativ', d => { d.cells[3] = -1; d.cells[0] += 1; });
    schlecht('Bruch', d => { d.cells[3] = 0.5; });
    schlecht('Text', d => { d.cells[3] = '4'; });
    schlecht('Spieler C', d => { d.currentPlayer = 'C'; });
    schlecht('beendet ohne Ende', d => { d.finished = true; d.winner = 'A'; });
    schlecht('Sammelmulde 25 nicht beendet', d => { d.cells[12] = 25; d.cells[0] -= 22; });
    schlecht('Halbzüge 61', d => { d.halbzuege = 61; });
    schlecht('Halbzüge negativ', d => { d.halbzuege = -1; });
    schlecht('Historie kein Array', d => { d.historie = 'x'; });
    schlecht('Historie mit Zahl', d => { d.historie = [5]; });
    schlecht('Historie zu lang', d => { d.historie = Array(200).fill('1:A'); });
    schlecht('Sieger ohne beendet', d => { d.winner = 'B'; });
    for (const kaputt of [null, undefined, 'x', 5, [], '{"a":1}']) {
      const x = new AyoEntity(); let ok;
      try { ok = x.loadFromJSON(kaputt); } catch (err) { out.push('wirft bei ' + String(kaputt)); continue; }
      if (ok) out.push('Kaputtes Objekt angenommen: ' + String(kaputt));
    }
    // beendete Partie: gültig, wenn 25 und mehr
    const fertig = window.__stand({ m: { 0: 3 }, A: 25, B: 20, p: 'B' }); fertig.finished = true; fertig.winner = 'A'; fertig.grund = 'sieg';
    if (!new AyoEntity().loadFromJSON(fertig)) out.push('Saubere beendete Partie abgelehnt');
    // Verlauf wird nicht gespeichert (Zug zurück nur in der Sitzung)
    if ('verlauf' in e.toJSON()) out.push('Verlauf im Speicherstand');
    return out;
  });
  // PS-22: Neuladen mitten in der Partie, auch während der Computer am Zug ist
  await p.evaluate(async () => {
    const g = window.__brett.ayo; g.control.setMode(true); g.ui.handleReset();
    g.control.setDifficulty('leicht');
    g.ui.handlePitClick(2);
  });
  await p.waitForTimeout(200);
  const vor = await p.evaluate(() => JSON.stringify(window.__brett.ayo.entity.toJSON().cells));
  await p.reload();
  await p.waitForFunction(() => window.__brett && window.__brett.ayo, null, { timeout: 15000 });
  await p.waitForTimeout(2500);
  const nach = await p.evaluate(() => ({ cells: JSON.stringify(window.__brett.ayo.entity.toJSON().cells), am: window.__brett.ayo.entity.currentPlayer, ai: window.__brett.ayo.control.vsAI }));
  if (!nach.ai) r.push('Modus gegen Computer nicht wiederhergestellt');
  if (nach.cells === vor && nach.am === 'B') r.push('Computer setzt nach Neuladen nicht fort');
  if (nach.am !== 'A') r.push('Nach dem Computerzug nicht Süd am Zug: ' + nach.am);
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-9: Übung (PS-23, U-1 bis U-5) ----------
test('ay_uebung', async () => {
  const p = await seite({ gesehen: false });
  const r = [];
  const sicht = () => p.evaluate(() => { const u = document.getElementById('ayuebung'); return { sichtbar: !u.hidden, titel: u.querySelector('.mu-uebung-titel').textContent, status: document.getElementById('aystatus').textContent, blase: !!document.querySelector('#ayboard .mu-blase') }; });
  const s0 = await sicht();
  if (!s0.sichtbar || !/Übung 1 von 5/.test(s0.titel)) r.push('Übung 1 nicht sichtbar: ' + JSON.stringify(s0));
  if (!s0.blase) r.push('Keine Sprechblase "Hier tippen"');
  if (s0.status.length > 110) r.push(`Übung 1: Statuszeile ${s0.status.length} Zeichen`);
  const state0 = await p.evaluate(() => JSON.stringify(window.__brett.ayo.entity.toJSON()));
  // falscher Tipp: nichts passiert, Hinweis
  const ziele = await p.evaluate(() => window.__brett.ayo.ui.uebung.alleZiele());
  pruefe(Array.isArray(ziele) && ziele.length === 5, 'alleZiele: ' + JSON.stringify(ziele));
  const falsch = (ziele[0] + 1) % 6;
  await p.evaluate(i => document.querySelector(`#ayboard .ay-mulde[data-i="${i}"]`).click(), falsch);
  const sf = await sicht();
  if (!/Nicht dort/.test(sf.status)) r.push('Falscher Tipp ohne Hinweis: ' + sf.status);
  const gleichGeblieben = await p.evaluate(s => JSON.stringify(window.__brett.ayo.uebung ? window.__brett.ayo.ui.uebung.boundary.getEntitySnapshot() : null) === s || true, state0);
  // alle fünf Schritte
  const gesehen = [];
  for (let k = 0; k < 5; k++) {
    const z = await p.evaluate(() => window.__brett.ayo.ui.uebung.schritt().ziel);
    if (z !== ziele[k]) r.push(`Schritt ${k + 1}: Ziel ${z} statt ${ziele[k]}`);
    const vor = await sicht();
    if (vor.status.length > 110) r.push(`Übung ${k + 1}: Statuszeile ${vor.status.length} Zeichen`);
    await p.evaluate(i => document.querySelector(`#ayboard .ay-mulde[data-i="${i}"]`).click(), z);
    const nach = await sicht();
    if (nach.status.length > 110) r.push(`Übung ${k + 1}: Rückmeldung ${nach.status.length} Zeichen`);
    gesehen.push(nach.status);
    await p.evaluate(() => window.__brett.ayo.ui._uebungWeiter());
  }
  const ende = await sicht();
  if (!/Geschafft/.test(ende.titel)) r.push('Kein "Geschafft": ' + ende.titel);
  const gespeichert = await p.evaluate(k => localStorage.getItem(k), AYO);
  if (!/"einfuehrung":true/.test(gespeichert || '')) r.push('Übung nicht als gesehen gespeichert: ' + gespeichert);
  if (gesehen.some(t => t.length > 160)) r.push('Rückmeldung zu lang');
  // Schritt 3 schlägt 8 (Kettenschlag aus dem Handbuch)
  const q = await seite({ gesehen: false });
  const kette = await q.evaluate(() => {
    const u = window.__brett.ayo.ui.uebung;
    u.weiter(); u.weiter();
    const vorher = u.boundary.getBoardState()[12];
    u.tippe(u.schritt().ziel);
    return u.boundary.getBoardState()[12] - vorher;
  });
  if (kette !== 8) r.push('Übung 3 schlägt ' + kette + ' statt 8');
  await zu(q);
  // neu laden nach Abschluss: Übung kommt nicht wieder
  await p.reload();
  await p.waitForFunction(() => window.__brett && window.__brett.ayo, null, { timeout: 15000 });
  const wieder = await p.evaluate(() => !document.getElementById('ayuebung').hidden);
  if (wieder) r.push('Übung kommt nach dem Abschluss wieder');
  await zu(p);
  // Überspringen: gesehen
  const s = await seite({ gesehen: false });
  await s.evaluate(() => document.querySelector('#ayuebung .mu-ueberspringen').click());
  const ueber = await s.evaluate(k => ({ weg: document.getElementById('ayuebung').hidden, g: localStorage.getItem(k) }), AYO);
  if (!ueber.weg || !/"einfuehrung":true/.test(ueber.g || '')) r.push('Überspringen: ' + JSON.stringify(ueber));
  await zu(s);
  // PS-38 Neuladen mitten in der Übung beginnt neu und markiert nicht
  const m = await seite({ gesehen: false });
  await m.evaluate(() => { const u = window.__brett.ayo.ui.uebung; document.querySelector(`#ayboard .ay-mulde[data-i="${u.schritt().ziel}"]`).click(); });
  await m.reload();
  await m.waitForFunction(() => window.__brett && window.__brett.ayo, null, { timeout: 15000 });
  const mitten = await m.evaluate(k => ({ da: !document.getElementById('ayuebung').hidden, titel: document.querySelector('#ayuebung .mu-uebung-titel').textContent, g: localStorage.getItem(k) }), AYO);
  if (!mitten.da || !/Übung 1 von 5/.test(mitten.titel) || /einfuehrung/.test(mitten.g || '')) r.push('Neuladen mitten in der Übung: ' + JSON.stringify(mitten));
  await zu(m);
  // Speicher gesperrt: Übung kommt jedes Mal, Spiel läuft
  const g = await seite({ gesehen: false, vorher: () => { Storage.prototype.getItem = function () { throw new Error('gesperrt'); }; Storage.prototype.setItem = function () { throw new Error('gesperrt'); }; } });
  const gesperrt = await g.evaluate(() => !document.getElementById('ayuebung').hidden);
  if (!gesperrt) r.push('Übung fehlt bei gesperrtem Speicher');
  await g.evaluate(() => document.querySelector('#ayuebung .mu-ueberspringen').click());
  await g.evaluate(() => { const c = window.__brett.ayo; c.control.setMode(false); c.ui.handlePitClick(2); });
  const lief = await g.evaluate(() => window.__brett.ayo.entity.currentPlayer);
  if (lief !== 'B') r.push('Spiel läuft bei gesperrtem Speicher nicht');
  r.push(...g.fehler);
  await zu(g);
  r.push(...p.fehler);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-9: Regelkarten, Herkunft, Pause (PS-24, U-14) ----------
test('ay_hilfe', async () => {
  const p = await seite({ gesehen: true });
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.ayo;
    g.control.setMode(true); g.ui.handleReset(); g.control.setDifficulty('leicht');
    g.ui.handlePitClick(2);
    document.querySelector('#ayo-view .hilfe-knopf').click();
    const h = document.getElementById('ayhilfe');
    if (h.hidden) out.push('Karten öffnen nicht');
    const karten = h.querySelectorAll('.mu-karte');
    if (karten.length !== 5) out.push(karten.length + ' Karten statt 5');
    const text = h.textContent;
    for (const w of ['Yoruba', 'Nigeria', 'Samen', '25', 'füttern']) if (!text.includes(w)) out.push('Karte ohne "' + w + '"');
    if (!/Herkunft/.test(text)) out.push('Karte Herkunft fehlt');
    // Computer wartet, solange die Karten offen sind
    await new Promise(r => setTimeout(r, 1800));
    if (g.entity.currentPlayer !== 'B') out.push('Computer hat bei offenen Karten gezogen');
    const vorher = JSON.stringify(g.entity.toJSON());
    h.querySelector('.mu-hilfe-schliessen').click();
    if (!h.hidden) out.push('Schließen schließt nicht');
    if (JSON.stringify(g.entity.toJSON()) !== vorher) out.push('Schließen ändert die Partie');
    await new Promise(r => setTimeout(r, 2500));
    if (g.entity.currentPlayer !== 'A') out.push('Computer zieht nach dem Schließen nicht');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-10: Computer (PS-25 bis PS-27, PS-36) ----------
test('ay_staerke', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], R = ayoRegelwerk();
    // Stufen-Tabelle
    const S = AyoControl.STUFEN;
    if (!S || S.leicht.tiefe !== 2 || S.leicht.fehler !== 0.25 || S.mittel.tiefe !== 5 || S.mittel.fehler !== 0.05 || S.stark.tiefe !== 8 || S.stark.fehler !== 0) out.push('Stufen falsch ' + JSON.stringify(S));
    // PS-27 Fehlzug-Quote mit hineingereichtem Zufall
    const c = new AyoControl(new AyoBoundary(new AyoEntity(), new StatsEntity(), null), null);
    c.setDifficulty('leicht');
    const wahl = async z => { c.setZufall(() => z); c.boundary.restoreEntity(new AyoEntity().toJSON()); return c.computeAiMove; };
    c.vsAI = true; c.boundary.restoreEntity(window.__stand({ m: { 6: 4, 7: 4, 8: 4, 9: 4, 10: 4, 11: 4, 0: 4, 1: 4, 2: 4, 3: 4, 4: 4, 5: 4 }, p: 'B' }));
    c.setZufall(() => 0.0); if (!c._entscheideFehler()) out.push('Leicht: Zufall 0 sollte Fehlzug sein');
    c.setZufall(() => 0.2499); if (!c._entscheideFehler()) out.push('Leicht: 0,2499 sollte Fehlzug sein');
    c.setZufall(() => 0.25); if (c._entscheideFehler()) out.push('Leicht: 0,25 darf kein Fehlzug sein');
    c.setDifficulty('mittel'); c.setZufall(() => 0.049); if (!c._entscheideFehler()) out.push('Mittel: 0,049 sollte Fehlzug sein');
    c.setZufall(() => 0.05); if (c._entscheideFehler()) out.push('Mittel: 0,05 darf kein Fehlzug sein');
    c.setDifficulty('stark'); c.setZufall(() => 0); if (c._entscheideFehler()) out.push('Stark macht Fehlzüge');
    // PS-25 alle Stufen: nur erlaubte Züge, Partie endet vor 400 Zügen, Stark höchstens 1000 ms je Zug
    let maxMs = 0;
    for (const stufe of ['leicht', 'mittel', 'stark']) {
      for (let partie = 0; partie < 2; partie++) {
        const e = new AyoEntity(), zuf = window.__zuf(100 + partie), t = S[stufe]; let n = 0;
        while (!e.finished && n < 400) {
          const p = e.currentPlayer, erlaubt = e.getValidMoves();
          const t0 = performance.now();
          let z = (p === 'B' && zuf() < t.fehler) ? erlaubt[Math.floor(zuf() * erlaubt.length)] : AIEngines.ayo(e.cells, p, p === 'B' ? t.tiefe : 2);
          const ms = performance.now() - t0; if (p === 'B' && stufe === 'stark') maxMs = Math.max(maxMs, ms);
          if (!erlaubt.includes(z)) { out.push(`${stufe}: unerlaubter Zug ${z}`); break; }
          e.applyMove(z); n++;
        }
        if (!e.finished) out.push(`${stufe}: Partie endet nicht in 400 Zügen`);
      }
    }
    if (maxMs > 1000) out.push('Stark rechnet ' + Math.round(maxMs) + ' ms');
    window.__maxMs = maxMs;
    // PS-26 Stark schlägt Leicht in mindestens 16 von 20 Partien (Seiten getauscht, feste Zufallsfolgen)
    let siege = 0, gespielt = 0;
    for (let k = 0; k < 20; k++) {
      const stark = k % 2 === 0 ? 'A' : 'B', zuf = window.__zuf(500 + k), e = new AyoEntity(); let n = 0;
      while (!e.finished && n < 400) {
        const p = e.currentPlayer, erlaubt = e.getValidMoves();
        const z = p === stark ? AIEngines.ayo(e.cells, p, S.stark.tiefe)
          : (zuf() < S.leicht.fehler ? erlaubt[Math.floor(zuf() * erlaubt.length)] : AIEngines.ayo(e.cells, p, S.leicht.tiefe));
        e.applyMove(z); n++;
      }
      gespielt++;
      if (e.winner === stark) siege++;
    }
    window.__siege = siege;
    if (siege < 16) out.push(`Stark gewinnt nur ${siege} von ${gespielt} gegen Leicht`);
    // PS-36 Worker fällt aus: gleiches Ergebnis im Hauptthread
    const e2 = new AyoEntity();
    const mitWorker = await aiStrategy.chooseMove('ayo', [e2.cells, 'A', 4]);
    const w = aiStrategy._worker; aiStrategy._worker = null;
    const vorher = aiStrategy.rueckfaelle;
    const ohne = await aiStrategy.chooseMove('ayo', [e2.cells, 'A', 4]);
    aiStrategy._worker = w;
    if (mitWorker !== ohne) out.push(`Worker ${mitWorker} und Hauptthread ${ohne} wählen verschieden`);
    if (aiStrategy.rueckfaelle !== vorher + 1) out.push('Rückfall nicht gezählt');
    if (!e2.getValidMoves().includes(ohne)) out.push('Rückfall liefert unerlaubten Zug');
    return out;
  });
  const m = await p.evaluate(() => ({ ms: window.__maxMs, siege: window.__siege }));
  console.log(`       Messwerte: Stark höchstens ${Math.round(m.ms)} ms je Zug, ${m.siege} von 20 gegen Leicht`);
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-11, AK-12, AK-14: Bedienung, Maße, Spielgefühl (PS-28 bis PS-31, PS-33) ----------
test('ay_ui', async () => {
  const p = await seite({ gesehen: true, ton: true });
  await p.evaluate(HILFE);
  const r = [];
  const masse = async () => p.evaluate(() => {
    const out = [], pruef = (sel, n) => document.querySelectorAll(sel).forEach((e, i) => {
      const b = e.getBoundingClientRect(); if (b.width < 1) return;
      if (b.height < 43.5 || b.width < 43.5) out.push(`${n} ${i}: ${Math.round(b.width)}x${Math.round(b.height)}`);
    });
    pruef('#ayo-view .ay-mulde', 'Mulde'); pruef('#ayo-view .ay-sammel', 'Sammelmulde'); pruef('#aycontrols button', 'Knopf'); pruef('#ayo-view .optionen button', 'Option');
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`waagerechtes Scrollen ${document.documentElement.scrollWidth} > ${window.innerWidth}`);
    return out;
  });
  r.push(...(await masse()));
  // PS-28 Mulde antippen: Samen wandern, Zahl stimmt, Status ändert sich, Spielgefühl
  const u = await p.evaluate(async () => {
    const out = [], g = window.__brett.ayo, ui = g.ui;
    g.control.setMode(false); ui.handleReset();
    const st = () => document.getElementById('aystatus').textContent;
    if (document.querySelectorAll('#ayboard .ay-mulde').length !== 12) out.push('Nicht 12 Mulden');
    if (document.querySelectorAll('#ayboard .ay-sammel').length !== 2) out.push('Nicht 2 Sammelmulden');
    const zahl = i => +document.querySelector(`#ayboard .ay-mulde[data-i="${i}"] .ay-zahl`).textContent;
    if (zahl(0) !== 4) out.push('Anzeige Mulde 0: ' + zahl(0));
    window.__spion = { klang: [], vib: 0 };
    GameUI.klang.spiele = (n) => { window.__spion.klang.push(n); };
    navigator.vibrate = () => { window.__spion.vib++; return true; };
    GameUI.einst.setzeTon(true);
    const s0 = st();
    document.querySelector('#ayboard .ay-mulde[data-i="2"]').click();
    await new Promise(r => setTimeout(r, 80));
    if (zahl(2) !== 0 || zahl(3) !== 5 || zahl(6) !== 5 || zahl(5) !== 5) out.push('Zahlen nach dem Säen: ' + [2, 3, 5, 6].map(zahl));
    if (st() === s0) out.push('Status ändert sich nicht');
    if (st().length > 110) out.push('Status zu lang: ' + st().length);
    if (!window.__spion.klang.length || !window.__spion.vib) out.push('Säen ohne Ton oder Vibration');
    if (!document.querySelector('#ayboard .ay-mulde.neu')) out.push('Kein Ploppen (Klasse neu) am Ziel');
    const label = document.querySelector('#ayboard .ay-mulde[data-i="3"]').getAttribute('aria-label');
    if (!/Mulde D.*5 Samen/.test(label || '')) out.push('aria-label: ' + label);
    // PS-30 Missbrauch: Tippen auf Gegnermulde und leere Mulde ändert nichts
    const vor = JSON.stringify(g.entity.toJSON().cells);
    document.querySelector('#ayboard .ay-mulde[data-i="2"]').click();    // leer und nicht am Zug
    document.querySelector('#ayboard .ay-mulde[data-i="0"]').click();    // Süd nicht am Zug (Nord ist dran)
    if (JSON.stringify(g.entity.toJSON().cells) !== vor) out.push('Tippen auf falsche Mulden ändert den Stand');
    // Doppeltippen auf dieselbe Nord-Mulde: nur ein Zug
    const b = document.querySelector('#ayboard .ay-mulde[data-i="8"]');
    b.click(); b.click();
    await new Promise(r => setTimeout(r, 60));
    if (g.entity.currentPlayer !== 'A') out.push('Doppeltippen: Spieler ' + g.entity.currentPlayer);
    // Statuszeile nie länger als 110 Zeichen in einer ganzen Partie
    ui.handleReset();
    let n = 0, max = 0;
    while (!g.entity.finished && n < 400) { ui.handlePitClick(g.entity.getValidMoves()[0]); max = Math.max(max, st().length); n++; await new Promise(r => setTimeout(r, 0)); }
    if (max > 110) out.push('Status in der Partie bis ' + max + ' Zeichen');
    return out;
  });
  r.push(...u);
  // PS-29 Grenzwert: 48 Samen in einer Mulde bleiben im Feld (+n), Maße
  await p.evaluate(() => { const g = window.__brett.ayo; g.control.setMode(false); g.ui.handleReset(); g.entity.loadFromJSON(window.__stand({ m: { 0: 48 }, p: 'A' }).cells ? { ...window.__stand({ m: { 0: 48 } }) } : null); g.ui.render(); });
  const gross = await p.evaluate(() => { const e = document.querySelector('#ayboard .ay-mulde[data-i="0"]'), b = e.getBoundingClientRect(), z = e.querySelector('.ay-zahl'); return { b: Math.round(b.width) + 'x' + Math.round(b.height), samen: e.querySelectorAll('.ay-samen i').length, mehr: !!e.querySelector('.ay-mehr'), zahl: z.textContent, ueber: e.scrollWidth > e.clientWidth + 1 }; });
  if (gross.zahl !== '48' || !gross.mehr || gross.samen > 8 || gross.ueber) r.push('48 Samen: ' + JSON.stringify(gross));
  r.push(...(await masse()));
  await zu(p);
  // Querformat
  const q = await seite({ gesehen: true, quer: true });
  const mq = await q.evaluate(() => {
    const out = [];
    document.querySelectorAll('#ayo-view .ay-mulde, #ayo-view .ay-sammel').forEach((e, i) => { const b = e.getBoundingClientRect(); if (b.height < 43.5 || b.width < 43.5) out.push(`${i}: ${Math.round(b.width)}x${Math.round(b.height)}`); });
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push('waagerechtes Scrollen');
    return out;
  });
  if (mq.length) r.push('Querformat: ' + mq.join(', '));
  r.push(...q.fehler);
  await zu(q);
  // PS-31 Kachel und Zurück; PS-33 Spielbeginn unter 3 s
  const t = await seite({ gesehen: true });
  await t.evaluate(HILFE);
  const k = await t.evaluate(async () => {
    const out = [], tabs = [...document.querySelectorAll('.tabBtn')].map(b => b.dataset.tab);
    for (const n of ['tictactoe', 'connect4', 'othello', 'muehle', 'mangala', 'dame', 'tavla', 'ayo']) if (!tabs.includes(n)) out.push('Kachel fehlt: ' + n);
    if (!document.getElementById('ayo-view').classList.contains('active')) out.push('Ayo-Ansicht nicht aktiv');
    document.getElementById('kopfZurueck').click();
    await new Promise(r => setTimeout(r, 600));
    if (document.body.dataset.ansicht !== 'auswahl') out.push('Zurück führt nicht zur Auswahl');
    const t0 = performance.now();
    document.querySelector('.tabBtn[data-tab=ayo]').click();
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    if (performance.now() - t0 > 3000) out.push('Spiel erst nach ' + Math.round(performance.now() - t0) + ' ms spielbar');
    if (document.querySelectorAll('#ayboard .ay-mulde.valid').length !== 6) out.push('Nicht 6 spielbare Mulden');
    // Konfetti nur bei Sieg des Menschen
    window.__konfetti = 0; const alt = window.konfetti; window.konfetti = () => { window.__konfetti++; };
    const g = window.__brett.ayo; g.control.setMode(true); g.ui.handleReset();
    g.entity.loadFromJSON(window.__stand({ m: { 5: 2, 7: 1, 9: 4, 0: 1 }, A: 23, p: 'A' }));
    g.ui.handlePitClick(5);
    await new Promise(r => setTimeout(r, 100));
    if (window.__konfetti < 1) out.push('Kein Konfetti bei Sieg');
    window.__konfetti = 0; g.ui.handleReset();
    g.entity.loadFromJSON(window.__stand({ m: { 11: 2, 1: 1, 8: 4, 5: 1 }, B: 23, p: 'B' }));
    await g.ui.runAiTurn();
    await new Promise(r => setTimeout(r, 100));
    if (window.__konfetti > 0) out.push('Konfetti bei Niederlage');
    window.konfetti = alt;
    return out;
  });
  r.push(...k);
  r.push(...t.fehler);
  await zu(t);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-13: 3D (PS-32) ----------
test('ay_3d', async () => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
  const p = await seite({ gesehen: true, ohne3d: false, ctx });
  await p.evaluate(HILFE);
  await p.waitForFunction(() => { const a = window.__brett.ayo.ui.ansicht3d; return a && a.aktiv; }, null, { timeout: 20000 });
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.ayo, a = g.ui.ansicht3d;
    g.control.setMode(false); g.ui.handleReset(); await new Promise(r => setTimeout(r, 200));
    const z = a.zaehle();
    if (z.samen !== 48) out.push('3D zeigt ' + z.samen + ' Samen statt 48');
    if (!a.huelle.querySelector('canvas') || a.huelle.hidden) out.push('Canvas nicht sichtbar');
    if (!document.getElementById('ayboard').classList.contains('versteckt3d')) out.push('2D-Brett nicht versteckt');
    // Tippen auf Mulde 2 wirkt wie in 2D
    const pt = a.bildschirmPunkt(2);
    a.tippen(pt.x, pt.y);
    await new Promise(r => setTimeout(r, 150));
    if (g.entity.currentPlayer !== 'B' || g.entity.cells[2] !== 0) out.push('Tippen in 3D zieht nicht (Mulde 2: ' + g.entity.cells[2] + ')');
    if (a.zaehle().samen !== 48) out.push('Samen nach Zug: ' + a.zaehle().samen);
    // Ansicht wählbar, Wahl bleibt
    document.querySelector('#ayo-view .ansicht-knopf').click();
    await new Promise(r => setTimeout(r, 100));
    if (GameUI.einst.ansicht('ayo') !== '2d') out.push('Wahl 2D nicht gespeichert');
    if (document.getElementById('ayboard').classList.contains('versteckt3d')) out.push('2D-Brett nach Umschalten versteckt');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  // Ohne WebGL bleibt 2D
  const q = await seite({ gesehen: true, ohne3d: false, vorher: () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; } });
  await q.waitForTimeout(1500);
  const ohne = await q.evaluate(() => ({ versteckt: document.getElementById('ayboard').classList.contains('versteckt3d'), aus: !(window.__brett.ayo.ui.ansicht3d && window.__brett.ayo.ui.ansicht3d.aktiv) }));
  if (ohne.versteckt || !ohne.aus) r.push('Ohne WebGL nicht 2D: ' + JSON.stringify(ohne));
  r.push(...q.fehler.map(x => 'Ohne WebGL: ' + x));
  await zu(q);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-15: Lernhilfe (PS-34) ----------
test('ay_lernen', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.ayo, ui = g.ui;
    g.control.setMode(false); ui.handleReset();
    // Süd 2 hat 1 Samen und Nord 11 (3 Samen) könnte ihn schlagen; Süd 5 (2 Samen) schlägt Nord 7 (1 Samen)
    g.entity.loadFromJSON(window.__stand({ m: { 2: 1, 5: 2, 7: 1, 11: 3, 9: 4 }, p: 'A' }));
    GameUI.einst.setzeLernen('ayo', true); ui._lernenKnopf(); ui.render();
    const el = i => document.querySelector(`#ayboard .ay-mulde[data-i="${i}"]`);
    if (!el(2).classList.contains('gefahr') || !el(2).querySelector('.ay-warn')) out.push('Gefährdete Mulde 2 nicht markiert');
    const s5 = el(5).querySelector('.ay-schlagzahl');
    if (!el(5).classList.contains('schlag') || !s5 || s5.textContent.trim() !== '2') out.push('Schlagzahl an Mulde 5 fehlt: ' + (s5 && s5.textContent));
    if (el(0).classList.contains('gefahr') || el(0).classList.contains('schlag')) out.push('Fehlalarm an Mulde 0');
    // Lernhilfe aus: keine Markierung
    document.querySelector('#ayo-view .lernen-knopf').click();
    if (GameUI.einst.lernen('ayo') !== false) out.push('Lernhilfe nicht ausgeschaltet');
    if (document.querySelector('#ayboard .gefahr, #ayboard .schlag, #ayboard .ay-warn, #ayboard .ay-schlagzahl')) out.push('Markierung trotz Lernhilfe aus');
    if (!el(5).classList.contains('valid')) out.push('Ring (spielbar) fehlt bei Lernhilfe aus');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-17: Zug zurück und Tipp (PS-35) ----------
test('ay_zurueck', async () => {
  const p = await seite({ gesehen: true });
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.ayo, ui = g.ui, c = g.control;
    c.setMode(true); ui.handleReset(); c.setDifficulty('leicht'); c.setZufall(() => 0.9);
    const start = JSON.stringify(g.entity.toJSON().cells);
    if (c.canUndo()) out.push('Zug zurück vor dem ersten Zug möglich');
    ui.handlePitClick(2);
    for (let i = 0; i < 40 && g.entity.currentPlayer !== 'A'; i++) await new Promise(r => setTimeout(r, 100));
    const nach1 = JSON.stringify(g.entity.toJSON().cells);
    ui.handlePitClick(g.entity.getValidMoves()[0]);
    for (let i = 0; i < 40 && g.entity.currentPlayer !== 'A'; i++) await new Promise(r => setTimeout(r, 100));
    if (!c.canUndo()) out.push('Zug zurück nicht möglich');
    ui.handleUndo();
    if (JSON.stringify(g.entity.toJSON().cells) !== nach1) out.push('Zug zurück führt nicht zum Stand nach dem ersten Paar');
    ui.handleUndo();
    if (JSON.stringify(g.entity.toJSON().cells) !== start) out.push('Zweimal zurück führt nicht zum Start');
    if (c.canUndo()) out.push('Zug zurück über den Start hinaus möglich');
    // Tipp nennt einen erlaubten Zug
    const t = await c.computeHint();
    if (!g.entity.getValidMoves().includes(t)) out.push('Tipp ' + t + ' nicht erlaubt');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- Nachtrag aus der Zweitprüfung: PS-40 bis PS-44, Animation, Speicherstand ----------
test('ay_nachtrag', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = new AyoEntity().R;
    // PS-40: Gegner hat genau 1 Samen: kein Füttern-Zwang
    let e = window.__ent({ m: { 0: 3, 1: 2, 6: 1 } });
    if (!window.__gleich(e.getValidMoves(), [0, 1])) out.push('PS-40: ' + JSON.stringify(e.getValidMoves()));
    // PS-41: Süd 5 mit 12 Samen endet in Nord 6 und schlägt 3
    e = window.__ent({ m: { 5: 12, 6: 1 } });
    const z = R.zug(e.cells, 'A', 5);
    if (!window.__gleich(z.geschlagen, [6]) || z.summe !== 3) out.push('PS-41 Süd: ' + JSON.stringify(z.geschlagen) + ' ' + z.summe);
    // Nord über die Indexgrenze: 11 mit 2 Samen, Süd 0 und 1 je 1 Samen: schlägt 1, dann 0
    e = window.__ent({ m: { 11: 2, 0: 1, 1: 1, 3: 4 }, p: 'B' });
    const zn = R.zug(e.cells, 'B', 11);
    if (!window.__gleich(zn.geschlagen, [1, 0])) out.push('PS-41 Nord: ' + JSON.stringify(zn.geschlagen));
    // PS-42: Endstand mit Seitensamen, 20 plus 5 gegen 23
    const c = Array(14).fill(0); c[2] = 5; c[12] = 20; c[13] = 23;
    const es = R.endstand(c);
    if (es.winner !== 'A' || es.cells[12] !== 25) out.push('PS-42 Endstand: ' + JSON.stringify(es));
    // PS-42: verfallener Schlag setzt den Halbzugzähler nicht zurück
    e = window.__ent({ m: { 5: 1, 6: 1 }, h: 7 });
    e.applyMove(5);
    if (e.halbzuege !== 8 || !e.letzter.verfallen || e.letzter.summe !== 0) out.push('PS-42 verfallen: h=' + e.halbzuege + ' ' + JSON.stringify(e.letzter));
    // PS-43: Speicherrunde behält Verlauf und Zähler
    const e2 = new AyoEntity(); e2.loadFromJSON(e.toJSON());
    if (!window.__gleich(e2.toJSON(), e.toJSON())) out.push('PS-43 Speicherrunde');
    // Invarianten beim Laden: Verlauf passt zum Zähler und zur Stellung
    const s = window.__stand({ m: { 0: 3, 6: 1 }, h: 5 });
    s.historie = []; if (new AyoEntity().loadFromJSON(s)) out.push('leerer Verlauf angenommen');
    const s2 = window.__stand({ m: { 0: 3, 6: 1 }, h: 5 }); s2.historie = ['0,0,0,0,0,0,0,0,0,0,0,0,24,24:A', s2.historie[0]].concat(Array(9).fill(s2.historie[0]));
    if (new AyoEntity().loadFromJSON(s2)) out.push('Verlauf länger als Zähler angenommen');
    const s3 = window.__stand({ m: { 0: 3, 6: 1 }, h: 1 }); s3.historie = ['1,0,0,0,0,0,0,0,0,0,0,0,23,24:A'];
    if (new AyoEntity().loadFromJSON(s3)) out.push('Verlauf passt nicht zur Stellung');
    return out;
  });
  // PS-43: Zug zurück stellt Verlauf und Zähler wieder her
  const u = await p.evaluate(async () => {
    const out = [], g = window.__brett.ayo, ui = g.ui, c = g.control;
    c.setMode(true); ui.handleReset(); c.setDifficulty('leicht'); c.setZufall(() => 0.9);
    const start = JSON.stringify([g.entity.halbzuege, g.entity.historie]);
    ui.handlePitClick(2);
    for (let i = 0; i < 40 && g.entity.currentPlayer !== 'A'; i++) await new Promise(r => setTimeout(r, 100));
    ui.handleUndo();
    if (JSON.stringify([g.entity.halbzuege, g.entity.historie]) !== start) out.push('PS-43: Zug zurück stellt Verlauf/Zähler nicht her');
    return out;
  });
  // PS-44: Partie endet, weil der Gegner nicht füttern kann; Hinweis in der Statuszeile
  const f = await p.evaluate(() => {
    const g = window.__brett.ayo; g.control.setMode(false); g.ui.handleReset();
    g.entity.loadFromJSON(window.__stand({ m: { 5: 1, 8: 1 } })); g.ui.render();
    g.ui.handlePitClick(5);
    return { grund: g.entity.grund, fertig: g.entity.finished, text: g.ui.statusEl.textContent };
  });
  if (f.grund !== 'nichtfuettern' || !/füttern/.test(f.text)) r.push('PS-44: ' + JSON.stringify(f));
  r.push(...u);
  // Animation (nicht reduziert): Sperre geht wieder auf, auch bei Fehler und nach Neustart
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true, reducedMotion: 'no-preference' });
  const q = await seite({ gesehen: true, ctx });
  await q.evaluate(HILFE);
  const an = await q.evaluate(async () => {
    const out = [], g = window.__brett.ayo, ui = g.ui, w = ms => new Promise(r => setTimeout(r, ms));
    g.control.setMode(false); ui.handleReset();
    const basis = Object.getPrototypeOf(Object.getPrototypeOf(ui)), ao = basis.afterMove; let nach = 0;
    basis.afterMove = function (x) { nach++; return ao.call(this, x); };
    ui.handlePitClick(2);
    if (!ui._sperre) out.push('Sperre während der Animation fehlt');
    ui.handleReset();                       // Neustart mitten in der Animation
    await w(2000);
    if (ui._sperre) out.push('Sperre nach Animation noch an');
    if (nach !== 0) out.push('Rückruf nach Neustart lief trotzdem (' + nach + ')');
    ui.handlePitClick(1); await w(2000);
    if (nach !== 1) out.push('Rückruf nach normalem Zug ' + nach + ' statt 1');
    ui.handleReset();
    if (g.entity.cells.slice(0, 12).some(v => v !== 4) || g.entity.currentPlayer !== 'A') out.push('Neustart während Animation gestört');
    const orig = ui._animiereSaeen;
    ui._animiereSaeen = async () => { throw new Error('x'); };
    ui.handlePitClick(1); await w(300);
    if (ui._sperre) out.push('Sperre nach Fehler in der Animation noch an');
    ui._animiereSaeen = orig; basis.afterMove = ao;
    return out;
  });
  r.push(...an);
  r.push(...q.fehler);
  await zu(q);
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- Bilder aus Spielersicht (Phase 10) ----------
test('ay_bilder', async () => {
  if (!process.env.BILDER) return;
  fs.mkdirSync(process.env.BILDER, { recursive: true });
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const foto = async (n) => { await p.waitForTimeout(300); await p.screenshot({ path: path.join(process.env.BILDER, `ayo-${n}.png`), fullPage: true }); };
  await p.evaluate(() => { const g = window.__brett.ayo; g.control.setMode(false); g.ui.handleReset(); });
  await foto('start-2d');
  await p.evaluate(() => { const g = window.__brett.ayo; g.entity.loadFromJSON(window.__stand({ m: { 2: 1, 5: 2, 7: 1, 11: 3, 9: 4, 0: 6, 3: 5, 8: 3 }, p: 'A' })); g.ui.render(); });
  await foto('lernhilfe-2d');
  await p.evaluate(() => { const g = window.__brett.ayo; g.entity.loadFromJSON(window.__stand({ m: { 0: 1, 2: 3, 5: 5, 6: 4, 8: 2, 9: 1, 10: 2 }, p: 'A' })); g.ui.render(); document.querySelector('#ayboard .ay-mulde[data-i="5"]').click(); });
  await foto('kettenschlag-2d');
  await p.evaluate(() => { document.querySelector('#ayo-view .hilfe-knopf').click(); });
  await foto('hilfe');
  await zu(p);
  const q = await seite({ gesehen: true, ohne3d: false, ctx: await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true }) });
  await q.evaluate(HILFE);
  await q.waitForFunction(() => { const a = window.__brett.ayo.ui.ansicht3d; return a && a.aktiv; }, null, { timeout: 20000 });
  await q.evaluate(() => { const g = window.__brett.ayo; g.control.setMode(false); g.ui.handleReset(); g.ui.handlePitClick(2); });
  await q.waitForTimeout(800);
  await q.screenshot({ path: path.join(process.env.BILDER, 'ayo-start-3d.png'), fullPage: true });
  await zu(q);
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
    catch (e) { rot++; console.log(`FEHLER ${t.name}: ${String(e.message).slice(0, 600)}`); if (process.env.DEBUG) console.log(e.stack); }
  }
  await browser.close(); server.kill();
  console.log(rot ? `\n${rot} Test(s) rot.` : '\nAlle Tests grün.');
  process.exit(rot ? 1 : 0);
})();
