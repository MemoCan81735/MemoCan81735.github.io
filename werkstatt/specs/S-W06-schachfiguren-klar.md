# S-W06: Schachfiguren klar unterscheidbar (2D und 3D)

**Status:** gebaut, freigegeben am 01.11.2026, 12:50 (Befund des Betreibers ist der Auftrag)
<!-- Anlass: Befund vom Gerät durch den Betreiber im Projekt-Thread: "Die Schachfiguren sind nicht klar unterscheidbar in 2d und 3d". -->

## Anlass
- 2D: Die Figuren sind Schriftzeichen (♙ ♘ …). Weiß ist nur ein dünner Umriss auf hellem Feld, das Aussehen hängt von der Schrift des Handys ab, die Figuren sind klein.
- 3D: König, Dame und Läufer unterscheiden sich nur an kleinen Köpfen. Weiße Figuren haben fast die Farbe der hellen Felder.

## Rechenmodell (verbindlich)
- **2D:** eigene Figuren als SVG (keine Schrift), sechs klar verschiedene Umrisse: Bauer (Kugel), Turm (Zinnen), Springer (Pferdekopf),
  Läufer (Mitra mit Schlitz), Dame (Krone mit Zacken und Kugeln), König (Krone mit Kreuz). Der König ist mindestens 80 % so hoch wie das Feld, jede Figur mindestens 60 % so breit (gemessen an der gezeichneten Fläche).
  Weiß: weiße Fläche mit fast schwarzem Rand; Schwarz: fast schwarze Fläche mit weißen Innenlinien. Auch die Knöpfe zur Bauernumwandlung zeigen diese Figuren.
- **3D:** Höhen gestuft Bauer < Turm < Springer < Läufer < Dame < König mit mindestens 0,1 Feld Abstand. König mit großem Kreuz, Dame mit Zackenkrone,
  Läufer mit Kugel und Schlitz, Turm mit vier Zinnen. Holzfarbene helle Felder, damit weiße Figuren abstechen.
  Nachtrag 01.11.2026, 13:22 (Wunsch des Betreibers "Konturstriche in 3D deutlicher"): jede Figur hat einen Konturstrich, mindestens 1,5 px breit auf dem Handy (412 px Breite). Weiße Figuren fast schwarz, schwarze Figuren hellgrau (Nachtrag 13:22: "Und bei den schwarzen Figuren").
- Nur UI. Keine neuen Daten, keine Berechtigung.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | 2D: alle Figuren sind SVG ohne Schriftzeichen; König ≥ 80 % der Feldhöhe, jede Figur ≥ 60 % der Feldbreite | `f_2d_svg` |
| AK-2 | 2D: Umrisse der 6 Arten paarweise verschieden: Überdeckung (Schnitt durch Vereinigung) < 0,8 | `f_2d_umriss` |
| AK-3 | 2D: Kontrast Rand von Weiß zum hellen Feld ≥ 7, Schwarz zum hellen Feld ≥ 7, Schwarz zum dunklen Feld ≥ 3 | `f_2d_kontrast` |
| AK-4 | 3D: Höhen streng gestuft mit ≥ 0,1 Abstand, König mindestens 0,12 höher als Dame | `f_3d_hoehen` |
| AK-5 | 3D: Farbkontrast weiße Figur zu hellem Feld ≥ 1,4, schwarze Figur zu dunklem Feld ≥ 2,5 | `f_3d_kontrast` |
| AK-6 | Umwandlung zeigt die Figuren in der Farbe des Spielers am Zug | `f_2d_svg` |
| AK-7 | 3D: jedes Körperteil jeder Figur hat einen Konturstrich ≥ 1,5 px breit bei 412 px; Weiß fast schwarz, Schwarz hellgrau | `f_3d_kontur` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Startstellung 2D: 32 SVG-Figuren, kein Text | AK-1 |
| PS-2 | Grenzwert | Breite 412 px (kleinstes Feld): König ≥ 80 % hoch, schmalste Figur ≥ 60 % breit | AK-1 |
| PS-3 | Normal | Alle 15 Paare der Arten: Überdeckung < 0,8 | AK-2 |
| PS-4 | Fehlalarm | Gleiche Art in Weiß und Schwarz ist kein Verstoß (gleicher Umriss erlaubt) | AK-2 |
| PS-5 | Normal | Farben aus der Seite lesen, Kontrast rechnen | AK-3 |
| PS-6 | Normal | 3D-Höhen messen (Begrenzungsquader) | AK-4 |
| PS-7 | Normal | 3D-Materialfarben gegen Feldfarben | AK-5 |
| PS-8 | Grenzwert | Umwandlung für Schwarz: schwarze Figuren auf den Knöpfen | AK-6 |
| PS-9 | Normal | Alle 32 Figuren der Startstellung: Kontur je Körperteil, Breite am fernsten Feld (a8) gemessen | AK-7 |
| PS-10 | Normal | Bild der Startstellung: am weißen Bauern e2 (helles Feld) dunkle, am schwarzen Bauern e7 (dunkles Feld) helle Bildpunkte | AK-7 |

## Gegenproben
- Verstoß: alle Arten mit dem Bauern-Umriss; weißer Rand statt schwarzem; Dame so hoch wie König; helle Felder wieder fast weiß; Kontur zu dünn (0,01); schwarze Figuren mit dunkler Kontur. Jeder muss seinen Test rot machen.
- Fehlalarm: siehe PS-4.

## Ergebnis
- Vorher: 5 von 5 Tests rot (2D Schriftzeichen, 3D Läufer 1,08 und Dame 1,16 fast gleich hoch, Kontrast weiße Figur zu hellem Feld 1,16).
- Nachher: 5 von 5 grün, 4 von 4 Gegenproben erkannt (`gegenproben_schach_figuren.py`).
- 2D: König 86 % der Feldhöhe, schmalste Figur 71 % der Feldbreite, größte Überdeckung zweier Arten 0,79 (Bauer und Läufer). Kontraste: Rand Weiß zu hellem Feld 16, Schwarz zu dunklem Feld 5,1.
- 3D: Höhen Bauer 0,74, Turm 0,92, Springer 1,04, Läufer 1,28, Dame 1,40, König 1,57. Kontrast weiße Figur zu hellem Feld 2,37, schwarze zu dunklem 2,89.
- Rückblick: Früheste Stufe, die das hätte finden können, ist die Spec S-W05 (dort fehlte ein Kriterium "Figuren unterscheidbar", gemessen statt angesehen). Ab jetzt hat jede Spec mit Spielfiguren ein Messkriterium für Unterscheidbarkeit und Kontrast.
- Nachtrag Kontur (13:22): Strich 1,56 px breit am fernsten Feld bei 396 px Leinwand; Weiß fast schwarz, Schwarz hellgrau. 6 von 6 Tests grün, 7 von 7 Gegenproben erkannt.
  Eckige Teile (Kreuz, Zinnen, Pferdekopf) bekommen eine vergrößerte Kopie statt Aufblähen, sonst reißt die Kontur an den Kanten auf (im Bild gesehen und behoben).
