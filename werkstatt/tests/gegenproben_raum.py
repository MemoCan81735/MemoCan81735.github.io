#!/usr/bin/env python3
"""Gegenproben zu S-W29: je ein absichtlicher Fehler in einer Kopie der Seite, der zuständige Test muss rot werden.
Aufruf: python3 werkstatt/tests/gegenproben_raum.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'raum_test.js')
FEHLER = [
    ('Zurück-Link im Spiel führt zur Startseite', 'raum/index.html', [("if (a) { e.preventDefault(); schliesseSpiel(); }", ''),
     ("if (pfad === '/' || pfad.endsWith('/index.html') && pfad.split('/').length <= 2) { schliesseSpiel(); return; }", '')], None, 'raum_spiel_zurueck'),
    ('Leiste schließt das Spiel nicht', 'raum/index.html', "document.getElementById('spielzu').addEventListener('click', schliesseSpiel);", '', 'raum_spiel'),
    ('Spiel-Adresse falsch', 'raum/index.html', "url: '../perlen/'", "url: '../perle/'", 'raum_adressen'),
    ('Ein Spiel fehlt an der Konsole', 'raum/index.html', "      { name: 'Ula Çarpsana!', url: '../ula/', text: 'Autoscooter-Crash im Feuerring.' }\n", '', 'raum_platz'),
    ('Spiel liegt nicht auf dem Fernseher', 'raum/index.html', '      rahmenAufBild();\n', '', 'raum_fernseher'),
    ('Esstisch ohne Spielfläche', 'raum/index.html', "flaeche: { ecken: [[eX - 0.45", "flaecheAus: { ecken: [[eX - 0.45", 'raum_flaeche'),
    ('Computer antwortet im 3D-Schach nicht', 'raum/index.html', 'fertig = () => { aufbauen(); zeigeStatus(); computerWennDran(); };', 'fertig = () => { aufbauen(); zeigeStatus(); };', 'raum_schach'),
    ('Vier gewinnt: Stein fällt nicht nach unten', 'raum/index.html', 'for (let r = 0; r < RE; r++) if (s.c[zelle(r, sp)] === null) { z.push({ id: sp, zelle: zelle(r, sp) }); break; }', 'for (let r = RE - 1; r >= 0; r--) if (s.c[zelle(r, sp)] === null) { z.push({ id: sp, zelle: zelle(r, sp) }); break; }', 'raum_tischspiel'),
    ('Tavla: Computer würfelt nicht', 'raum/index.html', "if (j.phase === 'wuerfeln') { plan = []; return { id: 'wurf', ueberall: true }; }", "if (j.phase === 'wuerfeln') { plan = []; return null; }", 'raum_tavla'),
    ('Neon Ada: Insel kommt nicht in den Raum', 'neon-ada/index.html', '    if (this.raum) this.raum.einsetzen(this.gruppe);\n', '\n', 'raum_modell'),
    ('Armband kommt nicht auf den Esstisch', 'raum/index.html', '    armbandBauen(geo, farben);\n', '\n', 'raum_armband'),
    ('Wand ohne Türöffnung', 'raum/index.html', 'box([wl, (TUER.h + H) / 2, TUER.z], [W, H - TUER.h, TUER.b], M.wand);', 'box([wl, H / 2, TUER.z], [W, H, TUER.b], M.wand);', 'raum_tuer'),
    ('Karte fehlt auf der Startseite', 'index.html', '<a class="karte" href="raum/">', '<a class="karte" href="raum/index.html">', 'raum_karte'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
fehler = 0
nur = os.environ.get('NUR')
for name, datei, alt, neu, test in FEHLER:
    if nur and nur not in name:
        continue
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git'))
        p = os.path.join(kopie, datei)
        t = open(p, encoding='utf-8').read()
        paare = alt if isinstance(alt, list) else [(alt, neu)]
        if any(t.count(a) != 1 for a, _ in paare):
            print(f'FEHLER Gegenprobe "{name}" greift nicht'); fehler += 1; continue
        for a, n in paare:
            t = t.replace(a, n)
        open(p, 'w', encoding='utf-8').write(t)
        r = subprocess.run(['node', TEST, kopie], env=env, capture_output=True, text=True, timeout=400)
        rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
        fehler += not rot
        print(('OK     ' if rot else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
sys.exit(1 if fehler else 0)
