#!/usr/bin/env python3
"""Gegenproben zu S-W30 (Ayo): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test in ayo_test.js rot wird. Aufruf: python3 werkstatt/tests/gegenproben_ayo.py
Ein Eintrag besteht aus (Name, [(alt, neu), ...], Test); jedes "alt" muss genau einmal vorkommen."""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'ayo_test.js')
FEHLER = [
    ('Aufstellung 5 statt 4', [("Array(14).fill(4); c[12] = 0", "Array(14).fill(5); c[12] = 0")], 'ay_regeln'),
    ('Startmulde nicht übersprungen', [("if (i === von) continue; c[i]++", "c[i]++")], 'ay_regeln'),
    ('Schlag schon bei 1', [("(c[i] === 2 || c[i] === 3)) { out.push(i)", "(c[i] >= 1 && c[i] <= 3)) { out.push(i)")], 'ay_schlagen'),
    ('Schlag erst ab 4', [("(c[i] === 2 || c[i] === 3)) { out.push(i)", "(c[i] >= 2 && c[i] <= 4)) { out.push(i)")], 'ay_schlagen'),
    ('Schlag auf eigener Seite', [("const opp = SEITE[gegner(p)], out = [];", "const opp = SEITE[p], out = [];")], 'ay_schlagen'),
    ('Kette bricht nach dem ersten ab', [("while (opp.includes(i) && (c[i] === 2 || c[i] === 3)) { out.push(i); i = (i + 11) % 12; }", "if (opp.includes(i) && (c[i] === 2 || c[i] === 3)) out.push(i);")], 'ay_kette'),
    ('Kette über die Seitengrenze', [("while (opp.includes(i) && (c[i]", "while ((c[i]")], 'ay_kette'),
    ('Füttern nicht erzwungen', [("if (opp.every(i => cells[i] === 0)) m = m.filter", "if (false) m = m.filter")], 'ay_fuettern'),
    ('Nichtfüttern beendet nicht', [("if (!zuege(cells, naechster).length) { const e", "if (false) { const e")], 'ay_fuettern'),
    ('Grand Slam trotz Alternative erlaubt', [("return ohne.length ? ohne : m;", "return m;")], 'ay_grandslam'),
    ('Grand Slam schlägt trotzdem', [("if (!r.grandSlam) for (const i of r.geschlagen)", "for (const i of r.geschlagen)")], 'ay_grandslam'),
    ('Sieg erst bei 26', [("if (cells[12] >= 25) return { grund: 'sieg', winner: 'A', cells };", "if (cells[12] >= 26) return { grund: 'sieg', winner: 'A', cells };")], 'ay_ende'),
    ('24:24 als Sieg', [("winner: c[12] === c[13] ? 'Draw' : (c[12] > c[13] ? 'A' : 'B')", "winner: c[12] > c[13] ? 'A' : 'B'")], 'ay_ende'),
    ('Endabrechnung ohne Samen der Seite', [("for (const i of SEITE[p]) { c[sammel(p)] += c[i]; c[i] = 0; }", "for (const i of SEITE[p]) { c[i] = 0; }")], 'ay_ende'),
    ('Wiederholung nicht erkannt', [(".length >= 3) ende = { grund: 'wiederholung' }", ".length >= 99) ende = { grund: 'wiederholung' }")], 'ay_ende'),
    ('60 Halbzüge nicht erkannt', [("this.halbzuege >= 60) ende", "this.halbzuege >= 9999) ende")], 'ay_ende'),
    ('Zähler nicht zurückgesetzt bei Schlag', [("{ this.halbzuege = 0; this.historie = []; } else", "{ this.historie = []; } else")], 'ay_ende'),
    ('Speicher ohne Summenprüfung', [(" || d.cells.reduce((a, b) => a + b, 0) !== 48) return false;", ") return false;")], 'ay_speicher'),
    ('Speicher ohne Formatversion', [("d.formatversion !== AyoEntity.FORMAT) return false;", "false) return false;")], 'ay_speicher'),
    ('Computer ignoriert die Stufe', [("class AyoControl extends GameControl {\n  static STUFEN = {\n    leicht: { tiefe: 2, fehler: 0.25 },\n    mittel: { tiefe: 5, fehler: 0.05 },\n    stark:  { tiefe: 8, fehler: 0 }", "class AyoControl extends GameControl {\n  static STUFEN = {\n    leicht: { tiefe: 2, fehler: 0.25 },\n    mittel: { tiefe: 5, fehler: 0.05 },\n    stark:  { tiefe: 1, fehler: 0 }")], 'ay_staerke'),
    ('Leicht macht keine Fehlzüge', [("class AyoControl extends GameControl {\n  static STUFEN = {\n    leicht: { tiefe: 2, fehler: 0.25 }", "class AyoControl extends GameControl {\n  static STUFEN = {\n    leicht: { tiefe: 2, fehler: 0 }")], 'ay_staerke'),
    ('Statuszeile zu lang', [("return `${kopf}${wer} am Zug: tippe eine Mulde mit Ring.`;", "return `${kopf}${wer} am Zug: tippe jetzt bitte eine deiner Mulden mit dem grünen Ring an, damit der Zug ausgeführt wird und die Samen verteilt werden.`;")], 'ay_ui'),
    ('Mulde nur 30 px', [("grid-template-rows: 44px 68px 68px 44px", "grid-template-rows: 44px 30px 30px 44px"), ("gap: 3px; min-width: 44px; min-height: 44px; padding: 0; border: none; border-radius: 22px;\n    background: #e8d4b8;", "gap: 3px; min-width: 44px; min-height: 30px; padding: 0; border: none; border-radius: 22px;\n    background: #e8d4b8;")], 'ay_ui'),
    ('Animation ohne Fehlerbehandlung', [("this._animiereSaeen(l, alt).catch(() => {}).then(", "this._animiereSaeen(l, alt).then(")], 'ay_nachtrag'),
    ('Rückruf prüft die Stellung nicht', [("if (this.control.boundary.getBoardState().join(',') !== stand) return this.render();", "")], 'ay_nachtrag'),
    ('Speicher ohne Verlaufsprüfung', [("d.historie.length < 1 || d.historie.length > d.halbzuege + 1 || d.historie[d.historie.length - 1] !== d.cells.join(',') + ':' + d.currentPlayer", "false")], 'ay_nachtrag'),
    ('Verfallener Schlag setzt Zähler zurück', [("if (z.geschlagen.length) { this.halbzuege = 0;", "if (z.geschlagen.length || z.verfallen) { this.halbzuege = 0;")], 'ay_nachtrag'),
    ('Übungstext zu lang', [("text: 'Du spielst unten. Tippe die leuchtende Mulde: ihre Samen werden einzeln gegen den Uhrzeigersinn verteilt.'", "text: 'Du spielst die untere Reihe des Bretts. Tippe jetzt bitte die leuchtende Mulde an: ihre Samen werden dann einzeln gegen den Uhrzeigersinn auf die folgenden Mulden verteilt.'")], 'ay_uebung'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
nur = sys.argv[1:] or None
fehler = 0
for name, paare, test in FEHLER:
    if nur and test not in nur:
        continue
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git', '__pycache__'))
        p = os.path.join(kopie, DATEI)
        t = open(p, encoding='utf-8').read()
        ok = True
        for alt, neu in paare:
            if t.count(alt) != 1:
                print(f'FEHLER Gegenprobe "{name}" greift nicht ({t.count(alt)} Treffer für {alt[:50]!r})'); fehler += 1; ok = False; break
            t = t.replace(alt, neu)
        if not ok:
            continue
        open(p, 'w', encoding='utf-8').write(t)
        r = subprocess.run(['node', TEST, kopie], env={**env, 'NUR': test}, capture_output=True, text=True, timeout=400)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
