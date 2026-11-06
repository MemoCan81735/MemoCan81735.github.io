# S-W18: Kleine Rundfahrt (Radrennen Fassung 10) auf die Spieleseite

**Status:** freigegeben am 06.11.2026, 05:39
<!-- Freigabe durch den Betreiber im Projekt-Thread: Entscheidung "Öffentliche Spieleseite jetzt auf Fassung 10 bringen?", Wahl "Ja, jetzt nachziehen" -->

## Anlass
Die Seite zeigt noch Fassung 8c (eine Alpenetappe) und beginnt im Startmenü. Die Anforderungen des Spiels verlangen Sofortstart auch auf der Seite (A-1) und dieselbe Fassung wie der Prototyp mit sichtbarem Zurück-Link (A-22). Fassung 10 ist eine kleine Rundfahrt mit drei Etappen, Gesamtwertung und Gelbem Trikot (S-008 der App).

## Anwendungsfälle
- U-1: Der Spieler tippt auf der Startseite die Karte "Kleine Rundfahrt" an und sieht ohne weiteres Tippen den Anflug mit "ETAPPE 1/3 · ZIEL ★★★ unter 1:16"; nach höchstens 3 s läuft das Rennen.
- U-2: Während des Rennens sieht er oben im Infostreifen "← Spiele" und kommt damit zur Startseite zurück.
- U-3: Über "Menü" sieht er "Kleine Rundfahrt", die drei Etappenkarten und den Zurück-Link "← Alle Spiele".

## Umfang
- `etappenrennen/index.html` neu gebaut aus der Prototyp-Datei Fassung 10 mit `werkstatt/bau_etappenrennen.py`.
- Bauskript: kein automatisches Öffnen des Menüs mehr; Zurück-Link zusätzlich im Infostreifen (als erster Zurück-Link im Dokument).
- Startseite: Karte heißt "Kleine Rundfahrt" mit neuem Text; Manifest-Name "Kleine Rundfahrt".
- Gespeichert wird nur auf dem Gerät wie im Prototyp (Rundfahrt `etappenrennen.tour` Formatversion 2, Bestzeit und Sterne je Etappe). Alte Bestzeit und Sterne der Alpenetappe bleiben gültig.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Ohne Tippen: Menü (`#einst`) bleibt verborgen, Zielband zeigt "ETAPPE 1/3 · ZIEL ★★★ unter 1:16", nach 3,5 s hat sich das Bild verändert (aus U-1) | `etappe_test.js` PS-1 |
| AK-2 | Zurück-Link im Infostreifen sichtbar, mindestens 44 px hoch, ganz im Bild bei 412×915 und 915×412, führt zu `../` (aus U-2) | `etappe_test.js` PS-2, `seite_handy.js` D4 |
| AK-3 | Menü zeigt Überschrift "Kleine Rundfahrt", 3 Etappenkarten und "← Alle Spiele" (aus U-3) | `etappe_test.js` PS-1 |
| AK-4 | Kein fremder Host, keine Prüfhaken, keine Seitenfehler, auch bei gesperrtem Speicher (aus U-1) | `etappe_test.js` PS-1, PS-3 |
| AK-5 | Startseite: Karte "Kleine Rundfahrt" verlinkt `etappenrennen/` mit Bild; statische Prüfung grün (aus U-1) | `seite_pruefen.py` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Seite laden, nichts tippen, 3,5 s warten; dann Menü öffnen | AK-1, AK-3, AK-4 |
| PS-2 | Grenzwert | Querformat 915×412: Zurück-Link im Bild | AK-2 |
| PS-3 | Fehlerfall | Speicher gesperrt: Rennen startet trotzdem von selbst | AK-1, AK-4 |
| PS-4 | Missbrauch | Bauskript öffnet wieder das Menü oder lässt den Link im Infostreifen weg: Test rot (Gegenprobe) | AK-1, AK-2 |
| PS-5 | Wiederholbarkeit | Zweimal laden: beide Male Etappe 1 im Anflug | AK-1 |

## Gegenproben
`werkstatt/tests/gegenproben_etappe.py`: (1) Menü wird nach dem Laden geöffnet, muss PS-1 rot machen; (2) Zurück-Link im Infostreifen fehlt, muss PS-2 rot machen; (3) Prüfhaken bleiben drin, muss PS-1 rot machen. Fehlalarm: unveränderter Bau ist grün.

## Technisches Design
- Schnittstellen: keine neuen; Bauskript ersetzt Textstellen und bricht ab, wenn eine Stelle fehlt.
- Datenformat: unverändert aus der App (S-008), keine neuen Schlüssel auf der Seite.
- Alternativen: (a) Startmenü beibehalten (verworfen: widerspricht A-1); (b) Sofortstart, Zurück-Link im Infostreifen (gewählt).
- Entscheidung: (b).
- Design-Review: Eigenprüfung gegen die Regeln der Seite (fremde Server, Anonymität, Zurück-Link, Knopfgröße). Die Spiellogik kommt unverändert aus dem geprüften Prototyp, der eine unabhängige Prüfung hatte (S-008).

## Querschnitt
- Datenschutz: keine fremden Server, keine Cookies, nur lokales Speichern.
- Sicherheit: keine Eingabe außer Tippen, kein Netzverkehr.
- Barrierefreiheit: Zurück-Link mindestens 44 px hoch, Text statt nur Symbol.
- Leistung: wie Prototyp; Messung am Handy im Gerätetest.

## Kritische Testfälle
- PS-1: Sofortstart ohne Menü
- PS-2: Zurück-Link im Querformat
- PS-3: Speicher gesperrt

## Clean Code
- Clean Code: Bauskript unter 40 Zeilen, Test unter 60 Zeilen; Spieldatei bleibt eine HTML-Datei (Ausnahme für Spieldateien, siehe `werkstatt/README.md`).

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | `etappe_test.js` (PS-1, PS-3) |
| U-2 | `etappe_test.js` (PS-2), `seite_handy.js` (D4_zurueck_sichtbar) |
| U-3 | `etappe_test.js` (PS-1) |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W18-kleine-rundfahrt.md
- Aktualisiert: werkstatt/bau_etappenrennen.py
- Aktualisiert: werkstatt/tests/etappe_test.js
- Aktualisiert: index.html
