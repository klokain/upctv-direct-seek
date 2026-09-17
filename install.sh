#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/upctv-seek-mod"
FLAGS_FILE="${BRAVE_FLAGS_FILE:-$HOME/.config/brave-flags.conf}"
EXTENSION_FLAG="--load-extension="

if [[ ! -f "$SOURCE_DIR/extension/manifest.json" || ! -f "$SOURCE_DIR/extension/seek.js" ]]; then
  echo "Extension source is incomplete: $SOURCE_DIR/extension" >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR" "$(dirname -- "$FLAGS_FILE")"
install -m 0644 "$SOURCE_DIR/extension/manifest.json" "$INSTALL_DIR/manifest.json"
install -m 0644 "$SOURCE_DIR/extension/seek.js" "$INSTALL_DIR/seek.js"
touch "$FLAGS_FILE"

if ! grep -Fq -- "$INSTALL_DIR" "$FLAGS_FILE"; then
  cp -a "$FLAGS_FILE" "$FLAGS_FILE.bak.$(date +%Y%m%d-%H%M%S)"
fi

python - "$FLAGS_FILE" "$INSTALL_DIR" <<'PY'
from pathlib import Path
import sys

flags_file = Path(sys.argv[1])
extension_dir = sys.argv[2]
prefix = "--load-extension="
lines = flags_file.read_text().splitlines()

for index, line in enumerate(lines):
    if not line.startswith(prefix):
        continue
    paths = [value for value in line[len(prefix):].split(",") if value]
    if extension_dir not in paths:
        paths.append(extension_dir)
    lines[index] = prefix + ",".join(paths)
    break
else:
    lines.append(prefix + extension_dir)

flags_file.write_text("\n".join(lines) + "\n")
PY

printf 'Installed UPC TV Direct Seek to: %s\n' "$INSTALL_DIR"
printf 'Updated Brave flags: %s\n' "$FLAGS_FILE"
printf '%s\n' 'Close every Brave window/web app, then reopen UPC TV.'
