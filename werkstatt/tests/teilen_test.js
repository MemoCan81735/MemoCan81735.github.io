// Tests für S-W04 (gemeinsame Teilen-Funktion).
// Aufruf: node werkstatt/tests/teilen_test.js [ORDNER]   (NUR=name1,name2 wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const BASIS = `http://127.0.0.1:${PORT}`;

// Ersatz für Teilen-Auswahl und Zwischenablage: art = 'share' | 'abbruch' | 'kopieren' | 'nichts'
const ERSATZ = (art) => `(() => {
  window.__geteilt = []; window.__kopiert = [];
  const def = (o, k, v) => { try { Object.defineProperty(o, k, { configurable: true, value: v }); } catch (e) {} };
  const share = ${JSON.stringify(art)} === 'share' ? async (d) => { window.__geteilt.push(d); }
    : ${JSON.stringify(art)} === 'abbruch' ? async () => { throw new DOMException('abgebrochen', 'AbortError'); } : undefined;
  def(navigator, 'share', share);
  def(navigator, 'clipboard', ${JSON.stringify(art)} === 'nichts' ? undefined : { writeText: async (t) => { window.__kopiert.push(t); } });
})();`;

let browser;
async function seite(pfad, art = 'share', webgl = false) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  await p.addInitScript(ERSATZ(art));
  await p.goto(BASIS + pfad);
  await p.waitForFunction(() => window.Teilen, null, { timeout: 20000 });
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

test('teilen_text', async () => {
  const p = await seite('/brettspiele/?x=geheim#y');
  const r = await p.evaluate(() => {
    const T = window.Teilen, lang = 'a'.repeat(300), genau = 'b'.repeat(200);
    return {
      link: T.link(), normal: T.text(['Luftdrift', 'Ringjagd (Dorf)', '75,6 s']), luecken: T.text(['A', '', null, undefined, 'B']),
      lang: T.text([lang]), genau: T.text([genau]),
    };
  });
  const f = p.fehler; await zu(p);
  const L = `${BASIS}/brettspiele/`;
  pruefe(r.link === L, `Link "${r.link}"`);
  pruefe(r.normal === `Luftdrift · Ringjagd (Dorf) · 75,6 s\n\n${L}`, `Text "${r.normal}"`);
  pruefe(r.luecken === `A · B\n\n${L}`, `Lücken "${r.luecken}"`);
  const kopf = r.lang.split('\n\n')[0];
  pruefe(kopf.length === 200 && kopf.endsWith('…') && r.lang.endsWith(L), `Kürzung ${kopf.length}`);
  pruefe(r.genau.split('\n\n')[0].length === 200 && !r.genau.includes('…'), 'genau 200 Zeichen wurde gekürzt');
  for (const t of Object.values(r)) pruefe(!/@|geheim/i.test(t), `persönliche Daten in "${t}"`);
  pruefe(f.length === 0, f.join(' | '));
});

test('teilen_weg', async () => {
  const out = {};
  for (const art of ['share', 'abbruch', 'kopieren', 'nichts']) {
    const p = await seite('/brettspiele/', art);
    out[art] = await p.evaluate(async () => {
      const ergebnis = await window.Teilen.teilen({ titel: 'T', text: 'Hallo' });
      const fenster = document.querySelectorAll('.teilen-fenster').length, hinweis = !!document.querySelector('.teilen-hinweis');
      const wert = document.querySelector('.teilen-fenster textarea')?.value;
      // Missbrauch: 5× schnell
      const fuenf = await Promise.all([1, 2, 3, 4, 5].map(() => window.Teilen.teilen({ titel: 'T', text: 'x' })));
      for (let i = 0; i < 5; i++) await window.Teilen.teilen({ titel: 'T', text: 'y' + i });
      const fensterDanach = document.querySelectorAll('.teilen-fenster').length;
      document.querySelector('.teilen-fenster button')?.click();
      return { ergebnis, fenster, hinweis, wert, geteilt: window.__geteilt.length, kopiert: window.__kopiert.slice(0, 1), fuenf, fensterDanach, zu: document.querySelectorAll('.teilen-fenster').length };
    });
    out[art].fehler = p.fehler.length;
    await zu(p);
  }
  const s = out.share, a = out.abbruch, k = out.kopieren, n = out.nichts;
  pruefe(s.ergebnis === 'geteilt' && s.geteilt >= 1 && s.kopiert.length === 0, `share ${JSON.stringify(s)}`);
  pruefe(s.fuenf.filter(x => x === 'geteilt').length === 1 && s.fuenf.filter(x => x === 'laeuft').length === 4, `5× schnell ${JSON.stringify(s.fuenf)}`);
  pruefe(a.ergebnis === 'abgebrochen' && a.kopiert.length === 0 && a.fenster === 0, `Abbruch ${JSON.stringify(a)}`);
  pruefe(k.ergebnis === 'kopiert' && k.kopiert[0] === 'Hallo' && k.hinweis, `Kopieren ${JSON.stringify(k)}`);
  pruefe(n.ergebnis === 'angezeigt' && n.fenster === 1 && n.wert === 'Hallo' && n.fensterDanach === 1 && n.zu === 0, `Fenster ${JSON.stringify(n)}`);
  for (const [art, x] of Object.entries(out)) pruefe(x.fehler === 0, `${art}: Skriptfehler`);
});

test('teilen_luftdrift', async () => {
  const p = await seite('/luftdrift/');
  await p.waitForFunction(() => window.__proto && window.__proto.Geist, null, { timeout: 20000 });
  const r = await p.evaluate(async () => {
    const P = window.__proto, knopf = document.getElementById('teilenKnopf'), out = {};
    P.streckeWaehlen('kueste'); P.neustart('ringe'); P.s.ringIndex = 9; P.s.zeit = 58.24; P.beenden();
    out.sichtbar = !knopf.hidden; knopf.click(); await new Promise(r => setTimeout(r, 50)); out.ringe = window.__geteilt.map(d => d.text);
    P.neustart('ringe'); P.s.ringIndex = 3; P.s.zeit = 20; P.beenden(); out.abbruch = knopf.hidden;
    P.neustart('drift'); P.s.punkte = 8450; P.s.zeit = 0.001; P.beenden(); knopf.click(); await new Promise(r => setTimeout(r, 50));
    out.drift = window.__geteilt.map(d => d.text)[1];
    out.breite = document.documentElement.scrollWidth;
    P.neustart('rennen'); P.s.ringIndex = 9; P.s.platz = 1; P.s.zeit = 62.31; P.beenden(); knopf.click(); await new Promise(r => setTimeout(r, 50));
    out.rennen = window.__geteilt.map(d => d.text)[2]; P.zumMenue();
    return out;
  });
  const f = p.fehler; await zu(p);
  const L = `${BASIS}/luftdrift/`;
  pruefe(r.sichtbar && r.ringe[0] === `Luftdrift · Ringjagd (Küste) · 58,2 s · ★★★\n\n${L}`, `Ringjagd ${JSON.stringify(r)}`);
  pruefe(r.abbruch === true, 'Knopf bei Abbruch sichtbar');
  pruefe(/^Luftdrift · Drift-Runde \(Küste\) · 8\.\d{3} Punkte · ★★★\n\n/.test(r.drift || ''), `Drift "${r.drift}"`);
  pruefe(r.rennen === `Luftdrift · Rennen (Küste) · Platz 1 · 62,3 s\n\n${L}`, `Rennen "${r.rennen}"`);
  pruefe(r.breite <= 412, `Querscroll im Endbild: ${r.breite}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('teilen_brett', async () => {
  const p = await seite('/brettspiele/');
  await p.waitForFunction(() => window.__brett && window.__brett.tictactoe, null, { timeout: 15000 });
  const r = await p.evaluate(async () => {
    const g = window.__brett.tictactoe, ui = g.ui, c = g.control, knopf = () => document.querySelector('#tictactoe-view .teilen-knopf'), out = {};
    out.amAnfang = knopf().hidden;
    // zu zweit, X gewinnt
    c.setMode(false); ui.render();
    [0, 3, 1, 4, 2].forEach(i => ui.handleCellClick(i));
    out.zweiSichtbar = !knopf().hidden; knopf().click(); await new Promise(r => setTimeout(r, 50));
    out.zwei = window.__geteilt[0] && window.__geteilt[0].text;
    ui.handleReset(); out.nachNeustart = knopf().hidden;
    // gegen KI (Mittel) verloren
    c.setMode(true); ui.handleStufe('mittel'); ui.render();
    g.entity.loadFromJSON({ cells: ['X', 'X', null, 'O', 'O', null, 'X', null, null], currentPlayer: 'O', finished: false });
    const o = c.playerMove(5); ui.afterMove(o.result);
    out.kiSichtbar = !knopf().hidden; knopf().click(); await new Promise(r => setTimeout(r, 50));
    out.ki = window.__geteilt[1] && window.__geteilt[1].text;
    out.breite = document.documentElement.scrollWidth;
    // gegen KI (Stark) gewonnen: X setzt die dritte in der Reihe
    ui.handleReset(); ui.handleStufe('stark'); ui.render();
    g.entity.loadFromJSON({ cells: ['X', 'X', null, 'O', 'O', null, null, null, null], currentPlayer: 'X', finished: false });
    let o2 = c.playerMove(2); ui.afterMove(o2.result); knopf().click(); await new Promise(r => setTimeout(r, 50));
    out.sieg = window.__geteilt[2] && window.__geteilt[2].text;
    // Unentschieden gegen KI (Leicht) und zu zweit
    ui.handleReset(); ui.handleStufe('leicht'); ui.render();
    g.entity.loadFromJSON({ cells: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', null], currentPlayer: 'X', finished: false });
    o2 = c.playerMove(8); ui.afterMove(o2.result); knopf().click(); await new Promise(r => setTimeout(r, 50));
    out.remisKi = window.__geteilt[3] && window.__geteilt[3].text;
    ui.handleReset(); c.setMode(false); ui.render();
    g.entity.loadFromJSON({ cells: ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', null], currentPlayer: 'X', finished: false });
    o2 = c.playerMove(8); ui.afterMove(o2.result); knopf().click(); await new Promise(r => setTimeout(r, 50));
    out.remisZwei = window.__geteilt[4] && window.__geteilt[4].text;
    ui.handleReset(); ui.handleStufe('mittel');
    return out;
  });
  const f = p.fehler; await zu(p);
  const L = `${BASIS}/brettspiele/`;
  pruefe(r.amAnfang, 'Knopf vor Partieende sichtbar');
  pruefe(r.zweiSichtbar && r.zwei === `Brettspiele · Tic Tac Toe · Partie zu zweit beendet\n\n${L}`, `zu zweit ${JSON.stringify(r)}`);
  pruefe(r.nachNeustart, 'Knopf nach Neustart sichtbar');
  pruefe(r.kiSichtbar && r.ki === `Brettspiele · Tic Tac Toe · Niederlage gegen die KI (Mittel)\n\n${L}`, `gegen KI ${JSON.stringify(r)}`);
  pruefe(r.sieg === `Brettspiele · Tic Tac Toe · Sieg gegen die KI (Stark)\n\n${L}`, `Sieg "${r.sieg}"`);
  pruefe(r.remisKi === `Brettspiele · Tic Tac Toe · Unentschieden gegen die KI (Leicht)\n\n${L}`, `Remis KI "${r.remisKi}"`);
  pruefe(r.remisZwei === `Brettspiele · Tic Tac Toe · Unentschieden zu zweit\n\n${L}`, `Remis zu zweit "${r.remisZwei}"`);
  pruefe(r.breite <= 412, `Querscroll mit Teilen-Knopf: ${r.breite}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('teilen_driftpokal', async () => {
  const p = await seite('/driftpokal/');
  const r = await p.evaluate(async () => {
    const $ = (id) => document.getElementById(id);
    // Ergebnisbild wie nach einem Zeitfahren füllen (das Rennen selbst lässt sich im Container nicht fahren)
    $('resTitle').textContent = 'Neue Bestzeit!'; $('resSub').textContent = 'Hafen · Zeitfahren';
    $('resTable').innerHTML = '<tr><td class="pos">1.</td><td><span class="nm">Runde 1</span></td><td class="num tm">0:31,20</td></tr><tr><td class="pos"></td><td><span class="nm">Gesamt</span></td><td class="num tm">1:35,40</td></tr>';
    for (const s of document.querySelectorAll('.screen')) s.hidden = true;
    $('scrResult').hidden = false;
    const k = $('resShare'), sichtbar = !k.hidden && k.offsetParent !== null;
    k.click(); await new Promise(r => setTimeout(r, 50));
    return { sichtbar, text: window.__geteilt[0] && window.__geteilt[0].text };
  });
  const f = p.fehler; await zu(p);
  pruefe(r.sichtbar && r.text === `Driftpokal · Neue Bestzeit! · Hafen · Zeitfahren · Gesamt 1:35,40\n\n${BASIS}/driftpokal/`, `Driftpokal ${JSON.stringify(r)}`);
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
