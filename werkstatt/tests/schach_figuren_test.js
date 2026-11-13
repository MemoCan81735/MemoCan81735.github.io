// Tests für S-W06 (Schachfiguren klar unterscheidbar in 2D und 3D).
// Aufruf: node werkstatt/tests/schach_figuren_test.js [ORDNER]   (NUR=name wählt Tests aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/brettspiele/`;
const ARTEN = ['p', 'r', 'n', 'b', 'q', 'k'];

let browser;
async function seite(ansicht) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  await p.addInitScript((a) => localStorage.setItem('brettspiele.einstellungen', JSON.stringify({ formatversion: 1, ton: false, stufen: {}, ansicht: { chess: a } })), ansicht);
  await p.goto(URL_);
  await p.waitForFunction(() => window.__brett && window.__brett.chess, null, { timeout: 20000 });
  await p.evaluate(t => document.querySelector(`.tabBtn[data-tab=${t}]`).click(), 'chess');   // S-W25: Kachel der Auswahl, auch wenn das Spiel schon offen ist
  if (ansicht === '3d') await p.waitForFunction(() => window.__brett.chess.ui.ansicht3d && window.__brett.chess.ui.ansicht3d.aktiv, null, { timeout: 20000 });
  await p.waitForTimeout(300);
  return p;
}
const zu = async p => p.context().close();
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };
// Kontrast nach WCAG aus "rgb(r, g, b)" oder Zahl 0xRRGGBB
const KONTRAST = `
  window.__lum = (f) => {
    let r, g, b;
    if (typeof f === 'number') { r = (f >> 16) & 255; g = (f >> 8) & 255; b = f & 255; }
    else if (f.startsWith('#')) { const n = parseInt(f.slice(1), 16); r = (n >> 16) & 255; g = (n >> 8) & 255; b = n & 255; }
    else [r, g, b] = f.match(/[\\d.]+/g).map(Number);
    const k = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
  };
  window.__kontrast = (a, b) => { const x = window.__lum(a), y = window.__lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };`;

test('f_2d_svg', async () => {
  const p = await seite('2d');
  const r = await p.evaluate(async () => {
    const out = {}, figuren = [...document.querySelectorAll('#chboard .ch-piece')];
    out.anzahl = figuren.length;
    out.svg = figuren.filter(f => f.querySelector('svg')).length;
    out.text = figuren.map(f => f.textContent.trim()).filter(Boolean).length;
    // gezeichnete Fläche (ohne Rand): König hoch genug, jeder Sockel breit genug
    const feld = document.querySelector('#chboard .ch-square').getBoundingClientRect();
    const mass = (f) => f.querySelector('.koerper').getBoundingClientRect();
    out.koenigHoehe = mass(figuren.find(f => f.querySelector('svg').dataset.figur === 'wk')).height / feld.height;
    out.breite = Math.min(...figuren.map(f => mass(f).width / feld.width));
    // Umwandlung für Schwarz: Stellung mit schwarzem Bauern auf der 2. Reihe
    const g = window.__brett.chess; g.control.setMode(false); g.ui.handleReset();
    g.control.setLernen(false);   // Zugfolge mit absichtlichen Patzern: ohne Warnung der Lernhilfe (S-W07)
    // a3 h5 a4 h4 a5 h3 a6 hxg2 axb7, dann gxh1: Umwandlung für Schwarz
    for (const [v, n] of [[48, 40], [15, 31], [40, 32], [31, 39], [32, 24], [39, 47], [24, 16], [47, 54], [16, 9], [54, 63]]) { g.ui.handleSquareClick(v); g.ui.handleSquareClick(n); }
    out.umwandlung = !!g.control.getPendingPromotion();
    out.knoepfe = [...document.querySelectorAll('#chpromo button')].map(b => (b.querySelector('svg') || {}).dataset ? b.querySelector('svg').dataset.figur : null);
    g.ui.handleReset();
    return out;
  });
  const f = p.fehler; await zu(p);
  pruefe(r.anzahl === 32 && r.svg === 32 && r.text === 0, `Figuren als SVG: ${JSON.stringify(r)}`);
  console.log(`       König ${(r.koenigHoehe * 100).toFixed(0)} % der Feldhöhe, schmalste Figur ${(r.breite * 100).toFixed(0)} % der Feldbreite`);
  pruefe(r.koenigHoehe >= 0.8 && r.breite >= 0.6, `König ${(r.koenigHoehe * 100).toFixed(0)} % hoch, schmalste Figur ${(r.breite * 100).toFixed(0)} % breit`);
  pruefe(r.umwandlung && JSON.stringify(r.knoepfe) === '["bq","br","bb","bn"]', `Umwandlung ${JSON.stringify(r)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('f_2d_umriss', async () => {
  const p = await seite('2d');
  const r = await p.evaluate(async (ARTEN) => {
    const N = 64, masken = {};
    for (const art of ARTEN) {
      const svg = ChessUI.figurSvg('w' + art);
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg width="${N}" height="${N}" `));
      await img.decode();
      const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'); g.drawImage(img, 0, 0, N, N);
      const d = g.getImageData(0, 0, N, N).data; masken[art] = Array.from({ length: N * N }, (_, i) => d[i * 4 + 3] > 64);
    }
    const out = {};
    for (let i = 0; i < ARTEN.length; i++) for (let j = i + 1; j < ARTEN.length; j++) {
      const a = masken[ARTEN[i]], b = masken[ARTEN[j]]; let s = 0, v = 0;
      for (let k = 0; k < a.length; k++) { if (a[k] && b[k]) s++; if (a[k] || b[k]) v++; }
      out[ARTEN[i] + ARTEN[j]] = +(s / v).toFixed(3);
    }
    // Fehlalarm-Probe: gleiche Art in beiden Farben hat gleichen Umriss (erlaubt)
    const ohneFarbe = (s) => s.replace(/class="[wb]"/, '').replace(/data-figur="[wb]q"/, '');
    out.gleicheArt = ohneFarbe(ChessUI.figurSvg('wq')) === ohneFarbe(ChessUI.figurSvg('bq'));
    return out;
  }, ARTEN);
  const f = p.fehler; await zu(p);
  const zuAehnlich = Object.entries(r).filter(([k, v]) => k !== 'gleicheArt' && v >= 0.8);
  console.log('       Überdeckung höchstens ' + Math.max(...Object.entries(r).filter(([k]) => k !== 'gleicheArt').map(([, v]) => v)));
  pruefe(!zuAehnlich.length, `zu ähnlich: ${JSON.stringify(zuAehnlich)}`);
  pruefe(r.gleicheArt, 'Weiß und Schwarz derselben Art haben verschiedene Umrisse');
  pruefe(f.length === 0, f.join(' | '));
});

test('f_2d_kontrast', async () => {
  const p = await seite('2d');
  await p.evaluate(KONTRAST);
  const r = await p.evaluate(() => {
    const st = (sel) => getComputedStyle(document.querySelector(sel));
    const hell = st('#chboard .ch-square.light').backgroundColor, dunkel = st('#chboard .ch-square.dark').backgroundColor;
    const w = st('#chboard .ch-piece.w svg .koerper'), b = st('#chboard .ch-piece.b svg .koerper');
    return {
      weissRandHell: window.__kontrast(w.stroke, hell), weissFlaecheRand: window.__kontrast(w.fill, w.stroke),
      schwarzHell: window.__kontrast(b.fill, hell), schwarzDunkel: window.__kontrast(b.fill, dunkel),
    };
  });
  const f = p.fehler; await zu(p);
  console.log('       Kontraste ' + JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, +v.toFixed(1)]))));
  pruefe(r.weissRandHell >= 7 && r.weissFlaecheRand >= 7, `Weiß: Rand zu hellem Feld ${r.weissRandHell.toFixed(1)}, Fläche zu Rand ${r.weissFlaecheRand.toFixed(1)}`);
  pruefe(r.schwarzHell >= 7 && r.schwarzDunkel >= 3, `Schwarz: hell ${r.schwarzHell.toFixed(1)}, dunkel ${r.schwarzDunkel.toFixed(1)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('f_3d_hoehen', async () => {
  const p = await seite('3d');
  const r = await p.evaluate((ARTEN) => {
    const a = window.__brett.chess.ui.ansicht3d, out = {};
    for (const art of ARTEN) { const g = a._figur('w' + art); out[art] = +new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()).y.toFixed(3); }
    return out;
  }, ARTEN);
  const f = p.fehler; await zu(p);
  console.log('       Höhen ' + JSON.stringify(r));
  for (let i = 1; i < ARTEN.length; i++) pruefe(r[ARTEN[i]] - r[ARTEN[i - 1]] >= 0.1 - 1e-6, `${ARTEN[i - 1]} ${r[ARTEN[i - 1]]} → ${ARTEN[i]} ${r[ARTEN[i]]}: Abstand unter 0,1`);
  pruefe(r.k - r.q >= 0.12, `König nur ${(r.k - r.q).toFixed(2)} höher als Dame`);
  pruefe(f.length === 0, f.join(' | '));
});

test('f_3d_kontrast', async () => {
  const p = await seite('3d');
  await p.evaluate(KONTRAST);
  const r = await p.evaluate(() => {
    const a = window.__brett.chess.ui.ansicht3d, hell = a.felder[0].material.color.getHex(), dunkel = a.felder[1].material.color.getHex();
    return { weiss: window.__kontrast(a.figurMat.w.color.getHex(), hell), schwarz: window.__kontrast(a.figurMat.b.color.getHex(), dunkel) };
  });
  const f = p.fehler; await zu(p);
  console.log('       Kontraste 3D ' + JSON.stringify({ weiss: +r.weiss.toFixed(2), schwarz: +r.schwarz.toFixed(2) }));
  pruefe(r.weiss >= 1.4 && r.schwarz >= 2.5, `3D-Kontrast ${JSON.stringify(r)}`);
  pruefe(f.length === 0, f.join(' | '));
});

test('f_3d_kontur', async () => {
  const p = await seite('3d');
  const r = await p.evaluate(() => {
    const a = window.__brett.chess.ui.ansicht3d, out = { fehlt: [] };
    for (const [feld, g] of a.stuecke) {
      const koerper = g.children.filter(m => m.material === a.figurMat.w || m.material === a.figurMat.b).length;
      const kontur = g.children.filter(m => m.userData.kontur && [a.konturMat, a.konturEckig].some(k => m.material === k[g.userData.wert[0]])).length;
      if (!koerper || kontur !== koerper) out.fehlt.push(feld);
    }
    out.anzahl = a.stuecke.size;
    const hell = (m) => { const f = m.uniforms.farbe.value; return 0.2126 * f.r + 0.7152 * f.g + 0.0722 * f.b; };
    out.hellW = hell(a.konturMat.w); out.hellB = hell(a.konturMat.b);
    // Breite in Bildpunkten am fernsten Feld a8
    const el = a.renderer.domElement.getBoundingClientRect(), rechts = new THREE.Vector3(1, 0, 0).applyQuaternion(a.kamera.quaternion);
    const p1 = a._feldPos(0).setY(0.5), p2 = p1.clone().addScaledVector(rechts, Math.min(a.konturMat.w.uniforms.dicke.value, a.konturMat.b.uniforms.dicke.value));
    const px = (v) => { const q = v.clone().project(a.kamera); return { x: (q.x + 1) / 2 * el.width, y: (1 - q.y) / 2 * el.height }; };
    const q1 = px(p1), q2 = px(p2); out.breite = Math.hypot(q2.x - q1.x, q2.y - q1.y); out.leinwand = el.width;
    // Bild lesen: dunkle Punkte am Rand des weißen Bauern e2 (helles Feld)
    const w = a.renderer.domElement.width, h = a.renderer.domElement.height, rt = new THREE.WebGLRenderTarget(w, h);
    a.renderer.setRenderTarget(rt); a.renderer.render(a.szene, a.kamera);
    const buf = new Uint8Array(w * h * 4); a.renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf); a.renderer.setRenderTarget(null); rt.dispose();
    const s = w / el.width;
    const zaehle = (feld, bed) => { const m = px(a._feldPos(feld).setY(0.4)); let n = 0;
      for (let dy = -18; dy <= 18; dy++) for (let dx = -18; dx <= 18; dx++) {
        const x = Math.round((m.x + dx) * s), y = h - 1 - Math.round((m.y + dy) * s), i = (y * w + x) * 4;
        if (bed(buf[i] + buf[i + 1] + buf[i + 2])) n++;
      } return n; };
    out.dunkel = zaehle(52, (v) => v < 3 * 45);    // weißer Bauer e2 auf hellem Feld: dunkle Kontur
    out.hellePunkte = zaehle(12, (v) => v > 3 * 200); // schwarzer Bauer e7 auf dunklem Feld: helle Kontur
    a._bild();
    return out;
  });
  const f = p.fehler; await zu(p);
  console.log(`       Kontur ${r.breite.toFixed(2)} px breit (Leinwand ${r.leinwand} px), ${r.dunkel} dunkle Punkte am Bauern e2, ${r.hellePunkte} helle am Bauern e7`);
  pruefe(r.anzahl === 32 && !r.fehlt.length, `Kontur fehlt an ${JSON.stringify(r.fehlt)}`);
  pruefe(r.hellW < 0.05 && r.hellB > 0.7, `Konturfarben: Weiß ${r.hellW}, Schwarz ${r.hellB}`);
  pruefe(r.hellePunkte >= 20, `nur ${r.hellePunkte} helle Punkte am schwarzen Bauern`);
  pruefe(r.breite >= 1.5, `Kontur nur ${r.breite.toFixed(2)} px`);
  pruefe(r.dunkel >= 20, `nur ${r.dunkel} dunkle Punkte am weißen Bauern`);
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
