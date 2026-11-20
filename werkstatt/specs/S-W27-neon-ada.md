# S-W27: Neon Ada (Götterspiel mit Kampagne) auf die Spieleseite

**Status:** gebaut, freigegeben am 20.11.2026, 06:02
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Diese bitte auch unter neongaraj mit bereitstellen" (20.11.2026, 06:02). -->

## Anlass
Der Betreiber will das Götterspiel Neon Ada (Land formen, Pixelinge lenken, Kampagne mit 13 Inseln, Sternen, Götterkräften, Endgegner, täglicher Aufgabe, Version 7 des Artifacts) auch auf der öffentlichen Seite spielen lassen. Neue Rubrik "Strategie", weil das Spiel weder Rennspiel noch Brettspiel ist.

## Anwendungsfall
- U-1: Der Besucher öffnet die Startseite, sieht in der Rubrik Strategie die Karte "Neon Ada", tippt "Spielen" und sieht in unter 3 s die Insel.
- U-2: Der Besucher spielt die erste Insel; der Fortschritt (Sterne) bleibt auf dem Gerät.
- U-3: Der Besucher tippt oben links "← Spiele" (immer sichtbar) oder im Kartenmenü "← Alle Spiele" und kommt zur Startseite zurück.
- U-4: Der Besucher legt die Seite auf den Startbildschirm und sieht das eigene Symbol.

## Umfang
- Neuer Ordner `neon-ada/` mit `index.html`, `three.min.js` (r128, lokal) und `manifest.webmanifest`; Symbole `bilder/symbole/neon-ada-192.png` und `-512.png`, Kartenbild `bilder/neon-ada.jpg` (400×300), Karte in der neuen Rubrik Strategie.
- Erzeugt mit `python3 werkstatt/bau_neon_ada.py <dist/index.html>`: Grundgerüst mit Symbol und Manifest, three.js lokal, Prüfhaken (`window.__…`) in ein lokales Objekt umgeleitet, Start gesperrter Karten per Adresse abgeschaltet, Zurück-Link (fest oben links und im Kartenmenü).
- Gespeichert wird nur auf dem Gerät (Sterne je Karte, Schlüssel `neon-ada-fortschritt`, Formatversion 1); bei gesperrtem Speicher läuft das Spiel mit dem Hinweis "nur bis zum Neuladen".

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-3, U-4: statische Prüfung grün (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol 192 und 512, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1: Seite lädt bei 412×915 und 915×412 ohne Skriptfehler und ohne waagerechtes Scrollen | `seite_handy.js` |
| AK-3 | Aus U-1: Spiel in unter 3 s da, kein fremder Host, keine Prüfhaken, das Bild bewegt sich ohne Tippen innerhalb von 2 s | `neon_ada_test.js` |
| AK-4 | Aus U-3: Zurück-Link (fest oben links und im Kartenmenü) mindestens 44 px hoch, ganz im Bild (Hoch- und Querformat), Ziel `../`, führt zur Startseite | `neon_ada_test.js` |
| AK-5 | Aus U-1: Startseite verlinkt `neon-ada/` mit Bild und Text in der Rubrik Strategie | `neon_ada_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat laden, 2 s laufen lassen, Menü öffnen | AK-3, AK-4 |
| PS-2 | Grenzwert | Querformat 915×412: Zurück-Link ganz im Bild | AK-2, AK-4 |
| PS-3 | Fehlerfall | Speicher gesperrt: Spiel und Menü laufen trotzdem | AK-3 |
| PS-4 | Missbrauch | Adresse mit `#karte=3-1`: gesperrte Karte bleibt gesperrt | AK-3 |
| PS-5 | Missbrauch | Netzadresse für three.js eingebaut, Zurück-Link entfernt: Prüfung rot | AK-1 |
| PS-6 | Wiederholbarkeit | Bauskript zweimal: gleiche Datei | AK-1 |

## Gegenproben
Siehe `seite_pruefen.py --gegenproben` (Netzadresse, Zurück-Link weg). Zusätzlich: `neon_ada_test.js` vor dem Anlegen von `neon-ada/` rot (Seite fehlt); `bau_neon_ada.py` bricht ab, wenn noch eine fremde Adresse, `window.__`, "Claude" oder der Name des Betreibers in der Datei steht. Spiel selbst: 10 Gegenprobenläufe mit zusammen über 90 absichtlichen Fehlern im Spiel-Projekt.

## Messwerte und Rückblick
- Die Handyprüfung verlangt den Zurück-Link schon beim Laden: er sitzt jetzt fest oben links; im Menü liegt er ganz oben, weil er im Querformat sonst unter dem Bildrand stand. Test für beide vorher rot.
- Beim Bau fand die Anonymitätsprüfung des Bauskripts einen Namen in einem Quelltext-Kommentar des Spiels; Kommentar entfernt. Regel: Bauskript prüft die fertige Datei, nicht nur die Quelle.
- Bauskript zweimal: gleiche Prüfsumme.

## Technisches Design
- Schnittstellen: keine neuen; `bau_neon_ada.py` macht aus dem Bau des Spiels die Seite.
- Datenformat: Speicherschlüssel `neon-ada-fortschritt`, Formatversion 1 (wie im Spiel, S-006 und S-011 im Spiel-Projekt).
- Alternativen: (a) Artifact-Datei unverändert kopieren (verworfen: three.js aus dem Netz, Prüfhaken, kein Zurück-Link); (b) Bauskript (gewählt, wiederholbar).
- Entscheidung: (b).
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite (fremde Server, Anonymität, Zurück-Link, Marken). Keine unabhängige Prüfung durch einen zweiten Agenten, weil die Spiellogik unverändert aus dem geprüften Spiel kommt (Specs S-001 bis S-011 im Spiel-Projekt mit Einheits-, Browser- und Gegenprobenläufen).

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, nur Sterne je Karte im Gerät, Löschen im Kartenmenü; Teilen nur über das Teilen-Fenster des Handys.
- Sicherheit: keine Texteingabe, kein Netzverkehr; Daten aus dem Speicher werden geprüft (Typ, Wertebereich, Version).
- Barrierefreiheit: Tasten mindestens 44 px, Ton abschaltbar, Zustände auch durch Text und Form sichtbar.
- Leistung: Seite etwa 85 KB plus three.js; Gerätemessung offen (Abnahmeliste des Spiels).

## Kritische Testfälle
- PS-1: kein fremder Host, Spiel läuft
- PS-3: Speicher gesperrt, Spiel läuft trotzdem
- PS-4: gesperrte Karte lässt sich nicht per Adresse starten

## Clean Code
- Clean Code: Prüfergebnis: neue Dateien sind das Bauskript (unter 40 Zeilen) und der Test (unter 60 Zeilen); die Spieldatei bleibt eine HTML-Datei aus dem geprüften Spiel-Bau.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | Spiel in unter 3 s da |
| U-2 | Bild bewegt sich ohne Tippen |
| U-3 | Zurück-Link im Kartenmenü |
| U-4 | Symbol im Manifest |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W27-neon-ada.md
- Aktualisiert: werkstatt/tests/neon_ada_test.js
- Aktualisiert: werkstatt/bau_neon_ada.py
- Aktualisiert: index.html
