#!/usr/bin/env python3
"""Gegenproben zu S-W16 (Säulen und großes Schild an den Wahrzeichen): baut je einen absichtlichen Fehler
in eine Kopie der Seite ein und erwartet, dass der Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_saeulen.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
JS = os.path.join(WURZEL, 'werkstatt', 'tests', 'saeulen_test.js')
SEITE = 'driftpokal/index.html'
FEHLER = [
    ('Säule fehlt', SEITE, 'this.beacons.push(saeule);', '', JS, 's16_saeulen_einbau'),
    ('Säule steht in der Luft', SEITE, 'saeule.position.set(lm.x, h + hoehe / 2, lm.y);', 'saeule.position.set(lm.x, h + hoehe / 2 + 20, lm.y);', JS, 's16_saeulen_hoehe'),
    ('Säule endet unter dem Schild', SEITE, 'const hoehe = Math.max(1, oben - h);', 'const hoehe = Math.max(1, oben - h - 15);', JS, 's16_saeulen_hoehe'),
    ('Säule ohne Ausblenden', SEITE, 'b.visible = l.sprite.visible; b.material.opacity = 0.85 * l.sprite.material.opacity;', 'b.visible = true; b.material.opacity = 0.85;', JS, 's16_saeulen_alpha'),
    ('Schild ohne Höchstgrenze', SEITE, 'return h + Math.min(Number.isFinite(top) ? top - h + 20 : 60, 60);', 'return h + (Number.isFinite(top) ? top - h + 20 : 60);', JS, 's16_schild_hoehe'),
    ('Schild wieder nach Typhöhe', SEITE, 'const oben = TrackSceneUI.labelLift(h, top);', 'const oben = h + 46 * (lm.s || 1) + 6;', JS, 's16_schild_hoehe'),
    ('Schild wieder klein', SEITE, 'sprite.scale.set(150, 150 * 96 / 512, 1);', 'sprite.scale.set(96, 96 * 96 / 512, 1);', JS, 's16_schild_gross'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
fehler = 0
for name, datei, alt, neu, test_datei, test in FEHLER:
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git', '__pycache__'))
        pfad = os.path.join(kopie, datei)
        text = open(pfad, encoding='utf-8').read()
        if text.count(alt) != 1:
            print(f'FEHLER Gegenprobe "{name}": Ersetzungsstelle {text.count(alt)}x gefunden'); fehler += 1; continue
        open(pfad, 'w', encoding='utf-8').write(text.replace(alt, neu))
        lauf = subprocess.run([sys.executable, '-c', 'import sys'], capture_output=True)
        r = subprocess.run(['node', test_datei, kopie], capture_output=True, text=True, env=dict(env, NUR=test), timeout=400)
        rot = r.returncode != 0
        print(('OK     ' if rot else 'FEHLER ') + f'Gegenprobe "{name}" wird von {test} erkannt' if rot else f'FEHLER Gegenprobe "{name}" bleibt unentdeckt (Test {test} grün)')
        if not rot: fehler += 1
print('Alle Gegenproben S-W16 erkannt.' if fehler == 0 else f'{fehler} Gegenprobe(n) nicht erkannt.')
sys.exit(1 if fehler else 0)
