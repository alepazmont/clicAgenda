#!/usr/bin/env bash
# Configura env vars en el proyecto Vercel clicagenda-demo.
# Requiere: VERCEL_TOKEN en entorno y backend/.env con los valores.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "Exporta VERCEL_TOKEN (https://vercel.com/account/tokens)"
  exit 1
fi

if [[ ! -f backend/.env ]]; then
  echo "Falta backend/.env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source backend/.env
set +a

PROD_URL="${FRONTEND_URL:-https://clicagenda.vercel.app}"
PROJECT_ID="prj_NjX3aAmVIYmtr65Fg8doxJSBayOg"
TEAM="team_O7syCCWmG04PYTVZ0MdANtf7"

add_env() {
  local key="$1"
  local val="$2"
  curl -sf -X POST "https://api.vercel.com/v10/projects/${PROJECT_ID}/env?teamId=${TEAM}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(node -e "console.log(JSON.stringify({key:process.argv[1],value:process.argv[2],type:'encrypted',target:['production','preview','development']}))" "$key" "$val")" \
    >/dev/null && echo "OK $key" || echo "FAIL $key"
}

add_env DATABASE_URL "$DATABASE_URL"
add_env JWT_SECRET "$JWT_SECRET"
add_env SUPERADMIN_TOKEN_SECRET "$SUPERADMIN_TOKEN_SECRET"
add_env FRONTEND_URL "$PROD_URL"
add_env PANEL_URL "$PROD_URL"
echo "Hecho."
