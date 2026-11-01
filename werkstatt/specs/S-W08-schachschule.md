# S-W08: Schachschule (Figuren-Schule, Aufgaben, Computerzug erklärt)

**Status:** gebaut, freigegeben am 01.11.2026, 16:55 (Speichern des Fortschritts: Freigabe steht aus, bis dahin ausgeschaltet)
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Ja, und Figuren schule. Baue alles ein was relativ einfach zu implementieren ist"
     (Antwort auf das Angebot "Übungsaufgaben (zum Beispiel Matt in 1) oder eine Figuren-Schule"). Speichern des Fortschritts: eigene Frage, siehe unten. -->

## Anlass
Wunsch des Betreibers: "Wie kann ich Schach lernen", dann "Ja, und Figuren schule. Baue alles ein was relativ einfach zu implementieren ist".

## Ziel
Ein neuer Reiter **Schachschule** mit drei Teilen, dazu eine kleine Ergänzung im Reiter Schach:
1. **Figuren-Schule:** sechs Lektionen (Turm, Läufer, Dame, Springer, König, Bauer). Je Lektion ein kurzer Text, wie die Figur zieht,
   und ein Brett mit nur dieser Figur und Sternen. Antippen der Figur zeigt grüne Punkte auf allen erlaubten Feldern. Ziel: alle Sterne einsammeln.
2. **Matt in 1:** 12 Stellungen. Gesucht ist der Zug, der sofort Matt setzt. Jeder mattsetzende Zug zählt.
3. **Figur gewinnen:** 7 Stellungen (freie Figur schlagen, Gabel, Spieß). Gesucht ist ein Zug aus der Lösungsliste.
4. **Computerzug erklärt:** Im Reiter Schach steht mit eingeschalteter Lernhilfe nach jedem Computerzug ein Satz wie
   "Computer: Springer g8 nach f6: Bringt den Springer ins Spiel (Entwicklung)." (gleiche Gründe wie der Tipp, S-W07).

## Rechenmodell (verbindlich)
- **Züge in der Figuren-Schule:** Turm, Läufer, Dame gleiten bis zum Rand oder bis zu einem Stern (der Stern wird eingesammelt, dahinter geht es nicht weiter).
  Springer springt im L (Sterne blockieren nicht). König ein Feld in jede Richtung. Bauer: ein Feld vor, von der 2. Reihe auch zwei (nur auf freie Felder);
  schräg vorwärts nur auf einen Stern ("schlagen"). Kein Gegner, kein Schach.
- **Bestwert** einer Lektion = kleinste Zahl an Zügen, um alle Sterne zu sammeln (Breitensuche über Feld und eingesammelte Sterne).
  Nach dem letzten Stern: "Geschafft in N Zügen" und, wenn N größer als der Bestwert ist, "Bestwert: M".
- **Aufgaben:** Brett und Regeln wie im Schachspiel (chess.js). Falscher, aber erlaubter Zug: "Noch nicht. Versuch es nochmal." und die Stellung steht wieder am Anfang.
  "Tipp" markiert die Figur, die ziehen muss. "Lösung" zeigt den Zug (Start und Ziel markiert), die Aufgabe zählt dann nicht als gelöst.
  Am Zug ist die Seite aus der Stellung (meist Weiß, je eine Aufgabe für Schwarz); die Überschrift sagt, wer zieht.
- **Fortschritt:** gelöste Lektionen und Aufgaben bekommen einen Haken in der Übersicht. Wurde bei einer Aufgabe die Lösung gezeigt, zählt sie bis zum Neuladen nicht mehr (auch nach "Nochmal").
  Speichern erst nach Freigabe durch den Betreiber (Frage am 01.11.2026 gestellt, Schalter `SchuleBoundary.SPEICHERN`, bis dahin aus, Haken gelten bis zum Neuladen). Dann
  in `brettspiele.schule` als `{"formatversion":1,"geloest":["L1","M3",...]}` (nur auf dem Gerät). Unbekannte Kennungen werden ignoriert, kaputte Daten → leer.
- **Schichten:** `SchuleEntity` (Lektion: Feld, Sterne, Züge, Zugerzeugung, Bestwert; rein, ohne DOM), `SchuleBoundary` (Speicher, Aufgabenprüfung mit chess.js),
  `SchuleControl` (Inhalte, Ablauf, Tipp, Lösung), `SchuleUI` (Reiter, Texte, Brett). Keine Zeit, kein Zufall.
- **Computerzug:** `ChessControl.performAiMove` merkt sich die Gründe des Zugs (aus der Stellung vor dem Zug), nur bei eingeschalteter Lernhilfe.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Reiter Schachschule vorhanden; Übersicht zeigt 6 Lektionen, 12 Matt-Aufgaben, 7 Gewinn-Aufgaben | `s_uebersicht` |
| AK-2 | Zugerzeugung der Figuren-Schule stimmt für jede Figur (Zahl der Zielfelder in festen Stellungen) | `s_zuege` |
| AK-3 | Jede Lektion ist lösbar; der Bestwert stimmt mit einer gespielten kürzesten Lösung überein; Meldung "Geschafft" mit Zugzahl | `s_lektion` |
| AK-4 | Alle 12 Matt-Aufgaben haben mindestens einen Mattzug; jeder Mattzug wird angenommen, ein anderer erlaubter Zug abgelehnt und zurückgestellt | `s_matt` |
| AK-5 | Alle 7 Gewinn-Aufgaben: jede Lösung gewinnt bei bester Abwehr mindestens 2 Punkte (Suche 4 Halbzüge), kein anderer Zug schafft das; Lösung angenommen, anderer Zug abgelehnt | `s_gewinn` |
| AK-6 | Tipp markiert die richtige Figur; Lösung zeigt Start und Ziel und zählt nicht als gelöst | `s_tipp_loesung` |
| AK-7 | Fortschritt: Haken nach Lösen; nach Neuladen noch da (wenn Speichern freigegeben); kaputte Daten und unbekannte Kennungen → kein Fehler | `s_fortschritt` |
| AK-8 | Nach einem Computerzug steht der Satz "Computer: …" mit Figur und Feldern; mit Lernhilfe aus kein Satz | `s_computer_satz` |
| AK-9 | Handy 412 px: kein Querscroll, 7 Reiter sichtbar, Felder ≥ 44 px, keine Skriptfehler | `s_handy` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Reiter öffnen: 25 Einträge in drei Gruppen | AK-1 |
| PS-2 | Normal | Turm auf d4, leeres Brett: 14 Ziele; Läufer d4: 13; Dame d4: 27; Springer d4: 8; König d4: 8; Bauer e2: 2 | AK-2 |
| PS-3 | Grenzwert | Ecken und Rand: Springer a1: 2; König a1: 3; Turm a1 mit Stern a3: a2, a3 und Reihe 1 (9 Ziele) | AK-2 |
| PS-4 | Grenzwert | Bauer e2 mit Stern e3: kein Zug nach vorn; Stern d3: schräg erlaubt; Bauer e3: nur ein Feld | AK-2 |
| PS-5 | Normal | Jede Lektion mit der kürzesten Lösung aus der Breitensuche spielen: "Geschafft in N Zügen", N = Bestwert | AK-3 |
| PS-6 | Fehlerfall | Antippen eines Felds, das kein Ziel ist: nichts passiert, Zähler bleibt | AK-3 |
| PS-7 | Wiederholbarkeit | Lektion "Nochmal": Figur und Sterne wie am Anfang, Zähler 0 | AK-3 |
| PS-8 | Normal | Matt-Aufgaben: jeden Mattzug einmal spielen → gelöst | AK-4 |
| PS-9 | Fehlerfall | Matt-Aufgabe: erlaubter Zug ohne Matt → "Noch nicht", Stellung wie am Anfang | AK-4 |
| PS-10 | Missbrauch | Gegnerische Figur antippen oder unerlaubter Zug → nichts passiert | AK-4 |
| PS-11 | Normal | Gewinn-Aufgaben: Lösung prüfen (Suche) und spielen | AK-5 |
| PS-12 | Fehlalarm | Kein Zug außerhalb der Lösungsliste gewinnt ≥ 2 (die Liste ist vollständig) | AK-5 |
| PS-13 | Normal | Tipp: richtige Figur markiert | AK-6 |
| PS-14 | Grenzwert | Lösung zeigen, dann den Zug spielen → kein Haken | AK-6 |
| PS-15 | Normal | Lektion lösen → Haken in der Übersicht; neu laden → Haken bleibt | AK-7 |
| PS-16 | Fehlerfall | Speicher `{kaputt`, `{"formatversion":1,"geloest":["X9",5]}` und `{"formatversion":2,...}` → Übersicht ohne Haken, keine Fehler | AK-7 |
| PS-17 | Normal | Gegen Computer e2-e4: nach dem Antwortzug Satz "Computer: …" | AK-8 |
| PS-18 | Normal | Lernhilfe aus: kein Satz nach dem Computerzug | AK-8 |
| PS-14b | Grenzwert | Lösung zeigen, "Nochmal", selbst spielen (Matt und Gewinn-Aufgabe) → kein Haken | AK-6 |
| PS-13b | Normal | Tipp in Lektionen (nächstes Feld eines kürzesten Wegs) und bei Gewinn- und Schwarz-Aufgaben | AK-6 |
| PS-5b | Grenzwert | Umweg: Turm-Lektion in 5 Zügen → "Bestwert: 3"; eigene Suche im Test bestätigt jeden Bestwert | AK-3 |
| PS-10b | Missbrauch | Eigene Figur wählen, Feld ohne Punkt tippen → nichts passiert | AK-4 |
| PS-16b | Fehlerfall | Ohne Freigabe: nach Neuladen kein Haken und nichts gespeichert | AK-7 |
| PS-18b | Normal | Nach "Zug zurück" ist der Computersatz weg; Control liefert ohne Lernhilfe keine Gründe | AK-8 |
| PS-19 | Grenzwert | 412 px: Brett passt, Felder ≥ 44 px, kein Querscroll, 7 Reiter innerhalb der Leiste | AK-9 |

## Gegenproben
- Verstoß: Turm gleitet durch Sterne hindurch; Bauer schlägt geradeaus; falscher Zug wird angenommen; Lösung zählt als gelöst; Fortschritt nicht gespeichert; Computersatz fehlt.
  Jeder muss seinen Test rot machen.
- Fehlalarm: PS-12, PS-16 (kaputte Daten sind kein Absturz).

## Nicht Teil dieser Änderung
Matt in 2, Eröffnungen, 3D in der Schachschule, Erklärungen zu Rochade und en passant als eigene Lektion.

## Betroffene Schichten
Neu: `SchuleEntity`, `SchuleBoundary`, `SchuleControl`, `SchuleUI`. Geändert: `ChessControl` (Gründe des Computerzugs), `ChessUI` (Satz), Reiterleiste, `seite_handy.js` (7 Reiter).

## Ergebnis
- Vorher: 9 von 9 Tests rot (Reiter fehlt). Nachher: 9 von 9 grün (`werkstatt/tests/schule_test.js`), 10 von 10 Gegenproben erkannt (`gegenproben_schule.py`).
- Bestwerte: Turm 3, Läufer 3, Dame 4, Springer 3, König 5, Bauer 4 Züge. 12 Matt-Aufgaben mit zusammen 15 Mattzügen. Gewinn-Aufgaben per Suche (4 Halbzüge) geprüft, Lösungslisten vollständig.
- Felder der Schachschule 45 px bei 412 px Breite (Schach-Reiter bleibt bei 38 px).
- Beim Bauen gefunden: zwei Aufgaben-Ideen waren falsch (Bauerngabel d3-d4 verliert, Läufer-Spieß stand schon im Schach); mit der Suche erkannt und ersetzt.
  Früheste Stufe: Spec (jede Stellung vor dem Eintragen mit der Schachregel und der Suche prüfen).
- Unabhängige Prüfung (zweiter Agent): Fehler gefunden und behoben: nach "Lösung" und "Nochmal" zählte die Aufgabe wieder als gelöst; Speichern lief ohne Freigabe (jetzt aus, bis zur Antwort).
  Tests ergänzt: eigene Suche für den Bestwert, Umweg-Meldung, unerlaubter Zug, Tipp in Lektion und Schwarz-Aufgaben, Haken bei Lektionen, Computersatz nach "Zug zurück", weitere Zugregeln. Texte: Bauer wird "meist zur Dame", Computersatz ohne Grund jetzt neutral.
- Gerätetest: offen (Abnahmeliste `abnahme-schachschule-S-W08.md`).
