#!/usr/bin/env python3
"""Baut etappenrennen/index.html aus dem Prototyp (S-W15): Grundgerüst, lokales three.js, keine Prüfhaken, Zurück-Link."""
import re, shutil, sys
quelle = sys.argv[1]
t = open(quelle, encoding="utf-8").read()
kopf = ('<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="theme-color" content="#d8b11a">\n<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/etappenrennen-192.png">\n'
        '<link rel="apple-touch-icon" href="../bilder/symbole/etappenrennen-192.png">\n<link rel="manifest" href="manifest.webmanifest">\n')
t = kopf + t
t = t.replace('<title>Alpenetappe</title>', '<title>Alpenetappe</title>', 1)
t = t.replace('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'three.min.js')
i = t.index('// Prüfhaken für automatische Tests')
j = t.index('Z})}};', i) + len('Z})}};')
t = t[:i] + t[j:]
t = t.replace('<div class="zeile"><label for="eAuto">Autopilot (Claude testet)</label><input type="checkbox" id="eAuto"></div>',
              '<div class="zeile" hidden><label for="eAuto">Autopilot</label><input type="checkbox" id="eAuto"></div>', 1)
t = t.replace('<h1>Alpenetappe</h1>', '<a class="ng-zurueck" href="../" style="display:inline-flex;align-items:center;min-height:44px;color:inherit;font:600 14px system-ui,sans-serif;text-decoration:none">← Alle Spiele</a><h1>Alpenetappe</h1>', 1)
# Öffentliche Seite beginnt im Startmenü: erst ein Bild zeichnen lassen, dann Menü öffnen
alt = 'tourLaden();tourAnzeige();starten();'
assert alt in t
t = t.replace(alt, 'tourLaden();tourAnzeige();starten();requestAnimationFrame(()=>requestAnimationFrame(()=>$(\'menue\').click()));', 1)
assert '__proto' not in t and 'cdnjs' not in t and 'Claude' not in t
open('etappenrennen/index.html', 'w', encoding="utf-8").write(t)
shutil.copy('/mnt/project-files/spiele/etappenrennen/test/three.r128.min.js', 'etappenrennen/three.min.js')
