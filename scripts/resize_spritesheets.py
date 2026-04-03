#!/usr/bin/env python3
"""
Resize all Flicker sprite sheets to smaller frame sizes.

Reads sprite_metadata.json, resizes each sheet so frames are TARGET_W wide
(maintaining aspect ratio), overwrites the PNGs, and updates the metadata.
"""

import json
import os
from pathlib import Path
from PIL import Image

SPRITES_DIR = Path(__file__).parent.parent / "assets" / "sprites"
METADATA_PATH = SPRITES_DIR / "sprite_metadata.json"
TARGET_W = 512  # pixels per frame width

def resize_sheet(name: str, meta: dict) -> dict:
    path = SPRITES_DIR / f"{name}.png"
    if not path.exists():
        print(f"  SKIP {name} — file not found")
        return meta

    img = Image.open(path)
    old_fw = meta["frameWidth"]
    old_fh = meta["frameHeight"]
    cols = meta["columns"]
    rows = meta["rows"]

    # Calculate new frame dimensions (maintain aspect ratio)
    scale = TARGET_W / old_fw
    new_fw = TARGET_W
    new_fh = round(old_fh * scale)

    # New total sheet size
    new_sheet_w = new_fw * cols
    new_sheet_h = new_fh * rows

    old_sheet_w = img.width
    old_sheet_h = img.height

    print(f"  {name}")
    print(f"    frame: {old_fw}x{old_fh} -> {new_fw}x{new_fh}")
    print(f"    sheet: {old_sheet_w}x{old_sheet_h} -> {new_sheet_w}x{new_sheet_h}")
    print(f"    scale: {scale:.3f}")

    # Resize the whole sheet at once (much faster than per-frame)
    resized = img.resize((new_sheet_w, new_sheet_h), Image.LANCZOS)

    # Overwrite original
    resized.save(path, "PNG", optimize=True)
    new_size = path.stat().st_size
    print(f"    size:  {new_size / 1024 / 1024:.1f} MB")

    # Update metadata
    meta["frameWidth"] = new_fw
    meta["frameHeight"] = new_fh
    return meta


def main():
    with open(METADATA_PATH) as f:
        metadata = json.load(f)

    print(f"Resizing {len(metadata)} sprite sheets to {TARGET_W}px frame width...\n")

    for name, meta in metadata.items():
        if meta["frameWidth"] <= TARGET_W:
            print(f"  SKIP {name} — already {meta['frameWidth']}px wide")
            continue
        metadata[name] = resize_sheet(name, meta)

    # Write updated metadata
    with open(METADATA_PATH, "w") as f:
        json.dump(metadata, f, indent="\t")
        f.write("\n")

    print("\nDone! Metadata updated.")


if __name__ == "__main__":
    main()
