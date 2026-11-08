# S-W21: Ebru 2.0 ersetzt Ebru auf der Spieleseite

**Status:** gebaut, freigegeben am 08.11.2026, 09:54
<!-- Freigabe durch den Betreiber im Projekt-Thread am 08.11.2026, 09:54: "Dieses soll die andere öffentliche ersetzen" (Ebru 2.0 mit Farbfeld, App-Spec S-015). -->

## Anlass
Der Betreiber will, dass Ebru 2.0 (Zeichnen auf der Grafikkarte, Farbe als Feld: feine Fäden ohne Keile auch nach langem Rühren) die bisherige Ebru auf der öffentlichen Seite ersetzt.

## Anwendungsfall
- U-1: Der Besucher tippt in der Rubrik "Malen" auf Ebru und sieht in unter 3 s das Becken von Ebru 2.0.
- U-2: Der Besucher malt, macht einen Abdruck und teilt ihn wie bisher (ebru.png).
- U-3: Ein Besucher mit einem Gerät ohne WebGL 2 sieht einen Hinweis und kommt mit einem Tipp zur klassischen Fassung, die wie bisher läuft.
- U-4: Der Besucher tippt "← Spiele" und kommt zur Startseite zurück.

## Umfang
- `ebru/index.html` wird mit `python3 werkstatt/bau_ebru.py <build/ebru2.html>` aus Ebru 2.0 gebaut (Titel "Ebru", Verweis ohne WebGL 2 auf `../ebru-klassisch/`).
- Die bisherige Fassung bleibt unverändert unter `ebru-klassisch/` (eigenes Manifest "Ebru klassisch"), ohne eigene Karte auf der Startseite.
- Gespeichert wird nur auf dem Gerät: Ebru 2.0 nutzt eigene Schlüssel `ebru2.*` (Galerie Formatversion 1, Becken im Tab Formatversion 1, wie in der App freigegeben); die Bilder der klassischen Fassung (`ebru.galerie`) bleiben dort erhalten.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-4: statische Prüfung grün für `ebru/` und `ebru-klassisch/` (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1, U-2: kein fremder Host, alle Dateien da, Tippen setzt einen Tropfen, Teilen ohne Betrachter lädt ebru.png, Zurück-Link mindestens 44 px; Ebru 2.0 zeichnet über WebGL 2, Titel "Ebru" | `ebru_test.js` |
| AK-3 | Aus U-3: ohne WebGL 2 Hinweis mit Verweis `../ebru-klassisch/`, die klassische Fassung lädt ohne fehlende Datei und ohne Seitenfehler | `ebru_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat laden, tippen, Abdruck, Teilen | AK-2 |
| PS-2 | Grenzwert | Querformat 915×412 | AK-2 |
| PS-3 | Fehlerfall | Speicher gesperrt: Malen, Abdruck und Teilen gehen trotzdem | AK-2 |
| PS-4 | Missbrauch | Netzadresse eingebaut oder Zurück-Link entfernt: Prüfung rot | AK-1 |
| PS-5 | Wiederholbarkeit | Bauskript zweimal: gleiche Datei (gleiche Prüfsumme) | AK-1 |
| PS-6 | Normal | Ebru 2.0 aktiv (WebGL 2), Titel Ebru | AK-2 |
| PS-7 | Fehlerfall | Gerät ohne WebGL 2: Hinweis, Tipp führt zur klassischen Fassung | AK-3 |

## Gegenproben
Siehe `seite_pruefen.py --gegenproben` (Netzadresse, Zurück-Link weg, Manifest kaputt). Zusätzlich von Hand: Verweis im Bauskript nicht umgeschrieben (zeigt auf `/ebru/` selbst) macht PS-7 rot; Fehlalarm: klassische Fassung zusätzlich im Kopf verlinkt lässt alles grün.

## Technisches Design
- Schnittstellen: keine neuen; `bau_ebru.py` erkennt den Bau von Ebru 2.0 am Titel und schreibt Titel und Verweis um. Der erste Stilblock im Kopf bekommt den Zurück-Link (PixiJS im Code enthält weitere `</style>`).
- Datenformat: unverändert aus den Apps (`ebru2.*` und `ebru.*`, je Formatversion 1).
- Alternativen: (a) Ebru 1 löschen (verworfen: Geräte ohne WebGL 2 hätten keine Ebru mehr, und der Hinweis in Ebru 2.0 verweist auf sie); (b) zwei Karten auf der Startseite (verworfen: der Betreiber will ersetzen); (c) klassische Fassung unter eigener Adresse ohne Karte (gewählt).
- Entscheidung: (c). Ordner `ebru-klassisch/` auf derselben Ebene wie `ebru/`, damit Symbole und Zurück-Link mit `../` gleich bleiben.
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite; Ebru 2.0 selbst wurde in S-014 und S-015 von einem zweiten Agenten in je zwei Prüfrunden unabhängig geprüft.

## Querschnitt
- Datenschutz: keine fremden Server (PixiJS ist in der Seite enthalten, MIT-Lizenz mit Hinweis im Code), keine Cookies, Bilder nur im Gerät.
- Sicherheit: keine Eingabe außer Tippen und Ziehen; kein Netzverkehr.
- Barrierefreiheit: wie S-W18 (Knöpfe mindestens 44 px, weniger Bewegung).
- Leistung: Seite etwa 813 KB (PixiJS enthalten, vorher 80 KB); am Galaxy S24+ gemessen p50 8 ms je Bild beim Rühren (Spike S-015); Grafikspeicher bis etwa 108 MB.

## Kritische Testfälle
- PS-6: Ebru 2.0 zeichnet über WebGL 2
- PS-7: ohne WebGL 2 zur klassischen Fassung

## Clean Code
- Clean Code: Prüfergebnis: Bauskript um 6 Zeilen erweitert, Test um zwei Fälle; die Spieldatei bleibt eine HTML-Datei aus dem geprüften App-Bau, die klassische Fassung ist eine unveränderte Kopie.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | Ebru 2.0 mit WebGL 2 |
| U-2 | Teilen ohne Betrachter lädt ebru.png |
| U-3 | klassische Fassung läuft |
| U-4 | Zurück-Link sichtbar |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W21-ebru2.md
- Aktualisiert: werkstatt/tests/ebru_test.js
- Aktualisiert: werkstatt/bau_ebru.py
- Aktualisiert: werkstatt/seite_pruefen.py
