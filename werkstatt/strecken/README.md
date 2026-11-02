# Strecken aus echten Straßen (S-W11)

Ein Befehl je Schritt, alles wiederholbar (Spec: `werkstatt/specs/S-W11-strecken-werkzeug.md`):

1. Daten holen (nur mit offenem Netz): `python3 werkstatt/strecken/abruf.py werkstatt/strecken/auftraege/oer-erkenschwick.json werkstatt/strecken/daten/`
2. Bauen: `python3 werkstatt/strecken/baue.py werkstatt/strecken/auftraege/oer-erkenschwick.json werkstatt/strecken/daten/<datei>.json werkstatt/strecken/strecken/oer.json`
3. Prüfen (Computerfahrer): `node werkstatt/strecken/pruefe.js werkstatt/strecken/strecken/oer.json . werkstatt/strecken/strecken/oer.pruefung.json`
4. Einbauen: `python3 werkstatt/strecken/einbauen.py werkstatt/strecken/strecken/oer.json werkstatt/strecken/strecken/oer.pruefung.json driftpokal/index.html`
   (rückgängig: `python3 werkstatt/strecken/einbauen.py --entfernen oer driftpokal/index.html`)

Der Auftrag nennt die Straßen in Fahrtreihenfolge (Name wie in OpenStreetMap, z. B. mit Bindestrich). Quelle der Daten: © OpenStreetMap-Mitwirkende (ODbL).
