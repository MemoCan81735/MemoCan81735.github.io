#!/usr/bin/env python3
"""Tests für S-W12 (Wahrzeichen der Oer-Runde), Teil Rechnen: baue.py.
Aufruf: python3 werkstatt/tests/wahrzeichen_test.py [ORDNER]   (NUR=name wählt Tests aus)
Das Bild im Spiel prüft wahrzeichen_test.js."""
import json, math, os, subprocess, sys, tempfile, re

WURZEL = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', '..'))
WK = os.path.join(WURZEL, 'werkstatt', 'strecken')
BAUE = os.path.join(WK, 'baue.py')
AUFTRAG = os.path.join(WK, 'auftraege', 'oer-erkenschwick.json')
DATEN = os.path.join(WK, 'daten', 'oer-erkenschwick-2026-11-02.json')
K = 1.5
PFLICHT = ['node/4077677268', 'way/301019047', 'way/300992687', 'node/1203939683', 'way/614927894', 'node/10103709699']
TYPEN = {'mosque', 'arena', 'headframe', 'rathaus', 'markt', 'kirche'}

def lade(p): return json.load(open(p, encoding='utf-8'))
def schreibe(p, d): json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False)

def bau(tmp, fa=None, fd=None, name='a'):
    a, d = lade(AUFTRAG), lade(DATEN)
    if fa: fa(a)
    if fd: fd(d)
    pa, pd, pz = (os.path.join(tmp, f'{name}_{x}.json') for x in ('auftrag', 'daten', 'ziel'))
    schreibe(pa, a); schreibe(pd, d)
    r = subprocess.run([sys.executable, BAUE, pa, pd, pz], capture_output=True, text=True, timeout=300)
    return r, pz

def spline(pts, n=24):
    out, m = [], len(pts)
    for i in range(m):
        p0, p1, p2, p3 = pts[(i - 1) % m], pts[i], pts[(i + 1) % m], pts[(i + 2) % m]
        for s in range(n):
            t = s / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * p1[c]) + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3) for c in (0, 1)))
    return out

def abstand_zur_strecke(s, x, y):
    """Abstand in Welteinheiten (mit Streckung) von (x, y) zur Mittellinie der Strecke."""
    pts = [(px * K, py * K) for px, py in s['def']['points']]
    sp = spline(pts, 24)
    return min(math.dist((x * K, y * K), p) for p in sp)

def pruefe(b, text):
    if not b: raise AssertionError(text)

def orte(d): return {o['osm']: o for o in d['orte']}

def abbilden(s, a, lon, lat):
    ab = s['abbildung']; u = ab['ursprung']
    mx = (lon - u[0]) * math.cos(math.radians(u[1])) * 111320.0; my = (lat - u[1]) * 111320.0
    return ab['ox'] + (mx - ab['minx']) * ab['massstab'], ab['oy'] + (ab['maxy'] - my) * ab['massstab']

tests = []
def test(name):
    def deko(f): tests.append((name, f)); return f
    return deko

@test('w_pflicht')
def _():
    with tempfile.TemporaryDirectory() as tmp:
        r, z = bau(tmp)
        pruefe(r.returncode == 0, 'Bauen schlug fehl: ' + r.stderr[-300:])
        s = lade(z); stehen = {w['osm'] for w in s['wahrzeichen']}
        for o in PFLICHT:
            pruefe(o in stehen, 'Pflicht-Ort fehlt: ' + o)
        pruefe(not any(v['osm'] in PFLICHT for v in s['verworfen']), 'Pflicht-Ort verworfen')
        gr = {v['osm']: v['grund'] for v in s['verworfen']}
        pruefe(all('nah' in g or 'Verschiebung' in g or 'Raum' in g or 'Freiraum' in g for g in gr.values()) and len(gr) == len(s['verworfen']), 'Verworfene ohne Grund: ' + str(gr))
        pruefe(len(s['wahrzeichen']) + len(s['verworfen']) == 14, 'Orte gehen verloren: %d + %d' % (len(s['wahrzeichen']), len(s['verworfen'])))
        pruefe(len(s['wahrzeichen']) >= 9, 'zu wenige Wahrzeichen: ' + str(len(s['wahrzeichen'])))
        pruefe({w['typ'] for w in s['wahrzeichen']} >= {'mosque', 'rathaus', 'markt', 'arena', 'headframe', 'kirche'}, 'Typen unvollständig')
        mo = [w for w in s['wahrzeichen'] if w['typ'] == 'mosque']; pruefe(len(mo) == 2, 'Moscheen: ' + str(len(mo)))
        print('  Messwerte: %d Wahrzeichen, verworfen: %s, verschoben: %s' % (len(s['wahrzeichen']), [v['name'] for v in s['verworfen']], [(w['name'][:14], round(w['verschoben_m'])) for w in s['wahrzeichen'] if w['verschoben_m'] > 0]))

@test('w_ort')
def _():
    with tempfile.TemporaryDirectory() as tmp:
        r, z = bau(tmp)
        pruefe(r.returncode == 0, 'Bauen schlug fehl: ' + r.stderr[-300:])
        s = lade(z); a = lade(AUFTRAG); o = orte(lade(DATEN))
        for w in s['wahrzeichen']:
            ort = o[w['osm']]; ex, ey = abbilden(s, a, ort['lon'], ort['lat'])
            d = math.dist((w['x'], w['y']), (ex, ey))
            if w['verschoben_m'] == 0:
                pruefe(d <= 1.0, f'{w["name"]}: steht {d:.1f} neben seinem Ort')
            else:
                pruefe(w['verschoben_m'] <= 400, f'{w["name"]}: Verschiebung {w["verschoben_m"]} m')
                pruefe(abs(d / s['massstab'] - w['verschoben_m']) <= 3, f'{w["name"]}: gemeldete Verschiebung {w["verschoben_m"]} passt nicht zu {d / s["massstab"]:.0f} m')
        kauf = next(w for w in s['wahrzeichen'] if w['osm'] == 'node/1203939683')
        pruefe(kauf['verschoben_m'] > 0, 'Kaufland liegt nahe der Startlinie und müsste nach außen geschoben sein')

@test('w_abstand')
def _():
    with tempfile.TemporaryDirectory() as tmp:
        r, z = bau(tmp)
        pruefe(r.returncode == 0, 'Bauen schlug fehl: ' + r.stderr[-300:])
        s = lade(z); W = s['wahrzeichen']
        for w in W:
            need = 61 + 0.6 * w['r'] * w['s']
            d = abstand_zur_strecke(s, w['x'], w['y'])
            pruefe(d >= need - 1.0, f'{w["name"]}: Abstand {d:.0f} < nötig {need:.0f}')
            pruefe(-150 <= w['x'] <= 1350 and -150 <= w['y'] <= 1350, f'{w["name"]}: außerhalb des Raums')
        for i, a in enumerate(W):
            for b in W[i + 1:]:
                need = 0.6 * (a['r'] * a['s'] + b['r'] * b['s'])
                d = math.dist((a['x'] * K, a['y'] * K), (b['x'] * K, b['y'] * K))
                pruefe(d >= need - 1.0, f'{a["name"]} und {b["name"]}: Abstand {d:.0f} < {need:.0f}')
        # Vorderseite zur Fahrbahn: rot zeigt auf den nächsten Punkt der Mittellinie
        pts = spline([(px * K, py * K) for px, py in s['def']['points']], 24)
        for w in W:
            n = min(pts, key=lambda p: math.dist((w['x'] * K, w['y'] * K), p))
            soll = math.atan2(n[0] - w['x'] * K, n[1] - w['y'] * K)
            pruefe(abs((w['rot'] - soll + math.pi) % (2 * math.pi) - math.pi) <= 0.05, f'{w["name"]}: Vorderseite zeigt nicht zur Fahrbahn')

@test('w_anzeige')
def _():
    with tempfile.TemporaryDirectory() as tmp:
        r, z = bau(tmp)
        pruefe(r.returncode == 0, 'Bauen schlug fehl: ' + r.stderr[-300:])
        s = lade(z); an = [w.get('anzeige') for w in s['wahrzeichen']]
        pruefe(all(isinstance(a, str) and 3 <= len(a) <= 24 for a in an), 'Anzeige fehlt oder falsch lang: ' + str(an))
        pruefe(len(set(an)) == len(an), 'Anzeigen nicht eindeutig')
    def setze(i, v): return lambda a: a['wahrzeichen'][i].update(anzeige=v)
    ok = [('3 Zeichen', setze(0, 'Abc')), ('24 Zeichen', setze(0, 'A' * 24))]
    for name, fa in ok:
        with tempfile.TemporaryDirectory() as tmp:
            r, z = bau(tmp, fa)
            pruefe(r.returncode == 0, f'{name} abgelehnt: ' + r.stderr[-200:])
    schlecht = [('2 Zeichen', setze(0, 'Ab')), ('25 Zeichen', setze(0, 'A' * 25)), ('leer', setze(0, '')), ('Zahl', setze(0, 5)),
                ('Name zu lang ohne Anzeige', lambda a: a['wahrzeichen'][0].pop('anzeige', None) or a['wahrzeichen'][0].update(name='N' * 30))]
    for name, fa in schlecht:
        with tempfile.TemporaryDirectory() as tmp:
            r, z = bau(tmp, fa)
            pruefe(r.returncode == 1 and 'Anzeige' in r.stderr, f'{name}: Rückgabewert {r.returncode}, Meldung: {r.stderr[-200:]}')
            pruefe('Traceback' not in r.stderr and not os.path.exists(z), f'{name}: unklare Meldung oder Ausgabedatei')

@test('w_fehler')
def _():
    faelle = [
        ('unbekannte Kennung', lambda a: a['wahrzeichen'].append({'osm': 'way/1', 'name': 'Nichts', 'typ': 'kirche', 's': 1, 'r': 20}), 'nicht gefunden'),
        ('unerlaubter Typ', lambda a: a['wahrzeichen'][0].update(typ='turm'), 'Typ'),
        ('Größe null', lambda a: a['wahrzeichen'][0].update(s=0), 'Größe'),
        ('Größe negativ', lambda a: a['wahrzeichen'][0].update(s=-2), 'Größe'),
        ('Freiraum Text', lambda a: a['wahrzeichen'][0].update(r='x'), 'Freiraum'),
        ('Eintrag kein Objekt', lambda a: a['wahrzeichen'].append('Rathaus'), 'Wahrzeichen'),
        ('Pflicht-Ort verdrängt', lambda a: (a['wahrzeichen'].insert(0, dict(a['wahrzeichen'][8], osm='way/195027261', pflicht=True)), a['wahrzeichen'].insert(1, dict(a['wahrzeichen'][3], osm='way/300992687', pflicht=True))), 'Pflicht'),
    ]
    for name, fa, wort in faelle:
        with tempfile.TemporaryDirectory() as tmp:
            r, z = bau(tmp, fa)
            pruefe(r.returncode == 1 and wort in r.stderr, f'{name}: Rückgabewert {r.returncode}, Meldung: {r.stderr[-200:]}')
            pruefe('unerwartet' not in r.stderr and 'Traceback' not in r.stderr, f'{name}: unklare Meldung')
            pruefe(not os.path.exists(z), f'{name}: Ausgabedatei trotz Fehler')
    # Ort außerhalb des Raums: verworfen mit Grund, Bau läuft weiter
    def fern(a): a['wahrzeichen'].append({'osm': 'node/99', 'name': 'Weit weg', 'typ': 'kirche', 's': 2, 'r': 25})
    def fernort(d): d['orte'].append({'osm': 'node/99', 'tags': {'name': 'Weit weg'}, 'lon': 7.5, 'lat': 51.9})
    with tempfile.TemporaryDirectory() as tmp:
        r, z = bau(tmp, fern, fernort)
        pruefe(r.returncode == 0, 'Ferner Ort bricht den Bau ab: ' + r.stderr[-200:])
        v = [x for x in lade(z)['verworfen'] if x['osm'] == 'node/99']
        pruefe(v and 'Raum' in v[0]['grund'], 'Ferner Ort nicht als verworfen gemeldet')
    # Wiederholbarkeit
    with tempfile.TemporaryDirectory() as tmp:
        r1, z1 = bau(tmp, name='x'); r2, z2 = bau(tmp, name='y')
        pruefe(open(z1, 'rb').read() == open(z2, 'rb').read(), 'Ausgaben verschieden')
        pruefe(not re.search(r'\d{2}:\d{2}:\d{2}', open(z1, encoding='utf-8').read()), 'Uhrzeit in der Ausgabe')

nur = os.environ.get('NUR'); rot = 0
for name, f in tests:
    if nur and name != nur: continue
    try:
        f(); print('OK     ' + name)
    except Exception as e:
        rot += 1; print(f'FEHLER {name}: {e}')
print(f'{rot} Test(s) rot' if rot else 'Alle Wahrzeichentests (Rechnen) grün')
sys.exit(1 if rot else 0)
