#!/usr/bin/env python3
"""Gegenproben zu S-W15 (Mühle verstehen): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test in muehle_test.js rot wird. Aufruf: python3 werkstatt/tests/gegenproben_muehle.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'muehle_test.js')
FEHLER = [
    ('Schwarz beginnt wieder', "this.currentPlayer = 'W';      // S-W15", "this.currentPlayer = 'B';      // S-W15", 'mu_status'),
    ('Wort Fliegen statt Springen', '`${vor}Springen: Du darfst', '`${vor}Fliegen: Du darfst', 'mu_status'),
    ('Punkte nur 24 px', ".mu-point {\n    position: absolute;\n    width: 44px;\n    height: 44px;",
     ".mu-point {\n    position: absolute;\n    width: 24px;\n    height: 24px;", 'mu_markierung'),
    ('Schild fehlt', "if (geschuetzt.has(i)) cls += ' geschuetzt';", '', 'mu_markierung'),
    ('Drohung ohne Erreichbarkeit', "if (springt || MuehleEntity.ADJACENCY[p].some(n => this.cells[n] === s && !m.includes(n))) out.push(p);",
     'out.push(p);', 'mu_drohung'),
    ('Stark rechnet nur 1 Halbzug', 'stark:  { tiefe: 4, fehler: 0 }\n  };\n  static KNOTEN', 'stark:  { tiefe: 1, fehler: 0 }\n  };\n  static KNOTEN', 'mu_staerke'),
    ('Suche ignoriert die Tiefe', 'for (let d = 1; d <= tiefe; d++) {', 'for (let d = 1; d <= 1; d++) {', 'mu_staerke'),
    ('Wiederholung ohne Zählung', "if (this.stellungen[k] >= 3) { this.finished = true; this.winner = 'Draw'; }", '', 'mu_remis'),
    ('Wegnahme leert die Zählung nicht', 'this.stellungen = {};          // nach einer Wegnahme', '', 'mu_remis'),
    ('Einführung ohne Speichern', '_speichereEinfuehrung() { if (GameUI.einst) GameUI.einst.setzeMuehleEinfuehrung(); }',
     '_speichereEinfuehrung() { }', 'mu_uebung_speicher'),
    ('Falscher Punkt in der Übung zählt', 'if (index !== s.ziel) return { invalid: true, hinweis: true };', '', 'mu_uebung'),
    ('Mühlenlinie nicht hervorgehoben', "l.setAttribute('class', 'mu-muehle');", "l.setAttribute('class', 'mu-line');", 'mu_uebung'),
    ('? verändert die Partie', '_hilfeOeffnen() { this.hilfeEl.hidden = false; this._pausiert(); }',
     '_hilfeOeffnen() { this.hilfeEl.hidden = false; this._pausiert(); this.control.restartGame(); }', 'mu_hilfe'),
    ('Computer wartet nicht auf die Karten', 'if (this._pausiert()) return;   // Computer wartet', '', 'mu_hilfe'),
    ('Fertig gerechneter Zug landet trotz Karten', 'if (partie !== this._partie || this._pause || !this.isAiTurn() || !z)',
     'if (partie !== this._partie || !this.isAiTurn() || !z)', 'mu_hilfe'),
    ('Verfallene Rechnung wird nicht neu angestoßen', 'if (outcome.invalid) { if (outcome.erneut) this._weiterNachPause(); return; }',
     'if (outcome.invalid) return;', 'mu_hilfe'),
    ('Suche kennt keine Wiederholung', 'if (key !== null && hist.get(key) >= 3) return 0;', '', 'mu_staerke'),
    ('Alter Computer-Stand: Seiten vertauscht', "!('stellungen' in data.entity) ? 'W' : 'B';", "!('stellungen' in data.entity) ? 'B' : 'B';", 'mu_status'),
    ('Statuszeile zu lang', 'return `${vor}Setze auf einen grünen Punkt (noch', 'return `${vor}Setze jetzt bitte einen deiner Steine auf einen der grün leuchtenden freien Punkte (noch', 'mu_drohung'),
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
