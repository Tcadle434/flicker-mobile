---
name: remove-image-background
description: Remove backgrounds from user-provided image files and output transparent PNGs while preserving the main subject. Use when a user asks to make an image background transparent, cut out a product/person/logo, prepare sticker or app/game assets, or return a PNG with alpha.
---

# Remove Image Background

## Overview

Use this skill to turn an input image into a transparent-background PNG with subject detail preserved.
Run the bundled script for deterministic output and return the final PNG path.

## Quick Workflow

1. Ask for an input image path if one is not provided.
2. Choose an output path ending in `.png`. Default to `<input-stem>-transparent.png`.
3. Run:

```bash
python3 scripts/remove_background.py "<input_path>" --output "<output_path>"
```

4. If the subject edges need improvement, retry with a different model:

```bash
python3 scripts/remove_background.py "<input_path>" --output "<output_path>" --model isnet-anime
```

5. If `rembg` is unavailable, run with the local fallback:

```bash
python3 scripts/remove_background.py "<input_path>" --output "<output_path>" --method floodfill
```

6. Return the output PNG path in the response. If supported, attach/display the resulting image.

## Script

Use `scripts/remove_background.py` for all background removal operations.

### Inputs

- Required: input image path (`.png`, `.jpg`, `.jpeg`, `.webp`, etc.)
- Optional: `--output <path>` to set output PNG location
- Optional: `--model <name>` to choose rembg model (default: `isnet-general-use`)
- Optional: `--method auto|rembg|floodfill` to select segmentation approach
- Optional: `--bg-threshold <1-255>` to tune floodfill background sensitivity
- Optional: `--force` to overwrite an existing output file
- Optional: `--allow-opaque` to skip alpha-channel enforcement

### Output

- A PNG file with RGBA alpha channel
- Absolute path printed to stdout on success

## Dependency Setup

Install dependencies when missing:

```bash
python3 -m pip install pillow
```

Optional higher-quality model path:

```bash
python3 -m pip install rembg
```

`rembg` may download a segmentation model on first run.

## Response Requirements

- Return the generated PNG path.
- Mention if `--allow-opaque` was needed because transparency could not be detected.
