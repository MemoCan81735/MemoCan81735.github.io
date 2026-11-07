# S-W20: Ula Çarpsana! (Autoscooter-Crash-Derby) auf die Spieleseite

**Status:** gebaut, freigegeben am 07.11.2026, 13:15
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Demolition auch publizieren. Jetzt noch ein Fanny namen aus karadeniz zonguldak caycuma yöresinden", dazu "Darfst kreativ sein" und "Keine Marken verletzten" (13:16). -->

## Anlass
Der Betreiber will das Crash-Derby (Demolition Arena, Artifact-Version 24 mit Pause, Boss, Karten, Anlauf-Zeichen und Musik) öffentlich spielen lassen, mit einem lustigen Namen aus der Gegend um Çaycuma (Zonguldak, westliches Schwarzmeer). Gewählt: "Ula Çarpsana!" ("Ula" ist dort die typische Anrede, etwa "He du!"; zusammen: "He, fahr schon rein!"). Eigener Name, keine Marke, kein fremdes Spiel.

## Anwendungsfall
- U-1: Der Besucher öffnet die Startseite, sieht in der Rubrik Rennspiele die Karte "Ula Çarpsana!", tippt "Spielen" und sieht in unter 3 s den Titel mit dem Knopf "Fahren".
- U-2: Der Besucher tippt "Fahren", die Runde läuft, der Feuerring und die Gegner sind zu sehen.
- U-3: Der Besucher tippt im Titelbild "← Alle Spiele" und kommt zur Startseite zurück.
- U-4: Der Besucher legt die Seite auf den Startbildschirm und sieht das eigene Symbol.

## Umfang
- Neuer Ordner `ula/` mit `index.html`, `three.min.js` (r128, lokal) und `manifest.webmanifest`; Symbole `bilder/symbole/ula-192.png` und `-512.png`, Kartenbild `bilder/ula.jpg` (400×300), Karte in der Rubrik Rennspiele.
- Erzeugt mit `python3 werkstatt/bau_ula.py <dist/demolition-arena.html>`: Grundgerüst mit Symbol und Manifest, Google-Schriften entfernt (Systemschrift als Rückfall), three.js lokal, Prüfhaken `window.__dm` entfernt, Zurück-Link im Titelbild.
- Gespeichert wird nur auf dem Gerät (Bestwert, Tageswert, Lack; Schlüssel `demolition-v2` mit Formatversion 2 wie im Spiel).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-3, U-4: statische Prüfung grün (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol 192 und 512, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1: Seite lädt bei 412×915 und 915×412 ohne Skriptfehler und ohne waagerechtes Scrollen | `seite_handy.js` |
| AK-3 | Aus U-1, U-2: Titel "Ula Çarpsana!" in unter 3 s, kein fremder Host, kein `window.__dm`, nach "Fahren" verändert sich das Bild ohne Tippen innerhalb von 2 s | `ula_test.js` |
| AK-4 | Aus U-3: Zurück-Link im Titelbild mindestens 44 px hoch, ganz im Bild, Ziel `../` | `ula_test.js` |
| AK-5 | Aus U-1: Startseite verlinkt `ula/` mit Bild und Text | `ula_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat laden, Fahren tippen, 2 s laufen lassen | AK-3, AK-4 |
| PS-2 | Grenzwert | Querformat 915×412: Zurück-Link ganz im Bild | AK-2, AK-4 |
| PS-3 | Fehlerfall | Speicher gesperrt: Titel und Runde laufen trotzdem | AK-3 |
| PS-4 | Missbrauch | Google-Schrift oder Netzadresse für three.js eingebaut, Zurück-Link entfernt: Prüfung rot | AK-1 |
| PS-5 | Wiederholbarkeit | Bauskript zweimal: gleiche Datei | AK-1 |
| PS-6 | Grenzwert | Titel mit Systemschrift (ohne Google-Schrift) bei 412 px: ganz zu sehen, Zurück-Link frei vom Ton-Knopf | AK-4 |

## Gegenproben
Siehe `seite_pruefen.py --gegenproben` (Netzadresse, Zurück-Link weg). Zusätzlich: `ula_test.js` vor dem Anlegen von `ula/` rot (Seite fehlt); `bau_ula.py` bricht ab, wenn noch eine fremde Adresse, `__dm` oder "Claude" in der Datei steht.

## Messwerte und Rückblick
- Beim ersten Bild war der Titel "ÇARPSANA!" mit der Systemschrift abgeschnitten und der Zurück-Link lief unter den Ton-Knopf. Test PS-6 ergänzt (vorher rot), Titelgröße im Spiel auf höchstens 12,5 % der Breite gesetzt, Link nur so breit wie sein Text.
- Bauskript zweimal: gleiche Prüfsumme.

## Technisches Design
- Schnittstellen: keine neuen; `bau_ula.py` macht aus dem Bau des Spiels die Seite.
- Datenformat: Speicherschlüssel `demolition-v2`, Formatversion 2 (wie im Spiel, S-D03).
- Alternativen: (a) Artifact-Datei unverändert kopieren (verworfen: Google-Schriften, three.js aus dem Netz, Prüfhaken, kein Zurück-Link); (b) Bauskript (gewählt, wiederholbar).
- Entscheidung: (b). Die Prüfhaken werden in ein lokales Objekt umbenannt, damit der übrige Code unverändert bleibt.
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite (fremde Server, Anonymität, Zurück-Link, Marken). Keine unabhängige Prüfung durch einen zweiten Agenten, weil die Spiellogik unverändert aus dem geprüften Spiel kommt (S-D01 bis S-D11 mit eigenen Tests).

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, Spielstand nur im Gerät; Teilen nur über das Teilen-Fenster des Handys.
- Sicherheit: keine Texteingabe, kein Netzverkehr.
- Barrierefreiheit: Knöpfe mindestens 44 px, Ton abschaltbar, Lage auch sichtbar (Ring, Banner, Zeichen).
- Leistung: Seite etwa 95 KB plus three.js; Gerätemessung offen (Abnahmeliste des Spiels).

## Kritische Testfälle
- PS-1: kein fremder Host, Runde läuft
- PS-3: Speicher gesperrt, Spiel läuft trotzdem

## Clean Code
- Clean Code: Prüfergebnis: neue Dateien sind das Bauskript (unter 40 Zeilen) und der Test (unter 60 Zeilen); die Spieldatei bleibt eine HTML-Datei aus dem geprüften Spiel-Bau.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | Titel in unter 3 s |
| U-2 | Runde läuft |
| U-3 | Zurück-Link im Titelbild |
| U-4 | Symbol im Manifest |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W20-ula-carpsana.md
- Aktualisiert: werkstatt/tests/ula_test.js
- Aktualisiert: werkstatt/bau_ula.py
- Aktualisiert: index.html
