// Tests für S-W24 (Tavla in den Brettspielen).
// Aufruf: node werkstatt/tests/tavla_test.js [ORDNER]   (NUR=name1,name2 wählt Tests, BILDER=ordner speichert Bilder)
// WebGL läuft im Container in Software.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;
const SCHLUESSEL = 'brettspiele.einstellungen';
const TAVLA = 'brettspiele.tavla';

let browser;
// opts.gesehen: Übung schon gesehen; opts.ton: Ton an lassen; opts.vorher: eigenes Init-Skript; opts.quer: Querformat; opts.ohne3d: Ansicht 2D
async function seite(opts = {}) {
  const ctx = opts.ctx || await browser.newContext({ viewport: opts.quer ? { width: 915, height: 412 } : { width: 412, height: 915 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  await p.addInitScript(([k, t, g, ton, ohne3d]) => {
    try {
      if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify({ formatversion: 1, ton: ton, stufen: {}, ansicht: ohne3d ? { tavla: '2d' } : {}, lernen: {}, muehleEinfuehrung: true }));
      if (g && !localStorage.getItem(t)) localStorage.setItem(t, JSON.stringify({ formatversion: 1, einfuehrung: true }));
    } catch (e) { }
  }, [SCHLUESSEL, TAVLA, !!opts.gesehen, !!opts.ton, opts.ohne3d !== false]);
  if (opts.vorher) await p.addInitScript(opts.vorher);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.tavla, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=tavla]').click());
  await p.waitForTimeout(250);
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

// Hilfen im Browser: Stellung laden, Zufall, Spiegelung
const HILFE = () => {
  window.__stand = (o) => {
    const pkt = Array(24).fill(0);
    for (const [i, v] of Object.entries(o.pkt || {})) pkt[+i] = v;
    const bar = Object.assign({ A: 0, B: 0 }, o.bar || {});
    const A = pkt.filter(v => v > 0).reduce((a, b) => a + b, 0) + bar.A;
    const B = -pkt.filter(v => v < 0).reduce((a, b) => a + b, 0) + bar.B;
    if (!o.ab) {
      if (A === 0) pkt[o.pkt && o.pkt[1] ? 3 : 1] += 1;          // ruhender Stein, damit nicht alle 15 abgetragen sind
      if (B === 0) pkt[o.pkt && o.pkt[22] ? 21 : 22] -= 1;
    }
    const A2 = pkt.filter(v => v > 0).reduce((a, b) => a + b, 0) + bar.A;
    const B2 = -pkt.filter(v => v < 0).reduce((a, b) => a + b, 0) + bar.B;
    const ab = o.ab || { A: 15 - A2, B: 15 - B2 };
    const rest = o.rest || [];
    const w = o.w || (rest.length === 2 ? rest.slice() : rest.length ? [rest[0], rest[0]] : []);
    return { formatversion: 1, cells: pkt, bar, ab, currentPlayer: o.p || 'A', phase: rest.length ? 'ziehen' : 'wuerfeln', wurf: w, rest,
      finished: false, winner: null, mars: false, punkte: 0, ausgesetzt: null, geschlagen: false, teilweise: false, wurfZaehler: 0 };
  };
  window.__ent = (o) => { const e = new TavlaEntity(); const ok = e.loadFromJSON(window.__stand(o)); if (!ok) throw new Error('Stellung abgelehnt'); return e; };
  window.__zuf = (seed) => () => { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__summe = (e) => {
    const A = e.cells.filter(v => v > 0).reduce((a, b) => a + b, 0) + e.bar.A + e.ab.A;
    const B = -e.cells.filter(v => v < 0).reduce((a, b) => a + b, 0) + e.bar.B + e.ab.B;
    return [A, B];
  };
};

// ---------- AK-1, AK-2: Grundregeln (PS-1, PS-3 bis PS-6, PS-15, PS-29, U-8) ----------
test('ta_regeln', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = tavlaRegelwerk();
    const gleich = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    // PS-1 Aufstellung
    const e0 = new TavlaEntity(), c = e0.cells;
    const soll = { 23: 2, 12: 5, 7: 3, 5: 5, 0: -2, 11: -5, 16: -3, 18: -5 };
    for (let i = 0; i < 24; i++) if (c[i] !== (soll[i] || 0)) out.push(`Aufstellung Punkt ${i}: ${c[i]}`);
    if (!gleich(window.__summe(e0), [15, 15])) out.push('Summe Start ' + window.__summe(e0));
    if (e0.currentPlayer !== 'A' || e0.phase !== 'wuerfeln') out.push('Weiß muss würfeln');
    // PS-3 Normal
    const e1 = new TavlaEntity(); e1.setzeWurf(3, 1);
    const z1 = e1.getValidMoves();
    if (!z1.some(z => z.von === 7 && z.nach === 4 && z.w === 3)) out.push('Zug 8 nach 5 fehlt');
    if (z1.some(z => z.nach === 11)) out.push('Zug auf gesperrten Punkt mit 5 Gegnern erlaubt');
    if (z1.some(z => z.von === 12 && z.nach === 11)) out.push('12 nach 11 erlaubt');
    // PS-4 genau 1 Gegner schlägt, 2 sperren
    const e2 = window.__ent({ pkt: { 10: 1, 7: -1, 6: -2, 20: 2 }, rest: [3, 4] });
    const z2 = e2.getValidMoves();
    if (!z2.some(z => z.von === 10 && z.nach === 7)) out.push('Schlagzug auf Einzelstein fehlt');
    if (z2.some(z => z.von === 10 && z.nach === 6)) out.push('Zug auf Punkt mit 2 Gegnern erlaubt');
    // PS-5 Schlagen (U-8)
    const res = e2.applyMove(10, 7);
    if (res) out.push('Partie fälschlich beendet');
    if (e2.bar.B !== 1 || e2.cells[7] !== 1) out.push(`Schlagen: Bar ${e2.bar.B}, Punkt ${e2.cells[7]}`);
    if (!e2.geschlagen) out.push('geschlagen-Flag fehlt');
    if (!gleich(window.__summe(e2), [15, 15])) out.push('Summe nach Schlagen ' + window.__summe(e2));
    // PS-6 Bar zuerst, Einwurf auf Punkt mit 2 Gegnern verboten
    const e3 = window.__ent({ pkt: { 12: 3, 18: -2, 0: -2 }, bar: { A: 1 }, rest: [3, 6] });
    const z3 = e3.getValidMoves();
    if (!z3.length || z3.some(z => z.von !== 'bar')) out.push('Bar-Stein nicht zuerst: ' + JSON.stringify(z3));
    if (!z3.some(z => z.von === 'bar' && z.nach === 21 && z.w === 3)) out.push('Einwurf mit 3 auf Punkt 22 fehlt');
    if (z3.some(z => z.nach === 18)) out.push('Einwurf auf gesperrten Punkt');
    // PS-29 Fehlalarm: Einwurf auf Punkt mit 1 Gegner erlaubt und schlägt
    const e4 = window.__ent({ pkt: { 12: 3, 21: -1, 0: -2 }, bar: { A: 1 }, rest: [3, 2] });
    if (!e4.getValidMoves().some(z => z.von === 'bar' && z.nach === 21)) out.push('Einwurf auf Einzelstein verboten');
    e4.applyMove('bar', 21);
    if (e4.bar.B !== 1 || e4.bar.A !== 0) out.push('Einwurf schlägt nicht');
    // PS-15 ungültige Züge
    const e5 = new TavlaEntity();
    const vorher = JSON.stringify(e5.toJSON());
    const wirft = (f) => { try { f(); return false; } catch (x) { return true; } };
    if (!wirft(() => e5.applyMove(12, 8))) out.push('Zug ohne Wurf angenommen');
    e5.setzeWurf(3, 1);
    const nachWurf = JSON.stringify(e5.toJSON());
    for (const [v, n] of [[0, 3], [12, 11], [99, 4], [7, 'ab'], ['bar', 20], [5, 5], [11, 8]]) {
      if (!wirft(() => e5.applyMove(v, n))) out.push(`Ungültiger Zug ${v}->${n} angenommen`);
    }
    if (JSON.stringify(e5.toJSON()) !== nachWurf) out.push('Ungültige Züge ändern den Stand');
    if (vorher === nachWurf) out.push('Wurf ändert nichts');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-2, AK-3: Zwang, Pasch, Aussetzen (PS-7 bis PS-10, PS-29, PS-32; U-9, U-10) ----------
test('ta_zwang', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], R = tavlaRegelwerk();
    // PS-7 Pasch über den echten Wurf: vier Würfel
    const pw = new TavlaEntity(); pw.setzeWurf(4, 4);
    if (pw.rest.length !== 4) out.push('Pasch gibt ' + pw.rest.length + ' Würfel statt 4');
    const nw = new TavlaEntity(); nw.setzeWurf(4, 3);
    if (nw.rest.length !== 2) out.push('Normaler Wurf gibt ' + nw.rest.length + ' Würfel');
    // PS-7 Pasch: vier Züge, danach wechselt der Zug
    let e = window.__ent({ pkt: { 9: 1, 20: -3 }, rest: [2, 2, 2, 2] });
    for (let k = 1; k <= 4; k++) {
      const z = e.getValidMoves();
      if (!z.length) { out.push(`Pasch: kein Zug beim ${k}. Zug`); break; }
      e.applyMove(z[0].von, z[0].nach);
      if (k < 4 && e.currentPlayer !== 'A') out.push(`Pasch: zu früh gewechselt nach ${k}`);
    }
    if (e.currentPlayer !== 'B' || e.phase !== 'wuerfeln') out.push('Pasch: nach vier Zügen kein Wechsel');
    // nur drei möglich (Punkt 1 gesperrt): nach drei Zügen wechselt der Zug
    e = window.__ent({ pkt: { 9: 1, 1: -2 }, rest: [2, 2, 2, 2] });
    let n = 0;
    while (e.currentPlayer === 'A' && n < 6) { const z = e.getValidMoves(); if (!z.length) break; e.applyMove(z[0].von, z[0].nach); n++; }
    if (n !== 3) out.push(`Pasch mit Sperre: ${n} Züge statt 3`);
    if (e.currentPlayer !== 'B') out.push('Pasch mit Sperre: kein Wechsel nach dem dritten Zug');
    // PS-8 Eigenschaft gegen einfache Vergleichsrechnung
    const zuf = window.__zuf(7);
    const einf = (s, pl, rest) => R.einzelzuege(s, pl, rest);
    const maxL = (s, pl, rest) => { let m = 0; for (const z of einf(s, pl, rest)) { const r2 = rest.slice(); r2.splice(r2.indexOf(z.w), 1); m = Math.max(m, 1 + maxL(R.wende(s, pl, z).s, pl, r2)); } return m; };
    const schl = (z) => `${z.von}>${z.nach}:${z.w}`;
    let proben = 0, zwei = 0, fehlerPs8 = 0, groesser = 0;
    for (let spiel = 0; spiel < 40 && proben < 300; spiel++) {
      let s = R.start(), pl = 'A', schritte = 0;
      while (schritte++ < 400 && s.ab.A < 15 && s.ab.B < 15 && proben < 300) {
        const a = 1 + Math.floor(zuf() * 6), b = 1 + Math.floor(zuf() * 6);
        const rest = a === b ? [a, a, a, a] : [a, b];
        const erlaubt = R.erlaubteErste(s, pl, rest);
        if (rest.length === 2) {
          const alle = einf(s, pl, rest);
          let ml = 0; const laenge = new Map();
          for (const z of alle) { const r2 = rest.slice(); r2.splice(r2.indexOf(z.w), 1); const l = 1 + maxL(R.wende(s, pl, z).s, pl, r2); laenge.set(schl(z), l); ml = Math.max(ml, l); }
          let soll = alle.filter(z => laenge.get(schl(z)) === ml);
          if (ml === 1 && a !== b && soll.some(z => z.w === Math.max(a, b))) { soll = soll.filter(z => z.w === Math.max(a, b)); if (alle.some(z => z.w !== Math.max(a, b))) groesser++; }
          const sollS = soll.map(schl).sort().join('|'), istS = erlaubt.map(schl).sort().join('|');
          if (sollS !== istS) { fehlerPs8++; if (fehlerPs8 < 3) out.push(`PS-8 Abweichung (Würfel ${a},${b}): soll ${sollS} ist ${istS}`); }
          proben++; zwei++;
        }
        // eine zufällige Folge spielen
        let rr = rest.slice();
        for (;;) {
          const z = R.erlaubteErste(s, pl, rr);
          if (!z.length) break;
          const m = z[Math.floor(zuf() * z.length)];
          s = R.wende(s, pl, m).s; rr.splice(rr.indexOf(m.w), 1);
          if (s.ab[pl] === 15) break;
        }
        pl = pl === 'A' ? 'B' : 'A';
      }
    }
    if (proben < 300) out.push(`PS-8: nur ${proben} Proben`);
    if (!groesser) out.push('PS-8: keine Probe mit der Regel "größerer Würfel" gefunden');
    // PS-9 handgebaut: Würfel 3 und 6, nur einer nutzbar -> nur der größere
    e = window.__ent({ pkt: { 10: 1, 1: -2 }, rest: [3, 6] });
    let z = e.getValidMoves();
    if (z.length !== 1 || z[0].w !== 6 || z[0].von !== 10 || z[0].nach !== 4) out.push('PS-9: nur 10 nach 4 mit der 6 erwartet, war ' + JSON.stringify(z));
    // Fehlalarm: ohne Sperre sind beide Würfel nutzbar, beide Anfangszüge erlaubt
    e = window.__ent({ pkt: { 10: 1 }, rest: [3, 6] });
    z = e.getValidMoves();
    if (!(z.some(m => m.w === 3) && z.some(m => m.w === 6))) out.push('PS-29: beide Würfel müssen erlaubt sein, war ' + JSON.stringify(z));
    // PS-10 / U-10: kein Zug, Runde verfällt
    e = window.__ent({ pkt: { 18: -2, 19: -2, 20: -2, 21: -2, 22: -2, 23: -2, 12: 3 }, bar: { A: 1 }, p: 'A' });
    const w = e.setzeWurf(2, 5);
    if (e.currentPlayer !== 'B' || e.phase !== 'wuerfeln' || e.rest.length) out.push('PS-10: Runde verfällt nicht');
    if (e.ausgesetzt !== 'A' || w.ausgesetzt !== 'A') out.push('PS-10: ausgesetzt fehlt');
    // Mitten in der Runde unspielbar: nach dem ersten Zug verfällt der Rest
    e = window.__ent({ pkt: { 10: 1, 1: -2, 0: -2 }, rest: [6, 3] });
    e.applyMove(10, 4);
    if (e.currentPlayer !== 'B') out.push('Restwürfel verfällt nicht');
    // PS-32 Spiegelung
    const spiegel = (s) => ({ pkt: s.pkt.map((_, i) => -s.pkt[23 - i]), bar: { A: s.bar.B, B: s.bar.A }, ab: { A: s.ab.B, B: s.ab.A } });
    const spZug = (z) => ({ von: z.von === 'bar' ? 'bar' : 23 - z.von, nach: z.nach === 'ab' ? 'ab' : 23 - z.nach, w: z.w });
    let sp = 0;
    const zf2 = window.__zuf(99);
    for (let g = 0; g < 8; g++) {
      let s = R.start(), pl = 'A';
      for (let t = 0; t < 120 && s.ab.A < 15 && s.ab.B < 15; t++) {
        const a = 1 + Math.floor(zf2() * 6), b = 1 + Math.floor(zf2() * 6), rest = a === b ? [a, a, a, a] : [a, b];
        const m1 = R.erlaubteErste(s, pl, rest).map(schl).sort().join('|');
        const ms = spiegel(s), pl2 = pl === 'A' ? 'B' : 'A';
        const m2 = R.erlaubteErste(ms, pl2, rest).map(spZug).map(schl).sort().join('|');
        if (m1 !== m2) { out.push(`PS-32 Spiegelung: ${m1} gegen ${m2}`); g = 99; break; }
        sp++;
        let rr = rest.slice();
        for (;;) { const zz = R.erlaubteErste(s, pl, rr); if (!zz.length) break; const mm = zz[Math.floor(zf2() * zz.length)]; s = R.wende(s, pl, mm).s; rr.splice(rr.indexOf(mm.w), 1); if (s.ab[pl] === 15) break; }
        pl = pl === 'A' ? 'B' : 'A';
      }
    }
    if (sp < 200) out.push('PS-32: nur ' + sp + ' Spiegelproben');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-4: Abtragen (PS-11, PS-12, PS-29; U-11) ----------
test('ta_abtragen', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], hat = (e, f) => e.getValidMoves().some(f), ab = (z) => z.nach === 'ab';
    // PS-11: ein Stein außerhalb, einer auf der Bar
    let e = window.__ent({ pkt: { 8: 1, 2: 2, 3: 2 }, rest: [3, 1] });
    if (hat(e, ab)) out.push('Abtragen trotz Stein außerhalb');
    e = window.__ent({ pkt: { 2: 2, 3: 2, 20: -3 }, bar: { A: 1 }, rest: [3, 4] });
    if (hat(e, ab) || e.getValidMoves().some(z => z.von !== 'bar')) out.push('Abtragen trotz Stein auf der Bar');
    // Fehlalarm: nach dem ersten Abtragen (14 auf dem Brett, alle im Heimfeld) bleibt Abtragen möglich
    e = window.__ent({ pkt: { 2: 1, 4: 1 }, rest: [3, 5] });
    if (!hat(e, z => ab(z) && z.von === 2 && z.w === 3)) out.push('Abtragen mit weniger als 15 Steinen gesperrt');
    // PS-12 exakt
    if (!hat(e, z => ab(z) && z.von === 4 && z.w === 5)) out.push('Abtragen Punkt 5 mit 5 fehlt');
    // PS-12 größere Zahl vom höchsten Punkt (Fehlalarm-Fall)
    e = window.__ent({ pkt: { 2: 1 }, rest: [5, 6] });
    if (!hat(e, z => ab(z) && z.von === 2)) out.push('Abtragen mit größerer Zahl vom höchsten Punkt gesperrt');
    // PS-12 niedrigerer Punkt, solange höher noch Steine stehen
    e = window.__ent({ pkt: { 5: 1, 2: 1 }, rest: [5, 4] });
    if (hat(e, z => ab(z) && z.von === 2 && z.w === 5)) out.push('Abtragen von Punkt 3 mit 5, obwohl Punkt 6 besetzt');
    if (!hat(e, z => z.von === 5 && z.nach === 0 && z.w === 5)) out.push('Zug 6 nach 1 mit 5 fehlt');
    // Schwarz spiegelbildlich
    e = window.__ent({ pkt: { 21: -1, 20: -1 }, p: 'B', rest: [3, 1] });
    if (!hat(e, z => ab(z) && z.von === 21 && z.w === 3)) out.push('Schwarz: Abtragen exakt fehlt');
    e = window.__ent({ pkt: { 18: -1, 12: -1 }, p: 'B', rest: [3, 2] });
    if (hat(e, ab)) out.push('Schwarz: Abtragen trotz Stein außerhalb');
    // Zähler
    e = window.__ent({ pkt: { 2: 1, 4: 1, 20: -2 }, rest: [3, 5] });
    const vor = e.ab.A; e.applyMove(2, 'ab');
    if (e.ab.A !== vor + 1 || e.cells[2] !== 0) out.push('Abtragen zählt nicht');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-5: Ende und Mars (PS-13, PS-14; U-12) ----------
test('ta_ende', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [];
    // Mars: Verlierer hat keinen Stein abgetragen
    let e = window.__ent({ pkt: { 0: 1, 20: -8, 21: -7 }, rest: [1, 2] });
    let res = e.applyMove(0, 'ab');
    if (!res || res.winner !== 'A') out.push('Sieger fehlt: ' + JSON.stringify(res));
    else if (!res.mars || res.punkte !== 2) out.push(`Mars erwartet: ${JSON.stringify(res)}`);
    if (!e.finished || !e.mars || e.punkte !== 2 || e.winner !== 'A') out.push('Entity-Zustand nach Mars');
    // PS-14 danach keine Züge, kein Wurf
    if (e.getValidMoves().length) out.push('Züge nach dem Ende');
    if (!e.setzeWurf(3, 4).invalid) out.push('Wurf nach dem Ende angenommen');
    try { e.applyMove(0, 'ab'); out.push('Zug nach dem Ende angenommen'); } catch (x) { }
    // einfacher Sieg: Verlierer hat 1 Stein abgetragen
    e = window.__ent({ pkt: { 0: 1, 20: -8, 21: -6 }, rest: [1, 2] });
    res = e.applyMove(0, 'ab');
    if (!res || res.mars || res.punkte !== 1) out.push('Kein einfacher Sieg bei 1 abgetragenem Stein: ' + JSON.stringify(res));
    // Schwarz gewinnt mit Mars
    e = window.__ent({ pkt: { 23: -1, 3: 8, 4: 7 }, p: 'B', rest: [1, 6] });
    res = e.applyMove(23, 'ab');
    if (!res || res.winner !== 'B' || !res.mars) out.push('Schwarz-Mars: ' + JSON.stringify(res));
    // Mitten in der Partie kein Ende
    e = window.__ent({ pkt: { 0: 2, 20: -8, 21: -7 }, rest: [1, 2] });
    res = e.applyMove(0, 'ab');
    if (res || e.finished) out.push('Ende zu früh');
    return out;
  });
  // Oberfläche zeigt Mars
  const text = await p.evaluate(() => {
    const g = window.__brett.tavla; window.__ent;
    g.control.setMode(false);
    g.entity.loadFromJSON(window.__stand({ pkt: { 0: 1, 20: -8, 21: -7 }, rest: [1, 2] }));
    const o = g.control.tippe(0); const o2 = g.control.tippe('ab');
    g.ui.afterMove(o2.result);
    return document.getElementById('tastatus').textContent;
  });
  if (!/Mars/.test(text)) r.push('Statuszeile ohne "Mars": ' + text);
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-6: Zufall von außen (PS-2, PS-16) ----------
test('ta_zufall', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [];
    for (const f of [TavlaEntity, TavlaBoundary, tavlaRegelwerk]) {
      const q = f.toString();
      if (/Math\.random|Date\.now|new Date|performance\.now/.test(q)) out.push(`${f.name} erzeugt Zufall oder Zeit`);
    }
    // PS-16 Missbrauch
    const e = new TavlaEntity();
    const vor = JSON.stringify(e.toJSON());
    for (const [a, b] of [[0, 3], [7, 3], [NaN, 2], [1.5, 2], ['3', 2], [null, 2], [undefined, 2], [-1, 2], [2, Infinity], [{}, 2], [2]]) {
      let res; try { res = e.setzeWurf(a, b); } catch (x) { out.push(`Wurf ${a},${b} wirft Fehler`); continue; }
      if (!res || !res.invalid) out.push(`Wurf ${a},${b} angenommen`);
    }
    if (JSON.stringify(e.toJSON()) !== vor) out.push('Ungültiger Wurf ändert den Stand');
    if (e.setzeWurf(3, 1).invalid) out.push('Gültiger Wurf abgelehnt');
    const nach = JSON.stringify(e.toJSON());
    if (!e.setzeWurf(4, 4).invalid) out.push('Zweiter Wurf ohne Zug angenommen');
    if (JSON.stringify(e.toJSON()) !== nach) out.push('Zweiter Wurf ändert den Stand');
    // PS-2 Wiederholbarkeit: gleiche Würfelfolge, gleiche Zugwahl, gleiche Partie
    const zuf = window.__zuf(5), folge = Array.from({ length: 6000 }, () => 1 + Math.floor(zuf() * 6));
    const spiele = () => {
      const x = new TavlaEntity(); let i = 0, n = 0, fehler = null;
      while (!x.finished && n++ < 3000) {
        if (x.phase === 'wuerfeln') x.setzeWurf(folge[i++], folge[i++]);
        else { const m = x.getValidMoves()[0]; x.applyMove(m.von, m.nach); }
        const s = window.__summe(x); if (s[0] !== 15 || s[1] !== 15) { fehler = `Summe ${s} bei Schritt ${n}`; break; }
      }
      return { h: JSON.stringify(x.toJSON()), n, fertig: x.finished, fehler };
    };
    const a = spiele(), b = spiele();
    if (a.fehler) out.push(a.fehler);
    if (a.h !== b.h || a.n !== b.n) out.push('Gleiche Würfel, verschiedene Partie');
    if (!a.fertig) out.push('Partie endet nicht in 3000 Schritten');
    // Control: Würfelfolge wird verbraucht, Zufall nur als Ersatz
    const c = window.__brett.tavla.control;
    c.setMode(false);
    c.setWuerfelfolge([5, 2]);
    const w = c.wuerfeln();
    if (w.invalid || JSON.stringify(w.wurf) !== '[5,2]') out.push('Würfelfolge nicht benutzt: ' + JSON.stringify(w));
    if (!c.wuerfeln().invalid) out.push('Control würfelt zweimal');
    c.setWuerfelfolge([]); c.restartGame(); c.setZufall(() => 0); const w2 = c.wuerfeln();
    if (JSON.stringify(w2.wurf) !== '[1,1]') out.push('Zufall 0 ergibt nicht 1,1: ' + JSON.stringify(w2.wurf));
    c.restartGame(); c.setZufall(() => 0.9999); const w3 = c.wuerfeln();
    if (JSON.stringify(w3.wurf) !== '[6,6]') out.push('Zufall nahe 1 ergibt nicht 6,6: ' + JSON.stringify(w3.wurf));
    c.restartGame(); c.setZufall(Math.random);
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-7: Speichern (PS-17, PS-18, PS-34) ----------
test('ta_speicher', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [];
    const start = JSON.stringify(new TavlaEntity().toJSON());
    // PS-18 Rundlauf mitten im Zug
    const e = new TavlaEntity(); e.setzeWurf(5, 3);
    const z = e.getValidMoves()[0]; e.applyMove(z.von, z.nach);
    const j = JSON.stringify(e.toJSON());
    if (JSON.parse(j).formatversion !== 1) out.push('Formatversion fehlt');
    const f = new TavlaEntity();
    if (!f.loadFromJSON(JSON.parse(j))) out.push('Gültiger Stand abgelehnt');
    if (JSON.stringify(f.toJSON()) !== j) out.push('Rundlauf verändert den Stand');
    if (JSON.stringify(f.getValidMoves()) !== JSON.stringify(e.getValidMoves())) out.push('Erlaubte Züge nach Rundlauf anders');
    if (JSON.stringify(f.rest) !== JSON.stringify(e.rest)) out.push('Übrige Würfel nach Rundlauf anders');
    // PS-17 Missbrauch
    const gut = () => JSON.parse(JSON.stringify(new TavlaEntity().toJSON()));
    const mut = (fn) => { const d = gut(); fn(d); return d; };
    const faelle = {
      'kein Objekt': null, 'Text': 'x', 'Zahl': 5, 'Liste': [],
      'ohne Version': mut(d => delete d.formatversion), 'Version 2': mut(d => { d.formatversion = 2; }),
      'Summe 14': mut(d => { d.cells[23] = 1; }), 'Summe 16': mut(d => { d.bar.A = 1; }),
      '99 auf Punkt': mut(d => { d.cells[3] = 99; }), 'Bar negativ': mut(d => { d.bar.A = -1; d.cells[23] = 3; }),
      'Länge 23': mut(d => { d.cells.pop(); }), 'Text im Feld': mut(d => { d.cells[4] = 'x'; }), 'Kommazahl': mut(d => { d.cells[23] = 1.5; }),
      'Spieler C': mut(d => { d.currentPlayer = 'C'; }), 'Phase foo': mut(d => { d.phase = 'foo'; }),
      'Würfel 9': mut(d => { d.phase = 'ziehen'; d.wurf = [9, 2]; d.rest = [9, 2]; }),
      'ziehen ohne Würfel': mut(d => { d.phase = 'ziehen'; d.wurf = [3, 1]; d.rest = []; }),
      'Würfeln mit Rest': mut(d => { d.rest = [3]; d.wurf = [3, 1]; }),
      'Rest passt nicht zum Wurf': mut(d => { d.phase = 'ziehen'; d.wurf = [3, 1]; d.rest = [6]; }),
      'beendet ohne 15': mut(d => { d.finished = true; d.winner = 'A'; }),
      '15 abgetragen, nicht beendet': mut(d => { d.ab.A = 15; d.cells[23] = 0; d.cells[12] = 0; d.cells[7] = 0; d.cells[5] = 0; }),
      'Rest passt nicht genau zum Wurf': mut(d => { d.phase = 'ziehen'; d.wurf = [3, 5]; d.rest = [3, 3]; }),
      'Mars ohne passende Zahl': mut(d => { d.mars = true; d.punkte = 2; }),
      'Rest als Text': mut(d => { d.phase = 'ziehen'; d.wurf = [3, 1]; d.rest = '31'; }),
    };
    for (const [name, d] of Object.entries(faelle)) {
      const x = new TavlaEntity(); x.setzeWurf(2, 1);
      let ok; try { ok = x.loadFromJSON(d); } catch (err) { out.push(`${name}: wirft ${err.message}`); continue; }
      if (ok !== false) out.push(`${name}: angenommen`);
      if (JSON.stringify(x.toJSON()) !== start) out.push(`${name}: keine neue Partie`);
    }
    return out;
  });
  // Neuladen der Seite: Stand bleibt (IndexedDB), Würfel bleiben
  await p.evaluate(() => { const g = window.__brett.tavla; g.control.setMode(false); g.control.restartGame(); g.control.setWuerfelfolge([5, 3]); g.ui.handleWuerfeln(); });
  const mitte = await p.evaluate(() => { const g = window.__brett.tavla; const z = g.entity.getValidMoves()[0]; g.control.tippe(z.von); g.ui.handlePunktClick(z.nach); return JSON.stringify(g.entity.toJSON()); });
  await p.waitForTimeout(400);
  await p.reload();
  await p.waitForFunction(() => window.__brett && window.__brett.tavla, null, { timeout: 15000 });
  await p.waitForTimeout(600);
  const nachher = await p.evaluate(() => JSON.stringify(window.__brett.tavla.entity.toJSON()));
  if (nachher !== mitte) r.push('Stand nach Neuladen anders: ' + nachher.slice(0, 200) + ' gegen ' + mitte.slice(0, 200));
  // Computer am Zug beim Neuladen: er setzt fort
  await p.evaluate(() => { const g = window.__brett.tavla; g.control.setMode(true); g.control.restartGame(); g.control.setWuerfelfolge([6, 6]); g.control.setZufall(() => 1); g.ui.handleWuerfeln(); });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-8, AK-14: Bedienung, Maße, Spielgefühl (PS-19, PS-20, PS-21, PS-30, PS-37; U-6, U-7) ----------
test('ta_ui', async () => {
  const p = await seite({ gesehen: true, ton: true });
  await p.evaluate(HILFE);
  const r = [];
  const maße = async (quer) => p.evaluate(() => {
    const out = [], prüf = (sel, n) => document.querySelectorAll(sel).forEach((e, i) => {
      const b = e.getBoundingClientRect(); if (b.width < 1) return;
      if (b.height < 43.5 || b.width < 43.5) out.push(`${n} ${i}: ${Math.round(b.width)}x${Math.round(b.height)}`);
    });
    prüf('#tavla-view .ta-punkt', 'Punkt'); prüf('#tavla-view .ta-bar', 'Bar'); prüf('#taab', 'Abtragen'); prüf('#tawurfBtn', 'Würfeln');
    prüf('#tacontrols button', 'Knopf');
    if (document.documentElement.scrollWidth > window.innerWidth + 1) out.push(`waagerechtes Scrollen ${document.documentElement.scrollWidth} > ${window.innerWidth}`);
    return out;
  });
  r.push(...(await maße()));
  // U-6: Würfeln
  const u6 = await p.evaluate(async () => {
    const out = [], g = window.__brett.tavla, ui = g.ui;
    g.control.setMode(false); ui.handleReset();
    const st = () => document.getElementById('tastatus').textContent;
    if (!/Würfeln/.test(st())) out.push('Status vor dem Wurf: ' + st());
    window.__spion = { klang: [], vib: 0 };
    const k = GameUI.klang.spiele.bind(GameUI.klang); GameUI.klang.spiele = (n) => { window.__spion.klang.push(n); };
    navigator.vibrate = () => { window.__spion.vib++; return true; };
    GameUI.einst.setzeTon(true);
    g.control.setWuerfelfolge([4, 2]);
    document.getElementById('tawurfBtn').click();
    await new Promise(r => setTimeout(r, 60));
    const w = document.querySelectorAll('#tawuerfel .ta-wuerfel');
    if (w.length !== 2) out.push(`${w.length} Würfel statt 2`);
    if (!/4 und 2/.test(st())) out.push('Status nennt die Augen nicht: ' + st());
    if (st().length > 110) out.push('Status zu lang: ' + st().length);
    if (!window.__spion.klang.length || !window.__spion.vib) out.push('Würfeln ohne Ton oder Vibration');
    if (document.getElementById('tawurfBtn').disabled !== true) out.push('Würfeln-Knopf nach dem Wurf noch aktiv');
    document.getElementById('tawurfBtn').click();       // PS-21 zweites Würfeln
    if (JSON.stringify(g.entity.rest) !== '[4,2]') out.push('Zweites Würfeln ändert die Würfel');
    // U-7: Stein antippen, Ziele, Ziel antippen
    const quellen = [...document.querySelectorAll('#taboard .ta-punkt.quelle')];
    if (!quellen.length) out.push('Keine Quellen mit Ring');
    const gegner = document.querySelector('#taboard .ta-punkt[data-i="0"]');
    const vorher = JSON.stringify(g.entity.toJSON());
    gegner.click();                                      // PS-21 Gegnerstein
    if (JSON.stringify(g.entity.toJSON()) !== vorher || document.querySelector('#taboard .ta-punkt.selected')) out.push('Gegnerstein antippen wirkt');
    const q = quellen[0]; q.click();
    if (!document.querySelector('#taboard .ta-punkt.selected')) out.push('Quelle nicht gewählt');
    const ziele = [...document.querySelectorAll('#taboard .ta-punkt.ziel, #taboard .ta-bar.ziel, #taab.ziel')];
    if (!ziele.length) out.push('Keine Ziele');
    const brettVor = JSON.stringify(g.entity.cells);
    const zielIndex = ziele[0].id === 'taab' ? 'ab' : ziele[0].classList.contains('ta-bar') ? 'bar' : +ziele[0].dataset.i;
    ziele[0].click();
    if (JSON.stringify(g.entity.cells) === brettVor) out.push('Zug nicht ausgeführt');
    if (document.querySelectorAll('#tawuerfel .ta-wuerfel.benutzt').length !== 1) out.push('Würfel nicht grau nach dem Zug');
    if (!document.querySelector('#taboard .ta-punkt.neu')) out.push('Kein Ploppen am Ziel');
    const nachZug = JSON.stringify(g.entity.toJSON());
    g.ui.handlePunktClick(zielIndex);                    // PS-21 Doppeltippen auf dasselbe Feld
    if (JSON.stringify(g.entity.toJSON()) !== nachZug) out.push('Doppeltippen ändert den Stand');
    if (!window.__spion.klang.includes('zug')) out.push('Kein Zugklang');
    if (st().length > 110) out.push('Status nach Zug zu lang: ' + st().length);
    GameUI.klang.spiele = k;
    return out;
  });
  r.push(...u6);
  // PS-20: 15 Steine auf einem Punkt
  const stapel = await p.evaluate(() => {
    const out = [], g = window.__brett.tavla;
    g.entity.loadFromJSON(window.__stand({ pkt: { 5: 15, 18: -15 }, rest: [] })); g.control.selected = null; g.ui.render();
    const pt = document.querySelector('#taboard .ta-punkt[data-i="5"]'), b = pt.getBoundingClientRect();
    if (pt.scrollWidth > pt.clientWidth + 1 || pt.scrollHeight > pt.clientHeight + 1) out.push('Stapel läuft über');
    if (pt.querySelectorAll('.ta-stein').length > 5) out.push(pt.querySelectorAll('.ta-stein').length + ' Steine sichtbar');
    if (!/\+10/.test(pt.textContent)) out.push('Zahl +10 fehlt: ' + pt.textContent);
    if (b.height < 43.5) out.push('Reihe niedrig');
    return out;
  });
  r.push(...stapel);
  // Querformat
  const q = await seite({ gesehen: true, quer: true });
  r.push(...(await maße(true)).map(x => 'Quer: ' + x));
  await zu(q);
  // PS-21: Computer am Zug
  const ki = await p.evaluate(async () => {
    const out = [], g = window.__brett.tavla;
    g.control.setMode(true); g.ui.handleReset();
    g.entity.loadFromJSON(window.__stand({ pkt: { 12: 3, 5: 3 }, rest: [2, 3], p: 'B' }));
    g.control.vsAI = true; g.control.selected = null; g.ui.render();
    const v = JSON.stringify(g.entity.toJSON());
    document.getElementById('tawurfBtn').click();
    g.ui.handlePunktClick(22); g.ui.handlePunktClick('ab');
    if (g.control.getSelected() !== null) out.push('Eingabe während der Computer am Zug wählt einen Stein');
    if (JSON.stringify(g.entity.toJSON()) !== v) out.push('Eingabe während der Computer am Zug ist wirkt');
    g.control.setMode(false);
    return out;
  });
  r.push(...ki);
  // PS-37 Konfetti nur bei Sieg des Menschen
  const konf = await p.evaluate(() => {
    const out = [], g = window.__brett.tavla;
    g.control.setMode(true); g.ui.handleReset();
    document.querySelectorAll('canvas.konfetti').forEach(c => c.remove());
    const win = { winner: 'B', mars: false, punkte: 1 };
    g.ui.renderGameOver && g.ui.afterMove(win);
    if (document.querySelector('canvas.konfetti')) out.push('Konfetti bei Niederlage');
    g.control.setMode(false); g.ui.handleReset();
    return out;
  });
  r.push(...konf);
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-11: Computer (PS-22, PS-23, PS-33; U-13) ----------
test('ta_staerke', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = [];
  const stufen = await p.evaluate(() => {
    const out = [], C = TavlaControl, c = window.__brett.tavla.control;
    const soll = { leicht: [0.3, 1], mittel: [0.05, 1], stark: [0, 2] };
    for (const [k, [f, t]] of Object.entries(soll)) {
      c.setDifficulty(k);
      if (c.fehlerquote !== f || c.searchDepth !== t) out.push(`${k}: Fehlerquote ${c.fehlerquote}, Tiefe ${c.searchDepth}`);
    }
    c.setDifficulty('mittel');
    return out;
  });
  r.push(...stufen);
  // Stark prüft die Antworten des Gegners (Tiefe 2), Mittel nur die eigene Runde (Tiefe 1)
  const tiefe = await p.evaluate(() => {
    const out = [], alt = window.tavlaRegelwerk;
    const zaehle = (t) => {
      let n = 0;
      window.tavlaRegelwerk = () => { const R = alt(), f = R.folgen; R.folgen = (...a) => { n++; return f(...a); }; return R; };
      AIEngines.tavla(alt().start(), 'A', [5, 3], t);
      return n;
    };
    const n1 = zaehle(1), n2 = zaehle(2);
    window.tavlaRegelwerk = alt;
    if (n1 !== 1) out.push('Tiefe 1 ruft folgen ' + n1 + 'mal auf');
    if (n2 < 50) out.push('Tiefe 2 prüft die Antworten des Gegners nicht (' + n2 + ' Aufrufe)');
    return out;
  });
  r.push(...tiefe);
  // PS-33 Fehlzug-Grenze über den eingespeisten Zufall
  const fz = await p.evaluate(async () => {
    const out = [], g = window.__brett.tavla, c = g.control;
    for (const [stufe, zuf, erwartet] of [['leicht', 0.29, true], ['leicht', 0.31, false], ['mittel', 0.04, true], ['mittel', 0.06, false], ['stark', 0, false]]) {
      c.setDifficulty(stufe); c.setZufall(() => zuf);
      if (c._entscheideFehler() !== erwartet) out.push(`${stufe} bei Zufall ${zuf}: Fehlzug ${!erwartet ? 'unerwartet' : 'fehlt'}`);
    }
    c.setZufall(Math.random); c.setDifficulty('mittel');
    return out;
  });
  r.push(...fz);
  // PS-22: Computer gegen Computer, nur erlaubte Züge, Partie endet; Zeit je Wurf
  const spiel = await p.evaluate(async () => {
    const out = [], R = tavlaRegelwerk(), zeiten = [];
    const spiele = (tA, fA, tB, fB, seed, messe) => {
      const zuf = window.__zuf(seed), wz = window.__zuf(seed + 1000);
      let s = R.start(), pl = 'A', schritte = 0;
      while (schritte++ < 3000 && s.ab.A < 15 && s.ab.B < 15) {
        const a = 1 + Math.floor(wz() * 6), b = 1 + Math.floor(wz() * 6), rest = a === b ? [a, a, a, a] : [a, b];
        const t = pl === 'A' ? tA : tB, f = pl === 'A' ? fA : fB;
        let rr = rest.slice();
        const t0 = performance.now();
        const plan = AIEngines.tavla(s, pl, rest, t);
        if (messe) zeiten.push(performance.now() - t0);
        const pn = plan.slice();
        for (;;) {
          const erl = R.erlaubteErste(s, pl, rr);
          if (!erl.length) break;
          let m = null;
          if (zuf() < f) { m = erl[Math.floor(zuf() * erl.length)]; pn.length = 0; }
          else {
            let c = pn.shift(); m = c && erl.find(e => e.von === c.von && e.nach === c.nach);
            if (!m) { pn.length = 0; pn.push(...AIEngines.tavla(s, pl, rr, t)); c = pn.shift(); m = c && erl.find(e => e.von === c.von && e.nach === c.nach); }
            if (!m) { out.push('Computer plante unerlaubten Zug ' + JSON.stringify(c)); return { out, ende: false }; }
          }
          s = R.wende(s, pl, m).s; rr.splice(rr.indexOf(m.w), 1);
          if (s.ab[pl] === 15) break;
        }
        pl = pl === 'A' ? 'B' : 'A';
      }
      return { ende: s.ab.A === 15 || s.ab.B === 15, sieger: s.ab.A === 15 ? 'A' : 'B' };
    };
    for (const [tA, fA, tB, fB, name] of [[1, 0.3, 1, 0.3, 'leicht'], [1, 0.05, 1, 0.05, 'mittel'], [2, 0, 2, 0, 'stark']]) {
      for (let i = 0; i < 2; i++) { const e = spiele(tA, fA, tB, fB, 11 + i, name === 'stark'); if (!e.ende) out.push(`${name}: Partie endet nicht`); }
    }
    zeiten.sort((a, b) => a - b);
    return { out, max: zeiten.length ? Math.round(zeiten[zeiten.length - 1]) : -1, p95: zeiten.length ? Math.round(zeiten[Math.floor(zeiten.length * 0.95)]) : -1 };
  });
  r.push(...spiel.out);
  if (spiel.max > 1000) r.push(`Stark rechnet bis ${spiel.max} ms je Wurf (Grenze 1000)`);
  console.log(`  Messwert: Stark je Wurf p95 ${spiel.p95} ms, max ${spiel.max} ms`);
  // PS-23: Stark gegen Leicht
  const wertung = await p.evaluate(async () => {
    const R = tavlaRegelwerk();
    const partie = (starkIstA, seed) => {
      const zuf = window.__zuf(seed), wz = window.__zuf(seed + 5000);
      let s = R.start(), pl = 'A', n = 0;
      while (n++ < 3000 && s.ab.A < 15 && s.ab.B < 15) {
        const a = 1 + Math.floor(wz() * 6), b = 1 + Math.floor(wz() * 6), rest = a === b ? [a, a, a, a] : [a, b];
        const stark = (pl === 'A') === starkIstA;
        const plan = AIEngines.tavla(s, pl, rest, stark ? 2 : 1), pn = plan.slice();
        let rr = rest.slice();
        for (;;) {
          const erl = R.erlaubteErste(s, pl, rr);
          if (!erl.length) break;
          let m;
          if (!stark && zuf() < 0.3) m = erl[Math.floor(zuf() * erl.length)];
          else { const c = pn.shift(); m = c && erl.find(e => e.von === c.von && e.nach === c.nach) || erl[0]; }
          s = R.wende(s, pl, m).s; rr.splice(rr.indexOf(m.w), 1);
          if (s.ab[pl] === 15) break;
        }
        pl = pl === 'A' ? 'B' : 'A';
      }
      return (s.ab.A === 15) === starkIstA;
    };
    let siege = 0;
    for (let i = 0; i < 20; i++) if (partie(i % 2 === 0, 100 + i)) siege++;
    return siege;
  });
  console.log(`  Messwert: Stark gewinnt ${wertung} von 20 gegen Leicht`);
  if (wertung < 14) r.push(`Stark gewinnt nur ${wertung} von 20 gegen Leicht (Soll 14)`);
  // U-13: Computer zieht Schritt für Schritt über die Control
  const ki = await p.evaluate(async () => {
    const out = [], g = window.__brett.tavla, c = g.control;
    c.setMode(true); c.setZufall(() => 1); c.setDifficulty('stark'); c.restartGame();
    c.setWuerfelfolge([6, 5, 4, 2, 3, 3, 1, 5, 6, 2, 4, 4]);
    c.wuerfeln();
    let z; while ((z = g.entity.getValidMoves()).length && g.entity.currentPlayer === 'A') { c.tippe(z[0].von); c.tippe(z[0].nach); }
    if (!c.isAiTurn()) out.push('Computer nicht am Zug nach dem Zug des Menschen');
    let schritte = 0;
    while (c.isAiTurn() && schritte++ < 12) {
      const v = g.entity.toJSON(); const res = await c.performAiAction();
      if (res.invalid) { out.push('Computer-Schritt ungültig'); break; }
      const s = window.__summe(g.entity); if (s[0] !== 15 || s[1] !== 15) out.push('Summe ' + s);
      if (JSON.stringify(g.entity.toJSON()) === JSON.stringify(v)) out.push('Computer-Schritt ändert nichts');
    }
    if (c.isAiTurn()) out.push('Computer kommt nicht zum Ende');
    if (g.entity.currentPlayer !== 'A' || g.entity.phase !== 'wuerfeln') out.push('Nach dem Computer ist nicht Weiß am Zug');
    c.setMode(false);
    return out;
  });
  r.push(...ki);
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-9: Übung (PS-24, PS-38; U-1 bis U-5) ----------
test('ta_uebung', async () => {
  const p = await seite();
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], ui = window.__brett.tavla.ui, warte = ms => new Promise(r => setTimeout(r, ms));
    const banner = document.getElementById('tauebung');
    if (!banner || banner.hidden) return ['Übung nicht sichtbar beim ersten Start'];
    const titel = () => banner.querySelector('.mu-uebung-titel').textContent;
    const brett = () => JSON.stringify(ui.uebung.entity ? ui.uebung.entity.toJSON() : ui.uebung.getBoardState());
    const partie0 = JSON.stringify(window.__brett.tavla.entity.toJSON());
    const zielElem = () => [...document.querySelectorAll('#tavla-view .ta-punkt.ziel, #tavla-view .ta-bar.ziel, #taab.ziel, #tawurfBtn.ziel')];
    let schritte = 0;
    for (let n = 1; n <= 5; n++) {
      if (!titel().includes(`${n} von 5`)) { out.push(`Titel Schritt ${n}: ${titel()}`); break; }
      schritte++;
      const ziele = zielElem();
      if (ziele.length !== 1) out.push(`Schritt ${n}: ${ziele.length} Zielelemente`);
      const blase = document.querySelectorAll('#tavla-view .mu-blase');
      if (blase.length !== 1 || !/Hier tippen/.test(blase[0].textContent)) out.push(`Schritt ${n}: Sprechblase fehlt`);
      // falscher Tipp
      const vorher = brett();
      const falsch = [...document.querySelectorAll('#taboard .ta-punkt')].find(e => !e.classList.contains('ziel'));
      if (n > 1 && falsch) { falsch.click(); if (brett() !== vorher) out.push(`Schritt ${n}: falscher Punkt ändert das Brett`); }
      if (n > 1 && falsch && ui.uebung.istGeloest()) out.push(`Schritt ${n}: falscher Punkt löst die Übung`);
      if (n === 1) { ui.handlePunktClick(3); if (brett() !== vorher) out.push('Schritt 1: Punkt statt Würfeln ändert das Brett'); if (ui.uebung.istGeloest()) out.push('Schritt 1: Punkt statt Würfeln löst'); }
      ziele[0].click();
      if (!ui.uebung.istGeloest()) out.push(`Schritt ${n}: richtiger Tipp löst nicht`);
      ui._uebungWeiter();
    }
    if (schritte === 5 && !/Geschafft/.test(titel())) out.push('Kein "Geschafft": ' + titel());
    banner.querySelector('.mu-los').click();
    if (!banner.hidden) out.push('Banner nach "Los geht\'s" noch da');
    if (JSON.stringify(window.__brett.tavla.entity.toJSON()) !== partie0) out.push('Übung verändert die echte Partie');
    return out;
  });
  r.push(...p.fehler);
  const gespeichert = await p.evaluate((k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, TAVLA);
  if (!gespeichert || gespeichert.einfuehrung !== true || gespeichert.formatversion !== 1) r.push('Übung nicht als gesehen gespeichert: ' + JSON.stringify(gespeichert));
  await p.reload();
  await p.waitForFunction(() => window.__brett && window.__brett.tavla, null, { timeout: 15000 });
  await p.evaluate(() => document.querySelector('.tabBtn[data-tab=tavla]').click());
  const nochmal = await p.evaluate(() => !document.getElementById('tauebung').hidden);
  if (nochmal) r.push('Übung kommt nach dem Neuladen wieder');
  await zu(p);
  // Überspringen speichert; Neuladen mitten in der Übung nicht (PS-38)
  const q = await seite();
  await q.evaluate(() => document.querySelector('#tauebung .mu-ueberspringen').click());
  const g2 = await q.evaluate((k) => localStorage.getItem(k), TAVLA);
  if (!g2 || !/"einfuehrung":true/.test(g2)) r.push('Überspringen speichert nicht');
  await zu(q);
  const m = await seite();
  await m.evaluate(() => { const ui = window.__brett.tavla.ui; document.getElementById('tawurfBtn').click(); });
  await m.reload();
  await m.waitForFunction(() => window.__brett && window.__brett.tavla, null, { timeout: 15000 });
  await m.evaluate(() => document.querySelector('.tabBtn[data-tab=tavla]').click());
  const noch = await m.evaluate((k) => ({ s: localStorage.getItem(k), t: document.querySelector('#tauebung .mu-uebung-titel').textContent }), TAVLA);
  if (noch.s) r.push('Reload mitten in der Übung markiert als gesehen');
  if (!/1 von 5/.test(noch.t)) r.push('Übung beginnt nach Reload nicht neu: ' + noch.t);
  await zu(m);
  // Speicher gesperrt: Übung kommt jedes Mal, Spiel läuft
  const s = await seite({ vorher: () => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('gesperrt'); } }); } });
  const gesperrt = await s.evaluate(() => {
    const ui = window.__brett.tavla.ui, out = [];
    if (document.getElementById('tauebung').hidden) out.push('Übung fehlt bei gesperrtem Speicher');
    document.querySelector('#tauebung .mu-ueberspringen').click();
    if (!document.getElementById('tauebung').hidden) out.push('Überspringen geht nicht');
    window.__brett.tavla.control.setWuerfelfolge([3, 2]); document.getElementById('tawurfBtn').click();
    if (window.__brett.tavla.entity.phase !== 'ziehen') out.push('Spiel läuft nicht bei gesperrtem Speicher');
    return out;
  });
  r.push(...gesperrt, ...s.fehler);
  if (process.env.DEBUG) console.log(JSON.stringify(r), JSON.stringify(gesperrt), JSON.stringify(s.fehler));
  await zu(s);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-9: Regelkarten (PS-25; U-14) ----------
test('ta_hilfe', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.tavla, warte = ms => new Promise(r => setTimeout(r, ms));
    const knopf = document.querySelector('#tavla-view .ta-hilfe-knopf');
    if (!knopf) return ['Knopf "?" fehlt'];
    g.control.setMode(false); g.control.restartGame();
    const vorher = JSON.stringify(g.entity.toJSON());
    knopf.click();
    const h = document.getElementById('tahilfe');
    if (h.hidden) out.push('Karten öffnen sich nicht');
    const karten = h.querySelectorAll('.mu-karte');
    if (karten.length !== 4) out.push(karten.length + ' Karten statt 4');
    if (![...karten].every(k => k.querySelector('svg'))) out.push('Karte ohne Mini-Brett');
    if (!/Mars/.test(h.textContent) || !/doppelt/.test(h.textContent)) out.push('Mars nicht erklärt');
    h.querySelector('.mu-hilfe-schliessen').click();
    if (!h.hidden) out.push('Schließen geht nicht');
    if (JSON.stringify(g.entity.toJSON()) !== vorher) out.push('Karten verändern die Partie');
    // Computer wartet, solange Karten offen sind
    g.control.setMode(true); g.control.restartGame(); g.control.setZufall(() => 1); g.control.setWuerfelfolge([6, 5, 4, 3]);
    g.ui.handleWuerfeln();
    let z; while ((z = g.entity.getValidMoves()).length && g.entity.currentPlayer === 'A') { g.ui.handlePunktClick(z[0].von); g.ui.handlePunktClick(z[0].nach); }
    knopf.click();
    const stand = JSON.stringify(g.entity.toJSON());
    await warte(1500);
    if (JSON.stringify(g.entity.toJSON()) !== stand) out.push('Computer zieht bei offenen Karten');
    h.querySelector('.mu-hilfe-schliessen').click();
    await warte(2500);
    if (JSON.stringify(g.entity.toJSON()) === stand) out.push('Computer zieht nach dem Schließen nicht weiter');
    g.control.setMode(false);
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-10: Lernhilfe (PS-26) ----------
test('ta_lernen', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(() => {
    const out = [], g = window.__brett.tavla, ui = g.ui;
    g.control.setMode(false);
    // A: Stein auf 10, Einzelstein auf 14 (B hat Stein auf 8, Abstand 6); B-Einzelstein auf 7 (zu schlagen von 10 mit 3)
    g.entity.loadFromJSON(window.__stand({ pkt: { 10: 1, 14: 1, 3: 2, 7: -1, 8: -1, 20: -13 }, rest: [3, 4] }));
    g.control.selected = null; ui.render();
    const k = (sel) => document.querySelectorAll(sel).length;
    if (!GameUI.einst.lernen('tavla')) GameUI.einst.setzeLernen('tavla', true);
    ui.setzeLernen(true);
    const el = (i) => document.querySelector(`#taboard .ta-punkt[data-i="${i}"]`);
    if (!el(10).classList.contains('quelle')) out.push('Ring auf ziehbarem Stein fehlt');
    el(10).click();
    if (!el(10).classList.contains('selected')) out.push('Auswahl fehlt');
    if (!el(7).classList.contains('ziel')) out.push('Ziel 7 nicht grün');
    if (!el(7).classList.contains('schlag')) out.push('Schlagfeld nicht orange (Lernhilfe an)');
    if (!el(14).classList.contains('gefahr')) out.push('Gefährdeter Einzelstein ohne Warnung (Lernhilfe an)');
    ui.setzeLernen(false);
    el(10).click();
    if (!el(10).classList.contains('quelle')) out.push('Ring weg bei Lernhilfe aus');
    el(10).click();
    if (!el(7).classList.contains('ziel')) out.push('Ziel weg bei Lernhilfe aus');
    if (k('#taboard .schlag') || k('#taboard .gefahr')) out.push('Markierungen trotz Lernhilfe aus');
    if (!/aus/.test(document.querySelector('#tavla-view .lernen-knopf').textContent)) out.push('Knopf zeigt nicht "aus"');
    ui.setzeLernen(true);
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-12: Zug zurück und Tipp (PS-27, PS-36) ----------
test('ta_zurueck', async () => {
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const r = await p.evaluate(async () => {
    const out = [], g = window.__brett.tavla, c = g.control, e = g.entity;
    c.setMode(false); c.restartGame(); c.setWuerfelfolge([5, 3, 6, 2]);
    if (c.canUndo()) out.push('Zug zurück ohne Zug möglich');
    const t0 = await c.computeHint();
    if (!t0 || !t0.wuerfeln) out.push('Tipp vor dem Wurf: ' + JSON.stringify(t0));
    c.wuerfeln();
    const nachWurf = JSON.stringify(e.toJSON());
    const tipp = await c.computeHint();
    if (!tipp || !e.getValidMoves().some(z => z.von === tipp.von && z.nach === tipp.nach)) out.push('Tipp ist kein erlaubter Zug: ' + JSON.stringify(tipp));
    if (c.canUndo()) out.push('Zug zurück direkt nach dem Wurf möglich (würde den Wurf zurücknehmen)');
    let z = e.getValidMoves()[0]; c.tippe(z.von); c.tippe(z.nach);
    const nachEins = JSON.stringify(e.toJSON());
    z = e.getValidMoves()[0]; c.tippe(z.von); c.tippe(z.nach);   // zweiter Zug: Runde zu Ende
    if (e.currentPlayer !== 'B') out.push('Runde nicht zu Ende nach zwei Zügen');
    if (!c.canUndo()) out.push('Zug zurück über das Rundenende gesperrt');
    c.undoMove();
    if (JSON.stringify(e.toJSON()) !== nachEins) out.push('Erster Zug zurück stellt nicht den Stand nach Zug 1 her');
    if (e.rest.length !== 1) out.push('Würfel nach Zug zurück nicht wieder frei');
    c.undoMove();
    if (JSON.stringify(e.toJSON()) !== nachWurf) out.push('Zweiter Zug zurück stellt nicht den Stand nach dem Wurf her');
    if (JSON.stringify(e.rest) !== '[5,3]') out.push('Würfel verändert: ' + JSON.stringify(e.rest));
    if (c.canUndo() || !c.undoMove().invalid) out.push('Zug zurück nimmt den Wurf zurück');
    // gegen den Computer: sein Zug lässt sich nie zurücknehmen
    c.setMode(true); c.setZufall(() => 1); c.restartGame(); c.setWuerfelfolge([6, 5, 4, 3, 2, 1, 6, 5, 4, 3]);
    c.wuerfeln();
    while (e.currentPlayer === 'A' && e.getValidMoves().length) { const m = e.getValidMoves()[0]; c.tippe(m.von); c.tippe(m.nach); }
    let n = 0; while (c.isAiTurn() && n++ < 12) await c.performAiAction();
    if (e.currentPlayer !== 'A') out.push('Computer nicht fertig');
    if (c.canUndo()) out.push('Zug zurück nach dem Zug des Computers möglich');
    // Fehlzug je einzelnem Steinzug: Zufall unter der Quote bei jedem Schritt
    c.setDifficulty('leicht'); let verbraucht = 0; c.setZufall(() => { verbraucht++; return 0.1; });
    c.restartGame(); c.setWuerfelfolge([6, 5, 4, 3]);
    c.wuerfeln();
    while (e.currentPlayer === 'A' && e.getValidMoves().length) { const m = e.getValidMoves()[0]; c.tippe(m.von); c.tippe(m.nach); }
    verbraucht = 0; n = 0; let schritte = 0;
    while (c.isAiTurn() && n++ < 12) { const r0 = await c.performAiAction(); if (!r0.invalid && e.phase === 'ziehen') schritte++; }
    if (schritte < 2 || verbraucht < schritte) out.push(`Fehlzug nicht je Steinzug: ${verbraucht} Zufallswerte für ${schritte} Steinzüge`);
    c.setMode(false); c.setDifficulty('mittel'); c.setZufall(Math.random); c.restartGame(); c.setWuerfelfolge([5, 3, 6, 2]); c.wuerfeln();
    z = e.getValidMoves()[0]; c.tippe(z.von); c.tippe(z.nach); z = e.getValidMoves()[0]; c.tippe(z.von); c.tippe(z.nach);
    // nach neuem Wurf des Gegners nicht mehr
    c.wuerfeln();
    if (c.canUndo()) out.push('Zug zurück nach neuem Wurf des Gegners möglich');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-13: 3D (PS-28, PS-35; U-15) ----------
test('ta_3d', async () => {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
  const p = await seite({ gesehen: true, ohne3d: false, ctx });
  await p.evaluate(HILFE);
  const r = [];
  try { await p.waitForFunction(() => { const a = window.__brett.tavla.ui.ansicht3d; return a && a.aktiv; }, null, { timeout: 20000 }); }
  catch (e) { r.push('3D wird nicht aktiv'); }
  if (!r.length) {
    const z = await p.evaluate(async () => {
      const out = [], g = window.__brett.tavla, ui = g.ui, a = ui.ansicht3d;
      g.control.setMode(false); ui.handleReset(); await new Promise(r => setTimeout(r, 300));
      const n = a.zaehle();
      if (n.steine.A !== 15 || n.steine.B !== 15) out.push(`Steine in 3D: ${JSON.stringify(n)}`);
      if (n.wuerfel !== 2) out.push('Würfel in 3D: ' + n.wuerfel);
      if (!document.querySelector('.brett3d.tavla canvas')) out.push('Canvas fehlt');
      if (!document.getElementById('taboard').classList.contains('versteckt3d')) out.push('2D-Brett nicht versteckt');
      g.control.setWuerfelfolge([4, 2]); ui.handleWuerfeln(); await new Promise(r => setTimeout(r, 700));
      const quelle = g.entity.getValidMoves()[0];
      const pt = a.bildschirmPunkt(quelle.von);
      return { out, pt, von: quelle.von, nach: quelle.nach };
    });
    r.push(...z.out);
    await p.mouse.click(z.pt.x, z.pt.y); await p.waitForTimeout(150);
    const sel = await p.evaluate(() => window.__brett.tavla.control.getSelected());
    if (sel !== z.von) r.push(`Tippen in 3D wählt nicht den Punkt (gewählt ${sel}, erwartet ${z.von})`);
    const pt2 = await p.evaluate((n) => window.__brett.tavla.ui.ansicht3d.bildschirmPunkt(n), z.nach);
    await p.mouse.click(pt2.x, pt2.y); await p.waitForTimeout(300);
    const nach = await p.evaluate(() => window.__brett.tavla.entity.rest.length);
    if (nach !== 1) r.push('Zug in 3D nicht ausgeführt, übrige Würfel ' + nach);
    // Übung in 3D: alle fünf Schritte zeichnen ohne Fehler (Ziel Würfeln, Punkt, Abtragen)
    const ueb = await p.evaluate(async () => {
      const ui = window.__brett.tavla.ui, out = [];
      ui._starteUebung();
      for (let n = 1; n <= 5; n++) {
        await new Promise(r => setTimeout(r, 200));
        const ziel = ui.uebung.schritt().ziel;
        ui.handlePunktClick(ziel === 'wuerfeln' ? 'wuerfeln' : ziel);
        if (!ui.uebung.istGeloest()) out.push(`3D-Übung Schritt ${n} nicht gelöst`);
        ui._uebungWeiter();
      }
      ui._uebungLos();
      return out;
    });
    r.push(...ueb);
    // PS-35 Ansichtswahl
    await p.evaluate(() => document.querySelector('#tavla-view .ansicht-knopf').click());
    await p.waitForTimeout(200);
    const zwei = await p.evaluate(() => ({ a: window.__brett.tavla.ui.ansicht3d.aktiv, e: window.__brett.einstellungen.ansicht('tavla'), versteckt: document.getElementById('taboard').classList.contains('versteckt3d') }));
    if (zwei.a || zwei.e !== '2d' || zwei.versteckt) r.push('2D-Schalter: ' + JSON.stringify(zwei));
  }
  r.push(...p.fehler);
  await zu(p);
  // Ohne WebGL bleibt 2D
  const q = await seite({ gesehen: true, ohne3d: false, vorher: () => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); }; } });
  await q.waitForTimeout(800);
  const ohne = await q.evaluate(() => ({ versteckt: document.getElementById('taboard').classList.contains('versteckt3d'), aus: !(window.__brett.tavla.ui.ansicht3d && window.__brett.tavla.ui.ansicht3d.aktiv) }));
  if (ohne.versteckt || !ohne.aus) r.push('Ohne WebGL nicht 2D: ' + JSON.stringify(ohne));
  r.push(...q.fehler.map(x => 'Ohne WebGL: ' + x));
  await zu(q);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- AK-15: Reiter und Zurück (PS-31) ----------
test('ta_reiter', async () => {
  const p = await seite({ gesehen: true });
  const r = await p.evaluate(() => {
    const out = [], tabs = [...document.querySelectorAll('.tabBtn')].map(b => b.dataset.tab);
    for (const t of ['tictactoe', 'connect4', 'othello', 'muehle', 'mangala', 'tavla']) if (!tabs.includes(t)) out.push('Reiter fehlt: ' + t);
    if (!document.getElementById('tavla-view').classList.contains('active')) out.push('Tavla-Ansicht nicht aktiv');
    return out;
  });
  r.push(...p.fehler);
  await zu(p);
  pruefe(r.length === 0, r.join('; '));
});

// ---------- Bilder aus Spielersicht (Phase 10) ----------
test('ta_bilder', async () => {
  if (!process.env.BILDER) return;
  fs.mkdirSync(process.env.BILDER, { recursive: true });
  const p = await seite({ gesehen: true });
  await p.evaluate(HILFE);
  const foto = async (n) => { await p.waitForTimeout(300); await p.screenshot({ path: path.join(process.env.BILDER, `tavla-${n}.png`), fullPage: true }); };
  await p.evaluate(() => { const g = window.__brett.tavla; g.control.setMode(false); g.control.restartGame(); g.ui.render(); });
  await foto('start-2d');
  await p.evaluate(() => { const g = window.__brett.tavla; g.control.setWuerfelfolge([5, 3]); g.ui.handleWuerfeln(); });
  await foto('wurf-2d');
  await p.evaluate(() => { const g = window.__brett.tavla; const z = g.entity.getValidMoves()[0]; g.control.tippe(z.von); g.ui.render(); });
  await foto('auswahl-2d');
  await p.evaluate(() => { const g = window.__brett.tavla; g.entity.loadFromJSON(window.__stand({ pkt: { 10: 1, 14: 1, 3: 2, 7: -1, 8: -1, 20: -13 }, bar: { B: 0 }, rest: [3, 4] })); g.control.selected = null; g.ui.render(); document.querySelector('#taboard .ta-punkt[data-i="10"]').click(); });
  await foto('schlag-2d');
  await p.evaluate(() => { const g = window.__brett.tavla; g.entity.loadFromJSON(window.__stand({ pkt: { 2: 4, 1: 4, 0: 3, 3: 3, 20: -8, 21: -7 }, ab: { A: 1, B: 0 }, rest: [3, 6] })); g.control.selected = null; g.ui.render(); });
  await foto('abtragen-2d');
  await p.evaluate(() => { const g = window.__brett.tavla; g.entity.loadFromJSON(window.__stand({ pkt: { 0: 1, 20: -8, 21: -7 }, rest: [1, 2] })); g.control.selected = null; const o = g.control.tippe(0); const o2 = g.control.tippe('ab'); g.ui.afterMove(o2.result); });
  await foto('mars-2d');
  await zu(p);
  const q = await seite({ gesehen: true, ohne3d: false, ctx: await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true }) });
  await q.evaluate(HILFE);
  await q.waitForFunction(() => { const a = window.__brett.tavla.ui.ansicht3d; return a && a.aktiv; }, null, { timeout: 20000 });
  await q.evaluate(() => { const g = window.__brett.tavla; g.control.setMode(false); g.control.restartGame(); g.control.setWuerfelfolge([5, 3]); g.ui.handleWuerfeln(); const z = g.entity.getValidMoves()[0]; g.control.tippe(z.von); g.ui.render(); });
  await q.waitForTimeout(800);
  await q.screenshot({ path: path.join(process.env.BILDER, 'tavla-wurf-3d.png'), fullPage: true });
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
