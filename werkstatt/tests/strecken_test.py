#!/usr/bin/env python3
"""Tests für S-W11 (Werkzeug für Strecken aus echten Straßen), Teil Rechnen: baue.py.
Aufruf: python3 werkstatt/tests/strecken_test.py [ORDNER]   (NUR=name wählt Tests aus)
Fahrt, Einbau und Bild prüft strecken_test.js."""
import json, math, os, subprocess, sys, tempfile, re

WURZEL = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..'))
WK = os.path.join(WURZEL, 'werkstatt', 'strecken')
BAUE = os.path.join(WK, 'baue.py')
AUFTRAG = os.path.join(WK, 'auftraege', 'oer-erkenschwick.json')
DATEN = os.path.join(WK, 'daten', 'oer-erkenschwick-2026-11-02.json')
K = 1.5            # Streckung des Spiels (RACE_RULES.trackScale)

def baue(auftrag, daten, ziel):
    return subprocess.run([sys.executable, BAUE, auftrag, daten, ziel], capture_output=True, text=True, timeout=300)

def lade(p):
    return json.load(open(p, encoding='utf-8'))

def schreibe(p, d):
    json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False)

def meter(lon, lat):
    return ((lon - 7.26) * math.cos(math.radians(51.65)) * 111320, (lat - 51.64) * 111320)

def spline(pts, n=24):
    out = []
    m = len(pts)
    for i in range(m):
        p0, p1, p2, p3 = pts[(i - 1) % m], pts[i], pts[(i + 1) % m], pts[(i + 2) % m]
        for s in range(n):
            t = s / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out

def gleichmaessig(pts, abstand):
    m = len(pts); gesamt = sum(math.dist(pts[i], pts[(i + 1) % m]) for i in range(m)); n = max(8, round(gesamt / abstand)); schritt = gesamt / n
    out, i, acc, ziel, cur = [], 0, 0.0, 0.0, pts[0]
    for _ in range(n):
        while True:
            nxt = pts[(i + 1) % m]; seg = math.dist(cur, nxt)
            if acc + seg >= ziel or seg == 0:
                t = 0 if seg == 0 else (ziel - acc) / seg; out.append((cur[0] + (nxt[0] - cur[0]) * t, cur[1] + (nxt[1] - cur[1]) * t)); break
            acc += seg; cur = nxt; i += 1
        ziel += schritt
    return out

def form(strecke):
    p = [(a, b) for a, b in strecke['def']['points']]
    pk = [(x * K, y * K) for x, y in p]
    glatt = gleichmaessig(spline(pk), 8)
    n = len(glatt)
    # kleinster Kurvenradius über 5 Schritte (40 Einheiten)
    rmin = 1e9
    for i in range(n):
        a, b, c = glatt[(i - 5) % n], glatt[i], glatt[(i + 5) % n]
        h1 = math.atan2(b[1] - a[1], b[0] - a[0]); h2 = math.atan2(c[1] - b[1], c[0] - b[0])
        w = abs((h2 - h1 + math.pi) % (2 * math.pi) - math.pi)
        if w > 1e-6: rmin = min(rmin, 40 / w)
    # kleinster Abstand nicht benachbarter Teile (mehr als 400 Einheiten Weg entfernt)
    dmin = 1e9
    for i in range(0, n, 2):
        for j in range(i + 1, n, 2):
            weg = min(j - i, n - (j - i)) * 8
            if weg < 400: continue
            dmin = min(dmin, math.dist(glatt[i], glatt[j]))
    return rmin, dmin

tests = []
def test(name):
    def deko(f): tests.append((name, f)); return f
    return deko
def pruefe(b, text):
    if not b: raise AssertionError(text)

def strassenpunkte(daten, name):
    return [meter(*c) for e in daten['elemente'] if e['tags'].get('name') == name and 'highway' in e['tags'] for c in e['geometry']]

def haupt_bau(tmp, auftrag_aendern=None, daten_aendern=None, name='a'):
    a = lade(AUFTRAG); d = lade(DATEN)
    if auftrag_aendern: auftrag_aendern(a)
    if daten_aendern: daten_aendern(d)
    pa, pd, pz = (os.path.join(tmp, f'{name}_{x}.json') for x in ('auftrag', 'daten', 'ziel'))
    schreibe(pa, a); schreibe(pd, d)
    return baue(pa, pd, pz), pz

@test('st_weg')
def _():
    with tempfile.TemporaryDirectory() as tmp:
        r, z = haupt_bau(tmp)
        pruefe(r.returncode == 0, 'Bauen schlug fehl: ' + r.stderr[-300:])
        s = lade(z); a = lade(AUFTRAG); d = lade(DATEN)
        weg = [meter(*c) for c in s['weg']]
        pruefe(len(weg) > 50, 'Weg zu kurz ' + str(len(weg)))
        pruefe(math.dist(weg[0], weg[-1]) < 120, 'nicht geschlossen: ' + str(round(math.dist(weg[0], weg[-1]))) + ' m')
        pruefe(any(math.dist(weg[0], q) <= 60 for q in strassenpunkte(d, 'Berliner Platz')), 'Start nicht am Berliner Platz')
        erste = []
        for name in a['strassen'][1:]:
            sp = strassenpunkte(d, name)
            idx = [i for i, w in enumerate(weg) if any(math.dist(w, q) <= 20 for q in sp)]
            pruefe(idx, 'Straße nicht befahren: ' + name)
            erste.append(idx[0])
        pruefe(all(a < b for a, b in zip(erste, erste[1:])), 'Reihenfolge verletzt: ' + str(erste))

@test('st_form')
def _():
    with tempfile.TemporaryDirectory() as tmp:
        r, z = haupt_bau(tmp)
        pruefe(r.returncode == 0, 'Bauen schlug fehl: ' + r.stderr[-300:])
        s = lade(z); p = s['def']['points']
        pruefe(20 <= len(p) <= 30, 'Punktzahl ' + str(len(p)))
        pruefe(all(100 <= x <= 1100 and 100 <= y <= 1100 for x, y in p), 'Punkt außerhalb 100..1100')
        rmin, dmin = form(s)
        pruefe(rmin >= 45, 'Kurvenradius zu klein: %.1f' % rmin)
        pruefe(dmin >= 100, 'Selbstüberkreuzung oder zu nah: %.1f' % dmin)
        d = s['def']
        pruefe(d['id'] == 'oer' and d['width'] == 70 and d['offroad'] == 26, 'Kopfwerte falsch')
        print(f'  Messwerte: Radius {rmin:.0f}, Abstand {dmin:.0f}, Länge {s["laenge_m"]:.0f} m, Abweichung {s["abweichung_max_m"]:.0f} m, Maßstab {s["massstab"]:.3f}')
    # kleinere Runde mit vier Straßen: gültig oder klar abgelehnt
    with tempfile.TemporaryDirectory() as tmp:
        r, z = haupt_bau(tmp, lambda a: a.update(strassen=['Berliner Platz', 'Stimbergstraße', 'Holtgarde', 'Ludwigstraße']))
        if r.returncode == 0:
            rmin, dmin = form(lade(z)); pruefe(rmin >= 45 and dmin >= 100, 'kleine Runde ungültig')
        else:
            pruefe('Runde' in r.stderr, 'unklare Meldung: ' + r.stderr[-200:])

@test('st_wieder')
def _():
    with tempfile.TemporaryDirectory() as tmp:
        r1, z1 = haupt_bau(tmp, name='x'); r2, z2 = haupt_bau(tmp, name='y')
        pruefe(r1.returncode == 0 and r2.returncode == 0, 'Bauen schlug fehl')
        b1, b2 = open(z1, 'rb').read(), open(z2, 'rb').read()
        pruefe(b1 == b2, 'Ausgaben verschieden')
        t = b1.decode('utf-8')
        pruefe(not re.search(r'\d{2}:\d{2}:\d{2}', t), 'Uhrzeit in der Ausgabe')
        pruefe(lade(z1)['datenstand'] == '2026-11-02', 'Datenstand fehlt')

@test('st_fehler')
def _():
    faelle = [
        ('unbekannte Straße', lambda a: a.update(strassen=a['strassen'] + ['Gibtesnicht']), None, 'nicht gefunden'),
        ('Sonderzeichen', lambda a: a.update(strassen=a['strassen'] + ['Quatsch"\\\'<>;']), None, 'nicht gefunden'),
        ('nur hin und zurück', lambda a: a.update(strassen=['Berliner Platz', 'Stimbergstraße']), None, 'Runde'),
        ('leere Datei', None, lambda d: d.update(elemente=[]), 'leer'),
        ('kein Abrufdatum', None, lambda d: d.pop('abgerufen'), 'abgerufen'),
        ('Formatversion 2', None, lambda d: d.update(formatversion=2), 'Formatversion'),
    ]
    for name, fa, fd, wort in faelle:
        with tempfile.TemporaryDirectory() as tmp:
            r, z = haupt_bau(tmp, fa, fd)
            pruefe(r.returncode == 1, f'{name}: Rückgabewert {r.returncode}')
            pruefe(wort in r.stderr, f'{name}: Meldung ohne "{wort}": {r.stderr[-200:]}')
            pruefe('Traceback' not in r.stderr, f'{name}: Absturz statt Meldung')
            pruefe(not os.path.exists(z), f'{name}: Ausgabedatei trotz Fehler')
    # leere Datei (0 Byte), fehlende Pflichtfelder im Auftrag, Formatversion true, Namen keine Zeichenketten
    with tempfile.TemporaryDirectory() as tmp:
        leer = os.path.join(tmp, 'leer.json'); open(leer, 'w').close()
        pa = os.path.join(tmp, 'a.json'); schreibe(pa, lade(AUFTRAG)); r = baue(pa, leer, os.path.join(tmp, 'z.json'))
        pruefe(r.returncode == 1 and 'nicht lesbar' in r.stderr and 'Traceback' not in r.stderr, '0-Byte-Datei: ' + r.stderr[-200:])
    for name, fa, fd, wort in [
        ('Auftrag ohne Namen', lambda a: a['strecke'].pop('name'), None, 'unvollständig'),
        ('Auftrag ohne id', lambda a: a.pop('id'), None, 'unvollständig'),
        ('Namen keine Texte', lambda a: a.update(strassen=['Berliner Platz', ['Liste']]), None, 'Zeichenketten'),
        ('Formatversion true', None, lambda d: d.update(formatversion=True), 'Formatversion'),
    ]:
        with tempfile.TemporaryDirectory() as tmp:
            r, z = haupt_bau(tmp, fa, fd)
            pruefe(r.returncode == 1 and wort in r.stderr and 'unerwartet' not in r.stderr, f'{name}: {r.stderr[-200:]}')
    # Elemente ohne Linie oder ohne Etiketten stören nicht: gleiche Ausgabe wie ohne sie
    with tempfile.TemporaryDirectory() as tmp:
        r1, z1 = haupt_bau(tmp, name='sauber')
        r2, z2 = haupt_bau(tmp, None, lambda d: d['elemente'].extend([{'id': 1, 'tags': None, 'geometry': [[7.2, 51.6], [7.21, 51.61]]}, {'id': 2, 'tags': {'highway': 'residential'}}, {'id': 3, 'tags': {'highway': 'residential', 'name': 'Leer'}, 'geometry': []}]), name='schmutz')
        pruefe(r1.returncode == 0 and r2.returncode == 0, 'Bauen mit Fremdelementen schlug fehl: ' + r2.stderr[-200:])
        pruefe(open(z1, 'rb').read() == open(z2, 'rb').read(), 'Fremdelemente ändern die Ausgabe')
    # Insel: eine Straße, die mit dem Netz nicht verbunden ist
    def insel(d):
        d['elemente'].append({'id': 1, 'tags': {'highway': 'residential', 'name': 'Inselweg'}, 'geometry': [[7.30, 51.60], [7.301, 51.601]]})
    with tempfile.TemporaryDirectory() as tmp:
        r, z = haupt_bau(tmp, lambda a: a.update(strassen=a['strassen'] + ['Inselweg']), insel)
        pruefe(r.returncode == 1 and 'Inselweg' in r.stderr and 'Anschluss' in r.stderr, 'Insel nicht erkannt: ' + r.stderr[-200:])

nur = os.environ.get('NUR'); rot = 0
for name, f in tests:
    if nur and name != nur: continue
    try:
        f(); print('OK     ' + name)
    except Exception as e:
        rot += 1; print(f'FEHLER {name}: {e}')
print(f'{rot} Test(s) rot' if rot else 'Alle Streckentests (Rechnen) grün')
sys.exit(1 if rot else 0)
