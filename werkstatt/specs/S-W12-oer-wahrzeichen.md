# S-W12: Wahrzeichen der Oer-Runde nach echten Orten

**Status:** gebaut, freigegeben am 02.11.2026, 12:33
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Versuche so viel wie möglich auf dieser Strecke vom Original einzubauen. Die 3 Moscheen, Berliner Platz mit Rathaus und großem Kaufland Einkaufscenter, ..." und "Fahre auch den Rest ab". -->

## Anlass
Die Oer-Runde (S-W11) hat noch keine Gebäude. Der Betreiber will, dass die echten Orte der Stadt stehen: Moscheen, Rathaus, Kaufland am Berliner Platz und weitere.

## Rechenmodell (verbindlich)
- Das Werkzeug aus S-W11 bekommt einen Schritt **Wahrzeichen**: Der Auftrag listet Orte (`osm`-Kennung aus der Datendatei, Typ, Größe `s`, Freiraum `r`, Name). Die Datendatei enthält dafür `orte` (benannte Gebäude und Orte mit Mitte). Der Abruf holt sie mit.
- Umrechnung: derselbe Weg wie bei den Stützpunkten (Meter, Maßstab, Nord oben). Ein Wahrzeichen steht an seinem echten Ort. Liegt es zu nah an der Fahrbahn (Abstand zur Mittellinie in Spielgröße < Randbreite 61 + 0,6 × r × s), wird es entlang der Normalen nach außen geschoben, bis der Abstand reicht; die Verschiebung wird in Metern gemeldet. Es zeigt mit der Vorderseite zur Fahrbahn.
- Zwei Wahrzeichen müssen mindestens 0,6 × (r₁·s₁ + r₂·s₂) auseinander stehen; sonst fällt das spätere weg und wird als "verworfen" mit Grund gemeldet. Liegt ein Ort außerhalb des Spielraums (−150 bis 1350 in Strecken-Einheiten), wird er ebenfalls verworfen.
- Typen: vorhanden im Spiel: `mosque` (mit türkischer Fahne), `arena` (Stadion), `headframe` (Fördergerüst der Zeche). **Neu im Spiel** (nur Daten der 3D-Ansicht, keine Regeländerung): `rathaus` (Backsteinbau mit Uhrturm), `markt` (Einkaufscenter mit rotem Band, bewusst ohne Markenzeichen), `kirche` (Backsteinkirche mit Turm).
- Eintrag in das Spiel: `einbauen.py` schreibt die Liste als `landmarks` der Strecke `oer` (zwischen den Markierungen), mit Namen im Kommentar.
- Bestehende Strecken bleiben unverändert (Prüfsumme S-W11); die Typen der neuen Gebäude kommen in einen eigenen Block der Bautabelle.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Die 6 Pflicht-Orte stehen in der Strecke (nicht verworfen): Fatih-Sultan-Mehmed-Moschee, DITIB-Moschee, Rathaus I, Kaufland, Stimberg-Stadion, Zeche Ewald Schacht 3 | `w_pflicht` |
| AK-2 | Jedes nicht verschobene Wahrzeichen liegt höchstens 1 Einheit neben seiner echten Abbildung; jedes verschobene hat Abstand zur Fahrbahn ≥ Mindestabstand und meldet die Verschiebung ≤ 400 m | `w_ort` |
| AK-3 | Kein Wahrzeichen näher an der Fahrbahn als 61 + 0,6·r·s; je zwei mindestens 0,6·(r₁s₁ + r₂s₂) auseinander; alle im Spielraum | `w_abstand` |
| AK-4 | Verworfene Orte stehen mit Grund in `verworfen`; zweimal bauen ergibt dieselbe Datei; Typen nur aus der erlaubten Liste, sonst Fehler "Typ" | `w_fehler` |
| AK-5 | Computerfahrer: weiter 6 von 6 im Ziel, 0 Wandkontakte, Runde 15 bis 40 s (Wahrzeichen stehen nicht auf der Strecke) | `st_fahrt` (S-W11) |
| AK-6 | Im echten Rennen auf `oer`: Szene baut sich ohne Skriptfehler auf; die drei neuen Typen liefern je ≥ 2 Teile; keine fremde Anfrage; Sichtprüfung des Bildes am Handy (Abnahmeliste), da eine Pixelmessung im Software-Renderer nicht stabil ist | `w_szene` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Echte Daten: 6 Pflicht-Orte plus Kirchen und weitere Schächte | AK-1 |
| PS-2 | Grenzwert | Kaufland liegt nahe der Startlinie: wird nach außen geschoben, nicht verworfen | AK-2, AK-3 |
| PS-3 | Grenzwert | Zwei Schächte 200 m auseinander: das spätere wird verworfen oder steht weit genug | AK-3 |
| PS-4 | Fehlerfall | Unbekannte `osm`-Kennung im Auftrag: Fehler "Ort nicht gefunden" | AK-4 |
| PS-5 | Missbrauch | Unerlaubter Typ, `s` null oder negativ, `r` Text: Fehler mit Meldung | AK-4 |
| PS-6 | Wiederholbarkeit | Zweimal bauen: byteweise gleich | AK-4 |
| PS-7 | Normal | Rennen starten: neue Gebäude werden gebaut | AK-6 |
| PS-8 | Fehlalarm | Ort außerhalb des Raums wird verworfen und gemeldet, ohne den Bau abzubrechen | AK-3, AK-4 |

## Gegenproben
- Verstoß: Wahrzeichen nicht verschoben (steht auf der Fahrbahn); Mindestabstand untereinander ignoriert; Typ `rathaus` fehlt im Spiel; Pflicht-Ort aus dem Auftrag gestrichen; Ausgabe mit Uhrzeit; Prüfung der Typen aus. Jeder muss seinen Test rot machen.
- Fehlalarm: PS-8.

## Nicht Teil dieser Änderung
Straßenzüge und Häuserzeilen, Berge (Stimberg, Halde), Gewässer, Namensschilder, dritte Moschee (nicht in OpenStreetMap vermerkt; Betreiber nennt Ort oder Straße), Markenzeichen von Geschäften.

## Betroffene Schichten
Werkzeug (Python) und Daten; im Spiel nur die 3D-Darstellung (drei neue Bautypen in der Bautabelle der Wahrzeichen). Keine Spielregeln.

## Risiken und Kosten
Drei neue Modelle erhöhen die Bildkosten kaum (je wenige Quader). Wahrzeichen nah an der Strecke können die Sicht verdecken; der Abstand ist deshalb Pflicht (Rand plus Platzbedarf).

## Ergebnis (02.11.2026)
- 14 Orte angefragt, 12 stehen, 2 verworfen mit Grund (Zeche Ewald Schacht 2: zu nah an Schacht 1; Rathaus II: zu nah an Rathaus I). Alle 6 Pflicht-Orte stehen.
- Verschoben (m): Fatih-Moschee 107, DITIB-Moschee 123, Rathaus I 81, Kaufland 128, Christus-König-Kirche 71; Grenze 400 m.
- Computerfahrer: 6 von 6 im Ziel, 0 Wandkontakte, Bestrunde 21,7 bis 22,8 s (Par 77 unverändert).
- Gegenproben: 7 von 7 erkannt. Unabhängige Prüfung (Sonnet, nur gegen Spec): keine Blocker. Behoben: AK-6 ehrlich auf Sichtprüfung am Handy gekürzt (Pixelmessung im Software-Renderer nicht stabil), Test für verworfene Orte mit Grund ergänzt, tote Zeilen entfernt.
- Bekannte Lücken: Auftragsfeld `pflicht` (Abbruch, wenn ein Pflicht-Ort verdrängt wird) ist im Test, aber ohne eigene Gegenprobe; fehlende `lat`/`lon` im Ortsdatensatz gibt eine unspezifische Meldung. Dritte Moschee und Kaufland-Logo bleiben draußen.
