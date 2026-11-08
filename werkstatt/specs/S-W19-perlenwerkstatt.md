# S-W19: Perlenwerkstatt (Perlenarmbänder planen) auf die Spieleseite

**Status:** gebaut, freigegeben am 06.11.2026, 20:38
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Anleitung mit dynamischen Bildern. Auch vorher publizieren" (Perlenwerkstatt, Stand S-001 mit drei Korrekturrunden). -->

## Anlass
Der Betreiber will die Perlenwerkstatt (Perlenarmbänder planen, S-001 der App) öffentlich nutzen können, bevor die Anleitung bewegte Bilder bekommt.
Nachtrag 06.11.2026: Stand mit S-002 der App (Anleitung mit bewegten Bildern je Schritt) neu gebaut, gleiche Prüfungen grün.
Nachtrag 07.11.2026: Stand mit S-003 der App (Designer fürs Handy: Vorschau haftet oben und wird kleiner, Gestalten direkt darunter) neu gebaut, gleiche Prüfungen grün.
Nachtrag 07.11.2026: Stand mit S-004 der App (26 Ideen) neu gebaut, gleiche Prüfungen grün.
Nachtrag 07.11.2026: Stand mit S-005 bis S-010 der App (richtige Größe, Arbeitsmodus, Einkauf mit Preis, Muster aus Bild, Sichern und Laden, Spiegeln, Lupe, Druckansicht) neu gebaut, gleiche Prüfungen grün. Alles bleibt im Gerät, kein fremder Server.
Nachtrag 07.11.2026: Stand mit S-011 der App (Arbeitsmodus erklärt die Handgriffe je Technik und zeigt das Band mit der aktuellen Reihe) neu gebaut, gleiche Prüfungen grün.
Nachtrag 07.11.2026: Stand mit S-012 der App (Startmuster Flaggen, Vereinsfarben ohne Logos, Zeichen; Filtertasten in den Ideen) neu gebaut, gleiche Prüfungen grün.
Nachtrag 07.11.2026: Stand mit S-013 der App (doppelt so viele Startmuster, vor allem Zeichen) neu gebaut, gleiche Prüfungen grün.
Nachtrag 07.11.2026: Stand mit S-014 der App (Armband als Bild teilen, Text weben, eigener Vorrat und eigene Preise im Gerät) neu gebaut, gleiche Prüfungen grün.
Nachtrag 07.11.2026: Stand mit S-015 der App (Zufall, Farbverlauf, Herz- und Tropfenperlen, Anhänger, Wickelarmband) neu gebaut, gleiche Prüfungen grün.
Nachtrag 08.11.2026: Stand mit S-016 der App (Einsteigerpfad, Fehlerhilfe, Hinweise zum Entwurf) neu gebaut, gleiche Prüfungen grün.

## Anwendungsfall
- U-1: Der Besucher öffnet die Startseite, sieht die neue Rubrik "Basteln" mit der Karte Perlenwerkstatt, tippt "Planen" und sieht in unter 3 s zwölf Ideen.
- U-2: Der Besucher tippt eine Idee an, sieht den Ring in der Vorschau, die Einkaufsliste und die Anleitung.
- U-3: Der Besucher tippt "← Spiele" und kommt zur Startseite zurück.
- U-4: Der Besucher legt die Seite auf den Startbildschirm und sieht das Perlen-Symbol.

## Umfang
- Neuer Ordner `perlen/` mit `index.html` und `manifest.webmanifest`; Symbole `bilder/symbole/perlen-192.png` und `-512.png`, Kartenbild `bilder/perlen.jpg`, Karte in der neuen Rubrik "Basteln".
- Erzeugt mit `python3 werkstatt/bau_perlen.py <build/perlenwerkstatt.html der App>`: entfernt Google-Schriften (Systemschrift als Rückfall), setzt Symbol, Manifest, Farbe der Leiste und den Zurück-Link oben rechts statt der Unterzeile.
- Gespeichert wird nur auf dem Gerät (Entwürfe und Haken der Einkaufsliste, Schlüssel `perlenwerkstatt`, Formatversion 1, wie in der App freigegeben am 06.11.2026).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-1, U-3, U-4: statische Prüfung grün (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol 192 und 512 im Manifest, anonym, keine Fachsprache) | `seite_pruefen.py` |
| AK-2 | Aus U-1: Seite lädt bei 412×915 und 915×412 ohne Konsolenfehler, ohne waagerechtes Scrollen | `seite_handy.js` |
| AK-3 | Aus U-1 bis U-3: Laden unter 3 s, kein fremder Host, alle Dateien vorhanden, Idee zeichnet über 1000 Ringpunkte, Einkaufsliste mindestens 5 Zeilen, Anleitung mindestens 5 Schritte, Zurück-Link mindestens 44 px hoch | `perlen_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Hochformat laden, Idee öffnen, Einkauf und Anleitung ansehen | AK-3 |
| PS-2 | Grenzwert | Querformat 915×412 | AK-2, AK-3 |
| PS-3 | Fehlerfall | Speicher gesperrt: Ideen, Vorschau, Einkauf und Anleitung gehen trotzdem | AK-3 |
| PS-4 | Missbrauch | Zurück-Link entfernt oder Google-Schrift eingebaut: Prüfung rot | AK-1 |
| PS-5 | Wiederholbarkeit | Bauskript zweimal: gleiche Datei | AK-1 |

## Gegenproben
Siehe `seite_pruefen.py --gegenproben` (Netzadresse, Zurück-Link weg, Manifest kaputt). Zusätzlich: `perlen_test.js` vor dem Anlegen von `perlen/` war rot (Seite fehlt), `bau_perlen.py` bricht ab, wenn noch eine Google-Adresse in der Datei steht.

## Technisches Design
- Schnittstellen: keine neuen; `bau_perlen.py` macht aus dem Bau der App die Seite. Teilen der Einkaufsliste über `navigator.share`, sonst Zwischenablage.
- Datenformat: Speicherschlüssel `perlenwerkstatt` mit Formatversion 1 (S-001 der App).
- Alternativen: (a) App-Bau unverändert kopieren (verworfen: Google-Schriften, kein Symbol, kein Zurück-Link); (b) Bauskript (gewählt, wiederholbar).
- Entscheidung: (b). Der Zurück-Link steht fest im HTML und wird beim Aufbau oben rechts in den Kopf der App verschoben, an die Stelle der Unterzeile.
- Design-Review: Eigenprüfung gegen Spec und Regeln der Seite (fremde Server, Anonymität, Zurück-Link); die App selbst wurde in S-001 von einem zweiten Agenten unabhängig geprüft und in drei Korrekturrunden nachgeprüft.

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, Entwürfe nur im Gerät; die Einkaufsliste verlässt das Gerät nur über das Teilen-Fenster.
- Sicherheit: Eingaben (Name, Umfang) werden begrenzt und als Text gesetzt, kein Netzverkehr.
- Barrierefreiheit: Tasten mindestens 44 px, Haken-Zeilen ganz antippbar.
- Leistung: Seite etwa 80 KB ohne Bibliotheken; Ring zeichnen unter 50 ms.

## Kritische Testfälle
- PS-1: kein fremder Host
- PS-3: Speicher gesperrt, Planen geht trotzdem

## Clean Code
- Clean Code: Prüfergebnis: neue Dateien sind das Bauskript (unter 50 Zeilen) und der Test (unter 50 Zeilen); die App-Datei bleibt eine HTML-Datei aus dem geprüften App-Bau.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | lädt in unter 3 s |
| U-2 | Idee zeigt Ringvorschau |
| U-3 | Zurück-Link sichtbar |
| U-4 | Symbol im Manifest |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W19-perlenwerkstatt.md
- Aktualisiert: werkstatt/tests/perlen_test.js
- Aktualisiert: werkstatt/bau_perlen.py
- Aktualisiert: index.html
