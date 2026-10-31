#!/usr/bin/env python3
"""Gegenproben zu S-W04: je ein absichtlicher Fehler in einer Kopie der Seite, der zuständige Test muss rot werden.
Aufruf: python3 werkstatt/tests/gegenproben_teilen.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'teilen_test.js')
FEHLER = [
    ('Link behält den Suchteil', 'teilen.js', 'return location.origin + location.pathname;', 'return location.href;', 'teilen_text'),
    ('Abbruch fällt auf Kopieren zurück', 'teilen.js', "if (e && e.name === 'AbortError') return 'abgebrochen';", '', 'teilen_weg'),
    ('Brettspiele-Knopf bleibt nach Neustart', 'brettspiele/index.html',
     'this.teilenBtn.hidden = !(this._ergebnis && this.control.isGameOver() && window.Teilen);', 'this.teilenBtn.hidden = !(this._ergebnis && window.Teilen);', 'teilen_brett'),
    ('Luftdrift-Knopf bei Abbruch', 'luftdrift/index.html', "      if (fertig) teilen = [`Ringjagd", "      teilen = [`Ringjagd", 'teilen_luftdrift'),
    ('Kürzung fehlt', 'teilen.js', "if (t.length > MAX) t = t.slice(0, MAX - 1).trimEnd() + '…';", '', 'teilen_text'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
fehler = 0
for name, datei, alt, neu, test in FEHLER:
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git'))
        p = os.path.join(kopie, datei)
        t = open(p, encoding='utf-8').read()
        if t.count(alt) != 1:
            print(f'FEHLER Gegenprobe "{name}" greift nicht ({t.count(alt)} Treffer)'); fehler += 1; continue
        open(p, 'w', encoding='utf-8').write(t.replace(alt, neu))
        r = subprocess.run(['node', TEST, kopie], env={**env, 'NUR': test}, capture_output=True, text=True, timeout=300)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
