#!/usr/bin/env bash
# Schaltet die Prüfungen vor Commit und Push ein. Nie --no-verify.
cd "$(git rev-parse --show-toplevel)" || exit 1
git config core.hooksPath werkstatt/hooks
chmod +x werkstatt/hooks/*
echo "Hooks aktiv: werkstatt/hooks"
