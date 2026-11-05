# S-W15: Mühle verstehen und gut spielen (Stufe 1)

**Status:** gebaut, freigegeben am 04.11.2026, 21:34
<!-- Freigabe durch den Betreiber im Projekt-Thread: "Das mühle Spiel bitte stark verbessern. Die Regeln die angewendet dort kenne ich nicht"
     und Wahl "Beide Stufen, erst Stufe 1" (Stufe 1: Einführung beim ersten Start, ?-Knopf, erlaubte Punkte leuchten, geschützte Steine markiert,
     Statuszeile in Klartext, Weiß beginnt, "Springen", Unentschieden bei dreifacher Wiederholung, Computer in drei Stärken mit Tipp und Warnung).
     Einführung: Variante noch offen (Karte "Welche Einführung soll Mühle bekommen?"), gebaut wird die Empfehlung "Beides". -->

## Anlass
Befund vom Gerät: Der Betreiber kennt die Regeln von Mühle nicht, das Spiel erklärt sie nirgends. Prüfung des Codes: Die Regeln sind die üblichen
(9 Steine, Setzen, Ziehen, Springen mit 3 Steinen, Mühle nimmt einen Stein, Steine in Mühlen geschützt, verliert mit 2 Steinen oder ohne Zug).
Abweichungen und Mängel: keine Erklärung, "Fliegen" statt "Springen", Schwarz beginnt, kein Unentschieden (Endspiel kann endlos laufen),
Computer rechnet nur einen Zug voraus, Punkte nur 24 px groß (unter 44 px), eigene ziehbare Steine nicht markiert, keine Warnung vor Mühlen des Gegners.

## Anwendungsfall 1: Erster Start
- Akteur: Spieler am Handy, kennt Mühle nicht
- Ziel: die Regeln in unter 2 Minuten verstehen und sofort spielen
- Auslöser: tippt zum ersten Mal auf den Reiter "Mühle"
- Gefühl: "Ach so, das ist ja einfach", Lust auf die erste Partie
- U-1: sieht statt der leeren Partie die Übung "1 von 5: Setzen" und einen leuchtenden Punkt mit Sprechblase "Hier tippen"
- U-2: setzt Steine, bildet in Übung 2 eine Mühle; die Linie leuchtet gelb auf, die Statuszeile sagt "Mühle! Nimm einen Stein von Schwarz"
- U-3: nimmt in Übung 3 einen Stein weg; ein Stein in einer Mühle trägt einen Schild und lässt sich nicht nehmen
- U-4: zieht in Übung 4 einen Stein zum leuchtenden Nachbarpunkt und springt in Übung 5 mit 3 Steinen auf einen beliebigen Punkt
- U-5: sieht "Geschafft! Jetzt eine echte Partie" und spielt gegen den Computer; beim nächsten Öffnen kommt die Übung nicht wieder
- Alternativen: tippt "Überspringen"; tippt auf einen falschen Punkt (Hinweis, nichts passiert); lädt neu mitten in der Übung (Übung beginnt neu); Speicher blockiert (Übung kommt jedes Mal, Spiel läuft)
- Erfolgsmaß: Übung in höchstens 5 Schritten mit je einem Tippziel; danach ohne Hilfe eine regelgerechte Partie

## Anwendungsfall 2: Eine Partie gegen den Computer
- Akteur: Spieler am Handy
- Ziel: eine Partie spielen und dabei immer wissen, was gerade erlaubt ist
- Auslöser: tippt auf "Gegen Computer" oder "Neu starten"
- Gefühl: hat alles im Griff, wird vom Computer gefordert, ärgert sich nicht über Fehlklicks
- U-6: Weiß (Spieler) beginnt; die Statuszeile sagt in Klartext, was zu tun ist, z. B. "Setze einen Stein auf einen freien Punkt (noch 9)"; freie Punkte leuchten grün; der Vorrat ist als Steine neben dem Brett sichtbar
- U-7: droht Schwarz eine Mühle (zwei Steine in einer Linie, dritter Punkt frei und erreichbar), zeigt ein oranges Ausrufezeichen den Punkt, die Statuszeile warnt (Lernhilfe an)
- U-8: in der Ziehphase tragen eigene ziehbare Steine einen Ring; nach dem Antippen leuchten die Zielpunkte
- U-9: hat ein Spieler nur noch 3 Steine, steht "Springen: Du darfst auf jeden freien Punkt"
- U-10: der Computer zieht in der gewählten Stärke; "stark" gewinnt gegen den bisherigen Computer fast immer
- U-11: kommt dieselbe Stellung zum dritten Mal vor, endet die Partie "Unentschieden" und wird so gezählt
- Alternativen: zu zweit an einem Handy; Tipp-Knopf; Zug zurück; Neuladen mitten in der Partie (Stand bleibt); sehr schnelles Doppeltippen
- Erfolgsmaß: kein Tippen ohne sichtbare Reaktion; Computer "stark" rechnet unter 1 s je Zug

## Anwendungsfall 3: Regeln nachschlagen
- Akteur: Spieler mitten in einer Partie
- Ziel: eine Regel nachlesen, ohne die Partie zu verlieren
- Auslöser: tippt auf den "?"-Knopf
- Gefühl: findet die Antwort in Sekunden
- U-12: sieht drei Karten (Setzen, Mühle, Ziehen und Springen) mit Mini-Brett; "Übung wiederholen" startet die Übung, "Schließen" führt zurück
- U-13: die Partie steht danach unverändert da
- Alternativen: Computer ist gerade am Zug (Karten öffnen trotzdem, Computer wartet); Querformat
- Erfolgsmaß: Rückkehr ohne Änderung der Stellung

## Rechenmodell (verbindlich)
- **Regeln (Entity):** Weiß beginnt (`currentPlayer` startet mit 'W'). Gespeicherte alte Partien bleiben gültig (der Spieler am Zug steht im Spielstand).
- **Unentschieden:** In der Zieh- und Springphase zählt die Entity jede Stellung (24 Punkte plus Spieler am Zug, ohne offene Wegnahme). Erreicht eine Stellung die Zahl 3, endet die Partie mit `winner: 'Draw'` (wie bei den anderen Spielen, zählt in der Statistik). Der Zähler `stellungen` gehört zum Spielstand (`toJSON`, `clone`, Zug zurück). Eine Wegnahme leert ihn, weil frühere Stellungen danach unerreichbar sind. Die erste Stellung der Ziehphase zählt mit.
- **Drohung:** Punkt p droht für Spieler s, wenn eine Mühlenlinie zwei Steine von s und p frei hat und s im nächsten eigenen Zug p besetzen kann (Setzphase: immer; Ziehphase: ein eigener Stein außerhalb dieser Linie ist Nachbar von p; Springen: immer).
- **Geschützt:** Stein in einer Mühle, solange der Besitzer Steine außerhalb von Mühlen hat (bisherige Regel `canRemove`).
- **Computer:** kennt den Wiederholungszähler (dritte gleiche Ziehstellung zählt in der Suche als 0). Pausiert die UI (Übung, Karten), wird ein fertig gerechneter Zug verworfen und danach neu gerechnet. Alpha-Beta-Suche über ganze Züge (Setzen oder Ziehen, bei Mühle samt Wegnahme). Tiefe: leicht 1, mittel 2, stark 4 Halbzüge, schrittweise vertieft; statt einer Uhr begrenzt eine Knotenzahl (60 000) die Arbeit, bei Überschreitung gilt die letzte vollständige Tiefe (gleiche Eingabe, gleicher Zug); Fehlerquote wie bisher (0,4 / 0,15 / 0) über den hineingereichten Zufall. Bewertung aus Sicht des Computers: 100 × Steindifferenz (auf dem Brett plus Vorrat) + 8 × eigene Mühlen − 8 × gegnerische + 3 × offene eigene Drohungen − 3 × gegnerische + 1 × Beweglichkeit (in der Ziehphase); Sieg ±100000, Unentschieden 0. Gleichstand: der zuerst gefundene Zug (feste Reihenfolge der Punkte), damit gleich ist, was gleich anfängt.
- **Übung (Control):** 5 feste Stellungen mit je einem Zielpunkt; nur der Zielpunkt zählt, alle anderen Tipps zeigen einen Hinweis. Die Übung läuft auf einer eigenen Entity, die echte Partie bleibt unberührt.
- **Gespeicherte Daten:** In `brettspiele.einstellungen` (Formatversion 1) kommt das optionale Feld `muehleEinfuehrung: true` (Übung gesehen) dazu; fehlt es, startet die Übung. Lernhilfe-Schalter nutzt das vorhandene Feld `lernen` mit Schlüssel `muehle`. Ältere Daten bleiben gültig.
- **Schichten:** Regeln, Drohungen, Wiederholung und Suche in Entity/Boundary/Control, Texte und Bilder in der UI. Kein Zufall und keine Zeit in Entity oder Control (Zufall hineingereicht).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Beim ersten Öffnen erscheint die Übung (U-1) mit genau 5 Schritten, je Schritt genau 1 leuchtender Zielpunkt mit Sprechblase; falscher Punkt ändert nichts | `mu_uebung` |
| AK-2 | Übung 2 bis 5 zeigen Mühle (gelbe Linie mindestens 0,8 s), Wegnahme mit Schild auf geschütztem Stein, Ziehen und Springen (U-2, U-3, U-4) | `mu_uebung` |
| AK-3 | Nach der Übung oder "Überspringen" ist `muehleEinfuehrung` gespeichert, beim Neuladen kommt keine Übung (U-5); kaputte Einstellungen: Übung kommt, kein Skriptfehler | `mu_uebung_speicher` |
| AK-4 | Weiß beginnt; die Statuszeile nennt in jedem der 5 Zustände (Setzen, Ziehen, Springen, Wegnehmen, Ende) die Handlung und bei Setzen die Zahl im Vorrat; Vorrat als 9 Steine je Seite sichtbar (U-6) | `mu_status` |
| AK-5 | Jeder Punkt ist mindestens 44 × 44 px tippbar (Handy 412 px breit); leuchtende Punkte: Setzen alle freien, Ziehen eigene ziehbare Steine (Ring) und nach Auswahl genau die Ziele, Wegnehmen genau die nehmbaren; geschützte tragen einen Schild (U-6, U-8) | `mu_markierung` |
| AK-6 | Drohung: in 6 festen Stellungen genau die erwarteten Punkte (auch 0), Ausrufezeichen und Warnsatz nur bei Lernhilfe an (U-7) | `mu_drohung` |
| AK-7 | Springen: Text "Springen" bei 3 Steinen, das Wort "Fliegen" kommt nicht mehr vor (U-9) | `mu_status` |
| AK-8 | Stärke: "stark" gewinnt gegen den bisherigen 1-Zug-Computer in mindestens 16 von 20 Partien (Eröffnung durch 2 zufällige Setzzüge je Saat), verliert höchstens 2; gegen die eigene Suche mit Tiefe 1 mindestens 10 Siege von 20 und keine Niederlage (Nachtrag nach der Gegenprobe: Tiefe 1 mit neuer Bewertung schlägt den alten Computer ebenfalls); Rechenzeit je Zug im Mittel unter 400 ms, höchstens 1500 ms (U-10) | `mu_staerke` |
| AK-9 | Drittes Vorkommen derselben Stellung (zweite Wiederholung) beendet die Partie als Unentschieden, gezählt in der Statistik; zweites Vorkommen nicht; der Computer zieht im Vorteil nicht ins Unentschieden; Zug zurück nimmt die Zählung mit zurück (U-11) | `mu_remis` |
| AK-10 | "?" zeigt 3 Karten, "Schließen" lässt die Stellung gleich (gleicher Spielstand), "Übung wiederholen" startet Übung 1 und danach steht die Partie wie vorher (U-12, U-13) | `mu_hilfe` |
| AK-11 | Bild aus Spielersicht (412 × 915) je Schritt der Übung und je Zustand der Partie ohne Skriptfehler; Mühlenlinie, Ringe und Schild im Bild messbar (mindestens 200 Bildpunkte der Markierungsfarbe) | `mu_bilder` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Erster Start, Übung 1 bis 5 durchtippen | AK-1, AK-2 |
| PS-2 | Fehlerfall | Falschen Punkt tippen in jeder Übung | AK-1 |
| PS-3 | Normal | Neuladen nach der Übung | AK-3 |
| PS-4 | Missbrauch | Einstellungen als kaputter Text gespeichert | AK-3 |
| PS-5 | Fehlerfall | Speicher wirft Fehler (blockiert) | AK-3 |
| PS-6 | Normal | Neue Partie: Weiß beginnt, Statuszeile in allen 5 Zuständen | AK-4, AK-7 |
| PS-7 | Grenzwert | Vorrat bei 9, 1 und 0 Steinen | AK-4 |
| PS-8 | Normal | Markierungen in Setzen, Ziehen, Wegnehmen | AK-5 |
| PS-9 | Grenzwert | Alle gegnerischen Steine in Mühlen: dann sind alle nehmbar, kein Schild | AK-5 |
| PS-10 | Normal | Drohung Setzphase, Ziehphase, Springen | AK-6 |
| PS-11 | Grenzwert | Zwei Steine in Linie, aber kein eigener Stein kann den dritten Punkt erreichen: keine Drohung | AK-6 |
| PS-12 | Fehlerfall | Lernhilfe aus: keine Warnung | AK-6 |
| PS-13 | Normal | 20 Partien stark gegen alt | AK-8 |
| PS-14 | Grenzwert | Rechenzeit im Endspiel mit Springen (viele Züge) | AK-8 |
| PS-15 | Wiederholbarkeit | Zwei Läufe mit gleicher Saat: gleiche Züge | AK-8 |
| PS-16 | Grenzwert | Stellung zweimal, dann dreimal | AK-9 |
| PS-17 | Missbrauch | Zug zurück nach dem Unentschieden | AK-9 |
| PS-18 | Normal | ? öffnen und schließen mitten in der Partie | AK-10 |
| PS-19 | Missbrauch | ? öffnen, während der Computer gleich zieht und während er schon rechnet (Rechnung 800 ms); zehnmal schnell tippen; Neustart während der Rechnung, dann sofort ziehen | AK-10 |
| PS-20 | Normal | Bilder aller Schritte und Zustände | AK-11 |
| PS-21 | Wiederholbarkeit | Bilder zweimal gleich (gleiche Saat) | AK-11 |
| PS-22 | Fehlerfall | Altes gespeichertes Spiel mit Schwarz am Zug lädt weiter; alter Stand gegen den Computer behält dessen Seite (Weiß) bis zum Neustart | AK-4 |

## Gegenproben
- Verstoß: Schwarz beginnt wieder; Punktgröße 24 px; Drohung ohne Erreichbarkeitsprüfung; Suche Tiefe 1 bei "stark"; Wiederholung ohne Zählung; Einführung ohne Speichern; "?" verändert die Partie. Jeder muss seinen Test rot machen.
- Fehlalarm: PS-9 (alle in Mühlen, also nehmbar), PS-11 (unerreichbare Linie ist keine Drohung), PS-22 (alter Spielstand).

## Technisches Design (Phase 3)
- Schnittstellen: Entity `MuehleEntity` neu `drohungen(s)`, `istGeschuetzt(i)`, Zähler `stellungen`; Boundary `MuehleBoundary` neu `getDrohungen`, `istGeschuetzt`, `getZiehbare`, `getMuehlenLinien`, `getSuchStand`; Engine `AIEngines.muehle(stand, spieler, tiefe, knotenMax)` liefert `{setzen}` oder `{von, nach}` mit optional `{entfernen}`, läuft über `AIStrategy` im Web Worker; Control `MuehleControl.ansicht(lernen)` liefert nur Daten (Ziele, Ringe, nehmbar, Schilder, Drohungen, Mühlenlinien), `performAiAction()` ist asynchron und führt je Aufruf eine Aktion aus (geplante Wegnahme wird gemerkt); neue Control `MuehleUebungControl` (`starte`, `tippe`, `weiter`, `ansicht`) auf eigener Boundary; UI `MuehleUI` zeigt Übung, Karten, Markierungen und hält den Computer an, solange Übung oder Karten offen sind. Zusammengesetzt wird die Übung im Startcode (`MuehleUI.neueUebung`), die UI kennt nur Controls.
- Datenformat: `brettspiele.einstellungen` bleibt Formatversion 1, neues optionales Feld `muehleEinfuehrung: true`; gespeicherte Partie bekommt das optionale Feld `stellungen` (fehlt es, gilt `{}`), alte Spielstände laden weiter.
- Alternativen: (a) Suche in der Control über Boundary-Kopien wie bisher: einfach, aber langsam und blockiert die Bedienung; (b) reine Engine-Funktion im Web Worker wie bei Vier gewinnt, Reversi, Mangala: schnell, Bedienung bleibt flüssig, Regeln stehen doppelt (Entity und Engine); (c) Zeitgrenze per Uhr: verletzt R-01 (keine Zeit in Control) und ist nicht wiederholbar. Für die Übung: (d) Übung auf der echten Partie: einfacher, gefährdet aber den Spielstand; (e) eigene Entity: Partie bleibt unberührt.
- Entscheidung: (b) mit Knotengrenze statt Uhr und (e). Die doppelte Regelstelle sichert `mu_staerke` ab (jeder Engine-Zug wird auf der echten Entity ausgeführt und muss gültig sein).
- Design-Review: 04.11.2026, nachgeholt nach dem Bau (Prozess galt ab diesem Abend), zweiter Agent (Sonnet) prüfte Spec, Design und Code nur gegen Spec und Regeln: 12 Befunde, 4 mittel; alle eingearbeitet, siehe Ergebnis.

## Kritische Testfälle (Phase 6)
- PS-22: Datenverlust (alter Spielstand muss weiter laden)
- PS-5: Absturz (blockierter Speicher darf das Spiel nicht stoppen)
- PS-13: Kernerlebnis (Computer stark muss spürbar stärker sein)
- PS-1: Kernerlebnis (Übung erklärt die Regeln in 5 Schritten)
- PS-19: Missbrauch mit Spielstandsänderung (Computer zieht nicht, während die Karten offen sind)

## Querschnitt (Phase 4)
- Datenschutz: keine personenbezogenen Daten; neu gespeichert wird nur `muehleEinfuehrung: true` im Gerät, nichts verlässt das Gerät
- Sicherheit: kein Netz, keine Fremdeingaben; Texte der Karten sind fest im Code, kaputte gespeicherte Daten fallen auf Standardwerte zurück (PS-4)
- Barrierefreiheit: Tippflächen 44 × 44 px (AK-5), jeder Punkt mit `aria-label` (Nummer und Belegung), Karten als `role="dialog"`, Bewegung bei "weniger Bewegung" aus, Markierungen nicht nur über Farbe (Ring, Schild, Ausrufezeichen)
- Leistung: Computer stark im Mittel 4 ms, höchstens 34 ms je Zug, Springen-Endspiel 83 ms (gemessen in `mu_staerke`, Grenze 400 / 1500 ms)

## Nicht Teil dieser Änderung
- 3D-Brett, Ton und Konfetti für Mühle, Mühleschule mit Aufgaben (Stufe 2, eigene Spec)
- andere Mühle-Varianten (Morris mit 12 Steinen, Diagonalen)

## Betroffene Schichten
Entity (Weiß beginnt, Wiederholung), Boundary (Drohung, Suche auf Kopien), Control (Stärken, Übung, Hilfe), UI (Übung, Karten, Markierungen, Statuszeile). Neues gespeichertes Feld `muehleEinfuehrung` (freigegeben mit der Wahl "Einführung beim ersten Start").

## Risiken und Kosten
Suche Tiefe 4 in der Springphase hat viele Züge (bis 3 × 21 × Wegnahmen): Zeitgrenze mit Zugsortierung und Abbruch nach Tiefe 3, falls 1500 ms überschritten würden (gemessen, nicht geschätzt). Mehr Text auf kleinem Bildschirm: Statuszeile höchstens zwei Zeilen.

## Clean Code (Phase 9)
- Clean Code: neue und geänderte Teile je unter 400 Zeilen (MuehleEntity 274, MuehleBoundary 67, MuehleControl 147, MuehleUebungControl 67, MuehleUI 303, AIEngines.muehle 115); alte 1-Zug-KI entfernt statt auskommentiert; Regeln stehen bewusst zweimal (Entity und Worker-Engine), abgesichert durch `mu_staerke`; Namen deutsch und sprechend wie im übrigen Code.

## E2E (Phase 10; Playwright im Handyformat 412 × 915, Bilder aus Spielersicht in `mu_bilder`)
| Schritt | Test |
| --- | --- |
| U-1 | mu_uebung |
| U-2 | mu_uebung |
| U-3 | mu_uebung |
| U-4 | mu_uebung |
| U-5 | mu_uebung_speicher |
| U-6 | mu_status |
| U-7 | mu_drohung |
| U-8 | mu_markierung |
| U-9 | mu_status |
| U-10 | mu_staerke |
| U-11 | mu_remis |
| U-12 | mu_hilfe |
| U-13 | mu_hilfe |

## Dokumentation (Phase 12)
- Aktualisiert: werkstatt/README.md
- Aktualisiert: werkstatt/tests/muehle_test.js
- Aktualisiert: werkstatt/abnahme/S-W15-muehle.md

## Ergebnis (04.11.2026, vor dem Gerätetest)
- Messwerte (`mu_staerke`, Desktop-Chromium): stark gegen den alten Computer 20 Siege von 20, 0 Niederlagen; gegen die eigene Suche mit Tiefe 1 19 Siege, 0 Niederlagen; Rechenzeit im Mittel 4 ms, höchstens 34 ms, Springen-Endspiel 83 ms.
- Review-Befunde und Umsetzung: (1) Suche ohne Wiederholung: Zähler in der Suche, Test; (2, 3) Zug landete trotz offener Karten, Test zu früh: Pause in der Control, Test mit verzögerter Rechnung; (4) Neustart während der Rechnung ließ die Partie hängen: "erneut" anstoßen, Test; (5) alter Computer-Stand: alte Seite bis zum Neustart, Test; (6) AK-9-Wortlaut angeglichen; (7) Tests ergänzt: Tiefe wird von der Steuerung weitergegeben, Knotengrenze wiederholbar, Abschluss der Übung über echtes Tippen (Fehlerquoten prüft schon `stufen_tabelle` in `brett_test.js`); (8) UI liest die Topologie über `MuehleControl.NACHBARN`/`LAGE`; (9) Tippen bei "Geschafft" startet die Partie; (10) bleibt (allgemeines Muster aller Spiele, nicht Teil dieser Änderung); (11) Statuszeile mit Warnsatz höchstens zwei Zeilen, gemessen; (12) Ergebnis, Fehlerliste, Status.
- Gegenproben: 19 absichtliche Fehler, alle von ihrem Test erkannt.
- Neue Fehler: 6 Einträge in `werkstatt/fehlerliste.md` (früheste Stufe jeweils Spec).
- Offen: Abnahme am Handy (`werkstatt/abnahme/S-W15-muehle.md`).
