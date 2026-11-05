#!/usr/bin/env python3
"""Phasen-Prüfung der Spieleseite, übernommen aus der App-Vorlage (vorlagen/app-vorlage/tools/phasen_check.py, docs/phasen.md).
Abweichungen: Specs liegen in werkstatt/specs/S-W*.md, Tests in werkstatt/tests/, Pfade unter "Dokumentation" gelten ab der Repo-Wurzel.
Gilt für Specs mit Freigabe ab 04.11.2026 (S-W15 und später; Prozess eingeführt am 04.11.2026, heutige Arbeiten nachgeholt). Die Seite hat kein src/:
Die Dateigröße steht als Satz unter "Clean Code" (Spieldateien sind bewusst einzelne HTML-Dateien). Je Status:
  freigegeben und später: Technisches Design (Schnittstellen, Datenformat, Alternativen, Entscheidung, Design-Review), Kritische Testfälle
    (1 bis 5 vorhandene PS-n), Querschnitt (Datenschutz, Sicherheit, Barrierefreiheit, Leistung)
  gebaut und später: Clean Code (Satz), E2E (je Schritt U-n ein Test, der unter werkstatt/tests/ vorkommt),
    Dokumentation (Zeilen "Aktualisiert: Pfad", Datei existiert)
  abgenommen: Veröffentlichung (Version, Änderungen, Rückweg, Linkprüfung, Lizenzen), Rückblick (je A-n erfüllt|offen|verworfen, nichts offen)
Aufruf: phasen_check.py [--root DIR]. Ende 1 bei Verstößen."""
import re, sys
from pathlib import Path

STATUS = re.compile(r'^\*\*Status:\*\*\s*(.+)$', re.M)
DATE = re.compile(r'(\d{2})\.(\d{2})\.(\d{4})(?:,\s*(\d{2}):(\d{2}))?')
CUTOFF = (2026, 11, 4, 0, 0)


def section(text, title):
    m = re.search(r'^##\s+' + re.escape(title) + r'.*?$(.*?)(?=^##\s|\Z)', text, re.M | re.S)
    return m.group(1) if m else None


def field(sec, name):
    return re.search(r'^\s*[-*]\s*\**' + name + r'\**:\**\s*(\S.*)$', sec or "", re.M)


def check(root):
    root = Path(root)
    problems = []
    tdir, sdir = root / "werkstatt" / "tests", root / "werkstatt" / "specs"
    tests = "\n".join(p.read_text(errors="replace") for p in tdir.rglob("*") if p.is_file()) if tdir.is_dir() else ""
    for f in sorted(sdir.glob("S-*.md")) if sdir.is_dir() else []:
        text = f.read_text()
        m = STATUS.search(text)
        if not m:
            continue
        status = m.group(1).strip().lower()
        kind = next((k for k in ("entwurf", "freigegeben", "gebaut", "abgenommen") if status.startswith(k)), None)
        d = DATE.search(status)
        if kind in (None, "entwurf") or not d or (int(d.group(3)), int(d.group(2)), int(d.group(1)), int(d.group(4) or 0), int(d.group(5) or 0)) < CUTOFF:
            continue
        n = f.name
        def need(sec_title, fields):
            sec = section(text, sec_title)
            if sec is None:
                problems.append(f"{n}: Abschnitt '{sec_title}' fehlt"); return None
            for fl in fields:
                if not field(sec, fl):
                    problems.append(f"{n}: {sec_title} ohne '{fl}:'")
            return sec
        need("Technisches Design", ("Schnittstellen", "Datenformat", "Alternativen", "Entscheidung", "Design-Review"))
        need("Querschnitt", ("Datenschutz", "Sicherheit", "Barrierefreiheit", "Leistung"))
        kk = section(text, "Kritische Testfälle")
        if kk is None:
            problems.append(f"{n}: Abschnitt 'Kritische Testfälle' fehlt")
        else:
            refs = re.findall(r'^\s*[-*]\s*(PS-\d+):\s*\S', kk, re.M)
            alle = set(re.findall(r'^\|\s*(PS-\d+)\s*\|', text, re.M))
            if not 1 <= len(refs) <= 5:
                problems.append(f"{n}: Kritische Testfälle: 1 bis 5 Szenarien nötig, gefunden {len(refs)}")
            for r in refs:
                if r not in alle:
                    problems.append(f"{n}: Kritischer Testfall {r} steht nicht in den Prüfszenarien")
        if kind in ("gebaut", "abgenommen"):
            if not field(section(text, "Clean Code"), "Clean Code"):
                problems.append(f"{n}: Clean Code ohne Prüfergebnis")
            uf = section(text, "Anwendungsfall") or ""
            steps = sorted(set(re.findall(r'^\s*[-*]\s*\**(U-\d+)\**:', uf, re.M)))
            e2e = section(text, "E2E")
            if e2e is None:
                problems.append(f"{n}: Abschnitt 'E2E' fehlt")
            else:
                rows = dict((a, b.strip()) for a, b in re.findall(r'^\|\s*(U-\d+)\s*\|([^|]+)\|', e2e, re.M))
                for s in steps:
                    if not rows.get(s):
                        problems.append(f"{n}: E2E ohne Test für {s}")
                    elif rows[s] not in tests:
                        problems.append(f"{n}: E2E-Test '{rows[s]}' für {s} steht nicht unter werkstatt/tests/")
            dok = section(text, "Dokumentation")
            pf = re.findall(r'^\s*[-*]\s*Aktualisiert:\s*(\S+)', dok or "", re.M)
            if not pf:
                problems.append(f"{n}: Dokumentation ohne 'Aktualisiert: Pfad'")
            for p in pf:
                if not (root / p).exists():
                    problems.append(f"{n}: Dokumentation verweist auf fehlende Datei {p}")
        if kind == "abgenommen":
            need("Veröffentlichung", ("Version", "Änderungen", "Rückweg", "Linkprüfung", "Lizenzen"))
            rb = section(text, "Rückblick")
            zeilen = re.findall(r'^\s*[-*]\s*(A-\d+):\s*(\w+)', rb or "", re.M)
            if not zeilen:
                problems.append(f"{n}: Rückblick ohne 'A-n: erfüllt|offen|verworfen'")
            for a, s in zeilen:
                if s.lower() not in ("erfüllt", "verworfen"):
                    problems.append(f"{n}: Rückblick {a} ist '{s}' (nur erfüllt oder verworfen erlaubt)")
    return problems


if __name__ == "__main__":
    root = sys.argv[sys.argv.index("--root") + 1] if "--root" in sys.argv else Path(__file__).resolve().parent.parent
    pr = check(root)
    for p in pr:
        print("  FEHLER ", p)
    print("Phasen-Prüfung:", "Verstöße: %d" % len(pr) if pr else "ok")
    sys.exit(1 if pr else 0)
