# S-W16: Wahrzeichen der Oer-Runde sichtbar machen (Leuchtsäule und großes Schild)

**Status:** gebaut, freigegeben am 04.11.2026, 22:58
<!-- Freigabe durch den Betreiber im Projekt-Thread: Frage "Welche Variante soll die Oer-Runde im Rennen bekommen?" und Wahl "C: Säule und großes Schild" (Bild mit drei Varianten, zwei Abstände, `docs/notizen/s-w16-varianten-2026-11-04.png`) -->

## Anlass
Die Wahrzeichen der Oer-Runde (S-W12) sind aus dem Rennen kaum zu finden. Die Schilder aus S-W13 sind weit weg unlesbar, die Moscheen und Kirchen gehen in der Landschaft unter. Beim Spielersicht-Bild vom 04.11.2026 ist kein Wahrzeichen zu erkennen. Der Betreiber hat Variante C gewählt: gelbe Leuchtsäule über jedem Wahrzeichen und größeres Schild.

## Anwendungsfälle
- U-1: Der Spieler fährt die Oer-Runde und sieht aus der Ferne eine gelbe Säule über jedem Wahrzeichen, auch wenn das Schild noch nicht lesbar ist.
- U-2: Der Spieler kommt näher und liest den Namen auf dem großen Schild.

## Rechenmodell (verbindlich)
- Schild: Breite 150 Einheiten (vorher 96), Höhe im gleichen Verhältnis (150 × 96 ÷ 512). Position und Abstandsregel aus S-W13 bleiben.
- Säule: je Wahrzeichen mit Schild ein Zylinder, Radius 2,2 Einheiten, 8 Seiten, von der Bodenhöhe des Wahrzeichens bis zur Unterkante des Schildes (Höhe = Schildhöhe minus Bodenhöhe, mindestens 1). Farbe gelb `#ffd23f`, Deckkraft 0,85 bei voller Sicht.
- Sichtbarkeit: Die Säule folgt dem Schild. Ist das Schild aus, ist es die Säule auch; sonst Deckkraft der Säule = 0,85 × Deckkraft des Schildes. Die Abstandsregel `labelAlpha` bleibt unverändert.
- Nur Darstellung. Keine Regeln, kein Speichern, keine Berechtigung. Strecken ohne Schilder bekommen keine Säulen.

## Technisches Design
- Schnittstellen: `TrackSceneUI._addLabel` legt Schild und Säule an; `TrackSceneUI.beacons` hält die Säulen (eine je Schild, gleiche Reihenfolge wie `labels`); `updateLabels(camera)` setzt Sichtbarkeit und Deckkraft beider.
- Datenformat: keine neuen Daten. Die Daten der Strecke `oer` bleiben unverändert (Formatversion wie bisher).
- Alternativen: (a) nur größere Schilder (Variante B, im Bild zu schwach aus der Ferne); (b) Wegweiser am Bildrand (neue Anzeige, mehr Fläche auf dem Handy); (c) Säule plus größeres Schild (gewählt).
- Entscheidung: (c). Die Säule ist in der Ferne als gelber Strich sichtbar, ohne die Fahrbahn zu verdecken, weil sie senkrecht und dünn ist und nur über den Gebäuden steht.
- Design-Review: Eigenprüfung durch den Autor gegen Spec und Regeln (Sicht auf die Fahrbahn, Fehlalarm bei anderen Strecken). Keine unabhängige Prüfung durch einen zweiten Agenten; die Änderung ist unter 150 Zeilen. Offen: Ob die Säulen am Handy die Fahrbahn stören, prüft die Abnahme.

## Querschnitt
- Datenschutz: keine Daten, kein Netz, keine Speicherung.
- Sicherheit: keine Eingabe vom Spieler; Texte der Schilder kommen aus der Strecke wie bisher.
- Barrierefreiheit: die Säule ist eine Farbe mit Kontrast zu Grün und Grau (gelb gegen Grasland); das Schild behält hellen Text auf dunklem Feld (S-W13 AK-5). Keine Schrift als einziger Hinweis.
- Leistung: 12 Säulen und 12 Schilder in der Oer-Runde, je ein Zylinder mit 8 Seiten; keine neue Textur, keine Schatten. Gerätetest (Handy) offen, weil hier nur der Container misst.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Oer-Runde hat 12 Säulen; die Strecke erken hat keine | `s16_saeulen_einbau` |
| AK-2 | Jede Säule steht am Standort des Wahrzeichens, auf dem Boden des Wahrzeichens, und reicht mindestens bis zur Unterkante des Schildes (Toleranz 0,01) | `s16_saeulen_hoehe` |
| AK-3 | Deckkraft Säule = 0,85 bei Abstand 60; Mitte (400) zwischen 0,3 und 0,85 und sichtbar; bei 900 unsichtbar und gleich dem Schild | `s16_saeulen_alpha` |
| AK-4 | Jedes Schild ist mindestens 140 Einheiten breit (vorher 96) | `s16_schild_gross` |
| AK-6 | Schildmitte 20 über dem höchsten Teil des Bauwerks (±0,6), höchstens 60 über dem Boden; im Querformat (915 × 412, Blickwinkel 50°, Kamera 150 entfernt, 10 hoch, waagrecht) liegt das Schild ganz unter dem oberen Bildrand (79,9) | `s16_schild_hoehe` |
| AK-5 | Bestehende Schild-Tests aus S-W13 und die Wahrzeichen-Tests aus S-W12 bis S-W14 bleiben grün | `wahrzeichen_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Oer-Runde: 12 Säulen, eine je Schild, am richtigen Ort | AK-1, AK-2 |
| PS-2 | Grenzwert | Abstand 60 (voll), 400 (Mitte), 900 (aus) | AK-3 |
| PS-3 | Fehlalarm | Strecke erken: keine Säule, Schilder unverändert | AK-1 |
| PS-4 | Normal | Schildbreite 150 je Schild | AK-4 |
| PS-6 | Grenzwert | Hohe Bauwerke (Fördergerüst 169, Moschee 52): Schild wird bei 60 gedeckelt | AK-6 |
| PS-7 | Normal | Niedriges Bauwerk (Kaufland 18): Schild 20 über dem Dach | AK-6 |
| PS-5 | Wiederholbarkeit | Zweimal aktualisieren ergibt dasselbe | AK-3 |

## Gegenproben
- Verstoß (Nachtrag): Schild ohne Höchstgrenze; Schild wieder nach Typhöhe. Beide machen `s16_schild_hoehe` rot.
- Verstoß: Säule fehlt; Säule steht in der Luft; Säule endet unter dem Schild; Säule ohne Ausblenden; Schild wieder 96 breit. Jede muss ihren Test rot machen (`werkstatt/tests/gegenproben_saeulen.py`).
- Fehlalarm: PS-3 (erken bleibt ohne Säulen).

## Kritische Testfälle
- PS-1: Säulen am richtigen Ort und mit richtiger Höhe in der Oer-Runde
- PS-2: Ausblenden bei Abstand 900 und Deckkraft in der Mitte

## Clean Code
- Clean Code: Prüfergebnis: Die Änderung in `driftpokal/index.html` ist etwa 25 Zeilen; die Spieldatei bleibt eine HTML-Datei wie bisher (Ausnahme für Spieldateien, siehe `werkstatt/README.md`). Neue Klassen gibt es keine. Gegenproben und Tests grün.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | `s16_saeulen_hoehe` und `s16_saeulen_alpha` |
| U-2 | `s16_schild_gross` |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W16-saeulen-wahrzeichen.md
- Aktualisiert: werkstatt/tests/saeulen_test.js
- Aktualisiert: driftpokal/index.html

## Veröffentlichung
- Version: Spieleseite, Commit folgt nach Abnahme.
- Änderungen: Säule und großes Schild an den Wahrzeichen der Oer-Runde.
- Rückweg: git revert des Commits, dann Seite neu laden.
- Linkprüfung: keine neuen Links.
- Lizenzen: keine neuen Bibliotheken.

## Ergebnis (04.11.2026)
- Tests: 4 von 4 grün, alle vorher rot (`saeulen_test.js`). S-W12 bis S-W14 (`wahrzeichen_test.js`) grün.
- Gegenproben: 5 von 5 erkannt.
- Offen: Abnahme am Handy (Sicht aus der Ferne, Lesbarkeit der Schilder).

## Nachtrag (05.11.2026): Schilder im Querformat zu hoch
- Befund vom Handy (Betreiber, 05.11.2026): "Die Schilder sind zu hoch im quer modus".
- Ursache (gemessen): Die Schildhöhe kam aus einer Tabelle je Typ mal Größe `s` (Moschee 46 × 2,6 + 6 = 126 über dem Boden). Seit S-W14 stehen Moscheen, Kirchen, Rathaus und Kaufland aber mit echtem Grundriss im Maßstab 1 und sind nur 18 bis 52 hoch. Die Schilder schwebten 32 bis 75 Einheiten über dem Dach und lagen im Querformat (Blickwinkel 50° statt 68° hochkant) oft über dem Bildrand.
- Änderung: `TrackSceneUI.labelLift`: Schildmitte 20 über dem höchsten Teil des gebauten Bauwerks, höchstens 60 über dem Boden. Die Säule reicht weiter bis zum Schild. Die Tabelle `LABEL_HEIGHT` ist entfallen.
- Messwerte (Schildmitte über dem Boden, vorher → nachher): Moscheen 125,6 → 60; Kirchen 111,6 → 60 (Dach 47,7); Rathaus 94 → 60 (Dach 45,7); Kaufland 50 → 38,2; Fördergerüste 186 → 60 (Gerüst 169, das Schild steht vor dem Gerüst).
- Tests: `s16_schild_hoehe` vorher rot (Moschee 125,6), danach grün; alle Säulen- und Wahrzeichentests grün; Gegenproben 7 von 7.
- Kleine Korrektur (etwa 15 Zeilen), keine neue Funktion, daher Nachtrag statt eigener Spec.
