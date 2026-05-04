#!/usr/bin/env python3
"""Generate Chrome Web Store visual assets:
- store/icon_store_128.png       128x128 polished store icon
- store/promo_tile_440x280.png   small promo tile
- store/promo_tile_1400x560.png  marquee promo tile (optional)

Same two-document motif as the toolbar icon (paywalled doc with red lock,
preprint doc in green) plus a soft drop shadow.
"""

from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "store"
OUT.mkdir(parents=True, exist_ok=True)

BLUE = (21, 101, 192, 255)
RED = (198, 40, 40, 255)
GREEN_DARK = (46, 125, 50, 255)
GREEN_LIGHT = (180, 230, 200, 255)
WHITE = (255, 255, 255, 255)


def find_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
        if bold
        else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def draw_icon(size, with_shadow=True):
    """Render the two-document icon at any size, with optional drop shadow."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded blue background.
    radius = int(s * 0.22)
    d.rounded_rectangle([(0, 0), (s, s)], radius=radius, fill=BLUE)

    # Back document (paywalled, white with red lock dot).
    pad = int(s * 0.20)
    doc_w = int(s * 0.46)
    doc_h = int(s * 0.56)
    bx, by = pad, pad
    d.rounded_rectangle(
        [(bx, by), (bx + doc_w, by + doc_h)],
        radius=int(s * 0.04),
        fill=(255, 255, 255, 235),
    )
    lock_r = int(s * 0.05)
    lock_cx = bx + doc_w - int(s * 0.07)
    lock_cy = by + int(s * 0.07)
    d.ellipse(
        [(lock_cx - lock_r, lock_cy - lock_r), (lock_cx + lock_r, lock_cy + lock_r)],
        fill=RED,
    )

    # Front document (preprint, green).
    fx = pad + int(s * 0.18)
    fy = pad + int(s * 0.18)
    d.rounded_rectangle(
        [(fx, fy), (fx + doc_w, fy + doc_h)],
        radius=int(s * 0.04),
        fill=GREEN_LIGHT,
        outline=GREEN_DARK,
        width=max(2, s // 80),
    )
    line_pad = int(s * 0.06)
    line_y0 = fy + int(s * 0.16)
    line_h = max(2, s // 80)
    for i in range(4):
        ly = line_y0 + i * int(s * 0.10)
        lx0 = fx + line_pad
        lx1 = fx + doc_w - line_pad - (i % 2) * int(s * 0.10)
        d.rectangle([(lx0, ly), (lx1, ly + line_h)], fill=(46, 125, 50, 220))

    out = img.resize((size, size), Image.LANCZOS)

    if with_shadow:
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        sd = ImageDraw.Draw(shadow)
        sd.rounded_rectangle(
            [(2, 4), (size - 2, size - 2)],
            radius=int(size * 0.22),
            fill=(0, 0, 0, 60),
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=4))
        canvas = Image.alpha_composite(canvas, shadow)
        canvas = Image.alpha_composite(canvas, out)
        return canvas
    return out


def draw_p_icon(size):
    """Clean white capital 'P' centered on a blue rounded square.
    Renders at 4x and downscales for clean anti-aliasing."""
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(s * 0.22)
    d.rounded_rectangle([(0, 0), (s, s)], radius=radius, fill=BLUE)
    # Find the largest font size at which "P" fits comfortably (~62% canvas).
    font = None
    for fs in range(int(s * 0.85), int(s * 0.4), -2):
        f = find_font(fs, bold=True)
        bbox = d.textbbox((0, 0), "P", font=f)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        if w <= s * 0.62 and h <= s * 0.78:
            font = f
            text_w, text_h = w, h
            text_off = (bbox[0], bbox[1])
            break
    if font is None:
        font = find_font(int(s * 0.6), bold=True)
        bbox = d.textbbox((0, 0), "P", font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        text_off = (bbox[0], bbox[1])
    x = (s - text_w) // 2 - text_off[0]
    y = (s - text_h) // 2 - text_off[1]
    d.text((x, y), "P", font=font, fill=WHITE)
    return img.resize((size, size), Image.LANCZOS)


def make_store_icon():
    icon = draw_p_icon(128)
    p = OUT / "icon_store_128.png"
    icon.save(p, "PNG", optimize=True)
    print(f"wrote {p.relative_to(ROOT)}")


def fit_font(draw, text, max_w, max_h, start_size, bold=False):
    """Return the largest font size at which the text fits the box."""
    for fs in range(start_size, 8, -1):
        f = find_font(fs, bold=bold)
        bbox = draw.textbbox((0, 0), text, font=f)
        if (bbox[2] - bbox[0]) <= max_w and (bbox[3] - bbox[1]) <= max_h:
            return f, bbox
    f = find_font(10, bold=bold)
    return f, draw.textbbox((0, 0), text, font=f)


def make_promo(width, height, name):
    img = Image.new("RGB", (width, height), (245, 248, 252))
    # Gentle gradient (top blue-ish, bottom white).
    grad = Image.new("RGB", (1, height), 0)
    for y in range(height):
        t = y / max(height - 1, 1)
        r = int(245 + (255 - 245) * t)
        g = int(248 + (255 - 248) * t)
        b = int(252 + (255 - 252) * t)
        grad.putpixel((0, y), (r, g, b))
    img.paste(grad.resize((width, height)))

    d = ImageDraw.Draw(img)

    # Icon on the left, sized as a fraction of the shortest axis so the
    # layout works for both promo sizes.
    icon_size = int(height * 0.58)
    icon = draw_p_icon(icon_size).convert("RGBA")
    margin = int(min(width, height) * 0.08)
    icon_x = margin
    icon_y = (height - icon_size) // 2
    img.paste(icon, (icon_x, icon_y), icon)

    # Text area: from end of icon + gap, to right margin.
    text_x = icon_x + icon_size + int(min(width, height) * 0.08)
    text_max_w = width - text_x - margin
    title = "Find Preprint"
    subtitle = "Free preprint of any paywalled paper"

    # Two-line layout: title takes ~55% of vertical text space.
    title_max_h = int(height * 0.32)
    sub_max_h = int(height * 0.18)

    title_font, title_bbox = fit_font(
        d, title, text_max_w, title_max_h, start_size=int(height * 0.30), bold=True
    )
    sub_font, sub_bbox = fit_font(
        d, subtitle, text_max_w, sub_max_h, start_size=int(height * 0.14), bold=False
    )

    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_h = sub_bbox[3] - sub_bbox[1]

    gap = int(height * 0.04)
    block_h = title_h + gap + sub_h
    block_top = (height - block_h) // 2

    title_y = block_top - title_bbox[1]
    sub_y = block_top + title_h + gap - sub_bbox[1]

    d.text((text_x - title_bbox[0], title_y), title, font=title_font, fill=(20, 30, 50))
    d.text((text_x - sub_bbox[0], sub_y), subtitle, font=sub_font, fill=(80, 95, 120))

    p = OUT / name
    img.save(p, "PNG", optimize=True)
    print(f"wrote {p.relative_to(ROOT)} ({width}x{height})  title={title_font.size}px sub={sub_font.size}px")


if __name__ == "__main__":
    make_store_icon()
    make_promo(440, 280, "promo_tile_440x280.png")
    make_promo(1400, 560, "promo_tile_1400x560.png")
