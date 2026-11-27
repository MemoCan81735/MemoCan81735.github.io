# S-W29: Spieleraum (begehbares Wohnzimmer mit allen Spielen)

**Status:** gebaut, freigegeben am 27.11.2026, 05:42
<!-- Freigabe durch den Betreiber im Projekt-Thread per Entscheidungskarte: "Auf der Spieleseite /raum/" (27.11.2026, 05:42). -->

## Anlass
Der Betreiber hat ein begehbares 3D-Wohnzimmer bauen lassen (Vorschau im Projekt, Repo UnityRaum) und will darin seine Spiele sinnvoll platzieren und direkt spielen können. Gewählt: der Raum liegt auf der Spieleseite unter `raum/`, damit die Spiele im Raum öffnen (gleiche Herkunft, kein fremder Server).

## Anwendungsfall
- U-1: Der Besucher öffnet die Startseite, sieht oben die Rubrik Spieleraum, tippt "Eintreten" und steht im Wohnzimmer mit fünf Schildern.
- U-2: Der Besucher tippt auf ein Schild oder einen Gegenstand (Konsole, Spieltisch, Inselmodell, Staffelei, Perlenkästchen); er geht dorthin, der Gegenstand leuchtet, eine Tafel zeigt die Spiele dieses Platzes.
- U-3: Der Besucher tippt "Spielen"; das Spiel öffnet groß über dem Raum.
- U-4: Der Besucher tippt "← Zurück in den Raum" oder den Zurück-Link im Spiel und steht wieder am selben Platz im Raum.
- U-5: Der Besucher tippt "← Alle Spiele" und kommt zur Startseite.
- U-6: An der Konsole tippt der Besucher "Spielen"; die Kamera stellt sich vor den Fernseher, das Spiel läuft auf dessen Bildfläche im Raum. "Groß spielen" zeigt es über den ganzen Schirm, derselbe Knopf bringt es zurück auf den Fernseher.

## Umfang
- Neuer Ordner `raum/` mit `index.html`, `three.min.js` und `three-zusatz.js` (three.js 0.147, lokal, MIT) und `manifest.webmanifest`; Symbole `bilder/symbole/raum-192.png` und `-512.png`, Kartenbild `bilder/raum.jpg` (400×300), neue Rubrik Spieleraum oben auf der Startseite.
- Plätze und Spiele: Konsole am Fernseher (Driftpokal, Driftpokal v2, Luftdrift 3D, Kleine Rundfahrt, Ula Çarpsana!), Spieltisch am Couchtisch (Brettspiele), Inselmodell auf einem Sockel in der Raummitte (Neon Ada; bis 27.11.2026 im Regal), Staffelei am Fenster (Ebru, Ebru klassisch), Perlenkästchen auf dem Esstisch (Perlenwerkstatt). Am 27.11.2026 auf Wunsch des Betreibers getauscht (vorher Brettspiele am Esstisch, Perlen am Couchtisch).
- Nicht drin: Spiele, die nur als Android-Datei oder privat vorliegen (Driftpokal-App, Luftrennen-App, Tanzschule, Kalorien-Tracker); sie liegen nicht auf der Seite.
- Laufen wie bisher in der Vorschau: Doppelklick oder Doppeltippen geht hin, Ziehen sieht sich um, W A S D und Pfeile laufen, "Überblick" zurück zur Ecke, Abendsonne oder nur Lampen.
- Fernseher (Versuch an der Konsole, 27.11.2026): Rennspiele laufen auf der Bildfläche des Fernsehers im Raum, die Kamera stellt sich gerade davor; Knopf "Groß spielen" wechselt ohne Neuladen zur Vollansicht und zurück. Die anderen Plätze öffnen weiter das Spielfenster.
- Escape schließt Spielfenster oder Tafel, solange der Fokus im Raum liegt; im Spiel gehört Escape dem Spiel.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-5: statische Prüfung grün (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol 192 und 512, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1: Seite lädt bei 412×915 und 915×412 ohne Skriptfehler, ohne fremde Anfragen und ohne waagerechtes Scrollen | `seite_handy.js`, `raum_test.js` |
| AK-3 | Aus U-2: jedes der 5 Schilder öffnet seine Tafel mit der richtigen Zahl Spiele; Spielen-Taste mindestens 44 px und im Bild | `raum_test.js` |
| AK-4 | Aus U-3, U-4: Spiel öffnet im Spielfenster; Leiste und Zurück-Link im Spiel schließen es, die Adresse bleibt `/raum/` | `raum_test.js` |
| AK-5 | Aus U-1: Startseite verlinkt `raum/` mit Bild und Text in der Rubrik Spieleraum; alle 10 Spiel-Adressen gibt es | `raum_test.js` |
| AK-6 | Aus U-6: an der Konsole liegt das Spiel auf dem Fernseher (Seitenverhältnis der Bildfläche, ganz im Bild unter der Leiste); "Groß spielen" zeigt es über die ganze Breite; Zurück bringt die Tafel wieder | `raum_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat: alle Schilder nacheinander, Brettspiele öffnen und schließen | AK-3, AK-4 |
| PS-2 | Grenzwert | Querformat 915×412: Zurück-Link ganz im Bild, kein Querscrollen | AK-2 |
| PS-3 | Fehlerfall | Zurück-Link im Spiel gedrückt: Raum bleibt, Startseite lädt nicht im Fenster | AK-4 |
| PS-4 | Fehlerfall | Spiel-Adresse falsch geschrieben: Test rot | AK-5 |
| PS-5 | Missbrauch | Netzadresse für three.js eingebaut oder Zurück-Link entfernt: statische Prüfung rot | AK-1 |
| PS-6 | Grenzwert | Hochformat 412×915: Fernseher schmal, Spiel trotzdem ganz im Bild, Vollansicht per Knopf | AK-6 |

## Gegenproben
`python3 werkstatt/tests/gegenproben_raum.py`: Zurück im Spiel führt zur Startseite, Leiste schließt nicht, falsche Spiel-Adresse, fehlendes Spiel an der Konsole, Karte auf der Startseite falsch verlinkt, Spiel liegt nicht auf dem Fernseher; alle sechs machen `raum_test.js` rot (27.11.2026). Einzeln: `NUR=Fernseher python3 werkstatt/tests/gegenproben_raum.py`. Fremde Server und Zurück-Link deckt `seite_pruefen.py --gegenproben` ab.

## Technisches Design
- Schnittstellen: keine neuen; der Raum lädt Spiele per `<iframe>` von derselben Seite und hängt sich an deren Zurück-Link (`a.ng-zurueck`). Lädt das Fenster trotzdem die Startseite, schließt der Raum es.
- Datenformat: keine gespeicherten Daten; Plätze und Spiele stehen als Liste im Skript (Name, Adresse, kurzer Text).
- Alternativen: (a) Spiele im neuen Tab öffnen (verworfen: Raum geht verloren); (b) Spiele als Artifact einbetten (verworfen: fremde Seiten dort gesperrt); (c) Spielfenster auf derselben Seite (gewählt).
- Entscheidung: (c).
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite (fremde Server, Zurück-Link, Anonymität, Tippflächen, Handyformat). Keine unabhängige Prüfung durch einen zweiten Agenten in diesem Thread; nachholen, falls der Betreiber es wünscht.

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, nichts gespeichert; Spiele speichern wie bisher selbst auf dem Gerät.
- Sicherheit: nur eigene Adressen im Spielfenster, keine Texteingabe; Zugriff auf das Spiel nur zum Abfangen des Zurück-Links.
- Barrierefreiheit: Schilder und Tasten sind Knöpfe mit Text (mindestens 44 px, mit Tastatur erreichbar), Tafel liest sich vor (`aria-live`), Spielfenster als Dialog mit Fokus auf "Zurück in den Raum".
- Leistung: Seite etwa 40 KB plus three.js (etwa 670 KB, lokal); der Raum zeichnet nicht, solange ein Spiel offen ist; beim Fernseher erst ab dem Moment, in dem die Kamera steht.

## Kritische Testfälle
- PS-1: alle Plätze öffnen, Spiel öffnet und schließt
- PS-3: Zurück-Link im Spiel führt in den Raum
- PS-4: falsche Spiel-Adresse wird erkannt
- PS-6: Spiel auf dem Fernseher im Hochformat

## Clean Code
- Clean Code: Prüfergebnis: Raum als eine HTML-Datei wie die anderen Spiele (etwa 850 Zeilen, Plätze als Daten mit einer Bau-Funktion je Platz); Test unter 100 Zeilen, Gegenproben unter 45 Zeilen.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | Raum mit 5 Schildern da |
| U-2 | Spielen-Taste mindestens 44 px und im Bild |
| U-3 | Brettspiele öffnen im Spielfenster |
| U-4 | Zurück-Link im Spiel führt in den Raum |
| U-5 | Zurück-Link führt zur Startseite |
| U-6 | Spiel liegt auf dem Fernseher, ganz im Bild unter der Leiste |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W29-spieleraum.md
- Aktualisiert: werkstatt/tests/raum_test.js
- Aktualisiert: werkstatt/tests/gegenproben_raum.py
- Aktualisiert: werkstatt/README.md
- Aktualisiert: index.html

## Messwerte und Rückblick
- Erster Lauf im Testbrowser: die Wege zu den Plätzen dauerten zu lange, weil die Bildrate dort niedrig ist; die Bewegung rechnet jetzt mit der echten Zeit.
- Escape im Spiel: das Spiel bekommt den Fokus, Escape bleibt beim Spiel (Pausemenüs); der Test prüft Escape auf der Leiste des Raums.
- Abnahme am Handy offen.
