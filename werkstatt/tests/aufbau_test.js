// Tests für S-W25 (Brettspiele einheitlich aufbauen: Auswahl, Kopfzeile, Anordnung, Tippflächen, Querformat).
// Aufruf: node werkstatt/tests/aufbau_test.js [ORDNER]   (NUR=name1,name2 wählt Tests, BILDER=ordner speichert Bilder)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;
const SCHLUESSEL = 'brettspiele.einstellungen';
const HOCH = { width: 412, height: 915 }, QUER = { width: 915, height: 412 };
const BRETTER = ['chess', 'muehle', 'connect4', 'othello', 'mangala', 'tictactoe', 'dame', 'tavla'];   // Spiele mit Brett und Abschnitten
const ALLE = [...BRETTER, 'schule'];

let browser;
// opts.vp: Bildschirm; opts.einst: Einstellungen vorbelegen (Objekt oder Text); opts.vorher: eigenes Init-Skript; opts.ohneSchach: chess.js nicht ladbar
async function seite(opts = {}) {
  const ctx = await browser.newContext(opts.rechner ? { viewport: opts.vp || HOCH, reducedMotion: 'reduce' } : { viewport: opts.vp || HOCH, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  if (opts.einst !== undefined) await p.addInitScript(([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch (e) { } },
    [SCHLUESSEL, typeof opts.einst === 'string' ? opts.einst : JSON.stringify(opts.einst)]);
  if (opts.vorher) await p.addInitScript(opts.vorher);
  if (opts.ohneSchach) await p.route('**/lib/chess.js', r => r.abort());
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.muehle, null, { timeout: 15000 });
  await p.waitForTimeout(200);
  await p.evaluate(HILFE);
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const GESEHEN = { formatversion: 1, ton: false, stufen: {}, ansicht: {}, lernen: {}, muehleEinfuehrung: true, dameEinfuehrung: true };
const oeffne = async (p, spiel, ms = 350) => { await p.evaluate(s => document.querySelector(`.tabBtn[data-tab=${s}]`).click(), spiel); await p.waitForTimeout(ms); };
const warte3d = async (p, spiel) => { if (spiel === 'chess' || spiel === 'connect4' || spiel === 'dame') await p.waitForFunction(s => { const u = window.__brett[s].ui; return u.ansicht3d && u.ansicht3d.aktiv; }, spiel, { timeout: 15000 }).catch(e => { if (spiel === 'dame') throw e; }); await p.waitForTimeout(150); };

// Hilfsfunktionen im Browser
const HILFE = () => {
  const sichtbar = e => !!e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const r = e => { const b = e.getBoundingClientRect(); return { l: Math.round(b.left), t: Math.round(b.top), b: Math.round(b.bottom), r: Math.round(b.right), w: Math.round(b.width), h: Math.round(b.height) }; };
  window.__sichtbar = sichtbar; window.__r = r;
  window.__ansicht = () => ({
    ansicht: document.body.dataset.ansicht, spiel: document.body.dataset.spiel || null,
    auswahl: sichtbar(document.getElementById('tabs')),
    spiele: [...document.querySelectorAll('.tab-content')].filter(sichtbar).map(v => v.id.replace('-view', '')),
  });
  // Abschnitt des sichtbaren Spiels (bei mehreren Elementen das sichtbare)
  window.__abschnitt = (name) => {
    const v = document.querySelector('.tab-content.active');
    const e = v && [...v.querySelectorAll(`[data-abschnitt="${name}"]`)].find(sichtbar);
    return e ? r(e) : null;
  };
  // Alle sichtbaren tippbaren Flächen unter 44 px (ohne Verweise im Hinweistext)
  window.__zuKlein = () => [...document.querySelectorAll('button, a, label, [role="button"]')]
    .filter(e => sichtbar(e) && !e.closest('#layerNote'))
    .map(e => ({ e, m: r(e) })).filter(x => x.m.w < 44 || x.m.h < 44)
    .map(x => `${x.e.closest('[data-abschnitt="brett"], #scboard') ? 'Feld ' : ''}${(x.e.textContent.trim().slice(0, 16) || x.e.className || x.e.id)} ${x.m.w}x${x.m.h}`);
  window.__ueberbreite = () => document.documentElement.scrollWidth - window.innerWidth;
};

// ---------- AK-1, AK-2: Auswahl mit Kacheln ----------
test('au_auswahl', async () => {
  const out = [];
  const p = await seite();
  const a = await p.evaluate(() => {
    const k = [...document.querySelectorAll('.tabBtn')];
    return { ...window.__ansicht(), hoehe: document.documentElement.scrollHeight, titel: (document.querySelector('#kopfName') || {}).textContent,
      kacheln: k.map(e => ({ spiel: e.dataset.tab, sichtbar: window.__sichtbar(e), m: window.__r(e), svg: !!e.querySelector('svg'), svgB: e.querySelector('svg') ? window.__r(e.querySelector('svg')).w : 0,
        name: (e.querySelector('.kachel-name') || {}).textContent || '' })) };
  });
  if (a.ansicht !== 'auswahl' || !a.auswahl) out.push(`erster Besuch zeigt nicht die Auswahl (${JSON.stringify(a.ansicht)})`);
  if (a.spiele.length) out.push(`in der Auswahl ist ein Spiel sichtbar: ${a.spiele}`);
  if (!/Brettspiele/.test(a.titel || '')) out.push(`Überschrift der Auswahl: ${a.titel}`);
  if (a.kacheln.length !== ALLE.length || ALLE.some(s => a.kacheln.filter(k => k.spiel === s).length !== 1)) out.push(`Kacheln: ${a.kacheln.map(k => k.spiel)}`);
  for (const k of a.kacheln) {
    if (!k.sichtbar) out.push(`Kachel ${k.spiel} nicht sichtbar`);
    if (!k.svg || k.svgB < 30) out.push(`Kachel ${k.spiel} ohne Bild (${k.svgB} px)`);
    if (k.name.trim().length < 3) out.push(`Kachel ${k.spiel} ohne Namen`);
    if (k.m.w < 96 || k.m.h < 100) out.push(`Kachel ${k.spiel} zu klein ${k.m.w}x${k.m.h}`);
    if (k.m.b > 915 || k.m.r > 412 || k.m.l < 0) out.push(`Kachel ${k.spiel} nicht im Bild (${JSON.stringify(k.m)})`);
  }
  if (a.hoehe > 915) out.push(`Auswahl braucht Scrollen (${a.hoehe} px)`);
  const folge = a.kacheln.slice().sort((x, y) => x.m.t - y.m.t || x.m.l - y.m.l).map(k => k.spiel).join();   // so, wie der Spieler sie sieht
  if (folge !== 'chess,schule,muehle,connect4,othello,mangala,tictactoe,dame,tavla') out.push(`Reihenfolge der Kacheln: ${folge}`);
  // PS-1: jede Kachel öffnet ihr Spiel, Kopfzeile nennt es
  const NAMEN = { chess: 'Schach', muehle: 'Mühle', connect4: 'Vier gewinnt', othello: 'Reversi', mangala: 'Mangala', tictactoe: 'Tic Tac Toe', schule: 'Schachschule', dame: 'Dame', tavla: 'Tavla' };
  for (const s of ALLE) {
    const x = await p.evaluate(async (s) => {
      window.__brett.tabs.zeigeAuswahl();
      const t0 = performance.now();
      document.querySelector(`.tabBtn[data-tab=${s}]`).click();
      const a = window.__ansicht(), ms = performance.now() - t0;
      const z = document.getElementById('kopfZurueck'), n = document.getElementById('kopfName'), t = document.querySelector('.ton-schalter');
      return { a, ms, zurueck: z ? z.textContent.trim() : '', name: n ? n.textContent.trim() : '', h: [z, n, t].map(e => e && window.__sichtbar(e) ? window.__r(e).h : 0),
        h1: [...document.querySelectorAll('h1')].filter(window.__sichtbar).length };
    }, s);
    if (x.a.ansicht !== 'spiel' || x.a.auswahl || x.a.spiele.join() !== s) out.push(`${s}: Kachel öffnet nicht genau dieses Spiel (${JSON.stringify(x.a)})`);
    if (x.ms > 300) out.push(`${s}: Wechsel ${Math.round(x.ms)} ms`);
    if (!/Spiele$/.test(x.zurueck) || /Alle/.test(x.zurueck)) out.push(`${s}: Zurück-Knopf heißt "${x.zurueck}"`);
    if (x.name !== NAMEN[s]) out.push(`${s}: Kopfzeile nennt "${x.name}"`);
    if (x.h[0] < 44 || x.h[2] < 44 || x.h[1] < 20) out.push(`${s}: Kopfzeile Höhen ${x.h}`);
    if (x.h1 !== 1) out.push(`${s}: ${x.h1} sichtbare Hauptüberschriften`);
  }
  out.push(...p.fehler);
  await zu(p);
  // PS-2 (Fehlalarm): ohne Schach fehlen genau die beiden Schach-Kacheln
  const q = await seite({ ohneSchach: true });
  const k = await q.evaluate(() => [...document.querySelectorAll('.tabBtn')].filter(window.__sichtbar).map(e => e.dataset.tab));
  const soll = ALLE.filter(s => s !== 'chess' && s !== 'schule');
  if (k.slice().sort().join() !== soll.slice().sort().join()) out.push(`ohne Schach: Kacheln ${k}`);
  await oeffne(q, 'muehle');
  if ((await q.evaluate(() => window.__ansicht().spiele.join())) !== 'muehle') out.push('ohne Schach: Mühle öffnet nicht');
  out.push(...q.fehler);
  await zu(q);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-3: Kopfzeile steht überall gleich ----------
test('au_kopfzeile', async () => {
  const out = [];
  const p = await seite({ einst: GESEHEN });
  const messe = async () => {
    const m = {};
    m.auswahl = await p.evaluate(() => { window.__brett.tabs.zeigeAuswahl(); return window.__r(document.querySelector('.kopfzeile')); });
    for (const s of ALLE) { await oeffne(p, s, 120); m[s] = await p.evaluate(() => { window.scrollTo(0, 0); return window.__r(document.querySelector('.kopfzeile')); }); }
    return m;
  };
  const m1 = await messe(), m2 = await messe();
  const tops = Object.values(m1).map(x => x.t);
  if (Math.max(...tops) - Math.min(...tops) > 1) out.push(`Kopfzeile springt: ${JSON.stringify(Object.fromEntries(Object.entries(m1).map(([k, v]) => [k, v.t])))}`);
  if (Math.min(...tops) < 0 || Math.max(...tops) > 40) out.push(`Kopfzeile nicht oben: ${tops}`);
  const hs = Object.values(m1).map(x => x.h);
  if (Math.max(...hs) - Math.min(...hs) > 1) out.push(`Kopfzeile verschieden hoch: ${hs}`);
  if (JSON.stringify(m1) !== JSON.stringify(m2)) out.push('Messung nicht wiederholbar');   // PS-21
  out.push(...p.fehler);
  await zu(p);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-4: Zurück zur Auswahl, Markierung Weiterspielen ----------
test('au_zurueck', async () => {
  const out = [];
  const p = await seite({ einst: GESEHEN });
  const marke = () => p.evaluate(() => [...document.querySelectorAll('.tabBtn.weiter')].filter(e => window.__sichtbar(e) && /Weiterspielen/.test(e.textContent)).map(e => e.dataset.tab));
  if ((await marke()).length) out.push('Markierung vor dem ersten Spiel');
  await oeffne(p, 'othello');
  await p.evaluate(() => document.getElementById('kopfZurueck').click());
  await p.waitForTimeout(250);
  let a = await p.evaluate(() => window.__ansicht());
  if (a.ansicht !== 'auswahl' || !a.auswahl || a.spiele.length) out.push(`"Spiele" zeigt nicht die Auswahl (${JSON.stringify(a)})`);
  if ((await marke()).join() !== 'othello') out.push(`Markierung nach Reversi: ${await marke()}`);
  const z = await p.evaluate(() => { const e = document.getElementById('kopfZurueck'); return { text: e.textContent.trim(), ziel: e.getAttribute('href') }; });
  if (!/Alle Spiele/.test(z.text) || z.ziel !== '../') out.push(`Auswahl: Zurück führt nicht zur Spieleseite (${JSON.stringify(z)})`);
  // Zurück-Geste des Handys
  await oeffne(p, 'mangala');
  await p.goBack();
  await p.waitForTimeout(250);
  a = await p.evaluate(() => window.__ansicht());
  if (!p.url().startsWith(URL_)) out.push(`Zurück-Geste verlässt die Seite: ${p.url()}`);
  else if (a.ansicht !== 'auswahl' || a.spiele.length) out.push(`Zurück-Geste zeigt nicht die Auswahl (${JSON.stringify(a)})`);
  if ((await marke()).join() !== 'mangala') out.push(`Markierung nach Mangala: ${await marke()}`);
  // Verlauf wächst nicht: fünfmal öffnen und schließen
  await oeffne(p, 'othello', 150);
  const laenge = await p.evaluate(() => history.length);
  for (let i = 0; i < 5; i++) { await p.evaluate(() => document.getElementById('kopfZurueck').click()); await p.waitForTimeout(150); await oeffne(p, i % 2 ? 'othello' : 'mangala', 150); }
  const laenge2 = await p.evaluate(() => history.length);
  if (laenge2 !== laenge) out.push(`Verlauf wächst: ${laenge} auf ${laenge2} Einträge`);
  // Vorwärts nach Zurück zeigt wieder das Spiel; Zurück-Taste der App führt zur Auswahl
  await p.goBack(); await p.waitForTimeout(200);
  await p.goForward(); await p.waitForTimeout(200);
  a = await p.evaluate(() => window.__ansicht());
  if (a.ansicht !== 'spiel' || a.spiele.length !== 1) out.push(`Vorwärts zeigt nicht das Spiel (${JSON.stringify(a)})`);
  await p.evaluate(() => window.__brett.tabs.handleBack()); await p.waitForTimeout(250);
  if ((await p.evaluate(() => window.__ansicht().ansicht)) !== 'auswahl') out.push('Zurück-Taste der App führt nicht zur Auswahl');
  // PS-5: schnelles Hin und Her
  await p.evaluate(HILFE);
  const wild = await p.evaluate(async () => {
    const k = [...document.querySelectorAll('.tabBtn')];
    for (let i = 0; i < 10; i++) { k[i % k.length].click(); document.getElementById('kopfZurueck').click(); k[(i * 3 + 1) % k.length].click(); }
    document.getElementById('kopfZurueck').click(); document.getElementById('kopfZurueck').dispatchEvent(new Event('dummy'));
    await new Promise(r => setTimeout(r, 400));
    return window.__ansicht();
  });
  if (!p.url().startsWith(URL_)) out.push('schnelles Wechseln verlässt die Seite');
  else if ((wild.auswahl ? 1 : 0) + wild.spiele.length !== 1) out.push(`nach schnellem Wechseln nicht genau eine Ansicht: ${JSON.stringify(wild)}`);
  out.push(...p.fehler);
  await zu(p);
  // Verlauf gesperrt oder stumm: die Knöpfe gehen trotzdem, nichts bleibt hängen
  for (const [name, vorher] of [
    ['Verlauf gesperrt', () => { const wirf = () => { throw new Error('gesperrt'); }; History.prototype.pushState = wirf; History.prototype.replaceState = wirf; }],
    ['Zurück ohne Antwort', () => { History.prototype.back = () => { }; }]]) {
    const q = await seite({ einst: GESEHEN, vorher });
    for (const s of ['othello', 'mangala', 'tictactoe']) {
      await oeffne(q, s, 150);
      if ((await q.evaluate(() => window.__ansicht().spiele.join())) !== s) out.push(`${name}: ${s} öffnet nicht`);
      await q.evaluate(() => document.getElementById('kopfZurueck').click());
      await q.waitForTimeout(600);
      const x = await q.evaluate(() => ({ a: window.__ansicht(), haengt: !!window.__brett.tabs._zurueckLaeuft }));
      if (x.a.ansicht !== 'auswahl' || x.a.spiele.length) out.push(`${name}: "Spiele" zeigt nicht die Auswahl nach ${s}`);
      if (x.haengt) out.push(`${name}: Zurück bleibt hängen`);
    }
    if (!q.url().startsWith(URL_)) out.push(`${name}: Seite verlassen`);
    if (q.fehler.length) out.push(`${name}: ${q.fehler.join(' | ')}`);
    await zu(q);
  }
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-5: zuletzt gespieltes Spiel öffnet sich direkt ----------
test('au_zuletzt', async () => {
  const out = [];
  const p = await seite({ einst: GESEHEN });
  await oeffne(p, 'othello');
  const vorher = await p.evaluate(async () => {
    const g = window.__brett.othello; g.ui.handleCellClick(2, 3);
    await new Promise(r => setTimeout(r, 500));
    return JSON.stringify(g.control.getBoardState());
  });
  const gesp = await p.evaluate(k => { try { return JSON.parse(localStorage.getItem(k)).zuletzt; } catch (e) { return 'kaputt'; } }, SCHLUESSEL);
  if (gesp !== 'othello') out.push(`zuletzt nicht gespeichert: ${gesp}`);
  await p.reload();
  await p.waitForFunction(() => window.__brett && window.__brett.othello);
  await p.waitForTimeout(500);
  await p.evaluate(HILFE);
  const n = await p.evaluate(() => ({ a: window.__ansicht(), brett: JSON.stringify(window.__brett.othello.control.getBoardState()), name: document.getElementById('kopfName').textContent.trim() }));
  if (n.a.ansicht !== 'spiel' || n.a.spiele.join() !== 'othello' || n.a.auswahl) out.push(`nach Neuladen nicht direkt im Spiel: ${JSON.stringify(n.a)}`);
  if (n.name !== 'Reversi') out.push(`nach Neuladen nennt die Kopfzeile "${n.name}"`);
  if (n.brett !== vorher) out.push('Partie nach Neuladen verändert');
  // Zurück-Knopf führt auch nach dem direkten Start zur Auswahl
  await p.evaluate(() => document.getElementById('kopfZurueck').click());
  await p.waitForTimeout(250);
  if (!p.url().startsWith(URL_) || (await p.evaluate(() => window.__ansicht().ansicht)) !== 'auswahl') out.push('nach direktem Start führt "Spiele" nicht zur Auswahl');
  // Wer bewusst in der Auswahl steht und neu lädt, bleibt in der Auswahl
  await p.reload();
  await p.waitForFunction(() => window.__brett && window.__brett.othello);
  await p.waitForTimeout(300);
  await p.evaluate(HILFE);
  const r2 = await p.evaluate(() => window.__ansicht());
  if (r2.ansicht !== 'auswahl' || r2.spiele.length) out.push(`Neuladen in der Auswahl öffnet ein Spiel (${JSON.stringify(r2)})`);
  out.push(...p.fehler);
  await zu(p);
  // PS-7: kaputte und unbekannte Werte
  for (const [name, einst] of [['kaputter Text', '{kaputt'], ['unbekanntes Spiel', { ...GESEHEN, zuletzt: 'gibtsnicht' }], ['Zahl', { ...GESEHEN, zuletzt: 7 }],
    ['Kennwort eines Objekts', { ...GESEHEN, zuletzt: 'constructor' }], ['fremde Formatversion', { ...GESEHEN, formatversion: 99, zuletzt: 'othello' }]]) {
    const q = await seite({ einst });
    const a = await q.evaluate(() => window.__ansicht());
    if (a.ansicht !== 'auswahl' || a.spiele.length) out.push(`${name}: nicht die Auswahl (${JSON.stringify(a)})`);
    await oeffne(q, 'tictactoe');
    if ((await q.evaluate(() => window.__ansicht().spiele.join())) !== 'tictactoe') out.push(`${name}: Spiel öffnet nicht`);
    if (q.fehler.length) out.push(`${name}: ${q.fehler.join(' | ')}`);
    await zu(q);
  }
  // PS-8: Speicher blockiert
  const b = await seite({ vorher: () => { const wirf = () => { throw new Error('gesperrt'); }; Storage.prototype.getItem = wirf; Storage.prototype.setItem = wirf; } });
  const ab = await b.evaluate(() => window.__ansicht());
  if (ab.ansicht !== 'auswahl') out.push(`Speicher blockiert: nicht die Auswahl (${JSON.stringify(ab)})`);
  await oeffne(b, 'connect4');
  await b.evaluate(() => document.getElementById('kopfZurueck').click());
  await oeffne(b, 'mangala');
  if ((await b.evaluate(() => window.__ansicht().spiele.join())) !== 'mangala') out.push('Speicher blockiert: Spiel öffnet nicht');
  if (b.fehler.length) out.push(`Speicher blockiert: ${b.fehler.join(' | ')}`);
  await zu(b);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-6, AK-9: gleiche Abschnitte, gleiche Knöpfe, Symbole ----------
test('au_anordnung', async () => {
  const out = [];
  const p = await seite({ einst: GESEHEN });
  const lies = () => p.evaluate(() => {
    const v = document.querySelector('.tab-content.active'), S = window.__sichtbar, R = window.__r;
    const kette = [...v.querySelectorAll('[data-abschnitt], .gruppe')].filter(S).map(e => ({ name: e.dataset.abschnitt || ('#' + e.textContent.trim()), leer: !e.textContent.trim() && !e.querySelector('button, canvas, svg, span'), ...R(e) }));
    const akt = [...v.querySelectorAll('[data-abschnitt="aktionen"]')].find(S);
    const opt = [...v.querySelectorAll('[data-abschnitt="optionen"]')].find(S);
    const knopf = e => ({ text: e.textContent.trim(), t: R(e).t, maske: (() => { const c = getComputedStyle(e, '::before'); const m = c.webkitMaskImage || c.maskImage || ''; return m && m !== 'none' ? parseFloat(c.width) : 0; })() });
    return { kette, aktionen: akt ? [...akt.querySelectorAll('button')].filter(S).map(knopf) : null, optionen: opt ? [...opt.querySelectorAll('button')].filter(S).map(knopf) : [] };
  });
  const pruefeSpiel = async (s, zusatz = '') => {
    const x = await lies(), n = `${s}${zusatz}`;
    const namen = x.kette.map(k => k.name);
    const soll = ['status', 'brett', '#Aktionen', 'aktionen', '#Spielmodus', 'modus', ...(x.optionen.length ? ['#Optionen', 'optionen'] : []), 'statistik'];
    const ohneStufen = namen.filter(k => k !== 'stufen' && k !== 'zusatz');   // Stufen nur gegen den Computer; Zusatz: Vorrat bei Mühle, Zeile zum Schach-Computer
    if (ohneStufen.join() !== soll.join()) out.push(`${n}: Abschnitte ${namen.join(' ')}`);
    for (let i = 1; i < x.kette.length; i++) {
      const a = x.kette[i - 1], b = x.kette[i];
      if (b.t < a.b - 1) out.push(`${n}: ${b.name} überlappt ${a.name}`);
      if (b.t - a.b > 40) out.push(`${n}: Lücke ${b.t - a.b} px zwischen ${a.name} und ${b.name}`);
    }
    if (namen.includes('#Optionen') && !x.optionen.length) out.push(`${n}: Überschrift Optionen ohne Knöpfe`);
    const iStufen = namen.indexOf('stufen');
    if (iStufen >= 0 && namen[iStufen - 1] !== 'modus') out.push(`${n}: Stufen stehen nicht direkt unter dem Spielmodus`);
    for (const k of x.kette) if (k.leer && k.h > 8) out.push(`${n}: leerer Abschnitt ${k.name} mit ${k.h} px`);
    if (!x.aktionen) { out.push(`${n}: Zeile Aktionen fehlt`); return x; }
    if (x.aktionen.map(k => k.text).join('|') !== 'Neu starten|Zug zurück|Tipp') out.push(`${n}: Aktionen sind ${x.aktionen.map(k => k.text).join('|')}`);
    if (new Set(x.aktionen.map(k => k.t)).size !== 1) out.push(`${n}: Aktionen nicht in einer Zeile`);
    if (new Set(x.optionen.map(k => k.t)).size > 1) out.push(`${n}: Optionen nicht in einer Zeile (${x.optionen.map(k => k.text).join('|')})`);
    for (const k of [...x.aktionen, ...x.optionen]) if (k.text !== '?' && k.text !== 'Teilen' && k.maske < 14) out.push(`${n}: Knopf "${k.text}" ohne Symbol`);
    return x;
  };
  for (const s of BRETTER) {
    await oeffne(p, s); await warte3d(p, s);
    const x = await pruefeSpiel(s);
    // PS-10: Spiele ohne Optionen zeigen keinen Abschnitt, Spiele mit 3D oder Lernhilfe schon
    const erwartet = { chess: ['2D', 'Lernhilfe an'], connect4: ['2D'], muehle: ['?', 'Lernhilfe an'], othello: [], mangala: [], tictactoe: [], dame: ['2D', '?', 'Lernhilfe an'], tavla: ['2D', '?', 'Lernhilfe an'] }[s];
    if (x.optionen.map(k => k.text).sort().join('|') !== erwartet.slice().sort().join('|')) out.push(`${s}: Optionen sind ${x.optionen.map(k => k.text).join('|')}`);
    // gegen den Computer: Stufen erscheinen, Reihenfolge bleibt
    await p.evaluate(() => { const v = document.querySelector('.tab-content.active'); v.querySelector('[data-abschnitt="modus"] input[value=ai]').click(); });
    await p.waitForTimeout(150);
    const y = await pruefeSpiel(s, ' gegen Computer');
    if (!y.kette.some(k => k.name === 'stufen')) out.push(`${s}: Stufen fehlen gegen den Computer`);
    await p.evaluate(() => { const v = document.querySelector('.tab-content.active'); v.querySelector('[data-abschnitt="modus"] input[value=pvp]').click(); });
    await p.evaluate(() => window.__brett.tabs.zeigeAuswahl());
  }
  // PS-11: Partie zu Ende, Teilen steht in den Optionen
  await oeffne(p, 'tictactoe');
  await p.evaluate(() => { window.Teilen = window.Teilen || { teilen() { }, text: (t) => t.join(' ') }; const u = window.__brett.tictactoe.ui; for (const i of [0, 3, 1, 4, 2]) u.handleCellClick(i); });
  await p.waitForTimeout(200);
  const e = await pruefeSpiel('tictactoe', ' nach Partieende');
  if (!e.optionen.some(k => k.text === 'Teilen')) out.push('Teilen fehlt nach Partieende in den Optionen');
  out.push(...p.fehler);
  await zu(p);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-7: Status, Brett und Aktionen ohne Scrollen sichtbar ----------
test('au_sichtbar', async () => {
  const out = [];
  const p = await seite();   // ohne "gesehen": die Mühle-Übung läuft (PS-13)
  for (const s of BRETTER) {
    await oeffne(p, s); await warte3d(p, s);
    const x = await p.evaluate(() => { window.scrollTo(0, 0); return { st: window.__abschnitt('status'), br: window.__abschnitt('brett'), ak: window.__abschnitt('aktionen'), ueb: window.__sichtbar(document.getElementById('muuebung')), uebD: window.__sichtbar(document.getElementById('dauebung')) }; });
    if (!x.st || !x.br || !x.ak) { out.push(`${s}: Abschnitt fehlt`); continue; }
    if (x.st.t < 0 || x.br.t < x.st.t) out.push(`${s}: Statuszeile nicht über dem Brett`);
    if (x.ak.b > 915) out.push(`${s}: Aktionen enden bei ${x.ak.b} px`);
    if (s === 'muehle' && !x.ueb) out.push('Mühle: Übung läuft nicht (Prüfung PS-13 greift nicht)');
    if (s === 'dame' && !x.uebD) out.push('Dame: Übung läuft nicht (Prüfung greift nicht)');
    await p.evaluate(() => window.__brett.tabs.zeigeAuswahl());
  }
  // Schach mit Lernsatz (PS-13)
  await oeffne(p, 'chess'); await warte3d(p, 'chess');
  await p.evaluate(() => { const e = document.getElementById('chlernsatz'); e.hidden = false; e.textContent = 'Dein Springer greift den Bauern an. Der Bauer ist gedeckt, ein Schlag würde den Springer kosten.'; });
  const l = await p.evaluate(() => window.__abschnitt('aktionen'));
  if (l.b > 915) out.push(`Schach mit Lernsatz: Aktionen enden bei ${l.b} px`);
  out.push(...p.fehler);
  await zu(p);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-8: Tippflächen mindestens 44 × 44 px ----------
test('au_tippflaechen', async () => {
  const out = [];
  const messe = async (vp, rechner = false) => {
    const p = await seite({ vp, rechner }), m = {};
    m.auswahl = await p.evaluate(() => ({ klein: window.__zuKlein(), breit: window.__ueberbreite() }));
    for (const s of ALLE) {
      await oeffne(p, s); await warte3d(p, s);
      m[s] = await p.evaluate(() => ({ klein: window.__zuKlein(), breit: window.__ueberbreite() }));
      if (BRETTER.includes(s)) {   // gegen den Computer kommen die Stufen dazu
        m[s + ' Computer'] = await p.evaluate(() => { const v = document.querySelector('.tab-content.active'); v.querySelector('[data-abschnitt="modus"] input[value=ai]').click(); const r = { klein: window.__zuKlein(), breit: window.__ueberbreite() }; v.querySelector('[data-abschnitt="modus"] input[value=pvp]').click(); return r; });
      }
      if (s === 'chess' || s === 'connect4' || s === 'dame') {   // auch das flache Brett
        await p.evaluate(() => document.querySelector('.tab-content.active .ansicht-knopf').click()); await p.waitForTimeout(200);
        m[s + ' 2D'] = await p.evaluate(() => ({ klein: window.__zuKlein(), breit: window.__ueberbreite(), felder: document.querySelectorAll('.tab-content.active [data-abschnitt="brett"] button').length }));
        await p.evaluate(() => document.querySelector('.tab-content.active .ansicht-knopf').click()); await warte3d(p, s);
      }
      if (s === 'muehle') {   // Regelkarten
        await p.evaluate(() => { const u = window.__brett.muehle.ui; if (u.uebung.aktiv()) u._uebungUeberspringen(); u._hilfeOeffnen(); });
        m['muehle Karten'] = await p.evaluate(() => ({ klein: window.__zuKlein(), breit: window.__ueberbreite() }));
        await p.evaluate(() => window.__brett.muehle.ui._hilfeSchliessen());
      }
      if (s === 'dame') {   // Regelkarten
        await p.evaluate(() => { const u = window.__brett.dame.ui; if (u.uebung.aktiv()) u._uebungUeberspringen(); u._hilfeOeffnen(); });
        m['dame Karten'] = await p.evaluate(() => ({ klein: window.__zuKlein(), breit: window.__ueberbreite() }));
        await p.evaluate(() => window.__brett.dame.ui._hilfeSchliessen());
      }
      if (s === 'schule') {
        await p.evaluate(() => document.querySelector('#sclektionen .sc-eintrag').click()); await p.waitForTimeout(200);
        m['schule Aufgabe'] = await p.evaluate(() => ({ klein: window.__zuKlein(), breit: window.__ueberbreite() }));
      }
      await p.evaluate(() => window.__brett.tabs.zeigeAuswahl());
    }
    m.fehler = p.fehler;
    await zu(p);
    return m;
  };
  const m = await messe(HOCH);
  for (const [k, v] of Object.entries(m)) {
    if (k === 'fehler') { out.push(...v); continue; }
    if (v.klein.length) out.push(`${k}: unter 44 px: ${[...new Set(v.klein)].slice(0, 6).join(', ')}`);
    if (v.breit > 0) out.push(`${k}: ragt ${v.breit} px seitlich hinaus`);
    if (v.felder !== undefined && v.felder < 7) out.push(`${k}: flaches Brett nicht gemessen`);
  }
  if ((m['chess 2D'] || {}).felder !== 64) out.push('Schach flach: keine 64 Felder gemessen (Prüfung greift nicht)');
  // PS-15: schmales Handy
  const n = await messe({ width: 360, height: 740 });
  for (const [k, v] of Object.entries(n)) {
    if (k === 'fehler') continue;
    if (v.breit > 0) out.push(`360 px, ${k}: ragt ${v.breit} px seitlich hinaus`);
    // bei 360 px dürfen nur Brettfelder kleiner werden (mindestens 38 px), alle Knöpfe bleiben bei 44 px
    const zuKlein = v.klein.filter(t => { const [w, h] = t.split(' ').pop().split('x').map(Number); return !t.startsWith('Feld ') || w < 38 || h < 38; });
    if (zuKlein.length) out.push(`360 px, ${k}: zu klein: ${[...new Set(zuKlein)].slice(0, 4).join(', ')}`);
  }
  // PS-15: schmales Fenster am Rechner (andere Schrift, Rollbalken): nichts ragt hinaus
  const r = await messe({ width: 360, height: 915 }, true);
  for (const [k, v] of Object.entries(r)) if (k !== 'fehler' && v.breit > 0) out.push(`360 px am Rechner, ${k}: ragt ${v.breit} px seitlich hinaus`);
  // PS-23: sehr schmal (320 px) und Partieende mit "Teilen": nichts ragt hinaus
  const s = await seite({ vp: { width: 320, height: 800 }, rechner: true, einst: GESEHEN });
  await s.evaluate(() => { window.Teilen = window.Teilen || { teilen() { }, text: (t) => t.join(' ') }; });
  for (const sp of ALLE) {
    await oeffne(s, sp, 200);
    if (sp === 'tictactoe') await s.evaluate(() => { const u = window.__brett.tictactoe.ui; for (const i of [0, 3, 1, 4, 2]) u.handleCellClick(i); });
    const b = await s.evaluate(() => window.__ueberbreite());
    if (b > 0) out.push(`320 px, ${sp}: ragt ${b} px seitlich hinaus`);
    await s.evaluate(() => window.__brett.tabs.zeigeAuswahl());
  }
  out.push(...s.fehler);
  await zu(s);
  // PS-21: zweite Messung gleich
  const m2 = await messe(HOCH);
  if (JSON.stringify(m) !== JSON.stringify(m2)) out.push('Messung nicht wiederholbar');
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-10: Lizenzhinweis nur bei Schach ----------
test('au_hinweis', async () => {
  const out = [];
  const p = await seite({ einst: GESEHEN });
  const lies = () => p.evaluate(() => ({ daten: window.__sichtbar(document.querySelector('#layerNote .datenschutz')), lizenz: window.__sichtbar(document.querySelector('#layerNote .lizenz-schach')),
    text: document.querySelector('#layerNote').innerText, verweise: [...document.querySelectorAll('#layerNote a')].map(a => a.getAttribute('href')) }));
  const a = await lies();
  if (!a.daten || a.lizenz) out.push(`Auswahl: Datenschutz ${a.daten}, Lizenz ${a.lizenz}`);
  if (!a.verweise.includes('lib/STOCKFISH-LICENSE-GPL.txt') || !a.verweise.includes('lib/CHESSJS-LICENSE.txt')) out.push('Lizenzverweise fehlen in der Seite');
  for (const s of ALLE) {
    await oeffne(p, s, 120);
    const x = await lies(), soll = s === 'chess' || s === 'schule';
    if (!x.daten || !/kein Server/.test(x.text)) out.push(`${s}: Satz zum Datenschutz fehlt`);
    if (x.lizenz !== soll) out.push(`${s}: Lizenzhinweis ${x.lizenz ? 'sichtbar' : 'fehlt'}`);
    if (soll && !/Stockfish/.test(x.text)) out.push(`${s}: Stockfish nicht genannt`);
    if (!soll && /Stockfish|chess\.js/.test(x.text)) out.push(`${s}: Schach-Lizenz im sichtbaren Text`);
    await p.evaluate(() => window.__brett.tabs.zeigeAuswahl());
  }
  out.push(...p.fehler);
  await zu(p);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-11, AK-12: Querformat ----------
test('au_quer', async () => {
  const out = [];
  for (const vp of [QUER, { width: 740, height: 360 }]) {   // PS-17, PS-18
    const p = await seite({ vp, einst: GESEHEN }), n = `${vp.width}x${vp.height}`;
    const a = await p.evaluate(() => ({ hoehe: document.documentElement.scrollHeight, k: [...document.querySelectorAll('.tabBtn')].map(e => window.__r(e)), breit: window.__ueberbreite() }));
    if (a.k.some(k => k.b > vp.height || k.r > vp.width) || a.breit > 0) out.push(`${n}: Auswahl nicht vollständig sichtbar`);
    for (const s of BRETTER) {
      await oeffne(p, s); await warte3d(p, s);
      const lies = () => p.evaluate(() => { window.scrollTo(0, 0); const f = [...document.querySelectorAll('.tab-content.active [data-abschnitt="brett"] button')].filter(window.__sichtbar).map(e => window.__r(e));
        return { st: window.__abschnitt('status'), br: window.__abschnitt('brett'), ak: window.__abschnitt('aktionen'), breit: window.__ueberbreite(), feld: f.length ? Math.min(...f.map(m => Math.min(m.w, m.h))) : null }; });
      const x = await lies();
      if (!x.st || !x.br || !x.ak) { out.push(`${n} ${s}: Abschnitt fehlt`); continue; }
      if (x.feld !== null && x.feld < 32) out.push(`${n} ${s}: Feld nur ${x.feld} px`);
      if (s === 'chess' || s === 'connect4' || s === 'dame') {   // auch das flache Brett passt ins Bild
        await p.evaluate(() => document.querySelector('.tab-content.active .ansicht-knopf').click()); await p.waitForTimeout(250);
        const y = await lies();
        if (!y.br || y.br.t < 0 || y.br.b > vp.height) out.push(`${n} ${s} flach: Brett nicht vollständig sichtbar (${y.br && y.br.t} bis ${y.br && y.br.b})`);
        if ((s === 'chess' || s === 'dame') && (y.feld === null || y.feld < 32)) out.push(`${n} ${s} flach: Feld ${y.feld} px`);
        if (y.breit > 0) out.push(`${n} ${s} flach: ragt ${y.breit} px seitlich hinaus`);
        await p.evaluate(() => document.querySelector('.tab-content.active .ansicht-knopf').click()); await warte3d(p, s);
      }
      // Tavla ist ein hohes Brett (13 Reihen zu je 44 px): im Querformat scrollt die Seite senkrecht (Spec S-W24 AK-8)
      if (s !== 'tavla' && (x.br.t < 0 || x.br.b > vp.height)) out.push(`${n} ${s}: Brett nicht vollständig sichtbar (${x.br.t} bis ${x.br.b})`);
      if (x.br.h < (s === 'mangala' ? 90 : 150)) out.push(`${n} ${s}: Brett nur ${x.br.h} px hoch`);
      // Mangala ist breit und flach: dort bleibt die Bedienung unter dem Brett und passt trotzdem ins Bild
      if (s !== 'mangala' && s !== 'tavla' && (x.st.l < x.br.r - 1 || x.ak.l < x.br.r - 1)) out.push(`${n} ${s}: Status oder Aktionen nicht rechts vom Brett (Brett bis ${x.br.r}, Status ab ${x.st.l}, Aktionen ab ${x.ak.l})`);
      if ((s !== 'tavla' && x.ak.b > vp.height) || x.st.t < 0) out.push(`${n} ${s}: Aktionen enden bei ${x.ak.b} px`);
      if (x.breit > 0) out.push(`${n} ${s}: ragt ${x.breit} px seitlich hinaus`);
      await p.evaluate(() => window.__brett.tabs.zeigeAuswahl());
    }
    // Schachschule quer: nichts ragt hinaus
    await oeffne(p, 'schule');
    if ((await p.evaluate(() => window.__ueberbreite())) > 0) out.push(`${n} schule: ragt seitlich hinaus`);
    out.push(...p.fehler);
    await zu(p);
    // PS-13 quer: Mühle-Übung beim ersten Start und Schach mit Lernsatz
    const e = await seite({ vp });
    await oeffne(e, 'muehle');
    const mu = await e.evaluate(() => ({ ak: window.__abschnitt('aktionen'), br: window.__abschnitt('brett'), ueb: window.__sichtbar(document.getElementById('muuebung')) }));
    if (!mu.ueb) out.push(`${n}: Mühle-Übung läuft nicht (Prüfung greift nicht)`);
    if (mu.ak.b > vp.height || mu.br.b > vp.height) out.push(`${n} Mühle mit Übung: Brett bis ${mu.br.b}, Aktionen bis ${mu.ak.b}`);
    await e.evaluate(() => window.__brett.tabs.zeigeAuswahl());
    await oeffne(e, 'dame'); await warte3d(e, 'dame');
    const da = await e.evaluate(() => ({ ak: window.__abschnitt('aktionen'), br: window.__abschnitt('brett'), ueb: window.__sichtbar(document.getElementById('dauebung')) }));
    if (!da.ueb) out.push(`${n}: Dame-Übung läuft nicht (Prüfung greift nicht)`);
    if (da.ak.b > vp.height || da.br.b > vp.height) out.push(`${n} Dame mit Übung: Brett bis ${da.br.b}, Aktionen bis ${da.ak.b}`);
    await e.evaluate(() => window.__brett.tabs.zeigeAuswahl());
    await oeffne(e, 'chess'); await warte3d(e, 'chess');
    await e.evaluate(() => { const l = document.getElementById('chlernsatz'); l.hidden = false; l.textContent = 'Dein Springer greift den Bauern an. Der Bauer ist gedeckt, ein Schlag würde den Springer kosten.'; });
    const ch = await e.evaluate(() => ({ ak: window.__abschnitt('aktionen'), br: window.__abschnitt('brett') }));
    if (ch.ak.b > vp.height || ch.br.b > vp.height) out.push(`${n} Schach mit Lernsatz: Brett bis ${ch.br.b}, Aktionen bis ${ch.ak.b}`);
    out.push(...e.fehler);
    await zu(e);
  }
  // PS-19 (Fehlalarm): Tablet und Laptop bleiben einspaltig
  for (const vp of [{ width: 820, height: 1180 }, { width: 1280, height: 800 }]) {
    const p = await seite({ vp, einst: GESEHEN });
    await oeffne(p, 'othello');
    const x = await p.evaluate(() => ({ st: window.__abschnitt('status'), br: window.__abschnitt('brett'), ak: window.__abschnitt('aktionen') }));
    if (!(x.st.b <= x.br.t + 1 && x.br.b <= x.ak.t + 1)) out.push(`${vp.width}x${vp.height}: nicht einspaltig (Status ${x.st.t}, Brett ${x.br.t} bis ${x.br.b}, Aktionen ${x.ak.t})`);
    await zu(p);
  }
  // PS-20: Drehen mitten in der Partie
  const p = await seite({ einst: GESEHEN });
  await oeffne(p, 'othello');
  const vor = await p.evaluate(() => { const g = window.__brett.othello; g.ui.handleCellClick(2, 3); return JSON.stringify(g.control.getBoardState()); });
  await p.setViewportSize(QUER); await p.waitForTimeout(300);
  const quer = await p.evaluate(() => ({ brett: JSON.stringify(window.__brett.othello.control.getBoardState()), br: window.__abschnitt('brett'), a: window.__ansicht() }));
  await p.setViewportSize(HOCH); await p.waitForTimeout(300);
  const nach = await p.evaluate(() => JSON.stringify(window.__brett.othello.control.getBoardState()));
  if (quer.brett !== vor || nach !== vor) out.push('Drehen ändert den Spielstand');
  if (quer.a.spiele.join() !== 'othello' || quer.br.b > 412) out.push(`nach dem Drehen: ${JSON.stringify(quer.a)}, Brett bis ${quer.br.b}`);
  // Drehen mit räumlichem Brett: das Bild rechnet seine Größe neu
  await p.evaluate(() => window.__brett.tabs.zeigeAuswahl());
  await oeffne(p, 'chess'); await warte3d(p, 'chess');
  await p.setViewportSize(QUER); await p.waitForTimeout(400);
  const d = await p.evaluate(() => { const b = window.__abschnitt('brett'), c = document.querySelector('#chess-view .brett3d canvas').getBoundingClientRect(); return { b, cw: Math.round(c.width), ch: Math.round(c.height), aktiv: window.__brett.chess.ui.ansicht3d.aktiv }; });
  if (!d.aktiv || d.b.b > 412 || d.b.t < 0 || Math.abs(d.cw - d.b.w) > 2 || Math.abs(d.ch - d.b.h) > 2) out.push(`Drehen mit räumlichem Schachbrett: ${JSON.stringify(d)}`);
  await p.setViewportSize(HOCH); await p.waitForTimeout(300);
  out.push(...p.fehler);
  await zu(p);
  pruefe(out.length === 0, out.join('; '));
});

// ---------- AK-13: Bilder aus Spielersicht ----------
test('au_bilder', async () => {
  const out = [];
  const ziel = process.env.BILDER ? path.resolve(process.env.BILDER) : null;
  if (ziel) fs.mkdirSync(ziel, { recursive: true });
  for (const [name, vp] of [['hoch', HOCH], ['quer', QUER]]) {
    const p = await seite({ vp, einst: GESEHEN });
    const foto = async (n) => { const b = await p.screenshot(); if (ziel) fs.writeFileSync(path.join(ziel, `aufbau-${name}-${n}.png`), b); if (b.length < 8000) out.push(`${name} ${n}: Bild fast leer`); return b; };
    const a1 = await foto('auswahl');
    const a2 = await p.screenshot();
    if (Buffer.compare(a1, a2) !== 0) out.push(`${name}: Bild der Auswahl nicht wiederholbar`);
    for (const s of ALLE) { await oeffne(p, s); await warte3d(p, s); await p.waitForTimeout(300); await foto(s); await p.evaluate(() => window.__brett.tabs.zeigeAuswahl()); }
    out.push(...p.fehler.map(f => `${name}: ${f}`));
    await zu(p);
  }
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
    catch (e) { rot++; console.log(`FEHLER ${t.name}: ${String(e.message).slice(0, 600)}`); }
  }
  await browser.close(); server.kill();
  console.log(rot ? `\n${rot} Test(s) rot.` : '\nAlle Tests grün.');
  process.exit(rot ? 1 : 0);
})();
