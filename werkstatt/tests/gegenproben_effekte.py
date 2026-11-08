#!/usr/bin/env python3
"""Gegenproben zu S-W22 (Driftpokal Bildeffekte): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_effekte.py   (NUR=Teil des Namens wählt Gegenproben aus)"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'driftpokal/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'effekte_test.js')
FEHLER = [
    ('Blendung bei Regen', 'if (!tag || tag.rain || tag.night ||', 'if (!tag || tag.night ||', 's_blendung'),
    ('Blendung über 0,6', 'glareMax: 0.6', 'glareMax: 0.9', 's_blendung'),
    ('Sog klingt nicht ab', 'sogDown: 2.2', 'sogDown: 0.2', 's_sog'),
    ('Sog baut zu langsam auf', 'sogUp: 5,', 'sogUp: 1,', 's_sog'),
    ('Schalter aus wird ignoriert', 'if (FX_LOOK.glare && this.sunDir && this.look){', 'if (this.sunDir && this.look){', 's_verdrahtung'),
    ('Blendung ohne Wirkung im Bild', 'c += vec3(1.0, 0.93, 0.78) * uGlare.z *', 'c += vec3(1.0, 0.93, 0.78) * 0.0 * uGlare.z *', 's_bild'),
    ('Blendung füllt das ganze Bild', 'if (r < 0.5){\n            float a = atan(g.y, g.x);\n            float halo = exp(-r * r * 18.0) * 0.9 + exp(-r * 3.5) * 0.25;\n            float rays = pow(abs(cos(a * 3.0 + 0.4)), 24.0) * exp(-r * 5.0) * 0.5;\n            c += vec3(1.0, 0.93, 0.78) * uGlare.z * (halo + rays) * (1.0 - smoothstep(0.25, 0.5, r));', 'if (true){\n            float a = atan(g.y, g.x);\n            float halo = 1.0;\n            float rays = 0.0;\n            c += vec3(1.0, 0.93, 0.78) * uGlare.z * (halo + rays);', 's_bild'),
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
