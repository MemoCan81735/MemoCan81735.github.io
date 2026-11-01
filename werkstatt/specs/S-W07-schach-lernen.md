# S-W07: Schach lernen beim Spielen (Lernhilfe)

**Status:** gebaut, freigegeben am 01.11.2026, 14:30
<!-- Freigabe durch den Betreiber im Projekt-Thread: Auswahl "Lernmodus beim Spielen" auf die Frage "Welche Art Schach lernen soll ich zuerst bauen?"
     (Text der Wahl: "Tipp erklärt den Zug in einem Satz, und vor einem Patzer (Figur hängt, Matt droht) kommt eine Warnung mit Rücknahme."). -->

## Anlass
Wunsch des Betreibers: "Ist es möglich beim Schachspiel zu lernen?" Es gab schon Tipp, Zug zurück, Regeln und Stufen, aber keine Erklärung, warum ein Zug gut oder schlecht ist.

## Ziel
1. **Tipp mit Erklärung:** Der Tipp markiert den Zug wie bisher und schreibt darunter einen kurzen Satz, z. B. "Springer g1 nach f3: bringt den Springer ins Spiel."
2. **Warnung vor Patzern:** Nach dem eigenen Zug prüft die Seite, ob der Gegner jetzt Matt setzen kann oder ob eine eigene Figur verloren geht.
   Dann erscheint eine Warnung mit den Knöpfen "Zurücknehmen" und "Trotzdem weiter". Der Computer wartet so lange.
3. **Schalter "Lernhilfe"** an oder aus, Standard an.

## Rechenmodell (verbindlich)
- **Werte:** Bauer 1, Springer 3, Läufer 3, Turm 5, Dame 9 (wie die Ersatz-KI).
- **Verlust einer Figur (Abtausch in zwei Halbzügen):** Für jeden gültigen Schlagzug des Gegners auf eine eigene Figur mit Wert w:
  kann man auf dem Feld zurückschlagen, ist der Verlust max(0, w − Wert des schlagenden Steins), sonst w. "Hängt" = größter Verlust.
- **Patzer** (nur Züge des Menschen, gegen den Computer und zu zweit):
  a) Der Gegner hat nach dem Zug ein Matt in einem Zug → Warnung "Matt", nennt den Zug.
  b) Größter Verlust minus Wert der gerade geschlagenen Figur ≥ 2 → Warnung "hängt", nennt Figur, Feld und Punkte.
  c) Keine Warnung, wenn der Zug selbst Matt setzt oder die Partie beendet.
- **Gründe eines Zugs** (Reihenfolge = Vorrang, der Satz nennt höchstens zwei): Matt, verhindert Matt in einem Zug, schlägt eine Figur,
  bringt eine angegriffene Figur in Sicherheit (vorher Verlust ≥ 2, danach 0), droht Matt, Umwandlung, Rochade, greift an (die gezogene Figur kann
  im nächsten Zug mit Gewinn ≥ 2 schlagen), Schach, Entwicklung (Springer oder Läufer verlässt die Grundreihe), Mitte (Ziel d4, e4, d5, e5).
  Trifft nichts zu: "ist laut Rechner der stärkste Zug".
- **Schichten:** Die Rechnung liegt in der Boundary (`ChessBoundary`, braucht chess.js), liefert nur Fakten (Art, Figur, Feld, Punkte).
  Die Control merkt sich die offene Warnung und sperrt Brett, Tipp und Computer, bis entschieden ist. Die Sätze baut die UI. Kein Zufall, keine Zeit.
- **Gespeicherte Daten:** In `brettspiele.einstellungen` (Formatversion 1) kommt das optionale Feld `lernen` dazu, z. B. `{"chess":false}`.
  Fehlt es oder ist der Wert kein `false`, gilt "an". Ältere Daten bleiben gültig. Die offene Warnung wird nicht gespeichert.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Tipp zeigt nach höchstens 2 s einen Satz mit Figur, Start- und Zielfeld und mindestens einem Grund; der Satz verschwindet beim nächsten Zug | `l_tipp_satz` |
| AK-2 | Gründe stimmen in 13 festen Stellungen (Tabelle in den Prüfszenarien), geprüft wird die ganze Liste in Reihenfolge | `l_gruende` |
| AK-3 | Warnung genau bei den Patzern a) und b); keine Warnung bei Abtausch (netto < 2), bei normalen Zügen und bei eigenem Matt | `l_patzer` |
| AK-4 | Während der Warnung zieht der Computer nicht (2 s gemessen), Brett und Tipp sind gesperrt; "Zurücknehmen" stellt genau die Stellung vor dem Zug her (gleiche FEN); "Trotzdem weiter" lässt den Computer innerhalb von 3 s ziehen | `l_warnung_ablauf` |
| AK-5 | Schalter: Standard an, Zustand bleibt nach Neuladen; aus → keine Warnung und Tipp ohne Satz; kaputte oder alte Daten → an | `l_schalter` |
| AK-6 | Analyse eines Zugs im Mittel ≤ 50 ms über 200 Stellungen aus Zufallspartien, keine Ausnahme; zweimal gleiche Eingabe → gleiche Ausgabe | `l_last` |
| AK-7 | Handy 412 px: kein Querscroll mit Warnung, Warnknöpfe ≥ 44 px hoch, Warnung und Satz auch in 3D sichtbar, keine Skriptfehler | `l_handy` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Startstellung, Tipp: Satz erscheint mit Figur und Feldern | AK-1 |
| PS-2 | Normal | Nach dem Tipp einen Zug machen: Satz ist weg | AK-1 |
| PS-3 | Normal | Matt: `r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4`, h5-f7 → Matt | AK-2 |
| PS-4 | Normal | Schlagen: `4k3/8/8/n7/8/8/8/R3K3 w - - 0 1`, a1-a5 → schlägt Springer | AK-2 |
| PS-5 | Normal | Retten: `4k3/8/8/3p4/4N3/8/8/4K3 w - - 0 1`, e4-c3 → in Sicherheit | AK-2 |
| PS-6 | Normal | Rochade: `4k3/8/8/8/8/8/8/4K2R w K - 0 1`, e1-g1 → Rochade | AK-2 |
| PS-7 | Normal | Entwicklung und Mitte: Startstellung g1-f3 → Entwicklung; e2-e4 → Mitte | AK-2 |
| PS-8 | Normal | Matt verhindern: `r5k1/8/8/8/8/8/5PPP/6K1 w - - 0 1`, h2-h3 → verhindert Matt | AK-2 |
| PS-9 | Normal | Angriff: `4k3/8/8/1r6/8/8/8/3BK3 w - - 0 1`, d1-a4 → greift Turm an, Entwicklung | AK-2 |
| PS-9b | Normal | Umwandlung: `4k3/P7/8/8/8/8/8/4K3 w - - 0 1`, a7-a8 → Umwandlung, Schach | AK-2 |
| PS-9c | Normal | Matt-Drohung: `6k1/5ppp/8/8/8/8/7R/6K1 w - - 0 1`, h2-a2 → droht Matt | AK-2 |
| PS-10 | Grenzwert | Ruhiger Zug ohne Grund: `4k3/8/8/8/8/8/8/4K3 w - - 0 1`, e1-f1 → "stärkster Zug" | AK-2 |
| PS-11 | Normal | Dame hängt: `4k3/8/8/3p4/8/8/Q7/4K3 w - - 0 1`, a2-c4 → Warnung Dame c4, 9 Punkte | AK-3 |
| PS-12 | Normal | Matt droht: nach 1. f3 e5 (`rnbqkbnr/pppp1ppp/8/4p3/8/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 2`) g2-g4 → Warnung Matt mit d8-h4 | AK-3 |
| PS-13 | Fehlalarm | Abtausch: `4k3/8/2p5/3n4/8/4N3/8/4K3 w - - 0 1`, e3-d5 (cxd5 möglich, netto 0) → keine Warnung | AK-3 |
| PS-13b | Fehlalarm | Gedeckte Figur: `4k3/8/8/2r5/8/8/1P6/1N2K3 w - - 0 1`, b1-c3 (Turm schlägt, Bauer schlägt zurück, Verlust 0) → keine Warnung | AK-3 |
| PS-14 | Fehlalarm | Startstellung e2-e4 → keine Warnung | AK-3 |
| PS-15 | Grenzwert | Verlust genau 1 (unter der Schwelle 2): `4k3/8/8/3r4/8/8/3P4/4K3 w - - 0 1`, e1-f1 (Bauer d2 ungedeckt) → keine Warnung | AK-3 |
| PS-16 | Grenzwert | Eigener Zug setzt Matt (PS-3 gespielt) → keine Warnung | AK-3 |
| PS-17 | Normal | Gegen Computer: Patzer PS-11, 2 s warten → Computer hat nicht gezogen; Tippen aufs Brett und Tipp wirken nicht | AK-4 |
| PS-18 | Normal | "Zurücknehmen" → FEN wie vor dem Zug, Weiß am Zug, keine Warnung | AK-4 |
| PS-18b | Wiederholbarkeit | Zu zweit nach zwei Zügen patzen, Zurücknehmen → Stellung nach dem zweiten Zug (genau ein Halbzug zurück) | AK-4 |
| PS-19 | Normal | "Trotzdem weiter" → Computer zieht innerhalb von 3 s | AK-4 |
| PS-20 | Missbrauch | Zu zweit: Patzer von Schwarz wird ebenso gewarnt; während der Warnung schwarze und weiße Figuren nicht wählbar | AK-4 |
| PS-21 | Normal | Schalter aus, neu laden → aus; Patzer PS-11 → keine Warnung; Tipp → kein Satz | AK-5 |
| PS-22 | Fehlerfall | Speicher ohne `lernen`, mit `"lernen":"kaputt"`, mit `{"chess":"kaputt"}` und kaputtes JSON → an | AK-5 |
| PS-23 | Wiederholbarkeit | 200 Stellungen aus Zufallspartien (fester Startwert): Gründe und Patzer ohne Ausnahme, Mittel ≤ 50 ms, zweiter Lauf gleich | AK-6 |
| PS-24 | Grenzwert | Breite 412 px: Warnung offen, kein Querscroll, Knöpfe ≥ 44 px | AK-7 |
| PS-25 | Normal | In 3D: Patzer zeigt Warnung, Tipp zeigt Satz | AK-7 |
| PS-26 | Fehlerfall | Warnung offen, dann "Neu starten" oder Moduswechsel → Warnung weg | AK-4 |
| PS-27 | Missbrauch | Warnung offen gegen Computer, Knopf "Zug zurück" → genau der Patzer zurück, Warnung weg | AK-4 |
| PS-28 | Missbrauch | Warnung offen gegen Computer, Lernhilfe ausschalten → Warnung weg, Computer zieht innerhalb von 3 s | AK-4, AK-5 |
| PS-29 | Grenzwert | Satz mit drei Gründen nennt nur die ersten zwei; Umwandlung und Matt-Drohung werden erkannt (vollständige Liste der Gründe geprüft) | AK-1, AK-2 |

## Gegenproben
- Verstoß: Rückschlagen nicht berücksichtigt (jeder Abtausch wird gewarnt); Matt in einem Zug nicht geprüft; Computer zieht trotz Warnung; Zurücknehmen nimmt zwei Halbzüge zurück; Schalter nicht gespeichert; Satz fehlt beim Tipp. Jeder muss seinen Test rot machen.
- Fehlalarm: PS-13, PS-13b, PS-14, PS-15 (keine Warnung). Schwelle 1 statt 2 muss PS-15 rot machen.

## Nicht Teil dieser Änderung
- Erklärung der Computerzüge, Übungsaufgaben, Figuren-Schule (eigene Wahl später). Andere Spiele.

## Betroffene Schichten
Boundary (`ChessBoundary`: Analyse; `EinstellungenBoundary`: optionales Feld), Control (`ChessControl`: Warnung, Sperre; `EinstellungenControl`), UI (`ChessUI`: Satz, Warnung, Schalter). Entity unverändert.

## Risiken und Kosten
Die Regeln sind einfach (zwei Halbzüge). Sie erkennen keine Gabeln über mehrere Züge und keine Fesselungen, die erst später wirken. Lieber eine Warnung zu wenig als zu viele.

## Ergebnis
- Vorher: 7 von 7 Tests rot (Lernhilfe fehlt). Nachher: 7 von 7 grün (`werkstatt/tests/lernen_test.js`), 11 von 11 Gegenproben erkannt (`gegenproben_lernen.py`).
- Messwerte: Satz zum Tipp nach 0,68 s; Analyse 20 ms je Zug im Mittel (200 Stellungen); Computer zieht 0,97 s nach "Trotzdem weiter"; Warnknöpfe 44 px hoch.
- Fehlalarme gemessen: 12 Partien, beide Seiten mit der Ersatz-KI (Tiefe 2): 7 Warnungen bei 376 Zügen (1,9 %), alle sieben angesehen, es waren echte Figurenverluste.
- Beim Testbau gefunden: zwei Prüfstellungen enthielten unmögliche Damenzüge (d1-c4), der Test meldete deshalb "keine Warnung", ohne dass ein Zug geschah.
  Seitdem prüft der Test, dass der Zug wirklich ausgeführt wurde. Früheste Stufe: Spec (Stellungen beim Schreiben mit der Schachregel prüfen).
- Unabhängige Prüfung (zweiter Agent): keine Fehler im Ablauf, kein Schichtverstoß. Ergänzt nach den Befunden: ganze Liste der Gründe statt nur des ersten,
  Umwandlung und Matt-Drohung, höchstens zwei Gründe im Satz, Sperre des Tipps in der Control, Neustart, Moduswechsel, Zug zurück und Ausschalten bei offener Warnung (PS-26 bis PS-29),
  Satz in 3D wirklich sichtbar. Behoben: ein Tipp, der noch rechnet, während gezogen wird, zeigt keinen veralteten Satz mehr; Rochade-Satz ohne doppelten Doppelpunkt.
- Gesamtlauf: die älteren Tests `d3_markierung` (Narrenmatt) und `f_2d_svg` (Umwandlung nach Patzern) wurden jetzt von der Warnung angehalten; beide schalten die Lernhilfe dafür aus. Früheste Stufe: Spec (betroffene Tests anderer Specs mit Schachzügen vorab suchen).
- Bekannte Grenze: Der Tipp nennt bei einer Umwandlung immer die Dame. Gabeln und Fesselungen über mehrere Züge erkennt die Warnung nicht (siehe Risiken).
- Gerätetest: offen (Abnahmeliste `abnahme-schach-lernen-S-W07.md`).
