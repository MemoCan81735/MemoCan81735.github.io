#!/usr/bin/env python3
"""Holt Straßendaten (OpenStreetMap) für eine Strecke und speichert sie mit Datum und Quelle.
Quelle: die offene OSM-Schnittstelle api.openstreetmap.org (Gebiet in kleinen Kacheln, Overpass war nicht erreichbar).
Nur Standardbibliothek. Aufruf: python3 werkstatt/strecken/abruf.py werkstatt/strecken/auftraege/oer-erkenschwick.json werkstatt/strecken/daten/
Ergebnis: daten/<id>-<JJJJ-MM-TT>.json  (Formatversion 1, Quelle "© OpenStreetMap-Mitwirkende", ODbL)
Jedes Element: {"id", "tags", "geometry": [[lon, lat], ...]}; nur Straßen, Wasser, Grün. Dazu "orte": benannte Gebäude und Orte (Mitte, für Wahrzeichen)."""
import json, sys, time, datetime, urllib.request, urllib.error
import xml.etree.ElementTree as ET

API = "https://api.openstreetmap.org/api/0.6/map?bbox={w:.6f},{s:.6f},{e:.6f},{n:.6f}"
KACHEL = 0.02          # Grad; zu große Kacheln (über 50000 Punkte) werden halbiert
WICHTIG = ("highway", "waterway", "natural", "leisure", "landuse")   # Gebäude brauchen wir nicht (Größe der Datei)
ORTE = ("amenity", "shop", "tourism", "historic", "man_made", "building", "leisure", "religion", "denomination")   # Orte für Wahrzeichen (Gebäude nur mit Namen)
BEHALTEN = ("highway", "name", "waterway", "natural", "leisure", "landuse", "junction", "oneway", "access")
ORT_TAGS = ("name", "amenity", "shop", "tourism", "historic", "man_made", "building", "leisure", "religion", "denomination", "operator", "brand")

def kachel(w, s, e, n, tiefe=0):
    url = API.format(w=w, s=s, e=e, n=n)
    for versuch in range(4):
        try:
            r = urllib.request.Request(url, headers={"User-Agent": "luftrennen-streckenwerkzeug/1 (Offline-Datenabruf)"})
            return ET.fromstring(urllib.request.urlopen(r, timeout=120).read())
        except urllib.error.HTTPError as ex:
            if ex.code in (400, 509) and tiefe < 3:    # zu viele Punkte: in vier Teile teilen
                return None
            time.sleep(3 * (versuch + 1))
        except Exception:
            time.sleep(3 * (versuch + 1))
    raise SystemExit(f"Kachel nicht ladbar: {url}")

def lade(w, s, e, n, tiefe, sammler, orte=None):
    xml = kachel(w, s, e, n, tiefe)
    if xml is None:
        mw, mn = (w + e) / 2, (s + n) / 2
        for a in ((w, s, mw, mn), (mw, s, e, mn), (w, mn, mw, n), (mw, mn, e, n)):
            lade(*a, tiefe + 1, sammler, orte); time.sleep(1)
        return
    punkte = {nd.get("id"): (float(nd.get("lon")), float(nd.get("lat"))) for nd in xml.iter("node")}
    if orte is not None:
        for nd in xml.iter("node"):
            tags = {t.get("k"): t.get("v") for t in nd.findall("tag")}
            if tags.get("name") and any(k in tags for k in ORTE):
                orte["node/" + nd.get("id")] = {"osm": "node/" + nd.get("id"), "tags": {k: v for k, v in tags.items() if k in ORT_TAGS}, "lon": float(nd.get("lon")), "lat": float(nd.get("lat"))}
    for way in xml.iter("way"):
        tags = {t.get("k"): t.get("v") for t in way.findall("tag")}
        refs0 = [nd.get("ref") for nd in way.findall("nd")]
        if orte is not None and tags.get("name") and any(k in tags for k in ORTE) and refs0 and all(r in punkte for r in refs0):
            xs = [punkte[r][0] for r in refs0]; ys = [punkte[r][1] for r in refs0]
            orte["way/" + way.get("id")] = {"osm": "way/" + way.get("id"), "tags": {k: v for k, v in tags.items() if k in ORT_TAGS}, "lon": round(sum(xs) / len(xs), 6), "lat": round(sum(ys) / len(ys), 6)}
        if not any(k in tags for k in WICHTIG):
            continue
        refs = [nd.get("ref") for nd in way.findall("nd")]
        if all(r in punkte for r in refs):
            sammler[way.get("id")] = {"id": int(way.get("id")), "tags": {k: v for k, v in tags.items() if k in BEHALTEN}, "geometry": [list(punkte[r]) for r in refs]}

def hole(auftrag):
    s, w, n, e = auftrag["bbox"]          # Süd, West, Nord, Ost
    sammler, orte = {}, {}
    lon = w
    while lon < e:
        lat = s
        while lat < n:
            lade(lon, lat, min(lon + KACHEL, e), min(lat + KACHEL, n), 0, sammler, orte); time.sleep(1)
            lat += KACHEL
        lon += KACHEL
    return list(sammler.values()), [orte[k] for k in sorted(orte)]

if __name__ == "__main__":
    auftrag = json.load(open(sys.argv[1], encoding="utf-8"))
    elemente, orte = hole(auftrag)
    heute = datetime.date.today().isoformat()      # nur hier, nie im Spiel oder in der Berechnung
    ziel = f"{sys.argv[2].rstrip('/')}/{auftrag['id']}-{heute}.json"
    json.dump({"formatversion": 1, "id": auftrag["id"], "abgerufen": heute, "quelle": "© OpenStreetMap-Mitwirkende (ODbL)",
               "auftrag": auftrag, "elemente": elemente, "orte": orte}, open(ziel, "w", encoding="utf-8"), ensure_ascii=False)
    print(ziel, len(elemente), "Elemente")
