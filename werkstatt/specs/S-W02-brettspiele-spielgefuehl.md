# S-W02: Brettspiele mit Spielgefühl, Stufen, Zug zurück und Tipp (B1, B2, B3)

**Status:** freigegeben am 31.10.2026, 20:20
<!-- Freigabe durch den Betreiber im Projekt-Thread: "B1, b2, b3, l1, l2, a1". -->

## Ziel
Die sechs Brettspiele fühlen sich wie eine App an: Züge bewegen sich, klingen und vibrieren (B1). Jedes KI-Spiel hat Leicht, Mittel und Stark (B2).
In jedem Spiel gibt es "Zug zurück" und "Tipp" (B3).

## Rechenmodell (verbindlich)
- **Zug zurück:** Die Control merkt sich vor jeder Aktion den Zustand der Entity und den Spieler am Zug. Ohne KI geht ein Schritt zurück.
  Gegen die KI geht es so weit zurück, bis wieder der Mensch am Zug ist (eigene Aktion plus KI-Antwort, auch bei Zusatzzügen).
  Nicht möglich bei leerer Liste, nach Spielende und während die KI am Zug ist. Neustart und Moduswechsel leeren die Liste.
  Schach behält die eigene Rücknahme über chess.js.
- **Stufen:** Jede Stufe hat eine Suchtiefe und eine Fehlerquote. Mit der Wahrscheinlichkeit der Fehlerquote spielt die KI einen zufälligen gültigen Zug.
  Der Zufall wird als Funktion in die Control hineingereicht (Regel: kein Zufall in Entity oder Control erzeugen).

| Spiel | Leicht (Tiefe / Fehler) | Mittel | Stark |
| --- | --- | --- | --- |
| Tic Tac Toe | voll / 0,45 | voll / 0,15 | voll / 0 |
| Vier gewinnt | 2 / 0,25 | 4 / 0,05 | 6 / 0 |
| Reversi | 1 / 0,3 | 3 / 0,05 | 4 / 0 |
| Mühle | 1 Zug / 0,4 | 1 Zug / 0,15 | 1 Zug / 0 |
| Mangala | 2 / 0,25 | 5 / 0,05 | 8 / 0 |
| Schach | wie bisher (Stockfish 2/8/20) | | |

- **Tipp:** Die KI rechnet für den Spieler am Zug mit der Stufe Stark ohne Fehler. Die UI markiert das Feld (bei Zügen Start und Ziel) 1,6 s lang.
  Kein Tipp nach Spielende und während die KI am Zug ist. Schach: Stockfish mit Stärke 20, sonst Ersatzsuche Tiefe 3.
- **Spielgefühl (nur UI):** Neue Steine bekommen eine Animation (Vier gewinnt: Fall aus der Höhe der Zeile, Reversi: umgedrehte Steine drehen sich,
  Schach: Figur gleitet vom Start- zum Zielfeld, letzter Zug markiert, sonst: kurzes Aufploppen). Gewinnlinie pulsiert.
  Ton per WebAudio (eigener Klang, keine Dateien): Zug, Sieg, Niederlage, Remis, ungültig. Vibration 12 ms je Zug, Muster beim Sieg.
  Konfetti 1,8 s, wenn ein Mensch gewinnt; aus bei `prefers-reduced-motion`. Ton-Schalter oben, Standard an.
- **Gespeicherte Daten (neu):** `localStorage["brettspiele.einstellungen"] = {"formatversion":1,"ton":true,"stufen":{"tictactoe":"mittel",…}}`.
  Fehlende, kaputte oder fremde Formatversion: Standardwerte, kein Absturz.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Zug zurück ohne KI: 1 Aktion zurück, Brett und Spieler wie vorher (alle 5 Spiele ohne Schach) | `zurueck_zweispieler` |
| AK-2 | Zug zurück gegen KI: nach Mensch plus KI wieder genau der Zustand vor dem Menschenzug | `zurueck_gegen_ki` |
| AK-3 | Zug zurück gesperrt: leere Liste, Spielende, KI am Zug (0 Änderungen am Brett) | `zurueck_gesperrt` |
| AK-4 | 3 Stufen in 6 Spielen wählbar, Tiefe laut Tabelle, unbekannte Stufe wird Mittel | `stufen_tabelle` |
| AK-5 | Fehlerquote: Zufall 0 → Zufallszug, Zufall 0,999 → Engine-Zug; über 400 Würfe Anteil Zufallszüge = Fehlerquote ± 0,06 | `stufen_fehlerquote` |
| AK-6 | Stark verliert Tic Tac Toe nie (200 Partien gegen Zufallsspieler: 0 Niederlagen) | `stufen_stark_ttt` |
| AK-7 | Stufe und Ton bleiben nach Neuladen, kaputte Daten führen zu Standardwerten | `einstellungen_speicher` |
| AK-8 | Tipp: gewinnender Zug wird gezeigt (TTT, Vier gewinnt), sonst ein gültiger Zug (alle 6 Spiele); kein Tipp nach Ende oder bei KI | `tipp_zug` |
| AK-9 | Tipp-Markierung erscheint am richtigen Feld und ist nach höchstens 2 s weg | `tipp_anzeige` |
| AK-10 | Animation: genau die geänderten Felder bekommen die Klasse; Vier gewinnt `--fall` = Zeile + 1; Reversi gedrehte Steine; Schach Gleitweg in Feldern | `animation_klassen` |
| AK-11 | Ton und Vibration je Zug, Sieg-Klang beim Sieg; bei Ton aus 0 Klänge (Vibration bleibt aus, wenn Ton aus) | `ton_vibration` |
| AK-12 | Konfetti erscheint bei Sieg eines Menschen und ist nach ≤ 3 s entfernt; nicht bei KI-Sieg, nicht bei reduzierter Bewegung | `konfetti` |
| AK-13 | Keine Skriptfehler, kein Querscroll bei 412 px mit den neuen Knöpfen | `seite_handy.js` (D1, D3) |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | TTT zu zweit: X setzt, Zug zurück, Brett leer, X am Zug | AK-1 |
| PS-2 | Normal | Reversi zu zweit: Zug mit Umdrehen, zurück stellt alle Steine wieder her | AK-1 |
| PS-3 | Normal | Mühle zu zweit: Ziehphase, Zug zurück stellt Start und Ziel her | AK-1 |
| PS-4 | Normal | TTT gegen KI: Mensch plus KI, zurück, Brett leer, Mensch am Zug | AK-2 |
| PS-5 | Grenzwert | Mangala gegen KI mit Zusatzzug der KI (2 KI-Aktionen): zurück bis vor den Menschenzug | AK-2 |
| PS-6 | Grenzwert | Liste leer: Zug zurück gesperrt und ohne Wirkung | AK-3 |
| PS-7 | Fehlerfall | Nach Spielende: Zug zurück gesperrt, Statistik unverändert | AK-3 |
| PS-8 | Missbrauch | 10× Zug zurück hintereinander: kein Fehler, Brett im Startzustand | AK-1, AK-3 |
| PS-9 | Missbrauch | Zug zurück, während die KI rechnet: gesperrt | AK-3 |
| PS-10 | Wiederholbarkeit | Neustart leert die Liste | AK-3 |
| PS-11 | Normal | Stufen je Spiel setzen, Tiefe prüfen | AK-4 |
| PS-12 | Fehlerfall | Stufe "unsinn" → Mittel | AK-4 |
| PS-13 | Grenzwert | Zufall liefert 0 bzw. 0,999 | AK-5 |
| PS-14 | Wiederholbarkeit | Gleiche Zufallsfolge → gleiche Züge | AK-5 |
| PS-15 | Normal | 400 Würfe Leicht, Anteil Zufallszüge | AK-5 |
| PS-16 | Normal | 200 Partien TTT Stark gegen Zufall | AK-6 |
| PS-17 | Fehlerfall | Speicher enthält `{kaputt`, Formatversion 99, `null` | AK-7 |
| PS-18 | Wiederholbarkeit | Stufe Leicht wählen, neu laden, Leicht ist gewählt | AK-7 |
| PS-19 | Normal | TTT: X hat zwei in einer Reihe, Tipp zeigt das dritte Feld | AK-8 |
| PS-20 | Normal | Vier gewinnt: Gegner droht Viererreihe, Tipp blockt | AK-8 |
| PS-21 | Grenzwert | Tipp in allen 6 Spielen in der Startstellung ist gültig | AK-8 |
| PS-22 | Fehlerfall | Tipp nach Spielende und bei KI am Zug: keiner | AK-8 |
| PS-23 | Missbrauch | Tipp 5× schnell tippen: höchstens eine Markierung gleichzeitig | AK-9 |
| PS-24 | Normal | Tipp-Knopf in der UI: Markierung da, nach 2 s weg | AK-9 |
| PS-25 | Normal | Animation je Spiel nach einem Zug | AK-10 |
| PS-26 | Normal | Schach e2-e4: Figur gleitet 2 Felder, e2 und e4 markiert | AK-10 |
| PS-27 | Normal | Zug spielt Klang "zug", vibriert 12 ms; Sieg spielt "sieg" | AK-11 |
| PS-28 | Missbrauch | Ton aus: 0 Klänge, 0 Vibration | AK-11 |
| PS-29 | Normal | TTT-Sieg zu zweit: Konfetti da, nach 3 s weg | AK-12 |
| PS-30 | Grenzwert | KI gewinnt: kein Konfetti; reduzierte Bewegung: kein Konfetti | AK-12 |

## Gegenproben
- Verstoß: Die Tests laufen gegen den Stand vor S-W02 und müssen dort rot sein (fehlende Methoden und Knöpfe).
  Zusätzlich je ein absichtlicher Fehler, der rot werden muss: Zug zurück stellt nur das Brett, nicht den Spieler her; Fehlerquote ignoriert; Tipp für den falschen Spieler.
- Fehlalarm: Zug zurück im Zweispieler mit nur einem Zug ist erlaubt; Zufallszug ist immer ein gültiger Zug (wird nicht als Fehler gemeldet).

## Nicht Teil dieser Änderung
- Neue Spiele, Tagesrätsel (B6), Fernpartie (B7), dunkles Design (B8).
- Stärkere Mühle-KI (bleibt 1 Zug voraus).

## Betroffene Schichten
Control (Zug zurück, Stufen, Tipp, Zufall hineingereicht), Boundary (Einstellungen mit Formatversion), UI (Knöpfe, Animation, Ton, Konfetti).
Entity unverändert.

## Risiken und Kosten
Vier gewinnt Tiefe 6 und Reversi Tiefe 4: Rechenzeit im Worker am Handy messen (Ziel unter 1,5 s je Zug).
WebAudio braucht ein erstes Tippen (Browserregel).

## Ergebnis
Offen.
