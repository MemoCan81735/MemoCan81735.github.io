# Fehlerliste der Werkstatt (Shift Left)

Jeder Fehler, der erst spät auffiel, mit der frühesten Stufe, die ihn hätte finden können, und der Ergänzung dort. Stufen: Spec, Test, Commit-Hook, Push-Hook, Klon, Handy.

| Datum | Fehler | Gefunden auf | Früheste Stufe | Ergänzung |
| --- | --- | --- | --- | --- |
| 02.11.2026 | Namensschilder der Oer-Runde (S-W13) am Handy nicht lesbar: 44 Einheiten breit, ab 120 Einheiten ausgeblendet | Handy | Spec | AK-4 verlangt jetzt die Schildhöhe in Pixeln bei 150 und 400 Einheiten; `w_label_szene` misst sie |
| 02.11.2026 | Lage der Grundrisse (S-W14) im Test um bis zu 2,8 Einheiten falsch, weil der Faktor als f/k statt f ausgegeben wurde | Test | Test | Lagetest `w_fuss` rechnet den echten Umriss in die Welt zurück und vergleicht vier Ränder (±2,5) |
| 02.11.2026 | Zwei Gegenproben (S-W12/S-W13) griffen nicht mehr, weil spätere Einträge die Textstelle verändert hatten | Gegenproben-Lauf | Commit-Hook | Gegenproben greifen auf kurze, eindeutige Textstücke; der Lauf meldet "greift nicht" als Fehler |
| 02.11.2026 | Stimmungstest (S-W10) im Klon rot: Kontexte fehlgeschlagener Tests rechneten weiter, Karte nach Index gewählt | Klon | Test | Kontext nach jedem Test schließen; Menükarten nach Namen wählen |
| 04.11.2026 | Mühle (S-W15): Computerzug, der schon rechnete, landete trotz offener Regelkarten; der Test öffnete die Karten zu früh und war deshalb grün | Review (zweiter Agent) | Spec | PS-19 genauer: Karten erst während der laufenden Rechnung öffnen (verzögerte Strategie); Gegenprobe "Zug landet trotz Karten" |
| 04.11.2026 | Mühle (S-W15): Suche kannte die Wiederholung nicht und zog im Vorteil ins Unentschieden (2 Remis in 20 Partien) | Review (zweiter Agent) | Spec | Rechenmodell nennt jetzt den Zähler in der Suche; Test "meidet die dritte Wiederholung im Vorteil" |
| 04.11.2026 | Mühle (S-W15): Neustart während der Rechnung ließ die Partie hängen (Computer zog nie) | Review (zweiter Agent) | Spec | Prüfszenario "Neustart während der Rechnung" in `mu_hilfe`; verfallene Rechnung meldet "erneut" |
| 04.11.2026 | Mühle (S-W15): Kriterium "stark gewinnt gegen den alten Computer" unterschied nicht zwischen Tiefe 1 und 4 (auch Tiefe 1 gewann) | Gegenprobe | Spec | Zusätzliches Kriterium gegen die eigene Suche mit Tiefe 1; Gegenprobe "Suche ignoriert die Tiefe" |
| 04.11.2026 | Mühle (S-W15): alter Computer-Spielstand hätte nach dem Wechsel "Weiß beginnt" die Seiten getauscht | Review (zweiter Agent) | Spec | PS-22b: alter Stand gegen den Computer behält die alte Seite bis zum Neustart |
