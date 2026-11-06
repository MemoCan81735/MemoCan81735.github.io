#!/usr/bin/env python3
"""Gegenproben zu S-W18: je ein absichtlicher Fehler in einer Kopie von etappenrennen/, der zuständige Prüfpunkt in etappe_test.js muss rot werden;
der unveränderte Bau muss grün sein (Fehlalarm). Aufruf: python3 werkstatt/tests/gegenproben_etappe.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'etappe_test.js')
FEHLER = [  # (Name, alt, neu, erwarteter roter Prüfpunkt)
    ('Menü öffnet nach dem Laden', 'tourLaden();tourAnzeige();starten();',
     "tourLaden();tourAnzeige();starten();requestAnimationFrame(()=>requestAnimationFrame(()=>$('menue').click()));", 'PS-1: Sofortstart ohne Menü'),
    ('Zurück-Link im Infostreifen fehlt', '<div id="info"><a class="ng-zurueck"', '<div id="info"><a class="ng-weg"', 'PS-1: Zurück-Link im Infostreifen'),
    ('Prüfhaken bleiben drin', '</script>', '</script><script>window.__proto={}</script>', 'PS-1: keine Prüfhaken'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
fehler = 0


def lauf(neu_text):
    with tempfile.TemporaryDirectory() as tmp:
        shutil.copytree(os.path.join(WURZEL, 'etappenrennen'), os.path.join(tmp, 'etappenrennen'))
        open(os.path.join(tmp, 'etappenrennen', 'index.html'), 'w', encoding='utf-8').write(neu_text)
        return subprocess.run(['node', TEST, tmp], env=env, capture_output=True, text=True, timeout=300)


quelle = open(os.path.join(WURZEL, 'etappenrennen', 'index.html'), encoding='utf-8').read()
for name, alt, neu, punkt in FEHLER:
    n = quelle.count(alt)
    if n < 1 or (n > 1 and alt != '</script>'):
        print(f'FEHLER Gegenprobe "{name}" greift nicht ({n} Treffer)'); fehler += 1; continue
    r = lauf(quelle.replace(alt, neu, 1))
    rot = r.returncode != 0 and f'FEHLER {punkt}' in r.stdout
    print(('erkannt: ' if rot else 'FEHLER Verstoß nicht erkannt: ') + name); fehler += not rot
r = lauf(quelle)
print('kein Fehlalarm' if r.returncode == 0 else 'FEHLER Fehlalarm: ' + r.stdout[-300:]); fehler += r.returncode != 0
print('GEGENPROBEN BESTANDEN' if not fehler else f'{fehler} Fehler'); sys.exit(1 if fehler else 0)
