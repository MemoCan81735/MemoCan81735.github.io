#!/usr/bin/env python3
"""Baut driftpokal-v2/index.html aus dem Bau von Driftpokal v2 (S-W28): Symbol und Manifest, Prüfung auf fremde Adressen,
Prüfhaken, Namen. Der Zurück-Link ("Alle Spiele", a.ng-zurueck) steckt schon im Spiel. Aufruf: bau_driftpokal_v2.py <dist/driftpokal-v2.html>"""
import os, re, sys
t = open(sys.argv[1], encoding="utf-8").read()


def ersetze(alt, neu):
    global t
    assert t.count(alt) == 1, (t.count(alt), alt)
    t = t.replace(alt, neu)


ersetze('<title>Driftpokal v2</title>',
        '<title>Driftpokal v2</title>\n<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/driftpokal-v2-192.png">\n'
        '<link rel="apple-touch-icon" href="../bilder/symbole/driftpokal-v2-192.png">\n<link rel="manifest" href="manifest.webmanifest">')
# Zweiter Zurück-Link ganz oben im Titelbild: der untere (im Spiel) liegt im Querformat unter dem Bildrand
ersetze('<div class="checker" aria-hidden="true"></div>\n      <h1 class="brand display">',
        '<a class="btn ng-zurueck" href="../" style="margin-bottom:8px">← Alle Spiele</a>\n      <div class="checker" aria-hidden="true"></div>\n      <h1 class="brand display">')
assert re.search(r'<a\b[^>]*class="[^"]*\bng-zurueck\b[^"]*"[^>]*href="\.\./"', t), "Zurück-Link fehlt"
for wort in ("cdnjs", "googleapis", "Claude", "Arslan", "unpkg", "jsdelivr"):
    assert wort not in t, wort
# keine eigenen Prüfhaken: window.__THREE__ gehört zur mitgelieferten Grafikbibliothek, alles andere wäre ein Prüfhaken im Spiel
for m in re.finditer(r"window\.(__[A-Za-z_]+)", t):
    if m.group(1) != "__THREE__":
        raise SystemExit("Prüfhaken im Spiel: " + m.group(1))
os.makedirs("driftpokal-v2", exist_ok=True)
open("driftpokal-v2/index.html", "w", encoding="utf-8").write(t)
open("driftpokal-v2/manifest.webmanifest", "w", encoding="utf-8").write('''{
 "name": "Driftpokal v2",
 "short_name": "Driftpokal v2",
 "start_url": "./",
 "scope": "./",
 "display": "standalone",
 "background_color": "#0f1420",
 "theme_color": "#0f1320",
 "icons": [
  {
   "src": "../bilder/symbole/driftpokal-v2-192.png",
   "sizes": "192x192",
   "type": "image/png"
  },
  {
   "src": "../bilder/symbole/driftpokal-v2-512.png",
   "sizes": "512x512",
   "type": "image/png"
  }
 ]
}
''')
