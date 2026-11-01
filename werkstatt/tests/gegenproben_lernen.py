#!/usr/bin/env python3
"""Gegenproben zu S-W07 (Schach lernen): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_lernen.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'lernen_test.js')
FEHLER = [
    ('Rückschlagen nicht berücksichtigt', 'const v = zurueck ? Math.max(0, w - ChessBoundary.VALUES[m.piece]) : w;', 'const v = w;', 'l_patzer'),
    ('Matt in einem Zug nicht geprüft', 'const matt = ChessBoundary._mattInEins(g);', 'const matt = null;', 'l_patzer'),
    ('Schwelle 1 statt 2 (Fehlalarm)', 'if (netto >= 2)', 'if (netto >= 1)', 'l_patzer'),
    ('Computer zieht trotz Warnung', 'isAiTurn() { return !this.warnung && super.isAiTurn(); }', 'isAiTurn() { return super.isAiTurn(); }', 'l_warnung_ablauf'),
    ('Zurücknehmen nimmt zwei Halbzüge', '    this.boundary.undo();\n    this._persistGame();\n    return { invalid: false };\n  }\n  warnungWeiter',
     '    this.boundary.undo(); this.boundary.undo();\n    this._persistGame();\n    return { invalid: false };\n  }\n  warnungWeiter', 'l_warnung_ablauf'),
    ('Schalter nicht gespeichert', 'if (GameUI.einst) GameUI.einst.setzeLernen(this.spiel, an);', '', 'l_schalter'),
    ('Satz fehlt beim Tipp', 'this.satzEl.hidden = false;', 'this.satzEl.hidden = true;', 'l_tipp_satz'),
    ('Grund Retten fehlt', "gruende.push({ art: 'rettet', figur: fig });", '', 'l_gruende'),
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
