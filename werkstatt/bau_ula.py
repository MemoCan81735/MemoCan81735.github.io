#!/usr/bin/env python3
"""Baut ula/index.html aus dem Bau des Crash-Derbys (S-W20): Symbol und Manifest, keine Google-Schriften, lokales three.js,
keine Prüfhaken, Zurück-Link im Titelbild. Aufruf: bau_ula.py <dist/demolition-arena.html>"""
import os, re, shutil, sys
t = open(sys.argv[1], encoding="utf-8").read()


def ersetze(alt, neu, anzahl=1):
    global t
    assert t.count(alt) == anzahl, alt
    t = t.replace(alt, neu)


t, n = re.subn(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">\n', "", t)
assert n == 1, "Google-Schrift nicht gefunden"
ersetze('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
        '<meta name="theme-color" content="#0b0a10">\n<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/ula-192.png">\n'
        '<link rel="apple-touch-icon" href="../bilder/symbole/ula-192.png">\n<link rel="manifest" href="manifest.webmanifest">\n<script src="three.min.js"></script>')
ersetze('window.__dm = {', 'const __haken = {')  # Prüfhaken nur noch lokal
ersetze('Object.assign(window.__dm,', 'Object.assign(__haken,', 3)
stil = ("display:inline-flex;align-self:flex-start;width:max-content;align-items:center;min-height:44px;padding:0 14px;margin:0 0 6px;border-radius:10px;"
        "border:1px solid var(--line);color:var(--bone);font:600 15px system-ui,sans-serif;text-decoration:none")
# Zurück-Link steht fest im HTML (in einer Vorlage, damit er nur im Titelbild erscheint) und wird dort eingesetzt
ersetze('<body>', f'<body>\n<template id="ngZurueck"><a class="ng-zurueck" href="../" style="{stil}">← Alle Spiele</a></template>')
ersetze('"<h1>Ula<br>Çarpsana!</h1>', 'document.getElementById("ngZurueck").innerHTML + "<h1>Ula<br>Çarpsana!</h1>')
for wort in ("__dm", "googleapis", "gstatic", "cdnjs", "Claude"):
    assert wort not in t, wort
os.makedirs("ula", exist_ok=True)
open("ula/index.html", "w", encoding="utf-8").write(t)
shutil.copy(os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), "three.min.js"), "ula/three.min.js")
