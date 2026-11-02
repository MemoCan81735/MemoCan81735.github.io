#!/usr/bin/env python3
"""Holt die echten Grundrisse (Gebäudeumrisse) der Wahrzeichen aus OpenStreetMap und ergänzt die Datendatei um "grundrisse".
Quelle: api.openstreetmap.org (© OpenStreetMap-Mitwirkende, ODbL). Nur Standardbibliothek.
Aufruf: python3 werkstatt/strecken/grundriss.py werkstatt/strecken/auftraege/oer-erkenschwick.json werkstatt/strecken/daten/<datei>.json
Je Wahrzeichen: der Umriss, der den Ort enthält (sonst der nächste im Umkreis von 40 m); gespeichert wird {"way", "ring": [[lon, lat], ...]}."""
import json, math, sys, time, urllib.request
import xml.etree.ElementTree as ET

R = 0.0015   # Grad Umkreis (etwa 110 m)
MAX_ABSTAND_M = 40

def innen(x, y, ring):
    c = False
    for i in range(len(ring)):
        x1, y1 = ring[i]; x2, y2 = ring[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c

def umriss(lon, lat):
    url = f"https://api.openstreetmap.org/api/0.6/map?bbox={lon - R:.6f},{lat - R:.6f},{lon + R:.6f},{lat + R:.6f}"
    for versuch in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "luftrennen-streckenwerkzeug/1 (Offline-Datenabruf)"})
            xml = ET.fromstring(urllib.request.urlopen(req, timeout=120).read()); break
        except Exception:
            time.sleep(3 * (versuch + 1))
    else:
        raise SystemExit("Abruf fehlgeschlagen: " + url)
    pts = {n.get("id"): (float(n.get("lon")), float(n.get("lat"))) for n in xml.iter("node")}
    beste = None
    for way in xml.iter("way"):
        tags = {t.get("k"): t.get("v") for t in way.findall("tag")}
        if "building" not in tags: continue
        refs = [n.get("ref") for n in way.findall("nd")]
        if len(refs) < 4 or refs[0] != refs[-1] or not all(r in pts for r in refs): continue
        ring = [pts[r] for r in refs[:-1]]
        mx = sum(p[0] for p in ring) / len(ring); my = sum(p[1] for p in ring) / len(ring)
        abst = math.hypot((mx - lon) * 69000, (my - lat) * 111000)
        schluessel = (0 if innen(lon, lat, ring) else 1, abst)
        if (schluessel[0] == 0 or abst <= MAX_ABSTAND_M) and (beste is None or schluessel < beste[0]):
            beste = (schluessel, int(way.get("id")), [list(p) for p in ring])
    return beste

if __name__ == "__main__":
    auftrag = json.load(open(sys.argv[1], encoding="utf-8"))
    daten = json.load(open(sys.argv[2], encoding="utf-8"))
    orte = {o["osm"]: o for o in daten["orte"]}
    grund = {}
    for w in auftrag["wahrzeichen"]:
        o = orte.get(w["osm"])
        if not o: continue
        b = umriss(o["lon"], o["lat"]); time.sleep(1)
        if b: grund[w["osm"]] = {"way": b[1], "ring": b[2]}
        print(w["name"], "->", f"way/{b[1]}, {len(b[2])} Ecken" if b else "kein Umriss")
    daten["grundrisse"] = grund
    json.dump(daten, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
