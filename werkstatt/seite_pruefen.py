#!/usr/bin/env python3
"""Statische Prüfung der Spieleseite (Spec werkstatt/specs/S-W01).

Aufruf:
  python3 werkstatt/seite_pruefen.py [ORDNER]      prüft die Seite (Standard: Repo-Wurzel)
  python3 werkstatt/seite_pruefen.py --gegenproben  baut absichtliche Verstöße ein und erwartet rot,
                                                    dazu erlaubte Grenzfälle, die grün bleiben müssen
Ausgabe je Prüfung: OK oder FEHLER mit Fundstelle. Rückgabewert 0 nur, wenn alles grün ist.
"""
import hashlib
import json
import os
import re
import shutil
import sys
import tempfile

SEITEN = ["index.html", "driftpokal/index.html", "luftdrift/index.html", "brettspiele/index.html"]
SPIELE = SEITEN[1:]
# Fremde Bibliotheken: E-Mail-Adressen der Autoren in deren Lizenztexten sind erlaubt.
FREMD = ("brettspiele/lib/", "luftdrift/three.min.js")
# Autoren-Adressen aus eingebetteten fremden Bibliotheken (FXAA-Shader in three.js im Driftpokal).
ERLAUBTE_EMAILS = {"biro@archilogic.com", "gameworks@nvidia.com"}
# Gesperrte Wörter nur als SHA-256 (klein geschrieben), damit sie nicht selbst auf der Seite stehen.
GESPERRT = {
    "0be7018dbc14560c39dff0e1a4b74eb095403cdbde11d4206c0952da51792f64",
    "085f61772fbab093762c69d8c9140029e568b01854ccd169dfbb7528744f9187",
    "93b00ba5752ecac038e790074c6ca4245c8923adda2875652ca8c1cbe937fe5d",  # Testwort der Gegenproben
}
FACHSPRACHE = re.compile(r"\b(BCE|Entity|Boundary|Fassung)\b")
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}")
LADE_TAGS = re.compile(r"<(script|link|img|iframe|source|audio|video|embed)\b[^>]*>", re.I)
ATTR = re.compile(r"""\b(src|href)\s*=\s*["']([^"']*)["']""", re.I)
JS_PFADE = re.compile(r"""(?:register|fetch|new\s+Worker|importScripts)\s*\(\s*["']([^"'+]+)["']\s*\)""")
CSS_URL = re.compile(r"""(?:url\(\s*["']?|@import\s+["'])(https?:)?//""", re.I)


def lies(wurzel, pfad):
    with open(os.path.join(wurzel, pfad), encoding="utf-8", errors="replace") as f:
        return f.read()


def ohne_code(html):
    """Sichtbarer Text: ohne script, style und Kommentare, Tags entfernt, Titel bleibt."""
    t = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    t = re.sub(r"<(script|style)\b.*?</\1>", " ", t, flags=re.S | re.I)
    return re.sub(r"<[^>]+>", " ", t)


def ist_lokal(url):
    return not re.match(r"^([a-z][a-z0-9+.-]*:|//|#)", url, re.I)


def ausgelieferte_dateien(wurzel):
    for ordner, unter, dateien in os.walk(wurzel):
        unter[:] = [u for u in unter if u not in (".git", "node_modules")]
        for d in dateien:
            if d.endswith((".html", ".js", ".json", ".webmanifest", ".md", ".txt", ".css", ".svg")):
                yield os.path.relpath(os.path.join(ordner, d), wurzel).replace(os.sep, "/")


def S1_grundgeruest(w):
    f = []
    for s in SEITEN:
        h = lies(w, s)[:3000].lower()
        if not h.lstrip().startswith("<!doctype html"):
            f.append(f"{s}: doctype fehlt")
        if "charset" not in h:
            f.append(f"{s}: charset fehlt")
        if not re.search(r'name="viewport"[^>]*width=device-width', h):
            f.append(f"{s}: viewport fehlt")
    return f


def S2_keine_fremden_server(w):
    f = []
    for s in SEITEN:
        h = lies(w, s)
        for tag in LADE_TAGS.finditer(h):
            if tag.group(1).lower() == "link" and not re.search(r'rel\s*=\s*["\'][^"\']*(stylesheet|icon|manifest|preload|modulepreload|apple-touch-icon)', tag.group(0), re.I):
                continue
            for _, url in ATTR.findall(tag.group(0)):
                if re.match(r"^(https?:)?//", url, re.I):
                    f.append(f"{s}: lädt fremd {url[:80]}")
        for m in JS_PFADE.finditer(h):
            if re.match(r"^(https?:)?//", m.group(1), re.I):
                f.append(f"{s}: lädt fremd per Skript {m.group(1)[:80]}")
        if CSS_URL.search(h):
            f.append(f"{s}: CSS lädt von fremdem Server")
    return f


def S3_verweise_vorhanden(w):
    f = []
    for s in SEITEN:
        h = lies(w, s)
        basis = os.path.dirname(s)
        urls = [u for _, u in ATTR.findall(h)] + JS_PFADE.findall(h)
        for u in urls:
            u = u.split("#")[0].split("?")[0]
            if not u or not ist_lokal(u):
                continue
            ziel = os.path.normpath(os.path.join(w, basis, u))
            if u.endswith("/"):
                ziel = os.path.join(ziel, "index.html")
            if not os.path.exists(ziel):
                f.append(f"{s}: Verweis ins Leere {u}")
    return f


def S4_zurueck_link(w):
    f = []
    for s in SPIELE:
        h = lies(w, s)
        if not re.search(r'<a\b[^>]*class="[^"]*\bng-zurueck\b[^"]*"[^>]*href="\.\./"|<a\b[^>]*href="\.\./"[^>]*class="[^"]*\bng-zurueck\b', h):
            f.append(f"{s}: Zurück-Link (a.ng-zurueck href=\"../\") fehlt")
    return f


def S5_symbol_manifest(w):
    f = []
    for s in SEITEN:
        h = lies(w, s)
        basis = os.path.dirname(s)
        m = re.search(r'<link\b[^>]*rel="manifest"[^>]*href="([^"]+)"', h)
        if not re.search(r'<link\b[^>]*rel="icon"', h):
            f.append(f"{s}: rel=icon fehlt")
        if not m or not ist_lokal(m.group(1)):
            f.append(f"{s}: Manifest fehlt oder ist keine eigene Datei")
            continue
        mpfad = os.path.normpath(os.path.join(w, basis, m.group(1)))
        if not os.path.exists(mpfad):
            f.append(f"{s}: Manifest-Datei fehlt {m.group(1)}")
            continue
        try:
            daten = json.load(open(mpfad, encoding="utf-8"))
        except ValueError as e:
            f.append(f"{s}: Manifest kein gültiges JSON ({e})")
            continue
        groessen = set()
        for icon in daten.get("icons", []):
            ip = os.path.normpath(os.path.join(os.path.dirname(mpfad), icon.get("src", "")))
            if not os.path.exists(ip):
                f.append(f"{s}: Symbol fehlt {icon.get('src')}")
            else:
                groessen.add(icon.get("sizes"))
        for g in ("192x192", "512x512"):
            if g not in groessen:
                f.append(f"{s}: Symbol {g} fehlt im Manifest")
    return f


def S6_anonym(w):
    f = []
    for d in ausgelieferte_dateien(w):
        t = lies(w, d)
        if not d.startswith(FREMD):
            for m in EMAIL.finditer(t):
                if m.group(0).lower() in ERLAUBTE_EMAILS:
                    continue
                f.append(f"{d}: E-Mail-Adresse {m.group(0)[:3]}…")
        for wort in set(re.findall(r"[a-zäöüß]+", t.lower())):
            if hashlib.sha256(wort.encode()).hexdigest() in GESPERRT:
                f.append(f"{d}: gesperrter Name gefunden")
    return f


def S7_keine_fachsprache(w):
    f = []
    for s in SEITEN:
        for m in FACHSPRACHE.finditer(ohne_code(lies(w, s))):
            f.append(f"{s}: Fachsprache '{m.group(0)}' im sichtbaren Text")
    return f


PRUEFUNGEN = [S1_grundgeruest, S2_keine_fremden_server, S3_verweise_vorhanden, S4_zurueck_link,
              S5_symbol_manifest, S6_anonym, S7_keine_fachsprache]


def pruefe(w, leise=False):
    rot = {}
    for p in PRUEFUNGEN:
        f = p(w)
        if f:
            rot[p.__name__] = f
        if not leise:
            print(("OK     " if not f else "FEHLER ") + p.__name__)
            for z in f[:12]:
                print("         " + z)
    return rot


def ersetze(datei, alt, neu):
    def tu(w):
        p = os.path.join(w, datei)
        t = open(p, encoding="utf-8").read()
        assert alt in t, f"Gegenprobe greift nicht: '{alt}' fehlt in {datei}"
        open(p, "w", encoding="utf-8").write(t.replace(alt, neu, 1))
    return tu


def manifest_kaputt(w):
    p = os.path.join(w, "luftdrift/manifest.webmanifest")
    d = json.load(open(p, encoding="utf-8"))
    d["icons"][0]["src"] = "../bilder/gibtsnicht.png"
    json.dump(d, open(p, "w", encoding="utf-8"))


VERSTOESSE = [
    ("CDN-Skript", ersetze("luftdrift/index.html", "<title>", '<script src="https://cdnjs.cloudflare.com/x.js"></script><title>'), "S2_keine_fremden_server"),
    ("Google Fonts", ersetze("index.html", "</head>", '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter"></head>'), "S2_keine_fremden_server"),
    ("CSS-Import fremd", ersetze("index.html", "<style>", "<style>@import 'https://example.org/a.css';"), "S2_keine_fremden_server"),
    ("fehlende Datei", ersetze("brettspiele/index.html", "</body>", '<img src="bild-fehlt.png"></body>'), "S3_verweise_vorhanden"),
    ("sw.js ohne Datei", ersetze("brettspiele/index.html", "</body>", "<script>navigator.serviceWorker.register('./sw.js')</script></body>"), "S3_verweise_vorhanden"),
    ("Zurück-Link weg", ersetze("driftpokal/index.html", "ng-zurueck", "ng-weg"), "S4_zurueck_link"),
    ("viewport weg", ersetze("luftdrift/index.html", 'name="viewport"', 'name="vp"'), "S1_grundgeruest"),
    ("E-Mail im Text", ersetze("index.html", "</footer>", " test@example.org</footer>"), "S6_anonym"),
    ("gesperrter Name", ersetze("index.html", "</footer>", " ZZGegenprobe</footer>"), "S6_anonym"),
    ("Fachsprache im Titel", ersetze("brettspiele/index.html", "<title>Brettspiele", "<title>Brettspiele (BCE-Architektur)"), "S7_keine_fachsprache"),
    ("Manifest weg", ersetze("driftpokal/index.html", 'rel="manifest"', 'rel="x-manifest"'), "S5_symbol_manifest"),
    ("Manifest-Symbol fehlt", manifest_kaputt, "S5_symbol_manifest"),
]

FEHLALARME = [
    ("Link nach außen", ersetze("index.html", "</footer>", ' <a href="https://github.com/x/y">Quelle</a></footer>')),
    ("data:-Bild", ersetze("index.html", "</footer>", ' <img src="data:image/png;base64,AAAA" alt=""></footer>')),
    ("Anker", ersetze("index.html", "</footer>", ' <a href="#oben">oben</a></footer>')),
    ("@media im CSS", ersetze("index.html", "<style>", "<style>@media (max-width: 1px) { body { margin: 0 } }")),
    ("Wort Entität", ersetze("index.html", "</footer>", " Entität</footer>")),
    ("Boundary im Skript", ersetze("index.html", "</body>", "<script>const Boundary = 1;</script></body>")),
]


def gegenproben(w):
    if pruefe(w, leise=True):
        print("Gegenproben nicht möglich: die Seite selbst ist nicht grün.")
        return 1
    fehler = 0
    for name, tu, erwartet in VERSTOESSE:
        with tempfile.TemporaryDirectory() as tmp:
            kopie = os.path.join(tmp, "s")
            shutil.copytree(w, kopie, ignore=shutil.ignore_patterns(".git", "node_modules"))
            tu(kopie)
            rot = pruefe(kopie, leise=True)
            gut = erwartet in rot
            fehler += not gut
            print(("OK     " if gut else "FEHLER ") + f"Verstoß '{name}' -> {erwartet} " + ("rot" if gut else f"NICHT erkannt (rot: {list(rot)})"))
    for name, tu in FEHLALARME:
        with tempfile.TemporaryDirectory() as tmp:
            kopie = os.path.join(tmp, "s")
            shutil.copytree(w, kopie, ignore=shutil.ignore_patterns(".git", "node_modules"))
            tu(kopie)
            rot = pruefe(kopie, leise=True)
            fehler += bool(rot)
            print(("OK     " if not rot else "FEHLER ") + f"Fehlalarm-Probe '{name}' " + ("bleibt grün" if not rot else f"schlägt an: {rot}"))
    # Wiederholbarkeit: zweimal gleiches Ergebnis
    gleich = pruefe(w, leise=True) == pruefe(w, leise=True)
    fehler += not gleich
    print(("OK     " if gleich else "FEHLER ") + "Wiederholbarkeit")
    return 1 if fehler else 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    wurzel = os.path.abspath(args[0] if args else os.path.join(os.path.dirname(__file__), ".."))
    if "--gegenproben" in sys.argv:
        sys.exit(gegenproben(wurzel))
    sys.exit(1 if pruefe(wurzel) else 0)
