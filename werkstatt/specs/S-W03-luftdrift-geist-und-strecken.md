# S-W03: Luftdrift mit Geist der Bestzeit und drei Strecken (L1, L2)

**Status:** gebaut, freigegeben am 31.10.2026, 20:20
<!-- Freigabe durch den Betreiber im Projekt-Thread: "B1, b2, b3, l1, l2, a1". -->

## Ziel
In der Ringjagd fliegt ein durchsichtiges Flugzeug die eigene Bestzeit nach, und an jedem Ring steht der Abstand dazu (L1).
Es gibt drei Strecken mit eigener Landschaft, eigenen Ringen und eigenen Sternzeiten: Dorf und See (bisher), Küste mit Klippen und Leuchtturm, Berge mit Tal und Brücke (L2).

## Rechenmodell (verbindlich)
- **Strecke** = Daten: Türme (9), See oder Meer, Ortsmitte, Geländeformel, Farben, Wahrzeichen, Startpunkt, Sternzeiten. Die Welt wird beim Wechsel neu gebaut, alte Objekte werden freigegeben.
  Ringe stehen tangential zum Turm, Höhe über Gelände mindestens Ringradius + 12 m.
- **Sternzeiten** je Strecke aus Messung mit dem Testspieler "perfekt" (`__proto.auto = true`): 3 Sterne bis Messzeit × 1,15, 2 Sterne bis × 1,5 (gerundet auf 5 s). Dorf bleibt bei 95/125 s.
- **Geist:** Aufnahme in der Ringjagd alle 0,1 s Spielzeit: x, y, z, Kurs, Schräglage (auf 0,1 gerundet) und die Zeit je Ring.
  Nur eine vollständige Runde, die schneller als der gespeicherte Geist ist, ersetzt ihn; ohne gespeicherten Geist wird die erste vollständige Runde zum Geist
  (alte Bestzeiten aus der Zeit vor dem Geist haben keine Aufnahme). Gleich schnell ersetzt nicht. Ungültige Zeit beim Abspielen: kein Geist. Abspielen: lineare Mischung zwischen den beiden Nachbarpunkten; nach dem letzten Punkt verschwindet der Geist.
  Beim Ring: Meldung mit Abstand zur Ringzeit des Geists ("−1,2 s" schneller, "+0,8 s" langsamer).
- **Gespeicherte Daten (neu):** `localStorage["luftdrift3d.geist"] = {"formatversion":1,"strecken":{"dorf":{"zeit":…,"ringe":[…],"punkte":[[x,y,z,h,r],…]}}}`, höchstens 2400 Punkte je Strecke (4 min).
  Kaputte Daten, fremde Formatversion oder zu viele Punkte: kein Geist, kein Absturz. Bestwerte und Sterne je Strecke (Dorf behält die bisherigen Schlüssel).
- **Auswahl:** Im Startbild drei Knöpfe für die Strecke, gemerkt in den Einstellungen.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | 3 Strecken wählbar, je 9 Türme und 9 Ringe, alle Ringe ≥ Radius + 12 m über Gelände, kein Turm im Wasser | `strecken_aufbau` |
| AK-2 | Der Testspieler "perfekt" schafft die Ringjagd auf jeder Strecke unter 200 s Spielzeit | `strecken_fliegbar` |
| AK-3 | Streckenwechsel 10× hintereinander: Anzahl der Szenenobjekte bleibt gleich (keine Lecks), keine Skriptfehler | `strecken_wechsel` |
| AK-4 | Dreiecke je Bild auf Küste und Berge höchstens 1,3 × Dorf | `strecken_last` |
| AK-5 | Geist wird nur bei vollständiger Runde mit neuer Bestzeit gespeichert, mit Formatversion 1 und ≤ 2400 Punkten | `geist_speichern` |
| AK-6 | Abspielen: Position bei t zwischen zwei Punkten ist deren Mischung (Abweichung < 0,01 m); vor 0 erster Punkt, nach dem Ende unsichtbar | `geist_abspielen` |
| AK-7 | Kaputte Daten (`{x`, Formatversion 2, 5000 Punkte, Punkte mit Text) → kein Geist, kein Fehler | `geist_kaputt` |
| AK-8 | Ringmeldung zeigt den Abstand zur Geist-Ringzeit mit Vorzeichen und einer Nachkommastelle | `geist_abstand` |
| AK-9 | Bestwerte und Sterne je Strecke getrennt, alte Dorf-Werte bleiben erhalten | `bestwerte_je_strecke` |
| AK-10 | Seite lädt ohne Fehler und ohne Querscroll im Hoch- und Querformat | `seite_handy.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Jede Strecke bauen, Türme und Ringe zählen, Höhe der Ringe über Gelände prüfen | AK-1 |
| PS-2 | Fehlerfall | Unbekannte Strecke "mond" → Dorf | AK-1 |
| PS-3 | Normal | Testspieler fliegt Ringjagd auf allen drei Strecken | AK-2 |
| PS-4 | Wiederholbarkeit | 10× Strecke wechseln, Objektzahl gleich | AK-3 |
| PS-5 | Grenzwert | Dreiecke messen, Grenze 1,3 × Dorf | AK-4 |
| PS-6 | Normal | Runde fertig, neue Bestzeit → Geist gespeichert | AK-5 |
| PS-7 | Grenzwert | Runde fertig, gleich schnell oder langsamer → alter Geist bleibt | AK-5 |
| PS-8 | Fehlerfall | Runde abgebrochen → kein Geist | AK-5 |
| PS-9 | Grenzwert | Aufnahme über 240 s → bei 2400 Punkten Schluss | AK-5 |
| PS-10 | Normal | Abspielen zwischen zwei Punkten | AK-6 |
| PS-11 | Grenzwert | t < 0, t genau auf einem Punkt, t nach dem Ende | AK-6 |
| PS-12 | Missbrauch | Manipulierte Speicherdaten | AK-7 |
| PS-13 | Normal | Ring 3 mit Geist 1,25 s langsamer → "−1,3 s" (schneller als Geist) | AK-8 |
| PS-14 | Grenzwert | Kein Geist → Meldung ohne Abstand | AK-8 |
| PS-15 | Normal | Bestzeit auf Küste ändert Dorf nicht; alter Schlüssel `ringe` bleibt Dorf | AK-9 |

## Gegenproben
- Verstoß: Geist speichert auch langsamere Runden; Mischung nimmt immer den ersten Punkt; Formatversion wird nicht geprüft; Ring der Küste unter Gelände. Jeder muss seinen Test rot machen.
- Fehlalarm: genau gleiche Zeit wie Bestzeit ersetzt den Geist nicht und wird nicht als Fehler gemeldet; leerer Speicher ist kein Fehler.

## Nicht Teil dieser Änderung
- Geist im Rennen und in der Drift-Runde, Geister von Freunden, neue Spielmodi.

## Risiken und Kosten
Bildrate am Handy: Berge haben mehr Gelände-Relief, Bäume werden auf gleiche Zahl begrenzt. Speicher je Geist etwa 30 KB.
Im Container läuft WebGL in Software (~6 Bilder/s), Bildrate also nur am Handy messbar.

## Ergebnis
- Vorher (Stand 1460d4e): alle 9 Tests rot (Strecken und Geist fehlen).
- Nachher: 9 von 9 Tests grün (`werkstatt/tests/luft_test.js`), 7 von 7 Gegenproben erkannt (`gegenproben_luft.py`).
- Messzeiten Testspieler "perfekt" (Flughilfe stark): Dorf 75,6 s, Küste 58,2 s, Berge 42,7 s.
  Sternzeiten damit: Küste 65/85 s, Berge 50/65 s (× 1,15 und × 1,5, auf 5 s gerundet); Dorf bleibt 95/125 s.
- Dreiecke in der Szene (Obergrenze je Bild): Dorf 171 660, Küste 166 118, Berge 171 120, also höchstens 1,0 × Dorf.
- Streckenwechsel: ab der zweiten Runde gleiche Zahl an Objekten, Geometrien und Texturen (geteilte Teile werden beim ersten Besuch einmal geladen).
- Bildrate am Handy und Gefühl der neuen Strecken: Gerätetest offen. Berge ist mit 43 s die kürzeste Strecke (Sprint durch das Tal).
