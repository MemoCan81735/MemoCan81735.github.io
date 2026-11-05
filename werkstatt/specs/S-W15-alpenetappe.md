# S-W15: Alpenetappe (Radrennen) auf die Spieleseite

**Status:** gebaut, freigegeben am 05.11.2026, 04:53
<!-- Freigabe durch den Betreiber im Projekt-Thread: Frage "Kannst du das auch publizieren?" zur Alpenetappe (Fassung 8c) -->

## Anlass
Der Betreiber will das überarbeitete Radrennen (Sog und Schleuder, Tagesrennen, Geist) auch auf der öffentlichen Seite spielen lassen.

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
