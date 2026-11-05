// Tests für S-W16 (Wahrzeichen sichtbar: Leuchtsäule und großes Schild), Teil Spiel.
// Aufruf: node werkstatt/tests/saeulen_test.js [ORDNER]   (NUR=name wählt einen Test aus)
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const URL_ = `http://127.0.0.1:${PORT}/driftpokal/`;
let browser;

async function seite() {
  const ctx = await browser.newContext({ viewport: { width: 915, height: 412 }, hasTouch: true });
  const p = await ctx.newPage();
  p.fehler = [];
  p.on('pageerror', e => p.fehler.push(e.message));
  await p.goto(URL_);
  await p.waitForFunction(() => typeof TrackSceneUI !== 'undefined' && typeof TRACK_LOOK !== 'undefined', null, { timeout: 90000 });
  return p;
}
const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const pruefe = (bed, text) => { if (!bed) throw new Error(text); };

const szene = (id) => `(() => {
  const geom = new TrackEntity(TrackCatalog.def('${id}')).geometry();
  const look = TrackLookUI.look(new RaceBoundary().trackInfo('${id}'));
  return new TrackSceneUI(new KitUI(1), geom, look, 'fast');
})()`;

test('s16_saeulen_einbau', async () => {
  const p = await seite();
  const r = await p.evaluate((code) => ({
    oer: eval(code.oer).beacons.length,
    erken: eval(code.erken).beacons.length,
  }), { oer: szene('oer'), erken: szene('erken') });
  pruefe(r.oer === 12, 'Säulen in der Oer-Runde: ' + r.oer);
  pruefe(r.erken === 0, 'Säulen in Strecke erken: ' + r.erken);
  pruefe(p.fehler.length === 0, 'Skriptfehler ' + p.fehler[0]);
  await p.context().close();
});

test('s16_saeulen_hoehe', async () => {
  const p = await seite();
  const r = await p.evaluate((code) => {
    const w = eval(code.oer);
    return w.labels.map((l, i) => {
      const b = w.beacons[i];
      const hoehe = b.geometry.parameters.height;
      return { top: b.position.y + hoehe / 2, schild: l.sprite.position.y, unten: b.position.y - hoehe / 2 - b.userData.boden, x: b.position.x - l.sprite.position.x, z: b.position.z - l.sprite.position.z };
    });
  }, { oer: szene('oer') });
  r.forEach((v, i) => {
    pruefe(v.top >= v.schild - 0.01, `Säule ${i + 1} endet unter dem Schild: ${v.top} < ${v.schild}`);
    pruefe(Math.abs(v.unten) < 0.01, `Säule ${i + 1} steht nicht auf dem Boden: ${v.unten}`);
    pruefe(Math.abs(v.x) < 0.01 && Math.abs(v.z) < 0.01, `Säule ${i + 1} nicht am Standort`);
  });
  await p.context().close();
});

test('s16_saeulen_alpha', async () => {
  const p = await seite();
  const r = await p.evaluate((code) => {
    const w = eval(code.oer), l = w.labels[0], b = w.beacons[0], c = l.sprite.position;
    const out = {};
    for (const d of [60, 400, 900]) {
      const cam = { position: { x: c.x + d, y: 40, z: c.z } };
      w.updateLabels(cam);
      out[d] = { schild: l.sprite.material.opacity, saeule: b.material.opacity, sichtbar: b.visible };
    }
    return out;
  }, { oer: szene('oer') });
  pruefe(Math.abs(r[60].saeule - 0.85) < 0.01 && r[60].sichtbar === true, 'nah: Säule nicht voll sichtbar ' + JSON.stringify(r[60]));
  pruefe(r[400].sichtbar === true && r[400].saeule > 0.3 && r[400].saeule < 0.85, 'Mitte: Säule blendet nicht ein ' + JSON.stringify(r[400]));
  pruefe(r[900].sichtbar === false, 'fern: Säule noch sichtbar ' + JSON.stringify(r[900]));
  await p.context().close();
});

test('s16_schild_gross', async () => {
  const p = await seite();
  const breiten = await p.evaluate((code) => eval(code.oer).labels.map(l => l.sprite.scale.x), { oer: szene('oer') });
  pruefe(breiten.length === 12 && breiten.every(b => b >= 140), 'Schild zu schmal: ' + Math.min(...breiten));
  await p.context().close();
});

// Nachtrag 05.11.2026 (Befund vom Handy: "Die Schilder sind zu hoch im Quermodus")
test('s16_schild_hoehe', async () => {
  const p = await seite();
  const r = await p.evaluate((code) => {
    const w = eval(code.oer), box = new THREE.Box3(), c = new THREE.Vector3();
    return w.look.landmarks.map((lm, i) => {
      let top = -1e9;
      for (const m of w.group.children) {
        if (!m.isMesh || w.beacons.includes(m)) continue;
        box.setFromObject(m); box.getCenter(c);
        if (Math.hypot(c.x - lm.x, c.z - lm.y) < 60 && box.max.y > top) top = box.max.y;
      }
      const s = w.labels[i].sprite, boden = w.beacons[i].userData.boden;
      return { name: lm.label, mitte: s.position.y - boden, halb: s.scale.y / 2, dach: top - boden };
    });
  }, { oer: szene('oer') });
  // Querformat 915 x 412, Blickwinkel 50 Grad, Kamera 150 Einheiten entfernt, 10 über dem Boden, waagrecht:
  // oberer Bildrand liegt 10 + 150 * tan(25 Grad) = 79,9 über dem Boden
  const rand = 10 + 150 * Math.tan(25 * Math.PI / 180);
  for (const v of r) {
    pruefe(v.mitte <= 60.01, `${v.name}: Schildmitte ${v.mitte.toFixed(1)} über dem Boden (höchstens 60)`);
    pruefe(v.mitte + v.halb < rand, `${v.name}: Schild ragt im Querformat bei 150 Einheiten aus dem Bild`);
    if (v.dach + 20 <= 60) pruefe(Math.abs(v.mitte - (v.dach + 20)) < 0.6, `${v.name}: Schild nicht 20 über dem Dach (${v.mitte.toFixed(1)} statt ${(v.dach + 20).toFixed(1)})`);
  }
  await p.context().close();
});

(async () => {
  const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ordner, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const nur = process.env.NUR; let rot = 0;
  for (const t of tests) {
    if (nur && t.name !== nur) continue;
    try { await t.fn(); console.log('OK     ' + t.name); } catch (e) { rot++; console.log('FEHLER ' + t.name + ': ' + e.message); }
    for (const c of browser.contexts()) await c.close().catch(() => { });
  }
  await browser.close(); srv.kill();
  console.log(rot ? `${rot} Test(s) rot` : 'Alle Säulentests (S-W16) grün');
  process.exit(rot ? 1 : 0);
})();
