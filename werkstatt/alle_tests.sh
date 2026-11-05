#!/usr/bin/env bash
# Alle Prüfungen der Spieleseite. Aufruf: bash werkstatt/alle_tests.sh [schnell|voll]
#   schnell (Standard, ~5 min): statisch, Handyformat, App-Tests Brettspiele, Luftdrift, Teilen
#   voll (~20 min): zusätzlich alle Gegenproben (jeder absichtliche Fehler muss seinen Test rot machen)
cd "$(dirname "$0")/.." || exit 1
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
set -e
python3 werkstatt/seite_pruefen.py --gegenproben
node werkstatt/seite_handy.js
python3 werkstatt/tests/strecken_test.py
python3 werkstatt/tests/wahrzeichen_test.py
for t in etappe brett brett3d schach_figuren lernen schule optik stimmung strecken wahrzeichen luft teilen; do node "werkstatt/tests/${t}_test.js"; done
if [ "${1:-schnell}" = voll ]; then
  for g in brett brett3d schach_figuren lernen schule optik stimmung strecken wahrzeichen luft teilen; do python3 "werkstatt/tests/gegenproben_${g}.py"; done
fi
echo "Alle Prüfungen grün (${1:-schnell})."
