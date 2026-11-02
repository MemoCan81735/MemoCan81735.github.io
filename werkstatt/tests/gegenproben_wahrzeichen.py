#!/usr/bin/env python3
"""Gegenproben zu S-W12 (Wahrzeichen der Oer-Runde): baut je einen absichtlichen Fehler in eine Kopie ein
und erwartet, dass der zuständige Test rot wird. Aufruf: python3 werkstatt/tests/gegenproben_wahrzeichen.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
PY = os.path.join(WURZEL, 'werkstatt', 'tests', 'wahrzeichen_test.py')
JS = os.path.join(WURZEL, 'werkstatt', 'tests', 'wahrzeichen_test.js')
BAUE = 'werkstatt/strecken/baue.py'
SEITE = 'driftpokal/index.html'
FEHLER = [
    ('Wahrzeichen nicht von der Fahrbahn weggeschoben', BAUE, 'for _ in range(12):', 'for _ in range(0):', PY, 'w_abstand'),
    ('Mindestabstand untereinander ignoriert', BAUE, "if math.hypot((x - a['x']) * STRECKUNG, (y - a['y']) * STRECKUNG) < PLATZ", "if False and math.hypot((x - a['x']) * STRECKUNG, (y - a['y']) * STRECKUNG) < PLATZ", PY, 'w_abstand'),
    ('Pflicht-Ort aus dem Bau gestrichen', BAUE, 'for w in liste:\n        ort = orte.get', 'for w in liste[1:]:\n        ort = orte.get', PY, 'w_pflicht'),
    ('Uhrzeit in der Ausgabe', BAUE, "'abbildung': abb,", "'abbildung': abb, 'zeit': __import__('time').strftime('%H:%M:%S'),", PY, 'w_fehler'),
    ('Typprüfung aus', BAUE, "if w.get('typ') not in TYPEN:", 'if False:', PY, 'w_fehler'),
    ('Bautyp rathaus fehlt im Spiel', SEITE, 'case "rathaus": {', 'case "rathausX": {', JS, 'w_typen'),
    ('Eine Moschee fehlt im Spiel-Eintrag', SEITE, '      { type: "mosque", x: 762.8, y: 299.8, rot: -0.415, s: 2.6, r: 40, label: "DITIB-Moschee" }, /* DITIB-Moschee Abdulhamit Han */\n', '', JS, 'w_einbau'),
    ('Längenprüfung der Anzeige aus', BAUE, "3 <= len(w['anzeige']) <= 24", 'True', PY, 'w_anzeige'),
    ('Label fehlt im Spiel-Eintrag', SEITE, 'rot: -0.415, s: 2.6, r: 40, label: "DITIB-Moschee" }', 'rot: -0.415, s: 2.6, r: 40 }', JS, 'w_label_einbau'),
    ('Schilder nie ausgeblendet', SEITE, 'return d <= 120 ? 1 : d >= 420 ? 0 : (420 - d) / 300;', 'return 1;', JS, 'w_label_alpha'),
    ('Ungültiger Abstand sichtbar', SEITE, 'if (typeof d !== "number" || !(d >= 0)) return 0;', '', JS, 'w_label_alpha'),
    ('Text ohne Verkleinern', SEITE, 'while (px > 14 && g.measureText(text).width > 512 * 0.86)', 'while (false)', JS, 'w_label_text'),
    ('Ferne Schilder bleiben sichtbar', SEITE, 'l.sprite.visible = a >= 0.02;', 'l.sprite.visible = true;', JS, 'w_label_szene'),
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
