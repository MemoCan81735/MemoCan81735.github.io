# S-W23: Dame in den Brettspielen

**Status:** gebaut am 11.11.2026, 09:50 (freigegeben am 10.11.2026, 21:40)
<!-- Anlass: Betreiber im Projekt-Thread, 10.11.2026: "Brettspiele weitere"; Wahl auf der Auswahlkarte: "Dame" (Vorschläge waren Dame, Vier gewinnt, Tavla, Okey; Vier gewinnt steht schon seit S-W05 in der App). -->

## Anforderungen (Schritt 0)
- A-1: Dame ist ein neues Spiel in der Brettspiele-App (eigene Kachel in der Auswahl, Aufbau nach S-W25), spielbar gegen den Computer und zu zweit an einem Handy.
- A-2: Regeln werden im Spiel erklärt (Übung beim ersten Start und Regelkarten hinter "?"), wie bei Mühle.
- A-3: Gleiche Optik und Bedienung wie die anderen Spiele: 3D-Brett, Animation, Ton, Konfetti, Zug zurück, Tipp, Stufen Leicht/Mittel/Stark.
- A-4: Zweck: kurze Partien (unter 10 Minuten) am Handy; Zielgruppe: Betreiber und Freunde, auch Anfänger; Plattform: Handy im Browser, keine Fremdserver; keine neuen personenbezogenen Daten.
- A-5: Regeln der türkischen Dame (Dama), gewählt vom Betreiber auf der Auswahlkarte am 10.11.2026.

## Regelvariante (gewählt: türkische Dame)
- *Türkische Dame (Dama): 8 × 8, 16 Steine je Seite auf Reihe 2 und 3, ziehen und schlagen nur vorwärts und seitwärts, Dame zieht beliebig weit gerade (auch zurück) und schlägt aus der Ferne, Schlagzwang mit Mehrfachsprung, Mehrheitsregel (wer mehr Steine schlagen kann, muss das tun), geschlagene Steine verschwinden sofort, keine Kehrtwende um 180 Grad innerhalb eines Zugs, Umwandlung am Zugende.*
- Festlegungen für die Fälle, die die Kurzregel offen lässt: Felder 0 bis 63, Feld 0 oben links, Weiß steht unten (Felder 40 bis 55, also zweite und dritte Reihe von unten), Schwarz oben (Felder 8 bis 23); Weiß zieht nach oben, Schwarz nach unten; das Brett wird zu zweit nicht gedreht; Weiß beginnt, der Computer spielt Schwarz. Eine Schlagfolge muss zu Ende gespielt werden. In der Mehrheitsregel zählt jede geschlagene Figur 1, auch eine Dame; es gibt keinen Vorrang für das Schlagen mit der Dame. Die Dame darf nur auf den Feldern hinter dem geschlagenen Stein landen, von denen aus die längste Folge weitergeht. Zwei Steine direkt hintereinander oder ein eigener Stein im Weg sperren den Schlag. Weil geschlagene Steine sofort verschwinden, darf die Folge über das frei gewordene Feld führen; kein Stein wird zweimal geschlagen. Ein Stein, der im Schlag die letzte Reihe erreicht und seitwärts weiterschlagen kann, schlägt als Stein weiter und wird erst am Zugende Dame. Unentschieden (Festlegung für das Spiel am Handy, nicht Teil der überlieferten Regel): dreimal dieselbe Stellung oder 60 Halbzüge ohne Schlag und ohne Schritt eines Steins nach vorn.
- Internationale Dame (10 × 10, Dame fliegt diagonal), englische Dame (8 × 8, diagonal, Dame zieht einen Schritt).
- Begründung der Empfehlung: Türkische Dame ist das Spiel, das der Betreiber vermutlich kennt; die Regeln sind kurz und gut als Übung zu erklären. Nicht gewählt: internationale und englische Dame.

## Anwendungsfall 1: Erster Start (Übung)
- Akteur: Spieler am Handy; Ziel: die Regeln in unter 2 Minuten verstehen; Auslöser: erster Tipp auf die Kachel "Dame"
- U-1: Übung "1 von 5: Ziehen" mit leuchtendem Stein und Zielfeld
- U-2: Schlagen mit Pflicht (Zielfeld leuchtet, andere Züge sind gesperrt, Hinweis "Schlagen ist Pflicht")
- U-3: Mehrfachsprung in einem Zug
- U-4: Dame werden (Schritt 4) und als Dame aus der Ferne schlagen (Schritt 5)
- Alternativen: Überspringen, falsches Feld tippen (Hinweis), Neuladen (Übung beginnt neu), Speicher blockiert (Spiel läuft)
- Erfolgsmaß: 5 Schritte, zu jeder Zeit genau ein leuchtendes Tippziel

## Anwendungsfall 2: Partie gegen den Computer
- U-5: Weiß (Spieler) beginnt; ziehbare Steine tragen Ring, Zielfelder leuchten nach Antippen, Statuszeile in Klartext
- U-6: bei Schlagzwang tragen nur schlagfähige Steine den Ring; Hinweis in der Statuszeile
- U-7: Computer zieht in gewählter Stufe, Rechenzeit stark unter 1,5 s je Zug (im Worker)
- U-8: Ende: Sieg, Niederlage oder Unentschieden (dreifache Stellung oder 60 Halbzüge in Folge ohne Schlag und ohne Schritt eines Steins nach vorn); Konfetti und Ton nur beim Sieg
- U-9: Zug zurück, Tipp (Lernhilfe) und zu zweit am Handy
- Alternativen: Neuladen mitten in der Partie (Stand bleibt), Doppeltippen, Neustart während der Computer rechnet

## Anwendungsfall 3: Regeln nachschlagen
- U-10: "?" zeigt 3 Karten (Ziehen, Schlagen, Dame); Schließen lässt die Stellung unverändert; Übung wiederholen möglich

## Rechenmodell (verbindlich, Variante nach Freigabe; hier türkische Dame)
- Entity `DameEntity`: Brett 8 × 8 (64 Felder), Zug- und Schlagregeln, Schlagzwang mit Mehrheitsregel, Mehrfachsprung (ein Zug besteht aus der ganzen Sprungfolge, der Spieler tippt sie Feld für Feld), Umwandlung auf der letzten Reihe, Zähler für dreifache Stellung und Zugregel; kein Zufall, keine Zeit.
- Boundary `DameBoundary`: legale Züge, Zielfelder, schlagfähige Steine, Tipp.
- Control: Stufen (Tiefe 1/2/4, Knotengrenze 60 000; das Ergebnis des Workers wird gegen die zulässigen Züge geprüft, sonst Zufallszug, Fehlerquote 0,4 / 0,15 / 0 über hineingereichten Zufall), Übung als eigene Entity, Pause bei offener Hilfe.
- Daten: Einstellungen `brettspiele.einstellungen` bleiben Formatversion 1; neues optionales Feld `dameEinfuehrung: true`; laufende Partie und Statistik wie bei den anderen Spielen im Gerätespeicher `dameDB`, Spielstand mit `formatversion: 1`; kaputte oder fehlende Daten fallen auf Standard zurück.
- Optik: 3D-Brett wie Schach, Steine mit eigener Form (Scheibe, Dame mit Krone aus Aufsatz), Kontrast Stein zu Feld gemessen wie in S-W06.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Start: 16 weiße Steine auf den Feldern 40 bis 55, 16 schwarze auf 8 bis 23, Weiß beginnt (U-5) | `da_regeln` |
| AK-2 | Zugregeln: Stein zieht 1 Feld vor oder seitwärts, nie rückwärts, nie schräg; Dame beliebig weit gerade, auch zurück; Tipp auf leeres Feld, fremden Stein oder unzulässiges Feld ändert nichts (U-5) | `da_regeln` |
| AK-3 | Schlagzwang: gibt es einen Schlag, sind alle anderen Züge unzulässig, auch für den Computer (U-2, U-6) | `da_schlag` |
| AK-4 | Mehrfachsprung wird als ein Zug ausgeführt, jeder übersprungene Stein verschwindet sofort; Mehrheitsregel: nur Folgen mit der höchsten Zahl geschlagener Steine sind zulässig, eine Dame zählt dabei 1; die Folge muss zu Ende gespielt werden; keine Kehrtwende; die Folge darf über frei gewordene Felder führen, kein Stein wird zweimal geschlagen; zwei Steine hintereinander sperren (U-3, U-6) | `da_schlag` |
| AK-5 | Umwandlung auf der letzten Reihe am Zugende; Dame zieht und schlägt beliebig weit gerade, landet auf jedem freien Feld hinter dem geschlagenen Stein, von dem aus die längste Folge weitergeht; ein Stein, der im Schlag die letzte Reihe erreicht und weiterschlagen kann, bleibt bis zum Zugende Stein (U-4) | `da_dame` |
| AK-6 | Ende: kein Stein oder kein legaler Zug verliert; dreifache Stellung (mit gleichem Spieler am Zug) und 60 Halbzüge ohne Schlag und ohne Schritt eines Steins nach vorn sind Unentschieden und werden in der Statistik gezählt; wer Steine hat, aber nicht ziehen kann, verliert; Endspiele wie Dame gegen Stein werden nicht gesondert geregelt (U-8) | `da_ende` |
| AK-7 | Übung (U-1 bis U-4): genau 5 Schritte, je Zeitpunkt 1 Tippziel (außer in der kurzen Lobpause nach einem gelösten Schritt, dann 0), falsches Feld ändert nichts; nach der Übung gespeichert (`dameEinfuehrung`), kaputte Einstellungen oder blockierter Speicher stoppen nichts; "Überspringen" speichert ebenfalls; der Merker überlebt das Speichern anderer Einstellungen (Stufe, Ton, zuletzt gespieltes Spiel) | `da_uebung` |
| AK-8 | Markierung: Ringe, Zielfelder, Tippfläche je Feld mindestens 44 × 44 px bei 412 px Breite; Dame erfüllt die gemeinsamen Regeln aus S-W25 (Kachel mit Bild, Abschnitte in fester Reihenfolge, Brett und Aktionen ohne Scrollen, Querformat mit Brett links) und läuft in `aufbau_test.js` mit; Zeile Optionen enthält genau 2D oder 3D, "?" und Lernhilfe; im räumlichen Brett trifft ein Tipp das Feld (U-5, U-6) | `da_markierung` |
| AK-9 | Stärke (U-7): Stark gewinnt gegen Leicht mindestens 18 von 20 Partien, Mittel gegen Leicht mindestens 14 von 20 (Farben wechseln je Partie, Unentschieden zählt als nicht gewonnen, Abbruch nach 200 Halbzügen als Unentschieden, Zufall je Partie aus fester Saat); Rechenzeit der Stufe Stark im Worker im Mittel unter 400 ms, höchstens 1500 ms (Playwright am Prüfrechner); gleiche Saat gleiche Züge; der Worker rechnet selbst (kein Rückfall auf die Seite) und liefert für 10 feste Stellungen dieselben Züge wie die Seite | `da_staerke` |
| AK-10 | (U-10) "?" öffnet 3 Karten, Stellung bleibt unverändert, Computer zieht nicht während die Karten offen sind | `da_hilfe` |
| AK-11 | (U-9) Zug zurück nimmt einen ganzen Zug zurück (alle geschlagenen Steine kommen wieder), gilt nur in der laufenden Sitzung und ist nach Partieende aus; mitten in der Sprungfolge verfällt nur die Auswahl; Spielstand lädt nach Neuladen wieder; kaputter Stand (falsche Version, Länge, Werte, mehr als 16 Steine, Stein auf der Umwandlungsreihe, beendete Partie) führt zu Neustart ohne Skriptfehler | `da_speicher` |
| AK-12 | (U-1 bis U-10) Bilder aus Spielersicht (412 × 915) je Schritt und Zustand, Steinfarben unterscheidbar (Kontrast Stein zu Feld mindestens 3:1, Weiß zu Schwarz mindestens 4,5:1), keine Skriptfehler; sichtbare Texte ohne Fachwörter (kein "Mehrheitsregel", "Kehrtwende", "Halbzug"); Steine und Kachel als eigene Zeichnung, Dame an der Krone erkennbar | `da_bilder` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Startaufstellung und erste Züge beider Seiten | AK-1, AK-2 |
| PS-2 | Grenzwert | Stein am Rand und auf der letzten Reihe: keine Züge ins Leere | AK-2 |
| PS-3 | Fehlerfall | Rückwärtszug eines Steins wird abgelehnt | AK-2 |
| PS-4 | Normal | Einfacher Schlag mit Pflicht | AK-3 |
| PS-5 | Missbrauch | Nicht schlagen, obwohl möglich: Zug abgelehnt | AK-3 |
| PS-6 | Grenzwert | Zwei Schläge mit gleicher Zahl: beide erlaubt; Schlag mit 1 Stein neben Folge mit 2 Steinen: nur die längere erlaubt | AK-3 |
| PS-7 | Normal | Mehrfachsprung über 3 Steine, jeder Stein verschwindet sofort | AK-4 |
| PS-8 | Grenzwert | Dame darf im Zug nicht um 180 Grad wenden; abbiegen ist erlaubt | AK-4 |
| PS-9 | Normal | Umwandlung und Damenzug | AK-5 |
| PS-10 | Grenzwert | Dame schlägt über weite Strecke, Stein dahinter blockiert | AK-5 |
| PS-11 | Normal | Letzter Stein geschlagen: Partie endet | AK-6 |
| PS-12 | Grenzwert | Stellung zweimal, dann dreimal; 59 und 60 Halbzüge ohne Schlag; Zähler stimmt nach Zug zurück und nach Neuladen | AK-6 |
| PS-13 | Normal | Übung 1 bis 5 durchtippen | AK-7 |
| PS-14 | Fehlerfall | Falsches Feld in jeder Übung; Einstellungen kaputt; Speicher blockiert | AK-7 |
| PS-15 | Normal | Markierungen in Ziehen, Schlagzwang, Mehrfachsprung | AK-8 |
| PS-16 | Normal | 20 Partien stark gegen leicht, 20 mittel gegen leicht | AK-9 |
| PS-17 | Wiederholbarkeit | Zwei Läufe mit gleicher Saat: gleiche Züge, gleiche Bilder | AK-9, AK-12 |
| PS-18 | Grenzwert | Rechenzeit im Endspiel mit mehreren Damen | AK-9 |
| PS-19 | Missbrauch | "?" öffnen, während der Computer rechnet; zehnmal schnell tippen; Neustart während der Rechnung | AK-10 |
| PS-20 | Normal | Zug zurück nach Mehrfachsprung (alle Steine wieder da); nach Partieende ist der Knopf aus; Neuladen mitten in der Partie; Zug zurück mitten in der Sprungfolge | AK-11 |
| PS-21 | Missbrauch | Gespeicherter Stand mit illegaler Stellung oder falscher Formatversion | AK-11 |
| PS-22 | Normal | Bilder aller Übungsschritte und Zustände | AK-12 |
| PS-23 | Fehlerfall | Worker-Quelltext allein ausgeführt liefert für 10 Stellungen dieselben Züge; Rückfall auf die Seite wird gezählt und ist 0 | AK-9 |
| PS-24 | Grenzwert | Stein erreicht im Schlag die letzte Reihe und schlägt seitwärts weiter (bleibt Stein, wird am Ende Dame); ohne Fortsetzung wird er Dame; Umwandlung durch einfachen Zug | AK-5 |
| PS-25 | Grenzwert | Dame mit zwei Landefeldern, nur von einem geht es weiter: nur dieses ist erlaubt | AK-5 |
| PS-26 | Grenzwert | Zwei gleich lange Folgen, eine schlägt eine Dame: beide erlaubt; Folge kann nicht vorzeitig beendet werden | AK-4 |
| PS-27 | Grenzwert | Folge über ein eben frei gewordenes Feld; kein Stein zweimal; zwei Steine hintereinander und eigener Stein sperren | AK-4 |
| PS-28 | Fehlerfall | Tipp auf leeres Feld, fremden Stein, unzulässiges Feld mitten im Pfad, Doppeltipp auf dasselbe Feld | AK-2 |
| PS-29 | Grenzwert | Spieler hat Steine, aber keinen Zug: verliert | AK-6 |
| PS-30 | Missbrauch | Computer liefert einen unzulässigen Zug: wird verworfen, zulässiger Zug folgt | AK-3 |
| PS-31 | Missbrauch | "Überspringen" zehnmal schnell; Merker überlebt Wechsel von Stufe und Ton | AK-7 |
| PS-32 | Wiederholbarkeit | Zug zurück und derselbe Zug erneut ergibt dieselbe Stellung und denselben Spielstand | AK-11 |
| PS-34 | Grenzwert | Zwei Steine pendeln seitwärts: beim dritten Mal derselben Stellung Unentschieden; 60 Halbzüge nur mit Seitwärtszügen und Damenzügen: Unentschieden | AK-6 |
| PS-35 | Grenzwert | Rechengrenze des Computers erreicht: gewählt wird ein vollständig bewerteter Zug; Stark gewinnt gegen Mittel öfter, als es verliert | AK-9 |
| PS-33 | Normal | Dame in den gemeinsamen Prüfungen des Aufbaus (Kachel, Abschnitte, Sichtbarkeit, Tippflächen, Querformat, auch mit laufender Übung) | AK-8 |

## Gegenproben
- Verstoß (muss rot machen): Umwandlung mitten im Sprung, Landefeld ohne Fortsetzung erlaubt, Dame zählt in der Mehrheit doppelt, Worker-Funktion greift auf die Klasse zu, kaputter Stand wird geladen, Merker geht beim Speichern verloren, Rückwärtszug erlaubt, Schlagzwang entfernt, Mehrheitsregel entfernt, Kehrtwende erlaubt, Stein zieht schräg, Remis ohne Zählung, Tippfläche 30 px, Übung ohne Speichern, "?" verändert die Stellung, Computer ignoriert Schlagzwang.
- Fehlalarm (darf nicht anschlagen): PS-6 (zwei gleich lange Schläge, beide erlaubt), PS-8 (Abbiegen im Sprung ist erlaubt), PS-21 (alter gültiger Stand lädt weiter), Stein zieht seitwärts (erlaubt), Dame zieht zurück (erlaubt).

## Technisches Design (Phase 3)
- Schnittstellen: `DameEntity` mit der reinen, in sich geschlossenen Funktion `DameEntity.dameZuege(cells, spieler)` (alle Konstanten im Rumpf, kein Verweis auf Klassen oder `this`; liefert alle zulässigen Züge als `{ von, pfad, schlaege }`, Schlagzwang und Mehrheitsregel schon angewandt) sowie `zieh(zug)`, `toJSON()`, `loadFromJSON()`, `clone()`, `pruefe(daten)`; `DameBoundary` (`getZuege()`, `ziehe(zug)`, `getSuchStand()` nur mit `cells` und Spieler); `DameControl` (`handleFeldClick(i)` wählt Stein und tippt den Pfad Feld für Feld; Auswahl und Teilpfad liegen nur im Arbeitsspeicher und verfallen bei Neuladen, Zug zurück, Neustart und Moduswechsel; `ansicht(lernen)` liefert das Zwischenbrett ohne die schon geschlagenen Steine; `performAiAction()` mit Zähler `_partie` wie bei Mühle; `setPause(an)`; `restoreGame()` prüft den Stand vor dem Laden); `DameUebungControl` (5 Schritte wie Mühle); `DameUI` (`handleSquareClick(i)` für das räumliche Brett); `AIEngines.dameZuege = DameEntity.dameZuege` nach der Klasse (dieselbe Funktion, kein zweiter Regelcode), `AIEngines.dame(stand, spieler, tiefe, knotenMax)`; beide in die Liste des Workers; `Ansicht3D` bekommt die Art `dame` mit eigenem Aufbau (Brett wie Schach, Steine als Scheiben, Dame mit Krone), eigener Aktualisierung, Markierung und Treffererkennung, dazu CSS `.brett3d.dame` hoch und quer; `EinstellungenBoundary` und `EinstellungenControl` um `dameEinfuehrung` ergänzt (Laden, Speichern, `dameEinfuehrung()`, `setzeDameEinfuehrung()`); Kachel an letzter Stelle, `GameUI.NAMEN`, `GameUI.ANSICHT_3D`, `wireGame({ dbName: 'dameDB' })`.
- Anpassung bestehender Tests: `aufbau_test.js` (`BRETTER`, `ALLE`, Reihenfolge und Namen der Kacheln, erwartete Optionen, `GESEHEN` mit `dameEinfuehrung`, `warte3d`, Übung hoch und quer), `seite_handy.js` (Zahl der Kacheln 8, Liste der Spiele), `brett_test.js` (Listen für Stufen, Zug zurück, Klang), Gegenproben mit Textankern.
- Datenformat: Spielstand in `dameDB` mit `formatversion: 1`: `cells` (64 Einträge: `null`, `'W'`, `'B'`, `'WD'`, `'BD'`), `currentPlayer`, `finished`, `winner` (`null`, `'W'`, `'B'`, `'Draw'`), `ruhe` (Halbzüge ohne Schlag und ohne Schritt eines Steins nach vorn, 0 bis 60), `stellungen` (Zähler je Stellung mit Spieler am Zug; wird nur bei Schlag und bei einem Schritt eines Steins nach vorn geleert, weil Seitwärtszüge umkehrbar sind). Zug zurück wird nicht gespeichert. Einstellungen: optionales Feld `dameEinfuehrung: true`. Ungültiger Stand (siehe AK-11): Neustart und gespeicherter Stand wird gelöscht.
- Alternativen: (a) Regeln im Worker ein zweites Mal schreiben: schneller getippt, aber zwei Stellen für dieselbe Regel (Fehlerquelle wie bei Mühle vor S-W15); (b) Sprungfolge automatisch ausführen, sobald der Stein gewählt ist: weniger Tipps, aber bei mehreren gleich langen Folgen nicht eindeutig; (c) Pfad Feld für Feld tippen, bei eindeutiger Fortsetzung leuchtet nur das nächste Feld: eindeutig und lehrreich.
- Entscheidung: gemeinsame reine Funktion für Entity und Worker, Pfad Feld für Feld (c); 3D über die vorhandene Ansicht, 2D als Raster mit Feldern ab 44 px.
- Design-Review: 11.11.2026, zweiter Agent (Sonnet) vor dem Code nur gegen Spec, Regeln und vorhandenen Code: 20 Befunde (10 hoch, 6 mittel, 4 niedrig), alle eingearbeitet: geteilte Funktion muss in sich geschlossen sein und der Worker wird eigens geprüft (PS-23); Zug zurück nicht im Spielstand; Prüfung des Stands vor dem Laden; Regelfälle Umwandlung im Schlag, Landefeld der Dame, frei gewordene Felder, Folge zu Ende spielen (PS-24 bis PS-27); Blockade (PS-29); Unentschieden erst nach 60 statt 40 Halbzügen, damit Endspiele mit Damen gewinnbar bleiben; Felder und Richtung festgelegt; Liste der anzupassenden Tests; eigener Aufbau im räumlichen Brett; Merker in den Einstellungen; Messung der Stärke genau beschrieben; sichtbare Texte ohne Fachwörter.

## Kritische Testfälle (Phase 6)
- PS-6: Regelfehler (Mehrheitsregel ist die häufigste Fehlerquelle der türkischen Dame)
- PS-7: Kernerlebnis (Mehrfachsprung, Steine verschwinden sofort)
- PS-10: Regelfehler (Fernschlag der Dame)
- PS-21: Datenverlust oder Absturz (kaputter Spielstand)
- PS-19: Absturz (Hilfe und Neustart, während der Computer rechnet)

## Querschnitt (Phase 4)
- Datenschutz: Spielstand, Statistik und der Merker für die Übung bleiben im Gerät; nichts verlässt das Gerät, keine Namen
- Sicherheit: gespeicherter Stand wird vor dem Laden geprüft (Länge, Werte, Zahl der Steine) und nie als HTML eingesetzt; kein Netz
- Barrierefreiheit: Felder ab 44 × 44 px, Steine unterscheiden sich in Helligkeit und Form (Dame mit Krone), Statuszeile in Klartext, Markierungen nicht nur über Farbe (Ring und Punkt)
- Leistung: Computerzug im Mittel unter 400 ms, höchstens 1500 ms (AK-9, gemessen); Seite wächst um höchstens 45 KB, keine neue Bibliothek

## Nicht Teil dieser Änderung
- Dame-Schule mit Aufgaben, andere Regelvarianten, Mehrspieler im Netz.

## Betroffene Schichten
Neue Entity, Boundary, Control und UI für Dame in `brettspiele/index.html`; neues gespeichertes Feld `dameEinfuehrung` und Gerätespeicher `dameDB` (mit der Wahl von Dame und Regelvariante am 10.11.2026 freigegeben).

## Ergebnis (11.11.2026, vor dem Gerätetest)
- Messwerte (`da_staerke`, Desktop-Chromium, Software-GL): Stark gegen Leicht 20 von 20 Siegen (0 Niederlagen), Mittel gegen Leicht 17 von 20, Stark gegen Mittel 18 von 20 Siegen (0 Niederlagen); Rechenzeit Stark im Worker im Mittel 7 ms, höchstens 63 ms bei 193 Stellungen, Endspiele mit Damen und die Stellung mit je 4 Damen und vielen Schlagwegen 1 bis 54 ms (Grenze 1500 ms); Seite wächst von 276 907 auf 311 200 Byte (+34 293 Byte, Grenze 45 KB).
- Abweichung: Im räumlichen Brett gibt es keine Sprechblase "Hier tippen" (dort leuchtet das grüne Zielfeld, die Statuszeile nennt das Ziel); die Blase steht im flachen Brett. Die Übung läuft in beiden Ansichten über dieselbe Control.
- Gegenproben: `gegenproben_dame.py` mit 42 Verstößen (darunter 5 "zu streng"-Proben: Abbiegen, Seitwärtszug, Dame nur vorwärts, nur ein Schlagweg, gültiger Stand verworfen) und 3 Fehlalarm-Proben, alle wie erwartet; drei Mühle-Gegenproben mussten eindeutige Textanker bekommen, weil Dame dieselben Textstellen nutzt (siehe Fehlerliste).
- Bestehende Regeln: kein Fehler in den vorgebauten Regeln gefunden.
- Code-Review (unabhängiger zweiter Agent, nur gegen Spec und Regeln): 20 Befunde (1 hoch, 4 mittel, 15 niedrig), alle eingearbeitet:
  - hoch: Lücke beim Unentschieden, seitwärts pendelnde Steine setzten die Zähler zurück und die Partie konnte nie enden; jetzt setzt nur Schlag oder ein Schritt nach vorn zurück (PS-34).
  - mittel 1: Rechengrenze nahm einen unvollständig bewerteten Zug; jetzt zählt an der Wurzel nur ein vollständig bewerteter Zug (Abbruchmarke, PS-35).
  - mittel 2: Tipp mitten in der Sprungfolge zeigte den Anfang statt des nächsten Felds; jetzt setzt er am bisherigen Pfad an.
  - mittel 3: Reihenfolge der Ansicht im Zwischenbrett (Stein auf halbem Weg); jetzt Pfad vor Brett.
  - mittel 4: Gegenproben zeigten auf geänderte Textstellen oder waren zu lasch; Anker erneuert, fünf "zu streng"-Proben ergänzt.
  - niedrig: Hinweis "Schlagen ist Pflicht." bei gesperrtem Stein ohne Lernhilfe; Übung ohne Speicher wirft keinen Fehler mehr; Lobpause in AK-7 benannt; PS-17 vergleicht Bilder zweier getrennter Läufe; PS-33 misst statt Text zu suchen; `warte3d` verschluckt bei Dame keinen 3D-Fehler; Teilen als vierter Knopf nach dem Ende, bricht um statt überzulaufen; Hilfe mit `aria-modal`, Fokus und Esc; Text "60 Züge ohne Schlag und ohne Schritt nach vorn" in Karte und Endtext; Rechenzeit auch mit schwerer Stellung geprüft; 3D-Test zählt Objekte, vergleicht Markierungen mit der Ansicht, Wechsel 2D/3D mitten im Pfad, kein Wachstum nach 40 Zügen, kein WebGL spielbar in 2D; Tipp-Ring orange statt blau wie Ziehbar-Ring; doppelt gebaute Ringgeometrie entfernt; Gegenprobe "Computer: unzulässige Antwort ungeprüft" umbenannt; echte Fehlalarm-Proben.

## Clean Code (Phase 9)
- Clean Code: Prüfergebnis: Dame teilt die Regelfunktion mit dem Worker (keine zweite Regelstelle), `DameEntity.clone()` entfernt, doppelte Ringgeometrie entfernt, Übung als eigene Control; die Seite bleibt bewusst eine Datei und wuchs auf 311 200 Byte (+34 293 Byte, unter der Grenze von 45 KB)

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | da_uebung |
| U-2 | da_schlag |
| U-3 | da_schlag |
| U-4 | da_dame |
| U-5 | da_regeln |
| U-6 | da_markierung |
| U-7 | da_staerke |
| U-8 | da_ende |
| U-9 | da_speicher |
| U-10 | da_hilfe |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W23-dame.md
- Aktualisiert: werkstatt/tests/dame_test.js
- Aktualisiert: werkstatt/tests/gegenproben_dame.py
- Aktualisiert: werkstatt/tests/gegenproben_muehle.py
- Aktualisiert: werkstatt/tests/aufbau_test.js
- Aktualisiert: werkstatt/tests/brett_test.js
- Aktualisiert: werkstatt/tests/schule_test.js
- Aktualisiert: werkstatt/seite_handy.js
- Aktualisiert: werkstatt/abnahme/S-W23-dame.md
- Aktualisiert: werkstatt/alle_tests.sh
- Aktualisiert: werkstatt/README.md
- Aktualisiert: werkstatt/fehlerliste.md
