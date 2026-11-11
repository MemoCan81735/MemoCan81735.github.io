#!/usr/bin/env python3
"""Gegenproben zu S-W24 (Tavla): baut je einen absichtlichen Fehler in eine Kopie der Seite ein
und erwartet, dass der zuständige Test in tavla_test.js rot wird. Aufruf: python3 werkstatt/tests/gegenproben_tavla.py
Ein Eintrag besteht aus (Name, [(alt, neu), ...], Test); jedes "alt" muss genau einmal vorkommen."""
import os, shutil, subprocess, sys, tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATEI = 'brettspiele/index.html'
TEST = os.path.join(WURZEL, 'werkstatt', 'tests', 'tavla_test.js')
FEHLER = [
    ('Aufstellung falsch', [("pkt[7] = 3; pkt[5] = 5;", "pkt[7] = 4; pkt[5] = 5;")], 'ta_regeln'),
    ('Gesperrter Punkt nicht gesperrt', [("if (t >= 0 && t < 24) { if (geg(s, p, t) < 2) out.push", "if (t >= 0 && t < 24) { if (geg(s, p, t) < 6) out.push")], 'ta_regeln'),
    ('Schlagen schlägt nichts', [("if (geg(n, p, z.nach) === 1) {", "if (geg(n, p, z.nach) === 99) {")], 'ta_regeln'),
    ('Bar nicht zuerst', [("if (s.bar[p] > 0) {\n        const t = einwurf(p, w);", "if (s.bar[p] > 9) {\n        const t = einwurf(p, w);")], 'ta_regeln'),
    ('Einwurf spiegelt falsch (Schwarz)', [("const einwurf = (p, w) => (p === 'A' ? 24 - w : w - 1);", "const einwurf = (p, w) => (p === 'A' ? 24 - w : w);")], 'ta_zwang'),
    ('Pasch nur zwei Züge', [("this.rest = a === b ? [a, a, a, a] : [a, b];", "this.rest = a === b ? [a, a] : [a, b];")], 'ta_zwang'),
    ('Pflicht beide Würfel ignoriert', [("let out = alle.filter((z, i) => l[i] === m);", "let out = alle;")], 'ta_zwang'),
    ('Kleinerer statt größerer Würfel', [("const gross = Math.max(...rest);", "const gross = Math.min(...rest);")], 'ta_zwang'),
    ('Kein Aussetzen', [("if (!this.getValidMoves().length) {\n      const wer = this.currentPlayer;", "if (false) {\n      const wer = this.currentPlayer;")], 'ta_zwang'),
    ('Restwürfel verfällt nicht', [("else if (!this.getValidMoves().length) { this.teilweise = true; this._wechsel(); }", "")], 'ta_zwang'),
    ('Abtragen mit Stein außerhalb', [("        if (!heim) continue;\n", "")], 'ta_abtragen'),
    ('Abtragen mit zu großer Zahl von niedrigem Punkt', [("if (!weiter) out.push({ von: i, nach: 'ab', w });", "out.push({ von: i, nach: 'ab', w });")], 'ta_abtragen'),
    ('Mars zählt nicht', [("this.mars = this.ab[o] === 0;", "this.mars = false;")], 'ta_ende'),
    ('Mars schon bei einem abgetragenen Stein', [("this.mars = this.ab[o] === 0;", "this.mars = this.ab[o] <= 1;")], 'ta_ende'),
    ('Würfel 7 angenommen', [("const ok = x => Number.isInteger(x) && x >= 1 && x <= 6;", "const ok = x => Number.isInteger(x) && x >= 1 && x <= 7;")], 'ta_zufall'),
    ('Zweimal würfeln erlaubt', [("if (this.finished || this.phase !== 'wuerfeln') return { invalid: true };", "if (this.finished) return { invalid: true };")], 'ta_zufall'),
    ('Entity erzeugt Zufall', [("this.wurf = [a, b];\n    this.rest", "this.wurf = [a, b]; Math.random();\n    this.rest")], 'ta_zufall'),
    ('Speicher ohne Summenprüfung', [("if (a !== 15 || b !== 15) return false;", "")], 'ta_speicher'),
    ('Speicher ohne Formatversion', [("d.formatversion !== TavlaEntity.FORMAT) return false;", "false) return false;")], 'ta_speicher'),
    ('Zug zurück nimmt Computerzug zurück', [("if (this.vsAI && v.spieler === this.aiPlayer) return false;   // nie einen Computerzug zurücknehmen\n", "")], 'ta_zurueck'),
    ('Fehlzug nur je Runde', [("if (this._entscheideFehler()) { this._plan = null; z = this._zufallsZug(this.boundary.getValidMoves()); }   // je Steinzug\n      else if (this._plan && this._plan.length) {", "if (this._plan && this._plan.length) {")], 'ta_zurueck'),
    ('Speicher: Rest passt nicht zum Wurf', [("for (const v of d.rest) { const i = frei.indexOf(v); if (i < 0) return false; frei.splice(i, 1); }", "")], 'ta_speicher'),
    ('Zug zurück nimmt den Wurf zurück', [("return v.wurfNr === this.boundary.getWurfZaehler();", "return true;")], 'ta_zurueck'),
    ('Übung zählt falschen Punkt', [("    if (ziel !== s.ziel) return { invalid: true, hinweis: true };\n    if (s.ziel === 'wuerfeln')", "    if (s.ziel === 'wuerfeln')")], 'ta_uebung'),
    ('Übung ohne Speichern', [("_speichereEinfuehrung() { if (TavlaUI.einfuehrung) TavlaUI.einfuehrung.markiere(); }", "_speichereEinfuehrung() { }")], 'ta_uebung'),
    ('Neuladen mitten in der Übung gilt als gesehen', [("if (this.uebung && !(TavlaUI.einfuehrung && TavlaUI.einfuehrung.gesehen())) this._starteUebung();", "if (this.uebung && !(TavlaUI.einfuehrung && TavlaUI.einfuehrung.gesehen())) { this._starteUebung(); this._speichereEinfuehrung(); }")], 'ta_uebung'),
    ('Computer ignoriert die Stufe', [("stark:  { tiefe: 2, fehler: 0 }\n  };\n\n  constructor(boundary, aiStrategy = null) {\n    super(boundary, 'B', aiStrategy);   // Weiß", "stark:  { tiefe: 1, fehler: 0 }\n  };\n\n  constructor(boundary, aiStrategy = null) {\n    super(boundary, 'B', aiStrategy);   // Weiß")], 'ta_staerke'),
    ('Leicht macht zu wenig Fehlzüge', [("leicht: { tiefe: 1, fehler: 0.3 },\n    mittel: { tiefe: 1, fehler: 0.05 },", "leicht: { tiefe: 1, fehler: 0.1 },\n    mittel: { tiefe: 1, fehler: 0.05 },")], 'ta_staerke'),
    ('Stark rechnet nur eine Runde voraus', [("if (tiefe < 2 || mit.length === 1) return mit[0].f.zuege;", "if (tiefe < 9 || mit.length === 1) return mit[0].f.zuege;")], 'ta_staerke'),
    ('Statuszeile zu lang', [("return `${kopf}${vor}Du hast ${wurf}. Tippe einen Stein mit Ring.`;", "return `${kopf}${vor}Du hast ${wurf}. Tippe jetzt bitte einen deiner Steine mit dem blauen Ring an, damit die grünen Ziele erscheinen.`;")], 'ta_ui'),
    ('Reihen nur 30 px', [("grid-template-rows: repeat(13, 44px)", "grid-template-rows: repeat(13, 30px)"), ("align-items: center; min-width: 44px; min-height: 44px; padding: 0 6px;", "align-items: center; min-width: 44px; min-height: 30px; padding: 0 6px;")], 'ta_ui'),
    ('Kein Ploppen am Ziel', [("if (neu.has(i) && n) cls += ' neu';", "")], 'ta_ui'),
    ('Kein Ton beim Würfeln', [("super._rueckmeldung(result, bewegt || neu);", "super._rueckmeldung(result, bewegt);")], 'ta_ui'),
    ('Eingabe während der Computer zieht', [("if (this._pausiert() || this.control.isAiTurn() || this.control.isGameOver()) return;\n    this._hinweisText = null;\n    const outcome", "if (this._pausiert() || this.control.isGameOver()) return;\n    this._hinweisText = null;\n    const outcome"), ("if (this.boundary.isGameOver() || this.boundary.getPhase() !== 'ziehen' || this.isAiTurn()) return { invalid: true };\n    const zuege", "if (this.boundary.isGameOver() || this.boundary.getPhase() !== 'ziehen') return { invalid: true };\n    const zuege")], 'ta_ui'),
    ('Computer wartet nicht auf die Karten', [("    if (this._pausiert()) return;   // Computer wartet, bis Übung oder Karten zu sind\n    const outcome = await this.performAiMove();\n    if (outcome.invalid) { if (outcome.erneut) this._weiterNachPause(); return; }\n    this.afterMove(outcome.result);\n  }\n  performAiMove() { return this.control.performAiAction(); }", "    const outcome = await this.performAiMove();\n    if (outcome.invalid) { if (outcome.erneut) this._weiterNachPause(); return; }\n    this.afterMove(outcome.result);\n  }\n  performAiMove() { return this.control.performAiAction(); }"), ("if (this._pause || !this.isAiTurn()) return { invalid: true };\n    if (this._aiLaeuft) return { invalid: true };\n    this._aiLaeuft = true;\n    try {\n      const partie = this._partie;\n      if (this.boundary.getPhase() === 'wuerfeln')", "if (!this.isAiTurn()) return { invalid: true };\n    if (this._aiLaeuft) return { invalid: true };\n    this._aiLaeuft = true;\n    try {\n      const partie = this._partie;\n      if (this.boundary.getPhase() === 'wuerfeln')")], 'ta_hilfe'),
    ('Karte ohne Mars', [("Hat der Verlierer dann noch keinen Stein abgetragen, ist es Mars: doppelter Sieg.", "Hat der Verlierer dann noch keinen Stein abgetragen, gibt es einen Bonus.")], 'ta_hilfe'),
    ('Lernhilfe aus warnt trotzdem', [("if (lernen) v.gefahr = e.getGefaehrdet(p);", "v.gefahr = e.getGefaehrdet(p);")], 'ta_lernen'),
    ('3D ohne letzten Stein', [("for (let k = 0; k < n; k++) lege(farbe, this._steinPos(i, k), geaendert && k === n - 1, i);", "for (let k = 0; k < n - 1; k++) lege(farbe, this._steinPos(i, k), geaendert && k === n - 1, i);")], 'ta_3d'),
    ('3D-Tippen wählt falsches Feld', [("this.ui.handlePunktClick(f === 24 ? 'bar' : f === 25 ? 'ab' : f);", "this.ui.handlePunktClick(f === 24 ? 'bar' : f === 25 ? 'ab' : (f + 1) % 24);")], 'ta_3d'),
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
