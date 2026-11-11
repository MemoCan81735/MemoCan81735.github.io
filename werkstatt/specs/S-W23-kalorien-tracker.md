# S-W23: Kalorien-Tracker auf die Spieleseite

**Status:** gebaut, freigegeben am 11.11.2026, 05:07
<!-- Freigabe durch den Betreiber im Projekt-Thread: "App auf meiner neogaraj publizieren" (Kalorien-Tracker, Stand App-Version 11 mit S-001 bis S-010). -->

## Anlass
Der Betreiber will den Kalorien-Tracker öffentlich auf seiner Seite Neon Garaj nutzen können. Außerhalb der Claude-App fehlt die Verbindung zu Claude: Foto-Erkennung, "Mengen neu schätzen", "Mit AR messen" und Ernährungstipps gehen dort nicht. Die App zeigt das bereits selbst an; die Seite sagt es zusätzlich oben in einem Satz.

## Anwendungsfall
- U-1: Der Besucher öffnet die Startseite, sieht die neue Rubrik "Alltag" mit der Karte Kalorien-Tracker, tippt "Öffnen" und sieht in unter 3 s das Formular für das erste Konto.
- U-2: Der Besucher legt ein Konto an, sieht seinen Richtwert, trägt über "Essen suchen" einen Apfel ein und sieht den Richtwert um die kcal sinken; nach dem Neuladen ist der Eintrag noch da.
- U-3: Der Besucher tippt "← Spiele" und kommt zur Startseite zurück.
- U-4: Der Besucher legt die Seite auf den Startbildschirm und sieht das Kalorien-Symbol.

## Umfang
- Neuer Ordner `kalorien/` mit `index.html` und `manifest.webmanifest`; Symbole `bilder/symbole/kalorien-192.png` und `-512.png`, Kartenbild `bilder/kalorien.jpg`, Karte in der neuen Rubrik "Alltag" (mit Eintrag in der Leiste oben).
- Erzeugt mit `python3 werkstatt/bau_kalorien.py <dist/kalorien-tracker.html der App>`: entfernt Google-Schriften (Systemschrift als Rückfall) und den Artifact-Hinweis, setzt Gerüst, Symbol, Manifest, Farbe der Leiste, Zurück-Link und den Hinweissatz, ersetzt Namensnennungen in Code-Kommentaren.
- Gespeichert wird nur auf dem Gerät (Schlüssel `kalorien-tracker`, mit Formatversion, wie in der App freigegeben am 08.11.2026). Der Stand im Browser ist getrennt vom Stand in der Claude-App; umziehen geht über "Daten sichern" und "Sicherung laden".

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-3, U-4: statische Prüfung grün (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol 192 und 512 im Manifest, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1: Seite lädt bei 412×915 und 915×412 ohne Konsolenfehler, ohne waagerechtes Scrollen | `seite_handy.js` |
| AK-3 | Aus U-1 bis U-4: Laden unter 3 s, kein fremder Host, alle Dateien vorhanden, Konto ergibt Richtwert zwischen 1.200 und 3.500 kcal, Apfel senkt ihn um 50 bis 150 kcal, Eintrag bleibt nach dem Neuladen, Hinweissatz sichtbar, kein AR-Knopf ohne Claude, Zurück-Link mindestens 44 px hoch | `kalorien_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat laden, Konto anlegen, Apfel eintragen | AK-3 |
| PS-2 | Grenzwert | Querformat 915×412 | AK-2, AK-3 |
| PS-3 | Fehlerfall | Speicher gesperrt: Konto und Eintrag gehen trotzdem, kein Seitenfehler | AK-3 |
| PS-4 | Missbrauch | Zurück-Link entfernt, Google-Schrift oder Name im Code: Prüfung oder Bauskript rot | AK-1 |
| PS-5 | Wiederholbarkeit | Neuladen: gleicher Richtwert, Eintrag noch da; Bauskript zweimal: gleiche Datei | AK-3, AK-1 |

## Gegenproben
- Verstoß: `kalorien_test.js` vor dem Anlegen von `kalorien/` war rot (Seite fehlt); `bau_kalorien.py` bricht ab, wenn eine Google-Adresse, der Artifact-Hinweis oder der Name in der Datei bleibt; `seite_pruefen.py --gegenproben` prüft Netzadresse, Zurück-Link und Manifest
- Fehlalarm: die Hinweise der App ohne Claude ("Foto-Erkennung geht nur, wenn …") sind erlaubt und lassen die Prüfung grün

## Technisches Design
- Schnittstellen: keine neuen; `bau_kalorien.py` macht aus dem geprüften App-Bau die Seite.
- Datenformat: Speicherschlüssel `kalorien-tracker` mit Formatversion (S-001 der App), unverändert.
- Alternativen: (a) App-Bau unverändert kopieren (verworfen: Google-Schriften, kein Symbol, kein Zurück-Link, Name im Kommentar); (b) Bauskript (gewählt, wiederholbar); (c) Foto-Knöpfe für die Seite ausblenden (offen, braucht eine sichtbare Änderung an der App).
- Entscheidung: (b). Zurück-Link und Hinweissatz stehen fest im HTML über der App.
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite wie bei S-W19 (fremde Server, Anonymität, Zurück-Link); die App selbst wurde je Spec von einem zweiten Agenten vor und nach dem Bauen geprüft.

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, alle Daten nur im Gerät; ohne Claude geht kein Foto und keine Zahl an einen Dienst.
- Sicherheit: Eingaben werden in der App begrenzt und als Text gesetzt; die Sicherheitsprüfung der App (kein innerHTML mit Daten) bleibt gültig.
- Barrierefreiheit: Tasten mindestens 44 px, Zurück-Link 44 px, Hinweissatz in 14 px mit dem Kontrast der App.
- Leistung: Seite etwa 211 KB ohne Bibliotheken, Laden lokal unter 1 s.

## Kritische Testfälle
- PS-1: kein fremder Host, Eintrag stimmt
- PS-3: Speicher gesperrt, Eintragen geht trotzdem

## Clean Code
- Clean Code: Prüfergebnis: neu sind das Bauskript (unter 50 Zeilen) und der Test (unter 60 Zeilen); die App-Datei bleibt eine HTML-Datei aus dem geprüften App-Bau.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | lädt in unter 3 s |
| U-2 | Apfel eingetragen |
| U-3 | Zurück-Link sichtbar |
| U-4 | Symbol im Manifest |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W23-kalorien-tracker.md
- Aktualisiert: werkstatt/tests/kalorien_test.js
- Aktualisiert: werkstatt/bau_kalorien.py
- Aktualisiert: werkstatt/alle_tests.sh
- Aktualisiert: index.html

## Nicht Teil dieser Änderung
Foto-Erkennung und Tipps ohne Claude (bräuchte einen eigenen Dienst mit Schlüssel), Ausblenden der Foto-Knöpfe, Abgleich zwischen Claude-App und Seite.

## Ergebnis
- Vorher: `kalorien_test.js` rot (Seite fehlt). Nachher: 38 von 38 Prüfpunkten grün, Seitenprüfung und Handyformat grün.
