#!/usr/bin/env python3
"""Tests für werkstatt/lsp_pruefen.py (Spec werkstatt/specs/S-W28).

Aufruf: python3 werkstatt/tests/lsp_test.py
Jeder Test arbeitet auf einer Kopie von driftpokal/index.html; die echte Datei wird nie verändert.
"""
import os
import re
import subprocess
import sys
import tempfile
import time
import unittest

WURZEL = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SKRIPT = os.path.join(WURZEL, "werkstatt", "lsp_pruefen.py")
ORIGINAL = os.path.join(WURZEL, "driftpokal", "index.html")
BLOCK = re.compile(r"(<script\b[^>]*>)(.*?)(</script>)", re.S)


def lauf(datei, env=None):
    t = time.time()
    p = subprocess.run([sys.executable, SKRIPT, datei], capture_output=True, text=True,
                       env=env, timeout=120)
    return p.returncode, p.stdout + p.stderr, time.time() - t


def bloecke(text):
    """Liefert (Treffer-Objekte) der Skriptblöcke ohne src-Attribut."""
    return [m for m in BLOCK.finditer(text) if "src=" not in m.group(1) and m.group(2).strip()]


def spiel_block(text):
    """Der Block ohne "three.js" am Anfang (gleiche Regel wie lsp_pruefen.py)."""
    for m in bloecke(text):
        if "three.js" not in m.group(2)[:300]:
            return m
    raise AssertionError("Spielblock nicht gefunden")


def vendor_block(text):
    for m in bloecke(text):
        if "three.js" in m.group(2)[:300]:
            return m
    raise AssertionError("three.js-Block nicht gefunden")


def mit_einfuegung(tmp, text, block_fn, eintrag, am_anfang=True):
    m = block_fn(text)
    stelle = m.start(2) if am_anfang else m.end(2)
    neu = text[:stelle] + eintrag + text[stelle:]
    pfad = os.path.join(tmp, "index.html")
    with open(pfad, "w", encoding="utf-8") as f:
        f.write(neu)
    return pfad


class LspPruefen(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(ORIGINAL, encoding="utf-8") as f:
            cls.text = f.read()
        cls.tmp = tempfile.mkdtemp(prefix="lsp_test_")

    def _kopie(self, eintrag, block_fn=spiel_block, am_anfang=True):
        d = tempfile.mkdtemp(dir=self.tmp)
        return mit_einfuegung(d, self.text, block_fn, eintrag, am_anfang)

    # AK-1 / PS-1 Normal: sauberer Stand
    def test_ak1_sauberer_stand_ist_gruen(self):
        rc, out, _ = lauf(ORIGINAL)
        self.assertEqual(rc, 0, out)
        self.assertIn("LSP-Diagnose: keine Befunde", out)

    # AK-2 / PS-2 Normal: unbekannter Name
    def test_ak2_unbekannter_name_wird_erkannt(self):
        rc, out, _ = lauf(self._kopie("\nzzUnbekannt();\n"))
        self.assertEqual(rc, 1, out)
        self.assertRegex(out, r"TS2(304|552)")
        self.assertRegex(out, r"index\.html:\d+")

    # AK-3 / PS-4 Fehlerfall: Syntaxfehler
    def test_ak3_syntaxfehler_wird_erkannt(self):
        rc, out, _ = lauf(self._kopie("\nif (( {\n"))
        self.assertEqual(rc, 1, out)
        self.assertRegex(out, r"TS1\d{3}")

    # AK-4 / PS-7 Missbrauch: doppelte Deklaration
    def test_ak4_doppelte_deklaration_wird_erkannt(self):
        rc, out, _ = lauf(self._kopie("\nconst zzDup = 1;\nconst zzDup = 2;\n"))
        self.assertEqual(rc, 1, out)
        self.assertRegex(out, r"TS(2451|2300|2393)")

    # AK-5 / PS-5 Fehlerfall: tsc fehlt
    def test_ak5_fehlendes_tsc_ist_fehler_nicht_gruen(self):
        leer = tempfile.mkdtemp(dir=self.tmp)
        env = dict(os.environ, PATH=leer)
        rc, out, _ = lauf(ORIGINAL, env=env)
        self.assertEqual(rc, 2, out)
        self.assertIn("tsc", out)

    # AK-6 / PS-6 Fehlerfall: Datei fehlt
    def test_ak6_fehlende_datei_ist_exit_2(self):
        rc, out, _ = lauf(os.path.join(self.tmp, "gibt-es-nicht.html"))
        self.assertEqual(rc, 2, out)

    # AK-7 / PS-3 Grenzwert: Setter mit Standardwert ist gültiges JS
    def test_ak7_setter_mit_standardwert_bleibt_gruen(self):
        rc, out, _ = lauf(self._kopie("\nclass ZzSetter { set x(v = 1) { this.y = v; } }\n"))
        self.assertEqual(rc, 0, out)

    # AK-8 / Gegenprobe Fehlalarm: Fehler nur im three.js-Block
    def test_ak8_fehler_im_vendor_block_wird_nicht_gemeldet(self):
        rc, out, _ = lauf(self._kopie("\nzzUnbekannt();\n", block_fn=vendor_block))
        self.assertEqual(rc, 0, out)

    # AK-9 / PS-9 Wiederholbarkeit
    def test_ak9_wiederholbar(self):
        pfad = self._kopie("\nzzUnbekannt();\n")
        rc1, out1, _ = lauf(pfad)
        rc2, out2, _ = lauf(pfad)
        self.assertEqual(rc1, rc2)
        self.assertEqual(out1, out2)

    # AK-10 Laufzeit
    def test_ak10_laufzeit_unter_30_sekunden(self):
        rc, out, dauer = lauf(ORIGINAL)
        self.assertEqual(rc, 0, out)
        self.assertLess(dauer, 30.0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
