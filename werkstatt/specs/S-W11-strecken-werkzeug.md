# S-W11: Werkzeug für Strecken aus echten Straßen (erste Strecke: Oer-Erkenschwick Runde)

**Status:** gebaut, freigegeben am 02.11.2026, 08:02
<!-- Freigabe durch den Betreiber im Projekt-Thread: Wunsch "Strecke aus echten Straßen, nicht nur einmalig" (01.11.2026), Straßenliste für Oer-Erkenschwick (02.11.2026 07:52),
     Auswahl "Nur auf der Seite (HTML)" auf die Frage "Wohin soll die neue Strecke und das Werkzeug gebaut werden?" (02.11.2026 08:02). Das Driftpokal-Repo bleibt unberührt. -->

## Anlass
Wunsch des Betreibers: Eine Strecke im Driftpokal aus echten Straßen seiner Stadt. Das soll ein Werkzeug sein, das jederzeit neu bauen kann, nicht Handarbeit.
Plan: `plan-stadtstrecken-werkzeug.md`. Test: Oer-Erkenschwick, Runde ab Berliner Platz über Stimbergstraße, Klein-Erkenschwicker-Straße, Bergstraße, Holtgarde, Werderstraße, Im Buschkamp, Ludwigstraße zurück.

## Rechenmodell (verbindlich)
- Werkzeug in `werkstatt/strecken/` (Python, nur Standardbibliothek; Prüfung mit dem Spielkern im Browser). Das Spiel lädt zur Laufzeit nichts aus dem Netz.
- Ablauf: `abruf.py` (Straßendaten holen, nur dort, wo das Netz offen ist) → `daten/<id>-<Datum>.json` (Formatversion 1, mit Quelle und Abrufdatum, ohne Gebäude) → `baue.py` → `strecken/<id>.json` → `pruefe.js` (Computerfahrer fährt die Strecke) → `einbauen.py` (trägt die Strecke in `driftpokal/index.html` ein, zwischen Markierungen `@@strecke`).
- **Zeit und Zufall:** `baue.py` und `einbauen.py` verwenden weder Uhrzeit noch Zufall; dieselben Eingaben ergeben byteweise dieselbe Datei. Das Datum steht nur in der Datendatei (aus dem Abruf).
- **Umrechnen:** Straßennetz als Graph; Weg von Straße zu Straße in der Reihenfolge des Auftrags auf dem kürzesten Weg, wobei die genannten Straßen bevorzugt werden (Kosten × 0,35); Schleifen und Hin-und-her entfernt; geschlossen am Start. Nord ist oben. Danach wird die Linie geglättet, bis sie in Spielgröße keine engere Kurve als 55 Einheiten Radius hat (Spielgröße = Meter × Maßstab, der Maßstab passt die Strecke in 960 Einheiten Breite bzw. Höhe), und in gleich weit entfernte Stützpunkte zerlegt (Start = Punkt 0). Die Zahl der Punkte (20 bis 30) wählt das Werkzeug so, dass der Spline des Spiels die weichste Kurve ergibt; liegt der kleinste Radius dennoch unter 48, bricht es mit "Kurven zu eng" ab.
- **Prüfungen im Werkzeug:** nach dem Weg liegt jede Straße des Auftrags ≤ 20 m von der Linie; die fertige Strecke kreuzt sich nicht (Abstand ≥ 100); `einbauen.py` baut nur ein, wenn die Fahrprüfung (id, 0 Wandkontakte, alle im Ziel, Rundenzeit 15 bis 40 s) bestanden ist. Der Nullpunkt der Umrechnung ergibt sich aus dem Gebiet des Auftrags.
- **Eintrag in das Spiel:** Strecke `oer` (Breite 70, Rand 26, Haftung 1), Aussehen abgeleitet von Oer-Erkenschwick, im Heimat-Cup als vierte Strecke. Wetter wie Oer-Erkenschwick (Abend, Nacht; Grundwetter nass). Quelle "© OpenStreetMap-Mitwirkende" steht im Untertitel der Strecke.
- Bestehende 14 Strecken bleiben unverändert (Prüfsumme ihrer Daten).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Die gebaute Linie geht durch alle 8 Straßen des Auftrags (je Straße mindestens ein Stützpunkt der Rohlinie ≤ 20 m von ihr) in der Reihenfolge des Auftrags; sie ist geschlossen und beginnt am Berliner Platz | `st_weg` |
| AK-2 | 20 bis 30 Stützpunkte, alle in 100 bis 1100 (Spielraum 1200); keine Selbstüberkreuzung (nicht benachbarte Teile der geglätteten Linie ≥ 100 Einheiten auseinander); kleinster Kurvenradius der geglätteten Linie ≥ 45 Einheiten (Spielgröße mit Streckung 1,5) | `st_form` |
| AK-3 | Zweimal bauen ergibt byteweise dieselbe Datei; die Datei enthält keine Uhrzeit | `st_wieder` |
| AK-4 | Fehlerfälle brechen mit klarer Meldung (nie "unerwartet") und Rückgabewert 1 ab: unbekannter Straßenname, leere Datei, fehlendes Abrufdatum, falsche Formatversion, Straße ohne Anschluss an die übrigen, Weg nur hin und zurück (keine Runde) | `st_fehler` |
| AK-5 | Computerfahrer (6 Karts, 3 Runden, schwerste Stufe): alle erreichen das Ziel, 0 Wandkontakte, beste Runde zwischen 15 und 40 s; bei Grundwetter, Abend und Nacht ebenso | `st_fahrt` |
| AK-6 | Nach `einbauen.py`: `oer` steht in Strecken, Sterne-Aufgaben, Aussehen, Wetterregeln und Heimat-Cup; Seite lädt ohne Skriptfehler und ohne fremde Anfragen; die 14 alten Strecken sind byteweise unverändert; entfernen, erstmals einbauen und zweimal einbauen ergeben dieselbe Seite wie im Repo; schlechte Prüfergebnisse werden nicht eingebaut | `st_einbau` |
| AK-7 | Der Heimat-Cup mit 4 Streckenbildern bleibt in einer Reihe und ist nicht höher als die anderen Pokalkarten | `st_cup` |
| AK-8 | Rennstart auf `oer` im echten Bild: Rennen läuft (Startbild mit Ampel), Name und Quelle "© OpenStreetMap-Mitwirkende" sind im Streckenmenü sichtbar | `st_bild` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Echte Daten von Oer-Erkenschwick: Weg durch alle 8 Straßen | AK-1 |
| PS-2 | Grenzwert | Auftrag mit nur 4 Straßen (Berliner Platz, Stimbergstraße, Holtgarde, Ludwigstraße): entweder gültige geschlossene Linie oder klare Ablehnung mit "Runde" (nie eine ungültige Datei); ein reiner Hin-und-zurück-Weg (Berliner Platz, Stimbergstraße) wird mit "Runde" abgelehnt | AK-1, AK-2, AK-4 |
| PS-3 | Normal | Form: Punkte im Raum, Kurvenradius, keine Überkreuzung | AK-2 |
| PS-4 | Wiederholbarkeit | Zweimal bauen, Bytevergleich | AK-3 |
| PS-5 | Fehlerfall | Straßenname "Gibtesnicht" | AK-4 |
| PS-6 | Fehlerfall | Datei leer / ohne `abgerufen` / Formatversion 2 | AK-4 |
| PS-7 | Missbrauch | Straße vorhanden, aber nicht mit dem Netz verbunden (Insel) | AK-4 |
| PS-8 | Missbrauch | Straßenname mit Sonderzeichen und Anführungszeichen im Auftrag: kein Absturz, Fehlermeldung | AK-4 |
| PS-9 | Normal | Computerfahrer auf `oer`, Grundwetter | AK-5 |
| PS-10 | Wiederholbarkeit | Dasselbe mit anderem Startwert (Seeds 5 und 9): wieder 0 Wandkontakte | AK-5 |
| PS-11 | Normal | Einbauen und Seite laden | AK-6 |
| PS-12 | Wiederholbarkeit | Zweimal einbauen: Datei gleich | AK-6 |
| PS-13 | Normal | Rennstart im Bild, Name und Quelle im Menü | AK-8 |
| PS-14 | Normal | Pokalmenü: Heimat-Cup mit vier Streckenbildern in einer Reihe | AK-7 |
| PS-15 | Fehlerfall | Prüfergebnis mit Wandkontakt, nicht allen im Ziel, falscher Strecke, zu langsamer Runde oder fehlendem Feld: nicht eingebaut, Seite unverändert | AK-6 |
| PS-16 | Missbrauch | Elemente ohne Linie oder ohne Etiketten, Auftrag ohne Namen, 0-Byte-Datei, Namen keine Texte: klare Meldung bzw. keine Wirkung | AK-4 |

## Gegenproben
- Verstoß: eine Straße aus dem Weg gestrichen; 40 statt 20 bis 30 Punkte; Punkte außerhalb des Raums; zu viele Punkte (zu enge Kurven); Strecke zu schmal (Breite 20, Computerfahrer kracht); Uhrzeit in der Ausgabe; Straßen in falscher Reihenfolge, Heimat-Cup bricht um, fremde Anfrage; Einbauen doppelt (Eintrag zweimal); alte Strecke verändert; Quelle fehlt im Untertitel. Jeder muss seinen Test rot machen.
- Fehlalarm: als Tests eingebaut: PS-2 (vier Straßen dürfen gebaut oder klar abgelehnt werden), PS-10 (anderer Startwert, 0 Wandkontakte), Elemente ohne Linie ändern die Ausgabe nicht (PS-16).

## Nicht Teil dieser Änderung
Wahrzeichen und Häuserzeilen (von Hand mit dem Betreiber, später), Brücken und Höhen, automatische Suche nach Rundkursen, Godot-Version, das Driftpokal-Repo, WLAN-Spiel (dort ändert sich die Regelprüfsumme durch die neue Strecke; "Zu zweit" ist auf der Seite ausgeblendet).

## Betroffene Schichten
Werkzeug außerhalb des Spiels. Im Spiel nur Daten (Streckentabelle, Aussehen, Regeln). Spielregeln, Physik und Menü bleiben unverändert.

## Risiken und Kosten
Datei der Straßendaten ist 1,2 MB im Repo (ohne Gebäude). Die Strecke ist kürzer als die meisten anderen (Fläche der Stadt passt in 960 Einheiten). Die kleinen Eckpunkte der echten Straßen gehen durch das Glätten verloren (Abweichung wird gemessen und im Ergebnis genannt). Lizenz: Daten © OpenStreetMap-Mitwirkende (ODbL), Hinweis im Spiel; Impressum der Seite ist noch offen.

## Ergebnis
- Vorher: alle Tests rot (Werkzeug und Strecke fehlten; die alte Seite ohne `oer` ließ `st_einbau`, `st_bild` und `st_fahrt` scheitern). Nachher: 4 von 4 Rechen-Tests (`strecken_test.py`) und 4 von 4 Spiel-Tests (`strecken_test.js`) grün, 15 von 15 Gegenproben erkannt (`gegenproben_strecken.py`).
- Messwerte Oer-Runde: Weg 4660 m durch alle 8 Straßen in der Reihenfolge des Auftrags, größte Abweichung der geglätteten Linie von der Straße 19 m, Maßstab 0,591 Einheiten je Meter, 20 Stützpunkte, kleinster Kurvenradius 61 Einheiten (Grenze 45), kleinster Abstand nicht benachbarter Teile 240 (Grenze 100). Streckenlänge im Spiel 3879 (die anderen 4281 bis 5387), also eine kurze Strecke. Computerfahrer: 6 von 6 im Ziel, 0 Wandkontakte, beste Runde 21,7 bis 22,0 s bei Grund, Abend und Nacht, Rennen 78 s; Par 77 s.
- Beim Bauen gefunden: (1) Das Spiel zeichnet Streckenbilder des Pokalmenüs in drei Spalten; der Heimat-Cup mit vier Strecken wäre in eine zweite Reihe gerutscht. Jetzt richtet sich die Spaltenzahl nach der Zahl der Strecken (`st_cup`). (2) Die Auswahl von 24 Stützpunkten ergab je nach Zahl Kurvenradien zwischen 32 und 61; das Werkzeug wählt jetzt unter 20 bis 30 Punkten die weichste Lösung. (3) Die Glättung ist hier nebensächlich, der Spline über wenige Punkte glättet selbst (Radius 56 auch ohne Glättung); sie bleibt als Sicherheit für andere Städte, eine Gegenprobe dafür gibt es nicht. (4) Die Gegenprobe "Straße übersprungen" wurde nicht erkannt, weil der kürzeste Weg die Straße ohnehin befährt (gleichwertige Änderung); entfernt. (5) Die unabhängige Prüfung fand: Prüfung nach dem Weg fehlte (Schleifenentfernung konnte eine Straße abschneiden), keine Kreuzungsprüfung im Werkzeug, fehlende Schlüssel in den Daten führten zu unklaren Meldungen, `einbauen.py` prüfte Strecke und Rundenzeit nicht, der Weg "erstmals einbauen" war ungetestet. Alles behoben und getestet; der Nullpunkt der Umrechnung ist nicht mehr fest.
- Offen: PS-2 mit vier Straßen wird von diesem Auftrag abgelehnt ("Keine Runde"), weil der Rückweg dieselben Straßen nimmt; erlaubt laut Spec (gebaut oder klar abgelehnt). Wahrzeichen und Häuserzeilen sind noch nicht dabei. Gerätetest: offen (Abnahmeliste `abnahme-oer-runde-S-W11.md`).
