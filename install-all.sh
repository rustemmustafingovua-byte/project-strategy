#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="/tmp"
BETTER_DRIVER="/Users/admin/better_driver"

REPOS=(
  "lumen-chain"
  "agent-x402"
  "wallet-hygiene"
  "perps-funding-pulse"
  "mcp-proxy"
)

clone_if_missing() {
  local name="$1"
  local url="https://github.com/rustemmustafingovua-byte/${name}.git"
  local dir="${BASE_DIR}/${name}"

  if [ ! -d "${dir}/.git" ]; then
    echo "[install] cloning ${name} -> ${dir}"
    git clone --depth=1 "${url}" "${dir}"
  else
    echo "[install] ${name} already present, skipping clone"
  fi
}

install_node() {
  local dir="$1"
  echo "[install] npm install in ${dir}"
  cd "${dir}"
  npm install --no-audit --no-fund
}

install_flutter() {
  local dir="$1"
  echo "[install] flutter pub get in ${dir}"
  cd "${dir}"
  flutter pub get
}

# 1. Clone repos that might be missing
for repo in "${REPOS[@]}"; do
  clone_if_missing "${repo}"
done

# 2. Install Node dependencies
for repo in "${REPOS[@]}"; do
  install_node "${BASE_DIR}/${repo}"
done

# 3. Install Flutter dependencies
if [ -d "${BETTER_DRIVER}/.git" ]; then
  install_flutter "${BETTER_DRIVER}"
else
  echo "[install] better-driver not found at ${BETTER_DRIVER}, skipping"
fi

echo "[install] done. All projects cloned and dependencies installed."
