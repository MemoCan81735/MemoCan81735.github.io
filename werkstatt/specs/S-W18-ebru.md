# S-W18: Ebru (Malen auf Wasser) auf die Spieleseite

**Status:** gebaut, freigegeben am 06.11.2026, 05:44
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Überlege weitere wow Funktionen und danach publizieren es" (Ebru-App, Stand S-009). Anforderung A-21 und A-22 der App. -->

## Anlass
Der Betreiber will die Ebru-App (türkische Marmorkunst, mit Galerie, Musik, Zeitraffer-Video) auf der öffentlichen Seite spielen lassen.

## Anwendungsfall
- U-1: Der Besucher öffnet die Startseite, sieht die neue Rubrik "Malen" mit der Karte Ebru, tippt "Malen" und sieht in unter 3 s das Wasserbecken mit den ersten Tropfen.
- U-2: Der Besucher tippt aufs Wasser, malt, macht einen Abdruck und tippt "Teilen / Speichern": ohne Artifact-Betrachter öffnet sich das Teilen-Fenster oder die Datei ebru.png wird geladen.
- U-3: Der Besucher tippt "← Spiele" und kommt zur Startseite zurück.
- U-4: Der Besucher legt die Seite auf den Startbildschirm und sieht das Ebru-Symbol.

## Umfang
- Neuer Ordner `ebru/` mit `index.html` und `manifest.webmanifest`; Symbole `bilder/symbole/ebru-192.png` und `-512.png`, Kartenbild `bilder/ebru.jpg`, Karte in der neuen Rubrik "Malen".
- Erzeugt mit `python3 werkstatt/bau_ebru.py <build/ebru.html der App>`: Symbol, Manifest, Farbe der Leiste, Zurück-Link oben rechts (auf der Ergebniskarte ausgeblendet).
- Gespeichert wird nur auf dem Gerät (Galerie "Meine Bilder" mit 12 Bildern und Sternen, Formatversion 1, wie in der App freigegeben am 05.11.2026).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-3, U-4: statische Prüfung grün (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol 192 und 512 im Manifest, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1: Seite lädt bei 412×915 und 915×412 ohne Konsolenfehler, ohne waagerechtes Scrollen | `seite_handy.js` |
| AK-3 | Aus U-1, U-2: kein fremder Host, alle Dateien vorhanden, Tippen setzt einen Tropfen, Teilen ohne Betrachter lädt ebru.png, Zurück-Link mindestens 44 px hoch | `ebru_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat laden, tippen, Abdruck, Teilen | AK-3 |
| PS-2 | Grenzwert | Querformat 915×412 | AK-2, AK-3 |
| PS-3 | Fehlerfall | Speicher gesperrt: Malen, Abdruck und Teilen gehen trotzdem | AK-3 |
| PS-4 | Missbrauch | Zurück-Link entfernt oder Netzadresse eingebaut: Prüfung rot | AK-1 |
| PS-5 | Wiederholbarkeit | Bauskript zweimal: gleiche Datei | AK-1 |

## Gegenproben
Siehe `seite_pruefen.py --gegenproben` (Netzadresse, Zurück-Link weg, Manifest kaputt). Zusätzlich von Hand: Zurück-Link im Bauskript weglassen macht `ebru_test.js` und S4 rot.

## Technisches Design
- Schnittstellen: keine neuen; `bau_ebru.py` macht aus dem Bau der App die Seite. Die App teilt über `navigator.share` oder einen Download-Verweis, wenn kein Artifact-Betrachter da ist.
- Datenformat: Speicherschlüssel `ebru.galerie` mit Formatversion 1 (S-006 der App).
- Alternativen: (a) App-Bau unverändert kopieren (verworfen: kein Symbol, kein Zurück-Link); (b) Bauskript (gewählt, wiederholbar).
- Entscheidung: (b). Der Zurück-Link sitzt oben rechts, weil oben links das Musterschild steht.
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite (fremde Server, Anonymität, Zurück-Link); die App selbst wurde in S-008 von einem zweiten Agenten unabhängig geprüft.

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, Bilder und Sterne nur im Gerät; Video und Bild verlassen das Gerät nur über das Teilen-Fenster.
- Sicherheit: keine Eingabe außer Tippen und Ziehen; kein Netzverkehr.
- Barrierefreiheit: Knöpfe mindestens 44 px, weniger Bewegung schaltet Lichtspiel, Spur und fallende Sterne ab.
- Leistung: Seite 80 KB ohne Bibliotheken; Auflösung sinkt bei unter 30 Bildern je Sekunde.

## Kritische Testfälle
- PS-1: kein fremder Host, Teilen ohne Betrachter
- PS-3: Speicher gesperrt, Malen geht trotzdem

## Clean Code
- Clean Code: Prüfergebnis: neue Dateien sind das Bauskript (unter 30 Zeilen) und der Test (unter 50 Zeilen); die Spieldatei bleibt eine HTML-Datei aus dem geprüften App-Bau.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | Tippen setzt Tropfen |
| U-2 | Teilen ohne Betrachter lädt ebru.png |
| U-3 | Zurück-Link sichtbar |
| U-4 | Symbol im Manifest |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W18-ebru.md
- Aktualisiert: werkstatt/tests/ebru_test.js
- Aktualisiert: werkstatt/bau_ebru.py
- Aktualisiert: index.html
