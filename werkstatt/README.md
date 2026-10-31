# Werkstatt der Spieleseite

Prüfungen, bevor etwas auf die Seite kommt (Shift Left):

- `bash werkstatt/install_hooks.sh` einmal je Klon: Commit prüft statisch, Push prüft Gegenproben und Handyformat.
- `python3 werkstatt/seite_pruefen.py` statisch (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol, Anonymität, keine Fachsprache).
- `python3 werkstatt/seite_pruefen.py --gegenproben` prüft die Prüfung selbst (12 Verstöße müssen rot, 6 erlaubte Fälle grün bleiben).
- `node werkstatt/seite_handy.js` lädt alle Seiten bei 412×915 und 915×412 mit Playwright.

Specs: `werkstatt/specs/`. Symbole: `bilder/symbole/`.
