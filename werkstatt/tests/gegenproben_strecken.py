#!/usr/bin/env python3
"""Gegenproben zu S-W11 (Strecken aus echten Straßen): baut je einen absichtlichen Fehler in eine Kopie ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_strecken.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PY = os.path.join(WURZEL, 'werkstatt', 'tests', 'strecken_test.py')
JS = os.path.join(WURZEL, 'werkstatt', 'tests', 'strecken_test.js')
BAUE = 'werkstatt/strecken/baue.py'
SEITE = 'driftpokal/index.html'
FEHLER = [
    ('Straßen in falscher Reihenfolge', BAUE, 'for n in strassen[1:]:\n        p = kuerzester', 'for n in strassen[:0:-1]:\n        p = kuerzester', PY, 'st_weg'),
    ('40 statt 20 bis 30 Punkte', BAUE, 'PUNKTE_BEREICH = range(20, 31)', 'PUNKTE_BEREICH = range(40, 41)', PY, 'st_form'),
    ('Punkte außerhalb des Raums', BAUE, 'RAUM = (120.0, 1080.0)', 'RAUM = (-300.0, 1500.0)', PY, 'st_form'),
    ('Zu viele Punkte, zu enge Kurven', BAUE, 'PUNKTE_BEREICH = range(20, 31)', 'PUNKTE_BEREICH = range(90, 91)', PY, 'st_form'),
    ('Uhrzeit in der Ausgabe', BAUE, "'quelle': daten.get(", "'zeit': __import__('time').strftime('%H:%M:%S'), 'quelle': daten.get(", PY, 'st_wieder'),
    ('Zufall in der Ausgabe', BAUE, "'formatversion': 1,\n        'quelle'", "'zufall': __import__('random').random(), 'formatversion': 1,\n        'quelle'", PY, 'st_wieder'),
    ('Unbekannte Straße nicht gemeldet', BAUE, "if n not in namen:\n            raise Fehler(f'Straße nicht gefunden: {n}')", "if False:\n            raise Fehler(f'Straße nicht gefunden: {n}')", PY, 'st_fehler'),
    ('Rundenprüfung aus (Hin und zurück erlaubt)', BAUE, "if len(weg) < 12 or laenge < 500 or flaeche < FLAECHE_MIN * laenge * laenge:", "if False:", PY, 'st_fehler'),
    ('Strecke zu schmal, Computerfahrer kracht', SEITE, 'id: "oer", width: 70, offroad: 26,', 'id: "oer", width: 14, offroad: 0,', JS, 'st_fahrt'),
    ('Quelle fehlt im Untertitel', SEITE, 'sub: "Echte Straßen · © OpenStreetMap-Mitwirkende"', 'sub: "Echte Straßen"', JS, 'st_einbau'),
    ('Alte Strecke verändert', SEITE, 'points: [[300,300],[480,270]', 'points: [[301,300],[480,270]', JS, 'st_einbau'),
    ('Strecke nicht im Heimat-Cup', SEITE, '"muenchen", "oer"] }', '"muenchen"] }', JS, 'st_einbau'),
    ('Eintrag doppelt (zweimal eingebaut)', SEITE, '/* @@strecke oer */oer: { par:', '/* @@strecke oer */oer: { par: 1, skill: "slip" }/* @@ende oer */, /* @@strecke oer */oer: { par:', JS, 'st_einbau'),
    ('Heimat-Cup bricht in zweite Reihe um', SEITE, '      maps.style.gridTemplateColumns = "repeat(" + Math.max(3, cup.tracks.length) + ", minmax(0, 1fr))";', '', JS, 'st_cup'),
    ('Fremde Anfrage beim Laden', SEITE, 'const POST_LOOK = {', 'fetch("https://example.invalid/oer.json").catch(() => { });\nconst POST_LOOK = {', JS, 'st_einbau'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
fehler = 0
for name, datei, alt, neu, test_datei, test in FEHLER:
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git'))
        p = os.path.join(kopie, datei)
        t = open(p, encoding='utf-8').read()
        if t.count(alt) != 1:
            print(f'FEHLER Gegenprobe "{name}" greift nicht ({t.count(alt)} Treffer)'); fehler += 1; continue
        open(p, 'w', encoding='utf-8').write(t.replace(alt, neu))
        cmd = ['python3', test_datei, kopie] if test_datei == PY else ['node', test_datei, kopie]
        r = subprocess.run(cmd, env={**env, 'NUR': test}, capture_output=True, text=True, timeout=900)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
