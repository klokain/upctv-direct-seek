#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/upctv-seek-mod"
FLAGS_FILE="${BRAVE_FLAGS_FILE:-$HOME/.config/brave-flags.conf}"

if [[ -f "$FLAGS_FILE" ]]; then
  cp -a "$FLAGS_FILE" "$FLAGS_FILE.bak.$(date +%Y%m%d-%H%M%S)"
  python - "$FLAGS_FILE" "$INSTALL_DIR" <<'PY'
from pathlib import Path
import sys

flags_file = Path(sys.argv[1])
extension_dir = sys.argv[2]
prefix = "--load-extension="
output = []

for line in flags_file.read_text().splitlines():
    if not line.startswith(prefix):
        output.append(line)
        continue
    paths = [
        value
        for value in line[len(prefix):].split(",")
        if value and value != extension_dir
    ]
    if paths:
        output.append(prefix + ",".join(paths))

flags_file.write_text("\n".join(output) + ("\n" if output else ""))
PY
fi

rm -rf -- "$INSTALL_DIR"
printf 'Removed UPC TV Direct Seek from: %s\n' "$INSTALL_DIR"
printf '%s\n' 'Close every Brave window/web app for the change to take effect.'
