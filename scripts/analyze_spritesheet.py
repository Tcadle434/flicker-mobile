#!/usr/bin/env python3
"""
Sprite Sheet Analyzer
Analyzes sprite sheet PNGs to auto-detect grid layout and generate metadata JSON.
Finds frame boundaries by detecting transparent gaps between frames.
"""

import json
import os
import sys
import numpy as np
from PIL import Image

Image.MAX_IMAGE_PIXELS = 200_000_000  # Allow large sprite sheets


def find_grid(img_path: str) -> dict:
    """Analyze a sprite sheet and return metadata."""
    img = Image.open(img_path)
    w, h = img.size
    print(f"  Sheet size: {w}x{h}")

    # Convert alpha channel to numpy array
    alpha = np.array(img.split()[-1])  # Alpha channel

    # Sum alpha values along each axis to find content vs gaps
    # Columns: sum alpha along vertical axis (for each x position)
    col_sums = alpha.sum(axis=0)
    # Rows: sum alpha along horizontal axis (for each y position)
    row_sums = alpha.sum(axis=1)

    # Find content regions (non-zero alpha runs)
    def find_regions(sums, min_gap=5):
        """Find contiguous regions of content separated by gaps."""
        is_content = sums > 0
        regions = []
        in_region = False
        start = 0

        for i, val in enumerate(is_content):
            if val and not in_region:
                start = i
                in_region = True
            elif not val and in_region:
                regions.append((start, i))
                in_region = False
        if in_region:
            regions.append((start, len(sums)))

        # Merge regions that are separated by very small gaps (< min_gap px)
        merged = [regions[0]] if regions else []
        for r in regions[1:]:
            if r[0] - merged[-1][1] < min_gap:
                merged[-1] = (merged[-1][0], r[1])
            else:
                merged.append(r)
        return merged

    col_regions = find_regions(col_sums)
    row_regions = find_regions(row_sums)

    # The number of frame columns/rows
    # Try to detect uniform frame size by looking at region widths
    col_widths = [r[1] - r[0] for r in col_regions]
    row_heights = [r[1] - r[0] for r in row_regions]

    print(f"  Detected {len(col_regions)} columns, {len(row_regions)} rows")

    if not col_regions or not row_regions:
        print("  ERROR: Could not detect grid")
        return None

    # Use median width/height as the frame size (robust to last row/col being partial)
    frame_w = int(np.median(col_widths))
    frame_h = int(np.median(row_heights))

    # Alternative approach: if regions aren't cleanly separated (frames touch),
    # try dividing the sheet evenly
    cols = len(col_regions)
    rows = len(row_regions)

    # Check if frames might be touching (no gaps between them)
    # In that case, regions would merge into one big block
    if cols == 1 and rows == 1:
        print("  Frames appear to touch — trying uniform division...")
        # Try common grid sizes and find the best fit
        # Look for the frame size that produces square-ish frames
        best = None
        for try_cols in range(4, 20):
            fw = w // try_cols
            if fw == 0:
                continue
            try_rows = h // fw  # assume square frames
            if try_rows == 0:
                continue
            # Check if this divides evenly-ish
            w_remainder = w % try_cols
            aspect = fw / (h // try_rows) if try_rows > 0 else 999
            if 0.7 < aspect < 1.4 and w_remainder < try_cols:
                score = abs(aspect - 1.0) + (w_remainder / w)
                if best is None or score < best[0]:
                    best = (score, try_cols, try_rows, fw, h // try_rows)

        if best:
            _, cols, rows, frame_w, frame_h = best
            print(f"  Best uniform grid: {cols}x{rows}, frame: {frame_w}x{frame_h}")
        else:
            # Fallback: divide by common frame size
            frame_w = w // 8
            frame_h = h // 8
            cols = 8
            rows = 8
            print(f"  Fallback grid: {cols}x{rows}")
    else:
        # Use detected regions — compute frame size from sheet / grid count
        frame_w = w // cols
        frame_h = h // rows
        print(f"  Frame size: {frame_w}x{frame_h}")

    # Count valid frames (non-empty cells)
    valid_frames = 0
    for row in range(rows):
        for col in range(cols):
            x1 = col * frame_w
            y1 = row * frame_h
            x2 = min(x1 + frame_w, w)
            y2 = min(y1 + frame_h, h)

            cell_alpha = alpha[y1:y2, x1:x2]
            if cell_alpha.sum() > 0:
                valid_frames += 1
            else:
                # Once we hit an empty cell, assume rest are empty too
                break
        else:
            continue
        break  # empty cell found, stop

    # If the break logic didn't trigger, all cells are valid
    if valid_frames == 0:
        valid_frames = cols * rows

    # Recount more carefully — check each cell individually
    valid_frames = 0
    for row in range(rows):
        for col in range(cols):
            x1 = col * frame_w
            y1 = row * frame_h
            x2 = min(x1 + frame_w, w)
            y2 = min(y1 + frame_h, h)
            cell_alpha = alpha[y1:y2, x1:x2]
            if cell_alpha.sum() > 100:  # threshold to ignore noise
                valid_frames += 1

    print(f"  Valid frames: {valid_frames} / {cols * rows}")

    return {
        "columns": cols,
        "rows": rows,
        "frameWidth": frame_w,
        "frameHeight": frame_h,
        "frameCount": valid_frames,
        "fps": 12,
        "loop": True,
    }


def main():
    sprites_dir = sys.argv[1] if len(sys.argv) > 1 else "/Users/thomascadle/flicker-mobile/assets/sprites"
    output_path = os.path.join(sprites_dir, "sprite_metadata.json")

    metadata = {}

    for filename in sorted(os.listdir(sprites_dir)):
        if not filename.endswith(".png"):
            continue

        name = filename.replace(".png", "")
        filepath = os.path.join(sprites_dir, filename)
        print(f"\nAnalyzing: {filename}")

        result = find_grid(filepath)
        if result:
            metadata[name] = result

    # Write metadata JSON
    with open(output_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nMetadata written to: {output_path}")
    print(json.dumps(metadata, indent=2))


if __name__ == "__main__":
    main()
