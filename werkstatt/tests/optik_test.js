// Tests für S-W09 (Schach-Optik: Gruppen, Symbole, Holzmaserung).
// Aufruf: node werkstatt/tests/optik_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;

let browser;
async function seite({ ansicht = '2d', breite = 412, tab = 'chess' } = {}) {
  const ctx = await browser.newContext({ viewport: { width: breite, height: 915 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.fehler = []; p.fremd = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  p.on('request', r => { const u = r.url(); if (!u.startsWith(`http://127.0.0.1:${PORT}/`) && !u.startsWith('data:') && !u.startsWith('blob:')) p.fremd.push(u); });
  await p.addInitScript((a) => localStorage.setItem('brettspiele.einstellungen', JSON.stringify({ formatversion: 1, ton: false, stufen: {}, ansicht: { chess: a, connect4: '2d' } })), ansicht);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.chess, null, { timeout: 20000 });
  await p.evaluate(t => document.querySelector(`.tabBtn[data-tab=${t}]`).click(), tab);   // S-W25: Kachel der Auswahl, auch wenn das Spiel schon offen ist
  if (tab === 'chess' && ansicht === '3d') await p.waitForFunction(() => window.__brett.chess.ui.ansicht3d && window.__brett.chess.ui.ansicht3d.aktiv, null, { timeout: 20000 });
  await p.waitForTimeout(250);
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
const KONTRAST = `
  window.__lum = (r, g, b) => { const k = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b); };
  window.__kontrast = (a, b) => { const x = window.__lum(...a), y = window.__lum(...b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  window.__rgb = (hex) => [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  // Faktoren aus der Zeichenfläche einer Textur lesen (Grauwert / 255)
  window.__faktoren = (tex) => { const c = tex.image, d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const w = []; for (let i = 0; i < d.length; i += 4) w.push(d[i] / 255); return w; };
  window.__statistik = (w) => { const m = w.reduce((s, x) => s + x, 0) / w.length; return { min: Math.min(...w), max: Math.max(...w), mittel: m, streuung: Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / w.length) }; };`;

test('o_gruppen', async () => {
  const p = await seite();
  const lage = () => p.evaluate(() => {
    const v = document.getElementById('chess-view'), y = (el) => el && el.offsetParent !== null ? el.getBoundingClientRect().top : null;
    const g = [...v.querySelectorAll('.gruppe')].map(e => [e.textContent.trim(), y(e)]);
    return { gruppen: g, neu: y(v.querySelector('#chresetBtn')), zurueck: y(v.querySelector('#chundoBtn')), tipp: y(v.querySelector('.tipp-knopf')),
      modus: y(v.querySelector('#chmode')), stufe: y(v.querySelector('#chdiff')), ansicht: y(v.querySelector('.ansicht-knopf')), lernen: y(v.querySelector('.lernen-knopf')), stat: y(v.querySelector('#chstats')) };
  });
  const a = await lage();
  const namen = a.gruppen.map(x => x[0]);
  pruefe(JSON.stringify(namen) === '["Aktionen","Spielmodus","Optionen"]', `Überschriften: ${JSON.stringify(namen)}`);
  const [ak, sm, op] = a.gruppen.map(x => x[1]);
  pruefe(ak < sm && sm < op, `Reihenfolge der Überschriften: ${ak}/${sm}/${op}`);
  pruefe([a.neu, a.zurueck, a.tipp].every(y => y > ak && y < sm), `Aktionen-Knöpfe nicht unter "Aktionen": ${JSON.stringify(a)}`);
  pruefe(a.modus > sm && a.modus < op, `Spielmodus nicht unter "Spielmodus": ${a.modus}`);
  pruefe([a.ansicht, a.lernen].every(y => y > op) && a.stat > Math.max(a.ansicht, a.lernen), `Optionen-Knöpfe: ${JSON.stringify(a)}`);
  // PS-2: Stufenwahl erscheint gegen den Computer unter "Spielmodus"
  await p.click('#chmode label:nth-child(2)');
  await p.waitForTimeout(200);
  const b = await lage();
  const f = p.fehler; await zu(p);
  pruefe(b.stufe !== null && b.stufe > sm && b.stufe < b.ansicht && b.stufe > b.modus, `Stufenwahl: ${JSON.stringify(b)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('o_symbole', async () => {
  const p = await seite();
  const KN = { neu: '#chess-view #chresetBtn', zurueck: '#chess-view #chundoBtn', tipp: '#chess-view .tipp-knopf', ansicht: '#chess-view .ansicht-knopf', lernen: '#chess-view .lernen-knopf' };
  const messen = () => p.evaluate((KN) => Object.fromEntries(Object.entries(KN).map(([k, s]) => {
    const el = document.querySelector(s), c = getComputedStyle(el, '::before'), mask = c.maskImage !== 'none' && c.maskImage ? c.maskImage : (c.webkitMaskImage || 'none');
    return [k, { breite: parseFloat(c.width) || 0, inhalt: c.content, maske: mask.startsWith('url('), text: el.textContent.trim() }];
  })), KN);
  const pruefeSymbole = (r, wann) => {
    for (const [k, v] of Object.entries(r)) pruefe(v.breite >= 14 && v.maske && v.inhalt !== 'none' && v.text.length > 0, `${wann}: ${k} ohne Symbol oder Text ${JSON.stringify(v)}`);
  };
  const r1 = await messen(); pruefeSymbole(r1, 'Anfang');
  // PS-4: Texte wechseln, Symbole bleiben
  await p.click(KN.lernen);
  await p.click(KN.ansicht);
  await p.waitForFunction(() => document.querySelector('#chess-view .ansicht-knopf').textContent.trim() === '2D', null, { timeout: 20000 });
  const r2 = await messen(); pruefeSymbole(r2, 'nach Textwechsel');
  pruefe(/aus/.test(r2.lernen.text) && r2.ansicht.text === '2D', `Texte nicht gewechselt: ${r2.lernen.text} / ${r2.ansicht.text}`);
  // PS-5 (seit S-W25 umgekehrt): die Symbole gelten in allen Spielen, auch bei Vier gewinnt
  const c4 = await p.evaluate(() => { const c = getComputedStyle(document.querySelector('#connect4-view .tipp-knopf'), '::before'); return { inhalt: c.content, breite: parseFloat(c.width) || 0 }; });
  const f = p.fehler; await zu(p);
  pruefe(c4.inhalt !== 'none' && c4.breite >= 14, `Vier gewinnt ohne Symbol: ${JSON.stringify(c4)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('o_handy', async () => {
  for (const ansicht of ['2d', '3d']) for (const breite of [412, 360]) {
    const p = await seite({ ansicht, breite });
    await p.click('#chmode label:nth-child(2)');
    await p.waitForTimeout(150);
    const r = await p.evaluate(() => {
      const kn = [...document.querySelectorAll('#chess-view button')].filter(b => b.offsetParent !== null && !b.closest('#chboard') && !b.closest('#chpromo') && !b.classList.contains('linkBtn'));
      return { quer: document.documentElement.scrollWidth - window.innerWidth, breite: window.innerWidth,
        knoepfe: kn.map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.trim(), h: r.height, l: r.left, r: r.right }; }) };
    });
    const f = p.fehler; await zu(p);
    const zuKlein = r.knoepfe.filter(k => k.h < 44), raus = r.knoepfe.filter(k => k.l < 0 || k.r > r.breite + 0.5);
    pruefe(r.knoepfe.length >= 5, `${ansicht} ${breite}: nur ${r.knoepfe.length} Knöpfe gefunden`);
    pruefe(r.quer <= 0, `${ansicht} ${breite}: Querscroll ${r.quer} px`);
    pruefe(!zuKlein.length, `${ansicht} ${breite}: Knöpfe unter 44 px: ${zuKlein.map(k => `${k.t} ${k.h.toFixed(0)}`).join(', ')}`);
    pruefe(!raus.length, `${ansicht} ${breite}: Knöpfe außerhalb: ${raus.map(k => k.t).join(', ')}`);
    pruefe(f.length === 0, `${ansicht} ${breite}: ${f.join(' | ')}`);
  }
});

test('o_holz', async () => {
  const p = await seite({ ansicht: '3d' });
  await p.evaluate(KONTRAST);
  const r = await p.evaluate(() => {
    const a = window.__brett.chess.ui.ansicht3d, out = {};
    const gleich = (x, y) => x.length === y.length && x.every((v, i) => v === y[i]);
    out.zweimal = [11, 21, 31].every(s => gleich(Array.from(Ansicht3D.holzFaktor(s).werte), Array.from(Ansicht3D.holzFaktor(s).werte)));
    out.verschieden = !gleich(Array.from(Ansicht3D.holzFaktor(11).werte), Array.from(Ansicht3D.holzFaktor(12).werte));
    const stat = (m) => window.__statistik(window.__faktoren(m.map));
    out.hell = a.felder.filter((f, i) => (Math.floor(i / 8) + i % 8) % 2 === 0).map(f => f.material);
    out.dunkel = a.felder.filter((f, i) => (Math.floor(i / 8) + i % 8) % 2 === 1).map(f => f.material);
    out.alleMitMap = a.felder.every(f => f.material.map && f.material.map.isTexture);
    const rahmen = a.szene.children.find(m => m.geometry && m.geometry.type === 'BoxGeometry' && m.geometry.parameters.width > 8);
    out.rahmenMap = !!(rahmen && rahmen.material.map && rahmen.material.map.isTexture);
    const einzigartig = (liste) => [...new Set(liste)];
    out.stat = { hell: einzigartig(out.hell).map(stat), dunkel: einzigartig(out.dunkel).map(stat), rahmen: rahmen && rahmen.material.map ? [stat(rahmen.material)] : [] };
    out.dreh = [...new Set(a.felder.filter((f, i) => (Math.floor(i / 8) + i % 8) % 2 === 0).map(f => f.userData.dreh))].sort();
    out.varianten = { hell: einzigartig(out.hell).length, dunkel: einzigartig(out.dunkel).length };
    delete out.hell; delete out.dunkel;
    return out;
  });
  const f = p.fehler; await zu(p);
  const alle = [...r.stat.hell, ...r.stat.dunkel, ...r.stat.rahmen];
  console.log(`       Streuung ${alle.map(s => s.streuung.toFixed(3)).join('/')}, Faktor ${Math.min(...alle.map(s => s.min)).toFixed(3)} bis ${Math.max(...alle.map(s => s.max)).toFixed(3)}, Drehungen ${r.dreh.join(',')}`);
  pruefe(r.zweimal && r.verschieden, `Erzeugung nicht reproduzierbar oder Varianten gleich: ${r.zweimal}/${r.verschieden}`);
  pruefe(r.alleMitMap && r.rahmenMap, `Texturen fehlen: Felder ${r.alleMitMap}, Rahmen ${r.rahmenMap}`);
  pruefe(r.varianten.hell === 2 && r.varianten.dunkel === 2, `Varianten ${JSON.stringify(r.varianten)}`);
  pruefe(alle.length === 5 && alle.every(s => s.min >= 0.9 - 1e-3 && s.max <= 1.0 + 1e-3), `Faktor außerhalb 0,90 bis 1,00: ${JSON.stringify(alle)}`);
  pruefe(alle.every(s => s.streuung >= 0.012), `Maserung zu schwach: ${alle.map(s => s.streuung.toFixed(4)).join('/')}`);
  pruefe(r.dreh.length >= 3, `nur ${r.dreh.length} Drehungen unter den hellen Feldern`);
  pruefe(f.length === 0, f.join(' | '));
});

test('o_kontrast', async () => {
  const p = await seite({ ansicht: '3d' });
  await p.evaluate(KONTRAST);
  const r = await p.evaluate(() => {
    const a = window.__brett.chess.ui.ansicht3d;
    const hell = a.felder[0].material, dunkel = a.felder[1].material;
    const extrem = (mat, art) => { const w = window.__faktoren(mat.map); const m = art === 'max' ? Math.max(...w) : Math.min(...w); return window.__rgb(mat.color.getHex()).map(c => c * m); };
    // alle Varianten prüfen, ungünstigster Wert zählt
    const hellMats = [...new Set(a.felder.filter((f, i) => (Math.floor(i / 8) + i % 8) % 2 === 0).map(f => f.material))];
    const dunkelMats = [...new Set(a.felder.filter((f, i) => (Math.floor(i / 8) + i % 8) % 2 === 1).map(f => f.material))];
    const weiss = window.__rgb(a.figurMat.w.color.getHex()), schwarz = window.__rgb(a.figurMat.b.color.getHex());
    return { weiss: Math.min(...hellMats.map(m => window.__kontrast(weiss, extrem(m, 'max')))), schwarz: Math.min(...dunkelMats.map(m => window.__kontrast(schwarz, extrem(m, 'min')))) };
  });
  const f = p.fehler; await zu(p);
  console.log(`       Worst-Case-Kontraste ${JSON.stringify({ weiss: +r.weiss.toFixed(2), schwarz: +r.schwarz.toFixed(2) })}`);
  pruefe(r.weiss >= 1.4, `weiße Figur auf hellem Feld: ${r.weiss.toFixed(2)}`);
  pruefe(r.schwarz >= 2.5, `schwarze Figur auf dunklem Feld: ${r.schwarz.toFixed(2)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('o_leistung', async () => {
  const p = await seite({ ansicht: '3d' });
  const r = await p.evaluate(() => {
    const a = window.__brett.chess.ui.ansicht3d, t0 = performance.now();
    for (const s of [11, 12, 21, 22, 31]) a._holzTextur(s);
    const ms = performance.now() - t0;
    // 30 Züge (Springer hin und her, Lernhilfe aus): keine zusätzlichen Texturen
    const g = window.__brett.chess; g.control.setMode(false); g.ui.handleReset(); g.control.setLernen(false);
    const idx = (s) => (8 - Number(s[1])) * 8 + 'abcdefgh'.indexOf(s[0]);
    a._bild();
    const vorher = a.renderer.info.memory.textures;
    const folge = [['g1', 'f3'], ['g8', 'f6'], ['f3', 'g1'], ['f6', 'g8']];
    for (let i = 0; i < 30; i++) { const [v, n] = folge[i % 4]; g.ui.handleSquareClick(idx(v)); g.ui.handleSquareClick(idx(n)); }
    a._bild();
    return { ms, vorher, nachher: a.renderer.info.memory.textures, zuege: g.control.boundary.getFEN() };
  });
  const fremd = p.fremd.slice(), f = p.fehler; await zu(p);
  console.log(`       Texturen erzeugen ${r.ms.toFixed(0)} ms, Texturen im Speicher ${r.vorher} -> ${r.nachher}`);
  pruefe(r.ms <= 100, `Texturerzeugung ${r.ms.toFixed(0)} ms`);
  pruefe(r.vorher >= 5 && r.nachher === r.vorher, `Texturen ${r.vorher} -> ${r.nachher}`);
  pruefe(fremd.length === 0, `Anfragen an fremde Server: ${fremd.join(', ')}`);
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
