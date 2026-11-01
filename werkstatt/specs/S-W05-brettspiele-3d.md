# S-W05: 3D-Ansicht für Vier gewinnt und Schach

**Status:** gebaut, freigegeben am 01.11.2026, 09:59
<!-- Freigabe durch den Betreiber im Projekt-Thread: Auswahl "Schach und Vier gewinnt zuerst" auf die Frage, welche Brettspiele eine 3D-Ansicht bekommen. -->

## Ziel
Vier gewinnt und Schach lassen sich in 3D spielen: echter Ständer mit fallenden Steinen, echte Figuren auf einem Holzbrett.
Das Brett lässt sich mit dem Finger seitlich drehen. Ein Knopf schaltet zwischen 3D und 2D um. Die anderen vier Spiele bleiben 2D.

## Rechenmodell (verbindlich)
- **Nur UI:** Eine Klasse `Ansicht3D` zeichnet den Zustand, den sie über die Control liest (`getBoardState`, Auswahl, Ziele, Schach).
  Tippen auf ein Feld ruft dieselben Handler wie die 2D-Ansicht (`handleColumnClick`, `handleSquareClick`). Entity, Boundary und Control bleiben unverändert.
- **three.js** liegt lokal in `brettspiele/lib/three.min.js` (r128, wie Luftdrift) und wird erst geladen, wenn 3D gezeigt wird.
- **Ohne WebGL** oder wenn three.js nicht lädt: 2D bleibt, der Knopf ist gesperrt mit dem Text "3D nicht möglich" (bis zum Neuladen der Seite).
- **Zeichnen nur bei Bedarf:** ein Bild nach jeder Änderung, laufend nur während Animation, Drehen oder Tipp-Markierung.
- **Vier gewinnt:** Ständer 7 × 6 mit runden Löchern, Steine als flache Zylinder. Ein neuer Stein fällt aus der Höhe über dem Ständer mit Schwerkraft
  (Fallzeit = √(2·h/g), g = 30 Felder/s², Start 7,4 Felder über dem Boden: 0,36 s in die oberste bis 0,68 s in die unterste Reihe) und federt kurz nach. Gewinnsteine leuchten 3 s pulsierend, danach ruhig hell (spart Akku). Ein Stein, der noch fällt, fällt nach dem nächsten Zug (KI) weiter. Tippen auf eine Spalte (ganze Höhe) setzt dort.
- **Schach:** Brett 8 × 8 mit Rahmen, Figuren gedrechselt (Bauer, Turm, Läufer, Dame, König; Springer mit Pferdekopf). Weiß unten.
  Ausgewählte Figur hebt sich an, Zielfelder zeigen grüne Punkte, letzter Zug ist getönt, König im Schach steht auf rotem Feld.
  Ein Zug gleitet 0,35 s in einem flachen Bogen (Springer springt höher), geschlagene Figuren versinken.
- **Drehen:** waagerechtes Ziehen dreht um höchstens ±35°; ein Ziehen über 8 px ist kein Tippen.
- **Tipp:** markiert dieselben Felder wie in 2D 1,6 s lang (blinkender Ring bzw. Geisterstein).
- **Gespeicherte Daten:** In `brettspiele.einstellungen` (Formatversion 1) kommt das Feld `ansicht` dazu, z. B. `{"connect4":"3d","chess":"2d"}`.
  Fehlt es oder ist ein Wert unbekannt, gilt "3d". Ältere Daten bleiben gültig (das Feld ist optional).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | 3D zeigt genau die Steine bzw. Figuren der Stellung (Anzahl, Art, Farbe, Feld) | `d3_stellung` |
| AK-2 | Tippen auf die Bildschirmmitte einer Spalte bzw. eines Felds führt den gleichen Zug aus wie 2D (alle 7 Spalten, 4 Felder je Ecke und Mitte) | `d3_tippen` |
| AK-3 | Ziehen über 8 px dreht (höchstens ±35°) und setzt keinen Zug | `d3_drehen` |
| AK-4 | Fallanimation: Stein startet über dem Ständer, Dauer = √(2h/g) ± 20 ms, endet auf dem Feld; Schachzug gleitet und endet auf dem Zielfeld | `d3_animation` |
| AK-5 | Auswahl, Zielfelder, Schach, Gewinnsteine und Tipp sind in 3D markiert | `d3_markierung` |
| AK-6 | Schalter 2D/3D wechselt sichtbar, bleibt nach Neuladen; kaputte oder alte Daten → 3D | `d3_schalter` |
| AK-7 | Ohne WebGL: 2D, Knopf gesperrt, keine Skriptfehler | `d3_ohne_webgl` |
| AK-8 | Ruhe: ohne Änderung höchstens 1 Bild je Sekunde gezeichnet; nach 30 Zügen gleiche Zahl an Geometrien (keine Lecks) | `d3_ruhe` |
| AK-9 | Kein Querscroll bei 412 px, keine Skriptfehler; three.js wird in 2D-Spielen nicht geladen | `d3_handy` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Vier gewinnt nach 5 Zügen: 5 Steine, Farben und Felder stimmen | AK-1 |
| PS-2 | Normal | Schach Startstellung: 32 Figuren, Arten und Felder stimmen | AK-1 |
| PS-3 | Wiederholbarkeit | Zug zurück und Neustart: 3D zeigt danach die gleiche Stellung wie 2D | AK-1 |
| PS-4 | Normal | Tippen auf jede der 7 Spalten (oben, Mitte, unten) setzt in diese Spalte | AK-2 |
| PS-5 | Normal | Schach: Tippen auf e2, dann e4 → Zug e2-e4 | AK-2 |
| PS-6 | Grenzwert | Tippen auf a8, h8, a1, h1 bei gedrehtem Brett (+35°) trifft das richtige Feld | AK-2, AK-3 |
| PS-7 | Fehlerfall | Tippen neben das Brett → kein Zug, kein Fehler | AK-2 |
| PS-8 | Missbrauch | Tippen während die KI rechnet → kein Zug | AK-2 |
| PS-9 | Grenzwert | Ziehen 7 px → Tippen; 9 px → Drehen; Ziehen um 2000 px → genau ±35° | AK-3 |
| PS-10 | Normal | Stein in Zeile 5 (unten) und Zeile 0 (oben): Fallzeit laut Formel | AK-4 |
| PS-11 | Normal | Schach e2-e4: Figur gleitet und steht am Ende auf e4 | AK-4 |
| PS-12 | Normal | Auswahl e2: Figur angehoben, e3 und e4 mit Punkt | AK-5 |
| PS-13 | Normal | Vier gewinnt gewonnen: 4 Gewinnsteine leuchten | AK-5 |
| PS-14 | Normal | Tipp in 3D: Markierung da, nach 2 s weg | AK-5 |
| PS-15 | Normal | 2D wählen, neu laden → 2D; zurück auf 3D | AK-6 |
| PS-16 | Fehlerfall | Speicher `{"formatversion":1,"ton":true,"stufen":{}}` ohne `ansicht` und mit `"ansicht":{"chess":"mond"}` → 3D | AK-6 |
| PS-17 | Fehlerfall | WebGL fehlt → 2D, Knopf "3D nicht möglich" | AK-7 |
| PS-18 | Wiederholbarkeit | 30 Züge Vier gewinnt mit Neustarts: Geometrien gleich | AK-8 |
| PS-19 | Grenzwert | 3 s ohne Eingabe: höchstens 3 Bilder | AK-8 |
| PS-20 | Normal | Tic Tac Toe geöffnet: three.js nicht geladen | AK-9 |

## Gegenproben
- Verstoß: Spalten vertauscht (Tippen trifft Spalte 6 − c); Fallzeit ohne Schwerkraft (fest 0,1 s); Drehgrenze fehlt; Ansicht nicht gespeichert; Zeichenschleife läuft dauernd. Jeder muss seinen Test rot machen.
- Fehlalarm: Ziehen um genau 8 px gilt noch als Tippen; Stellung nach Zug zurück ohne Animation ist kein Fehler.

## Nicht Teil dieser Änderung
- 3D für Tic Tac Toe, Reversi, Mühle, Mangala (folgt nach Rückmeldung). Schach aus Sicht von Schwarz.

## Betroffene Schichten
Nur UI (neue Klasse `Ansicht3D`, Knopf, Einstellung) und Boundary der Einstellungen (optionales Feld). Entity und Control unverändert.

## Risiken und Kosten
three.js 0,6 MB wird beim ersten 3D-Bild geladen (danach aus dem Browser-Speicher). Bildrate am Handy messen. WebGL im Container nur in Software.

## Ergebnis
- Vorher: 9 von 9 Tests rot (Ansicht fehlt). Nachher: 9 von 9 grün (`werkstatt/tests/brett3d_test.js`), 5 von 5 Gegenproben erkannt (`gegenproben_brett3d.py`).
- Fallzeiten: 0,36 s in die oberste, 0,68 s in die unterste Reihe. Ruhe: höchstens 3 Bilder in 3 s; 30 Züge ohne neue Geometrien oder Texturen.
- Unabhängige Prüfung (zweiter Agent): Tests für Schach ergänzt (Zug zurück, Neustart, echte Klicks bei gedrehtem Brett, Tippen neben das Brett),
  Fallzeiten als Zahl geprüft; behoben: KI-Zug brach den Fall des eigenen Steins ab, Tipp-Markierung blieb nach einem Zug stehen, Gewinnsteine fehlten beim Umschalten auf 3D nach Spielende.
- Fehler beim Nachtesten gefunden: Tippen direkt nach dem Drehen nutzte noch die alte Kameralage (1 von 3 Läufen rot). Ursache: Kamera-Matrix wurde erst beim nächsten Bild erneuert. Behoben, danach 5 von 5 Läufen grün.
- Bildrate und Bedienung am Handy: Gerätetest offen.
