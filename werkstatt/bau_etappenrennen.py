#!/usr/bin/env python3
"""Baut etappenrennen/index.html aus dem Prototyp (S-W17, S-W18): Grundgerüst, lokales three.js, keine Prüfhaken,
Sofortstart wie im Prototyp, Zurück-Link im Infostreifen und im Menü. Aufruf: bau_etappenrennen.py <Prototyp-Datei>"""
import shutil, sys
quelle = sys.argv[1]
t = open(quelle, encoding="utf-8").read()


def ersetze(alt, neu):
    global t
    assert t.count(alt) == 1, alt
    t = t.replace(alt, neu, 1)


kopf = ('<!doctype html>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="theme-color" content="#d8b11a">\n<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/etappenrennen-192.png">\n'
        '<link rel="apple-touch-icon" href="../bilder/symbole/etappenrennen-192.png">\n<link rel="manifest" href="manifest.webmanifest">\n')
t = kopf + t
ersetze('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js', 'three.min.js')
i = t.index('// Prüfhaken für automatische Tests')
j = t.index('Z})}};', i) + len('Z})}};')
t = t[:i] + t[j:]
ersetze('<div class="zeile"><label for="eAuto">Autopilot (Claude testet)</label><input type="checkbox" id="eAuto"></div>',
        '<div class="zeile" hidden><label for="eAuto">Autopilot</label><input type="checkbox" id="eAuto"></div>')
stil = 'display:inline-flex;align-items:center;min-height:44px;color:inherit;font:600 14px system-ui,sans-serif;text-decoration:none'
# Zurück-Link im Infostreifen: während des Rennens sichtbar (erster Zurück-Link im Dokument)
ersetze('<div id="info"><span id="hInfo">', f'<div id="info"><a class="ng-zurueck" href="../" style="{stil};flex:none">← Spiele</a><span id="hInfo">')
ersetze('<h1>Kleine Rundfahrt</h1>', f'<a class="ng-menue-zurueck" href="../" style="{stil}">← Alle Spiele</a><h1>Kleine Rundfahrt</h1>')
ersetze('tourLaden();tourAnzeige();starten();', 'tourLaden();tourAnzeige();starten();')  # Sofortstart bleibt (A-1)
assert '__proto' not in t and 'cdnjs' not in t and 'Claude' not in t
open('etappenrennen/index.html', 'w', encoding="utf-8").write(t)
shutil.copy('/mnt/project-files/spiele/etappenrennen/test/three.r128.min.js', 'etappenrennen/three.min.js')
