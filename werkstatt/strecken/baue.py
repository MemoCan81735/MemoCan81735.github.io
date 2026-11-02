#!/usr/bin/env python3
"""Baut aus Straßendaten und einem Auftrag eine fahrbare Strecke für den Driftpokal (S-W11).
Aufruf: python3 baue.py <auftrag.json> <daten.json> <ziel.json>
Weder Uhrzeit noch Zufall: dieselben Eingaben ergeben dieselbe Datei. Fehler: Meldung "FEHLER: ..." auf stderr, Rückgabewert 1."""
import heapq, json, math, sys

OK_ARTEN = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street', 'service'}
BONUS = 0.35          # genannte Straßen kosten nur 35 % (der Weg bleibt auf ihnen)
RADIUS_ZIEL = 60.0    # kleinster Kurvenradius der geglätteten Linie in Spieleinheiten (geprüft wird ≥ 45 mit dem echten Spline)
PUNKTE_BEREICH = range(20, 31)   # Zahl der Stützpunkte: die mit dem weichsten Spline (größter kleinster Radius) gewinnt, Gleichstand: näher an 24
STRECKUNG = 1.5
ABSTAND_MIN = 100.0   # nicht benachbarte Teile der Strecke mindestens so weit auseinander
RADIUS_MIN = 48.0     # darunter wird abgelehnt (geprüft wird ≥ 45 im Test)
RAUM = (120.0, 1080.0)  # Strecke liegt in diesem Bereich des Spielraums (1200)
FLAECHE_MIN = 0.02    # Fläche / Länge² einer Runde (Hin-und-zurück-Wege haben ~0)

class Fehler(Exception):
    pass

URSPRUNG = [7.26, 51.64]      # (Länge, Breite) des Nullpunkts; wird aus dem Gebiet des Auftrags gesetzt

def meter(c):
    return ((c[0] - URSPRUNG[0]) * math.cos(math.radians(URSPRUNG[1])) * 111320.0, (c[1] - URSPRUNG[1]) * 111320.0)

def lade(pfad, was):
    try:
        return json.load(open(pfad, encoding='utf-8'))
    except Exception as e:
        raise Fehler(f'{was} nicht lesbar: {e}')

def pruefe_daten(d):
    if not isinstance(d, dict):
        raise Fehler('Datendatei ist kein Objekt')
    if d.get('formatversion') != 1 or isinstance(d.get('formatversion'), bool):
        raise Fehler(f'Formatversion {d.get("formatversion")} der Datendatei wird nicht unterstützt (erwartet 1)')
    if not d.get('abgerufen'):
        raise Fehler('Datendatei ohne Datum (abgerufen fehlt)')
    if not isinstance(d.get('elemente'), list) or not d['elemente']:
        raise Fehler('Datendatei ist leer')

def netz(daten):
    adj, namen = {}, {}
    for e in daten['elemente']:
        if not isinstance(e, dict):
            continue
        t = e.get('tags') or {}
        if t.get('highway') not in OK_ARTEN or not isinstance(e.get('geometry'), list) or len(e['geometry']) < 2:
            continue                             # Elemente ohne Linie werden übersprungen
        g = [(round(c[0], 6), round(c[1], 6)) for c in e['geometry']]
        for a, b in zip(g, g[1:]):
            adj.setdefault(a, []).append((b, t.get('name')))
            adj.setdefault(b, []).append((a, t.get('name')))
        if t.get('name'):
            namen.setdefault(t['name'], set()).update(g)
    return adj, namen

def abstand(a, b):
    pa, pb = meter(a), meter(b)
    return math.hypot(pa[0] - pb[0], pa[1] - pb[1])

def kuerzester(adj, quellen, ziele, bevorzugt):
    """Kürzester Weg (Dijkstra, Kosten in Metern, genannte Straßen mit Bonus); Quellen und Ziele sind Knotenmengen."""
    q = [(0.0, i, s, None) for i, s in enumerate(sorted(quellen))]
    heapq.heapify(q); best, vor, zaehler = {}, {}, len(q)
    while q:
        c, _, u, p = heapq.heappop(q)
        if u in best:
            continue
        best[u], vor[u] = c, p
        if u in ziele:
            weg = [u]
            while vor[weg[-1]] is not None:
                weg.append(vor[weg[-1]])
            return weg[::-1]
        for v, nm in adj[u]:
            if v not in best:
                zaehler += 1
                heapq.heappush(q, (c + abstand(u, v) * (BONUS if nm in bevorzugt else 1.0), zaehler, v, u))
    return None

def komponente(adj, start):
    seen, st = {start}, [start]
    while st:
        u = st.pop()
        for v, _ in adj[u]:
            if v not in seen:
                seen.add(v); st.append(v)
    return seen

def schleifen_entfernen(weg):
    aus, pos = [], {}
    for k in weg:
        if k in pos:
            i = pos[k]
            for x in aus[i + 1:]:
                del pos[x]
            del aus[i + 1:]
        else:
            pos[k] = len(aus); aus.append(k)
    return aus

def route(auftrag, adj, namen):
    strassen = auftrag['strassen']
    for n in strassen:
        if n not in namen:
            raise Fehler(f'Straße nicht gefunden: {n}')
    start_menge = namen[strassen[0]]
    haupt = komponente(adj, sorted(start_menge)[0])
    for n in strassen:
        if not (namen[n] & haupt):
            raise Fehler(f'Straße ohne Anschluss an das Netz des Starts: {n} (Anschluss fehlt)')
    bevorzugt = set(strassen)
    weg, cur = [], set(start_menge) & haupt
    for n in strassen[1:]:
        p = kuerzester(adj, cur, namen[n] & haupt, bevorzugt)
        if p is None:
            raise Fehler(f'Kein Weg zu {n}')
        weg += p; cur = {p[-1]}
    s0 = weg[0]
    p = kuerzester(adj, cur, {s0}, bevorzugt)
    if p is None:
        raise Fehler('Kein Weg zurück zum Start')
    weg += p[:-1]                                 # der Start selbst kommt nicht doppelt vor
    weg = schleifen_entfernen(weg)
    xy = [meter(c) for c in weg]
    laenge = sum(math.dist(xy[i], xy[(i + 1) % len(xy)]) for i in range(len(xy)))
    flaeche = abs(sum(xy[i][0] * xy[(i + 1) % len(xy)][1] - xy[(i + 1) % len(xy)][0] * xy[i][1] for i in range(len(xy)))) / 2
    if len(weg) < 12 or laenge < 500 or flaeche < FLAECHE_MIN * laenge * laenge:
        raise Fehler('Keine Runde: der Weg führt nur hin und zurück oder ist zu klein (Fläche der Schleife zu gering)')
    for n in strassen:                           # das Entfernen von Schleifen darf keine Straße aus dem Weg schneiden
        sm = [meter(c) for c in namen[n]]
        if not any(math.dist(p, q) <= 20.0 for p in xy for q in sm):
            raise Fehler(f'Straße nicht mehr im Weg: {n} (Weg weicht um mehr als 20 m ab)')
    return weg, xy, laenge

def gleichmaessig(pts, schritt):
    m = len(pts); gesamt = sum(math.dist(pts[i], pts[(i + 1) % m]) for i in range(m)); n = max(8, round(gesamt / schritt)); s = gesamt / n
    out, i, acc, ziel, cur = [], 0, 0.0, 0.0, pts[0]
    for _ in range(n):
        while True:
            nxt = pts[(i + 1) % m]; seg = math.dist(cur, nxt)
            if acc + seg >= ziel or seg == 0:
                t = 0 if seg == 0 else (ziel - acc) / seg
                out.append((cur[0] + (nxt[0] - cur[0]) * t, cur[1] + (nxt[1] - cur[1]) * t)); break
            acc += seg; cur = nxt; i = (i + 1) % m
        ziel += s
    return out

def min_radius(pts, schritt, fenster=5):
    n = len(pts); rmin = 1e12
    for i in range(n):
        a, b, c = pts[(i - fenster) % n], pts[i], pts[(i + fenster) % n]
        h1 = math.atan2(b[1] - a[1], b[0] - a[0]); h2 = math.atan2(c[1] - b[1], c[0] - b[0])
        w = abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi)
        if w > 1e-9:
            rmin = min(rmin, fenster * schritt / w)
    return rmin

def massstab(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return (RAUM[1] - RAUM[0]) / max(max(xs) - min(xs), max(ys) - min(ys))

def glaetten(roh):
    """Linie glätten, bis der kleinste Kurvenradius in Spieleinheiten RADIUS_ZIEL erreicht (Streckung 1,5 beachtet)."""
    schritt = 10.0
    pts = gleichmaessig(roh, schritt); n = len(pts); runden = 0
    while runden < 40000:
        s = massstab(pts) * 1.5
        if min_radius(pts, schritt) * s >= RADIUS_ZIEL:
            break
        for _ in range(10):
            pts = [((pts[i - 1][0] + 2 * pts[i][0] + pts[(i + 1) % n][0]) / 4, (pts[i - 1][1] + 2 * pts[i][1] + pts[(i + 1) % n][1]) / 4) for i in range(n)]
        runden += 10
    return pts, runden

def spline(pts, n=24):
    out, m = [], len(pts)
    for i in range(m):
        p0, p1, p2, p3 = pts[(i - 1) % m], pts[i], pts[(i + 1) % m], pts[(i + 2) % m]
        for s in range(n):
            t = s / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out

def spiel_radius(punkte):
    """Kleinster Kurvenradius der Strecke, wie das Spiel sie baut (Streckung, Spline, Punkte im Abstand 8)."""
    return min_radius(gleichmaessig(spline([(x * STRECKUNG, y * STRECKUNG) for x, y in punkte]), 8.0), 8.0)

def kreuzung(punkte):
    """Kleinster Abstand zweier Stellen der Strecke, die mehr als 400 Einheiten Weg auseinander liegen (wie der Test)."""
    g = gleichmaessig(spline([(x * STRECKUNG, y * STRECKUNG) for x, y in punkte]), 8.0); n = len(g); dmin = 1e12
    for i in range(0, n, 2):
        for j in range(i + 1, n, 2):
            if min(j - i, n - (j - i)) * 8 >= 400:
                dmin = min(dmin, math.dist(g[i], g[j]))
    return dmin

def abweichung(glatt, roh):
    m = len(roh); worst = 0.0
    for p in glatt:
        best = 1e12
        for i in range(m):
            a, b = roh[i], roh[(i + 1) % m]
            dx, dy = b[0] - a[0], b[1] - a[1]; l2 = dx * dx + dy * dy
            t = 0 if l2 == 0 else max(0.0, min(1.0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2))
            best = min(best, math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)))
        worst = max(worst, best)
    return worst

def baue(auftrag, daten):
    pruefe_daten(daten)
    adj, namen = netz(daten)
    weg, roh, laenge = route(auftrag, adj, namen)
    glatt, _ = glaetten(roh)
    s = massstab(glatt)
    xs = [p[0] for p in glatt]; ys = [p[1] for p in glatt]
    ox = 600 - (max(xs) - min(xs)) * s / 2; oy = 600 - (max(ys) - min(ys)) * s / 2
    # 24 gleich weit entfernte Stützpunkte, Punkt 0 = Start; Norden oben (y wächst im Spiel nach unten)
    ctrl = gleichmaessig(glatt, 1.0)
    beste = None
    for anzahl in PUNKTE_BEREICH:
        schritt = len(ctrl) / anzahl
        kand = []
        for k in range(anzahl):
            x, y = ctrl[int(round(k * schritt)) % len(ctrl)]
            kand.append([int(round(ox + (x - min(xs)) * s)), int(round(oy + (max(ys) - y) * s))])
        r = spiel_radius(kand)
        if beste is None or r > beste[0] + 1e-9 or (abs(r - beste[0]) <= 1e-9 and abs(anzahl - 24) < abs(len(beste[1]) - 24)):
            beste = (r, kand)
    if beste[0] < RADIUS_MIN:
        raise Fehler(f'Kurven zu eng: kleinster Radius {beste[0]:.0f} (nötig {RADIUS_MIN:.0f}); Auftrag mit weniger scharfen Ecken wählen')
    punkte = beste[1]
    if kreuzung(punkte) < ABSTAND_MIN:
        raise Fehler(f'Strecke kreuzt sich oder kommt sich zu nah (kleinster Abstand {kreuzung(punkte):.0f}, nötig {ABSTAND_MIN:.0f})')
    st = auftrag['strecke']
    return {
        'formatversion': 1,
        'quelle': daten.get('quelle', '© OpenStreetMap-Mitwirkende (ODbL)'),
        'datenstand': daten['abgerufen'],
        'auftrag': auftrag['id'],
        'name': st['name'], 'sub': st['sub'],
        'massstab': round(s, 4), 'laenge_m': round(laenge, 1), 'abweichung_max_m': round(abweichung(glatt, roh), 1),
        'weg': [[round(c[0], 6), round(c[1], 6)] for c in weg],
        'def': {'id': st['id'], 'width': 70, 'offroad': 26, 'grip': 1, 'points': punkte,
                'itemRows': [0.2, 0.5, 0.8], 'pads': [{'f': 0.35, 'lat': 0}], 'ice': [], 'ramps': [{'f': 0.12}], 'shortcuts': []},
    }

def main(argv):
    if len(argv) != 4:
        raise Fehler('Aufruf: baue.py <auftrag.json> <daten.json> <ziel.json>')
    auftrag, daten = lade(argv[1], 'Auftrag'), lade(argv[2], 'Datendatei')
    if not isinstance(auftrag, dict) or not isinstance(auftrag.get('strassen'), list) or len(auftrag['strassen']) < 2 or not isinstance(auftrag.get('strecke'), dict):
        raise Fehler('Auftrag unvollständig (strassen mit mindestens 2 Einträgen und strecke fehlen)')
    if not all(isinstance(n, str) and n for n in auftrag['strassen']):
        raise Fehler('Auftrag: Straßennamen müssen Zeichenketten sein')
    st = auftrag['strecke']
    if not auftrag.get('id') or not all(isinstance(st.get(k), str) and st.get(k) for k in ('id', 'name', 'sub')):
        raise Fehler('Auftrag unvollständig (id sowie strecke.id, strecke.name und strecke.sub fehlen)')
    bb = auftrag.get('bbox')
    if isinstance(bb, list) and len(bb) == 4 and all(isinstance(x, (int, float)) for x in bb):
        URSPRUNG[0], URSPRUNG[1] = (bb[1] + bb[3]) / 2, (bb[0] + bb[2]) / 2
    erg = baue(auftrag, daten)
    with open(argv[3], 'w', encoding='utf-8') as f:
        json.dump(erg, f, ensure_ascii=False, indent=1, sort_keys=True); f.write('\n')
    print(f'{argv[3]}: {len(erg["weg"])} Wegpunkte, {erg["laenge_m"]:.0f} m, Abweichung {erg["abweichung_max_m"]:.0f} m')

if __name__ == '__main__':
    try:
        main(sys.argv)
    except Fehler as e:
        print(f'FEHLER: {e}', file=sys.stderr); sys.exit(1)
    except Exception as e:                       # nie ein Absturz mit Ablaufprotokoll: eine klare Meldung
        print(f'FEHLER: unerwartet ({type(e).__name__}): {e}', file=sys.stderr); sys.exit(1)
