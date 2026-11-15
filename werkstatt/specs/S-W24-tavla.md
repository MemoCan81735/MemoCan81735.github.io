# S-W24: Tavla (türkisches Backgammon) in den Brettspielen (Stufe 1)

**Status:** gebaut am 11.11.2026 (freigegeben am 11.11.2026, 04:55)
<!-- Freigabe durch den Betreiber im Projekt-Thread am 11.11.2026, 04:55: Auswahl "Düz Tavla mit Mars, 3 Stärken" (Standard-Tavla mit Doppelsieg, Computer Leicht/Mittel/Stark, 3D, Übung und Regelkarten; Plakoto und Fevga später).
     Vorher am 10.11.2026 Wunsch "Parallel tavla" (neben Dame, S-W23 im Thread "Weitere Brettspiele hinzufügen"). -->

## Anlass
Wunsch des Betreibers: Tavla neben Dame in die Brettspiele. Tavla ist in der Türkei das meistgespielte Brettspiel; die App hat noch kein Würfelspiel.
Neu für die App: Zufall (Würfel), Zugfolgen mit mehreren Teilzügen je Runde, ein Brett mit 24 langen Feldern. Die Regeln, die Spieler oft nicht kennen (Pflicht, beide Würfel zu nutzen; Abtragen; Mars), müssen erklärt werden, wie bei Mühle.

## Anwendungsfall 1: Erster Start
- Akteur: Spieler am Handy, kennt Tavla kaum
- Ziel: die Grundzüge in unter 2 Minuten verstehen und sofort spielen
- Auslöser: tippt zum ersten Mal auf den Reiter "Tavla"
- Gefühl: "Ach so geht das", Lust auf die erste Partie
- U-1: sieht "Übung 1 von 5: Würfeln" und einen leuchtenden Würfeln-Knopf mit Sprechblase "Hier tippen"; nach dem Tippen erscheinen zwei Würfel
- U-2: Übung 2 "Ziehen": ein Stein ist gewählt, grüne Ziele leuchten; er tippt das Ziel, der Stein wandert
- U-3: Übung 3 "Schlagen": er tippt auf einen einzelnen schwarzen Stein; der Stein landet auf der Bar in der Mitte
- U-4: Übung 4 "Bar": ein weißer Stein steht auf der Bar und muss zuerst zurück; er tippt das leuchtende Einwurf-Feld
- U-5: Übung 5 "Abtragen": alle Steine im Heimfeld, er trägt einen Stein ab; "Geschafft! Jetzt eine echte Partie"; beim nächsten Öffnen kommt die Übung nicht wieder
- Alternativen: tippt "Überspringen"; tippt auf einen falschen Punkt (Hinweis, nichts passiert); lädt neu mitten in der Übung (beginnt neu); Speicher blockiert (Übung kommt jedes Mal, Spiel läuft)
- Erfolgsmaß: Übung in höchstens 5 Schritten mit je einem Tippziel

## Anwendungsfall 2: Eine Partie gegen den Computer
- Akteur: Spieler am Handy
- Ziel: eine Partie spielen und immer wissen, was gerade erlaubt ist
- Auslöser: tippt auf "Gegen Computer" oder "Neu starten"
- Gefühl: hat alles im Griff, Würfelglück spannend, kein Ärger über Fehlklicks
- U-6: Weiß (Spieler) beginnt; Statuszeile "Tippe auf Würfeln"; nach dem Wurf zeigen zwei Würfel die Augen, die Statuszeile nennt sie ("Du hast 5 und 3")
- U-7: ziehbare Steine tragen einen blauen Ring; Antippen zeigt grüne Zielfelder; Antippen eines Ziels zieht und verbraucht den Würfel (der Würfel wird grau)
- U-8: landet ein Zug auf einem einzelnen Gegnerstein, wandert dieser auf die Bar; Ton und Vibration; Statuszeile "Geschlagen!"
- U-9: steht ein eigener Stein auf der Bar, sind nur Einwürfe erlaubt; die Statuszeile sagt "Erst den Stein von der Bar einwerfen"
- U-10: ist kein Zug möglich, sagt die Statuszeile "Kein Zug möglich: Runde verfällt" ; der Gegner ist sofort am Zug (`phase` wuerfeln, `ausgesetzt` gesetzt)
- U-11: stehen alle noch auf dem Brett befindlichen Steine im Heimfeld (Bar leer), wird das Abtragefeld grün; Abtragen zählt hoch
- U-12: ist ein Spieler fertig, steht "Du gewinnst!" oder "Mars! Doppelter Sieg", wenn der Gegner noch keinen Stein abgetragen hat
- U-13: der Computer würfelt und zieht Stein für Stein sichtbar in der gewählten Stärke
- Alternativen: zu zweit an einem Handy; Tipp-Knopf; Zug zurück (nur Steinzüge, nie der Wurf); Neuladen mitten in der Partie (Stand und Würfel bleiben); sehr schnelles Doppeltippen
- Erfolgsmaß: kein Tippen ohne sichtbare Reaktion; Computer "stark" rechnet unter 1 s je Wurf

## Anwendungsfall 3: Regeln nachlesen und in 3D spielen
- Akteur: Spieler am Handy
- Ziel: Regeln nachschlagen; Brett in 3D sehen
- Auslöser: tippt auf "?" bzw. "3D"
- U-14: "?" öffnet vier Karten (Ziel und Ziehen, Schlagen und Bar, Abtragen, Mars) mit Mini-Brett; "Schließen" lässt die Partie unverändert
- U-15: "3D" zeigt das Brett als Holzbrett mit Steinen und Würfeln in Perspektive; Tippen auf Punkte wirkt wie in 2D; fehlt WebGL, bleibt das 2D-Brett
- Gefühl: wie die übrigen Spiele (Schach, Vier gewinnt)

## Umfang
Düz Tavla: 15 Steine je Seite, zwei Würfel, Pasch = vier Züge, Schlagen, Bar, Heimfeld, Abtragen, Pflicht zur Nutzung beider Würfel, Mars (Doppelsieg, 2 Punkte; ein Dreifachsieg wie im Backgammon gibt es nicht). Jeder Würfel ist ein eigener Zug eines Steins mit eigenem Zielpunkt (kein zusammengesetzter Zug, daher keine Regel für Zwischenpunkte). Weiß zieht von Punkt 24 nach 1 (Heimfeld 1 bis 6, Einwurf mit Augenzahl d auf Punkt 25 − d), Schwarz gespiegelt (Heimfeld 19 bis 24, Einwurf auf Punkt d). Die Punkte des Mars haben nur eine Anzeige (Statuszeile, Teilen-Text), keine Zählung. Weiß (Spieler) beginnt mit einem normalen Wurf (kein Auswürfeln der Startseite). Kein Verdopplungswürfel, keine Einsätze.
Nicht Teil: Plakoto, Fevga, Turnier- und Matchzählung, Rangliste, Online-Spiel. Mars wird angezeigt und im Teilen-Text genannt; die Statistik zählt Siege wie bei den anderen Spielen (keine neue Zählung). Die Übung läuft auf einer eigenen Entity mit festen Würfeln und rührt eine laufende Partie (`tavlaDB`) nie an; "gesehen" gilt erst nach "Los geht's" oder "Überspringen" (Neuladen mitten in der Übung beginnt sie neu).
Geändert wird nur `brettspiele/index.html`: neue Klassen getrennt eingefügt, bestehende Spiele unverändert. Dame (S-W23) baut parallel in derselben Datei; Zusammenführung durch Merge von `main` in den Branch.

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aufstellung: je Seite 15 Steine, Weiß auf Punkt 24 (2), 13 (5), 8 (3), 6 (5), Schwarz gespiegelt; die Summe 15 je Seite (Brett + Bar + abgetragen) bleibt nach jedem Zug erhalten | `ta_regeln` |
| AK-2 | Ziehen genau um die Augenzahl in Richtung Heim; Zielpunkt mit 2 oder mehr Gegnersteinen gesperrt; mit genau 1 wird geschlagen (Gegner auf die Bar); Bar-Steine müssen zuerst einwerfen; Pasch gibt vier Züge | `ta_regeln`, `ta_zwang` |
| AK-3 | Zwang: Ein Erstzug ist genau dann erlaubt, wenn er Teil einer Zugfolge mit der größtmöglichen Zahl genutzter Würfel ist; lässt sich insgesamt nur ein Würfel nutzen und sind beide einzeln spielbar, ist nur der größere erlaubt; ist kein Zug möglich, verfällt die Runde und der Gegner ist sofort am Zug; werden mitten in der Runde die übrigen Würfel unspielbar, verfallen sie und der Gegner ist am Zug | `ta_zwang` |
| AK-4 | Abtragen nur, wenn alle noch auf dem Brett stehenden Steine (15 minus abgetragene) im Heimfeld stehen und die Bar leer ist; mit genauer Augenzahl; mit größerer Zahl nur vom höchsten besetzten Punkt | `ta_abtragen` |
| AK-5 | Wer zuerst 15 abgetragen hat, gewinnt; hat der Verlierer dann 0 abgetragen, ist es Mars (2 Punkte, Meldung "Mars"), sonst ein einfacher Sieg (1 Punkt); kein Dreifachsieg | `ta_ende` |
| AK-6 | Der Zufall wird hineingereicht: Entity und Boundary erzeugen keine Zahlen; Würfelwerte außerhalb 1 bis 6 oder nicht ganzzahlig werden abgelehnt; zweimal würfeln im selben Zug wird abgelehnt; gleiche Würfelfolge und gleiche Zugwahl ergibt dieselbe Partie | `ta_zufall` |
| AK-7 | Speichern mit Formatversion 1: Partie samt übrigen Würfeln überlebt Neuladen (auch während der Computer am Zug ist: er setzt fort); kaputter, fremder oder unstimmiger Stand (falsche Version, Summe nicht 15, Zahlen außerhalb, `phase`/`wuerfel`/`uebrig` unstimmig, Beendet-Flag nicht passend zu 15 abgetragenen) ergibt eine neue Partie ohne Fehler | `ta_speicher` |
| AK-8 | Bedienung: Reihen der Punkte, Bar, Abtragefeld und Knöpfe mindestens 44 px hoch und breit (412 × 915 und 915 × 412; die Seite darf im Querformat senkrecht scrollen, nur waagerechtes Scrollen ist verboten), auf einem Punkt höchstens 5 Steine sichtbar, darüber eine Zahl "+n" (kein Überlauf aus der Reihe), Statuszeile höchstens 110 Zeichen, jede Antippung ändert sichtbar etwas oder zeigt einen Hinweis | `ta_ui` |
| AK-9 | Lernhilfe: Übung in 5 Schritten beim ersten Start (Würfeln, Ziehen, Schlagen, Bar, Abtragen) mit je einem Tippziel und Sprechblase, Überspringen, wird nur einmal gezeigt; vier Regelkarten hinter "?"; Computer wartet, solange Übung oder Karten offen sind | `ta_uebung`, `ta_hilfe` |
| AK-10 | Ringe (ziehbare Steine) und grüne Ziele erscheinen immer; Lernhilfe an: zusätzlich Felder, auf denen geschlagen wird, orange und eigene Einzelsteine, die der Gegner mit einem Wurf bis 6 Augen schlagen kann (Abstand höchstens 6, Bar zählt), mit Ausrufezeichen; aus: keine dieser beiden Markierungen | `ta_lernen` |
| AK-11 | Computer: Stufen Leicht (30 % Fehlzüge), Mittel (5 %), Stark (0 %, Vorausschau auf die Antwort des Gegners). Ein Fehlzug ist ein zufälliger erlaubter Steinzug (nie ein unerlaubter), gewählt je einzelnem Steinzug mit der Stufenwahrscheinlichkeit über den hineingereichten Zufall. Der Computer spielt nur erlaubte Züge; in Prüfläufen endet jede Partie vor 3000 Schritten. Die Rechnung ist durch eine feste Knotengrenze bestimmt (reproduzierbar), die Zeit ist nur Messwert: Stark höchstens 1000 ms je Wurf im Software-Renderer. Stark gewinnt gegen Leicht in mindestens 14 von 20 Partien mit festen Würfelfolgen | `ta_staerke` |
| AK-12 | Zug zurück nimmt Steinzüge zurück (der verbrauchte Würfel wird wieder frei, mehrfach möglich), solange seit diesem Zug nicht neu gewürfelt wurde; ein Wurf wird nie zurückgenommen (kein Neuwürfeln); der Verlauf wird nicht gespeichert; Tipp nennt einen erlaubten Zug (vor dem Wurf: Würfeln) | `ta_zurueck` |
| AK-13 | 3D: Ansicht wie bei Schach wählbar (Standard 3D), Brett, 15 Steine je Seite und Würfel sichtbar, Tippen auf einen Punkt wirkt wie in 2D; ohne WebGL bleibt 2D ohne Fehler | `ta_3d` |
| AK-14 | Spielgefühl: Würfeln, Ziehen, Schlagen und Sieg lösen Klang und Vibration aus (wenn Ton an); nach einem Zug 0,28 s Ploppen am Ziel; Konfetti bei Sieg des Menschen | `ta_ui` |
| AK-15 | Bestehende Spiele und die Seitenprüfung bleiben unverändert grün; keine fremden Server | `seite_pruefen.py`, `brett_test.js`, `muehle_test.js`, `brett3d_test.js`, `lernen_test.js`, `schule_test.js`, `optik_test.js`, `luft_test.js`, `teilen_test.js`, `ta_regeln` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Aufstellung stimmt (24 Felder, 15 + 15) | AK-1 |
| PS-2 | Wiederholbarkeit | Zwei Partien mit gleicher Würfelfolge und Zugwahl "erster erlaubter Zug" enden gleich; nach jedem Zug in 300 Zügen Summe 15 + 15 | AK-1, AK-6 |
| PS-3 | Normal | Wurf 3 und 1 aus der Grundstellung: Zug 8 nach 5 erlaubt, Zug auf Punkt mit 5 Gegnersteinen nicht | AK-2 |
| PS-4 | Grenzwert | Ziel mit genau 1 Gegner erlaubt (schlägt), mit 2 gesperrt | AK-2 |
| PS-5 | Normal | Schlagen: Gegner auf der Bar, Punkt gehört dem Schläger, Summe bleibt 15 | AK-2 |
| PS-6 | Normal | Stein auf der Bar: nur Einwürfe erlaubt; Einwurf auf Punkt mit 2 Gegnern nicht | AK-2 |
| PS-7 | Grenzwert | Pasch gibt vier Züge; sind nur drei möglich, wird nach drei gewechselt | AK-2, AK-3 |
| PS-8 | Normal | Eigenschaft über 300 Stellungen (feste Zufallsfolge): jeder erlaubte Erstzug lässt sich zu einer Folge mit der größten möglichen Würfelzahl ergänzen, jeder andere nicht | AK-3 |
| PS-9 | Grenzwert | Ist nur ein Würfel nutzbar und beide einzeln spielbar, sind nur Züge mit dem größeren erlaubt | AK-3 |
| PS-10 | Normal | Kein Zug möglich (alle sechs Einwurfpunkte gesperrt): Runde verfällt, Gegner am Zug, Meldung `ausgesetzt` | AK-3 |
| PS-11 | Fehlerfall | Abtragen gesperrt, solange ein Stein außerhalb des Heimfelds steht oder auf der Bar | AK-4 |
| PS-12 | Grenzwert | Abtragen exakt (Zahl 3 von Punkt 3); größere Zahl vom höchsten Punkt; kein Abtragen von niedrigerem Punkt, wenn höher noch Steine stehen | AK-4 |
| PS-13 | Grenzwert | Mars: Verlierer 0 abgetragen gibt 2 Punkte und `mars`; Verlierer 1 abgetragen gibt 1 Punkt | AK-5 |
| PS-14 | Normal | Letzter Stein abgetragen beendet die Partie, `finished`, Sieger stimmt, danach keine Züge mehr | AK-5 |
| PS-15 | Fehlerfall | Ungültige Züge (falsche Quelle, gegnerischer Stein, gesperrtes Ziel, ohne Wurf, nach dem Ende) ändern nichts | AK-2, AK-6 |
| PS-16 | Missbrauch | Würfel 0, 7, NaN, 1,5, Text, null, undefined, negativ werden abgelehnt; zweimal würfeln ohne Zug wird abgelehnt | AK-6 |
| PS-17 | Missbrauch | Speicherstand kaputt: kein JSON, falsche Formatversion, Summe 14 oder 16, Zahl 99 auf einem Punkt, Bar negativ, Würfel [9] | AK-7 |
| PS-18 | Wiederholbarkeit | Speichern und Neuladen mitten im Zug: gleiche Stellung, gleiche übrige Würfel, gleiche erlaubte Züge | AK-7 |
| PS-19 | Normal | Bedienung: Würfeln, Stein antippen (Ring, Ziele), Ziel antippen, Würfel grau | AK-8 |
| PS-20 | Grenzwert | Maße 412 × 915 und 915 × 412: Reihen und Knöpfe mindestens 44 px, kein waagerechtes Scrollen, Status höchstens 110 Zeichen, 15 Steine auf einem Punkt bleiben im Feld | AK-8 |
| PS-21 | Missbrauch | Doppeltippen, Tippen auf Gegnerstein, Tippen während der Computer zieht, Würfeln-Knopf zweimal: keine Wirkung, kein Fehler | AK-8 |
| PS-22 | Normal | Computer spielt auf allen Stufen 3 Partien mit Zufallswürfeln: nur erlaubte Züge, Partie endet, Stark höchstens 1000 ms je Wurf | AK-11 |
| PS-23 | Grenzwert | Stark schlägt Leicht in mindestens 14 von 20 Partien (feste Würfelfolgen, Seiten getauscht) | AK-11 |
| PS-24 | Normal | Übung: 5 Schritte, falscher Tipp wirkt nicht, Überspringen, kommt nicht wieder; Speicher gesperrt: kommt jedes Mal | AK-9 |
| PS-25 | Normal | "?" öffnet vier Karten, Computer wartet, "Schließen" lässt die Partie unverändert | AK-9 |
| PS-26 | Normal | Lernhilfe an: Ringe, grüne Ziele, orange Schlagfelder; aus: keine Markierung | AK-10 |
| PS-27 | Normal | Zug zurück: Steinzug weg, Würfel bleiben gleich; Tipp liefert erlaubten Zug | AK-12 |
| PS-28 | Normal | 3D: Canvas sichtbar, Tippen auf einen Punkt zieht wie in 2D; ohne WebGL 2D | AK-13 |
| PS-29 | Fehlalarm | Erlaubte Grenzfälle dürfen nicht abgelehnt werden: Einwurf auf Punkt mit 1 Gegner, Abtragen mit größerer Zahl vom höchsten Punkt, drei Züge bei Pasch wenn nur drei möglich | AK-2, AK-3, AK-4 |
| PS-30 | Normal | Ton und Vibration beim Würfeln, Ziehen, Schlagen, Sieg; Ploppen am Ziel | AK-14 |
| PS-31 | Normal | Bestehende Reiter vorhanden, Tavla-Reiter erreichbar, Zurück-Taste springt zum ersten Reiter | AK-15 |
| PS-32 | Normal | Spiegelung: spiegelt man Stellung und Farbe, ergeben sich dieselben erlaubten Züge (Schwarz-Einwurf, Schwarz-Heimfeld, Schwarz-Abtragen) | AK-2, AK-4 |
| PS-33 | Grenzwert | Fehlzug-Quote: mit eingespeistem Zufall wählt Leicht bei Zufall unter 0,3 einen zufälligen erlaubten Zug, sonst den berechneten; Mittel Grenze 0,05; Stark nie | AK-11 |
| PS-34 | Fehlerfall | Worker fällt aus: der Computer rechnet im Hauptthread weiter, Ergebnis gleich; Neuladen während der Computer am Zug ist setzt die Partie fort | AK-7, AK-11 |
| PS-35 | Normal | Ansichtswahl: 3D/2D-Knopf schaltet um, Wahl bleibt in den Einstellungen (`ansicht.tavla`) | AK-13 |
| PS-36 | Normal | Zug zurück mehrfach in einer Runde und über das Rundenende (Gegner hat noch nicht gewürfelt); nach neuem Wurf des Gegners nicht mehr möglich; der Wurf wird nie zurückgenommen | AK-12 |
| PS-37 | Normal | Konfetti nur bei Sieg des Menschen, Ploppen-Klasse `neu` am Ziel des letzten Zugs | AK-14 |
| PS-38 | Missbrauch | Übung: Neuladen mitten in der Übung beginnt neu und markiert nicht als gesehen; laufende Partie bleibt unverändert | AK-9 |

## Gegenproben
- Verstoß (jeder absichtliche Fehler muss seinen Test rot machen, `gegenproben_tavla.py`): Aufstellung falsch; gesperrter Punkt nicht gesperrt; Schlagen schlägt nichts; Bar nicht zuerst; Pasch nur zwei Züge; Pflicht beide Würfel ignoriert; kleinerer statt größerer Würfel; kein Aussetzen; Abtragen mit Stein außerhalb; Abtragen mit zu großer Zahl von niedrigem Punkt; Mars zählt nicht; Mars schon bei 1 abgetragenem Stein; Würfel 7 angenommen; zweimal würfeln erlaubt; Speicher ohne Summenprüfung; Zug zurück macht den Wurf rückgängig; Übung zählt falschen Punkt; Computer ignoriert die Stufe; Statuszeile zu lang; Reihe nur 30 px hoch.
- Fehlalarm: PS-29 (erlaubte Grenzfälle bleiben erlaubt), Hilfe aus zeigt keine Markierung (PS-26), saubere Speicherstände werden angenommen (PS-18).

## Technisches Design
- Schnittstellen: `tavlaRegelwerk()` liefert reine Funktionen (`start`, `erlaubteErste`, `folgen`, `wende`, `heimfertig`); sie werden unverändert in den Worker serialisiert und von der Entity benutzt (kein doppelter Regelcode). `TavlaEntity` (Zustand, Würfel von außen: `setzeWurf(a, b)`, Wurfzähler für Zug zurück), `TavlaBoundary extends GameBoundary` (Zugriffe, Speichern, Formatversion), `TavlaControl extends GameControl` (Ablauf, Zufall über `setZufall`, Computer über `AIEngines.tavla`), `TavlaUebungControl`, `TavlaUI extends GameUI`, `TavlaAnsicht3D` (eigene Klasse, damit `Ansicht3D` und Dame unberührt bleiben).
- Datenformat: laufende Partie in IndexedDB `tavlaDB` (wie die anderen Spiele) als `{formatversion: 1, punkte[24], bar{A,B}, ab{A,B}, am Zug, phase, wuerfel[], uebrig[], beendet, sieger, mars}`; Übung gesehen in localStorage `brettspiele.tavla` (`{formatversion: 1, einfuehrung: true}`), getrennt von `brettspiele.einstellungen`, damit sich Dame und Tavla nicht berühren. Stufe, Ton, Ansicht, Lernhilfe über die bestehenden Einstellungen (`stufen.tavla`, `ansicht.tavla`, `lernen.tavla`).
- Alternativen: Regeln nur im Worker und in der Entity doppelt (verworfen: zwei Regelwerke laufen auseinander); Ansicht in `Ansicht3D` einbauen (verworfen: Dame baut dort gleichzeitig, Konfliktgefahr, und die Klasse ist auf quadratische Bretter gebaut); Brett quer mit 12 Spalten (verworfen: Spalten wären unter 44 px breit); Auswürfeln der Startseite (später).
- Entscheidung: Brett hochkant (zwei Spalten à 12 Punkte-Reihen plus Mittelreihe als Bar), jede Reihe mindestens 44 px; Spielzug in zwei Tippschritten (Stein, Ziel) wie bei Mühle; der Computer führt Wurf und jeden Steinzug als eigenen sichtbaren Schritt aus. Worker wie bei `AIStrategy`: `tavlaRegelwerk` und `AIEngines.tavla` werden per `toString()` in den Quelltext des Workers übernommen (reine Funktionen, keine Closures); fällt der Worker aus, rechnet derselbe Code im Hauptthread. Der Computer sucht seine ganze Runde im Worker (Folge von Zügen, bewertet nach Wegstrecke, Blots, Blöcken, geschlagenen und abgetragenen Steinen); Stark prüft die besten 6 Folgen gegen alle 21 Gegnerwürfe.
- Design-Review: Schichten Entity, Boundary, Control, UI eingehalten (Entity ohne DOM, Zeit und Zufall); Würfel kommen aus der Control (`setZufall`, wie `fehlerquote`); Regelwerk-Funktionen rein, damit sie in den Worker passen; geprüft vom Bauer gegen die Regeln, Prüfung durch einen zweiten Agenten vor dem Merge (Änderung über 150 Zeilen).

## Querschnitt
- Datenschutz: nur Spielstand auf dem Gerät, keine Anfragen nach außen, kein Name, keine Kennung.
- Sicherheit: gespeicherte Daten werden vor dem Laden geprüft (Version, Typen, Summen, Bereiche); Würfel von außen werden geprüft; kein `innerHTML` mit fremden Daten.
- Barrierefreiheit: alle Punkte, Bar und Abtragefeld sind Knöpfe mit `aria-label` ("Punkt 13, weiß, 5 Steine"); Zustand nie nur durch Farbe (Ring, Schild, Zahl); Animationen mit `prefers-reduced-motion` aus; Würfel mit Punkten und Zahl im Label.
- Leistung: Zeichnen höchstens 24 + 4 Elemente neu je Zug; Computer im Worker (feste Knotengrenze bestimmt das Ergebnis, Stark höchstens 1000 ms je Wurf als Messwert); 3D baut Steine und Würfel einmal und bewegt sie.

## Kritische Testfälle
- PS-8: Pflicht zur Nutzung beider Würfel (Eigenschaft über 300 Stellungen gegen eine einfache Vergleichsrechnung)
- PS-9: größerer Würfel, wenn nur einer nutzbar ist
- PS-11: Abtragen gesperrt, solange ein Stein außerhalb steht
- PS-13: Mars gegen einfachen Sieg
- PS-17: kaputte Speicherstände

## Clean Code
- Clean Code: Prüfergebnis: bestanden. Alle neuen Klassen unter 400 Zeilen (größte: TavlaUI 337, TavlaAnsicht3D 271, TavlaControl etwa 153), Regelwerk als reine Funktion (159 Zeilen), Datei bleibt eine einzelne HTML-Datei, keine toten Reste, Zufall und Zeit nur von außen hineingereicht.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | ta_uebung |
| U-2 | ta_uebung |
| U-3 | ta_uebung |
| U-4 | ta_uebung |
| U-5 | ta_uebung |
| U-6 | ta_ui |
| U-7 | ta_ui |
| U-8 | ta_regeln |
| U-9 | ta_zwang |
| U-10 | ta_zwang |
| U-11 | ta_abtragen |
| U-12 | ta_ende |
| U-13 | ta_staerke |
| U-14 | ta_hilfe |
| U-15 | ta_3d |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W24-tavla.md
- Aktualisiert: werkstatt/tests/tavla_test.js
- Aktualisiert: werkstatt/tests/gegenproben_tavla.py
- Aktualisiert: werkstatt/README.md
- Aktualisiert: werkstatt/alle_tests.sh

## Ergebnis und Rückblick
- Gebaut am 11.11.2026: Regelwerk, Computer in drei Stärken, Übung, vier Regelkarten, Lernhilfe, 3D, Speicher (`tavlaDB`, `brettspiele.tavla`).
- Messwerte: Stark je Wurf p95 etwa 30 bis 35 ms, höchstens 55 ms (Grenze 1000 ms); Stark gewinnt 19 von 20 Partien gegen Leicht.
- Tests: 15 Tests in `tavla_test.js`, etwa 40 Gegenproben in `gegenproben_tavla.py`, alle erkannt.
- Unabhängige Prüfung (zweiter Agent, nur gegen Spec und Regeln) fand: Zug zurück konnte den Computerzug zurücknehmen; Fehlzug nur je Runde statt je Steinzug; Speicher prüfte Rest und Mars nicht genau genug; unnötige Gegnerschleife bei Bar. Alles behoben, je mit Test und Gegenprobe. Offen und akzeptiert: Marker-Geometrien in 3D ohne `dispose()` (kleines Speicherleck), Computer-Plan beim Abtragen mit zwei möglichen Würfeln (harmlos).
- Nach dem Zusammenführen mit S-W25 (Kacheln, Kopfzeile, Abschnitte): Tavla hat eine eigene Kachel, keine eigene Überschrift, die Abschnitte status, brett, aktionen, modus, optionen (3D, ?, Lernhilfe), statistik; Würfeln und Abtragen stehen in einer Zeile über dem Brett, das 3D-Brett ist 1:1,36, damit im Hochformat (412 × 915) alles ohne Scrollen passt. Im Querformat scrollt die Seite senkrecht (13 Reihen zu 44 px), `aufbau_test.js` nimmt Tavla dort wie Mangala von den Brett-Prüfungen aus.
- Gerätetest am Handy offen (Abnahmeliste `werkstatt/abnahme/S-W24-tavla.md`).

## Nicht Teil dieser Änderung
Plakoto, Fevga, Auswürfeln der Startseite, Verdopplungswürfel, Matchzählung, eigene Mars-Statistik, Online-Spiel, Tavla in der App-Fassung (Android).
