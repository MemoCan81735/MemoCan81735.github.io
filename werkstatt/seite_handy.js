// Prüfung am Handyformat (Spec werkstatt/specs/S-W01), mit Playwright und Chromium.
// Aufruf: node werkstatt/seite_handy.js [ORDNER]   (Standard: Repo-Wurzel)
// Startet einen lokalen Server, lädt jede Seite bei 412x915 und 915x412 und prüft D1 bis D8.
// Rückgabewert 0 nur, wenn alles grün ist.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const ordner = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const PORT = 8000 + Math.floor(Math.random() * 900);
const BASIS = `http://127.0.0.1:${PORT}`;
const SEITEN = ['/', '/driftpokal/', '/luftdrift/', '/etappenrennen/', '/ebru/', '/brettspiele/'];
const FORMATE = [['hoch', { width: 412, height: 915 }], ['quer', { width: 915, height: 412 }]];
const FACHSPRACHE = /\b(BCE|Entity|Boundary|Fassung)\b/i;

const fehler = [];
const melde = (pruefung, ok, text) => {
  console.log((ok ? 'OK     ' : 'FEHLER ') + pruefung + (text ? '  ' + text : ''));
  if (!ok) fehler.push(pruefung + ' ' + text);
};

(async () => {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ordner, stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 800));
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  try {
    for (const seite of SEITEN) {
      for (const [fname, vp] of FORMATE) {
        const name = `${seite} ${fname}`;
        const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
        const p = await ctx.newPage();
        p.setDefaultTimeout(60000);
        const fehlerSkript = [], fremd = [];
        p.on('pageerror', e => fehlerSkript.push(e.message.slice(0, 120)));
        p.on('request', r => { if (!r.url().startsWith(BASIS) && !/^(data|blob):/.test(r.url())) fremd.push(r.url().slice(0, 100)); });
        await p.goto(BASIS + seite, { waitUntil: 'load' });
        await p.waitForTimeout(2500);

        melde('D1_keine_skriptfehler', fehlerSkript.length === 0, `${name} ${fehlerSkript.join(' | ')}`);
        melde('D2_keine_fremden_anfragen', fremd.length === 0, `${name} ${[...new Set(fremd)].join(' ')}`);
        const m = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
        melde('D3_kein_querscroll', m.sw <= m.iw, `${name} scrollWidth ${m.sw} / ${m.iw}`);
        const text = await p.evaluate(() => document.title + ' ' + document.body.innerText);
        const treffer = text.match(FACHSPRACHE);
        melde('D8_keine_fachsprache', !treffer, `${name} ${treffer ? treffer[0] : ''}`);

        if (seite !== '/') {
          const link = p.locator('a.ng-zurueck');
          const anzahl = await link.count();
          let ok = false, info = 'fehlt';
          if (anzahl > 0) {
            const box = await link.first().boundingBox();
            const sichtbar = await link.first().isVisible();
            ok = sichtbar && box && box.height >= 32 && box.x >= 0 && box.x + box.width <= vp.width + 0.5;
            info = box ? `sichtbar=${sichtbar} h=${box.height.toFixed(0)} x=${box.x.toFixed(0)}..${(box.x + box.width).toFixed(0)}` : 'unsichtbar';
            if (ok) {
              await Promise.all([p.waitForURL(BASIS + '/', { timeout: 60000 }).catch(() => { }), link.first().evaluate(a => a.click())]);
              const ziel = new URL(p.url()).pathname;
              ok = ziel === '/' || ziel === '/index.html';
              info += ` -> ${ziel}`;
              await p.goto(BASIS + seite, { waitUntil: 'load' });
              await p.waitForTimeout(1500);
            }
          }
          melde('D4_zurueck_sichtbar', ok, `${name} ${info}`);
        }

        if (seite === '/brettspiele/' && fname === 'hoch') {
          const reiter = await p.$$eval('.tabBtn', bs => bs.map(b => { const r = b.getBoundingClientRect(); const e = b.parentElement.getBoundingClientRect(); return { t: b.textContent, l: r.left, r: r.right, el: e.left, er: e.right }; }));
          const raus = reiter.filter(x => x.l < 0 || x.r > innerWidthOf(vp) + 0.5 || x.l < x.el - 0.5 || x.r > x.er + 0.5);
          melde('D5_reiter_sichtbar', reiter.length === 7 && raus.length === 0, `${reiter.length} Reiter, abgeschnitten: ${raus.map(x => x.t).join(', ')}`);
          const ungestaltet = [];
          for (const tab of ['tictactoe', 'connect4', 'othello', 'muehle', 'chess', 'mangala']) {
            await p.evaluate(t => document.querySelector(`.tabBtn[data-tab="${t}"]`).click(), tab);
            await p.waitForTimeout(200);
            const r = await p.evaluate(t => {
              const view = document.getElementById(t + '-view');
              const inp = [...view.querySelectorAll('input[type=radio]')].filter(i => i.offsetParent !== null || i.closest('label').offsetParent !== null);
              return inp.map(i => ({ op: getComputedStyle(i).opacity, pad: parseFloat(getComputedStyle(i.closest('label')).paddingLeft) }));
            }, tab);
            if (r.length === 0 || r.some(x => x.op !== '0' || x.pad < 5)) ungestaltet.push(tab);
          }
          melde('D5b_spielart_gestaltet', ungestaltet.length === 0, `ungestaltet: ${ungestaltet.join(', ')}`);
        }
        if (seite === '/driftpokal/') {
          const sichtbar = await p.locator('#btnLan').isVisible();
          melde('D6_kein_zu_zweit_im_browser', !sichtbar, `${name} sichtbar=${sichtbar}`);
        }
        if (seite === '/luftdrift/') {
          const hat = await p.evaluate(() => /Flughilfe/.test(document.body.textContent));
          melde('D7_luftdrift_flughilfe', hat, name);
        }
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(fehler.length ? `\n${fehler.length} Prüfung(en) rot.` : '\nAlles grün.');
  process.exit(fehler.length ? 1 : 0);
})();

function innerWidthOf(vp) { return vp.width; }
