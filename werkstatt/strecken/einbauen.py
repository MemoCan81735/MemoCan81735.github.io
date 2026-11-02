#!/usr/bin/env python3
"""Trägt eine gebaute Strecke in driftpokal/index.html ein (S-W11). Aufruf:
  python3 einbauen.py <strecke.json> <pruefung.json> <index.html>
Die Einträge stehen zwischen "@@strecke <id>" und "@@ende <id>" und werden bei jedem Lauf ersetzt (zweimal einbauen ändert nichts).
Das Aussehen (Himmel, Boden, Zuschauer, Anzeigen) wird von der Strecke "erken" (Oer-Erkenschwick) abgeleitet, Wahrzeichen entfallen.
Rückgängig: python3 einbauen.py --entfernen <id> <index.html>
Weder Uhrzeit noch Zufall."""
import json, re, sys

class Fehler(Exception):
    pass

def zahl(x):
    return json.dumps(x)

def def_text(s, sid):
    d = s['def']
    pts = ',\n             '.join(','.join(f'[{x},{y}]' for x, y in d['points'][i:i + 11]) for i in range(0, len(d['points']), 11))
    pads = ', '.join('{ f: %s, lat: %s }' % (p['f'], p['lat']) for p in d['pads'])
    ramps = ', '.join('{ f: %s }' % r['f'] for r in d['ramps'])
    return (f'  // @@strecke {sid}\n  {{\n'
            f'    // {s["name"]} aus echten Straßen (OpenStreetMap, Stand {s["datenstand"]}), erzeugt von werkstatt/strecken, nicht von Hand ändern\n'
            f'    id: "{sid}", width: {d["width"]}, offroad: {d["offroad"]}, grip: {d["grip"]},\n'
            f'    points: [{pts}],\n'
            f'    itemRows: {json.dumps(d["itemRows"])},\n    pads: [{pads}],\n    ice: [],\n    ramps: [{ramps}],\n    shortcuts: []\n  }}\n'
            f'  // @@ende {sid}')

def block(sid, inhalt):
    return f'/* @@strecke {sid} */{inhalt}/* @@ende {sid} */'

def ersetze_block(t, sid, neu, anker, vor):
    """Vorhandenen Block (zwischen den Markierungen) ersetzen, sonst vor 'anker' einfügen (vor: Text, der dem Block vorangestellt wird)."""
    rx = re.compile(re.escape(vor) + r'/\* @@strecke ' + re.escape(sid) + r' \*/.*?/\* @@ende ' + re.escape(sid) + r' \*/', re.S)
    if rx.search(t):
        return rx.sub(lambda m: vor + neu, t, count=1)
    if t.count(anker) != 1:
        raise Fehler(f'Ankerstelle nicht eindeutig ({t.count(anker)} Treffer): {anker[:50]!r}')
    return t.replace(anker, vor + neu + anker, 1)

def einbauen(t, s, pr):
    sid = s['def']['id']
    for k in ('id', 'par', 'walls', 'finished', 'karts', 'bestLap', 'bestLapMax'):
        if k not in pr:
            raise Fehler(f'Prüfergebnis unvollständig ({k} fehlt)')
    if pr['id'] != sid:
        raise Fehler(f'Prüfergebnis gehört zur Strecke {pr["id"]}, nicht zu {sid}')
    if not (pr['walls'] == 0 and pr['karts'] > 0 and pr['finished'] == pr['karts']):
        raise Fehler('Strecke hat die Prüfung nicht bestanden (Wandkontakte oder nicht alle im Ziel); nicht eingebaut')
    if not (15 <= pr['bestLap'] <= pr['bestLapMax'] <= 40):
        raise Fehler(f'Rundenzeit außerhalb 15 bis 40 s ({pr["bestLap"]} bis {pr["bestLapMax"]}); nicht eingebaut')
    if not (isinstance(pr['par'], (int, float)) and 30 < pr['par'] < 150):
        raise Fehler(f'par {pr["par"]} unplausibel')
    # 1. Streckentabelle (Block mit eigenen Zeilen)
    rx = re.compile(r',\n  // @@strecke ' + re.escape(sid) + r'\n.*?\n  // @@ende ' + re.escape(sid), re.S)
    neu = ',\n' + def_text(s, sid)
    if rx.search(t):
        t = rx.sub(lambda m: neu, t, count=1)
    else:
        a = '\n];\n\nconst ITEM_TYPES'
        if t.count(a) != 1: raise Fehler('Anker TRACK_DEFS fehlt')
        t = t.replace(a, neu + a, 1)
    # 2. Sterne-Aufgaben
    t = ersetze_block(t, sid, block(sid, f'{sid}: {{ par: {zahl(pr["par"])}, skill: "slip" }}'), '\n};\nconst SKILL_RULES', ', ')
    # 3. Aussehen: von erken abgeleitet
    m = re.search(r'\n  erken: \{\n(.*?)\n  \},\n', t, re.S)
    if not m: raise Fehler('Aussehen von erken nicht gefunden')
    look = m.group(1)
    look = re.sub(r'name: "[^"]*", sub: "[^"]*"', lambda _: f'name: {json.dumps(s["name"], ensure_ascii=False)}, sub: {json.dumps(s["sub"], ensure_ascii=False)}', look, count=1)
    look = re.sub(r'    landmarks: \[.*\]$', '    landmarks: []', look, flags=re.S)
    if 'landmarks: []' not in look: raise Fehler('Wahrzeichen von erken nicht entfernbar')
    start = t.index('const TRACK_LOOK = {'); ende = t.index('\n};\n', start)
    teil = t[start:ende]
    neu = f',\n  // @@strecke {sid}\n  {sid}: {{\n{look}\n  }}\n  // @@ende {sid}'
    rx = re.compile(r',\n  // @@strecke ' + re.escape(sid) + r'\n.*?\n  // @@ende ' + re.escape(sid), re.S)
    if rx.search(teil): teil = rx.sub(lambda _: neu, teil, count=1)
    else: teil = teil + neu
    t = t[:start] + teil + t[ende:]
    # 4. Wetterregeln
    a = '\n  },\n  wetKinds:'
    t = ersetze_block(t, sid, block(sid, f'{sid}: ["abend", "nacht"]'), a, ',\n    ')
    t = re.sub(r'wetBase: \["erken"(, "' + re.escape(sid) + r'")?\]', f'wetBase: ["erken", "{sid}"]', t, count=1)
    # 5. Heimat-Cup
    t, n = re.subn(r'\{ id: "heimat", tracks: \["caycuma", "erken", "muenchen"(, "' + re.escape(sid) + r'")?\] \}', f'{{ id: "heimat", tracks: ["caycuma", "erken", "muenchen", "{sid}"] }}', t, count=1)
    if n != 1: raise Fehler('Heimat-Cup nicht gefunden')
    return t

def entfernen(t, sid):
    """Macht den Einbau rückgängig (für den Test "erstmals einbauen" und zum Löschen einer Strecke)."""
    e = re.escape(sid)
    t = re.sub(r',\n  // @@strecke ' + e + r'\n.*?\n  // @@ende ' + e, '', t, flags=re.S)       # Streckentabelle und Aussehen
    t = re.sub(r', /\* @@strecke ' + e + r' \*/.*?/\* @@ende ' + e + r' \*/', '', t, flags=re.S)  # Sterne-Aufgaben
    t = re.sub(r',\n    /\* @@strecke ' + e + r' \*/.*?/\* @@ende ' + e + r' \*/', '', t, flags=re.S)  # Wetterregeln
    t = re.sub(r'wetBase: \["erken", "' + e + r'"\]', 'wetBase: ["erken"]', t)
    t = re.sub(r'("muenchen"), "' + e + r'"\] \}', r'\1] }', t)
    return t

def main(argv):
    if len(argv) == 4 and argv[1] == '--entfernen':
        t = open(argv[3], encoding='utf-8').read(); neu = entfernen(t, argv[2])
        open(argv[3], 'w', encoding='utf-8').write(neu); print(f'{argv[2]}: entfernt'); return
    if len(argv) != 4:
        raise Fehler('Aufruf: einbauen.py <strecke.json> <pruefung.json> <index.html>  oder  einbauen.py --entfernen <id> <index.html>')
    s = json.load(open(argv[1], encoding='utf-8')); pr = json.load(open(argv[2], encoding='utf-8'))
    t = open(argv[3], encoding='utf-8').read()
    neu = einbauen(t, s, pr)
    if neu != t:
        open(argv[3], 'w', encoding='utf-8').write(neu)
    print(f'{s["def"]["id"]}: eingebaut in {argv[3]}' if neu != t else f'{s["def"]["id"]}: schon aktuell')

if __name__ == '__main__':
    try:
        main(sys.argv)
    except Fehler as e:
        print(f'FEHLER: {e}', file=sys.stderr); sys.exit(1)
    except Exception as e:
        print(f'FEHLER: unerwartet ({type(e).__name__}): {e}', file=sys.stderr); sys.exit(1)
