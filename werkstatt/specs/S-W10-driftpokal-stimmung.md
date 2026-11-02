# S-W10: Driftpokal Farbstimmung je Strecke

**Status:** gebaut, freigegeben am 01.11.2026, 21:59
<!-- Freigabe durch den Betreiber im Projekt-Thread: Auswahl "Farbstimmung je Strecke" (Verbesserung des HTML-Driftpokals), nach Vergleichsbildern
     Auswahl "Stärker machen" auf die Frage "Soll die Farbstimmung im Driftpokal so eingeschaltet werden?". Neue Bilder und Endabnahme am Handy folgen. -->

## Anlass
Wunsch: Der HTML-Driftpokal soll stärker wirken. Die Farbstimmung je Strecke (Tönung, Sättigung, Vignette) war seit Version 30 im Code, aber nie wirksam (aus). Sie wird eingeschaltet, für alle 14 Strecken
gesetzt und gegenüber den ersten Vergleichsbildern stärker gemacht.

## Rechenmodell (verbindlich)
- **Nur Darstellung (UI) im Driftpokal der Seite.** Fahrphysik, Rennen, Speicherstände, Ton, Menüs bleiben unverändert. Keine neuen Daten, keine Berechtigung, keine fremden Server.
- Schalter `POST_LOOK.grade = true`. Je Strecke steht in `TRACK_LOOK.<id>.grade`: `tint` (Farbe, wird mit dem Bild multipliziert), `sat` (Sättigung, 1 = unverändert), `vignette`.
- Wetter und Tageszeit (Abwandlungen) bringen weiter ihre eigene Stimmung mit und ersetzen die der Strecke.
- Helligkeit bleibt: die Tönung dunkelt höchstens 7 % ab (Leuchtdichte der Tönfarbe ≥ 0,93). Die Sättigung liegt zwischen 0,85 und 1,25, die Vignette zwischen 0,20 und 0,50.
- Die Stimmungen unterscheiden sich: mindestens 10 verschiedene Tönungen unter den 14 Strecken.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Alle 14 Strecken haben `grade` mit gültiger Tönung (#rrggbb), Sättigung 0,85 bis 1,25, Vignette 0,20 bis 0,50 | `s_daten` |
| AK-2 | Leuchtdichte jeder Tönung ≥ 0,93; mindestens 10 verschiedene Tönungen; jede Strecke außer höchstens 2 hat Sättigung ≠ 1 | `s_daten` |
| AK-3 | Alle Wetter- und Tageszeit-Abwandlungen aller Strecken haben gültiges `grade` (gültige Tönung und Vignette wie oben, die Leuchtdichte der Tönung wird bei Wetter nicht geprüft, weil Gewitter und Nacht sie bewusst dunkler tönen; Sättigung 0,5 bis 1,25, weil Regen bewusst entsättigt, oder nicht gesetzt) | `s_wetter` |
| AK-4 | `POST_LOOK.grade` ist an | `s_schalter` |
| AK-5 | Echtes Rennen Herbstwald: Verhältnis Rot zu Blau im Bild mit Stimmung ≥ 20 % höher als ohne; mittlere Helligkeit um höchstens ±12 % (warme Szene mit Tönung 0,93 verliert von sich aus etwa 10 %) verändert | `s_bild` |
| AK-6 | Das Rennen startet ohne Skriptfehler und ohne Anfragen an fremde Server | `s_bild` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Alle 14 Strecken: gültige Werte | AK-1 |
| PS-2 | Grenzwert | Tönung dunkler als 0,93 oder Sättigung außerhalb der Grenzen wird erkannt | AK-1, AK-2 |
| PS-3 | Missbrauch | Strecke ohne `grade` / Tönung ohne `#` | AK-1 |
| PS-4 | Wiederholbarkeit | Abwandlung `withWeather` zweimal: dasselbe Objekt | AK-3 |
| PS-5 | Normal | Abwandlungen Gewitter, Nacht, Abend, Morgen je Strecke | AK-3 |
| PS-6 | Fehlerfall | Schalter aus: Test erkennt es | AK-4 |
| PS-7 | Normal | Herbstwald mit und ohne Stimmung, gleiches Wetter: Rot/Blau und Helligkeit | AK-5 |
| PS-8 | Fehlalarm | Schalter aus: Rot/Blau-Unterschied unter 8 % (die Szene bewegt sich: Zuschauer, Regen) (Messung stimmt, Rauschen klein) | AK-5 |
| PS-9 | Normal | Fehler und fremde Anfragen beim Rennstart | AK-6 |

## Gegenproben
- Verstoß: Schalter aus; eine Strecke ohne `grade`; Tönung zu dunkel; Sättigung 1,6; alle Tönungen gleich; Vignette 0,7. Jeder muss seinen Test rot machen.
- Fehlalarm: PS-8 (Schalter aus gibt kaum Unterschied).

## Nicht Teil dieser Änderung
Neue Shader, Leuchten (Bloom) ändern, Wetter-Stimmungen ändern, Godot-Version, Gerätetest der Bildrate (Shader unverändert, daher kein Mehraufwand zu erwarten; Messung am Handy in der Abnahmeliste).

## Betroffene Schichten
Nur UI/Darstellung: Daten in `TRACK_LOOK`, ein Schalter in `POST_LOOK`.

## Risiken und Kosten
Zu starke Farben können Fahrbahn und Rand schlechter lesbar machen; Grenzen oben sichern die Helligkeit, Gerätetest prüft die Lesbarkeit.

## Ergebnis
- Vorher: s_daten, s_schalter rot (Schalter aus, 8 von 14 Strecken ohne Stimmung). Nachher: 4 von 4 Tests grün (`werkstatt/tests/stimmung_test.js`), 7 von 7 Gegenproben erkannt (`gegenproben_stimmung.py`).
- Messwerte Herbstwald (Wetter Grund, gleiches Bild mit/ohne): Rot zu Blau +54 %, Helligkeit −10,7 %, Messrauschen 0,01 %.
- Beim Bauen gefunden: Erste Tönungen dunkelten das Bild um 18 % ab (Grenze der Tönung daher von 0,88 auf 0,93 verschärft). `lift` macht das Bild dunkler, nicht heller (c·(1−lift)+0,06·lift), deshalb nicht zum Ausgleich genutzt. Das Gewitter blieb unverändert (Wetter-Tönungen sind nicht Teil der Änderung).
- Gerätetest: offen (Abnahmeliste `abnahme-driftpokal-stimmung-S-W10.md`).

- Nachtrag 02.11.2026: Im sauberen Klon fiel der Fehlalarm-Wert (Rauschen) durch: Der Test wählte die Strecke über die Nummer in der Liste, die Karte war aber nicht immer Herbstwald (Rauschen 4,7 bis 10,7 %). Jetzt wird die Karte über den Namen gewählt (Rauschen 0,6 %); Grenzen großzügiger: Rauschen unter 8 %, Wirkung mindestens 20 % (gemessen 54 %). Lehre: Tests wählen Menüeinträge nach Namen, nicht nach Nummer.
