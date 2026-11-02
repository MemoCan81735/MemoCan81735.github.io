# S-W13: Namensschilder an den Wahrzeichen der Oer-Runde

**Status:** gebaut, freigegeben am 02.11.2026, 13:56
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Kann man die Namen von den Wahrzeichen sichtbar gestalten" -->

## Anlass
Die Gebäude der Oer-Runde (S-W12) tragen ihre Namen nur als Kommentar im Eintrag. Der Betreiber will die Namen im Rennen sehen.

## Rechenmodell (verbindlich)
- Auftrag: jedes Wahrzeichen darf `anzeige` (Kurzname, 3 bis 24 Zeichen) tragen. Fehlt sie, gilt `name`, sofern er höchstens 24 Zeichen hat; sonst Fehler "Anzeige". Außerhalb 3 bis 24 oder kein Text: Fehler "Anzeige".
- `baue.py` schreibt `anzeige` in jedes Wahrzeichen; `einbauen.py` schreibt sie als `label` in den Eintrag der Strecke.
- Spiel: Hat ein Wahrzeichen `label`, schwebt über ihm ein Schild (heller Text auf dunklem, abgerundetem Feld), Höhe nach Typ mal Größe `s`. Der Text wird verkleinert, bis er in das Schild passt.
- Sichtbarkeit nach Abstand d (Welteinheiten) zur Kamera: `alpha(d)` = 1 bis 120, danach linear fallend auf 0 bei 420, darüber 0. Ungültige Werte (NaN, negativ, Text) ergeben 0. Bei alpha unter 0,02 ist das Schild unsichtbar.
- Nur Darstellung; keine Spielregeln, kein Speichern, keine neue Berechtigung. Strecken ohne `label` bleiben unverändert.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Alle Wahrzeichen der Oer-Runde haben `anzeige` mit 3 bis 24 Zeichen, eindeutig; 2 und 25 Zeichen, leer, Zahl und zu langer Name ohne `anzeige` ergeben Fehler "Anzeige"; 3 und 24 Zeichen gehen | `w_anzeige` |
| AK-2 | Im Spiel hat jedes Wahrzeichen der Strecke `oer` ein `label` gleich der `anzeige`; keine andere Strecke hat ein `label` | `w_label_einbau` |
| AK-3 | `alpha`: 0 → 1; 120 → 1; 270 → 0,5 (±0,01); 420 → 0; 1000 → 0; NaN, −5, "x" → 0 | `w_label_alpha` |
| AK-4 | Szene der Oer-Runde baut 12 Schilder über dem Boden; eine andere Strecke 0; Kamera 60 Einheiten entfernt: sichtbar mit Deckkraft 1; 600 entfernt: unsichtbar; zweimal dasselbe Ergebnis | `w_label_szene` |
| AK-5 | Schild-Bild: längster Text passt (Breite ≤ 92 % des Bildes), helle Punkte 6 bis 40 % der Fläche, Kontrast Text/Feld ≥ 7 | `w_label_text` |
| AK-6 | Rennen auf `oer` ohne Skriptfehler und ohne fremde Anfrage; Sichtprüfung am Handy (Abnahmeliste) | `w_szene` (S-W12) |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Echte Liste mit 12 Kurznamen | AK-1, AK-2 |
| PS-2 | Grenzwert | `anzeige` mit genau 3 und 24 Zeichen geht; 2 und 25 nicht | AK-1 |
| PS-3 | Fehlerfall | Name über 24 Zeichen ohne `anzeige` | AK-1 |
| PS-4 | Missbrauch | `anzeige` als Zahl, leer; Abstand NaN, negativ, Text | AK-1, AK-3 |
| PS-5 | Grenzwert | Abstand 120 und 420 | AK-3 |
| PS-6 | Normal | Nah: Schild voll sichtbar; weit: ausgeblendet | AK-4 |
| PS-7 | Wiederholbarkeit | Zweimal aktualisieren ergibt dasselbe | AK-4 |
| PS-8 | Fehlalarm | Strecke ohne Schilder bleibt ohne | AK-2, AK-4 |
| PS-9 | Normal | Längster Name passt ins Schild | AK-5 |

## Gegenproben
- Verstoß: Längenprüfung aus; `label` nicht in den Eintrag geschrieben; Abstand ohne Ausblenden; Text ohne Verkleinern; Schilder nie ausgeblendet. Jeder muss seinen Test rot machen.
- Fehlalarm: PS-8.

## Nicht Teil dieser Änderung
Schilder in anderen Strecken, Übersetzungen, Namen in der Minikarte.

## Betroffene Schichten
Werkzeug (Python), Daten und im Spiel nur die 3D-Darstellung (UI). Keine Regeln.

## Risiken und Kosten
Zwölf kleine Bilder (je 512 × 96) und zwölf Sprites; vernachlässigbar. Schilder dürfen die Sicht nicht verdecken: nur über den Gebäuden, außerhalb der Fahrbahn, ab 120 Einheiten ausblendend.

## Ergebnis (02.11.2026)
- 12 Schilder in der Oer-Runde, 0 in allen anderen Strecken. Längster Text "Zeche Ewald, Schacht 3": 84 % der Schildbreite (Grenze 92 %), helle Punkte 8,3 %, Kontrast 18,2 (Grenze 7).
- Alle Tests rot vor dem Bau, danach grün. Gegenproben: 13 von 13 erkannt (7 aus S-W12, 6 neu).
- Änderung im Spiel etwa 40 Zeilen, daher keine zweite Prüfung nötig (unter 150 Zeilen).
- Offen: Größe und Lesbarkeit am Handy (Abnahmeliste). Das echte Rennbild zeigt am Start kein Schild, weil die Gebäude dort außerhalb von 120 Einheiten stehen; die Sichtbarkeit im Rennen ist durch `w_label_szene` belegt, die Größe wird am Handy beurteilt.
