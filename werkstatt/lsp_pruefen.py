#!/usr/bin/env python3
"""LSP-Diagnose des HTML-Driftpokal (Spec werkstatt/specs/S-W28).

Aufruf: python3 werkstatt/lsp_pruefen.py [DATEI]   (Standard: driftpokal/index.html)
Zieht die Skriptblöcke ohne src und ohne eingebettete three.js-Bibliothek heraus und prüft sie
mit tsc (checkJs, nur Syntax und Namensfehler). Exit 0 grün, 1 Befund, 2 Umgebung fehlt.
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
STANDARD = os.path.join(WURZEL, "driftpokal", "index.html")
GLOBALS = os.path.join(WURZEL, "werkstatt", "lsp", "globals.d.ts")
BLOCK = re.compile(r"<script\b([^>]*)>(.*?)</script>", re.S)
# Gatter: Syntax (TS1xxx) ohne TS1052 (in JS erlaubt), unbekannte Namen, doppelte Deklarationen.
GATTER = re.compile(r"error (TS1(?!052)\d{3}|TS2304|TS2552|TS2300|TS2451|TS2393):")
ZEILE = re.compile(r"^(\S+?)\((\d+),\d+\): error ")


def spiel_bloecke(text):
    """Liefert (Zeile_in_Datei, Inhalt) je Spielblock. Der three.js-Block wird über das
    Wort "three.js" am Anfang erkannt, damit ein davor eingefügter Zeilenbruch ihn nicht verschiebt."""
    out = []
    for m in BLOCK.finditer(text):
        if "src=" in m.group(1) or not m.group(2).strip():
            continue
        if "three.js" in m.group(2)[:300]:
            continue
        out.append((text.count("\n", 0, m.start(2)) + 1, m.group(2)))
    return out


def zeile_in_datei(n, bloecke):
    """Rechnet eine Zeile des zusammengesetzten Prüfdokuments auf die Zeile der Datei um."""
    rest = n
    for start, inhalt in bloecke:
        zeilen = inhalt.count("\n") + 1
        if rest <= zeilen:
            return start + rest - 1
        rest -= zeilen + 2  # Trennzeile "\n;\n" zwischen den Blöcken
    return None


def main():
    datei = sys.argv[1] if len(sys.argv) > 1 else STANDARD
    if not os.path.isfile(datei):
        print(f"LSP-Diagnose: Datei fehlt: {datei}")
        return 2
    tsc = shutil.which("tsc")
    if not tsc:
        print("LSP-Diagnose: tsc fehlt (npm install -g typescript)")
        return 2
    with open(datei, encoding="utf-8") as f:
        bloecke = spiel_bloecke(f.read())
    if not bloecke:
        print("LSP-Diagnose: kein Spielblock gefunden")
        return 2
    tmp = tempfile.mkdtemp(prefix="lsp_")
    pfad = os.path.join(tmp, "spiel.js")
    with open(pfad, "w", encoding="utf-8") as f:
        f.write("\n;\n".join(inhalt for _, inhalt in bloecke))
    cmd = [tsc, "--allowJs", "--checkJs", "--noEmit", "--skipLibCheck", "--target", "es2020",
           "--module", "es2020", "--lib", "es2020,dom", pfad, GLOBALS]
    p = subprocess.run(cmd, capture_output=True, text=True, cwd=tmp)
    befunde = [z for z in (p.stdout + p.stderr).splitlines() if GATTER.search(z)]
    shutil.rmtree(tmp, ignore_errors=True)
    if not befunde and p.returncode not in (0, 1, 2):
        print("LSP-Diagnose: tsc ist abgebrochen")
        return 2
    if befunde:
        for z in befunde:
            m = ZEILE.match(z)
            ort = f"{os.path.basename(datei)}:{zeile_in_datei(int(m.group(2)), bloecke)}" if m else "?"
            print(f"LSP-Diagnose: {ort} {z.split(': ', 1)[1] if ': ' in z else z}")
        print(f"LSP-Diagnose: {len(befunde)} Befund(e)")
        return 1
    print("LSP-Diagnose: keine Befunde")
    return 0


if __name__ == "__main__":
    sys.exit(main())
