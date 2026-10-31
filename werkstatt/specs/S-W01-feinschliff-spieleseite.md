# S-W01: Feinschliff der Spieleseite nach der ersten Prüfung

**Status:** gebaut, freigegeben am 31.10.2026, 08:31
<!-- Freigabe durch den Betreiber im Projekt-Thread ("Wie empfohlen vorgehen"). -->

## Ziel
Freunde, die per Link kommen, finden sich ohne Erklärung zurecht: jedes Spiel führt zurück zur Startseite, hat ein eigenes Symbol,
zeigt keine Entwicklersprache und keine Knöpfe, die im Browser nicht gehen. Luftdrift läuft in der leichteren Fassung 6.
Eine Prüfung (statisch und am Handyformat) läuft vor jedem Commit und findet die Fehler der ersten Prüfung künftig selbst.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Jede Seite hat doctype, charset und viewport (4 von 4 Seiten) | `S1_grundgeruest` |
| AK-2 | 0 geladene Ressourcen von fremden Servern (statisch und beim Laden gemessen); Links `<a href="https://…">` sind erlaubt | `S2_keine_fremden_server`, `D2_keine_fremden_anfragen` |
| AK-3 | 0 relative Verweise auf fehlende Dateien (src, href, `register()`, `fetch()`, `new Worker()`) | `S3_verweise_vorhanden` |
| AK-4 | Jedes Spiel (3 von 3) hat einen Link `href="../"` mit Klasse `ng-zurueck`, im Startbild sichtbar, mindestens 32 px hoch, Tippen führt zur Startseite | `S4_zurueck_link`, `D4_zurueck_sichtbar` |
| AK-5 | Jede Seite (4 von 4) hat `rel="manifest"` auf eine vorhandene Datei mit Symbolen 192 und 512 px sowie `rel="icon"` | `S5_symbol_manifest` |
| AK-6 | 0 E-Mail-Adressen und 0 gesperrte Namen im ausgelieferten Text (Namen nur als SHA-256 im Prüfskript) | `S6_anonym` |
| AK-7 | 0 Treffer für Entwicklersprache im sichtbaren Text und Titel: "BCE", "Entity", "Boundary", "Fassung" | `S7_keine_fachsprache`, `D8_keine_fachsprache` |
| AK-8 | Kein waagrechtes Scrollen bei 412×915 und 915×412 (scrollWidth ≤ innerWidth) | `D3_kein_querscroll` |
| AK-9 | Brettspiele: alle 6 Reiter bei 412 px vollständig im Bild; Spielart-Wahl in allen 6 Spielen als Segment-Knopf (keine sichtbaren Optionsfelder) | `D5_reiter_sichtbar`, `D5b_spielart_gestaltet` |
| AK-10 | Driftpokal: "Zu zweit" im Browser nicht sichtbar | `D6_kein_zu_zweit_im_browser` |
| AK-11 | Luftdrift: Einstellung "Flughilfe" vorhanden (Fassung 6) | `D7_luftdrift_flughilfe` |
| AK-12 | 0 Skriptfehler beim Laden | `D1_keine_skriptfehler` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Saubere Seite: alle statischen Prüfungen grün | AK-1 bis AK-7 |
| PS-2 | Normal | Alle vier Seiten im Hoch- und Querformat laden ohne Fehler | AK-2, AK-8, AK-12 |
| PS-3 | Normal | Zurück-Link in jedem Spiel antippen, Startseite erscheint | AK-4 |
| PS-4 | Grenzwert | Breite genau 412 px: letzter Reiter "Mangala" endet bei ≤ 412 px | AK-9 |
| PS-5 | Grenzwert | Höhe des Zurück-Links wird gemessen und ausgegeben, Grenze 32 px (gemessen: Luftdrift und Brettspiele 36 px, Driftpokal 48 px) | AK-4 |
| PS-6 | Fehlerfall | Seite verweist auf `./sw.js`, Datei fehlt: Prüfung rot | AK-3 |
| PS-7 | Fehlerfall | Manifest verweist auf fehlendes Symbol: Prüfung rot | AK-5 |
| PS-8 | Fehlerfall | viewport fehlt: Prüfung rot | AK-1 |
| PS-9 | Missbrauch | Google-Fonts-Stylesheet oder Skript von CDN eingeschmuggelt: rot | AK-2 |
| PS-10 | Missbrauch | E-Mail-Adresse oder gesperrter Name im Fußtext: rot | AK-6 |
| PS-11 | Missbrauch | "BCE-Architektur" in den Titel geschrieben: rot | AK-7 |
| PS-12 | Missbrauch | Zurück-Link entfernt: rot | AK-4 |
| PS-13 | Wiederholbarkeit | Prüfung zweimal hintereinander: gleiches Ergebnis | alle |
| PS-14 | Wiederholbarkeit | Alte Fassung (Stand vor S-W01) geprüft: rot bei AK-4, 5, 7, 9, 10, 11 | alle |

## Gegenproben
`python3 werkstatt/seite_pruefen.py --gegenproben` kopiert die Seite in einen Zwischenordner, baut je einen Verstoß ein und erwartet die passende rote Prüfung:
- Verstöße: CDN-Skript, Google-Fonts-Link, fehlende Datei, `register('./sw.js')` ohne Datei, fehlender Zurück-Link, fehlendes viewport, E-Mail im Text, gesperrter Testname, "BCE-Architektur" im Titel, fehlendes Manifest, Manifest mit fehlendem Symbol.
- Fehlalarme (müssen grün bleiben): `<a href="https://github.com/…">` als Link, `src="data:…"`, `href="#anker"`, `@media` in CSS (kein E-Mail), das Wort "Entität", "Boundary" nur im Skript-Code.
- Handyprüfung (`werkstatt/seite_handy.js`): gegen den alten Stand muss sie rot sein (PS-14), gegen den neuen grün.

## Nicht Teil dieser Änderung
- Ergebnis teilen, Impressum, Geist und neue Spielmodi.
- Offline-Betrieb der Brettspiele (die nicht vorhandene `sw.js` wird nicht mehr angefragt).
- Rückführung der Änderungen in die Quell-Repos Driftpokal und Brettspiele.

## Betroffene Teile
Nur UI und Auslieferung (HTML, CSS, Manifest, Symbole). Spielregeln und Rechenkerne bleiben unverändert.
Driftpokal: eine Zeile in der UI-Schicht (Knopf im Browser verbergen).

## Risiken und Kosten
Luftdrift Fassung 6 ist auf der Seite neu: Bildrate am Handy ungemessen. Prüfung kostet ~1 s statisch, ~2 min am Handyformat (Software-Grafik).

## Ergebnis
- Vorher (Stand 22e8ea2): statisch 5 von 7 Prüfungen rot, am Handyformat 14 Prüfungen rot (D4 bis D8, D5b).
- Nachher: statisch 7 von 7 grün, Gegenproben 12 von 12 Verstößen erkannt, 6 von 6 Fehlalarm-Proben grün, Wiederholbarkeit gleich; Handyformat alles grün.
- Nicht im Container messbar: Bildrate von Luftdrift Fassung 6 und Driftpokal am Handy, Wirkung des Wachhaltens. Gerätetest am Handy offen.
- Bekannte Grenze: Der Zurück-Link im Driftpokal steht am Ende des Menüs neben "Vollbild" (bei Hochformat erst nach Wischen sichtbar).
