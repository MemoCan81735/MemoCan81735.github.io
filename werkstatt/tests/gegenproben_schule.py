#!/usr/bin/env python3
"""Gegenproben zu S-W08 (Schachschule): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_schule.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'schule_test.js')
FEHLER = [
    ('Turm gleitet durch Sterne', 'out.push(r * 8 + c); if (sterne.has(r * 8 + c)) break;', 'out.push(r * 8 + c);', 's_zuege'),
    ('Bauer schlägt geradeaus', 'if (!sterne.has(vor)) { out.push(vor);', 'if (true) { out.push(vor);', 's_zuege'),
    ('Falscher Zug wird angenommen', 'if (!richtig) { a.status', 'if (false) { a.status', 's_matt'),
    ('Lösung zählt als gelöst', 'if (!a.gezeigt) this._geloest(a.id);', 'this._geloest(a.id);', 's_tipp_loesung'),
    ('Fortschritt nicht gespeichert', '_geloest(id) { this.geloest.add(id); this.b.speichereGeloest(this.geloest); }', '_geloest(id) { this.geloest.add(id); }', 's_fortschritt'),
    ('Computersatz fehlt', 'this._kiSatz = this.control.holeKiGrund();', 'this._kiSatz = null;', 's_computer_satz'),
    ('Lösungsliste unvollständig', "loesung: ['h1a8', 'h1c6', 'h1e4', 'h1h8']", "loesung: ['h1a8', 'h1c6', 'h1e4']", 's_gewinn'),
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
