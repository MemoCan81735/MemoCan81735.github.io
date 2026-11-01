#!/usr/bin/env python3
"""Gegenproben zu S-W06 (Schachfiguren): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_schach_figuren.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'schach_figuren_test.js')
FEHLER = [
    ('Alle Arten mit dem Bauern-Umriss', 'const f = ChessUI.FIGUREN[wert[1]];', 'const f = ChessUI.FIGUREN.p;', 'f_2d_umriss'),
    ('Weißer Rand statt schwarzem', 'svg.w .koerper { fill: #ffffff; stroke: #111111;', 'svg.w .koerper { fill: #ffffff; stroke: #eeeeee;', 'f_2d_kontrast'),
    ('Dame so hoch wie König', 'kiste(0.08, 0.32, 0.08, 0, 1.41, 0), kiste(0.26, 0.08, 0.08, 0, 1.46, 0)', 'kugel(0.08, 1.3)', 'f_3d_hoehen'),
    ('Kontur zu dünn', 'static KONTUR = 0.05;', 'static KONTUR = 0.01;', 'f_3d_kontur'),
    ('Kontur fehlt', 'const k = this._konturMesh(geo, wert[0]); k.userData.kontur = true; k.raycast = () => { }; g.add(k);', '', 'f_3d_kontur'),
    ('Schwarze Figuren mit dunkler Kontur', 'this.konturMat = { w: kontur(0x0b0b0e), b: kontur(0xe6e6e6) };', 'this.konturMat = { w: kontur(0x0b0b0e), b: kontur(0x0b0b0e) }; /* */', 'f_3d_kontur'),
    ('Helle Felder fast weiß', 'const hell = new T.MeshStandardMaterial({ color: 0xc8a070', 'const hell = new T.MeshStandardMaterial({ color: 0xf4ead6', 'f_3d_kontrast'),
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
