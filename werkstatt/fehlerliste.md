# Fehlerliste der Werkstatt (Shift Left)

Jeder Fehler, der erst spät auffiel, mit der frühesten Stufe, die ihn hätte finden können, und der Ergänzung dort. Stufen: Spec, Test, Commit-Hook, Push-Hook, Klon, Handy.

| Datum | Fehler | Gefunden auf | Früheste Stufe | Ergänzung |
| --- | --- | --- | --- | --- |
| 02.11.2026 | Namensschilder der Oer-Runde (S-W13) am Handy nicht lesbar: 44 Einheiten breit, ab 120 Einheiten ausgeblendet | Handy | Spec | AK-4 verlangt jetzt die Schildhöhe in Pixeln bei 150 und 400 Einheiten; `w_label_szene` misst sie |
| 02.11.2026 | Lage der Grundrisse (S-W14) im Test um bis zu 2,8 Einheiten falsch, weil der Faktor als f/k statt f ausgegeben wurde | Test | Test | Lagetest `w_fuss` rechnet den echten Umriss in die Welt zurück und vergleicht vier Ränder (±2,5) |
| 02.11.2026 | Zwei Gegenproben (S-W12/S-W13) griffen nicht mehr, weil spätere Einträge die Textstelle verändert hatten | Gegenproben-Lauf | Commit-Hook | Gegenproben greifen auf kurze, eindeutige Textstücke; der Lauf meldet "greift nicht" als Fehler |
| 02.11.2026 | Stimmungstest (S-W10) im Klon rot: Kontexte fehlgeschlagener Tests rechneten weiter, Karte nach Index gewählt | Klon | Test | Kontext nach jedem Test schließen; Menükarten nach Namen wählen |
