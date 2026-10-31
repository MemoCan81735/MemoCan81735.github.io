# S-W04: Gemeinsame Teilen-Funktion für alle Spiele (A1)

**Status:** gebaut, freigegeben am 31.10.2026, 20:20
<!-- Freigabe durch den Betreiber im Projekt-Thread: "B1, b2, b3, l1, l2, a1". -->

## Ziel
Nach einem Ergebnis gibt es in jedem Spiel einen Knopf "Teilen". Er verschickt einen kurzen Text mit dem Ergebnis und dem Link zum Spiel,
zum Beispiel per WhatsApp. Kein Server, keine persönlichen Daten.

## Rechenmodell (verbindlich)
- **Ein Baustein** `teilen.js` im Hauptordner der Seite, eingebunden von Luftdrift, Brettspiele und Driftpokal (`../teilen.js`).
  Er stellt `window.Teilen = { text(teile, link), teilen(daten) }` bereit.
- **Text:** Teile werden mit " · " verbunden, dann Leerzeile, dann der Link. Höchstens 200 Zeichen vor dem Link (sonst gekürzt mit "…").
  Link = Adresse der Seite ohne Suchteil und ohne Anker (`origin + pathname`). Keine Namen, keine Geräte- oder Spielerdaten.
- **Weg:** 1. `navigator.share({ title, text })` (Handy: Auswahl der App). Abbruch durch den Nutzer = "abgebrochen", kein Ersatzweg.
  2. Ohne `navigator.share` oder bei anderem Fehler: `navigator.clipboard.writeText`, Hinweis "Text kopiert" 2 s.
  3. Geht beides nicht: kleines Fenster mit dem Text zum Markieren und einem Knopf "Schließen".
  Ergebnis der Funktion: "geteilt", "abgebrochen", "kopiert" oder "angezeigt"; ein zweites Tippen, während das erste noch läuft, liefert "laeuft" und tut nichts.
- **Texte je Spiel:**
  - Luftdrift: `Luftdrift · Ringjagd (Küste) · 58,2 s · ★★★` bzw. `Drift-Runde (Dorf) · 8.450 Punkte · ★★★` bzw. `Rennen (Berge) · Platz 1 · 62,3 s`.
    Nur nach beendeter Runde (nicht bei "Abgebrochen").
  - Brettspiele: gegen die KI `Brettspiele · Vier gewinnt · Sieg gegen die KI (Stark)` / `Niederlage gegen die KI (Mittel)` / `Unentschieden gegen die KI (Leicht)`;
    zu zweit `Brettspiele · Vier gewinnt · Partie zu zweit beendet` bzw. `Unentschieden zu zweit`. Knopf nur sichtbar, solange die Partie beendet ist.
  - Driftpokal: Titel und Untertitel des Ergebnisbilds (`Sieg! · Hafen · Einzelrennen`), im Zeitfahren mit Gesamtzeit.
- Keine neue gespeicherte Information, keine neue Berechtigung (Teilen und Kopieren laufen nur nach einem Tippen).

## Akzeptanzkriterien
| Nr. | Kriterium | Test |
| --- | --- | --- |
| AK-1 | Text: Teile mit " · ", Link ohne Suchteil und Anker, ≤ 200 Zeichen vor dem Link | `teilen_text` |
| AK-2 | Weg: share vorhanden → "geteilt"; Abbruch → "abgebrochen" ohne Kopie; share fehlt → "kopiert"; beides fehlt → "angezeigt" mit Fenster | `teilen_weg` |
| AK-3 | Luftdrift: Knopf im Endbild nach fertiger Runde, Text mit Modus, Strecke, Wert, Sternen; nicht bei Abbruch | `teilen_luftdrift` |
| AK-4 | Brettspiele: Knopf erst nach Partieende, Text mit Spiel, Ausgang und Stufe; nach Neustart weg | `teilen_brett` |
| AK-5 | Driftpokal: Knopf im Ergebnisbild, Text aus Titel und Untertitel | `teilen_driftpokal` |
| AK-6 | Kein Text enthält eine E-Mail-Adresse, einen Personennamen oder Zahlen aus dem Speicher außer dem Ergebnis | `teilen_text` und `seite_pruefen.py` |
| AK-7 | Keine Skriptfehler, kein Querscroll bei 412 px | `seite_handy.js` |

## Prüfszenarien
| Nr. | Kategorie | Szenario | Kriterium |
| --- | --- | --- | --- |
| PS-1 | Normal | Drei Teile und Link → erwarteter Text | AK-1 |
| PS-2 | Grenzwert | 300 Zeichen Text → gekürzt auf 200 mit "…", Link vollständig | AK-1 |
| PS-3 | Missbrauch | Adresse mit `?x=geheim#y` → Link ohne Suchteil und Anker | AK-1, AK-6 |
| PS-4 | Normal | share vorhanden und erfolgreich → "geteilt", Daten enthalten Text | AK-2 |
| PS-5 | Fehlerfall | share bricht ab (AbortError) → "abgebrochen", Zwischenablage unberührt | AK-2 |
| PS-6 | Fehlerfall | share fehlt → Zwischenablage, Hinweis sichtbar | AK-2 |
| PS-7 | Fehlerfall | share und Zwischenablage fehlen → Fenster mit Text, Schließen entfernt es | AK-2 |
| PS-8 | Missbrauch | 5× schnell tippen → höchstens ein Fenster gleichzeitig | AK-2 |
| PS-9 | Normal | Luftdrift Ringjagd fertig auf der Küste → Text mit Zeit und Sternen | AK-3 |
| PS-10 | Fehlerfall | Luftdrift Ringjagd abgebrochen → kein Knopf | AK-3 |
| PS-11 | Normal | Tic Tac Toe gegen KI verloren → "Niederlage gegen die KI (Mittel)" | AK-4 |
| PS-12 | Normal | Tic Tac Toe zu zweit gewonnen → "Partie zu zweit beendet" | AK-4 |
| PS-13 | Wiederholbarkeit | Neustart nach Partieende → Knopf weg | AK-4 |
| PS-14 | Normal | Driftpokal Ergebnisbild → Knopf da, Text aus Titel und Untertitel | AK-5 |

## Gegenproben
- Verstoß: Link behält den Suchteil; Abbruch fällt auf Kopieren zurück; Brettspiele-Knopf bleibt nach Neustart sichtbar; Luftdrift zeigt Knopf bei Abbruch.
- Fehlalarm: Text genau 200 Zeichen wird nicht gekürzt; leerer Teil wird ausgelassen und nicht als Fehler gemeldet.

## Nicht Teil dieser Änderung
- Bilder teilen, Ranglisten, Tagesrätsel.

## Betroffene Schichten
Boundary (Zugriff auf `navigator.share` und Zwischenablage in `teilen.js`), UI (Knöpfe in den Spielen).
In Driftpokal nur das Ergebnisbild und ein kleiner Zusatz am Ende der Datei; der Spielkern bleibt unverändert.

## Risiken und Kosten
`navigator.share` gibt es nur über https und nach einem Tippen; am Desktop fehlt es oft (dann Kopieren).
Driftpokal auf der Seite weicht damit weiter vom Quell-Repo ab (in der Erinnerung vermerkt).

## Ergebnis
- Vorher: alle 5 Tests rot (`teilen.js` fehlt).
- Nachher: 5 von 5 Tests grün (`werkstatt/tests/teilen_test.js`), 5 von 5 Gegenproben erkannt (`gegenproben_teilen.py`).
- Driftpokal: Text wird aus dem Ergebnisbild gelesen; ein echtes Rennen lässt sich im Container nicht fahren, daher Gerätetest offen.
- Teilen-Auswahl des Handys nur am Gerät prüfbar (Abnahmeliste Punkte 16 bis 19).
