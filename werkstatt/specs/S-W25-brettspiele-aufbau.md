# S-W25: Brettspiele einheitlich aufbauen (Navigation, Anordnung, Tippflächen, Querformat)

**Status:** gebaut am 11.11.2026, 06:10 (freigegeben am 11.11.2026, 05:53)
<!-- Freigabe durch den Betreiber im Projekt-Thread: Auftrag "Prüfe generell Design und Navigation und Anordnungen auf den teilseiten von den Brettspielen" (10.11.2026),
     danach Wahl "Aufbau zuerst, dann Dame" auf der Auswahlkarte (Punkt 1 bis 8 der gemeldeten Befunde beheben, Dame kommt danach in den neuen Aufbau).
     Navigation: drei Varianten als Bild gezeigt (navigation-varianten.png); der Betreiber wählte am 11.11.2026, 06:09 "A: Kacheln und schmale Kopfzeile".
     Die Nummer S-W24 bleibt für Tavla frei (eigener Thread). -->

## Anlass
Befund aus der Prüfung am 10.11.2026 (Handyformat 412 × 915 und Querformat 915 × 412, alle sieben Reiter vermessen):
1. Reiter in drei Zeilen (110 px hoch), letzte Zeile mit einem einzelnen Reiter; mit Dame und Tavla werden es neun Spiele.
2. Reiter 33 px hoch, "Alle Spiele" und Tonknopf 36 px (Maß: 44 px).
3. Bei Mangala und Schachschule rutscht die Seite samt Kopfzeile um etwa 110 px nach unten (kurzer Inhalt wird mittig gesetzt).
4. Schach hat Überschriften und Symbole auf den Knöpfen, die anderen Spiele nicht; bei Schach bleibt eine Lücke zwischen Spielmodus und Optionen.
5. Mühle: "Lernhilfe an" bricht allein in eine zweite Zeile um.
6. Querformat: kein Brett passt auf den Bildschirm, Brett und Knöpfe stehen untereinander.
7. Der Hinweis zu Stockfish und chess.js steht unter jedem Spiel.
8. Tippflächen unter 44 px: Umschalter Spielmodus (28 px), "Statistik zurücksetzen" (23 px), Reversi-Felder (38 px), Mangala-Mulden (37 px), Hauptknöpfe (42 px).

Anforderungen (Betreiber, 10. und 11.11.2026):
- A-1: Design, Navigation und Anordnung auf allen Teilseiten der Brettspiele sind geprüft und die Befunde 1 bis 8 behoben.
- A-2: Der neue Aufbau steht, bevor Dame eingebaut wird; neue Spiele (Dame, Tavla) passen ohne Umbau hinein.
- A-3: Navigation nach Variante A (Kacheln und schmale Kopfzeile), vom Betreiber gewählt.

## Anwendungsfall 1: Ein Spiel auswählen
- Akteur: Spieler am Handy
- Ziel: in höchstens zwei Tipps im gewünschten Spiel sein und immer wissen, wie er zur Auswahl zurückkommt
- Auslöser: öffnet die Brettspiele von der Spieleseite
- Gefühl: aufgeräumt, "ich sehe sofort, was es gibt"
- U-1: beim ersten Besuch sieht er die Auswahl: Überschrift "Brettspiele" und je Spiel eine Kachel mit eigenem Bild und Namen, alle ohne Scrollen sichtbar
- U-2: tippt auf eine Kachel; das Spiel erscheint, die Kopfzeile zeigt "‹ Spiele", den Namen des Spiels und den Tonknopf
- U-3: tippt auf "‹ Spiele" (oder die Zurück-Geste des Handys); die Auswahl erscheint wieder, das zuletzt gespielte Spiel ist markiert ("Weiterspielen")
- U-4: beim nächsten Besuch öffnet sich sofort das zuletzt gespielte Spiel (sofort spielbar), die laufende Partie steht wie verlassen
- Alternativen: Speicher blockiert oder kaputt (Auswahl erscheint, Spiel läuft); gespeichertes Spiel gibt es nicht mehr (Auswahl erscheint); Schach nicht ladbar (Kacheln Schach und Schachschule fehlen, Rest geht); sehr schnelles Hin- und Hertippen
- Erfolgsmaß: Kopfzeile steht in jedem Spiel an derselben Stelle; kein Spiel braucht mehr als zwei Tipps

## Anwendungsfall 2: In jedem Spiel dieselbe Anordnung
- Akteur: Spieler, der zwischen den Spielen wechselt
- Ziel: jeden Knopf dort finden, wo er im vorigen Spiel war, und ihn sicher treffen
- Auslöser: öffnet ein beliebiges Spiel
- Gefühl: vertraut, keine Fehltipps
- U-5: sieht von oben nach unten: Kopfzeile, Statuszeile, Brett, "Aktionen" (Neu starten, Zug zurück, Tipp), "Spielmodus" (2 Spieler, Gegen Computer, darunter die Stufen), "Optionen" (soweit vorhanden: 3D oder 2D, Lernhilfe, Regeln), Statistik
- U-6: Statuszeile, Brett und die Zeile "Aktionen" sind im Hochformat ohne Scrollen zu sehen
- U-7: jede tippbare Fläche ist mindestens 44 × 44 px groß; die Knöpfe tragen in allen Spielen dieselben Symbole wie bei Schach
- U-8: der Lizenzhinweis zum Schach-Computer steht nur bei Schach und Schachschule, der Satz zum Datenschutz überall
- Alternativen: Partie zu Ende (Knopf "Teilen" kommt in die Zeile "Optionen"); Mühle-Übung läuft; große Schrift am Handy
- Erfolgsmaß: gleiche Reihenfolge der Abschnitte in allen Spielen, gemessen

## Anwendungsfall 3: Querformat
- Akteur: Spieler, der das Handy quer hält
- Ziel: Brett vollständig sehen und spielen, ohne zu scrollen
- Auslöser: dreht das Handy
- Gefühl: "passt"
- U-9: das Brett steht links und ist vollständig sichtbar, Statuszeile und "Aktionen" stehen rechts daneben und sind ohne Scrollen sichtbar
- U-10: die Auswahl zeigt alle Kacheln ohne Scrollen
- Alternativen: Drehen mitten in der Partie (Stand bleibt); Tablet und Laptop (breit und hoch: Anordnung wie Hochformat)
- Erfolgsmaß: Brettunterkante innerhalb des Bildschirms bei 915 × 412

## Rechenmodell (verbindlich)
- **Ansichten (UI):** Genau eine von zwei Ansichten ist sichtbar: "Auswahl" (Kacheln) oder "Spiel" (ein Spiel). `TabController` hält den Zustand (`ansicht`, `activeTab`), nie aus dem DOM gelesen.
- **Kacheln:** Die Kacheln sind die bisherigen Knöpfe `.tabBtn[data-tab]` (gleiche Namen wie bisher, damit Tests und Verweise gültig bleiben), jetzt mit eigenem Bild (SVG, selbst gezeichnet, keine Schriftzeichen als Bild). Reihenfolge fest: Schach, Schachschule, Mühle, Vier gewinnt, Reversi, Mangala, Tic Tac Toe; neue Spiele hängen sich an.
- **Start:** Ist in den Einstellungen `zuletzt` ein vorhandenes Spiel gespeichert, öffnet es sich bei einem neuen Besuch direkt; sonst die Auswahl. Beim Neuladen entscheidet der Eintrag im Verlauf: im Spiel bleibt das Spiel, in der Auswahl bleibt die Auswahl.
- **Zurück:** Beim Öffnen eines Spiels aus der Auswahl kommt genau ein Eintrag in den Verlauf des Browsers (ohne Änderung der Adresse); die Zurück-Geste führt zur Auswahl. "‹ Spiele" geht denselben Weg (ein Schritt zurück im Verlauf). Beim direkten Start im zuletzt gespielten Spiel wird der Eintrag der Auswahl davor angelegt. Wechsel von Spiel zu Spiel ersetzt den Eintrag, der Verlauf wächst nicht. Ist der Verlauf gesperrt, gehen die Knöpfe trotzdem. In der Auswahl führt "‹ Alle Spiele" zur Spieleseite. In der Auswahl ist kein Spiel aktiv, die 3D-Ansichten ruhen.
- **Gespeicherte Daten:** `brettspiele.einstellungen` (Formatversion 1) bekommt das optionale Feld `zuletzt` (Name des Spiels, z. B. "chess"). Fehlt es oder nennt es kein vorhandenes Spiel, gilt "keins". Ältere Daten bleiben gültig.
- **Anordnung:** `GameUI` baut für jedes Spiel dieselben Abschnitte in fester Reihenfolge: Überschrift "Aktionen" und Knopfzeile, Überschrift "Spielmodus" mit Umschalter und Stufen, Überschrift "Optionen" mit Knopfzeile (nur wenn sie Knöpfe enthält), Statistik. Die Spielüberschrift (h1) steht in der Kopfzeile, nicht mehr über dem Brett.
- **Maße:** Jede sichtbare tippbare Fläche (Knopf, Umschalter, Verweis, Feld, Mulde, Kachel) mindestens 44 × 44 px bei 412 px Breite. Ausnahme wie bisher: Verweise im Fließtext des Hinweises am Seitenende.
- **Querformat:** Gilt bei Querformat mit Höhe bis 560 px. Zwei Spalten: links das Brett (Höhe aus der sichtbaren Bildschirmhöhe ohne Adressleiste abgeleitet), rechts alles andere. Brettfelder dürfen quer kleiner als 44 px sein, aber nicht kleiner als 32 px.
- **Schichten:** Nur UI und die Einstellungen (Boundary und Control für das Feld `zuletzt`). Keine Regel eines Spiels wird geändert. Zeit und Zufall kommen nicht vor.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Erster Besuch zeigt die Auswahl: je vorhandenem Spiel genau eine Kachel mit Bild (SVG) und Namen, jede mindestens 96 × 100 px, in der festen Reihenfolge, alle bei 412 × 915 ohne Scrollen sichtbar; kein Spiel ist dabei sichtbar (U-1) | `au_auswahl` |
| AK-2 | Tipp auf eine Kachel zeigt das Spiel in höchstens 300 ms; Kopfzeile zeigt "‹ Spiele", den Namen und den Tonknopf, alle mindestens 44 px hoch; die Auswahl ist verborgen; genau eine Hauptüberschrift ist sichtbar (U-2) | `au_auswahl` |
| AK-3 | Die Kopfzeile steht in allen Spielen und in der Auswahl an derselben Stelle (Oberkante gleich, Abweichung höchstens 1 px), auch bei kurzem Inhalt (U-2, Befund 3) | `au_kopfzeile` |
| AK-4 | "‹ Spiele", die Zurück-Geste und die Zurück-Taste der App zeigen die Auswahl; das zuletzt gespielte Spiel trägt die Markierung "Weiterspielen", genau eine Kachel; fünfmal Öffnen und Schließen lässt den Verlauf nicht wachsen; Vorwärts zeigt wieder das Spiel; ist der Verlauf gesperrt oder antwortet er nicht, gehen die Knöpfe trotzdem und nichts bleibt hängen (U-3) | `au_zurueck` |
| AK-5 | Nach Neuladen im Spiel und beim nächsten Besuch öffnet sich das zuletzt gespielte Spiel direkt, die Partie steht wie verlassen; wer in der Auswahl neu lädt, bleibt in der Auswahl; kaputte Einstellungen, unbekanntes Spiel oder blockierter Speicher: Auswahl erscheint, kein Skriptfehler (U-4) | `au_zuletzt` |
| AK-6 | Jedes Spiel mit Brett (alle außer der Schachschule, die eigene Abschnitte hat) hat die Abschnitte in der Reihenfolge Statuszeile, Brett, Aktionen, Spielmodus, Optionen (falls Knöpfe), Statistik; die Zeile Aktionen enthält genau Neu starten, Zug zurück, Tipp in dieser Reihenfolge und in einer Zeile; die Stufen stehen direkt unter dem Spielmodus; zwischen zwei Abschnitten liegt höchstens 40 px Abstand, kein leerer Abschnitt ist höher als 8 px, die Überschrift Optionen erscheint nur mit Knöpfen (U-5, Befunde 4 und 5) | `au_anordnung` |
| AK-7 | Hochformat 412 × 915: Unterkante der Zeile Aktionen höchstens bei 915 px ohne Scrollen, in jedem Spiel mit Brett, auch während der Mühle-Übung und mit Lernsatz bei Schach (U-6) | `au_sichtbar` |
| AK-8 | Jede sichtbare tippbare Fläche in Auswahl und allen Spielen ist bei 412 px Breite mindestens 44 × 44 px (Ausnahme: Verweise im Hinweistext); eingeschlossen sind die Felder von Reversi, Mangala, Schach flach, Vier gewinnt flach und Schachschule sowie die Regelkarten der Mühle; bei 360 px Breite dürfen nur Brettfelder kleiner werden (mindestens 38 px), alle Knöpfe bleiben bei 44 px; nichts ragt seitlich hinaus (U-7, Befunde 2 und 8) | `au_tippflaechen` |
| AK-9 | Die Knöpfe Neu starten, Zug zurück, Tipp, 3D/2D und Lernhilfe tragen in jedem Spiel ein Symbol (Maske vorhanden, mindestens 14 px breit) (U-7) | `au_anordnung` |
| AK-10 | Der Lizenzhinweis zum Schach-Computer ist nur bei Schach und Schachschule sichtbar, der Satz zum Datenschutz in jeder Ansicht; die Lizenzverweise bleiben in der Seite (U-8) | `au_hinweis` |
| AK-11 | Querformat 915 × 412: in jedem Spiel mit Brett liegt das Brett vollständig im Bildschirm (Unterkante höchstens 412 px), Statuszeile und Zeile Aktionen stehen rechts vom Brett und sind ohne Scrollen sichtbar (Mangala ist breit und flach: dort bleibt die Bedienung unter dem Brett und ist ebenfalls ohne Scrollen sichtbar); nichts ragt seitlich hinaus; Brettfelder sind quer mindestens 32 px groß; das gilt auch für die flachen Bretter von Schach und Vier gewinnt, mit laufender Mühle-Übung und mit Lernsatz bei Schach; die Schachschule bleibt einspaltig und ragt nicht hinaus (U-9) | `au_quer` |
| AK-12 | Querformat: alle Kacheln der Auswahl ohne Scrollen sichtbar; Drehen mitten in der Partie ändert den Spielstand nicht, das räumliche Brett passt seine Größe an (U-10) | `au_quer` |
| AK-13 | Bilder aus Spielersicht (Auswahl, jedes Spiel hoch und quer) ohne Skriptfehler; alle bisherigen Tests der Brettspiele bleiben grün | `au_bilder` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Erster Besuch: Auswahl mit allen Kacheln, Tipp auf jede Kachel | AK-1, AK-2 |
| PS-2 | Grenzwert | Schach nicht ladbar: Kacheln Schach und Schachschule fehlen, übrige Kacheln vollständig | AK-1 |
| PS-3 | Normal | Kopfzeile in Auswahl und allen Spielen vermessen (lange und kurze Seiten) | AK-3 |
| PS-4 | Normal | Spiel öffnen, "‹ Spiele" tippen; Spiel öffnen, Zurück-Geste | AK-4 |
| PS-5 | Missbrauch | Zehnmal schnell zwischen Auswahl und Spielen wechseln, Zurück mehrfach hintereinander: danach genau eine Ansicht sichtbar, Seite nicht verlassen, kein Skriptfehler | AK-4 |
| PS-6 | Normal | Spiel öffnen, Zug machen, neu laden: Spiel und Partie stehen | AK-5 |
| PS-7 | Fehlerfall | Einstellungen als kaputter Text; `zuletzt` nennt unbekanntes Spiel; `zuletzt` ist eine Zahl; `zuletzt` ist "constructor"; fremde Formatversion | AK-5 |
| PS-8 | Fehlerfall | Speicher wirft Fehler (blockiert): Auswahl erscheint, Spiele laufen | AK-5 |
| PS-9 | Normal | Reihenfolge der Abschnitte und Inhalt der Zeile Aktionen in jedem Spiel | AK-6, AK-9 |
| PS-10 | Grenzwert | Spiel ohne Optionen (Tic Tac Toe): kein leerer Abschnitt Optionen; Schach ohne Computer: keine Lücke | AK-6 |
| PS-11 | Grenzwert | Partie zu Ende: "Teilen" steht in Optionen, Zeile Aktionen bleibt bei drei Knöpfen | AK-6 |
| PS-12 | Normal | Unterkante Aktionen in jedem Spiel bei 412 × 915 | AK-7 |
| PS-13 | Grenzwert | Mühle mit laufender Übung (erster Start) und Schach mit Lernsatz: Unterkante Aktionen höchstens 915 px | AK-7 |
| PS-14 | Normal | Alle tippbaren Flächen in Auswahl und Spielen vermessen | AK-8 |
| PS-15 | Grenzwert | Breite 360 px: nichts ragt seitlich hinaus, Kacheln und Knöpfe bleiben mindestens 44 px hoch | AK-8 |
| PS-16 | Normal | Hinweis je Ansicht: Lizenz nur bei Schach und Schachschule | AK-10 |
| PS-17 | Normal | Querformat: Brett, Statuszeile und Aktionen in jedem Spiel | AK-11 |
| PS-18 | Grenzwert | Querformat 740 × 360 (kleines Handy): Brett vollständig sichtbar | AK-11 |
| PS-19 | Fehlalarm | Tablet 820 × 1180 und Laptop 1280 × 800: Anordnung wie Hochformat, einspaltig | AK-11 |
| PS-20 | Normal | Drehen mitten in der Partie: Spielstand gleich | AK-12 |
| PS-21 | Wiederholbarkeit | Messungen zweimal: gleiche Werte | AK-3, AK-8 |
| PS-22 | Normal | Bilder aller Ansichten hoch und quer, keine Skriptfehler | AK-13 |
| PS-23 | Grenzwert | Sehr schmal (320 px) und Partieende mit "Teilen": nichts ragt hinaus | AK-8 |
| PS-24 | Fehlerfall | Verlauf gesperrt (Schreiben wirft Fehler) und Verlauf ohne Antwort auf Zurück | AK-4 |
| PS-25 | Grenzwert | Neuladen in der Auswahl nach einem Spiel: Auswahl bleibt | AK-5 |
| PS-26 | Grenzwert | Querformat mit laufender Mühle-Übung, mit Lernsatz bei Schach und mit flachem Schachbrett | AK-11 |

## Gegenproben
- Verstoß (jeder muss seinen Test rot machen): Kachel ohne Bild; Seite wieder mittig gesetzt (Kopfzeile springt); "‹ Spiele" ohne Wirkung; `zuletzt` wird nicht gespeichert; unbekanntes `zuletzt` wird geöffnet; Tipp vor Zug zurück; Überschrift Optionen ohne Knöpfe sichtbar; Reversi-Feld 38 px; Umschalter 28 px hoch; Lizenzhinweis überall sichtbar; Querformat einspaltig; Symbol auf einem Knopf entfernt.
- Fehlalarm (darf nicht anschlagen): PS-2 (fehlende Schach-Kacheln sind kein Fehler), PS-19 (Tablet und Laptop bleiben einspaltig), Verweise im Hinweistext unter 44 px.

## Technisches Design (Phase 3)
- Schnittstellen: `TabController` neu `zeigeAuswahl()`, `switchTo(spiel, { verlauf })`, `getAnsicht()`; `EinstellungenControl` neu `zuletzt()` und `setzeZuletzt(spiel)`; `GameUI._baueZusatzknoepfe()` baut die Abschnitte (`.gruppe`, `.optionen`) für alle Spiele, Knöpfe tragen die Klassen `neu-knopf`, `zurueck`, `tipp-knopf`, `ansicht-knopf`, `lernen-knopf`, `hilfe-knopf` (Symbole per Klasse statt per `#chess-view`); `body` trägt `data-ansicht` (auswahl|spiel) und `data-spiel`.
- Datenformat: `brettspiele.einstellungen` bleibt Formatversion 1, neues optionales Feld `zuletzt` (Text). Fehlend, kein Text oder unbekannt: keine Wirkung. Sonst keine neuen Daten.
- Alternativen: (a) eine Zeile zum Wischen (Variante B): ein Tipp weniger, aber hintere Spiele verdeckt, früher schon als Mangel gemeldet; (b) Liste am Spielnamen (Variante C): platzsparend, Auswahl wenig sichtbar; (c) Kacheln als eigene Seite mit eigener Adresse je Spiel: saubere Adressen, aber sieben Seiten zu pflegen und Tests umzubauen; (d) Kacheln als Ansicht in derselben Seite, Kacheln sind die bisherigen Reiter-Knöpfe: kein Umbau der Tests, alle Spiele auf einen Blick.
- Entscheidung: (d), vom Betreiber als Variante A gewählt; der Rest (Anordnung, Maße, Querformat, Hinweis) gilt für jede Variante.
- Design-Review: 11.11.2026, zweiter Agent (Sonnet) vor dem Code nur gegen Spec und Regeln: 13 Befunde (4 hoch, 6 mittel, 3 niedrig), alle eingearbeitet, siehe Ergebnis.

## Kritische Testfälle (Phase 6)
- PS-6: Datenverlust (laufende Partie muss nach Neuladen stehen)
- PS-8: Absturz (blockierter Speicher darf die Seite nicht stoppen)
- PS-1: Kernerlebnis (alle Spiele auf einen Blick, zwei Tipps bis zum Spiel)
- PS-14: Bedienbarkeit (keine Fläche unter 44 px)
- PS-17: Kernerlebnis Querformat (Brett vollständig sichtbar)

## Querschnitt (Phase 4)
- Datenschutz: neu gespeichert wird nur der Name des zuletzt gespielten Spiels im Gerät, nichts verlässt das Gerät; keine Namen in der Seite
- Sicherheit: `zuletzt` wird nur gegen die Liste vorhandener Spiele geprüft und nie als HTML eingesetzt; kein Netz, keine Fremdeingaben
- Barrierefreiheit: Tippflächen 44 × 44 px (AK-8), Kacheln sind Knöpfe mit Text, Bilder der Kacheln `aria-hidden`, Markierung "Weiterspielen" als Text und nicht nur als Farbe, Kopfzeile nennt das Spiel als Überschrift (h1 bleibt je Ansicht genau einmal sichtbar)
- Leistung: Wechsel Auswahl zu Spiel höchstens 300 ms (AK-2, gemessen); keine neue Bibliothek, Seite wächst um höchstens 20 KB (gemessen 14,4 KB, davon rund 4 KB Bilder der Kacheln)

## Nicht Teil dieser Änderung
- 3D-Bretter für Tic Tac Toe, Reversi, Mühle und Mangala (Befund 9) und Regelhilfe für Reversi und Mangala (Befund 10): eigene Specs
- Dame (S-W23) und Tavla (eigener Thread)
- Änderungen an Regeln, Computerstärken oder gespeicherten Partien

## Betroffene Schichten
UI (Kopfzeile, Auswahl, Abschnitte, Maße, Querformat, Hinweis) und Einstellungen (Boundary und Control: Feld `zuletzt`, freigegeben mit der Wahl der Variante A, in der das zuletzt gespielte Spiel markiert ist).

## Risiken und Kosten
Viele bestehende Tests klicken auf `.tabBtn[data-tab=…]`: die Knöpfe bleiben erhalten, alle Testdateien der Brettspiele laufen nach dem Umbau erneut (Lehre aus S-W15). Gegenproben älterer Specs ersetzen Textstellen der Seite: jede geänderte Stelle wird in den Gegenproben nachgezogen. Querformat ändert Brettgrößen: 3D-Ansicht rechnet ihre Größe neu (vorhandener ResizeObserver).

## Ergebnis (11.11.2026, vor dem Gerätetest)
- Design-Review vor dem Code, Befunde und Umsetzung: (1) Brettfelder von Schach, Vier gewinnt und Schachschule fehlten in AK-8, 44 px und 360 px Breite schlossen sich aus: AK-8 nennt jetzt alle Felder, bei 360 px gilt für Felder 38 px; (2) Schachschule hat keine Abschnitte Aktionen und Spielmodus: aus AK-6, AK-7, AK-9 und AK-11 ausgenommen; (3) ältere Tests erwarteten Tic Tac Toe beim Laden und echte Klicks auf Reiter: Tests nachgezogen; (4) Verlauf beim direkten Start und doppelte Einträge: ein Weg für Knopf und Geste, Eintrag der Auswahl wird davor angelegt, Wechsel ersetzt; (5) 3D-Ansicht lief unter der Auswahl weiter: in der Auswahl ist kein Spiel aktiv; (6, 7, 8) Gegenproben und Tests mit geänderten Textstellen (Symbole, Gruppen, Reiterleiste): nachgezogen; (9) Mühle-Übung beim Messen: PS-13 misst mit laufender Übung; (10) fehlende Erwartungen in PS-5, Hauptüberschrift nicht als Kriterium: ergänzt; (11) leere Zeile zum Schach-Computer: wird ohne Text ausgeblendet; (12) Feld `zuletzt` ging beim Speichern anderer Einstellungen verloren: in Laden und Speichern aufgenommen; (13) Abschnitt Ergebnis fehlte: angelegt.
- Unabhängige Prüfung des Codes (zweiter Agent, Sonnet, nur gegen Spec und Regeln), 15 Befunde und 3 Hinweise zu Gegenproben, Umsetzung: (1) Brett im Querformat unter der Adressleiste abgeschnitten: Höhe aus der sichtbaren Höhe; (2) Feldgröße quer nicht festgelegt: 32 px in Spec und Test; (3) Mühle-Übung und Lernsatz quer ungeprüft: PS-26; (4) wirkungslose Regel entfernt; (5) "‹ Spiele" konnte hängen bleiben, wenn der Verlauf nicht antwortet: Zeitgrenze 400 ms, PS-24; (6, 7) Neuladen in der Auswahl öffnete das Spiel, Neuladen ohne Speicher verdoppelte die Auswahl: der Eintrag im Verlauf entscheidet, PS-25; (8) Verlauf ohne Tests: Länge, Vorwärts, Zurück-Taste, gesperrter Verlauf geprüft; (9) Lizenzhinweis hing an einer Schreibweise, die ältere Handys nicht kennen: einfache Schreibweise; (10) leere Seite bei Skriptausfall: Auswahl ist schon ohne Skript sichtbar; (11) Fokus nach dem Wechsel auf dem Namen der Ansicht; (12) Optionen dürfen umbrechen, PS-23 mit 320 px; (13) Schachschule quer ausdrücklich geregelt; (14) Drehen mit räumlichem Brett geprüft; (15) Reihenfolge der Kacheln und Lage der Stufen geprüft. Gegenproben: "Kachel zu klein" und "Lücke" wurden zuerst nicht erkannt, Tests geschärft (Grenze 100 px, leere Abschnitte).
- Messwerte (11.11.2026, Playwright, 412 × 915 und 915 × 412): `aufbau_test.js` 10 von 10 Tests grün, 38 von 38 Gegenproben erkannt; alle älteren Tests der Brettspiele grün (brett, muehle, brett3d, schach_figuren, lernen, schule, optik, teilen); Wechsel von der Auswahl ins Spiel unter 300 ms; `brettspiele/index.html` 260 828 Byte (vorher 246 463, plus 14 365).
- Bilder aus Spielersicht (Auswahl und alle Spiele, hoch und quer) angesehen: Kopfzeile überall an derselben Stelle, Brett und Aktionen ohne Scrollen sichtbar, im Querformat Brett links und Knöpfe rechts; Mangala bleibt quer einspaltig (flaches Brett).
- Nebenbei gefunden: drei ältere Gegenproben (Schachfiguren 1, Lernhilfe 2) griffen schon vor dieser Änderung nicht mehr; berichtigt und in `werkstatt/fehlerliste.md` eingetragen.
- Offen: Gerätetest nach `werkstatt/abnahme/S-W25-brettspiele-aufbau.md`, besonders Querformat mit eingeblendeter Adressleiste.

## Clean Code (Phase 9)
- Clean Code: Prüfergebnis: `TabController` neu geschrieben (rund 110 Zeilen, eine Aufgabe: Ansicht und Verlauf), zwei Methoden in den Einstellungen, Abschnitte über `data-abschnitt` statt Sonderregeln je Spiel; wirkungslose Regel und doppelte Überschriften entfernt; die Seite bleibt bewusst eine einzelne HTML-Datei (260 828 Byte).

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | au_auswahl |
| U-2 | au_kopfzeile |
| U-3 | au_zurueck |
| U-4 | au_zuletzt |
| U-5 | au_anordnung |
| U-6 | au_sichtbar |
| U-7 | au_tippflaechen |
| U-8 | au_hinweis |
| U-9 | au_quer |
| U-10 | au_quer |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W25-brettspiele-aufbau.md
- Aktualisiert: werkstatt/tests/aufbau_test.js
- Aktualisiert: werkstatt/tests/gegenproben_aufbau.py
- Aktualisiert: werkstatt/abnahme/S-W25-brettspiele-aufbau.md
- Aktualisiert: werkstatt/alle_tests.sh
- Aktualisiert: werkstatt/README.md
- Aktualisiert: werkstatt/fehlerliste.md
