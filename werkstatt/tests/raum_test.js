// S-W29: Spieleraum. Aufruf: NODE_PATH=$(npm root -g) node werkstatt/tests/raum_test.js [Ordner]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const wurzel = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const typen = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/json', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wasm': 'application/wasm', '.css': 'text/css' };
const srv = http.createServer((q, r) => { let p = path.join(wurzel, decodeURIComponent(q.url.split('?')[0])); if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': typen[path.extname(p)] || 'text/plain' }); r.end(d); } }); });
let fehler = 0; const ok = (n, b, m = '') => { console.log((b ? 'OK     ' : 'FEHLER ') + n + (b ? '' : ' ' + m)); if (!b) fehler++; };
const PLAETZE = { 'Konsole': 5, 'Spieltisch': 9, 'Inselmodell': 1, 'Staffelei': 2, 'Perlenkästchen': 1 };
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  let man = null; try { man = JSON.parse(fs.readFileSync(path.join(wurzel, 'raum/manifest.webmanifest'), 'utf8')); } catch (e) { /* fehlt */ }
  ok('raum_symbol: Symbol 192 und 512 im Manifest', !!man && ['192x192', '512x512'].every(g => man.icons.some(i => i.sizes === g && fs.existsSync(path.join(wurzel, 'raum', i.src)))));
  const start = fs.readFileSync(path.join(wurzel, 'index.html'), 'utf8');
  ok('raum_karte: Karte auf der Startseite in der Rubrik Spieleraum', /<section id="spieleraum"[\s\S]*?<a class="karte" href="raum\/">\s*<img src="bilder\/raum.jpg"[^>]*>[\s\S]*?<h3>Spieleraum<\/h3>/.test(start) && fs.existsSync(path.join(wurzel, 'bilder/raum.jpg')));
  for (const [vp, fname] of [[{ width: 412, height: 915 }, 'hoch'], [{ width: 915, height: 412 }, 'quer']]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, hasTouch: true });
    const p = await ctx.newPage(); const hosts = new Set(), fe = [];
    p.on('request', q => { const u = new URL(q.url()); if (u.hostname !== 'localhost' && u.protocol.startsWith('http')) hosts.add(u.host); });
    p.on('pageerror', e => fe.push(String(e)));
    const t0 = Date.now(); await p.goto(`http://localhost:${port}/raum/`);
    let da = false; try { await p.waitForFunction(() => document.getElementById('buehne').width > 0 && document.querySelectorAll('.marke').length === 5, null, { timeout: 8000 }); da = true; } catch (e) { /* zu langsam */ }
    ok(`raum_laden ${fname}: Raum mit 5 Schildern da`, da, (Date.now() - t0) + ' ms');
    ok(`raum_laden ${fname}: Seitentitel`, (await p.title()) === 'Spieleraum', await p.title());
    const z = await p.evaluate(() => { const a = document.querySelector('a.ng-zurueck'); const r = a.getBoundingClientRect(); return { h: r.height, l: r.left, r: r.right, t: r.top, u: r.bottom, vw: innerWidth, vh: innerHeight, href: a.getAttribute('href') }; });
    ok(`raum_zurueck ${fname}: Zurück-Link mindestens 44 px und ganz im Bild`, z.h >= 44 && z.l >= 0 && z.r <= z.vw && z.t >= 0 && z.u <= z.vh && z.href === '../', JSON.stringify(z));
    ok(`raum_laden ${fname}: kein waagerechtes Scrollen`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (fname === 'hoch') {
      // U-2/U-3: jedes Schild öffnet seinen Platz mit den richtigen Spielen, jedes Spiel gibt es auf der Seite
      for (const [name, anzahl] of Object.entries(PLAETZE)) {
        await p.evaluate(n => [...document.querySelectorAll('.marke')].find(m => m.textContent === n).click(), name);
        await p.waitForTimeout(300);
        const t = await p.evaluate(() => ({ offen: !document.getElementById('tafel').hidden, name: document.getElementById('tafelname').textContent, n: document.querySelectorAll('#tafelliste .spielen').length }));
        ok(`raum_platz: ${name} öffnet ${anzahl} Spiel(e)`, t.offen && t.name === name && t.n === anzahl, JSON.stringify(t));
        const knopf = await p.locator('#tafelliste .spielen').first().boundingBox();
        ok(`raum_platz: ${name} Spielen-Taste mindestens 44 px und im Bild`, knopf && knopf.height >= 44 && knopf.x + knopf.width <= vp.width && knopf.y + knopf.height <= vp.height, JSON.stringify(knopf));
      }
      const urls = await p.evaluate(() => [...document.querySelectorAll('.marke')].length);
      ok('raum_platz: 5 Plätze', urls === 5);
      // U-3: Spiel öffnet im Raum, U-4: zurück über die Leiste
      await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Spieltisch').click());
      await p.waitForTimeout(300);
      await p.click('[aria-label="Brettspiele spielen"]');
      let geladen = false; try { await p.waitForFunction(() => { const f = document.getElementById('spielrahmen'); try { return !document.getElementById('spielfenster').hidden && f.contentWindow.location.pathname === '/brettspiele/' && f.contentDocument.readyState === 'complete'; } catch (e) { return false; } }, null, { timeout: 8000 }); geladen = true; } catch (e) { /* nicht geladen */ }
      ok('raum_spiel: Brettspiele öffnen im Spielfenster', geladen);
      const leiste = await p.locator('#spielzu').boundingBox();
      ok('raum_spiel: Taste "Zurück in den Raum" mindestens 44 px', leiste && leiste.height >= 44 && leiste.y >= 0, JSON.stringify(leiste));
      await p.click('#spielzu'); await p.waitForTimeout(300);
      ok('raum_spiel: Leiste schließt das Spiel, Raum bleibt', await p.evaluate(() => document.getElementById('spielfenster').hidden && document.getElementById('spielrahmen').getAttribute('src') === 'about:blank') && new URL(p.url()).pathname === '/raum/');
      // U-4: Zurück-Link des Spiels führt zurück in den Raum, nicht zur Startseite
      await p.click('[aria-label="Brettspiele spielen"]');
      try { await p.waitForFunction(() => { try { return document.getElementById('spielrahmen').contentDocument.querySelector('a.ng-zurueck') && document.getElementById('spielrahmen').contentDocument.readyState === 'complete'; } catch (e) { return false; } }, null, { timeout: 8000 }); } catch (e) { /* fehlt */ }
      await p.evaluate(() => document.getElementById('spielrahmen').contentDocument.querySelector('a.ng-zurueck').click());
      await p.waitForTimeout(800);
      const nach = await p.evaluate(() => { const f = document.getElementById('spielrahmen'); let innen = ''; try { innen = f.contentWindow.location.pathname; } catch (e) { innen = '?'; } return { zu: document.getElementById('spielfenster').hidden, innen }; });
      ok('raum_spiel_zurueck: Zurück-Link im Spiel führt in den Raum', nach.zu && nach.innen !== '/' && new URL(p.url()).pathname === '/raum/', JSON.stringify(nach));
      // Escape schließt Spiel und Tafel
      // Escape gehört im Spiel dem Spiel; auf der Leiste des Raums schließt es das Spielfenster
      await p.click('[aria-label="Brettspiele spielen"]'); await p.waitForTimeout(1500);
      await p.focus('#spielzu'); await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok('raum_taste: Escape schließt das Spielfenster', await p.evaluate(() => document.getElementById('spielfenster').hidden));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      ok('raum_taste: Escape schließt die Tafel', await p.evaluate(() => document.getElementById('tafel').hidden && !document.getElementById('karte').hidden));
      // AK-6: an der Konsole läuft das Spiel auf dem Fernseher im Raum, "Groß spielen" wechselt zur Vollansicht
      await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Konsole').click());
      await p.waitForTimeout(300);
      await p.click('#tafelliste .spielen');
      let tv = null; try { await p.waitForFunction(() => { const f = document.getElementById('spielfenster'); return f.classList.contains('tv') && !f.classList.contains('unterwegs'); }, null, { timeout: 15000 }); tv = await p.evaluate(() => { const r = document.getElementById('spielrahmen').getBoundingClientRect(), l = document.querySelector('.leiste').getBoundingClientRect(); return { x: r.left, y: r.top, b: r.width, h: r.height, unter: l.bottom, vw: innerWidth, vh: innerHeight }; }); } catch (e) { /* nicht angekommen */ }
      ok('raum_fernseher: Spiel liegt auf dem Fernseher, ganz im Bild unter der Leiste', !!tv && tv.x >= 0 && tv.x + tv.b <= tv.vw + 1 && tv.y >= tv.unter && tv.y + tv.h <= tv.vh && tv.b < tv.vw && tv.b > 200 && Math.abs(tv.b / tv.h - 1.04 / 0.58) < 0.1, JSON.stringify(tv));
      await p.click('#spielgross'); await p.waitForTimeout(300);
      const gross = await p.evaluate(() => { const r = document.getElementById('spielrahmen').getBoundingClientRect(); return { tv: document.getElementById('spielfenster').classList.contains('tv'), b: r.width, vw: innerWidth }; });
      ok('raum_fernseher: "Groß spielen" zeigt das Spiel über die ganze Breite', !gross.tv && Math.abs(gross.b - gross.vw) < 2, JSON.stringify(gross));
      await p.click('#spielzu'); await p.waitForTimeout(300);
      ok('raum_fernseher: Zurück schließt das Spiel, Tafel der Konsole wieder da', await p.evaluate(() => document.getElementById('spielfenster').hidden && !document.getElementById('tafel').hidden && !document.body.classList.contains('tvmodus')));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // AK-7: auch die anderen Plätze zeigen ihr Spiel auf ihrer Fläche im Raum (Tisch, Sockel, Leinwand)
      for (const name of ['Spieltisch', 'Staffelei']) {
        await p.evaluate(n => [...document.querySelectorAll('.marke')].find(m => m.textContent === n).click(), name);
        await p.waitForTimeout(300);
        await p.click(name === 'Spieltisch' ? '[aria-label="Brettspiele spielen"]' : '#tafelliste .spielen');
        let r = null; try { await p.waitForFunction(() => { const f = document.getElementById('spielfenster'); return f.classList.contains('tv') && !f.classList.contains('unterwegs'); }, null, { timeout: 15000 }); r = await p.evaluate(() => { const b = document.getElementById('spielrahmen').getBoundingClientRect(), l = document.querySelector('.leiste').getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), b: Math.round(b.width), h: Math.round(b.height), unter: l.bottom, vw: innerWidth, vh: innerHeight }; }); } catch (e) { /* nicht angekommen */ }
        ok(`raum_flaeche: ${name} zeigt das Spiel auf seiner Fläche, ganz im Bild`, !!r && r.x >= 0 && r.x + r.b <= r.vw + 1 && r.y >= r.unter && r.y + r.h <= r.vh && r.b > 200 && r.h > 120, JSON.stringify(r));
        await p.click('#spielzu'); await p.waitForTimeout(300);
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      // AK-12: Neon Ada: die Insel steht als Modell auf dem Sockel, Antippen hebt dort Land; Zurück räumt sie wieder weg
      {
        await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Inselmodell').click());
        await p.waitForTimeout(300);
        await p.click('[aria-label="Neon Ada spielen"]');
        const hoehen = () => p.evaluate(() => { const g = window.raumModell.halter.children[0]; if (!g) return null; const m = g.children[0], M = new THREE.Matrix4(); let s = 0; for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); s += M.elements[5]; } return +s.toFixed(2); });
        let da = false; try { await p.waitForFunction(() => { const g = window.raumModell.halter.children[0]; return g && g.children[0].instanceColor; }, null, { timeout: 20000 }); da = true; } catch (e) { /* kein Modell */ }
        await p.waitForTimeout(2500);
        const vor = await hoehen();
        const mitte = await p.evaluate(() => { const v = new THREE.Vector3(); window.raumModell.halter.getWorldPosition(v); return window.raumModell.aufBild(v); });
        const imRaum = await p.evaluate(() => { const d = document.getElementById('spielrahmen').contentDocument; return d.documentElement.classList.contains('imraum') && document.getElementById('spielfenster').classList.contains('modell'); });
        for (let i = 0; i < 3; i++) { await p.mouse.click(mitte.x, mitte.y + 40); await p.waitForTimeout(500); }
        const nach = await hoehen();
        ok('raum_modell: Neon Ada steht als Insel auf dem Sockel, Antippen hebt dort Land', da && imRaum && vor !== null && nach > vor, JSON.stringify({ da, imRaum, vor, nach, mitte }));
        await p.click('#spielzu'); await p.waitForTimeout(300);
        ok('raum_modell: Zurück räumt die Insel weg, das Schmuckmodell steht wieder', await p.evaluate(() => !window.raumModell.halter.children.length && document.getElementById('spielfenster').hidden && !document.getElementById('tafel').hidden));
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      // AK-13: Perlenwerkstatt: das geplante Armband liegt als 3D-Perlenkette auf dem Esstisch, Planung im Feld darunter
      {
        await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Perlenkästchen').click());
        await p.waitForTimeout(300);
        await p.click('[aria-label="Perlenwerkstatt spielen"]');
        let da = false; try { await p.waitForFunction(() => window.raumArmband.perlen() > 0 && window.raumArmband.perlen() === window.raumArmband.vorschau(), null, { timeout: 20000 }); da = true; } catch (e) { /* kein Armband */ }
        await p.waitForTimeout(2500);
        const a = await p.evaluate(() => { const r = document.getElementById('spielrahmen').getBoundingClientRect(), l = document.querySelector('.leiste').getBoundingClientRect(), m = window.raumArmband.aufBild(); return { perlen: window.raumArmband.perlen(), vorschau: window.raumArmband.vorschau(), x: Math.round(m.x), y: Math.round(m.y), leiste: l.bottom, feld: Math.round(r.top), feldH: Math.round(r.height), vw: innerWidth, vh: innerHeight }; });
        ok('raum_armband: Perlenwerkstatt legt das geplante Armband als 3D-Kette auf den Esstisch', da && a.perlen === a.vorschau && a.perlen > 0, JSON.stringify(a));
        ok('raum_armband: Armband sichtbar über dem Planungsfeld, Feld ganz im Bild', a.x > 0 && a.x < a.vw && a.y > a.leiste && a.y < a.feld && a.feld + a.feldH <= a.vh + 1 && a.feldH > 300, JSON.stringify(a));
        await p.click('#spielzu'); await p.waitForTimeout(300);
        ok('raum_armband: Zurück räumt das Armband weg', await p.evaluate(() => window.raumArmband.perlen() === 0 && document.getElementById('spielfenster').hidden));
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      // AK-14: Tür in der linken Wand, Wanduhr zeigt die Uhrzeit des Geräts
      {
        const t = await p.evaluate(() => {
          const A = window.raumAusstattung, z = new THREE.Vector3(); A.tuerBlatt.getWorldPosition(z);
          const ray = new THREE.Raycaster(new THREE.Vector3(z.x + 0.5, 1.0, z.z), new THREE.Vector3(-1, 0, 0));
          const treffer = ray.intersectObjects(A.raum.children, true);
          const d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60, u = A.uhr();
          const ab = (x, y) => Math.abs(((x - y) % 360 + 540) % 360 - 180);
          return { tuer: treffer.length > 0 && treffer[0].object === A.tuerBlatt, wandDahinter: treffer.some(x => x.object.material === A.wand && x.distance < 0.8), std: +ab(u.std, h * 30).toFixed(1), min: +ab(u.min, m * 6).toFixed(1), sek: +ab(u.sek, s * 6).toFixed(1) };
        });
        ok('raum_tuer: Tür mit Türblatt in einer Öffnung der linken Wand', t.tuer && !t.wandDahinter, JSON.stringify(t));
        ok('raum_uhr: Wanduhr zeigt die Uhrzeit des Geräts', t.std < 1 && t.min < 1 && t.sek < 7, JSON.stringify(t));
      }
      // AK-8: Schach in 3D auf dem Couchtisch: Bauer e2-e4 antippen, der Computer antwortet, Figuren stehen richtig
      await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Spieltisch').click());
      await p.waitForTimeout(300);
      await p.click('[aria-label="Schach in 3D spielen"]'); await p.waitForTimeout(2500);
      // AK-15: schwarze Figuren wirken schwarz (nicht hellbraun), das Brett steht im Hochformat steil und groß im Bild
      const hell = await p.evaluate(async () => {
        const c = document.getElementById('buehne'), img = new Image(); img.src = c.toDataURL(); await img.decode();
        const k = document.createElement('canvas'); k.width = c.width; k.height = c.height; const x = k.getContext('2d'); x.drawImage(img, 0, 0);
        const f = c.width / c.clientWidth, mittel = felder => Math.round(felder.reduce((s, n) => { const q = window.raumSchach.feldAufBild(n), d = x.getImageData(Math.round(q.x * f), Math.round((q.y - 6) * f), 1, 1).data; return s + 0.2126 * d[0] + 0.7152 * d[1] + 0.0722 * d[2]; }, 0) / felder.length);
        const r = [...'abcdefgh'], a8 = window.raumSchach.feldAufBild('a8'), h8 = window.raumSchach.feldAufBild('h8'), a1 = window.raumSchach.feldAufBild('a1'), h1 = window.raumSchach.feldAufBild('h1');
        return { schwarz: mittel(r.map(b => b + '7')), weiss: mittel(r.map(b => b + '2')), hinten: Math.round(h8.x - a8.x), vorn: Math.round(h1.x - a1.x), breite: innerWidth };
      });
      ok('raum_farben: schwarze Figuren wirken schwarz, weiße hell', hell.schwarz < 45 && hell.weiss > 170, JSON.stringify(hell));
      ok('raum_farben: Brett im Hochformat steil und groß, hintere Kante fast so breit wie die vordere', hell.hinten / hell.vorn > 0.8 && hell.vorn * 8 / 7 > 0.75 * hell.breite, JSON.stringify(hell));
      const tippe = async f => { const q = await p.evaluate(f => window.raumSchach.feldAufBild(f), f); await p.mouse.click(q.x, q.y); await p.waitForTimeout(400); };
      await tippe('e2'); await tippe('e4');
      let antwort = false; try { await p.waitForFunction(() => window.raumSchach.zuege().length === 2 && window.raumSchach.ruhig(), null, { timeout: 30000 }); antwort = true; } catch (e) { /* keine Antwort */ }
      const st = await p.evaluate(() => ({ zuege: window.raumSchach.zuege(), e4: window.raumSchach.figurAuf('e4'), e2: window.raumSchach.figurAuf('e2'), text: document.getElementById('schachstatus').textContent }));
      ok('raum_schach: Zug e2-e4 per Antippen, der Computer antwortet', antwort && st.zuege[0] === 'e4' && st.e4 === 'wp' && !st.e2 && st.text === 'Du bist dran (Weiß)', JSON.stringify(st));
      const sl = await p.locator('#schachzu').boundingBox();
      ok('raum_schach: Taste "Zurück in den Raum" mindestens 44 px', sl && sl.height >= 44 && sl.y >= 0, JSON.stringify(sl));
      await p.click('#schachzu'); await p.waitForTimeout(300);
      ok('raum_schach: Zurück bringt die Tafel des Spieltischs, Stellung bleibt stehen', await p.evaluate(() => !document.getElementById('tafel').hidden && document.getElementById('schachleiste').hidden && window.raumSchach.figurAuf('e4') === 'wp'));
      await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      // AK-9: Vier gewinnt, Tic Tac Toe und Reversi in 3D: ein Zug per Antippen, der Computer antwortet
      for (const [name, feld, erwartet] of [['Vier gewinnt in 3D', 24, 3], ['Tic Tac Toe in 3D', 4, 4], ['Reversi in 3D', 19, 19]]) {
        await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Spieltisch').click());
        await p.waitForTimeout(300);
        await p.click(`[aria-label="${name} spielen"]`); await p.waitForTimeout(2500);
        const q = await p.evaluate(f => window.raumTisch.feldAufBild(f), feld);
        await p.mouse.click(q.x, q.y);
        let ant = false; try { await p.waitForFunction(() => window.raumTisch.ruhig() && window.raumTisch.zustand().dran === 0 && window.raumTisch.zustand().c.filter(x => x === 1).length >= 1, null, { timeout: 30000 }); ant = true; } catch (e) { /* keine Antwort */ }
        const zs = await p.evaluate(() => ({ ...window.raumTisch.zustand(), text: document.getElementById('schachstatus').textContent, steine: window.raumTisch.steine() }));
        ok(`raum_tischspiel: ${name}: eigener Stein liegt, der Computer antwortet`, ant && zs.c[erwartet] === 0 && zs.steine === zs.c.filter(x => x !== null).length && zs.text.startsWith('Du bist dran'), JSON.stringify({ c: zs.c.map(x => x === null ? '.' : x).join(''), text: zs.text }));
        await p.click('#schachzu'); await p.waitForTimeout(300);
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      // AK-10: Dame, Mühle und Mangala in 3D: ein Zug per Antippen (Dame: Stein wählen, dann Ziel), der Computer antwortet
      const tippeT = async f => { const q = await p.evaluate(i => window.raumTisch.feldAufBild(i), f); await p.mouse.click(q.x, q.y); await p.waitForTimeout(400); };
      for (const [name, felder, pruefe] of [['Dame in 3D', [44, 36], c => c[36] === 0 && c[44] === null], ['Mühle in 3D', [0], c => c[0] === 0 && c.filter(x => x === 1).length === 1], ['Mangala in 3D', [5], c => c[5] === 0 && c[6] >= 1]]) {
        await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Spieltisch').click());
        await p.waitForTimeout(300);
        await p.click(`[aria-label="${name} spielen"]`); await p.waitForTimeout(2500);
        for (const f of felder) await tippeT(f);
        let ant = false; try { await p.waitForFunction(() => window.raumTisch.ruhig() && window.raumTisch.zustand().dran === 0 && window.raumTisch.zahl() >= 2, null, { timeout: 60000 }); ant = true; } catch (e) { /* keine Antwort */ }
        const zs = await p.evaluate(() => ({ ...window.raumTisch.zustand(), text: document.getElementById('schachstatus').textContent }));
        ok(`raum_tischspiel: ${name}: eigener Zug steht, der Computer antwortet`, ant && pruefe(zs.c) && zs.text.startsWith('Du bist dran'), JSON.stringify({ c: zs.c.map(x => x === null ? '.' : x).join(','), text: zs.text }));
        await p.click('#schachzu'); await p.waitForTimeout(300);
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      // AK-11: Tavla in 3D: Tippen würfelt, Steine ziehen per Antippen, der Computer würfelt und zieht selbst
      {
        await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Spieltisch').click());
        await p.waitForTimeout(300);
        await p.click('[aria-label="Tavla in 3D spielen"]'); await p.waitForTimeout(2500);
        await tippeT(12);
        await p.waitForFunction(() => window.raumTisch.ruhig(), null, { timeout: 10000 });
        const gewuerfelt = await p.evaluate(() => document.getElementById('schachstatus').textContent);
        for (let k = 0; k < 4; k++) {
          await p.waitForFunction(() => window.raumTisch.ruhig() || window.raumTisch.zustand().dran === 1, null, { timeout: 10000 });
          const zg = await p.evaluate(() => window.raumTisch.zustand().dran === 0 && window.raumTisch.zuege());
          if (!zg || !zg.length || zg[0].id === 'wurf') break;
          await tippeT(zg[0].von); await tippeT(zg[0].id);
          await p.waitForFunction(() => window.raumTisch.ruhig() || window.raumTisch.zustand().dran === 1, null, { timeout: 10000 });
        }
        let ant = false; try { await p.waitForFunction(() => window.raumTisch.ruhig() && window.raumTisch.zustand().dran === 0 && window.raumTisch.zahl() >= 3, null, { timeout: 60000 }); ant = true; } catch (e) { /* keine Antwort */ }
        const zs = await p.evaluate(() => ({ ...window.raumTisch.zustand(), text: document.getElementById('schachstatus').textContent, steine: window.raumTisch.steine() }));
        const weiss = zs.c.slice(0, 24).filter(x => x > 0).reduce((a, b) => a + b, 0) + zs.c[24] + zs.c[26], rot = -zs.c.slice(0, 24).filter(x => x < 0).reduce((a, b) => a + b, 0) + zs.c[25] + zs.c[27];
        ok('raum_tavla: Tippen würfelt, dein Zug und der des Computers stehen, 15 : 15 Steine', ant && /Würfel \d/.test(gewuerfelt) && zs.text.startsWith('Du bist dran') && zs.text.includes('Tippen zum Würfeln') && weiss === 15 && rot === 15 && zs.steine === 32,
          JSON.stringify({ gewuerfelt, text: zs.text, c: zs.c.join(','), steine: zs.steine }));
        await p.click('#schachzu'); await p.waitForTimeout(300);
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      // AK-14: Kanten ohne Punktlinien: der Leuchteffekt rendert mit 4-fach Kantenglättung
      ok('raum_kanten: Bild mit Kantenglättung trotz Leuchteffekt', await p.evaluate(() => window.raumAusstattung.kantenglaettung() === 4));
      await p.screenshot({ path: process.env.BILD || '/tmp/raum-seite.png' });
      await p.click('a.ng-zurueck'); await p.waitForTimeout(500);
      ok('raum_zurueck: Zurück-Link führt zur Startseite', new URL(p.url()).pathname === '/');
    }
    if (fname === 'quer') {
      // AK-14: Tür antippen öffnet sie, danach geht es zur Startseite
      await p.evaluate(() => { window.raumAusstattung.weiter = () => { window.__weiter = true; }; });
      const q = await p.evaluate(() => window.raumAusstattung.tuerAufBild());
      await p.mouse.click(q.x, q.y);
      let auf = false; try { await p.waitForFunction(() => window.raumAusstattung.tuerAuf() === 1 && window.__weiter, null, { timeout: 8000 }); auf = true; } catch (e) { /* bleibt zu */ }
      const dreh = await p.evaluate(() => { const v = new THREE.Vector3(); window.raumAusstattung.tuerBlatt.getWorldPosition(v); return { grad: Math.round(window.raumAusstattung.tuerBlatt.parent.rotation.y * 180 / Math.PI), x: +v.x.toFixed(2) }; });
      ok('raum_tuer: Tür antippen öffnet sie und führt zur Startseite', auf && dreh.grad >= 70 && dreh.grad <= 80, JSON.stringify({ q, dreh }));
      await p.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
      ok('raum_tuer: im Verlauf zurück steht die Tür wieder zu', await p.evaluate(() => window.raumAusstattung.tuerAuf() === 0 && window.raumAusstattung.tuerBlatt.parent.rotation.y === 0));
    }
    ok(`raum_laden ${fname}: kein fremder Host`, hosts.size === 0, [...hosts].join());
    ok(`raum_laden ${fname}: keine Seitenfehler`, fe.length === 0, fe.join(' | '));
    await ctx.close();
  }
  // Jede Spiel-Adresse im Raum zeigt auf eine vorhandene Seite
  const html = fs.readFileSync(path.join(wurzel, 'raum/index.html'), 'utf8');
  const adressen = [...html.matchAll(/url: '(\.\.\/[^']+\/)'/g)].map(m => m[1]);
  const fehlend = adressen.filter(u => !fs.existsSync(path.join(wurzel, 'raum', u, 'index.html')));
  ok('raum_adressen: 10 Spiel-Adressen, alle vorhanden', adressen.length === 10 && fehlend.length === 0, `${adressen.length} Adressen, fehlend: ${fehlend.join()}`);
  await b.close(); srv.close(); process.exit(fehler ? 1 : 0);
})();
