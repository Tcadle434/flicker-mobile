#!/usr/bin/env python3
"""Remove an image background and write a transparent PNG."""

from __future__ import annotations

import argparse
import io
import sys
from collections import deque
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Remove background from an image and output transparent PNG."
    )
    parser.add_argument("input", help="Input image path")
    parser.add_argument(
        "-o",
        "--output",
        help="Output PNG path (default: <input-stem>-transparent.png)",
    )
    parser.add_argument(
        "--model",
        default="isnet-general-use",
        help="rembg model name (default: isnet-general-use)",
    )
    parser.add_argument(
        "--method",
        choices=("auto", "rembg", "floodfill"),
        default="auto",
        help="Background removal method (default: auto)",
    )
    parser.add_argument(
        "--bg-threshold",
        type=int,
        default=36,
        help=(
            "Floodfill color-distance threshold for background detection "
            "(default: 36, range 1-255)"
        ),
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite output file if it already exists",
    )
    parser.add_argument(
        "--allow-opaque",
        action="store_true",
        help="Allow success even if output alpha appears fully opaque",
    )
    return parser.parse_args()


def resolve_paths(input_path_raw: str, output_path_raw: str | None) -> tuple[Path, Path]:
    input_path = Path(input_path_raw).expanduser().resolve()
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
    if not input_path.is_file():
        raise IsADirectoryError(f"Input path is not a file: {input_path}")

    if output_path_raw:
        output_path = Path(output_path_raw).expanduser().resolve()
        if output_path.suffix.lower() != ".png":
            output_path = output_path.with_suffix(".png")
    else:
        output_path = input_path.with_name(f"{input_path.stem}-transparent.png")

    return input_path, output_path


def load_dependencies():
    try:
        from PIL import Image
    except ImportError as exc:
        raise RuntimeError(
            "Missing dependency: pillow. Install with `python3 -m pip install pillow`."
        ) from exc

    return Image


def has_transparency(pil_image) -> bool:
    if pil_image.mode != "RGBA":
        return False
    alpha = pil_image.getchannel("A")
    min_alpha, max_alpha = alpha.getextrema()
    return min_alpha < 255 and max_alpha <= 255


def try_load_rembg():
    try:
        from rembg import new_session, remove
    except ImportError:
        return None
    return new_session, remove


def clamp_threshold(value: int) -> int:
    return max(1, min(255, int(value)))


def mean_corner_color(pixels, width: int, height: int) -> tuple[int, int, int]:
    sample = min(width, height, max(1, min(12, width // 20, height // 20)))
    points = []
    corners = (
        (0, 0),
        (max(0, width - sample), 0),
        (0, max(0, height - sample)),
        (max(0, width - sample), max(0, height - sample)),
    )
    for start_x, start_y in corners:
        for y in range(start_y, min(height, start_y + sample)):
            for x in range(start_x, min(width, start_x + sample)):
                points.append(pixels[x, y][:3])

    if not points:
        return (255, 255, 255)

    total_r = sum(rgb[0] for rgb in points)
    total_g = sum(rgb[1] for rgb in points)
    total_b = sum(rgb[2] for rgb in points)
    count = len(points)
    return (total_r // count, total_g // count, total_b // count)


def within_threshold(rgb: tuple[int, int, int], bg: tuple[int, int, int], threshold: int) -> bool:
    dr = abs(rgb[0] - bg[0])
    dg = abs(rgb[1] - bg[1])
    db = abs(rgb[2] - bg[2])
    return (dr + dg + db) <= threshold * 3


def floodfill_remove_background(image, threshold: int):
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    bg_color = mean_corner_color(pixels, width, height)
    threshold = clamp_threshold(threshold)

    visited = set()
    queue = deque()
    alpha_map = [[255] * width for _ in range(height)]

    def enqueue_if_bg(x: int, y: int):
        key = (x, y)
        if key in visited:
            return
        visited.add(key)
        if within_threshold(pixels[x, y][:3], bg_color, threshold):
            queue.append(key)

    for x in range(width):
        enqueue_if_bg(x, 0)
        enqueue_if_bg(x, height - 1)
    for y in range(height):
        enqueue_if_bg(0, y)
        enqueue_if_bg(width - 1, y)

    while queue:
        x, y = queue.popleft()
        alpha_map[y][x] = 0
        if x > 0:
            enqueue_if_bg(x - 1, y)
        if x < width - 1:
            enqueue_if_bg(x + 1, y)
        if y > 0:
            enqueue_if_bg(x, y - 1)
        if y < height - 1:
            enqueue_if_bg(x, y + 1)

    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            pixels[x, y] = (r, g, b, alpha_map[y][x])

    return rgba


def remove_with_rembg(input_path: Path, model: str):
    Image = load_dependencies()
    rembg_bundle = try_load_rembg()
    if rembg_bundle is None:
        raise RuntimeError(
            "Missing dependency: rembg. Install with `python3 -m pip install rembg`."
        )
    new_session, remove = rembg_bundle
    session = new_session(model_name=model)

    with Image.open(input_path) as in_image:
        in_image = in_image.convert("RGBA")
        with io.BytesIO() as input_buffer:
            in_image.save(input_buffer, format="PNG")
            input_bytes = input_buffer.getvalue()

    output_bytes = remove(input_bytes, session=session)
    with Image.open(io.BytesIO(output_bytes)) as out_image:
        return out_image.convert("RGBA")


def remove_with_floodfill(input_path: Path, threshold: int):
    Image = load_dependencies()
    with Image.open(input_path) as in_image:
        return floodfill_remove_background(in_image, threshold=threshold)


def remove_background(
    input_path: Path,
    output_path: Path,
    method: str,
    model: str,
    bg_threshold: int,
    force: bool,
    allow_opaque: bool,
) -> Path:
    if output_path.exists() and not force:
        raise FileExistsError(
            f"Output already exists: {output_path}. Use --force to overwrite."
        )

    if method == "rembg":
        out_image = remove_with_rembg(input_path=input_path, model=model)
    elif method == "floodfill":
        out_image = remove_with_floodfill(input_path=input_path, threshold=bg_threshold)
    else:
        rembg_bundle = try_load_rembg()
        if rembg_bundle is not None:
            out_image = remove_with_rembg(input_path=input_path, model=model)
        else:
            out_image = remove_with_floodfill(input_path=input_path, threshold=bg_threshold)

    if not allow_opaque and not has_transparency(out_image):
        raise RuntimeError(
            "No transparent pixels detected in output. "
            "Try --method rembg, tune --bg-threshold, or pass --allow-opaque."
        )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    out_image.save(output_path, format="PNG")

    return output_path


def main() -> int:
    args = parse_args()
    try:
        input_path, output_path = resolve_paths(args.input, args.output)
        written_path = remove_background(
            input_path=input_path,
            output_path=output_path,
            method=args.method,
            model=args.model,
            bg_threshold=args.bg_threshold,
            force=args.force,
            allow_opaque=args.allow_opaque,
        )
    except Exception as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1

    print(str(written_path))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
