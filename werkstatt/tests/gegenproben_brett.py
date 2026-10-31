#!/usr/bin/env python3
"""Gegenproben zu S-W02: baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_brett.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'brett_test.js')
FEHLER = [
    ('Zug zurück stellt den Spieler nicht her', 'this.boundary.restoreEntity(v.zustand);',
     'this.boundary.restoreEntity({ ...v.zustand, currentPlayer: this.boundary.getCurrentPlayer() });', 'zurueck_zweispieler'),
    ('Zug zurück gegen KI nur 1 Schritt', 'do { v = this._verlauf.pop(); } while (this.vsAI && v.spieler === this.aiPlayer);',
     'v = this._verlauf.pop();', 'zurueck_gegen_ki'),
    ('Fehlerquote ignoriert', '_entscheideFehler() { return this._zufall() < this.fehlerquote; }',
     '_entscheideFehler() { return false; }', 'stufen_fehlerquote'),
    ('Tipp für den falschen Spieler', "return this.aiStrategy.chooseMove('tictactoe', [this.boundary.getBoardState(), spieler]);",
     "return this.aiStrategy.chooseMove('tictactoe', [this.boundary.getBoardState(), this.aiPlayer]);", 'tipp_zug'),
    ('Animation fehlt', "if (val && neu.has(i)) btn.classList.add('neu');", '', 'animation_klassen'),
    ('Ton trotz Ton aus', "if (!GameUI.einst || !GameUI.einst.istTonAn()) return;", '', 'ton_vibration'),
    ('Formatversion ignoriert', "d.formatversion === EinstellungenBoundary.FORMAT", 'true', 'einstellungen_speicher'),
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
        r = subprocess.run(['node', TEST, kopie], env={**env, 'NUR': test}, capture_output=True, text=True, timeout=300)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
