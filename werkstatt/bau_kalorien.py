#!/usr/bin/env python3
"""Baut kalorien/index.html aus dem Bau des Kalorien-Trackers (S-W23): vollständiges Gerüst, ohne Google-Schriften und
Artifact-Hinweis, Symbol, Manifest, Zurück-Link und Hinweis, dass Foto-Erkennung und Tipps nur in der Claude-App gehen.
Aufruf: python3 werkstatt/bau_kalorien.py <dist/kalorien-tracker.html>"""
import re, sys
t = open(sys.argv[1], encoding="utf-8").read()
assert t.startswith("<title>Kalorien-Tracker</title>\n"), "unerwarteter Anfang"
# keine fremden Server: Google-Schriften entfernen (die Schriftliste fällt auf Systemschriften zurück)
t, n = re.subn(r'<link rel="(preconnect|stylesheet)" href="https://fonts\.[^"]*"[^>]*>\n', "", t)
assert n == 2, n
for alt in ('<meta name="claude:viewport-fit-sides" content="cover">\n', '<meta name="viewport" content="width=device-width, initial-scale=1">\n'):
    assert t.count(alt) == 1, alt
    t = t.replace(alt, "", 1)
# Anonymität: Kommentare im Code nennen den Auftraggeber beim Namen
t = re.sub(r"\bArslan\b", "Betreiber", t)
kopf, rumpf = t.split("</style>\n", 1)
css = (".ng-leiste{max-width:520px;margin:0 auto;padding:max(8px,env(safe-area-inset-top,0px)) 16px 0;display:grid;gap:6px}\n"
       "a.ng-zurueck{justify-self:start;display:inline-flex;align-items:center;min-height:44px;padding:0 14px;border-radius:999px;"
       "background:var(--flaeche);border:1px solid var(--linie);color:var(--fg);font-weight:700;text-decoration:none}\n"
       "#ng-hinweis{margin:0;font-size:14px;color:var(--leise)}\n</style>\n")
leiste = ('<div class="ng-leiste"><a class="ng-zurueck" href="../">← Spiele</a>'
          '<p id="ng-hinweis">Foto-Erkennung und Tipps gehen nur in der Claude-App. Hier trägst du Essen über die Suche ein. '
          'Alles bleibt auf deinem Gerät.</p></div>\n')
seite = ('<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
         '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
         '<meta name="theme-color" content="#2C6636">\n'
         '<meta name="description" content="Kalorien-Tracker: Mahlzeiten und Sport eintragen, Tagesrichtwert und Woche sehen. Alles bleibt auf deinem Gerät.">\n'
         '<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/kalorien-192.png">\n'
         '<link rel="apple-touch-icon" href="../bilder/symbole/kalorien-192.png">\n'
         '<link rel="manifest" href="manifest.webmanifest">\n'
         + kopf + css + '</head>\n<body>\n' + leiste + rumpf + '</body>\n</html>\n')
for wort in ("fonts.googleapis", "fonts.gstatic", "claude:viewport", "Arslan"):
    assert wort not in seite, wort
open("kalorien/index.html", "w", encoding="utf-8").write(seite)
print("kalorien/index.html", len(seite) // 1024, "KB")
