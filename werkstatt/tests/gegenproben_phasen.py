#!/usr/bin/env python3
"""Gegenproben zur Phasen-Prüfung der Spieleseite (werkstatt/phasen_pruefen.py), übernommen aus der App-Vorlage: saubere Fassung ohne Meldung, jede Verletzung wird gemeldet, alte Specs und Entwürfe bleiben unbehelligt."""
import sys, tempfile
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import phasen_pruefen as phasen_check

SPEC = """# S-001: B

**Status:** abgenommen, freigegeben am 06.11.2026, 10:00

## Anwendungsfall
- U-1: tippt
- U-2: sieht

## Prüfszenarien
| PS-1 | Normal | x | AK-1 |
| PS-2 | Grenzwert | y | AK-1 |

## Technisches Design
- Schnittstellen: A ruft B
- Datenformat: keine Speicherung
- Alternativen: X oder Y
- Entscheidung: X, weil einfacher
- Design-Review: 06.11.2026, Agent, keine Befunde

## Kritische Testfälle
- PS-1: Kernerlebnis

## Querschnitt
- Datenschutz: keine Daten
- Sicherheit: geprüft
- Barrierefreiheit: geprüft
- Leistung: 20 ms

## Clean Code
- Clean Code: alle Dateien klein, keine Kopien

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | e2e_eins |
| U-2 | e2e_zwei |

## Dokumentation
- Aktualisiert: docs/funktionen.md

## Veröffentlichung
- Version: 1.0
- Änderungen: neu
- Rückweg: alte Version im Archiv
- Linkprüfung: 06.11.2026 ok
- Lizenzen: keine neuen

## Rückblick
- A-1: erfüllt
"""
FILES = {"werkstatt/specs/S-001-b.md": SPEC, "werkstatt/tests/t.js": "e2e_eins e2e_zwei", "docs/funktionen.md": "x"}


def run(files):
    with tempfile.TemporaryDirectory() as d:
        for rel, t in files.items():
            p = Path(d) / rel; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(t)
        return phasen_check.check(d)


def mut(old, new): return {**FILES, "werkstatt/specs/S-001-b.md": SPEC.replace(old, new)}


PROBEN = [
    ("Design ohne Alternativen", mut("- Alternativen: X oder Y\n", "")),
    ("Design-Review fehlt", mut("- Design-Review: 06.11.2026, Agent, keine Befunde\n", "")),
    ("Querschnitt ohne Sicherheit", mut("- Sicherheit: geprüft\n", "")),
    ("Kritischer Testfall unbekannt", mut("- PS-1: Kernerlebnis", "- PS-9: Kernerlebnis")),
    ("Keine kritischen Testfälle", mut("- PS-1: Kernerlebnis", "")),
    ("Sechs kritische Testfälle", mut("- PS-1: Kernerlebnis", "".join(f"- PS-1: a\n" for _ in range(6)))),
    ("E2E für Schritt fehlt", mut("| U-2 | e2e_zwei |\n", "")),
    ("E2E-Test nicht im Testcode", {**FILES, "werkstatt/tests/t.js": "e2e_eins"}),
    ("Clean Code leer", mut("- Clean Code: alle Dateien klein, keine Kopien", "")),
    ("Dokumentation verweist ins Leere", mut("docs/funktionen.md", "docs/gibt-es-nicht.md")),
    ("Veröffentlichung ohne Rückweg", mut("- Rückweg: alte Version im Archiv\n", "")),
    ("Rückblick mit offenem A-n", mut("- A-1: erfüllt", "- A-1: offen")),
    ("Rückblick fehlt", mut("- A-1: erfüllt", "")),
]
fehler = []
if run(FILES):
    fehler.append("Fehlalarm: saubere Fassung wird beanstandet: %s" % run(FILES))
for name, files in PROBEN:
    if not run(files):
        fehler.append("übersehen: " + name)
ALT = SPEC.replace("06.11.2026, 10:00", "03.11.2026, 23:59").replace("abgenommen,", "abgenommen,")
if run({"werkstatt/specs/S-001-b.md": "# S\n\n**Status:** abgenommen, freigegeben am 03.11.2026, 23:59\n\n## Ziel\nx\n"}):
    fehler.append("Fehlalarm: alte Spec vor dem 04.11.2026 wird beanstandet")
if run({"werkstatt/specs/S-001-b.md": "# S\n\n**Status:** Entwurf\n"}):
    fehler.append("Fehlalarm: Entwurf wird beanstandet")
st = SPEC.replace("abgenommen,", "freigegeben,")
for abschnitt in ("## Clean Code", "## E2E", "## Dokumentation", "## Veröffentlichung", "## Rückblick"):
    st = st.split(abschnitt)[0] if abschnitt == "## Clean Code" else st
if run({"werkstatt/specs/S-001-b.md": st}):
    fehler.append("Fehlalarm: Status freigegeben verlangt nur Phasen 3 bis 6: %s" % run({"werkstatt/specs/S-001-b.md": st}))
for x in fehler: print("  FEHLER ", x)
print("Gegenproben Phasen:", "%d Fehler" % len(fehler) if fehler else "ok (%d Verstöße erkannt, 3 Fehlalarm-Proben)" % len(PROBEN))
sys.exit(1 if fehler else 0)
