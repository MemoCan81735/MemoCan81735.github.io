#!/usr/bin/env python3
"""Baut neon-ada/index.html aus dem Bau des Spiels (S-W27): Symbol und Manifest, lokales three.js, Zurück-Link im Kartenmenü,
keine Prüfhaken (window.__...) und keine Test-Adressparameter. Zwei Zurück-Links: fest oben links und im Kartenmenü. Aufruf: bau_neon_ada.py <dist/index.html> [three.min.js]"""
import os, re, shutil, sys
quelle = sys.argv[1]
t = open(quelle, encoding="utf-8").read()


def ersetze(alt, neu, anzahl=1):
    global t
    assert t.count(alt) == anzahl, (anzahl, t.count(alt), alt)
    t = t.replace(alt, neu)


ersetze('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>',
        '<script src="three.min.js"></script>')
ersetze('<title>Neon Ada</title>',
        '<title>Neon Ada</title>\n<meta name="theme-color" content="#0d1026">\n<link rel="icon" type="image/png" sizes="192x192" href="../bilder/symbole/neon-ada-192.png">\n'
        '<link rel="apple-touch-icon" href="../bilder/symbole/neon-ada-192.png">\n<link rel="manifest" href="manifest.webmanifest">')
# Zurück-Link: im Kartenmenü ganz oben; gleiche Größe wie die Tasten, mindestens 44 px
stil = ("display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 14px;margin-top:44px;color:inherit;"
        "font:bold 16px monospace;text-decoration:none;border:3px solid currentColor")
link = f'<a class="ng-zurueck" href="../" style="{stil}">← Alle Spiele</a>'
fest = ("position:fixed;left:8px;top:calc(56px + env(safe-area-inset-top));display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 8px;"
        "color:var(--text,#ffe97a);background:var(--taste,#1b2260);font:bold 16px monospace;text-decoration:none;border:3px solid currentColor")
# Fester Zurück-Link oben links vor allen Schichten (Menü, Hilfe, Endbild liegen später im Dokument und decken ihn zu)
ersetze('<div id="oben" hidden>', f'<a class="ng-zurueck" id="ngfest" href="../" style="{fest}">← Spiele</a><div id="oben" hidden>')
ersetze('aria-label="Karten" hidden><h2>Karten</h2>', f'aria-label="Karten" hidden>{link}<h2>Karten</h2>')   # ganz oben, damit er auch im Querformat ohne Scrollen erreichbar ist
# Prüfhaken: alle Zuweisungen an window.__x werden zu einem lokalen Objekt; die Adressparameter für Prüfläufe bleiben wirkungslos
t = re.sub(r"window\.(__[A-Za-z]+)", r"haken.\1", t)
ersetze("const meldung =", "const haken = {};\nconst meldung =")
ersetze("const karteHash = /karte=(\\d-\\d)/.exec(location.hash);", "const karteHash = null;")   # gesperrte Karten nicht per Adresse startbar
for wort in ("window.__", "cdnjs", "googleapis", "Claude", "Arslan"):
    assert wort not in t, wort
os.makedirs("neon-ada", exist_ok=True)
open("neon-ada/index.html", "w", encoding="utf-8").write(t)
drei = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(quelle)), "..", "lib", "three.min.js")
shutil.copy(drei, "neon-ada/three.min.js")
