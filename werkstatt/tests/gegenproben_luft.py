#!/usr/bin/env python3
"""Gegenproben zu S-W03: baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_luft.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'luftdrift/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'luft_test.js')
FEHLER = [
    ('Geist speichert auch langsamere Runden', '(!alt || neu.zeit < alt.zeit)', 'true', 'geist_speichern'),
    ('Mischung nimmt immer den ersten Punkt', 'const a = punkte[i], b = punkte[i + 1], f = t / GEIST_TAKT - i;',
     'const a = punkte[0], b = punkte[0], f = 0;', 'geist_abspielen'),
    ('Formatversion wird nicht geprüft', 'd.formatversion !== GEIST_FORMAT || ', '', 'geist_kaputt'),
    ('Ring der Küste unter Gelände', '    ring.gier = Math.atan2(p.x - ring.x, p.z - ring.z) + Math.PI / 2;',
     "    if (strecke.id === 'kueste' && RINGE.length === 4) ring.y = gelaende(ring.x, ring.z) + 5;\n    ring.gier = Math.atan2(p.x - ring.x, p.z - ring.z) + Math.PI / 2;", 'strecken_aufbau'),
    ('Bestwerte nicht je Strecke', "const sk = (m) => strecke.id === 'dorf' ? m : m + '@' + strecke.id;", 'const sk = (m) => m;', 'bestwerte_je_strecke'),
    ('Vorzeichen vertauscht', "(betrag === 0 ? '±' : d < 0 ? '−' : '+')", "(betrag === 0 ? '±' : d < 0 ? '+' : '−')", 'geist_abstand'),
    ('Alte Welt wird nicht freigegeben', 'if (o.geometry && !GETEILT.has(o.geometry)) o.geometry.dispose();', '', 'strecken_wechsel'),
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
