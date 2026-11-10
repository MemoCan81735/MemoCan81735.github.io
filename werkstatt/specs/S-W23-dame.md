# S-W23: Dame in den Brettspielen

**Status:** Entwurf (Anforderungen erhoben am 10.11.2026, Freigabe offen)
<!-- Anlass: Betreiber im Projekt-Thread, 10.11.2026: "Brettspiele weitere"; Wahl auf der Auswahlkarte: "Dame" (Vorschläge waren Dame, Vier gewinnt, Tavla, Okey; Vier gewinnt steht schon seit S-W05 in der App). -->

## Anforderungen (Schritt 0)
- A-1: Dame ist ein neuer Reiter in der Brettspiele-App, spielbar gegen den Computer und zu zweit an einem Handy.
- A-2: Regeln werden im Spiel erklärt (Übung beim ersten Start und Regelkarten hinter "?"), wie bei Mühle.
- A-3: Gleiche Optik und Bedienung wie die anderen Spiele: 3D-Brett, Animation, Ton, Konfetti, Zug zurück, Tipp, Stufen Leicht/Mittel/Stark.
- A-4: Zweck: kurze Partien (unter 10 Minuten) am Handy; Zielgruppe: Betreiber und Freunde, auch Anfänger; Plattform: Handy im Browser, keine Fremdserver; keine neuen personenbezogenen Daten.
- A-5: Regeln der türkischen Dame (Dama), gewählt vom Betreiber auf der Auswahlkarte am 10.11.2026.

## Regelvariante (gewählt: türkische Dame)
- *Türkische Dame (Dama): 8 × 8, 16 Steine je Seite auf Reihe 2 und 3, ziehen und schlagen nur vorwärts und seitwärts, Dame zieht beliebig weit gerade (auch zurück) und schlägt aus der Ferne, Schlagzwang mit Mehrfachsprung, Mehrheitsregel (wer mehr Steine schlagen kann, muss das tun), geschlagene Steine verschwinden sofort, keine Kehrtwende um 180 Grad innerhalb eines Zugs, Umwandlung am Zugende.*
- Internationale Dame (10 × 10, Dame fliegt diagonal), englische Dame (8 × 8, diagonal, Dame zieht einen Schritt).
- Begründung der Empfehlung: Türkische Dame ist das Spiel, das der Betreiber vermutlich kennt; die Regeln sind kurz und gut als Übung zu erklären. Nicht gewählt: internationale und englische Dame.

## Anwendungsfall 1: Erster Start (Übung)
- Akteur: Spieler am Handy; Ziel: die Regeln in unter 2 Minuten verstehen; Auslöser: erster Tipp auf Reiter "Dame"
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
- U-8: Ende: Sieg, Niederlage oder Unentschieden (dreifache Stellung oder 40 Halbzüge in Folge ohne Schlag und ohne Zug eines einfachen Steins); Konfetti und Ton nur beim Sieg
- U-9: Zug zurück, Tipp (Lernhilfe) und zu zweit am Handy
- Alternativen: Neuladen mitten in der Partie (Stand bleibt), Doppeltippen, Neustart während der Computer rechnet

## Anwendungsfall 3: Regeln nachschlagen
- U-10: "?" zeigt 3 Karten (Ziehen, Schlagen, Dame); Schließen lässt die Stellung unverändert; Übung wiederholen möglich

## Rechenmodell (verbindlich, Variante nach Freigabe; hier türkische Dame)
- Entity `DameEntity`: Brett 8 × 8 (64 Felder), Zug- und Schlagregeln, Schlagzwang mit Mehrheitsregel, Mehrfachsprung (ein Zug besteht aus der ganzen Sprungfolge, der Spieler tippt sie Feld für Feld), Umwandlung auf der letzten Reihe, Zähler für dreifache Stellung und Zugregel; kein Zufall, keine Zeit.
- Boundary `DameBoundary`: legale Züge, Zielfelder, schlagfähige Steine, Tipp.
- Control: Stufen (Tiefe 1/2/4, Knotengrenze 60 000, Fehlerquote 0,4 / 0,15 / 0 über hineingereichten Zufall), Übung als eigene Entity, Pause bei offener Hilfe.
- Daten: Einstellungen `brettspiele.einstellungen` bleiben Formatversion 1; neues optionales Feld `dameEinfuehrung: true`; laufende Partie und Statistik wie bei den anderen Spielen im Gerätespeicher `dameDB`, Spielstand mit `formatversion: 1`; kaputte oder fehlende Daten fallen auf Standard zurück.
- Optik: 3D-Brett wie Schach, Steine mit eigener Form (Scheibe, Dame mit Krone aus Aufsatz), Kontrast Stein zu Feld gemessen wie in S-W06.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Start: 16 Steine je Seite auf den richtigen Reihen, Weiß beginnt | `da_regeln` |
| AK-2 | Zugregeln: Stein zieht 1 Feld vor oder seitwärts, nie rückwärts; Dame beliebig weit gerade | `da_regeln` |
| AK-3 | Schlagzwang: gibt es einen Schlag, sind alle anderen Züge unzulässig | `da_schlag` |
| AK-4 | Mehrfachsprung wird als ein Zug ausgeführt, jeder übersprungene Stein verschwindet sofort; Mehrheitsregel: nur Folgen mit der höchsten Zahl geschlagener Steine sind zulässig; keine Kehrtwende | `da_schlag` |
| AK-5 | Umwandlung auf der letzten Reihe am Zugende; Dame zieht und schlägt beliebig weit gerade, landet auf jedem freien Feld hinter dem geschlagenen Stein | `da_dame` |
| AK-6 | Ende: kein Stein oder kein legaler Zug verliert; dreifache Stellung und 40 Halbzüge ohne Schlag und ohne Steinzug sind Unentschieden, werden gezählt | `da_ende` |
| AK-7 | Übung: genau 5 Schritte, je Zeitpunkt 1 Tippziel, falsches Feld ändert nichts; nach der Übung gespeichert (`dameEinfuehrung`), kaputte Einstellungen oder blockierter Speicher stoppen nichts | `da_uebung` |
| AK-8 | Markierung: Ringe, Zielfelder, Tippfläche je Feld mindestens 44 × 44 px bei 412 px Breite | `da_markierung` |
| AK-9 | Stärke: stark schlägt Leicht in mindestens 18 von 20 Partien, Mittel schlägt Leicht in mindestens 14 von 20; Rechenzeit im Mittel unter 400 ms, höchstens 1500 ms; gleiche Saat gleiche Züge | `da_staerke` |
| AK-10 | "?" öffnet 3 Karten, Stellung bleibt unverändert, Computer zieht nicht während die Karten offen sind | `da_hilfe` |
| AK-11 | Zug zurück und Speichern: Spielstand lädt wieder, alter oder kaputter Stand fällt auf Neustart zurück | `da_speicher` |
| AK-12 | Bilder aus Spielersicht (412 × 915) je Schritt und Zustand, Steinfarben unterscheidbar (Kontrast Stein zu Feld mindestens 3:1, Weiß zu Schwarz mindestens 4,5:1), keine Skriptfehler | `da_bilder` |

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
| PS-12 | Grenzwert | Stellung zweimal, dann dreimal; 39 und 40 Halbzüge ohne Schlag | AK-6 |
| PS-13 | Normal | Übung 1 bis 5 durchtippen | AK-7 |
| PS-14 | Fehlerfall | Falsches Feld in jeder Übung; Einstellungen kaputt; Speicher blockiert | AK-7 |
| PS-15 | Normal | Markierungen in Ziehen, Schlagzwang, Mehrfachsprung | AK-8 |
| PS-16 | Normal | 20 Partien stark gegen leicht, 20 mittel gegen leicht | AK-9 |
| PS-17 | Wiederholbarkeit | Zwei Läufe mit gleicher Saat: gleiche Züge, gleiche Bilder | AK-9, AK-12 |
| PS-18 | Grenzwert | Rechenzeit im Endspiel mit mehreren Damen | AK-9 |
| PS-19 | Missbrauch | "?" öffnen, während der Computer rechnet; zehnmal schnell tippen; Neustart während der Rechnung | AK-10 |
| PS-20 | Normal | Zug zurück nach Schlag und nach Remis; Neuladen mitten in der Partie | AK-11 |
| PS-21 | Missbrauch | Gespeicherter Stand mit illegaler Stellung oder falscher Formatversion | AK-11 |
| PS-22 | Normal | Bilder aller Übungsschritte und Zustände | AK-12 |

## Gegenproben
- Verstoß (muss rot machen): Rückwärtszug erlaubt, Schlagzwang entfernt, Mehrheitsregel entfernt, Kehrtwende erlaubt, Stein zieht schräg, Remis ohne Zählung, Tippfläche 30 px, Übung ohne Speichern, "?" verändert die Stellung, Computer ignoriert Schlagzwang.
- Fehlalarm (darf nicht anschlagen): PS-6 (zwei gleich lange Schläge, beide erlaubt), PS-8 (Abbiegen im Sprung ist erlaubt), PS-21 (alter gültiger Stand lädt weiter).

## Nicht Teil dieser Änderung
- Dame-Schule mit Aufgaben, andere Regelvarianten, Mehrspieler im Netz.

## Betroffene Schichten
Neue Entity, Boundary, Control und UI für Dame in `brettspiele/index.html`; neues gespeichertes Feld `dameEinfuehrung` und Gerätespeicher `dameDB` (mit der Wahl von Dame und Regelvariante am 10.11.2026 freigegeben; Status wird beim Baubeginn auf "freigegeben" gesetzt, zusammen mit Technischem Design, Kritischen Testfällen und Querschnitt).
