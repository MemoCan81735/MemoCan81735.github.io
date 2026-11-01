#!/usr/bin/env python3
"""Gegenproben zu S-W09 (Schach-Optik): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_optik.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'optik_test.js')
FEHLER = [
    ('Überschriften vertauscht', '<div class="gruppe">Aktionen</div>', '<div class="gruppe">Spielmodus</div>', 'o_gruppen'),
    ('Symbol an einem Knopf fehlt', '.ansicht-knopf, .lernen-knopf)::before {\n      content', '.ansicht-knopf)::before {\n      content', 'o_symbole'),
    ('Knöpfe zu niedrig', '#chess-view button.action { min-height: 44px; }', '#chess-view button.action { min-height: 30px; }', 'o_handy'),
    ('Maserung zu schwach', 'w[y * n + x] = 1 - 0.1 * (', 'w[y * n + x] = 1 - 0.01 * (', 'o_holz'),
    ('Maserung zu stark', 'w[y * n + x] = 1 - 0.1 * (', 'w[y * n + x] = 1 - 0.2 * (', 'o_holz'),
    ('Alle Felder gleich gedreht', 'm.userData.dreh = (r * 5 + c * 3 + (r >> 1)) % 4;', 'm.userData.dreh = 0;', 'o_holz'),
    ('Dunkles Feld zu dunkel', 'holz(0x95603b, s)', 'holz(0x6b4226, s)', 'o_kontrast'),
    ('Textur von außen geladen', 'const { werte, groesse: n } = Ansicht3D.holzFaktor(seed);\n    const c = document', "fetch('https://example.invalid/holz.png').catch(() => { }); const { werte, groesse: n } = Ansicht3D.holzFaktor(seed);\n    const c = document", 'o_leistung'),
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
