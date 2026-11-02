# S-W14: Echte Grundrisse für die Gebäude der Oer-Runde

**Status:** gebaut, freigegeben am 02.11.2026, 14:47
<!-- Freigabe durch den Betreiber im Projekt-Thread: Frage "Ist es möglich die Gebäude Formen vom Original viel besser wiederzugeben" und Wahl "Erst Grundrisse, dann Details" -->

## Anlass
Die Gebäude der Oer-Runde (S-W12) sind Standardmodelle je Typ. Der Betreiber will die echten Formen sehen.

## Rechenmodell (verbindlich)
- Neuer Schritt `grundriss.py` (Abruf, braucht Netz): holt je Wahrzeichen den Gebäudeumriss aus OpenStreetMap (der Umriss, der den Ort enthält, sonst der nächste bis 40 m) und speichert ihn als `grundrisse` in der Datendatei. Danach ist alles offline.
- `baue.py` rechnet für die Typen `mosque`, `rathaus`, `markt`, `kirche` den Umriss in den lokalen Raum des Wahrzeichens: Mitte des Umrisses = Standort, Norden oben, um die Drehung `rot` zurückgedreht, damit die Form in der Welt richtig liegt. Größe: Spielmaßstab mal Faktor `f`, so dass die größte Ausdehnung der Typgröße entspricht (Moschee 46, Rathaus 70, Markt 96, Kirche 50 Welteinheiten) und der Umkreis höchstens 0,9 × r × s bleibt (Platz zur Fahrbahn bleibt). Vereinfacht auf höchstens 24 Ecken (Douglas-Peucker, Toleranz 0,8, bei Bedarf größer).
- Ausgabe je Wahrzeichen: `fuss` (Liste [x, z]) und `fuss_faktor` (f). Fehlt der Umriss, bleibt das Standardmodell (kein `fuss`). Typen `arena` und `headframe` behalten ihr Modell.
- Fehler "Grundriss": Umriss kein Ring aus Zahlenpaaren, weniger als 3 Punkte, Zahl ungültig (NaN, Text), Fläche unter 4 m².
- Spiel (`foot` im Eintrag, nur Darstellung): `KitUI.footParts` baut den Körper aus dem Umriss (Höhe: Moschee 22, Kirche 20, Rathaus 22, Markt 16) mit Dachplatte und Merkmalen: Moschee Kuppel und Minarett, Kirche Westturm mit Spitze, Rathaus Uhrturm mit Kupferspitze, Markt Hochschild. Mit `foot` gilt der Maßstab 1.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Jedes Wahrzeichen der vier Typen mit Umriss in den Daten hat `fuss` mit 3 bis 24 Ecken (mindestens 9 in der Oer-Runde); `arena` und `headframe` haben keines | `w_fuss` |
| AK-2 | Lage: zurück in die Welt gedreht liegen die vier Ränder des Umrisses höchstens 2,5 Einheiten neben dem echten (skalierten) Umriss; Fläche ±20 %; größte Ausdehnung ≤ Typgröße + 0,5; Umkreis ≤ 0,9·r·s + 0,5 | `w_fuss` |
| AK-3 | Fehlerfälle: zwei Punkte, Text, Gerade (Fläche 0), kein Ring, NaN geben Fehler "Grundriss" (Rückgabewert 1, keine Ausgabedatei); ohne `grundrisse` baut alles wie bisher | `w_fuss_fehler` |
| AK-4 | Im Spiel stimmt `foot` mit der gebauten Datei überein | `w_fuss_einbau` |
| AK-5 | Teile je Bauwerk: ≥ 3, Körperhöhe wie in der Tabelle, Körper deckt den Umriss (±0,5), Merkmal höher als 40 (Moschee, Kirche, Rathaus) bzw. 14 (Markt); Moschee mit Kuppel | `w_fuss_teile` |
| AK-6 | In der Szene stehen die Grundriss-Gebäude mit Maßstab 1 und ≥ 3 Teilen an ihrem Standort | `w_fuss_szene` |
| AK-7 | Rennen weiter fahrbar: 6 von 6 im Ziel, 0 Wandkontakte (Gebäude stehen nicht auf der Strecke) | `st_fahrt` (S-W11) |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | 9 echte Umrisse | AK-1, AK-2 |
| PS-2 | Grenzwert | Kirche mit 50 Ecken wird auf höchstens 24 vereinfacht | AK-1 |
| PS-3 | Grenzwert | Große Fläche (Kaufland, 117 m): Größe wird begrenzt | AK-2 |
| PS-4 | Fehlerfall | Zwei Punkte, kein Ring | AK-3 |
| PS-5 | Missbrauch | Text oder NaN in den Koordinaten, Gerade | AK-3 |
| PS-6 | Fehlalarm | Keine `grundrisse` in den Daten: Standardmodelle wie bisher | AK-3 |
| PS-7 | Fehlalarm | Stadion und Fördergerüst bekommen keinen Umriss | AK-1 |
| PS-8 | Normal | Szene baut sich mit Umrissen auf | AK-6 |

## Gegenproben
- Verstoß: Umriss nicht zurückgedreht; nicht vereinfacht; Größe nicht begrenzt; Flächenprüfung aus; Körper zu niedrig; Moschee ohne Kuppel; Umriss in der Szene nicht benutzt. Jeder muss seinen Test rot machen.
- Fehlalarm: PS-6, PS-7.

## Nicht Teil dieser Änderung
Echte Gebäudehöhen (in OpenStreetMap fehlen sie fast überall), Dachformen nach Daten, Häuserzeilen, Feinschliff mit Fotos (Teil 2 "Details": nur nach Wunsch des Betreibers je Bauwerk).

## Betroffene Schichten
Werkzeug (Python), Daten und im Spiel nur die 3D-Darstellung (UI). Keine Regeln.

## Risiken und Kosten
Umrisse sind bis 24 Ecken je Gebäude, kaum Mehrkosten. Flache Dachplatten statt echter Dachformen. Quelle bleibt "© OpenStreetMap-Mitwirkende".

## Ergebnis (02.11.2026)
- 9 von 9 passenden Gebäuden haben einen echten Umriss (Moscheen, Rathaus I, Kaufland, 5 Kirchen), Ecken 8 bis 24. Kein Umriss für Stadion (nur Spielfeld) und Schacht 1; Schacht 3 und das Stadion behalten ihr Modell. Rathaus II und Schacht 2 sind weiter verworfen (S-W12).
- Alle neuen Tests waren vor dem Bau rot. Gegenproben: 20 von 20 erkannt (7 neu). Einen Messfehler im Test (Faktor als f/k statt f) hat der Lagetest sofort gezeigt und ich habe ihn behoben.
- Vorschau der neun Bauwerke: `docs/notizen/oer-gebaeude-grundrisse.png`.
- Änderung im Spiel etwa 55 Zeilen, daher keine zweite Prüfung nötig (unter 150 Zeilen).
- Offen: Teil 2 "Details" (Dachformen, Fenster, genauere Türme) nach Handyabnahme und Wunsch des Betreibers.
