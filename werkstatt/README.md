# Werkstatt der Spieleseite

Prüfungen, bevor etwas auf die Seite kommt (Shift Left):

- `bash werkstatt/install_hooks.sh` einmal je Klon: Commit prüft statisch, Push prüft Gegenproben und Handyformat.
- `werkstatt/fehlerliste.md`: spät gefundene Fehler mit frühester Stufe (Rückblick nach jeder Änderung).
- `python3 werkstatt/seite_pruefen.py` statisch (Grundgerüst, keine fremden Server, Verweise, Zurück-Link, Symbol, Anonymität, keine Fachsprache).
- `python3 werkstatt/seite_pruefen.py --gegenproben` prüft die Prüfung selbst (12 Verstöße müssen rot, 6 erlaubte Fälle grün bleiben).
- `node werkstatt/seite_handy.js` lädt alle Seiten bei 412×915 und 915×412 mit Playwright.
- `bash werkstatt/alle_tests.sh` alles zusammen (läuft vor jedem Push); `bash werkstatt/alle_tests.sh voll` zusätzlich alle Gegenproben.
- App-Tests in `werkstatt/tests/`: `brett_test.js` (S-W02), `brett3d_test.js` (S-W05), `schach_figuren_test.js` (S-W06), `lernen_test.js` (S-W07), `schule_test.js` (S-W08), `optik_test.js` (S-W09), `stimmung_test.js` (S-W10), `strecken_test.py` und `strecken_test.js` (S-W11), `wahrzeichen_test.py` und `wahrzeichen_test.js` (S-W12 bis S-W14), `luft_test.js` (S-W03), `teilen_test.js` (S-W04), je mit `gegenproben_*.py`. Einzelne Tests mit `NUR=name`.
- `teilen.js` im Hauptordner ist der gemeinsame Baustein zum Teilen von Ergebnissen.

Specs: `werkstatt/specs/`. Symbole: `bilder/symbole/`.

## Erlebnis prüfen (Pflicht bei sichtbaren Änderungen, seit 04.11.2026)
Shift Left fängt technische Fehler; Fehler im Erlebnis (zu schwach, nicht lesbar, nicht wie das Original) fielen bisher erst am Handy auf. Deshalb:
1. **Aus Spielersicht prüfen:** Vor dem Veröffentlichen mindestens ein Bild aus dem laufenden Spiel (Spielerkamera, Handyformat), auf dem die Änderung zu sehen ist, selbst ansehen und der Meldung beilegen. Einzelvorschauen ersetzen das nicht. Ohne dieses Bild ist die Änderung nicht fertig.
2. **Wahrnehmung als Zahl in die Spec:** Für alles Sichtbare messbare Kriterien aus Spielersicht (Mindestgröße in Pixeln bei festem Abstand, Kontrast, Sichtdauer, Sekunden bis zum Wow-Moment), mit Test.
3. **Vorher zeigen:** Bei sichtbaren Änderungen mit Geschmacksfrage zwei oder drei Varianten als Bild zur Auswahl vorlegen, bevor gebaut wird; bis zur Antwort an der empfohlenen weiterarbeiten.
4. **Nächsten Schritt mitdenken:** Naheliegende Erweiterungen (bei Nachbauten echter Orte: Namen, echte Formen, Details) selbst anbieten oder in die Spec aufnehmen, statt auf die Nachfrage zu warten.
5. **Spiele-Maßstab:** Jede Spiel-Spec prüft die zehn Merkmale aus `/mnt/project-files/docs/allgemein/spiele-qualitaet.md`.
