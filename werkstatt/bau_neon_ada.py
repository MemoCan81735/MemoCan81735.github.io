#!/usr/bin/env python3
"""Baut neon-ada/index.html aus dem Bau des Spiels (S-W27): Symbol und Manifest, lokales three.js, Zurück-Link im Kartenmenü,
keine Prüfhaken (window.__...), keine Test-Schaltfläche und keine Adressparameter zum Öffnen gesperrter Karten (#schnell, #datum, #look bleiben wirksam). Zwei Zurück-Links: fest oben links und im Kartenmenü. Aufruf: bau_neon_ada.py <dist/index.html> [three.min.js]"""
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
fest = ("position:fixed;left:8px;top:calc(56px + env(safe-area-inset-top));display:inline-flex;align-items:center;justify-content:center;min-height:48px;min-width:48px;max-width:50px;padding:0;"
        "color:var(--text,#ffe97a);background:var(--taste,#1b2260);font:bold 16px monospace;text-decoration:none;border:3px solid currentColor")
# Fester Zurück-Link oben links vor allen Schichten (Menü, Hilfe, Endbild liegen später im Dokument und decken ihn zu)
ersetze('<div id="oben" hidden>', f'<a class="ng-zurueck" id="ngfest" href="../" style="{fest}" aria-label="Alle Spiele" title="Alle Spiele">←</a><div id="oben" hidden>')
ersetze('aria-label="Karten" hidden><h2>Karten</h2>', f'aria-label="Karten" hidden>{link}<h2>Karten</h2>')   # ganz oben, damit er auch im Querformat ohne Scrollen erreichbar ist
ersetze('<button id="testfrei" aria-pressed="false">Test: alle Karten öffnen</button>', '')   # Prüfhilfe gehört nicht auf die Seite
# Prüfhaken: alle Zuweisungen an window.__x werden zu einem lokalen Objekt; die Adressparameter für Prüfläufe bleiben wirkungslos
t = re.sub(r"window\.(__[A-Za-z]+)", r"haken.\1", t)
ersetze("const meldung =", "const haken = {};\nconst meldung =")
ersetze("const karteHash = /karte=(\\d-\\d)/.exec(location.hash);", "const karteHash = null;")   # gesperrte Karten nicht per Adresse startbar
# Spieleraum (S-W29): mit #raum steht die Insel als Modell im Raum (Brücke window.parent.raumModell, siehe raum/index.html)
for alt, neu in [(':root{--taste:#1b2a6b;--text:#ffe27a;--grund:#10163a}', ':root{--taste:#1b2a6b;--text:#ffe27a;--grund:#10163a}\nhtml.imraum,html.imraum body{background:transparent!important}html.imraum #welt{opacity:0}html.imraum #ngfest{display:none!important}html.imraum #anzeige{top:56px}html.imraum #oben{top:104px}'), ('    this.punkte.frustumCulled = false; this.gruppe.add(this.punkte);\n', '    this.punkte.frustumCulled = false; this.gruppe.add(this.punkte);\n    // Im Spieleraum steht die Insel als Modell im Raum: Gruppe dort einsetzen, Bild und Antippen laufen über die Raumkamera\n    this.raum = window.parent !== window && /raum/.test(location.hash) && window.parent.raumModell || null;\n    if (this.raum) this.raum.einsetzen(this.gruppe);\n'), ('v.applyMatrix4(this.gruppe.matrixWorld); v.project(this.kamera);', 'v.applyMatrix4(this.gruppe.matrixWorld); if (this.raum) return this.raum.aufBild(v); v.project(this.kamera);'), ('    this.renderer.render(this.szene, this.kamera);\n', '    if (!this.raum) this.renderer.render(this.szene, this.kamera);\n'), ('    this.ray.setFromCamera({ x: (px / breite) * 2 - 1, y: -(py / hoehe) * 2 + 1 }, this.kamera);\n', '    if (this.raum) this.raum.strahl(this.ray, px, py); else this.ray.setFromCamera({ x: (px / breite) * 2 - 1, y: -(py / hoehe) * 2 + 1 }, this.kamera);\n'), ("  const look = (/look=(a0|a|b|c)/.exec(location.hash) || [0, 'b'])[1];\n", "  const look = (/look=(a0|a|b|c)/.exec(location.hash) || [0, 'b'])[1];\n  const raumModell = window.parent !== window && /raum/.test(location.hash) && window.parent.raumModell || null;\n  // Im Raum zeichnet die Seite des Raums: dessen three.js und Zahlenfelder verwenden, die eigene Fläche nur unsichtbar für Berührungen\n  if (raumModell) { document.documentElement.classList.add('imraum'); window.Float32Array = window.parent.Float32Array; }\n"), ('spiel = erzeuge(canvas, window.THREE, {', 'spiel = erzeuge(canvas, raumModell ? raumModell.THREE : window.THREE, {')]:
    ersetze(alt, neu)
for wort in ("window.__", "cdnjs", "googleapis", "Claude", "Arslan"):
    assert wort not in t, wort
os.makedirs("neon-ada", exist_ok=True)
open("neon-ada/index.html", "w", encoding="utf-8").write(t)
drei = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(quelle)), "..", "lib", "three.min.js")
shutil.copy(drei, "neon-ada/three.min.js")
