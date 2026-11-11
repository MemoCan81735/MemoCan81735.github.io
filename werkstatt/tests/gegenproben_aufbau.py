#!/usr/bin/env python3
"""Gegenproben zu S-W25 (Brettspiele einheitlich aufbauen): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test in aufbau_test.js rot wird. Aufruf: python3 werkstatt/tests/gegenproben_aufbau.py"""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'aufbau_test.js')
FEHLER = [
    ('Kachel ohne Bild', '<button class="tabBtn" type="button" data-tab="muehle"><svg viewBox="0 0 48 48" aria-hidden="true">',
     '<button class="tabBtn" type="button" data-tab="muehle"><svg viewBox="0 0 48 48" aria-hidden="true" style="display:none">', 'au_auswahl'),
    ('Kachel zu klein', 'gap: 3px; min-height: 108px; padding: 12px 4px 8px; border-radius: 20px;', 'gap: 3px; min-height: 70px; padding: 4px 4px 4px; border-radius: 20px;', 'au_auswahl'),
    ('Spielname doppelt als Überschrift', '.tab-content > h1 { display: none; }', '.tab-content > h1 { display: block; }', 'au_auswahl'),
    ('Seite wieder mittig gesetzt', 'justify-content: flex-start;   /* S-W25', 'justify-content: center;   /* S-W25', 'au_kopfzeile'),
    ('"Spiele" ohne Wirkung', "if (this.ansicht === 'spiel') { e.preventDefault(); this.zeigeAuswahl(); }", "if (this.ansicht === 'spiel') { e.preventDefault(); }", 'au_zurueck'),
    ('Zurück-Geste ohne Wirkung', "window.addEventListener('popstate', (e) => this._verlaufGeaendert(e.state));", '', 'au_zurueck'),
    ('Kein Eintrag im Verlauf', "else this._verlauf('push', tabName);", '', 'au_zurueck'),
    ('Zurück bleibt hängen, wenn der Verlauf schweigt', "        if (!this._zurueckLaeuft) return;\n        this._zurueckLaeuft = false;", "        return;", 'au_zurueck'),
    ('Gesperrter Verlauf wirft einen Fehler', "(spiel ? { spiel } : { auswahl: true }, ''); } catch (e) { /* Verlauf gesperrt: Knöpfe gehen trotzdem */ }", "(spiel ? { spiel } : { auswahl: true }, ''); } finally { }", 'au_zurueck'),
    ('Verlauf wächst bei jedem Schließen', "      try { window.history.back(); } catch (e) { this._zurueckFertig(); }", "      this._zurueckFertig(); this._verlauf('push', null);", 'au_zurueck'),
    ('Zurück-Taste der App ohne Wirkung', "    if (this.ansicht === 'spiel') this.zeigeAuswahl();\n    else this.platform.exitApp();", "    this.platform.exitApp();", 'au_zurueck'),
    ('Markierung Weiterspielen fehlt', "btn.classList.toggle('weiter', btn.dataset.tab === z);", "btn.classList.toggle('weiter', false);", 'au_zurueck'),
    ('zuletzt wird nicht gespeichert', 'if (this.einst) this.einst.setzeZuletzt(tabName);', '', 'au_zuletzt'),
    ('zuletzt geht beim Speichern verloren', "...(typeof e.zuletzt === 'string' ? { zuletzt: e.zuletzt } : {}) }));", '}));', 'au_zuletzt'),
    ('Neuladen in der Auswahl öffnet das Spiel', "    else if (hier && hier.auswahl) this._zeigeAuswahl();\n", '', 'au_zuletzt'),
    ('Unbekanntes zuletzt wird geöffnet', 'direkt = z !== null && this.namen.has(z);', 'direkt = z !== null;', 'au_zuletzt'),
    ('Tipp vor Zug zurück', "      this.undoBtn = knopf('zurueck', 'Zug zurück');\n      this.undoBtn.addEventListener('click', () => this.handleUndo());\n    }\n    this.tippBtn = knopf('tipp-knopf', 'Tipp');",
     "    this.tippBtn = knopf('tipp-knopf', 'Tipp');\n      this.undoBtn = knopf('zurueck', 'Zug zurück');\n      this.undoBtn.addEventListener('click', () => this.handleUndo());\n    }", 'au_anordnung'),
    ('Stufen über dem Spielmodus', "this.modeInputs[0].closest('div').after(this.stufenEl);", "this.modeInputs[0].closest('div').before(this.stufenEl);", 'au_anordnung'),
    ('Kacheln in anderer Reihenfolge', '  <button class="tabBtn" type="button" data-tab="chess">', '  <button class="tabBtn" type="button" data-tab="chess" style="order: 5">', 'au_auswahl'),
    ('Überschrift Optionen ohne Knöpfe', 'this.optionenEl.hidden = leer; this.optGruppe.hidden = leer;', 'this.optionenEl.hidden = leer; this.optGruppe.hidden = false;', 'au_anordnung'),
    ('Teilen wieder in der Zeile Aktionen', "this.teilenBtn = knopf('teilen-knopf', 'Teilen', this.optionenEl);", "this.teilenBtn = knopf('teilen-knopf', 'Teilen');", 'au_anordnung'),
    ('Symbol auf Neu starten entfernt', '    .tab-content .neu-knopf::before {', '    .tab-content .kein-knopf::before {', 'au_anordnung'),
    ('Lücke zwischen den Abschnitten', '  #chengine:empty { display: none; }', '  #chengine:empty { display: block; min-height: 60px; }', 'au_anordnung'),
    ('Reiterleiste wieder über dem Spiel', '  #tabs { display: none; }\n  body[data-ansicht="auswahl"] #tabs {', '  #tabs {', 'au_sichtbar'),
    ('Reversi-Feld 38 px', '--ot-cell: min(44px, calc((100vw - 58px) / 8));', '--ot-cell: min(38px, calc((100vw - 58px) / 8));', 'au_tippflaechen'),
    ('Umschalter 28 px hoch', "    padding: 6px 16px;\n    min-height: 44px;\n    border-radius: 8px;", "    padding: 6px 16px;\n    border-radius: 8px;", 'au_tippflaechen'),
    ('Statistik zurücksetzen 23 px', "    padding: 4px 8px;\n    min-height: 44px;\n  }", "    padding: 4px 8px;\n  }", 'au_tippflaechen'),
    ('Mangala ragt hinaus', '--ma-pit: min(44px, calc((100vw - 52px - 2 * var(--ma-store)) / 6));', '--ma-pit: 52px;', 'au_tippflaechen'),
    ('Schachfeld flach 38 px', '--ch-square: min(44px, calc((100vw - 32px) / 8));', '--ch-square: min(38px, calc((100vw - 32px) / 8));', 'au_tippflaechen'),
    ('Aktionen ragen am schmalen Fenster hinaus', '    [data-abschnitt="aktionen"] button { padding-left: 9px; padding-right: 9px; font-size: 0.88rem; }', '', 'au_tippflaechen'),
    ('Lizenzhinweis überall sichtbar', '  #layerNote .lizenz-schach { display: none; }', '  #layerNote .lizenz-schach { display: inline; }', 'au_hinweis'),
    ('Lizenzhinweis fehlt bei Schach', 'body[data-spiel="chess"] #layerNote .lizenz-schach, body[data-spiel="schule"] #layerNote .lizenz-schach { display: inline; }', 'body[data-spiel="schule"] #layerNote .lizenz-schach { display: inline; }', 'au_hinweis'),
    ('Querformat einspaltig', '    .tab-content.active:not(#schule-view):not(#mangala-view) > [data-abschnitt="brett"] { grid-column: 1; grid-row: 1 / span 40; }',
     '    .tab-content.active:not(#schule-view):not(#mangala-view) > [data-abschnitt="brett"] { grid-column: 2; }', 'au_quer'),
    ('Querformat: Brett zu hoch', '      --ch-square: min(44px, calc(var(--qh) / 8));\n      --mu-board: min(340px, calc(var(--qh) - 32px));', '      --mu-board: 340px;', 'au_quer'),
    ('Querformat: Felder winzig', '      --ot-cell: min(44px, calc((var(--qh) - 34px) / 8));', '      --ot-cell: min(44px, calc((var(--qh) - 34px) / 12));', 'au_quer'),
    ('Querformat: flaches Schachbrett zu hoch', '      --ch-square: min(44px, calc(var(--qh) / 8));', '      --ch-square: 44px;', 'au_quer'),
    ('Zweispaltig auch am Tablet', '@media (orientation: landscape) and (max-height: 560px) {', '@media (min-width: 700px) {', 'au_quer'),
    ('Skriptfehler beim Öffnen', "    this.nameEl.textContent = this.namen.get(tabName);\n    this.zurueckEl.textContent = '‹ Spiele';", "    this.nameEl.textContent = this.namen.get(tabName).gibtsNicht.x;\n    this.zurueckEl.textContent = '‹ Spiele';", 'au_bilder'),
]
env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
nur = sys.argv[1:]
fehler = 0
for name, alt, neu, test in FEHLER:
    if nur and not any(n in name for n in nur):
        continue
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
