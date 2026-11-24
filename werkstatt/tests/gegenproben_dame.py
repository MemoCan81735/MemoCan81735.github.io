#!/usr/bin/env python3
"""Gegenproben zu S-W23 (Dame): baut je einen absichtlichen Fehler in eine Kopie der Seite ein und erwartet, dass der
zuständige Test in dame_test.js rot wird (Verstoß). Die Fehlalarm-Proben ändern etwas Harmloses und erwarten, dass der
Test grün bleibt. Aufruf: python3 werkstatt/tests/gegenproben_dame.py [Namensteil ...]
Ein Eintrag kann mehrere Ersetzungen haben (Liste aus Paaren); jeder Textanker muss genau einmal vorkommen."""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'dame_test.js')
SCHLAG_BLOCK = ("      if (!weiter && weg.length) {\n        if (weg.length > meiste) { meiste = weg.length; schlaege.length = 0; }\n"
                "        if (weg.length === meiste) schlaege.push({ von: pfad[0], pfad: pfad.slice(1), schlaege: weg });\n      }")
RUHIG_SCHLEIFE = "      for (let d = 0; d < 4; d++) {\n        if (!dame && d !== vor && d < 2) continue;\n        const [dr, dc] = R[d];\n        for (let n = 1; ; n++) {"

# (Name, [(alt, neu), ...], Test)  -- rot erwartet
FEHLER = [
    ('Umwandlung mitten im Sprung', [("folge(b, ziel, dame, d, [...pfad, ziel], [...weg, opfer]);",
        "folge(b, ziel, dame || (spieler === 'W' ? ziel < 8 : ziel >= 56), d, [...pfad, ziel], [...weg, opfer]);")], 'da_dame'),
    ('Landefeld ohne Fortsetzung erlaubt', [("folge(b, ziel, dame, d, [...pfad, ziel], [...weg, opfer]);",
        "folge(b, ziel, dame, d, [...pfad, ziel], [...weg, opfer]); if (dame && weg.length === 0) schlaege.push({ von: pfad[0], pfad: [...pfad.slice(1), ziel], schlaege: [...weg, opfer] });")], 'da_dame'),
    ('Dame zählt in der Mehrheit doppelt', [(SCHLAG_BLOCK,
        "      if (!weiter && weg.length) {\n        const g = weg.reduce((n, o) => n + (cells[o].length === 2 ? 2 : 1), 0);\n        if (g > meiste) { meiste = g; schlaege.length = 0; }\n"
        "        if (g === meiste) schlaege.push({ von: pfad[0], pfad: pfad.slice(1), schlaege: weg });\n      }")], 'da_schlag'),
    ('Mehrheitsregel entfernt', [(SCHLAG_BLOCK,
        "      if (!weiter && weg.length) {\n        if (weg.length > meiste) { meiste = weg.length; }\n"
        "        schlaege.push({ von: pfad[0], pfad: pfad.slice(1), schlaege: weg });\n      }")], 'da_schlag'),
    ('Schlagzwang entfernt', [("      if (meiste) continue;\n", ""), ("return meiste ? schlaege : ruhig;", "return [...schlaege, ...ruhig];")], 'da_schlag'),
    ('Kehrtwende erlaubt', [("        if (letzte >= 0 && d === (letzte ^ 1)) continue;     // keine Kehrtwende\n", "")], 'da_schlag'),
    ('Worker-Funktion greift auf die Klasse zu', [("const vor = spieler === 'W' ? 0 : 1;", "const vor = (DameEntity.RUHE_MAX, spieler === 'W' ? 0 : 1);")], 'da_staerke'),
    ('Kaputter Stand wird geladen', [("  static pruefe(d) {\n", "  static pruefe(d) {\n    return !!d && Array.isArray(d.cells);\n")], 'da_speicher'),
    ('Merker geht beim Speichern verloren', [("...(e.dameEinfuehrung === true ? { dameEinfuehrung: true } : {}), ", "")], 'da_uebung'),
    ('Rückwärtszug erlaubt', [(RUHIG_SCHLEIFE, "      for (let d = 0; d < 4; d++) {\n        const [dr, dc] = R[d];\n        for (let n = 1; ; n++) {")], 'da_regeln'),
    ('Stein zieht schräg', [("      if (meiste) continue;\n", "      if (meiste) continue;\n      { const z = feld(r + (vor ? 1 : -1), c + 1); if (!dame && z >= 0 && cells[z] === null) ruhig.push({ von: i, pfad: [z], schlaege: [] }); }\n")], 'da_regeln'),
    ('Remis ohne Zählung', [("else if (oft >= 3 || this.ruhe >= DameEntity.RUHE_MAX) {", "else if (false) {")], 'da_ende'),
    ('Dreifache Stellung zählt nicht', [("else if (oft >= 3 || this.ruhe >= DameEntity.RUHE_MAX) {", "else if (this.ruhe >= DameEntity.RUHE_MAX) {")], 'da_ende'),
    ('60 Züge ohne Schlag zählen nicht', [("else if (oft >= 3 || this.ruhe >= DameEntity.RUHE_MAX) {", "else if (oft >= 3) {")], 'da_ende'),
    ('Tippfläche 30 px', [("--da-feld: min(44px, calc((100vw - 32px) / 8));", "--da-feld: min(30px, calc((100vw - 32px) / 8));")], 'da_markierung'),
    ('Übung ohne Speichern', [("_speichereEinfuehrung() { if (GameUI.einst) GameUI.einst.setzeDameEinfuehrung(); }", "_speichereEinfuehrung() { }")], 'da_uebung'),
    ('? verändert die Stellung', [("_hilfeOeffnen() { this.hilfeEl.hidden = false; this._pausiert(); try { this.hilfeEl.focus({ preventScroll: true }); } catch (e) { } }",
        "_hilfeOeffnen() { this.hilfeEl.hidden = false; this._pausiert(); this.control.restartGame(); try { this.hilfeEl.focus({ preventScroll: true }); } catch (e) { } }")], 'da_hilfe'),
    ('Computer: unzulässige Antwort ungeprüft', [("if (!z || !Array.isArray(z.pfad) || !this.boundary.kannZiehen(z.von, z.pfad)) z = this._zufallsZug(this.boundary.getZuege());", "if (!z) z = this._zufallsZug(this.boundary.getZuege());")], 'da_schlag'),
    ('Stark rechnet nur 1 Halbzug', [("stark:  { tiefe: 4, fehler: 0 }\n  };\n  static KNOTEN = 60000;\n", "stark:  { tiefe: 1, fehler: 0 }\n  };\n  static KNOTEN = 60000;\n")], 'da_staerke'),
    ('Zug zurück mitten im Sprung nimmt den Zug zurück', [("if (this.teil.length) { this._auswahlWeg(); return { invalid: false }; }", "")], 'da_speicher'),
    ('Sprechblase fehlt', [("reihe >= 4) ? ' oben' : '');\n      blase.textContent = 'Hier tippen';", "reihe >= 4) ? ' oben' : '');\n      blase.textContent = '';")], 'da_uebung'),
    ('Falsches Feld in der Übung ohne Hinweis', [("this._uebungStatus = 'Nicht dort: tippe auf das leuchtende Feld.';", "this._uebungStatus = null;")], 'da_uebung'),
    ('Computer zieht trotz offener Karten', [("  async runAiTurn() {\n    if (this._pausiert()) return;\n    const outcome = await this.performAiMove();\n    if (outcome.invalid) { if (outcome.erneut)", "  async runAiTurn() {\n    const outcome = await this.performAiMove();\n    if (outcome.invalid) { if (outcome.erneut)"),
        ("if (this._pause || !this.isAiTurn()) return { invalid: true };\n    if (this._aiLaeuft) return { invalid: true };\n    this._aiLaeuft = true;", "if (!this.isAiTurn()) return { invalid: true };\n    if (this._aiLaeuft) return { invalid: true };\n    this._aiLaeuft = true;"),
        ("if (partie !== this._partie || this._pause || !this.isAiTurn()) return { invalid: true, erneut: true };", "if (partie !== this._partie || !this.isAiTurn()) return { invalid: true, erneut: true };")], 'da_hilfe'),
    ('Fertig gerechneter Zug landet trotz Karten', [("if (partie !== this._partie || this._pause || !this.isAiTurn()) return { invalid: true, erneut: true };", "if (partie !== this._partie || !this.isAiTurn()) return { invalid: true, erneut: true };")], 'da_hilfe'),
    ('Verfallene Rechnung wird nicht neu angestoßen', [("if (outcome.invalid) { if (outcome.erneut) this._weiterNachPause(); return; }\n    if (outcome.zug)", "if (outcome.invalid) return;\n    if (outcome.zug)")], 'da_hilfe'),
    ('Seitwärtszug setzt Zähler zurück', [("const fest = zug.schlaege.length > 0 || (this.cells[von].length === 1 && (pfad[0] >> 3) !== (von >> 3));", "const fest = zug.schlaege.length > 0 || this.cells[von].length === 1;")], 'da_ende'),
    ('Suche ignoriert die Tiefe', [("tiefe - 1, -Infinity, -bw, 1)", "0, -Infinity, -bw, 1)")], 'da_staerke'),
    ('Abbruch übernimmt unvollständig bewerteten Zug', [("      if (abbruch && best !== null) break;\n", "")], 'da_staerke'),
    ('Hinweis bei gesperrtem Stein fehlt', [("this._kurzHinweis('Schlagen ist Pflicht.');", "")], 'da_markierung'),
    ('Tipp-Ring in der Farbe des Ziehbar-Rings', [("    this.markMat.tipp = new T.MeshBasicMaterial({ color: 0xff9f0a, transparent: true, opacity: 0.95 });   // Tipp orange, Ziehbar-Ring blau\n", "")], 'da_dreid'),
    ('Geschlagene Scheibe bleibt im räumlichen Brett', [("weg.position.y = -(t - start) / 250 * 1.2; }, ende: () => { this.figuren.remove(weg); } });", "weg.position.y = -(t - start) / 250 * 1.2; }, ende: () => { } });")], 'da_dreid'),
    ('Esc schließt die Karten nicht', [("    this.hilfeEl.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !this.hilfeEl.hidden) this._hilfeSchliessen(); });\n", "")], 'da_hilfe'),
    ('Übung ohne Speicher wirft einen Fehler', [("  recordResult(winner) { return this._repo ? super.recordResult(winner) : Promise.resolve(); }\n", "")], 'da_uebung'),
    ('Abbiegen im Sprung verboten (zu streng)', [("        if (letzte >= 0 && d === (letzte ^ 1)) continue;     // keine Kehrtwende\n", "        if (letzte >= 0 && d !== letzte) continue;\n")], 'da_schlag'),
    ('Stein darf nicht seitwärts ziehen (zu streng)', [(RUHIG_SCHLEIFE, "      for (let d = 0; d < 4; d++) {\n        if (!dame && d !== vor) continue;\n        const [dr, dc] = R[d];\n        for (let n = 1; ; n++) {")], 'da_regeln'),
    ('Dame darf nicht zurück (zu streng)', [(RUHIG_SCHLEIFE, "      for (let d = 0; d < 4; d++) {\n        if (d !== vor && d < 2) continue;\n        const [dr, dc] = R[d];\n        for (let n = 1; ; n++) {")], 'da_dame'),
    ('Nur ein Schlagweg erlaubt (zu streng)', [("        if (weg.length === meiste) schlaege.push({ von: pfad[0], pfad: pfad.slice(1), schlaege: weg });", "        if (weg.length === meiste && schlaege.length === 0) schlaege.push({ von: pfad[0], pfad: pfad.slice(1), schlaege: weg });")], 'da_schlag'),
    ('Gültiger alter Stand wird verworfen (zu streng)', [("if (!Number.isInteger(d.ruhe) || d.ruhe < 0 || d.ruhe >= DameEntity.RUHE_MAX) return false;", "if (!Number.isInteger(d.ruhe) || d.ruhe <= 0 || d.ruhe >= DameEntity.RUHE_MAX) return false;")], 'da_speicher'),
    ('Letzter Zug nicht markiert', [("if (zuletzt.has(i)) cls += ' zuletzt';", "")], 'da_markierung'),
    ('Krone fehlt an der Dame', [("${dame ? `<g class=\"da-krone\">${DameUI.KRONE}</g>` : ''}", "")], 'da_markierung'),
    ('Steine mit gleicher Helligkeit', [('<circle cx="20" cy="20" r="18.500" fill="#1f1f22" stroke="#000" stroke-width="1.600"/>', '<circle cx="20" cy="20" r="18.500" fill="#e8e4d8" stroke="#000" stroke-width="1.600"/>')], 'da_bilder'),
    ('Statuszeile mit Fachwort', [("return `${vor}Weiter schlagen: tippe das nächste grüne Feld.`;", "return `${vor}Weiter schlagen: tippe das nächste grüne Feld (Kehrtwende verboten).`;")], 'da_bilder'),
]

# Fehlalarm: harmlose Änderung, der Test muss grün bleiben
FEHLALARM = [
    ('Fehlalarm: Felder 46 px statt 44 px', [("--da-feld: min(44px, calc((100vw - 32px) / 8));", "--da-feld: min(46px, calc((100vw - 32px) / 8));")], 'da_markierung'),
    ('Fehlalarm: anderer Text der Regelkarte Ziehen', [("Ein Stein zieht ein Feld nach vorn oder zur Seite, nie zurück und nie schräg. Weiß beginnt und zieht nach oben.", "Ein Stein zieht immer genau ein Feld: nach vorn oder zur Seite. Weiß beginnt.")], 'da_hilfe'),
    ('Fehlalarm: anderer Lobtext in der Übung', [("gut: 'Gut gezogen! Nach vorn oder zur Seite, nie zurück und nie schräg.'", "gut: 'Prima! Nach vorn oder zur Seite.'")], 'da_uebung'),
]

env = dict(os.environ)
env.setdefault('NODE_PATH', subprocess.run(['npm', 'root', '-g'], capture_output=True, text=True).stdout.strip())
nur = sys.argv[1:]
fehler = 0
for name, ersetzungen, test, soll_rot in [(n, e, t, True) for n, e, t in FEHLER] + [(n, e, t, False) for n, e, t in FEHLALARM]:
    if nur and not any(n in name for n in nur):
        continue
    with tempfile.TemporaryDirectory() as tmp:
        kopie = os.path.join(tmp, 's')
        shutil.copytree(WURZEL, kopie, ignore=shutil.ignore_patterns('.git'))
        p = os.path.join(kopie, DATEI)
        t = open(p, encoding='utf-8').read()
        for alt, neu in ersetzungen:
            if t.count(alt) != 1:
                print(f'FEHLER Gegenprobe "{name}" greift nicht ({t.count(alt)} Treffer für "{alt[:50]}")'); fehler += 1; break
            t = t.replace(alt, neu)
        else:
            open(p, 'w', encoding='utf-8').write(t)
            r = subprocess.run(['node', TEST, kopie], env={**env, 'NUR': test}, capture_output=True, text=True, timeout=600)
            rot = r.returncode != 0 and f'FEHLER {test}' in r.stdout
            ok = rot == soll_rot
            fehler += not ok
            if soll_rot: print(('OK     ' if ok else 'FEHLER ') + f'"{name}" -> {test} ' + ('rot' if rot else 'NICHT erkannt'))
            else: print(('OK     ' if ok else 'FEHLER ') + f'"{name}" -> {test} ' + ('bleibt grün' if not rot else 'schlägt fälschlich an: ' + r.stdout[-300:]))
sys.exit(1 if fehler else 0)
