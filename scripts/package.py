#!/usr/bin/env python3
"""Package only extension runtime files, with a repeatable ZIP layout."""
import json
import sys
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[1]
extension = root / "extension"
manifest = json.loads((extension / "manifest.json").read_text())
if len(sys.argv) != 2:
    raise SystemExit("Usage: python3 scripts/package.py /path/to/output.zip")
destination = Path(sys.argv[1]).resolve()
if destination.is_relative_to(extension):
    raise SystemExit("Output ZIP must be outside extension/.")
destination.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(destination, "w", compression=ZIP_DEFLATED) as archive:
    for path in sorted(extension.rglob("*")):
        relative = path.relative_to(extension)
        if not path.is_file() or any(part.startswith(".") for part in relative.parts):
            continue
        entry = ZipInfo(relative.as_posix(), date_time=(2026, 10, 28, 0, 0, 0))
        entry.compress_type = ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        archive.writestr(entry, path.read_bytes())
print(f"Packaged ChatGPT Chime {manifest['version']}: {destination}")
