# Werkstatt der Spieleseite

Prüfungen, bevor etwas auf die Seite kommt (Shift Left):

- `bash werkstatt/install_hooks.sh` einmal je Klon: Commit prüft statisch, Push prüft Gegenproben und Handyformat.
- `python3 werkstatt/seite_pruefen.py` statisch (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol, Anonymität, keine Fachsprache).
- `python3 werkstatt/seite_pruefen.py --gegenproben` prüft die Prüfung selbst (12 Verstöße müssen rot, 6 erlaubte Fälle grün bleiben).
- `node werkstatt/seite_handy.js` lädt alle Seiten bei 412×915 und 915×412 mit Playwright.
- `bash werkstatt/alle_tests.sh` alles zusammen (läuft vor jedem Push); `bash werkstatt/alle_tests.sh voll` zusätzlich alle Gegenproben.
- App-Tests in `werkstatt/tests/`: `brett_test.js` (S-W02), `brett3d_test.js` (S-W05), `schach_figuren_test.js` (S-W06), `lernen_test.js` (S-W07), `schule_test.js` (S-W08), `optik_test.js` (S-W09), `stimmung_test.js` (S-W10), `strecken_test.py` und `strecken_test.js` (S-W11), `wahrzeichen_test.py` und `wahrzeichen_test.js` (S-W12 und S-W13), `luft_test.js` (S-W03), `teilen_test.js` (S-W04), je mit `gegenproben_*.py`. Einzelne Tests mit `NUR=name`.
- `teilen.js` im Hauptordner ist der gemeinsame Baustein zum Teilen von Ergebnissen.

Specs: `werkstatt/specs/`. Symbole: `bilder/symbole/`.
