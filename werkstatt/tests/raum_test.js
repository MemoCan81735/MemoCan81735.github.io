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
      for (const name of ['Spieltisch', 'Inselmodell', 'Staffelei', 'Perlenkästchen']) {
        await p.evaluate(n => [...document.querySelectorAll('.marke')].find(m => m.textContent === n).click(), name);
        await p.waitForTimeout(300);
        await p.click(name === 'Spieltisch' ? '[aria-label="Brettspiele spielen"]' : '#tafelliste .spielen');
        let r = null; try { await p.waitForFunction(() => { const f = document.getElementById('spielfenster'); return f.classList.contains('tv') && !f.classList.contains('unterwegs'); }, null, { timeout: 15000 }); r = await p.evaluate(() => { const b = document.getElementById('spielrahmen').getBoundingClientRect(), l = document.querySelector('.leiste').getBoundingClientRect(); return { x: Math.round(b.left), y: Math.round(b.top), b: Math.round(b.width), h: Math.round(b.height), unter: l.bottom, vw: innerWidth, vh: innerHeight }; }); } catch (e) { /* nicht angekommen */ }
        ok(`raum_flaeche: ${name} zeigt das Spiel auf seiner Fläche, ganz im Bild`, !!r && r.x >= 0 && r.x + r.b <= r.vw + 1 && r.y >= r.unter && r.y + r.h <= r.vh && r.b > 200 && r.h > 120, JSON.stringify(r));
        await p.click('#spielzu'); await p.waitForTimeout(300);
        await p.keyboard.press('Escape'); await p.waitForTimeout(200);
      }
      // AK-8: Schach in 3D auf dem Couchtisch: Bauer e2-e4 antippen, der Computer antwortet, Figuren stehen richtig
      await p.evaluate(() => [...document.querySelectorAll('.marke')].find(m => m.textContent === 'Spieltisch').click());
      await p.waitForTimeout(300);
      await p.click('[aria-label="Schach in 3D spielen"]'); await p.waitForTimeout(2500);
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
      await p.screenshot({ path: process.env.BILD || '/tmp/raum-seite.png' });
      await p.click('a.ng-zurueck'); await p.waitForTimeout(500);
      ok('raum_zurueck: Zurück-Link führt zur Startseite', new URL(p.url()).pathname === '/');
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
