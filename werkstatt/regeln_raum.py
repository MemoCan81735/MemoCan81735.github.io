#!/usr/bin/env python3
"""Übernimmt die Regeln und den Computer der Brettspiele (brettspiele/index.html) wörtlich nach raum/brettregeln.js,
damit Dame, Mühle, Mangala und Tavla im Spieleraum nach genau denselben Regeln laufen.
Aufruf: python3 werkstatt/regeln_raum.py            (Datei neu schreiben)
        python3 werkstatt/regeln_raum.py --pruefen  (rot, wenn die Datei nicht mehr zur Quelle passt)"""
import os, re, sys

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
QUELLE = os.path.join(WURZEL, 'brettspiele', 'index.html')
ZIEL = os.path.join(WURZEL, 'raum', 'brettregeln.js')
# (Name, Anfang der ersten Zeile, Ende: erste Zeile, die genau so lautet)
BLOECKE = [
    ('AIEngines', 'const AIEngines = {', '};'),
    ('MangalaEntity', 'class MangalaEntity {', '}'),
    ('tavlaRegelwerk', 'function tavlaRegelwerk() {', '}'),
    ('TavlaEntity', 'class TavlaEntity {', '}'),
    ('AIEngines.tavla', 'AIEngines.tavla = function tavla(', '};'),
    ('MuehleEntity', 'class MuehleEntity {', '}'),
    ('DameEntity', 'class DameEntity {', '}'),
    ('AIEngines.dame', 'AIEngines.dameZuege = DameEntity.dameZuege;', None),
    ('AIEngines.dameSetze', 'AIEngines.dameSetze = DameEntity.dameSetze;', None),
]


def block(zeilen, anfang, ende):
    for i, z in enumerate(zeilen):
        if z.startswith(anfang):
            if ende is None:
                return z
            for j in range(i + 1, len(zeilen)):
                if zeilen[j] == ende:
                    return '\n'.join(zeilen[i:j + 1])
    raise SystemExit(f'Block nicht gefunden: {anfang}')


def erzeugen():
    zeilen = open(QUELLE, encoding='utf-8').read().split('\n')
    teile = ['// Automatisch übernommen aus brettspiele/index.html (werkstatt/regeln_raum.py). Nicht von Hand ändern.',
             '// Regeln und Computer von Dame, Mühle, Mangala und Tavla, dieselben wie im Spiel Brettspiele.', '(function () {']
    for name, anfang, ende in BLOECKE:
        teile += [f'// <<< {name}', block(zeilen, anfang, ende), f'// >>> {name}']
    teile += ['window.Brettregeln = { AIEngines, MangalaEntity, TavlaEntity, tavlaRegelwerk, MuehleEntity, DameEntity };', '})();', '']
    return '\n'.join(teile)


if __name__ == '__main__':
    neu = erzeugen()
    if '--pruefen' in sys.argv:
        alt = open(ZIEL, encoding='utf-8').read() if os.path.exists(ZIEL) else ''
        if alt != neu:
            print('FEHLER raum/brettregeln.js passt nicht mehr zu brettspiele/index.html; python3 werkstatt/regeln_raum.py ausführen')
            sys.exit(1)
        print('OK     raum/brettregeln.js passt zu brettspiele/index.html')
    else:
        open(ZIEL, 'w', encoding='utf-8').write(neu)
        print('geschrieben:', ZIEL, len(neu), 'Zeichen')
