# S-W17: Alpenetappe (Radrennen) auf die Spieleseite

**Status:** gebaut, freigegeben am 05.11.2026, 04:53
<!-- Freigabe durch den Betreiber im Projekt-Thread: Frage "Kannst du das auch publizieren?" zur Alpenetappe (Fassung 8c) -->

## Anlass
Der Betreiber will das überarbeitete Radrennen (Sog und Schleuder, Tagesrennen, Geist) auch auf der öffentlichen Seite spielen lassen.

## Anwendungsfälle
- U-1: Der Spieler öffnet die Startseite, tippt auf die Karte Alpenetappe, sieht das Startmenü und fährt los.
- U-2: Der Spieler tippt auf "Alle Spiele" und kommt zur Startseite zurück.

## Umfang
- Neuer Ordner `etappenrennen/` mit `index.html`, `three.min.js` (r128, lokal), `manifest.webmanifest`; Symbole `bilder/symbole/etappenrennen-192.png` und `-512.png`, Kartenbild `bilder/etappenrennen.jpg`, Karte in der Rubrik Rennspiele.
- Erzeugt mit `python3 werkstatt/bau_etappenrennen.py <Prototyp>`: Grundgerüst (doctype, charset, viewport), three.js lokal statt Netzadresse, Prüfhaken `window.__proto` entfernt, Zurück-Link, Autopilot-Zeile versteckt.
- Gespeichert wird nur auf dem Gerät (Bestzeit, Rundfahrt, Tagesrennen), wie im Prototyp mit Formatversion.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Statische Prüfung grün (keine fremden Server, Verweise vorhanden, Zurück-Link, Symbol, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Seite lädt bei 412×915 und 915×412 ohne Konsolenfehler, ohne waagerechtes Scrollen | `seite_handy.js` |
| AK-3 | Im Netz wird kein fremder Host angefragt, `window.__proto` fehlt | `etappe_test.js` |
| AK-4 | Spiel läuft: nach Start steigt die Zeit, Knopf Spielen/Tagesrennen reagieren, Bild zeigt Fahrer (Pixel-Unterschied) | `etappe_test.js` |
| AK-5 | Startseite verlinkt `etappenrennen/` mit Bild und Text | `seite_pruefen.py` S3 |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Seite laden, Spielen drücken, 3 s laufen lassen | AK-3, AK-4 |
| PS-2 | Grenzwert | Querformat 915×412 | AK-2 |
| PS-3 | Fehlerfall | Speicher gesperrt: Spiel läuft trotzdem | AK-4 |
| PS-4 | Missbrauch | Zurück-Link entfernt oder Netzadresse für three.js: Prüfung rot | AK-1 |
| PS-5 | Wiederholbarkeit | Zweimal laden und starten gibt gleiches Ergebnis | AK-4 |

## Gegenproben
Siehe `seite_pruefen.py --gegenproben` (Netzadresse, Zurück-Link weg). Zusätzlich: Prüfhaken im Test wieder einbauen muss AK-3 rot machen.

## Technisches Design
- Schnittstellen: keine neuen; `bau_etappenrennen.py` macht aus der Prototyp-Datei die Seite.
- Datenformat: Speicherschlüssel `etappenrennen.*` mit Formatversion wie im Prototyp (S-006 der App).
- Alternativen: (a) Prototyp unverändert kopieren (verworfen: Netzadresse für three.js, Prüfhaken, kein Startmenü); (b) Bauskript (gewählt, wiederholbar).
- Entscheidung: (b). Beim Laden zeichnet das Spiel ein Bild und öffnet dann das Startmenü.
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite (fremde Server, Anonymität, Zurück-Link). Keine unabhängige Prüfung durch einen zweiten Agenten, weil die Spiellogik unverändert aus dem geprüften Prototyp kommt.

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, Speicherung nur lokal (Bestzeit, Rundfahrt, Tagesrennen).
- Sicherheit: keine Eingabe außer Tippen; kein Netzverkehr.
- Barrierefreiheit: Knöpfe mindestens 44 px hoch, Bewegung folgt `prefers-reduced-motion`.
- Leistung: Messwert auf dem Handy offen (Gerätetest), hier nur Container mit Software-Darstellung.

## Kritische Testfälle
- PS-1: kein fremder Host, keine Prüfhaken, Bild verändert sich nach Start
- PS-3: Speicher gesperrt, Spiel läuft trotzdem

## Clean Code
- Clean Code: Prüfergebnis: neue Dateien sind das Bauskript (unter 30 Zeilen) und der Test (unter 40 Zeilen); die Spieldatei bleibt eine HTML-Datei (Ausnahme für Spieldateien, siehe `werkstatt/README.md`).

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | `etappe_test.js` (PS-1, PS-3) |
| U-2 | `seite_handy.js` (D4_zurueck_sichtbar) |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W17-alpenetappe.md
- Aktualisiert: werkstatt/tests/etappe_test.js
- Aktualisiert: index.html
