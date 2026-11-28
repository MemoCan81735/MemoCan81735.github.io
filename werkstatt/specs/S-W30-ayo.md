# S-W30: Ayo (Ayò Ọlọ́pọ́n) in den Brettspielen (Stufe 1)

**Status:** gebaut am 27.11.2026 (freigegeben am 27.11.2026, 21:05)
<!-- Freigabe durch den Betreiber im Projekt-Thread am 27.11.2026, 21:05: Karte "Spec S-W30 Ayo freigeben und Bau starten?", Option "Freigeben, Bau starten" (damit auch Speichern in ayoDB und brettspiele.ayo). Regelentscheidungen am selben Tag aus dem Handbuch. -->
<!-- Anlass: Wunsch des Betreibers im Projekt-Thread am 27.11.2026 (Ayo als neues Brettspiel). Regelgrundlage: das vom Betreiber am 27.11.2026 gelieferte "Spielhandbuch Ayò Olọ́pọ́n" (Abapa-Regeln, Einzel-Runden-Variante). Die Regelquellen im Netz waren nicht abrufbar (Hosts gesperrt), nur Suchauszüge; Notiz /mnt/project-files/docs/notizen/ayo-recherche-2026-11-27.md. -->

## Anlass
Wunsch des Betreibers: Ayo, das bekannteste traditionelle Strategiespiel der Yoruba (Südwest-Nigeria), als neues Brettspiel neben Mangala, Mühle, Dame und Tavla. Die App hat mit Mangala (Kalaha) schon ein Mancala, aber keines mit Schlagen auf der Gegnerseite (2 oder 3 Samen), Kettenschlag und Füttern-Pflicht. Ayo hat keinen Zufall (vollständige Information). Die Regeln (Füttern, Startmulde überspringen, Kettenschlag) und der Kulturhintergrund müssen erklärt werden, wie bei Mühle und Tavla.

## Anforderungen
| Nr. | Anforderung | Quelle | Prüfung |
| --- | --- | --- | --- |
| A-1 | Regeln wie im Spielhandbuch (2 × 6 Mulden, 48 Samen, je 4, Säen gegen den Uhrzeigersinn, Startmulde bei 12 und mehr Samen überspringen, Schlag bei 2 oder 3 auf der Gegnerseite mit Kettenschlag rückwärts, Füttern-Pflicht, Grand-Slam-Regel, Sieg bei 25 oder mehr, 24:24 unentschieden) | Betreiber 27.11.2026, Handbuch Abschnitte 1 bis 4 | AK-1 bis AK-7 |
| A-2 | Neue Kachel "Ayo" im Aufbau von S-W25, Optik wie die anderen Brettspiele, 3D wählbar | Betreiber 27.11.2026, Vorgabe der Koordination | AK-12, AK-13 |
| A-3 | Computer in drei Stärken; Rechenkern unter Tests | Projektregel (Brettspiele) | AK-10 |
| A-4 | Lernhilfe aus den Tipps des Betreibers: Kroo (Speicher mit 12 und mehr Samen), eigene 1er und 2er schützen, Tempo (Zielmulde vorher berechnen); Übung und Regelkarten | Betreiber 27.11.2026 | AK-9, AK-15 |
| A-5 | Herkunft und Kultur im Spiel (Info-Karte): Yoruba, Südwest-Nigeria, Familie der Mancala-Spiele, Samen der Caesalpinia bonduc, Verwandtschaft zu Oware | Betreiber 27.11.2026 ("such nach der Herkunft") | AK-9 |
| A-6 | Spielmaßstab (10 Merkmale): Start in unter 3 s, ein einfacher Kern (Säen und Schlagen), Ton und Ploppen, Runden 5 bis 15 Minuten gegen den Computer, Handy zuerst (44 px, 60 Bilder/s) | `spiele-qualitaet.md` | AK-11, AK-14 |

## Spielregeln, wie sie gebaut werden (aus dem Handbuch, mit Festlegungen)
- 12 Mulden im Ring, Index 0 bis 5 gehören Süd (Spieler, von links nach rechts), 6 bis 11 gehören Nord (Computer, von rechts nach links, also gegen den Uhrzeigersinn weitergezählt). Zwei Sammelmulden zeigen die eroberten Samen, sie werden nie besät.
- **Säen:** alle Samen der gewählten nicht leeren eigenen Mulde einzeln in die folgenden Mulden. Hat die Startmulde 12 oder mehr Samen, wird sie beim Umlauf übersprungen und bleibt leer.
- **Schlagen:** nur wenn der letzte Samen auf der Gegnerseite landet und die Mulde danach genau 2 oder 3 Samen hat. Danach prüft man die Mulde davor (im Uhrzeigersinn): liegt sie auf der Gegnerseite und hat 2 oder 3, wird auch sie geschlagen, so lange bis eine andere Zahl kommt oder die eigene Seite beginnt. Auf der eigenen Seite wird nie geschlagen.
- **Füttern:** Hat der Gegner zu Beginn des Zugs 0 Samen auf seiner Seite, muss der Zug mindestens einen Samen auf seine Seite bringen. Gibt es keinen solchen Zug, endet die Partie sofort; die Samen auf der eigenen Seite gehören dem Spieler, der sie hat (Betreiber entschied: Restsamen dem Besitzer).
- **Reihenfolge der Filter (Design-Review 27.11.2026):** erst Füttern (nur füttende Züge), dann Grand Slam. Sind danach alle verbliebenen Züge Grand Slam, sind alle erlaubt und der Schlag verfällt (kein Deadlock). Der Regelkern rechnet mit jeder Samenzahl (Übungsstellungen haben nicht 48 Samen); die Summe 48 prüft nur die Boundary beim Laden.
- **Grand Slam:** Ein Zug, dessen Schlag alle Samen der Gegnerseite nähme, ist verboten, wenn es einen anderen erlaubten Zug gibt (Fall A). Ist er der einzige erlaubte Zug, ist er erlaubt, aber der Schlag verfällt: alle Samen bleiben liegen (Fall B).
- **Ende:** Wer 25 oder mehr Samen erobert hat, gewinnt sofort; die Partie endet auch bei Nichtfüttern (oben) und bei Wiederholung (Festlegung unten); danach zählt der Stand (mehr Samen gewinnt, 24:24 unentschieden).
- **Festlegung Wiederholung (Regel 3 des Handbuchs, dort "nach Einverständnis"):** Kehrt dieselbe Stellung mit demselben Spieler am Zug zum dritten Mal wieder oder vergehen 60 Halbzüge ohne Schlag, endet die Partie; jeder bekommt die Samen auf seiner Seite. Eigene Festlegung, mit der Spec vom Betreiber am 27.11.2026 freigegeben. Der Schlüssel der Stellung enthält den Spieler am Zug und wird nach jedem Zug gezählt (die Startstellung zählt als erstes Vorkommen); die Liste beginnt nach jedem Schlag neu. Ein verfallener Schlag (Grand Slam Fall B) setzt den Zähler der Halbzüge nicht zurück. Zug zurück stellt Liste und Zähler wieder her; Neuladen behält beide.
- Süd (Spieler) beginnt. Nicht Teil: "Berührt ist geführt", Zählen in der Hand, die Mehrfach-Runden-Variante (Weitersäen).
- Offen (Quellen uneins, nicht abrufbar): Original-Abgleich der Fälle Startmulde und Grand Slam gegen Wikipedia, John Pratt, Horniman; nach Freigabe der Hosts nachholen.

## Anwendungsfall 1: Erster Start
- Akteur: Spieler am Handy, kennt Ayo kaum
- Ziel: die Grundzüge in unter 2 Minuten verstehen und sofort spielen
- Auslöser: tippt zum ersten Mal auf die Kachel "Ayo"
- Gefühl: "Ach so geht das"; neugierig auf das Spiel aus Nigeria
- U-1: sieht "Übung 1 von 5: Säen"; eine Mulde leuchtet mit Sprechblase "Hier tippen"; die Samen wandern einzeln gegen den Uhrzeigersinn
- U-2: Übung 2 "Schlagen": er tippt die leuchtende Mulde, der letzte Samen landet bei 1 oder 2 Gegnersamen, die Mulde wird geschlagen und die Zahl springt in seine Sammelmulde
- U-3: Übung 3 "Kettenschlag": ein Zug schlägt drei Mulden hintereinander (Beispiel aus dem Handbuch: 8 Samen)
- U-4: Übung 4 "Füttern": der Gegner hat keine Samen; nur Mulden, die ihm Samen geben, leuchten
- U-5: Übung 5 "Kroo": eine Mulde mit 12 Samen; beim Säen wird die Startmulde übersprungen; "Geschafft! Jetzt eine echte Partie"; die Übung kommt beim nächsten Öffnen nicht wieder
- Alternativen: "Überspringen"; falscher Tipp (Hinweis, nichts passiert); Neuladen mitten in der Übung (beginnt neu); Speicher blockiert (Übung kommt jedes Mal, Spiel läuft)
- Erfolgsmaß: Übung in höchstens 5 Schritten mit je einem Tippziel

## Anwendungsfall 2: Eine Partie gegen den Computer
- Akteur: Spieler am Handy
- Ziel: eine Partie spielen und immer sehen, was gerade erlaubt und gefährlich ist
- Auslöser: tippt "Gegen Computer" oder "Neu starten"
- Gefühl: hat alles im Griff, rechnet im Kopf vor, Schlagen fühlt sich gut an
- U-6: Statuszeile "Du bist am Zug"; spielbare eigene Mulden tragen einen Ring und die Samenzahl; leere Mulden nicht
- U-7: Antippen einer Mulde sät sichtbar Samen für Samen (Ton je Samen, je Samen höchstens 0,12 s und für den ganzen Zug höchstens 1,5 s (Dauer je Samen = Minimum aus 0,12 s und 1,5 s durch Samenzahl); bei reduzierter Bewegung ohne Animation)
- U-8: Schlagen: geschlagene Mulden blinken, die Samen fliegen in die Sammelmulde, Ton und Vibration, Statuszeile "Geschlagen: 5"
- U-9: Kettenschlag: die Mulden werden nacheinander geschlagen, Statuszeile nennt die Summe
- U-10: hat der Gegner keine Samen, leuchten nur Mulden, die füttern; Statuszeile "Du musst füttern"; gibt es keine, endet die Partie mit Hinweis "Kein Zug kann füttern: Partie endet"
- U-11: Grand Slam: ist ein Zug verboten, ist er nicht spielbar und die Statuszeile nennt den Grund; ist er der einzige, verfällt der Schlag mit Hinweis
- U-12: Sieg: "Du gewinnst mit 27 Samen!" mit Konfetti; "Unentschieden 24:24"; Niederlage ohne Konfetti
- U-13: der Computer zieht sichtbar, Stärke Leicht, Mittel, Stark
- Alternativen: zu zweit an einem Handy; Tipp; Zug zurück; Neuladen mitten in der Partie; schnelles Doppeltippen
- Erfolgsmaß: jedes Tippen hat eine sichtbare Reaktion; Stark rechnet unter 1 s je Zug

## Anwendungsfall 3: Regeln, Herkunft und Lernhilfe
- Akteur: Spieler am Handy
- Ziel: Regeln und Hintergrund nachlesen, Fehler vermeiden
- Auslöser: tippt auf "?", "3D" oder "Lernhilfe"
- U-14: "?" öffnet fünf Karten (Ziel und Säen, Schlagen und Kette, Füttern und Ende, Herkunft und Kultur, Tipps mit Kroo, 1er und 2er schützen, Tempo); "Schließen" lässt die Partie unverändert
- U-15: Lernhilfe an: eigene Mulden, die der Gegner mit einem Zug schlagen könnte, tragen ein Ausrufezeichen, und eigene Mulden, deren Zug schlägt, zeigen in Orange die Zahl der Samen, die sie schlagen würden; aus: keine Markierung
- U-16: "3D" zeigt das Holzbrett mit Samen und Sammelmulden in Perspektive; Tippen wirkt wie in 2D; fehlt WebGL, bleibt 2D

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Aufstellung: 12 Mulden mit je 4 Samen, Sammelmulden 0; die Summe aus Mulden und Sammelmulden bleibt nach jedem Zug 48 | `ay_regeln` |
| AK-2 | Säen: genau die Samenzahl wird gesät, gegen den Uhrzeigersinn; bei 12 und mehr Samen wird die Startmulde übersprungen und bleibt leer (11 Samen: letzter Samen in der Mulde vor der Startmulde; 12: überspringt; 23: zweiter Umlauf; Maximum 48 ohne Fehler) | `ay_regeln` |
| AK-3 | Schlagen: nur, wenn der letzte Samen auf der Gegnerseite endet und die Mulde danach 2 oder 3 hat; 1, 4 und mehr oder die eigene Seite schlagen nie | `ay_schlagen` |
| AK-4 | Kettenschlag: rückwärts Mulde für Mulde solange 2 oder 3 und Gegnerseite; bricht bei 0, 1, 4 und mehr oder an der Seitengrenze ab; Beispiel des Handbuchs (Süd F mit 5 Samen) schlägt 3 + 2 + 3 = 8 | `ay_kette` |
| AK-5 | Füttern: hat der Gegner 0 Samen, sind nur füttende Züge erlaubt; gibt es keinen, endet die Partie sofort und jeder behält die Samen seiner Seite | `ay_fuettern` |
| AK-6 | Grand Slam: ein Zug, dessen Schlag die Gegnerseite leerte, ist verboten, solange ein anderer Zug erlaubt ist (Fall A); ist er der einzige, ist er erlaubt und der Schlag verfällt (Fall B); ein Schlag, der Samen übrig lässt, ist nie betroffen | `ay_grandslam` |
| AK-7 | Ende: 25 oder mehr gewinnt sofort; Stand 24:24 ist unentschieden; dreifache Wiederholung (gleiche Stellung, gleicher Spieler) oder 60 Halbzüge ohne Schlag beenden die Partie, Seitensamen gehen an den Besitzer; nach dem Ende keine Züge | `ay_ende` |
| AK-8 | Speichern mit Formatversion 1: Partie überlebt Neuladen (auch während der Computer am Zug ist: er setzt fort); kaputter, fremder oder unstimmiger Stand (Version, Summe nicht 48, Zahl außerhalb 0 bis 48, falsche Länge, Spieler am Zug ungültig, Beendet-Flag unpassend zu 25 und mehr) ergibt eine neue Partie ohne Fehler | `ay_speicher` |
| AK-9 | Lernhilfe: Übung in 5 Schritten beim ersten Start (Säen, Schlagen, Kettenschlag, Füttern, Kroo), Überspringen, nur einmal; fünf Regelkarten hinter "?" inklusive Herkunft und Kultur; Computer wartet, solange Übung oder Karten offen sind | `ay_uebung`, `ay_hilfe` |
| AK-10 | Computer: Leicht (Tiefe 2, 25 % Fehlzüge), Mittel (Tiefe 5, 5 %), Stark (Tiefe 8, 0 %); der Fehlzug ist ein zufälliger erlaubter Zug über den hineingereichten Zufall; er spielt nur erlaubte Züge; jede Partie endet vor 400 Zügen; Stark höchstens 1000 ms je Zug im Software-Renderer (Messwert); Stark gewinnt gegen Leicht in mindestens 16 von 20 Partien mit festen Zufallsfolgen, Seiten getauscht | `ay_staerke` |
| AK-11 | Bedienung: Mulden, Sammelmulden und Knöpfe mindestens 44 px hoch und breit (412 × 915 und 915 × 412, kein waagerechtes Scrollen), Samenzahl als Ziffer an jeder Mulde (bei mehr als 8 Samen "+n" statt Haufen), Statuszeile höchstens 110 Zeichen, jedes Tippen ändert sichtbar etwas oder zeigt einen Hinweis | `ay_ui` |
| AK-12 | Aufbau: neue Kachel "Ayo" mit Symbol und "Weiterspielen", Abschnitte wie bei den anderen Spielen (status, brett, aktionen, modus, stufen, optionen, statistik), Eintrag in `BRETTER` und in die Kachelreihenfolge von `aufbau_test.js`; Zurück-Taste springt zum ersten Reiter | `aufbau_test.js`, `ay_ui` |
| AK-13 | 3D: eigene Klasse (`AyoAnsicht3D`), Standard 3D, Brett mit 12 Mulden, Samen als Kugeln, zwei Sammelmulden; Tippen wirkt wie in 2D; ohne WebGL bleibt 2D ohne Fehler; Wahl bleibt (`ansicht.ayo`) | `ay_3d` |
| AK-14 | Spielgefühl: Säen (Ton je Samen), Schlagen, Sieg mit Ton und Vibration (wenn Ton an); 0,28 s Ploppen an der Zielmulde; Konfetti nur bei Sieg des Menschen; Spiel nach dem Öffnen der Kachel in unter 3 s spielbar | `ay_ui` |
| AK-15 | Lernhilfe an: eigene gefährdete Mulden (vom Gegner mit einem erlaubten Zug schlagbar, aus der Simulation aller seiner erlaubten Züge abgeleitet; bei 12 und mehr Samen kann auch eine leere oder einzelne Mulde schlagbar sein) tragen ein Ausrufezeichen, Mulden, deren Zug schlägt, tragen eine orange Zahl der Samen, die sie schlagen würden (ohne zusätzlichen Tipp); aus: keine dieser Markierungen | `ay_lernen` |
| AK-16 | Zufall und Zeit werden hineingereicht: Entity und Boundary erzeugen keine Zahlen; der Regelkern ist eine reine Funktion (gleiche Stellung und Zug ergeben dasselbe Ergebnis) | `ay_regeln` |
| AK-17 | Zug zurück nimmt Spielerzug samt Computerzug zurück (mehrfach, Verlauf nicht gespeichert); Tipp nennt einen erlaubten Zug | `ay_zurueck` |
| AK-18 | Bestehende Spiele und die Seitenprüfung bleiben grün; keine fremden Server | `seite_pruefen.py`, `aufbau_test.js`, `brett_test.js`, `dame_test.js`, `tavla_test.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Aufstellung: 12 × 4, Summe 48, Süd am Zug | AK-1 |
| PS-2 | Wiederholbarkeit | Zwei Partien mit "erster erlaubter Zug" enden gleich; nach jedem Zug in 300 Zügen Summe 48 | AK-1, AK-16 |
| PS-3 | Normal | Säen 4 Samen aus Mulde 0 legt je 1 in Mulde 1 bis 4 | AK-2 |
| PS-4 | Grenzwert | 11 Samen enden in der Mulde vor der Startmulde; 12 Samen überspringen die Startmulde, die Startmulde bleibt 0 | AK-2 |
| PS-5 | Grenzwert | 23 und 48 Samen in einer Mulde: Umläufe stimmen, Startmulde leer, Summe stimmt | AK-2 |
| PS-6 | Normal | Letzter Samen auf Gegnerseite macht 2 oder 3: Schlag, Samen in die Sammelmulde | AK-3 |
| PS-7 | Grenzwert | Zielmulde danach 1 oder 4 oder mehr: kein Schlag; Zielmulde danach 2 und 3 geschlagen | AK-3 |
| PS-8 | Fehlalarm | Letzter Samen auf eigener Seite bei 2 oder 3 Samen: kein Schlag | AK-3 |
| PS-9 | Normal | Handbuchbeispiel: Süd F (5 Samen) schlägt e, d, c = 3 + 2 + 3 = 8, b mit 1 bleibt, a bleibt 5 | AK-4 |
| PS-10 | Grenzwert | Kette bricht an der Seitengrenze ab, Mulde auf eigener Seite mit 2 oder 3 wird nie geschlagen | AK-4 |
| PS-11 | Grenzwert | Kette bricht bei 1 und bei 4 und mehr ab (eine 0 ist in der Kette nicht erreichbar: jede Mulde davor wurde im selben Zug besät; das prüft PS-38) | AK-4 |
| PS-12 | Normal | Gegner leer: nur füttende Züge erlaubt, nicht füttende gesperrt | AK-5 |
| PS-13 | Grenzwert | Gegner leer und kein Zug füttert: Partie endet, jeder behält die Seitensamen, Sieger nach Stand | AK-5, AK-7 |
| PS-14 | Normal | Grand Slam Fall A: es gibt einen anderen Zug, der Grand-Slam-Zug ist nicht erlaubt | AK-6 |
| PS-15 | Grenzwert | Grand Slam Fall B: einziger Zug, erlaubt, Schlag verfällt, alle Samen bleiben liegen, Gegner am Zug | AK-6 |
| PS-16 | Fehlalarm | Schlag lässt der Gegnerseite mindestens 1 Samen: normaler Schlag, kein Grand Slam | AK-6 |
| PS-17 | Normal | 25 Samen gewinnt sofort; 24:24 nach Ende ist unentschieden | AK-7 |
| PS-18 | Grenzwert | 24 Samen: Partie läuft weiter; 25 Samen: beendet, danach keine Züge | AK-7 |
| PS-19 | Grenzwert | Dreifache Stellung (gleiche Stellung, gleicher Spieler) beendet; zweifache nicht; 60 Halbzüge ohne Schlag beenden, 59 nicht; ein Schlag setzt den Zähler zurück | AK-7 |
| PS-20 | Fehlerfall | Ungültige Züge (leere Mulde, Gegnermulde, Zahl 12, -1, 1,5, Text, null, nach dem Ende, falscher Spieler) ändern nichts | AK-2, AK-16 |
| PS-21 | Missbrauch | Speicherstand kaputt: kein JSON, falsche Version, Summe 47 oder 49, Mulde 99, Länge 11, Spieler "C", Beendet ohne 25 oder Ende | AK-8 |
| PS-22 | Wiederholbarkeit | Speichern und Neuladen mitten im Zug und während der Computer am Zug ist: gleiche Stellung, gleiche erlaubte Züge | AK-8 |
| PS-23 | Normal | Übung: 5 Schritte, falscher Tipp wirkt nicht, Überspringen, kommt nicht wieder; Speicher gesperrt: kommt jedes Mal; Neuladen beginnt neu | AK-9 |
| PS-24 | Normal | "?" öffnet fünf Karten, eine davon mit Herkunft und Kultur, Computer wartet, "Schließen" lässt die Partie unverändert | AK-9 |
| PS-25 | Normal | Computer spielt auf allen Stufen 3 Partien: nur erlaubte Züge, Partie endet vor 400 Zügen, Stark höchstens 1000 ms je Zug | AK-10 |
| PS-26 | Grenzwert | Stark schlägt Leicht in mindestens 16 von 20 Partien (Seiten getauscht, feste Zufallsfolgen) | AK-10 |
| PS-27 | Grenzwert | Fehlzug-Quote: Leicht wählt bei Zufall unter 0,25 einen zufälligen erlaubten Zug, sonst den berechneten; Mittel Grenze 0,05; Stark nie | AK-10 |
| PS-28 | Normal | Bedienung: Mulde antippen, Samen wandern, Zahl stimmt, Sammelmulde wächst | AK-11 |
| PS-29 | Grenzwert | Maße 412 × 915 und 915 × 412: Mulden und Knöpfe mindestens 44 px, kein waagerechtes Scrollen, 48 Samen in einer Mulde bleiben als "+n" im Feld, Status höchstens 110 Zeichen | AK-11 |
| PS-30 | Missbrauch | Doppeltippen, Tippen auf Gegnermulde, Tippen während der Computer zieht, Tippen auf leere Mulde: keine Änderung des Stands, kein Fehler (Mulden sind dann nicht tippbar, die Statuszeile nennt, wer am Zug ist) | AK-11 |
| PS-31 | Normal | Kachel "Ayo" vorhanden, in der Reihenfolge, Zurück-Taste springt zum ersten Reiter, bestehende Kacheln unverändert | AK-12, AK-18 |
| PS-32 | Normal | 3D: Canvas sichtbar, Tippen auf eine Mulde zieht wie in 2D, ohne WebGL 2D; Wahl bleibt | AK-13 |
| PS-33 | Normal | Ton und Vibration beim Säen, Schlagen, Sieg; Ploppen am Ziel; Konfetti nur bei Sieg des Menschen; Spielbeginn unter 3 s | AK-14 |
| PS-34 | Normal | Lernhilfe an: Ausrufezeichen bei gefährdeten eigenen 1er und 2er, orange Schlagzahl an schlagenden Zügen; aus: keine Markierung | AK-15 |
| PS-35 | Normal | Zug zurück nimmt Spieler- und Computerzug zurück, mehrfach; Tipp liefert erlaubten Zug | AK-17 |
| PS-36 | Fehlerfall | Worker fällt aus: der Computer rechnet im Hauptthread weiter, gleiches Ergebnis | AK-10 |
| PS-37 | Normal | Spiegelung: Süd und Nord getauscht ergibt dieselben erlaubten Züge und Schläge (Nord zieht und schlägt gleich) | AK-3, AK-4 |
| PS-39 | Grenzwert | Füttern und Grand Slam zusammen: Gegner leer, der einzige füttende Zug schlüge alles (22 Samen aus Süd 0): Zug erlaubt, Schlag verfällt, Gegner hat danach Samen; zwei Grand-Slam-Züge ohne Alternative sind beide erlaubt | AK-5, AK-6 |
| PS-40 | Grenzwert | Gegner hat genau 1 Samen: kein Füttern-Zwang | AK-5 |
| PS-41 | Grenzwert | Süd 5 mit 12 Samen: letzter Samen in Nord 6 (Vorzustand 0 oder 1 schlägt); Nord zieht über die Indexgrenze 0 nach 11 rückwärts | AK-2, AK-3, AK-4 |
| PS-42 | Normal | Endstand mit Seitensamen: Sammelmulde 20 plus 5 Samen auf der Seite gewinnt gegen 23; Fall verfallener Schlag setzt den Halbzugzähler nicht zurück | AK-7 |
| PS-43 | Normal | Zug zurück stellt Wiederholungsliste und Halbzugzähler wieder her; Neuladen behält beide | AK-7, AK-8, AK-17 |
| PS-44 | Normal | Computer kann nicht füttern: Partie endet mit Hinweis | AK-5 |
| PS-38 | Wiederholbarkeit | Eigenschaftstest über 300 zufällige Stellungen: Summe 48, Schlag nur 2 oder 3 und nur Gegnerseite, Füttern erfüllt, kein Grand Slam, wenn Alternative | AK-1 bis AK-6 |

## Gegenproben
- Verstoß (jeder absichtliche Fehler muss seinen Test rot machen, `gegenproben_ayo.py`): Aufstellung 5 statt 4; Startmulde wird nicht übersprungen; Schlag schon bei 1 oder erst bei 4; Schlag auf der eigenen Seite; Kette läuft über die Seitengrenze; Kette bricht schon nach dem ersten Schlag ab; Füttern nicht erzwungen; Nichtfüttern beendet nicht; Grand Slam erlaubt trotz Alternative; Grand Slam Fall B schlägt trotzdem; Sieg erst bei 26; 24:24 zählt als Sieg; Wiederholung nicht erkannt; Speicher ohne Summenprüfung; Computer ignoriert die Stufe; Statuszeile zu lang; Mulde nur 30 px hoch; Zug zurück nimmt nur den Spielerzug zurück.
- Fehlalarm: PS-8 (eigene Seite), PS-16 (Schlag lässt Samen übrig), PS-7 (4 und mehr schlägt nicht, 2 und 3 schlägt), saubere Speicherstände werden angenommen (PS-22), Lernhilfe aus zeigt keine Markierung (PS-34).

## Technisches Design
- Schnittstellen: `ayoRegelwerk()` liefert reine Funktionen (`start`, `erlaubteZuege`, `wende`, `endStand`); sie werden unverändert in den Worker serialisiert und von der Entity benutzt (kein doppelter Regelcode). `AyoEntity` (Zustand, Zähler für Wiederholung), `AyoBoundary extends GameBoundary` (Zugriffe, Speichern, Formatversion), `AyoControl extends GameControl` (Ablauf, Zufall über `setZufall`, Computer über `AIEngines.ayo`), `AyoUebungControl`, `AyoUI extends GameUI`, `AyoAnsicht3D` (eigene Klasse, `Ansicht3D` bleibt unberührt).
- Datenformat: laufende Partie in IndexedDB `ayoDB` als `{formatversion: 1, cells[14] (0 bis 5 Süd, 6 bis 11 Nord, 12 und 13 Sammelmulden), currentPlayer, finished, winner, grund, halbzuege, historie[Stellungsschlüssel]}`; beim Laden gilt zusätzlich: Verlauf nicht leer, höchstens halbzuege+1 Einträge, letzter Eintrag = aktuelle Stellung mit Spieler am Zug; Übung gesehen in localStorage `brettspiele.ayo` (`{formatversion: 1, einfuehrung: true}`); Stufe, Ton, Ansicht, Lernhilfe über die bestehenden Einstellungen (`stufen.ayo`, `ansicht.ayo`, `lernen.ayo`).
- Alternativen: Regelkern doppelt in Entity und Worker (verworfen, läuft auseinander); Mangala-Entity erweitern (verworfen, Mangala hat Kalaha-Regeln, und Änderungen dort gefährden das laufende Spiel); Sammelmulden als Teil des Rings (verworfen, werden nie besät); beide Schlagregeln als Modus (verworfen, vom Betreiber nicht gewählt).
- Entscheidung: Brett hochkant wie die anderen Spiele, zwei Reihen à 6 Mulden mit je 44 px und zwei Sammelmulden an den Enden; Spielerreihe unten, Süd zieht von links nach rechts; Zug in einem Tippschritt; die Säanimation läuft in der UI, der Regelkern liefert den Verlauf (Liste der besäten Mulden, geschlagene Mulden). Computer wie bei Mangala: Alpha-Beta über den reinen Regelkern, Tiefe 2/5/8 mit Knotengrenze (reproduzierbar), im Worker.
- Design-Review: geprüft durch `gegenleser` (Sonnet; keine kritischen Themen wie Recht oder Geld, aber über 150 Zeilen), nur gegen Spec und Regeln; Befunde vor dem Bau eingearbeitet (Reihenfolge Füttern vor Grand Slam, Wiederholungsregel).

## Querschnitt
- Datenschutz: nur Spielstand auf dem Gerät, keine Anfragen nach außen, kein Name, keine Kennung.
- Sicherheit: gespeicherte Daten werden vor dem Laden geprüft (Version, Typen, Summen, Bereiche); kein `innerHTML` mit fremden Daten; keine neuen Fremdquellen.
- Barrierefreiheit: jede Mulde ein Knopf mit `aria-label` ("Mulde C, Süd, 5 Samen"), Zustand nie nur durch Farbe (Ring, Zahl, Ausrufezeichen); Animationen mit `prefers-reduced-motion` aus; Karten mit Überschrift.
- Leistung: Zeichnen höchstens 12 + 2 Elemente neu je Zug; Computer im Worker mit Knotengrenze (Stark höchstens 1000 ms als Messwert); 3D baut Samen einmal und bewegt sie.

## Kritische Testfälle
- PS-9: Handbuchbeispiel Kettenschlag (8 Samen)
- PS-15: Grand Slam Fall B (einziger Zug, Schlag verfällt)
- PS-13: Nichtfüttern beendet die Partie
- PS-4: Startmulde bei 12 Samen überspringen
- PS-21: kaputte Speicherstände

## Clean Code
- Clean Code: Prüfergebnis: bestanden. Alle neuen Klassen unter 400 Zeilen (größte: AyoUI 286, AyoAnsicht3D 171, AyoControl 90, Regelwerk 57), Regelwerk als reine Funktion, Datei bleibt eine einzelne HTML-Datei, Zufall und Zeit nur von außen hineingereicht.

## E2E
| Schritt | Test |
| --- | --- |
| U-1 | ay_uebung |
| U-2 | ay_uebung |
| U-3 | ay_uebung |
| U-4 | ay_uebung |
| U-5 | ay_uebung |
| U-6 | ay_ui |
| U-7 | ay_ui |
| U-8 | ay_schlagen |
| U-9 | ay_kette |
| U-10 | ay_fuettern |
| U-11 | ay_grandslam |
| U-12 | ay_ende |
| U-13 | ay_staerke |
| U-14 | ay_hilfe |
| U-15 | ay_lernen |
| U-16 | ay_3d |

## Dokumentation
- Aktualisiert: werkstatt/specs/S-W30-ayo.md
- Aktualisiert: werkstatt/tests/ayo_test.js
- Aktualisiert: werkstatt/tests/gegenproben_ayo.py
- Aktualisiert: werkstatt/abnahme/S-W30-ayo.md
- Aktualisiert: werkstatt/README.md
- Aktualisiert: werkstatt/alle_tests.sh

## Ergebnis und Rückblick
- Gebaut am 27.11.2026: Regelwerk, Computer in drei Stärken, Übung (5 Schritte), fünf Hilfekarten mit Herkunft und Kultur, Lernhilfe, 2D und 3D, Speicher (`ayoDB`, `brettspiele.ayo`).
- Messwerte: Stark je Zug höchstens 126 ms (je nach Lauf 84 bis 126) (Grenze 1000 ms); Stark gewinnt 20 von 20 Partien gegen Leicht (Grenze 16).
- Tests: 16 Tests in `ayo_test.js`, 28 Gegenproben in `gegenproben_ayo.py`, alle erkannt.
- Unabhängige Prüfung nach dem Bau (`gegenleser`, nur gegen Spec und Regeln): Regellogik ohne Abweichung (6 Partien, 40 Stellungen nachgerechnet). Befunde und Behebung, je mit Test und Gegenprobe: Rückruf nach der Säanimation prüfte nicht, ob die Partie inzwischen neu gestartet wurde (behoben, Stellungsvergleich); Animation ohne Fehlerbehandlung konnte das Brett dauerhaft sperren (behoben, `catch`); Statuszeilen der Übungsschritte 1 bis 3 über 110 Zeichen (gekürzt, `ay_uebung` prüft alle Schritte); Speicherstand prüfte Verlauf und Zähler nicht gegeneinander (behoben); PS-40 bis PS-44 ohne Test (jetzt `ay_nachtrag`); Datenformat in der Spec veraltet (korrigiert). Offen und akzeptiert: Knotengrenze statt Zeitgrenze beim Computer (Messung auf dem Handy steht aus), Tipp im Zustand "Geschafft" startet das Spiel und zieht zugleich.
- Fehler beim Bau (nicht am Gerät): Auswahllisten für Tippflächen und Anordnung kannten die neuen Ids nicht (früheste Stufe: `aufbau_test`, dort gefunden); Testannahme zur Verteilung beim Schlag war falsch; Grand-Slam-Fall mit nur einer Mulde endete korrekt als Nichtfüttern.
- Quellen im Netz waren von der Umgebung aus gesperrt; Regeln stützen sich auf Arslans Handbuch und Suchtreffer. Original-Abgleich offen.
- Gerätetest am Handy offen (`werkstatt/abnahme/S-W30-ayo.md`).

## Nicht Teil dieser Änderung
Mehrfach-Runden-Variante (Weitersäen), "Berührt ist geführt", Online-Spiel, Turnierwertung, Ayo-Schule mit Lektionen, App-Fassung (Android).
