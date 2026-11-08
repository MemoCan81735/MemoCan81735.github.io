#!/usr/bin/env python3
"""Baut perlen/index.html aus dem Bau der Perlenwerkstatt (S-W19): vollständiges Gerüst, ohne Google-Schriften,
Symbol, Manifest, Zurück-Link statt Untertitel. Aufruf: python3 werkstatt/bau_perlen.py <build/perlenwerkstatt.html>"""
import re, sys
t = open(sys.argv[1], encoding="utf-8").read()
assert t.startswith("<title>Perlenwerkstatt</title>"), "unerwarteter Anfang"
# keine fremden Server: Google-Schriften und Artifact-Hinweis entfernen (Schrift fällt auf Systemschrift zurück)
t, n = re.subn(r'<link rel="(preconnect|stylesheet)" href="https://fonts\.[^"]*"[^>]*>\n', "", t)
assert n == 2, n
t = t.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "", 1)
kopf, rumpf = t.split('<div id="app"></div>', 1)
alt = "el('span', { class: 'unter' }, 'Schmuck planen')"
assert rumpf.count(alt) == 1
# Zurück-Link steht fest im HTML (Seitenprüfung S4) und wird beim Aufbau in den Kopf der App verschoben
rumpf = rumpf.replace(alt, "document.querySelector('a.ng-zurueck')", 1)
css = ("a.ng-zurueck{display:inline-flex;align-items:center;min-height:44px;padding:0 12px;border-radius:12px;"
       "background:var(--flaeche);border:1px solid var(--linie);color:var(--tinte);font-weight:700;text-decoration:none}\n"
       ":root{padding-top:env(safe-area-inset-top,0px)}\nbody{margin:0}\n</style>")
assert kopf.count("</style>") == 1
kopf = kopf.replace("</style>", css, 1)
seite = ('<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n'
         '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
         '<meta name="theme-color" content="#2b3446">\n'
         '<meta name="description" content="Perlenschmuck planen (Armband, Kette, Fußkettchen, Ohrringe): Ideen, Vorschau, Einkaufsliste und Anleitung, direkt im Browser.">\n'
         '<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/perlen-192.png">\n'
         '<link rel="apple-touch-icon" href="../bilder/symbole/perlen-192.png">\n'
         '<link rel="manifest" href="manifest.webmanifest">\n'
         + kopf + '</head>\n<body>\n<a class="ng-zurueck" href="../">← Spiele</a>\n<div id="app"></div>' + rumpf + '</body>\n</html>\n')
for wort in ("fonts.googleapis", "fonts.gstatic", "Fassung"):
    assert wort not in seite, wort
open("perlen/index.html", "w", encoding="utf-8").write(seite)
print("perlen/index.html", len(seite) // 1024, "KB")
