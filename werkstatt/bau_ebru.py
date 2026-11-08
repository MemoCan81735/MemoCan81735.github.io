#!/usr/bin/env python3
"""Baut ebru/index.html aus dem Bau der App (S-W18; seit S-W21 Ebru 2.0, build/ebru2.html): Symbol, Manifest, Zurück-Link, Titel "Ebru",
Verweis für Geräte ohne WebGL 2 auf die klassische Fassung unter ebru-klassisch/. Aufruf: python3 werkstatt/bau_ebru.py <build/ebru2.html>"""
import sys
t = open(sys.argv[1], encoding="utf-8").read()
alt = '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">'
assert t.count(alt) == 1 and t.startswith('<!doctype html>')
t = t.replace(alt, alt + '\n<meta name="theme-color" content="#2a2430">\n<meta name="description" content="Ebru: türkische Marmorierkunst auf Wasser malen, direkt im Browser.">'
              '\n<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/ebru-192.png">\n<link rel="apple-touch-icon" href="../bilder/symbole/ebru-192.png">'
              '\n<link rel="manifest" href="manifest.webmanifest">', 1)
css = 'a.ng-zurueck{position:absolute;right:8px;top:8px;z-index:2;display:inline-flex;align-items:center;min-height:44px;padding:0 12px;border-radius:12px;background:rgba(29,24,34,.82);color:#f6efe6;font:600 13px system-ui,sans-serif;text-decoration:none}\nbody.ergebnis a.ng-zurueck{display:none}\n</style>'
assert 0 < t.find('</style>') < t.find('</head>')  # erster Stilblock im Kopf (Ebru 2.0 enthält PixiJS mit weiteren '</style>' im Code)
t = t.replace('</style>', css, 1)
alt = '<button id="musterwahl" class="schild malen">'
assert t.count(alt) == 1
t = t.replace(alt, '<a class="ng-zurueck" href="../">← Spiele</a>' + alt, 1)
if '<title>Ebru 2.0</title>' in t:  # S-W21: Ebru 2.0 heißt auf der Seite einfach Ebru; ohne WebGL 2 geht es zur klassischen Fassung
    t = t.replace('<title>Ebru 2.0</title>', '<title>Ebru</title>', 1)
    alt = '<a href="https://memocan81735.github.io/ebru/">Ebru 1 öffnen</a>'
    assert t.count(alt) == 1
    t = t.replace(alt, '<a href="../ebru-klassisch/">Ebru klassisch öffnen</a>', 1)
for wort in ('Claude testet', 'Fassung'):
    assert wort not in t, wort
open('ebru/index.html', 'w', encoding="utf-8").write(t)
print('ebru/index.html', len(t) // 1024, 'KB')
