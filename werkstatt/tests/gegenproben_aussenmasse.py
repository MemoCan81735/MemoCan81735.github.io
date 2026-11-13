#!/usr/bin/env python3
"""Gegenproben zu S-W26 (Driftpokal Außenmaße): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_aussenmasse.py   (NUR=Teil des Namens wählt Gegenproben aus)"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'driftpokal/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'aussenmasse_test.js')
FEHLER = [
    ('Alte Maße (Kreis 5)', 'radius: 6.1, half: 3.1,', 'radius: 5, half: 0,', 's_masse'),
    ('Schwelle zu groß', 'if (e2 >= r * r) continue;', 'if (e2 >= (r + 2) * (r + 2)) continue;', 's_grenzwerte'),
    ('Alte Kreisregel', 'const cp = Geo.capsuleNearest(a.x, a.y, a.heading, a.half, b.x, b.y, b.heading, b.half);', 'const cp = Geo.capsuleNearest(a.x, a.y, a.heading, 0, b.x, b.y, b.heading, 0);', 's_auffahren'),
    ('Kein Rückfall beim Kreuzen', 'const nx = deep ? dx / d : ex / e, ny = deep ? dy / d : ey / e', 'const nx = ex / e, ny = ey / e', 's_quer'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
fehler = 0
for name, alt, neu, test in FEHLER:
    if os.environ.get('NUR') and os.environ['NUR'] not in name:
        continue
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git'))
        p = os.path.join(kopie, DATEI)
        t = open(p, encoding='utf-8').read()
        n = t.count(alt)
        if n != 1:
            print(f'FEHLER Gegenprobe "{name}" greift nicht ({n} Treffer)'); fehler += 1; continue
        open(p, 'w', encoding='utf-8').write(t.replace(alt, neu, 1))
        r = subprocess.run(['node', TEST, kopie], env={**env, 'NUR': test}, capture_output=True, text=True, timeout=900)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
