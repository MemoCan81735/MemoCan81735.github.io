#!/usr/bin/env python3
"""Gegenproben zu S-W05 (3D-Ansicht): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_brett3d.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'brett3d_test.js')
FEHLER = [
    ('Spalten vertauscht', "if (this.art === 'connect4') this.ui.handleColumnClick(f);", "if (this.art === 'connect4') this.ui.handleColumnClick(6 - f);", 'd3_tippen'),
    ('Fallzeit ohne Schwerkraft', 'static fallzeit(hoehe) { return Math.sqrt(2 * hoehe / Ansicht3D.G); }', 'static fallzeit(hoehe) { return 0.1; }', 'd3_animation'),
    ('Drehgrenze fehlt', 'this.drehung = Math.max(-Ansicht3D.DREH_MAX, Math.min(Ansicht3D.DREH_MAX, w));', 'this.drehung = w;', 'd3_drehen'),
    ('Ansicht nicht gespeichert', "this._e.ansicht[spiel] = a === '2d' ? '2d' : '3d'; this._b.speichere(this._e);", "this._e.ansicht[spiel] = a === '2d' ? '2d' : '3d';", 'd3_schalter'),
    ('Zeichenschleife läuft dauernd', 'if (this.anim.length || this.marken.length || leuchtet) this._bild();', 'this._bild();', 'd3_ruhe'),
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
        if t.count(alt) != 1:
            print(f'FEHLER Gegenprobe "{name}" greift nicht ({t.count(alt)} Treffer)'); fehler += 1; continue
        open(p, 'w', encoding='utf-8').write(t.replace(alt, neu))
        r = subprocess.run(['node', TEST, kopie], env={**env, 'NUR': test}, capture_output=True, text=True, timeout=600)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
