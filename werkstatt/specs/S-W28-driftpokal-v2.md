# S-W28: Driftpokal v2 (Rechenkern in Rust) auf der Spieleseite

**Status:** gebaut, freigegeben am 24.11.2026, 12:36
<!-- Freigabe durch den Betreiber im Projekt-Thread: Entscheidungskarte "Driftpokal v2 öffentlich auf die Spieleseite stellen?", Wahl "Ja, als neue Kachel Driftpokal v2" (24.11.2026, 12:36). -->

## Anlass
Der Betreiber hat Driftpokal v2 am Handy angespielt ("Ich konnte es schnell starten") und will es als neue Kachel neben dem bisherigen Driftpokal auf der Seite haben. Das bisherige Spiel bleibt unverändert unter `driftpokal/`.

## Anwendungsfall
- U-1: Der Besucher öffnet die Startseite, sieht in der Rubrik Rennspiele die Karte "Driftpokal v2", tippt "Spielen" und sieht das Titelbild.
- U-2: Der Besucher startet ein Einzelrennen: sechs Karts, Countdown, Rennen, Ergebnis, "Nochmal".
- U-3: Der Besucher tippt ganz oben im Titelbild "← Alle Spiele" und kommt zur Startseite zurück (auch im Querformat ohne Scrollen).
- U-4: Der Besucher legt die Seite auf den Startbildschirm und sieht das eigene Symbol (Driftpokal mit "v2").

## Umfang
- Neuer Ordner `driftpokal-v2/` mit `index.html` (eine Datei, Rechenkern als WebAssembly eingebettet, Grafikbibliothek eingebettet) und `manifest.webmanifest`; Symbole `bilder/symbole/driftpokal-v2-192.png` und `-512.png`, Kartenbild `bilder/driftpokal-v2.jpg` (400×300), Karte in der Rubrik Rennspiele.
- Erzeugt mit `python3 werkstatt/bau_driftpokal_v2.py <dist/driftpokal-v2.html>` aus dem Bau im Projekt Driftpokal v2 (Spec S-002 dort).
- Enthalten: ein Rennen mit sechs Karts. Nicht enthalten (steht im Spiel-Projekt): Items, Windschatten, Zeitfahren, LAN, Speichern von Bestzeiten.
- Gespeichert wird nichts außer den Einstellungen des Titelbilds im Gerät (wie im bisherigen Spiel).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-3, U-4: statische Prüfung grün (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol 192 und 512, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1: Seite lädt bei 412×915 und 915×412 ohne Skriptfehler und ohne waagerechtes Scrollen | `seite_handy.js` |
| AK-3 | Aus U-1, U-2: Titelbild da, Rennen mit 6 Fahrzeugen startet, Spieler fährt, kein fremder Host, keine Seitenfehler (auch bei gesperrtem Speicher) | `driftpokal_v2_test.js` |
| AK-4 | Aus U-3: Zurück-Link ganz im Bild im Querformat 915×412, mindestens 44 px hoch, Ziel `../`, führt zur Startseite | `driftpokal_v2_test.js` |
| AK-5 | Aus U-1: Startseite verlinkt `driftpokal-v2/` mit Bild und Text in der Rubrik Rennspiele | `driftpokal_v2_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Querformat laden, Einzelrennen starten, Zeit läuft | AK-3 |
| PS-2 | Grenzwert | Querformat 915×412: Zurück-Link ganz im Bild | AK-2, AK-4 |
| PS-3 | Fehlerfall | Speicher gesperrt: Titelbild und Rennen laufen trotzdem | AK-3 |
| PS-4 | Missbrauch | Netzadresse für die Grafikbibliothek eingebaut, Zurück-Link entfernt: Prüfung rot | AK-1 |
| PS-5 | Wiederholbarkeit | Bauskript zweimal: gleiche Datei | AK-1 |

## Gegenproben
Siehe `seite_pruefen.py --gegenproben` (Netzadresse, Zurück-Link weg). Zusätzlich bricht `bau_driftpokal_v2.py` ab, wenn eine Test-Adresse, "Claude", der Name des Betreibers oder ein eigener Prüfhaken (`window.__…`, außer `__THREE__` der Grafikbibliothek) in der Datei steht. Das Spiel selbst ist im Projekt Driftpokal v2 mit 15 Gegenproben, 107 Tests und Vergleich gegen das bisherige Driftpokal geprüft.

## Messwerte und Rückblick
- `__fxRenderer` steht als Test-Zugang schon im bisherigen Driftpokal (S-W22) und im kopierten Bestand; der Test lässt genau diesen Namen zu.
- Der Zurück-Link "Alle Spiele" liegt im Titelbild unten und war im Querformat unter dem Bildrand (wie im bisherigen Driftpokal); das Bauskript setzt einen zweiten Link ganz nach oben. Test vorher rot (Link bei 551 px, Bild 412 px hoch).
- Ohne Grafikkarte dauert der Start im Test etwa 10 s (Schattierer übersetzen); am Handy meldete der Betreiber "schnell gestartet". Der Test wartet darum bis zu 120 s.
- Bauskript zweimal: gleiche Prüfsumme.

## Technisches Design
- Schnittstellen: keine neuen; `bau_driftpokal_v2.py` macht aus dem Bau des Spiels die Seite.
- Datenformat: keine eigenen Daten; Einstellungen wie im bisherigen Spiel.
- Alternativen: (a) Datei unverändert kopieren (verworfen: kein Symbol, kein Manifest, Zurück-Link im Querformat nicht sichtbar); (b) Bauskript (gewählt, wiederholbar).
- Entscheidung: (b).
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite (fremde Server, Anonymität, Zurück-Link, Marken). Keine unabhängige Prüfung durch einen zweiten Agenten, weil Rechenkern und Darstellung im Spiel-Projekt von `gegenleser` geprüft wurden (24.11.2026, drei Anbindungsfehler gefunden und behoben).

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, kein Tracking; nichts wird gesendet.
- Sicherheit: keine Texteingabe außer dem Namen im Spiel, kein Netzverkehr; WebAssembly läuft im Browser ohne Zugriff auf Dateien.
- Barrierefreiheit: Tasten mindestens 44 px, Ton abschaltbar, Zustände auch durch Text und Form sichtbar.
- Leistung: Seite etwa 1,6 MB (eine Datei); Zeit je Bild im Kern 0,15 ms bei 4-facher Drosselung (Grenze 4 ms), Start am Handy vom Betreiber als schnell gemeldet.

## Kritische Testfälle
- PS-1: Rennen startet, Spieler fährt, kein fremder Host
- PS-2: Zurück-Link im Querformat ganz im Bild
- PS-3: Speicher gesperrt, Spiel läuft trotzdem

## Clean Code
- Clean Code: Prüfergebnis: neue Dateien sind das Bauskript (unter 60 Zeilen) und der Test (unter 60 Zeilen); die Spieldatei bleibt eine HTML-Datei aus dem geprüften Spiel-Bau.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | Titelbild da |
| U-2 | Rennen mit 6 Fahrzeugen startet |
| U-3 | Zurück-Link führt zur Startseite |
| U-4 | Symbol im Manifest |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W28-driftpokal-v2.md
- Aktualisiert: werkstatt/tests/driftpokal_v2_test.js
- Aktualisiert: werkstatt/bau_driftpokal_v2.py
- Aktualisiert: index.html
