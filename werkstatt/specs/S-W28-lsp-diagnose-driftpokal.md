# S-W28: LSP-Diagnose für den HTML-Driftpokal in der schnellen Prüfkette

**Status:** gebaut, freigegeben am 22.11.2026 (Entscheidungskarten Ziel, Umfang, Spec)

## Anlass
Der Betreiber will, dass beim Driftpokal ein Diagnoseschritt wie in Neon Sprint (Baustein `vorlagen/app-vorlage/tools/bausteine/rust/ra_check.sh`) in die schnelle Prüfkette kommt. Die Ziel-Fassung ist der HTML-Driftpokal (Entscheidung am 22.11.2026: "HTML-Driftpokal"). Die Godot-Fassung (CayYanlama) ist nicht Teil dieser Spec. Das Quellrepo `MemoCan81735/Driftpokal` liegt außerhalb des Repo-Zugriffs dieser Sitzung; geprüft wird die ausgelieferte Datei `driftpokal/index.html` auf der Spieleseite (die Datei, die Besucher bekommt).

## Anwendungsfall
- U-1: Der Betreiber ruft `bash werkstatt/alle_tests.sh schnell` auf, und ein Fehler im Driftpokal-Code bricht die Kette mit Fundstelle ab.
- U-2: Der Betreiber ändert `driftpokal/index.html` und committet; der Commit-Hook läuft durch, weil der Stand sauber ist.
- U-3: Der Betreiber sieht bei Fehlern Datei, Zeile und Code (z. B. `TS2304`), ohne Rätselraten.

## Umfang
- Neues Skript `werkstatt/lsp_pruefen.py`: zieht aus `driftpokal/index.html` alle Skriptblöcke ohne Block, der mit `three.js` beginnt (eingebettete Bibliothek, nicht unser Code), schreibt sie in ein temporäres Verzeichnis und lässt `tsc --allowJs --checkJs --noEmit` mit `werkstatt/lsp/globals.d.ts` laufen.
- Gatter-Codes (Umfang "eingeschränkt"): `TS1xxx` (Syntax) außer `TS1052` (in JS erlaubt: Setter mit Standardwert), `TS2304` und `TS2552` (unbekannter Name), `TS2300`, `TS2451`, `TS2393` (doppelte Deklaration). Alle anderen Typhinweise werden nicht gemeldet.
- `werkstatt/lsp/globals.d.ts`: deklariert `THREE`, `__THREE_DEVTOOLS__`, `XRWebGLLayer`, `XRWebGLBinding` als Globale (vom Skript genutzt, nicht von der Spieleseite).
- Einbau in `werkstatt/alle_tests.sh` vor den App-Tests des schnellen Laufs.
- Kein Umbau des Spiels, keine Änderung an `driftpokal/index.html`.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aus U-2: sauberer Stand liefert Exit 0 und die Zeile "LSP-Diagnose: keine Befunde" | `lsp_test.py` |
| AK-2 | Aus U-1: ein unbekannter Name im Spielcode liefert Exit 1 mit `TS2304` und Zeilennummer | `lsp_test.py` |
| AK-3 | Aus U-1: ein fehlendes Klammerzeichen liefert Exit 1 mit einem `TS1xxx`-Code | `lsp_test.py` |
| AK-4 | Aus U-1: doppelte `const`-Deklaration liefert Exit 1 mit `TS2451` | `lsp_test.py` |
| AK-5 | Fehlerfall: fehlt `tsc`, Exit 2 mit klarer Meldung, nicht still grün | `lsp_test.py` |
| AK-6 | Fehlerfall: fehlt die Datei `driftpokal/index.html`, Exit 2 | `lsp_test.py` |
| AK-7 | Missbrauch: `set x(v = 1)` im Spielcode bleibt grün (TS1052 ausgenommen) | `lsp_test.py` |
| AK-8 | Fehlalarm: ein Fehler nur im three.js-Block wird nicht gemeldet (Exit 0) | `lsp_test.py` |
| AK-9 | Wiederholbarkeit: zweimal hintereinander gleiche Ausgabe und gleicher Exit-Code | `lsp_test.py` |
| AK-10 | Laufzeit: sauberer Lauf höchstens 30 s (gemessen heute ca. 3 s) | `lsp_test.py` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Originaldatei unverändert prüfen | AK-1 |
| PS-2 | Normal | Absichtlicher unbekannter Name `zzUnbekannt` im Spielcode | AK-2 |
| PS-3 | Grenzwert | Setter mit Standardwert im Spielcode | AK-7 |
| PS-4 | Fehlerfall | Syntaxfehler (fehlende schließende Klammer) im Spielcode | AK-3 |
| PS-5 | Fehlerfall | `tsc` nicht im Pfad (PATH leer) | AK-5 |
| PS-6 | Fehlerfall | Datei fehlt | AK-6 |
| PS-7 | Missbrauch | Doppelte `const` im Spielcode | AK-4 |
| PS-8 | Missbrauch | Absichtlicher Fehler nur im three.js-Block (Gegenprobe Fehlalarm) | AK-8 |
| PS-9 | Wiederholbarkeit | Gleicher Lauf zweimal | AK-9 |

## Gegenproben
- Verstoß: PS-2, PS-3 (nicht), PS-4, PS-7 müssen rot werden; PS-5 und PS-6 müssen Exit 2 liefern.
- Fehlalarm: PS-1, PS-3, PS-8 müssen grün bleiben.
- Die Gegenproben laufen in `lsp_test.py` auf Kopien; die echte Datei wird nie verändert.

## Messwerte und Rückblick
- Gemessen 22.11.2026: volle `checkJs`-Prüfung über beide Skriptblöcke 8.525 Befunde (überwiegend TS7006, TS18047 Null-Warnungen); eingeschränkt auf den Spielcode 0 Gatter-Befunde; globals.d.ts beseitigt die THREE-Fehlalarme.
- Die Laufzeit von `tsc` über den Spielblock: ca. 3 s.
- Bau: 10 Tests in `werkstatt/tests/lsp_test.py`, davon 8 rot vor dem Skript (AK-2, AK-3, AK-4, AK-7, AK-8, AK-9 bzw. Laufzeit und Gegenproben); AK-5 und AK-6 waren vor dem Skript grün, weil fehlende Datei und fehlendes Skript beide Exit 2 liefern. Zwei Fehler beim ersten Lauf: Zeilenzuordnung (Befund zeigte spiel.js) und Erkennung des three.js-Blocks, wenn davor eine Zeile eingefügt wird. Beides behoben, Test AK-8 deckt den zweiten ab.
- Schnelle Kette: LSP-Schritt grün ("keine Befunde"). Zwei Läufe der Kette mit wechselnden Browserfehlern ("Target page ... closed") in d3- bzw. s-Tests, die einzeln grün laufen; nicht durch diesen Schritt verursacht, offen zu beheben.
- Rückblick Fehler: Ein Zeilenfehler und die Blockerkennung gehören in die Fehlerliste (früheste Stufe: Spec-Test, hier im Test erkannt).

## Technisches Design
- Schnittstellen: `python3 werkstatt/lsp_pruefen.py [DATEI]` (Standard: `driftpokal/index.html`), Exit 0 grün, 1 Befund, 2 Umgebung fehlt.
- Blockauswahl über Anfang des Blocks (`three.js`); damit bleibt die Auswahl stabil, auch wenn Blocknummern sich ändern.
- Datenformat: keine gespeicherten Daten; Eingabe ist die HTML-Datei, Ausgabe sind Textzeilen und der Exit-Code.
- Alternativen: (a) volles checkJs (verworfen, zu viele Befunde), (b) `eslint` (verworfen: Konfiguration für eingebettetes Skript nötig, Nutzen geringer als tsc-Namensprüfung), (c) gewählt: tsc mit kurierter Codeliste.
- Entscheidung: (c).
- Design-Review: Eigenprüfung gegen Spec. Keine unabhängige Prüfung, Änderung unter 150 Zeilen.

## Querschnitt
- Datenschutz: nur lokale Prüfung, keine Daten verlassen den Rechner.
- Sicherheit: kein Netzverkehr; Skript schreibt nur in ein temporäres Verzeichnis.
- Barrierefreiheit: nicht anwendbar (reines Kommandozeilenwerkzeug ohne Oberfläche); Meldungen stehen als klarer deutscher Text mit Datei und Zeile.
- Leistung: ca. 3 s, Grenze 30 s (AK-10).

## Kritische Testfälle
- PS-2: unbekannter Name im Spielcode wird erkannt (Kernzweck)
- PS-5: fehlendes tsc ist ein Fehler, nie still grün
- PS-8: Fehler nur im three.js-Block löst keinen Fehlalarm aus

## Clean Code
- Clean Code: Prüfergebnis: neue Dateien sind `lsp_pruefen.py` (unter 90 Zeilen, drei Funktionen), `lsp/globals.d.ts` (6 Zeilen) und `tests/lsp_test.py` (unter 130 Zeilen); keine Änderung an `driftpokal/index.html`.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | test_ak2_unbekannter_name_wird_erkannt |
| U-2 | test_ak1_sauberer_stand_ist_gruen |
| U-3 | test_ak3_syntaxfehler_wird_erkannt |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W28-lsp-diagnose-driftpokal.md
- Aktualisiert: werkstatt/lsp_pruefen.py
- Aktualisiert: werkstatt/tests/lsp_test.py
- Aktualisiert: werkstatt/alle_tests.sh
