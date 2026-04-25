#!/usr/bin/env bash
# Aktiviert die Git-Hooks unter scripts/git-hooks/.
# Auf jedem Rechner einmal nach dem Clone laufen lassen.

set -e
cd "$(dirname "$0")/.."

git config core.hooksPath scripts/git-hooks
chmod +x scripts/git-hooks/*

echo "✓ Git-Hooks aktiviert (core.hooksPath = scripts/git-hooks)"
echo "  pre-push    → pusht DB nach R2 vor jedem git push"
echo "  post-merge  → pullt DB von R2 nach jedem git pull/merge"
echo ""
echo "Bypass falls nötig: git push --no-verify"
