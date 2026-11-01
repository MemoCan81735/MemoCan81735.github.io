#!/usr/bin/env python3
"""Gegenproben zu S-W10 (Driftpokal Farbstimmung): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_stimmung.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'driftpokal/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'stimmung_test.js')
FEHLER = [
    ('Schalter aus', 'grade: true, vignette: 0.32', 'grade: false, vignette: 0.32', 's_schalter'),
    ('Strecke ohne grade', '    grade: { tint: "#e8f3ff", sat: 1.06, vignette: 0.32 },\n', '', 's_daten'),
    ('Tönung zu dunkel', 'tint: "#ffedd4", sat: 1.22', 'tint: "#c08040", sat: 1.22', 's_daten'),
    ('Sättigung 1,6', 'tint: "#e4f0ff", sat: 0.92', 'tint: "#e4f0ff", sat: 1.6', 's_daten'),
    ('Vignette 0,7', 'tint: "#eef0e6", sat: 0.9, vignette: 0.36', 'tint: "#eef0e6", sat: 0.9, vignette: 0.7', 's_daten'),
    ('Wetter ohne gültige Tönung', 'grade: { tint: "#dfe6ef", vignette: 0.45, lift: 0.02, sat: 0.62 }', 'grade: { tint: "rot", vignette: 0.45, lift: 0.02, sat: 0.62 }', 's_wetter'),
    ('Herbstwald ohne Wirkung (weiße Tönung)', 'tint: "#ffedd4", sat: 1.22', 'tint: "#ffffff", sat: 1.0', 's_bild'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
fehler = 0
for name, alt, neu, test in FEHLER:
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git'))
        p = os.path.join(kopie, DATEI)
        t = open(p, encoding='utf-8').read()
        n = t.count(alt)
        # herbst und caycuma teilen die Tönung: bei Mehrfachtreffern nur den ersten ersetzen (Herbstwald steht zuerst)
        if n < 1:
            print(f'FEHLER Gegenprobe "{name}" greift nicht ({n} Treffer)'); fehler += 1; continue
        open(p, 'w', encoding='utf-8').write(t.replace(alt, neu, 1))
        r = subprocess.run(['node', TEST, kopie], env={**env, 'NUR': test}, capture_output=True, text=True, timeout=900)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
