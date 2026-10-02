#!/usr/bin/env sh
# DC Skills · instalador para Linux / macOS / Git Bash
#   curl -fsSL https://raw.githubusercontent.com/danycabarcas/dc-skills/main/install.sh | sh
set -e
REPO="https://github.com/danycabarcas/dc-skills.git"
DC_HOME="${DC_SKILLS_HOME:-$HOME/.dc-skills}"
DIR="$DC_HOME/repo"

command -v node >/dev/null 2>&1 || { echo "Necesitas Node.js 22.13+ (https://nodejs.org)"; exit 1; }
node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=13)?0:1)' \
  || { echo "Node $(node -v) es muy viejo; instala 22.13+ (recomendado 24 LTS)."; exit 1; }
command -v git >/dev/null 2>&1 || { echo "Necesitas git"; exit 1; }

mkdir -p "$DC_HOME"
if [ -d "$DIR/.git" ]; then
  echo "Actualizando dc-skills..."
  git -C "$DIR" pull --ff-only
else
  echo "Clonando dc-skills en $DIR ..."
  git clone --depth 1 "$REPO" "$DIR"
fi

# Instalación global enlazada a la carpeta: `dc-skills self-update` hace git pull y listo.
npm install -g "$DIR"

dc-skills doctor
printf '\nListo. En la carpeta de tu proyecto ejecuta:  dc-skills\n'
