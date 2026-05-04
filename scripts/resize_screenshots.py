#!/usr/bin/env python3
"""Resize raw screenshots to the Chrome Web Store target size (1280x800).

Pads with a neutral background (matching the typical white page) instead of
cropping, so no UI is lost. Drop input PNGs into store/screenshots/raw/ and
this writes 1280x800 PNGs to store/screenshots/.

Usage: python3 scripts/resize_screenshots.py
"""

from PIL import Image
import os, sys, pathlib

TARGET = (1280, 800)
BG = (255, 255, 255)

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "store" / "screenshots" / "raw"
OUT_DIR = ROOT / "store" / "screenshots"

def fit(img, size, bg):
    """Scale img to fit inside size, centered, padding with bg."""
    tw, th = size
    iw, ih = img.size
    scale = min(tw / iw, th / ih)
    nw, nh = int(iw * scale), int(ih * scale)
    scaled = img.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGB", size, bg)
    canvas.paste(scaled, ((tw - nw) // 2, (th - nh) // 2))
    return canvas

def main(args):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if args:
        sources = list(args)
    elif RAW_DIR.exists():
        sources = sorted(RAW_DIR.glob("*.png"))
    else:
        sources = []
    if not sources:
        print(f"no PNGs in {RAW_DIR}; pass paths as args instead")
        return 1
    for i, src in enumerate(sources, 1):
        src = pathlib.Path(src)
        img = Image.open(src).convert("RGB")
        out = fit(img, TARGET, BG)
        out_path = OUT_DIR / f"screenshot{i}.png"
        out.save(out_path, "PNG", optimize=True)
        print(f"{src.name} ({img.size[0]}x{img.size[1]}) -> {out_path.name} {TARGET}")
    return 0

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
