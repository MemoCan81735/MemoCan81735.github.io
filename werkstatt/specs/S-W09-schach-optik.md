# S-W09: Schach-Optik (Gruppen, Symbole, Holzmaserung)

**Status:** gebaut, freigegeben am 01.11.2026, 19:56
<!-- Freigabe durch den Betreiber im Projekt-Thread: Auswahl "Gruppen, Symbole und Holzmaserung" auf die Frage "Was aus dem Entwurf soll ich im Schach einbauen?"
     (Anlass: ein KI-Entwurf der Oberfläche mit Holz- und Marmorbrett, gruppierten Bedienelementen und Symbolen an den Knöpfen). Marmor und Fotos wurden nicht gewählt. -->

## Anlass
Wunsch des Betreibers: Schach soll hochwertiger und übersichtlicher aussehen. Aus dem Entwurf gewählt: Gruppen mit Überschrift, Symbole an den Knöpfen, Holzmaserung am 3D-Brett.

## Rechenmodell (verbindlich)
- **Nur UI, nur der Reiter Schach.** Andere Spiele, Entity, Boundary und Control bleiben unverändert. Keine neuen Daten, keine Berechtigung, keine Bilddateien, keine fremden Server.
- **Gruppen (Reihenfolge von oben nach unten):** Überschrift "Aktionen" mit Neu starten, Zug zurück, Tipp (und Teilen, wenn es erscheint);
  Überschrift "Spielmodus" mit 2 Spieler / Gegen Computer und der Stufenwahl (nur gegen den Computer sichtbar);
  Überschrift "Optionen" mit dem Knopf 3D/2D und dem Knopf Lernhilfe. Statistik bleibt darunter.
- **Symbole:** Neu starten (Kreispfeil), Zug zurück (Rückpfeil), Tipp (Glühbirne), 3D/2D (Würfel), Lernhilfe (Buch). Die Symbole sind Teil des Stils (CSS-Maske mit eingebettetem SVG),
  nehmen die Textfarbe des Knopfs an, sind mindestens 14 px breit und ändern sich nicht, wenn der Knopftext wechselt (z. B. "3D nicht möglich", "Lernhilfe aus"). Der Text bleibt sichtbar.
- **Holzmaserung (nur 3D):** Das Brett und der Rahmen bekommen selbst erzeugte Texturen (Zeichenfläche 128 × 128, fester Startwert, kein Zufall zur Laufzeit).
  Die Textur ist ein Helligkeitsfaktor zwischen 0,90 und 1,00, der mit der Grundfarbe multipliziert wird; Streuung (Standardabweichung) mindestens 0,012, damit die Maserung sichtbar ist.
  Helle und dunkle Felder haben je 2 Varianten; jedes Feld ist je nach Nummer um 0, 90, 180 oder 270° gedreht, damit gleiche Felder nicht gleich aussehen.
  Die dunkle Grundfarbe wird von 0x8b5a36 auf 0x95603b angehoben, damit der Mindestkontrast trotz Maserung hält.
- **Kontrast bleibt Pflicht (aus S-W06):** weiße Figur zum hellsten Bildpunkt des hellen Felds ≥ 1,4; schwarze Figur zum dunkelsten Bildpunkt des dunklen Felds ≥ 2,5 (Worst-Case über die Textur).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Überschriften "Aktionen", "Spielmodus", "Optionen" stehen in dieser Reihenfolge; jeder Knopf bzw. jede Auswahl steht in seiner Gruppe (gemessen an der Lage von oben nach unten) | `o_gruppen` |
| AK-2 | Alle 5 Knöpfe haben ein Symbol ≥ 14 px, der Text bleibt, das Symbol bleibt nach Textwechsel; in Vier gewinnt hat der Tipp-Knopf kein Symbol | `o_symbole` |
| AK-3 | Bei 412 und 360 px: kein Querscroll, alle Knöpfe ≥ 44 px hoch und ganz im Bild, keine Skriptfehler (2D und 3D) | `o_handy` |
| AK-4 | Holztexturen: Faktor 0,90 bis 1,00, Streuung ≥ 0,012, zweimal erzeugt gleich; Felder tragen die Textur; mindestens 3 verschiedene Drehungen unter den hellen Feldern | `o_holz` |
| AK-5 | Kontrast im Worst-Case (siehe oben): weiß ≥ 1,4, schwarz ≥ 2,5 | `o_kontrast` |
| AK-6 | Erzeugung der Texturen ≤ 100 ms; keine Anfragen außer an den eigenen Server; nach 30 Zügen keine zusätzlichen Texturen | `o_leistung` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Reiter Schach: Überschriften und Knöpfe in der richtigen Reihenfolge | AK-1 |
| PS-2 | Grenzwert | "Gegen Computer" wählen: Stufenwahl erscheint unter "Spielmodus", nicht unter "Optionen" | AK-1 |
| PS-3 | Normal | Fünf Symbole vorhanden, je ≥ 14 px | AK-2 |
| PS-4 | Wiederholbarkeit | Lernhilfe aus/an, 3D/2D umschalten: Symbole bleiben, Text wechselt | AK-2 |
| PS-5 | Fehlalarm | Vier gewinnt: Tipp-Knopf bleibt ohne Symbol (nur Schach ist geändert) | AK-2 |
| PS-6 | Grenzwert | 360 px Breite: Knöpfe brechen um, nichts ragt heraus | AK-3 |
| PS-7 | Normal | 412 px, 2D und 3D: Knöpfe ≥ 44 px, kein Querscroll | AK-3 |
| PS-8 | Normal | Textur hell, dunkel, Rahmen: Wertebereich und Streuung | AK-4 |
| PS-9 | Wiederholbarkeit | Dieselbe Textur zweimal erzeugen: gleiche Bildpunkte | AK-4 |
| PS-10 | Normal | Alle 64 Felder tragen eine Textur; Drehungen unterschiedlich | AK-4 |
| PS-11 | Grenzwert | Hellster Bildpunkt des hellen Felds gegen weiße Figur; dunkelster des dunklen gegen schwarze | AK-5 |
| PS-12 | Normal | Texturerzeugung gemessen | AK-6 |
| PS-13 | Fehlerfall | Alle Netzanfragen beim Öffnen von Schach in 3D gehen an den eigenen Server | AK-6 |
| PS-14 | Wiederholbarkeit | 30 Züge: Texturenzahl gleich | AK-6 |

## Gegenproben
- Verstoß: Überschriften vertauscht; Symbol an einem Knopf fehlt; Knöpfe unter 44 px; Textur zu schwach (Streuung unter 0,012) oder zu stark (Faktor unter 0,90);
  alle Felder gleich gedreht; dunkles Feld zu dunkel (Kontrast unter 2,5); Textur nach außen geladen. Jeder muss seinen Test rot machen.
- Fehlalarm: PS-5 (Vier gewinnt unverändert), PS-2 (Stufenwahl bleibt bei Spielmodus).

## Nicht Teil dieser Änderung
Marmor, Fotos als Oberfläche, geänderte Figuren, andere Spiele.

## Betroffene Schichten
Nur UI: HTML und CSS des Reiters Schach, `ChessUI` (Knöpfe in Gruppen verschieben), `Ansicht3D._baueSchach` (Texturen).

## Risiken und Kosten
Texturen kosten etwas Speicher (3 bis 5 kleine Zeichenflächen) und einmalig Rechenzeit beim ersten 3D-Bild. Ältere Browser ohne `mask-image`: Knöpfe ohne Symbol, Text bleibt.

## Ergebnis
- Vorher: 6 von 6 Tests rot. Nachher: 6 von 6 grün (`werkstatt/tests/optik_test.js`), 8 von 8 Gegenproben erkannt (`gegenproben_optik.py`).
- Messwerte: Maserung Streuung 0,021 bei Faktor 0,902 bis 1,000; Worst-Case-Kontrast weiße Figur 2,37, schwarze 2,89 vorher, jetzt 2,74 (Grenzen 1,4 und 2,5); Texturen in 14 ms erzeugt, 5 Texturen im Speicher, nach 30 Zügen unverändert.
- Beim Bauen gefunden: Die Knöpfe waren nur 42 px hoch, 3D und Lernhilfe sogar 36 px (Vorgabe 44); jetzt alle ≥ 44 px. Die Variantenwahl der Felder nach Zeilenparität hätte alle hellen Felder gleich gemacht; der Test "2 Varianten" hat das verhindert.
- Gerätetest: offen (Abnahmeliste `abnahme-schach-optik-S-W09.md`).
