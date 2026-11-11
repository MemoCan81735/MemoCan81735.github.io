# S-W23: Driftpokal Zusammenstoß nach Außenmaßen

**Status:** gebaut, freigegeben am 11.11.2026, 05:29
<!-- Freigabe im Projekt-Thread am 11.11.2026, 05:29: Entscheidungskarte "Wie sollen die Fahrzeuge künftig zusammenstoßen?", Wahl "Echte Außenmaße, beide Fassungen" (HTML und App gleich). -->

## Anlass
Befund am Handy (11.11.2026): "Beim driftpokal sehe ich das die Fahrzeuge sehr stark ineinander bzw überlappend sein können. Im apk und auch in html Version."
Ursache gemessen: Der Zusammenstoß rechnete mit einem Kreis von 2,0 m (Kart) bzw. 1,6 m (Motorrad) Durchmesser, das Bild ist 3,68 × 2,44 m bzw. 3,35 × 0,74 m groß.
Dieselbe Änderung steht im Quell-Repository Driftpokal (Version 37) und in der Godot-App (Spec `spec/phase6-aussenmasse.md` in CayYanlama); hier wird sie in die Seite übernommen.

## Anwendungsfall
- U-1: Im Pulk dicht auffahren: die Fahrzeuge berühren sich, stecken aber nicht ineinander.
- U-2: In der Kurve nebeneinander: seitliche Berührung ohne Überlappung.
- U-3: Motorrad neben Kart: das schmale Motorrad kommt näher heran als ein Kart (0,74 m statt 2,44 m Breite).
- U-4: Ein quer stehendes Kart wird seitlich getroffen: beide werden sauber getrennt.

## Umfang
Nur die Regel des Zusammenstoßes (Entity) und eine Hilfsrechnung (`Geo.capsuleNearest`). Darstellung, Ton, Menüs, Speicherstände unverändert. Keine neuen Daten, keine Berechtigung, keine fremden Server.
Außenmaß je Fahrzeug als Kapsel (Mittellinie in Fahrtrichtung plus Rundung): Kart `radius` 6,1, `half` 3,1 WE; Motorrad `radius` 1,85, `half` 6,5 WE (1 WE = 0,2 m).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Maße Kart 18,4 × 12,2 WE, Motorrad 16,7 × 3,7 WE | `s_masse` |
| AK-2 | Kart nebeneinander 12,1 WE stößt, 12,3 nicht; hintereinander 18,3 stößt, 18,5 nicht; Motorrad nebeneinander 3,5 stößt, 4,5 nicht | `s_grenzwerte` |
| AK-3 | Nach dem Auffahren (15 WE Mittenabstand) Spalt 0 ± 1e−9, Stoß wirkt, Funken an der Berührstelle (507,5) | `s_auffahren` |
| AK-4 | Quer ineinander: gültige Zahlen, Fahrzeuge werden getrennt | `s_quer` |
| AK-5 | Ein KI-Rennen (bewusst kleiner als im Quell-Repository: dort 36 Rennen in `spiel/test/test_aussenmasse.js`; hier nur der Nachweis, dass die übernommene Regel in der Seite wirkt) (Wiese, Karts und Motorräder, 3 Runden): alle im Ziel, größte Überlappung nach einem Schritt unter 0,5 WE (0,1 m), keine Seitenfehler | `s_rennen` |

## Prüfszenarien
| Nr. | Art | Szenario | Test |
| --- | --- | --- | --- |
| PS-1 | Normal | Auffahren mit 15 WE Mittenabstand (U-1) | s_auffahren |
| PS-2 | Grenzwert | Abstände knapp unter und über den Maßen, Kart und Motorrad (U-2, U-3) | s_grenzwerte |
| PS-3 | Fehlerfall | Mittellinien kreuzen sich quer (U-4) | s_quer |
| PS-4 | Missbrauch | ganzes Rennen mit gemischten Fahrzeugen, dichter Pulk | s_rennen |
| PS-5 | Wiederholbarkeit | feste Saat, Maße fest | s_masse, s_rennen |

## Gegenproben
In `tests/gegenproben_aussenmasse.py`: alte Maße, zu große Schwelle, alte Kreisregel, kein Rückfall beim Kreuzen; jede muss ihren Test rot machen.

## Technisches Design
- Schnittstellen: `Geo.capsuleNearest(ax, ay, ah, aHalf, bx, by, bh, bHalf)` (reine Rechnung, nächste Punkte zweier Mittellinien), `VEHICLES.kart/bike.radius` und `.half`, `RaceEntity._collide` (Abstand der nächsten Punkte gegen die Summe der Rundungen, Normale dazwischen).
- Datenformat: keines, nichts wird gespeichert. Die Regel-Prüfsumme für "Zu zweit" ändert sich, beide Geräte brauchen dieselbe Fassung.
- Alternativen: größerer Kreis (verworfen: seitlich Lücken von bis zu 1,2 m); gedrehtes Rechteck (verworfen: Ecken springen, Normale unstetig); Kapsel gewählt (glatte Normale, wenig Rechnung).
- Entscheidung: Kapsel, Werte und Rechnung wörtlich wie im Quell-Repository Version 37 (Commit 2501ac7), damit App und Seite gleich fahren.
- Design-Review: Entity-Schicht, Rechnung ohne Zeit und Zufall (R-01); unabhängige Prüfung durch einen zweiten Agenten gegen die Spec im Quell-Projekt am 11.11.2026, Befunde eingearbeitet.

## Querschnitt
- Datenschutz: keine Daten, keine Anfragen.
- Sicherheit: keine neuen Eingaben von außen; Grenzfall gleiche Mitte und Kreuzung ohne ungültige Zahlen.
- Barrierefreiheit: unverändert.
- Leistung: je Paar eine kurze Rechnung mehr, nur wenn die Fahrzeuge nah sind (Vorprüfung über den Mittenabstand).

## Kritische Testfälle
- PS-2: knapp unter und über den Maßen
- PS-3: Mittellinien kreuzen sich
- PS-4: ganzes Rennen mit gemischten Fahrzeugen

## Clean Code
- Clean Code: Prüfergebnis: 26 Zeilen mehr in `driftpokal/index.html` (eine reine Funktion, zwei Werte je Fahrzeug, eine geänderte Methode); textgleich zum Quell-Repository, die Seite bleibt eine einzelne HTML-Datei.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | s_auffahren |
| U-2 | s_grenzwerte |
| U-3 | s_grenzwerte |
| U-4 | s_quer |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W23-driftpokal-aussenmasse.md
- Aktualisiert: werkstatt/tests/aussenmasse_test.js
- Aktualisiert: werkstatt/tests/gegenproben_aussenmasse.py
- Aktualisiert: werkstatt/abnahme/S-W23-driftpokal-aussenmasse.md
- Aktualisiert: werkstatt/alle_tests.sh

## Nicht Teil dieser Änderung
Wände, Itemboxen (rechnen weiter mit Radius 5), Darstellung, Fahrgefühl außerhalb des Zusammenstoßes.

## Ergebnis
- Vorher: s_masse, s_grenzwerte, s_auffahren, s_rennen rot (alte Kreisregel). Nachher: 5 von 5 grün, alle 4 Gegenproben erkannt.
- Messwert s_rennen: größte Überlappung 0,27 WE (5 cm). Bild aus dem laufenden Spiel (Startaufstellung) geprüft: Fahrzeuge stehen getrennt.

## Messwerte
Quell-Repository, 36 KI-Rennen: größte Überlappung vorher 8,54 WE (1,71 m), nachher 0,40 WE (0,08 m); mittlere Zielzeit +0,15 %; Stöße +25 %.
