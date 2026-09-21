#!/usr/bin/env bash
# Auf dem Laptop ausführen (Pfad wie im Finder: Persönlicher Ordner/RD_Design/Dev/Projekte)
set -euo pipefail

TARGET="${1:-$HOME/RD_Design/Dev/Projekte/signal-grove}"
REPO_NAME="signal-grove"

mkdir -p "$(dirname "$TARGET")"

if [[ -d "$TARGET/.git" ]]; then
  echo "Ordner existiert schon: $TARGET"
  cd "$TARGET"
else
  # Privates GitHub-Repo anlegen und klonen (braucht: gh auth login)
  gh auth status
  gh repo create "$REPO_NAME" --private --clone --description "Signal Grove — local SEO + GEO tracker (Astro)"
  # gh clone legt ./signal-grove im CWD an — wir wollen festen Pfad
  if [[ -d "./$REPO_NAME" && "$(pwd)/$REPO_NAME" != "$TARGET" ]]; then
    mkdir -p "$(dirname "$TARGET")"
    mv "./$REPO_NAME" "$TARGET"
  fi
  cd "$TARGET"
fi

echo "Als Nächstes den Code von der Cloud-Branch holen oder aus dem Bundle entpacken."
echo "Dann:"
echo "  cd \"$TARGET\""
echo "  npm install"
echo "  npm run dev"
echo "Browser: http://127.0.0.1:43127"
