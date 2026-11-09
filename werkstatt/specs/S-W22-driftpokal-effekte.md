# S-W22: Driftpokal Bildeffekte (Sonnenblendung, Tempo-Sog)

**Status:** gebaut, freigegeben am 08.11.2026, 19:23
<!-- Freigabe durch den Betreiber im Projekt-Thread am 08.11.2026, 19:23: Auswahl "Alle drei" (Sonnenblendung, Tempo-Sog, Rücklichtspur). Beim Bauen zeigte sich, dass die Rücklichtspur im Spiel schon existiert (Rücklicht-Funken in `_effects`, jede Tageszeit); sie entfällt daher, der Umfang wird kleiner, nicht größer. -->

## Anlass
Wunsch: Der HTML-Driftpokal soll mehr Wirkung bekommen, mit three.js statt PixiJS (PixiJS ist nur 2D und ersetzt nichts). Bestandsaufnahme am 08.11.2026:
Leuchten (Bloom), Schatten, Farbstimmung (S-W10), Drift-Funken, Rauch, Reifenspuren, Staub abseits der Bahn, Spritzwasser bei Regen, Turbo-Flammen, Tempo-Linien,
Kamerawackeln, Sichtfeld-Dehnung beim Turbo und Rücklichtspur gibt es **schon**. Neu sind nur die zwei Effekte unten.

## Anwendungsfall
- U-1: Der Fahrer blickt bei klarem Tageslicht oder Abendsonne Richtung Sonne und sieht eine warme Blendung mit Strahlen, die mit dem Blickwinkel stärker und schwächer wird.
- U-2: Der Fahrer zündet den Turbo und sieht am Bildrand einen Sog (radiale Unschärfe, leichter Farbsaum), die Bildmitte bleibt scharf; nach dem Turbo verschwindet der Sog in unter 0,6 s.

## Umfang
Nur Darstellung (UI). Fahrphysik, Rennen, Speicherstände, Ton, Menüs unverändert. Keine neuen Daten, keine Berechtigung, keine fremden Server.
Schalter `FX_LOOK.glare` und `FX_LOOK.sog` und Grenzen in `FX_LOOK`. Beide Effekte liegen im Schlussdurchgang der Nachbearbeitung (Grafikstufe "sharp"), ohne zusätzlichen Durchgang; die Rechnung steht in `FxMathUI` (rein, ohne Zeit und Zufall).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Blendung: 0 bei Regen, Nacht, Sonne unter dem Horizont und bei ungültigen Eingaben; bei Blickwinkel bis 20° mindestens 0,3; ab 60° genau 0; nie über 0,6 | `s_blendung` |
| AK-2 | Sog: 0 ohne Turbo; bei Turbo in höchstens 0,25 s auf mindestens 0,5 (höchstens 1); nach Turbo-Ende in höchstens 0,6 s unter 0,05 | `s_sog` |
| AK-3 | Im echten Rennen kommen die Werte im Schlussdurchgang an (Blendung ≥ 0,3 bei Blick zur Sonne, Sog ≥ 0,5 bei Turbo, 0 bei Regen und Nacht) | `s_verdrahtung` |
| AK-4 | Bild: Sonnenbereich mit Blendung mindestens 8 % heller als ohne; Bildrand außerhalb der Blendung ±4 % | `s_bild` |
| AK-5 | Leistung: Zeichenaufrufe höchstens +12; Bildzeit im Software-Renderer höchstens +10 % (nur Richtwert, Messung am Handy in der Abnahmeliste) | `s_leistung` |
| AK-6 | Rennen startet ohne Skriptfehler und ohne Anfragen an fremde Server | `s_verdrahtung`, `s_bild` |
| AK-7 | Beide Schalter aus: Blendung und Sog sind genau 0 (Schlussdurchgang rechnet dann wie vorher, `uGlare.z` und `uSog` unter den Schwellen) | `s_verdrahtung` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Klarer Tag, Blick zur Sonne: Blendung zwischen 0,3 und 0,6 | AK-1 |
| PS-2 | Grenzwert | Winkel 19,9°, 20°, 40°, 60°, 61°, 180°; Sonne am Horizont und im Zenit | AK-1 |
| PS-3 | Fehlerfall | Regen, Nacht, Sonne unter dem Horizont: Blendung genau 0 | AK-1, AK-3 |
| PS-4 | Missbrauch | NaN, undefined, Infinity, negativer Winkel, fehlende Bedingungen, Blickrichtung Länge 0 oder NaN: Stärke 0, Winkel 180, kein Fehler | AK-1 |
| PS-5 | Normal | Turbo an und aus: Aufbau- und Abklingzeit | AK-2 |
| PS-6 | Wiederholbarkeit | Turbo zehnmal hintereinander: gleiche Kurve, nichts bleibt hängen | AK-2 |
| PS-7 | Grenzwert | Turbo kürzer als 0,1 s; riesiger, negativer und NaN-Zeitschritt (Pause) | AK-2 |
| PS-8 | Normal | Im echten Rennen: Blendung, Sog, Regen, Nacht kommen als Uniform an | AK-3 |
| PS-9 | Fehlerfall | Schalter aus: Werte genau 0, auch bei Blick zur Sonne und Turbo | AK-7 |
| PS-10 | Normal | Bildvergleich mit/ohne Blendung, Sonne im Bild | AK-4 |
| PS-11 | Fehlalarm | Schalter aus, zweimal gemessen: Rauschen unter 2 % (Messung stimmt) | AK-4 |
| PS-12 | Normal | Zeichenaufrufe und Bildzeit mit/ohne beide Effekte, drei Läufe je Seite | AK-5 |
| PS-13 | Normal | Fehler und fremde Anfragen beim Rennstart | AK-6 |

## Gegenproben
- Verstoß: Blendung bei Regen an; Blendung bis 0,9; Sog klingt nicht ab; Sog baut zu langsam auf; Schalter aus wird ignoriert; Blendung ohne Wirkung im Bild; Blendung füllt das ganze Bild. Jeder muss seinen Test rot machen (`gegenproben_effekte.py`).
- Fehlalarm: PS-11 (Schalter aus gibt kein Rauschen), Blick weg von der Sonne gibt keine Blendung (PS-2).

## Technisches Design
- Schnittstellen: `FX_LOOK` (Schalter, Grenzen), `FxMathUI.angle/glare/sogStep` (reine Rechnung), `Renderer3DUI._updateFx(focus, dt)` setzt `uGlare` (x, y Lage der Sonne im Bild, z Stärke) und `uSog` im Schlussdurchgang; `window.__fxRenderer` nur für Tests.
- Datenformat: keines, nichts wird gespeichert.
- Alternativen: eigener Vollbild-Durchgang (verworfen: kostet auf dem Handy einen Durchgang, auch wenn der Effekt aus ist); Strahlen als Sprites in der Szene (verworfen: Sonne wird nicht von Bäumen verdeckt, Sprite flackert beim Schwenk); Rücklichtspur neu (entfällt, existiert schon).
- Entscheidung: Beide Effekte im vorhandenen Schlussdurchgang, mit Verzweigung nach Uniform: ohne Effekt läuft der alte Zweig, mit Sog sechs zusätzliche Abtastungen, mit Blendung nur innerhalb 0,5 Bildhöhen um die Sonne.
- Design-Review: Architektur Entity/Boundary/Control unberührt (nur UI-Schicht), Rechnung rein und ohne Zeit/Zufall (R-01); geprüft vom Bauer gegen die Regeln, Änderung unter 150 Zeilen.

## Querschnitt
- Datenschutz: keine Daten, keine Anfragen.
- Sicherheit: keine neuen Eingaben von außen; ungültige Zahlen ergeben 0.
- Barrierefreiheit: Blendung höchstens 0,6 und nur in Sonnennähe; Sog nur während des Turbos, Bildmitte (Strecke) bleibt scharf. Kein Blinken.
- Leistung: Zeichenaufrufe unverändert, kein zusätzlicher Durchgang; Handymessung in der Abnahmeliste.

## Kritische Testfälle
- PS-3: Regen, Nacht, Horizont ohne Blendung
- PS-4: ungültige Eingaben
- PS-7: kurzer Turbo und Pause
- PS-9: Schalter aus
- PS-10: Blendung sichtbar im Bild

## Clean Code
- Clean Code: Prüfergebnis: rund 75 Zeilen in `driftpokal/index.html` (eine Klasse, ein Schalterobjekt, 30 Zeilen Shader, eine Methode); die Seite bleibt bewusst eine einzelne HTML-Datei.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | s_bild |
| U-2 | s_sog |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W22-driftpokal-effekte.md
- Aktualisiert: werkstatt/tests/effekte_test.js
- Aktualisiert: werkstatt/tests/gegenproben_effekte.py
- Aktualisiert: werkstatt/abnahme/S-W22-driftpokal-effekte.md
- Aktualisiert: werkstatt/alle_tests.sh

## Nicht Teil dieser Änderung
PixiJS, neue Wetterarten, Rücklichtspur (gibt es schon), Fahrphysik, Godot-Version, Verdeckung der Sonne durch Bäume.

## Ergebnis
- Vorher: alle fünf Tests rot (`FxMathUI` fehlte). Nachher: 5 von 5 grün.
- Messwerte (Software-Renderer, Königspark): Sonnenbereich +24,9 %, Bildrand 0,00 %, Rauschen 0,00 %; Zeichenaufrufe +0 bis +3, Bildzeit im Software-Renderer +4,8 % (3,3 zu 3,5 ms; ein früherer Lauf zeigte −18 %, der Vergleich schwankt also stark und ist nur ein Richtwert); Gerätemessung steht aus. Alle 7 Gegenproben erkannt.
- Beim Bauen gefunden: (1) Königspark hat die Sonne fast im Zenit (el 0,85), daher kaum Blendung im normalen Lauf; Blendung zeigt sich vor allem bei Abendsonne und Strecken mit niedriger Sonne. (2) Der Rand-Messbereich links lag auf einem fahrenden Kart und sprang zwischen zwei Werten (100 und 116); Messbereich nach rechts oben (Himmel, Bäume) verlegt. (3) Erster Sog war zu stark (Geisterbilder, grelle Farbsäume), halbiert. (4) `look` ist eingefroren (frozen), Tests ersetzen das Objekt statt Felder zu ändern.
