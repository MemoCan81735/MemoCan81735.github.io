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
    ('Eine Moschee hat im Spiel den falschen Typ', SEITE, '{ type: "mosque", x: 762.8, y: 299.8,', '{ type: "mosqueX", x: 762.8, y: 299.8,', JS, 'w_einbau'),
    ('Längenprüfung der Anzeige aus', BAUE, "3 <= len(w['anzeige']) <= 24", 'True', PY, 'w_anzeige'),
    ('Label fehlt im Spiel-Eintrag', SEITE, 'r: 40, label: "DITIB-Moschee", foot', 'r: 40, foot', JS, 'w_label_einbau'),
    ('Schilder nie ausgeblendet', SEITE, 'return d <= 220 ? 1 : d >= 650 ? 0 : (650 - d) / 430;', 'return 1;', JS, 'w_label_alpha'),
    ('Ungültiger Abstand sichtbar', SEITE, 'if (typeof d !== "number" || !(d >= 0)) return 0;', '', JS, 'w_label_alpha'),
    ('Text ohne Verkleinern', SEITE, 'while (px > 14 && g.measureText(text).width > 512 * 0.86)', 'while (false)', JS, 'w_label_text'),
    ('Schilder zu klein', SEITE, 'sprite.scale.set(96, 96 * 96 / 512, 1);', 'sprite.scale.set(44, 44 * 96 / 512, 1);', JS, 'w_label_szene'),
    ('Ferne Schilder bleiben sichtbar', SEITE, 'l.sprite.visible = a >= 0.02;', 'l.sprite.visible = true;', JS, 'w_label_szene'),
    ('Umriss nicht zurückgedreht', BAUE, 'lok = [(p[0] * f * c - p[1] * f * s, p[0] * f * s + p[1] * f * c) for p in off]', 'lok = [(p[0] * f, p[1] * f) for p in off]', PY, 'w_fuss'),
    ('Umriss nicht vereinfacht', BAUE, 'if len(v) <= FUSS_PUNKTE_MAX: break', 'break', PY, 'w_fuss'),
    ('Größe nicht begrenzt', BAUE, 'f = min(FUSS_TYPEN[typ] / ausdehnung, 0.9 * r_s / umkreis)', 'f = 3.0', PY, 'w_fuss'),
    ('Grundrissprüfung aus', BAUE, 'if flaeche < FLAECHE_MIN_M2:', 'if False:', PY, 'w_fuss_fehler'),
    ('Körper zu niedrig', SEITE, 'const H = { mosque: 22,', 'const H = { mosque: 2,', JS, 'w_fuss_teile'),
    ('Moschee ohne Kuppel', SEITE, 'add(new T3.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), "dome"', 'add(new T3.SphereGeometry(r, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), "marble"', JS, 'w_fuss_teile'),
    ('Grundriss in der Szene nicht benutzt', SEITE, 'for (const part of lm.foot ? KitUI.footParts(lm.type, lm.foot) : this.kit.decorParts(lm.type, true)){', 'for (const part of this.kit.decorParts(lm.type, true)){', JS, 'w_fuss_szene'),
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
