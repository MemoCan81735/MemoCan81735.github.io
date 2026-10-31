// Gemeinsamer Baustein "Teilen" für alle Spiele (S-W04). Kein Server, keine persönlichen Daten.
// Text = Teile mit " · ", Leerzeile, Link der Seite ohne Suchteil und Anker.
// Weg: Teilen-Auswahl des Handys, sonst Zwischenablage, sonst Fenster mit dem Text zum Markieren.
(function () {
  'use strict';
  const MAX = 200;

  function link() { return location.origin + location.pathname; }

  function text(teile, ziel) {
    let t = teile.filter((x) => x !== undefined && x !== null && String(x).trim() !== '').map(String).join(' · ');
    if (t.length > MAX) t = t.slice(0, MAX - 1).trimEnd() + '…';
    return t + '\n\n' + (ziel || link());
  }

  function stil() {
    if (document.getElementById('teilen-stil')) return;
    const s = document.createElement('style'); s.id = 'teilen-stil';
    s.textContent = '.teilen-hinweis{position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:10000;background:#16202b;color:#f6f1e6;padding:10px 16px;border-radius:10px;font:600 15px system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35);pointer-events:none}'
      + '.teilen-fenster{position:fixed;inset:0;z-index:10001;display:grid;place-items:center;background:rgba(0,0,0,.55);padding:16px}'
      + '.teilen-fenster>div{width:min(360px,100%);background:#f6f1e6;color:#16202b;border-radius:12px;padding:16px;display:grid;gap:10px;font:15px system-ui,sans-serif}'
      + '.teilen-fenster textarea{width:100%;box-sizing:border-box;min-height:110px;font:14px system-ui,sans-serif;border:1px solid #aab;border-radius:8px;padding:8px;resize:none}'
      + '.teilen-fenster button{border:0;border-radius:10px;padding:10px;font:600 15px system-ui,sans-serif;background:#16202b;color:#f6f1e6}';
    document.head.appendChild(s);
  }

  function hinweis(t) {
    stil();
    const alt = document.querySelector('.teilen-hinweis'); if (alt) alt.remove();
    const h = document.createElement('div'); h.className = 'teilen-hinweis'; h.setAttribute('role', 'status'); h.textContent = t;
    document.body.appendChild(h); setTimeout(() => h.remove(), 2000);
  }

  function fenster(t) {
    stil();
    const alt = document.querySelector('.teilen-fenster'); if (alt) alt.remove();
    const f = document.createElement('div'); f.className = 'teilen-fenster'; f.setAttribute('role', 'dialog'); f.setAttribute('aria-label', 'Text zum Teilen');
    f.innerHTML = '<div><strong>Zum Teilen markieren und kopieren</strong><textarea readonly></textarea><button type="button">Schließen</button></div>';
    f.querySelector('textarea').value = t;
    f.querySelector('button').addEventListener('click', () => f.remove());
    document.body.appendChild(f);
    const ta = f.querySelector('textarea'); try { ta.focus(); ta.select(); } catch (e) { }
  }

  let laeuft = false;
  async function teilen(daten) {
    if (laeuft) return 'laeuft';
    laeuft = true;
    try {
      if (navigator.share) {
        try { await navigator.share({ title: daten.titel, text: daten.text }); return 'geteilt'; }
        catch (e) { if (e && e.name === 'AbortError') return 'abgebrochen'; }
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(daten.text); hinweis('Text kopiert'); return 'kopiert'; }
      } catch (e) { }
      fenster(daten.text); return 'angezeigt';
    } finally { laeuft = false; }
  }

  window.Teilen = { text, teilen, link, MAX };
})();
