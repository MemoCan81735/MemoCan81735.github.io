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
- U-6: Der Besucher tippt "Spielen"; die Kamera stellt sich vor die Fläche des Platzes (Fernseher, Tisch, Sockel, Leinwand), das Spiel läuft darauf im Raum. "Groß spielen" zeigt es über den ganzen Schirm, derselbe Knopf bringt es zurück auf den Fernseher.
- U-8: Am Inselmodell tippt der Besucher bei "Neon Ada" auf "Spielen"; die Insel des Spiels steht als 3D-Modell auf dem Sockel, er formt sie durch Antippen direkt im Raum, Knöpfe und Anzeigen des Spiels liegen darüber.
- U-9: Am Perlenkästchen tippt der Besucher bei "Perlenwerkstatt" auf "Spielen"; das geplante Armband liegt als 3D-Perlenkette auf dem Esstisch, die Planung der Werkstatt steht daneben (quer) oder darunter (hoch), jede Änderung zeigt sich sofort an der Kette.
- U-10: Der Besucher sieht sich im Raum um und findet, was ein Wohnzimmer hat: Tür, Heizkörper unter den Fenstern, Lichtschalter, Steckdosen und eine Wanduhr mit der echten Uhrzeit. Tippt er auf die Tür, schwingt sie auf, dahinter liegt ein heller Flur, und er kommt zur Startseite.
- U-7: Am Spieltisch tippt der Besucher bei "Schach in 3D" (oder Vier gewinnt, Tic Tac Toe, Reversi, Dame, Mühle, Mangala, Tavla in 3D) auf "Spielen"; die Kamera blickt von der weißen Seite aufs Brett, er zieht durch Antippen von Figur und Feld, der Computer antwortet.

## Umfang
- Neuer Ordner `raum/` mit `index.html`, `three.min.js` und `three-zusatz.js` (three.js 0.147, lokal, MIT) und `manifest.webmanifest`; Symbole `bilder/symbole/raum-192.png` und `-512.png`, Kartenbild `bilder/raum.jpg` (400×300), neue Rubrik Spieleraum oben auf der Startseite.
- Plätze und Spiele: Konsole am Fernseher (Driftpokal, Driftpokal v2, Luftdrift 3D, Kleine Rundfahrt, Ula Çarpsana!), Spieltisch am Couchtisch (Schach, Vier gewinnt, Tic Tac Toe, Reversi, Dame, Mühle, Mangala und Tavla in 3D, dazu Brettspiele), Inselmodell auf einem Sockel in der Raummitte (Neon Ada; bis 27.11.2026 im Regal), Staffelei am Fenster (Ebru, Ebru klassisch), Perlenkästchen auf dem Esstisch (Perlenwerkstatt). Am 27.11.2026 auf Wunsch des Betreibers getauscht (vorher Brettspiele am Esstisch, Perlen am Couchtisch).
- Nicht drin: Spiele, die nur als Android-Datei oder privat vorliegen (Driftpokal-App, Luftrennen-App, Tanzschule, Kalorien-Tracker); sie liegen nicht auf der Seite.
- Laufen wie bisher in der Vorschau: Doppelklick oder Doppeltippen geht hin, Ziehen sieht sich um, W A S D und Pfeile laufen, "Überblick" zurück zur Ecke, Abendsonne oder nur Lampen.
- Fernseher (Versuch an der Konsole, 27.11.2026): Rennspiele laufen auf der Bildfläche des Fernsehers im Raum, die Kamera stellt sich gerade davor; Knopf "Groß spielen" wechselt ohne Neuladen zur Vollansicht und zurück. Seit 27.11.2026 abends gilt das für alle Plätze: Brettspiele auf der Couchtisch-Platte, Neon Ada auf dem Sockel, Ebru auf der Leinwand, Perlenwerkstatt auf dem Esstisch; liegende Flächen schräg von oben, das Spiel per Perspektive (CSS matrix3d) genau auf die Fläche gelegt, Figuren und Modell darauf werden solange ausgeblendet.
- Schach in 3D (27.11.2026 auf Wunsch des Betreibers): echtes Brett mit 32 Figuren auf dem Couchtisch, Figur antippen, erlaubte Felder leuchten, Zielfeld antippen, die Figur zieht sichtbar. Regeln aus `chess.js`, geladen aus `brettspiele/lib/` (dieselbe Datei wie im Spiel Brettspiele, Lizenz dort), Gegner wahlweise ein einfacher Computer (drei Halbzüge Vorausschau, spielt Schwarz) oder zu zweit; Zug zurück, Neu. Die Stellung bleibt im Raum stehen. Umwandlung immer zur Dame.
- Weitere Brettspiele in 3D (28.11.2026 auf Wunsch des Betreibers): Vier gewinnt (Rahmen steht auf dem Tisch, Steine fallen), Tic Tac Toe (Kreuz und Kreis auf Holz), Reversi (Steine drehen sich um, mögliche Felder sind markiert). Je Spiel Regeln als reine Funktionen und ein Computer mit Vorausschau (Tic Tac Toe vollständig, Vier gewinnt 5, Reversi 4 Halbzüge); gemeinsame Leiste, Zug zurück, Neu, zu zweit. Auf dem Tisch liegt immer das zuletzt gewählte Spiel.
- Dame, Mühle, Mangala und Tavla in 3D (28.11.2026, zweite Gruppe): Regeln und Computer sind wörtlich dieselben wie im Spiel Brettspiele. `werkstatt/regeln_raum.py` kopiert die Klassen (DameEntity, MuehleEntity, MangalaEntity, TavlaEntity, tavlaRegelwerk, AIEngines) unverändert nach `raum/brettregeln.js`; `--pruefen` meldet, wenn die Kopie veraltet ist. Dame: Stein antippen, Ziele leuchten grün, Schlagen ist Pflicht. Mühle: setzen, ziehen, springen; nach einer Mühle leuchten die Steine rot, die man nehmen darf. Mangala: Mulde antippen, die Glaskugeln liegen in den Mulden. Tavla: Tippen aufs Brett würfelt, Steine mit Zügen sind gelb markiert, Stein antippen, dann Ziel (Bar und Ablage rechts inklusive); der Computer würfelt und zieht selbst. Was auf der Tischplatte unter dem Brett liegt (Buch, Becher, Streuer), wird ausgeblendet, solange das Brett liegt; beim Spielen am Tisch wird die Abendsonne gedämpft.
- Neon Ada im Raum (28.11.2026 auf Wunsch des Betreibers): Das Spiel läuft mit `#raum` unsichtbar im Spielfenster über dem ganzen Bild; nur seine Knöpfe und Anzeigen sind zu sehen. Seine Insel (dieselben three.js-Körper, mit dem three.js des Raums gebaut) hängt es über `window.raumModell` auf der Deckplatte des Sockels ein; Antippen und die Lernmarke rechnen über die Raumkamera. Regeln, Speicher und Bedienung des Spiels bleiben unverändert. `werkstatt/bau_neon_ada.py` setzt die Änderung bei jedem Bau wieder ein. Das Schmuckmodell auf dem Sockel macht solange Platz. Geprüft und verworfen für die Rennspiele (eigene große Welten, bleiben auf dem Fernseher) und vorerst Ebru (liegt schon passend auf der Leinwand).
- Flache Spiele auf dem Handy: das Spiel bekommt mindestens 640 × 400 Pixel und wird per Perspektive verkleinert, damit es seine Bedienung nicht zusammenquetscht.
- Perlen als 3D-Armband (28.11.2026 auf Wunsch des Betreibers): Die Perlenwerkstatt öffnet unverändert im Spielfenster, rechts (quer) oder unten (hoch). Der Raum liest ihr Armband aus der Vorschau (`Perlen.ui.app.messung.geo` und `Perlen.entity.FARBEN`) und baut jede Perle in echter Größe in mm als 3D-Körper (rund, Rondelle, Tropfen, Herz, Buchstabenwürfel, Delica) auf dem Esstisch nach, dazu Band, Makramee-Knoten, Tesbih-Quaste und Anhänger. Die Kamera blickt im freien Bildteil auf die Kette (`setViewOffset`). Die Werkstatt selbst bleibt unverändert.
- Ausstattung (28.11.2026 auf Wunsch des Betreibers): Tür mit Zarge, Türblatt und Klinke in der linken Wand; Lichtschalter neben der Tür; Steckdosen an allen Wänden; Heizkörper unter beiden Fenstern; Wanduhr zwischen den Fenstern mit der Uhrzeit des Geräts. Stühle am Esstisch gab es schon (fünf).
- Feinschliff (28.11.2026 auf Wunsch des Betreibers): Punktlinien an Dielen und Wandstößen kamen vom Leuchteffekt, der ohne Kantenglättung rechnete; er rendert jetzt in ein Ziel mit 4-fach Kantenglättung (WebGL2), Wandstücke überlappen 1 cm, Dielen stoßen dicht an. Schwarze Spielsteine bekommen fast schwarze Farbe und wenig Spiegelung (das warme Licht färbte sie hellbraun). Im Hochformat blickt die Kamera 14° steiler auf flache Bretter (Vier gewinnt bleibt). Die Tür öffnet beim Antippen und führt wie "Alle Spiele" zur Startseite; sie ist ein Zusatzweg, per Tastatur bleibt "← Alle Spiele" der Weg hinaus. Ohne WebGL2 bleibt das Bild wie bisher ohne Kantenglättung (kein Fehler). Messwerte im Testbrowser (412×915): schwarze Bauern Helligkeit vorher 108 bis 132, nachher 11; Brett hintere zu vordere Kante vorher etwa 0,75, nachher 0,84.
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
| AK-7 | Aus U-6: Spieltisch und Staffelei zeigen ihr Spiel auf ihrer Fläche, ganz im Bild unter der Leiste | `raum_test.js` |
| AK-8 | Aus U-7: Schach in 3D: e2-e4 per Antippen, der Computer antwortet, Figuren stehen auf den richtigen Feldern; Zurück bringt die Tafel, die Stellung bleibt | `raum_test.js` |
| AK-9 | Aus U-7: Vier gewinnt, Tic Tac Toe und Reversi in 3D: eigener Stein liegt nach Antippen auf dem richtigen Feld, der Computer antwortet, Steine im Bild = Steine im Spielstand | `raum_test.js` |
| AK-10 | Aus U-7: Dame, Mühle und Mangala in 3D: eigener Zug nach Antippen steht (Dame: Stein, dann Ziel), der Computer antwortet; Regelkopie passt zu Brettspiele | `raum_test.js`, `regeln_raum.py --pruefen` |
| AK-12 | Aus U-8: Neon Ada: Insel steht als Modell auf dem Sockel (Spielseite im Raummodus), Antippen hebt dort Land; Zurück räumt sie weg, Tafel wieder da | `raum_test.js` |
| AK-13 | Aus U-9: Perlenwerkstatt: Perlen der 3D-Kette = Perlen der Vorschau der Werkstatt, Kette im freien Bildteil über dem Planungsfeld, Feld ganz im Bild; Zurück räumt die Kette weg | `raum_test.js` |
| AK-14 | Aus U-10: Tür mit Türblatt in einer Öffnung der linken Wand; Tür antippen öffnet sie und führt zur Startseite; Wanduhr zeigt die Uhrzeit des Geräts (Stunde und Minute auf 1°); Bild mit 4-fach Kantenglättung trotz Leuchteffekt | `raum_test.js` |
| AK-15 | Aus U-7: schwarze Figuren wirken schwarz (Helligkeit unter 45 von 255), weiße hell; im Hochformat schaut die Kamera steiler aufs Brett (hintere Kante mindestens 80 % der vorderen, Brett mindestens 75 % der Breite) | `raum_test.js` |
| AK-11 | Aus U-7: Tavla in 3D: Tippen würfelt, eigene Züge per Antippen, der Computer würfelt und zieht, je 15 Steine, Steine und Würfel im Bild = Spielstand | `raum_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat: alle Schilder nacheinander, Brettspiele öffnen und schließen | AK-3, AK-4 |
| PS-2 | Grenzwert | Querformat 915×412: Zurück-Link ganz im Bild, kein Querscrollen | AK-2 |
| PS-3 | Fehlerfall | Zurück-Link im Spiel gedrückt: Raum bleibt, Startseite lädt nicht im Fenster | AK-4 |
| PS-4 | Fehlerfall | Spiel-Adresse falsch geschrieben: Test rot | AK-5 |
| PS-5 | Missbrauch | Netzadresse für three.js eingebaut oder Zurück-Link entfernt: statische Prüfung rot | AK-1 |
| PS-6 | Grenzwert | Hochformat 412×915: Fernseher schmal, Spiel trotzdem ganz im Bild, Vollansicht per Knopf | AK-6 |
| PS-7 | Normal | Hochformat: jedes Spiel auf seiner Fläche öffnen und schließen | AK-7 |
| PS-8 | Grenzwert | Hochformat: hohe Figuren der ersten Reihe verdecken Felder dahinter, Antippen trifft trotzdem das gemeinte Feld | AK-8 |
| PS-9 | Normal | Vier gewinnt: Antippen weit oben in einer Spalte, der Stein fällt ganz nach unten | AK-9 |
| PS-10 | Fehlerfall | Regel in Brettspiele geändert, Kopie im Raum nicht neu erzeugt: Prüfung rot | AK-10 |
| PS-12 | Grenzwert | Hochformat 412×915: Insel ganz im Bild zwischen Anzeige oben und Knöpfen unten, Antippen trifft das Feld unter dem Ring | AK-12 |
| PS-13 | Grenzwert | Hochformat 412×915: Planung unten 58 % der Höhe, Kette im Streifen darüber; Querformat: Planung rechts, Kette links daneben | AK-13 |
| PS-14 | Normal | Uhr zu jeder Uhrzeit: Zeiger laufen im Uhrzeigersinn, um 3 Uhr steht der Stundenzeiger rechts | AK-14 |
| PS-15 | Grenzwert | Hochformat 412×915: Schach von vorn, schwarze Figuren in der Sonne, Brett füllt die Breite | AK-15 |
| PS-16 | Normal | Querformat: Tür antippen, sie schwingt auf, danach Startseite; im Verlauf zurück steht die Tür wieder zu | AK-14 |
| PS-11 | Normal | Tavla: nach dem Würfeln zwei Steine ziehen, der Computer ist dran, würfelt und zieht ohne Zutun | AK-11 |

## Gegenproben
`python3 werkstatt/tests/gegenproben_raum.py`: Zurück im Spiel führt zur Startseite, Leiste schließt nicht, falsche Spiel-Adresse, fehlendes Spiel an der Konsole, Karte auf der Startseite falsch verlinkt, Spiel liegt nicht auf dem Fernseher, Esstisch ohne Spielfläche, Computer antwortet im 3D-Schach nicht, Vier gewinnt: Stein fällt nicht nach unten, Tavla: Computer würfelt nicht, Neon Ada: Insel kommt nicht in den Raum, Armband kommt nicht auf den Esstisch, Wand ohne Türöffnung, Tür lässt sich nicht öffnen, Leuchteffekt ohne Kantenglättung, schwarze Figuren wieder hellbraun, Brett im Hochformat flach wie quer; alle siebzehn machen `raum_test.js` rot (28.11.2026). Veraltete Regelkopie: `regeln_raum.py --pruefen` wird rot. Einzeln: `NUR=Fernseher python3 werkstatt/tests/gegenproben_raum.py`. Fremde Server und Zurück-Link deckt `seite_pruefen.py --gegenproben` ab.

## Technisches Design
- Schnittstellen: keine neuen; der Raum lädt Spiele per `<iframe>` von derselben Seite und hängt sich an deren Zurück-Link (`a.ng-zurueck`). Lädt das Fenster trotzdem die Startseite, schließt der Raum es.
- Datenformat: keine gespeicherten Daten; Plätze und Spiele stehen als Liste im Skript (Name, Adresse, kurzer Text).
- Alternativen: (a) Spiele im neuen Tab öffnen (verworfen: Raum geht verloren); (b) Spiele als Artifact einbetten (verworfen: fremde Seiten dort gesperrt); (c) Spielfenster auf derselben Seite (gewählt).
- Entscheidung: (c).
- **Spur:** normal, weil sichtbare Änderungen ohne Sicherheit, Daten, Geld oder neue Architektur (Feinschliff 28.11.2026, rund 100 Zeilen Code).
- Phasenplan: 28.11.2026, dem Betreiber gemeldet, nicht anwendbar: Phase 5 (Review vor dem Bau) wurde für Neon Ada, Armband, Ausstattung und Feinschliff nicht vorab gemacht, Ersatz: Zweitprüfung durch `gegenleser` nach dem Bau, Befunde vor dem PR eingearbeitet; Phase 6 (Test rot vor Code) nur nachträglich, Ersatz: Gegenproben zeigen, dass jeder neue Test rot wird; Phase 13 (Abnahme am Handy) wartet auf den Betreiber, dort auch Leistung der Kantenglättung und Licht des Flurs prüfen.
- Zweitprüfung: 28.11.2026, `gegenleser`, keine Muss-Befunde; eingearbeitet: Tür-Test prüft die Drehung, Test für "im Verlauf zurück", fehlende E2E-Zeilen, Clean-Code-Zahlen, Messwerte; bewusst offen: Tür nur per Zeiger (Zusatzweg), Farbmessung nur bei Schach (Dame, Mühle, Reversi nutzen dasselbe Material). Früheste Stufen: Bildfehler und Farben im Test (`raum_kanten`, `raum_farben` mit Pixelmessung), Tür im Test, Abnahme am Handy.
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
- PS-8: Schach im Hochformat antippen

## Clean Code
- Clean Code: Prüfergebnis: Raum als eine HTML-Datei wie die anderen Spiele (Stand 28.11.2026: 2214 Zeilen, Plätze als Daten mit einer Bau-Funktion je Platz, Brettspiele, Armband und Neon-Ada-Brücke als eigene Blöcke); Test 229 Zeilen, Gegenproben 50 Zeilen. Test-Haken stehen gesammelt in `window.raumAusstattung`, `raumArmband`, `raumModell`, `raumSchach`.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | Raum mit 5 Schildern da |
| U-2 | Spielen-Taste mindestens 44 px und im Bild |
| U-3 | Brettspiele öffnen im Spielfenster |
| U-4 | Zurück-Link im Spiel führt in den Raum |
| U-5 | Zurück-Link führt zur Startseite |
| U-6 | Spiel liegt auf dem Fernseher, ganz im Bild unter der Leiste |
| U-6 | zeigt das Spiel auf seiner Fläche, ganz im Bild |
| U-7 | Zug e2-e4 per Antippen, der Computer antwortet |
| U-7 | eigener Stein liegt, der Computer antwortet |
| U-7 | eigener Zug steht, der Computer antwortet |
| U-7 | Tippen würfelt, dein Zug und der des Computers stehen |
| U-8 | Neon Ada steht als Insel auf dem Sockel, Antippen hebt dort Land |
| U-9 | Perlenwerkstatt legt das geplante Armband als 3D-Kette auf den Esstisch |
| U-10 | Tür mit Türblatt in einer Öffnung der linken Wand |
| U-10 | Wanduhr zeigt die Uhrzeit des Geräts |
| U-10 | Tür antippen öffnet sie und führt zur Startseite |
| U-10 | im Verlauf zurück steht die Tür wieder zu |
| U-10 | Bild mit Kantenglättung trotz Leuchteffekt |
| U-7 | Brett im Hochformat steil und groß, hintere Kante fast so breit wie die vordere |
| U-7 | schwarze Figuren wirken schwarz, weiße hell |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W29-spieleraum.md
- Aktualisiert: werkstatt/tests/raum_test.js
- Aktualisiert: werkstatt/tests/gegenproben_raum.py
- Neu: werkstatt/regeln_raum.py, raum/brettregeln.js
- Aktualisiert: werkstatt/bau_neon_ada.py
- Aktualisiert: neon-ada/index.html
- Aktualisiert: raum/index.html
- Aktualisiert: werkstatt/README.md
- Aktualisiert: index.html

## Messwerte und Rückblick
- Erster Lauf im Testbrowser: die Wege zu den Plätzen dauerten zu lange, weil die Bildrate dort niedrig ist; die Bewegung rechnet jetzt mit der echten Zeit.
- Escape im Spiel: das Spiel bekommt den Fokus, Escape bleibt beim Spiel (Pausemenüs); der Test prüft Escape auf der Leiste des Raums.
- Abnahme am Handy offen.
