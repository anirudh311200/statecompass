"""Generate StateCompass brand assets — SC monogram lockup + favicon."""

import shutil
import tempfile
from pathlib import Path

from brand_mark import (
    BORDER,
    SC_FONT_RATIO,
    SURFACE,
    logo_dazzle_defs,
    logo_mark,
    wordmark_text,
)

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PUBLIC_ASSETS = ROOT / "public" / "assets"
PUBLIC = ROOT / "public"
FONTS_DIR = PUBLIC_ASSETS / "fonts"
SORA_SRC = ROOT / "node_modules" / "@fontsource" / "sora" / "files" / "sora-latin-700-normal.woff2"
SORA_DEST = FONTS_DIR / "sora-latin-700-normal.woff2"

LOGO_TILE = 44
LOGO_HEIGHT = 54
LOGO_GAP = 14
WORDMARK_X = LOGO_TILE + LOGO_GAP
WORDMARK_SIZE = 33
WORDMARK_Y = 39
LOGO_WIDTH = 278


def ensure_sora_font() -> None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    if SORA_SRC.is_file():
        shutil.copy2(SORA_SRC, SORA_DEST)


def sora_font_face(*, font_url: str = "./fonts/sora-latin-700-normal.woff2") -> str:
    return f"""<style>
      @font-face {{
        font-family: 'Sora';
        font-style: normal;
        font-weight: 700;
        src: url('{font_url}') format('woff2');
      }}
    </style>"""


def favicon_defs(size: int = 32) -> str:
    from brand_mark import sc_dazzle_defs

    return f"""<defs>
    {sora_font_face()}
    {sc_dazzle_defs("sc", size)}
  </defs>"""


def logo_defs() -> str:
    return f"""<defs>
    {sora_font_face()}
    {logo_dazzle_defs(LOGO_TILE, WORDMARK_SIZE)}
  </defs>"""


def touch_icon_svg(size: int = 180) -> str:
    from brand_mark import favicon_block, sc_dazzle_defs

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" fill="none">
  <defs>
    {sora_font_face(font_url="/assets/fonts/sora-latin-700-normal.woff2")}
    {sc_dazzle_defs("sc", size)}
  </defs>
  {favicon_block(size)}
</svg>
"""


def write_apple_touch_png(size: int = 180) -> None:
    img = render_sc_icon_png(size)
    if img is None:
        return
    img.save(PUBLIC / "apple-touch-icon.png", format="PNG")
    print("Wrote apple-touch-icon.png")


def render_sc_icon_png(size: int):
    try:
        from fontTools.ttLib import woff2
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print(f"Skipped {size}px icon PNG (Pillow/fonttools unavailable)")
        return None

    if not SORA_SRC.is_file():
        print(f"Skipped {size}px icon PNG (Sora font missing)")
        return None

    img = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)

    stroke = max(1, round(size / 32))
    inset = stroke / 2
    radius = round(10.5 / 32 * size)
    draw.rounded_rectangle(
        (inset, inset, size - inset, size - inset),
        radius=radius,
        fill=SURFACE,
        outline=BORDER,
        width=stroke,
    )

    font_size = round(size * SC_FONT_RATIO)
    font = None
    ttf_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".ttf", delete=False) as tmp:
            ttf_path = Path(tmp.name)
            woff2.decompress(str(SORA_SRC), str(ttf_path))
        font = ImageFont.truetype(str(ttf_path), font_size)
    except Exception:
        for candidate in (
            "C:/Windows/Fonts/segoeuib.ttf",
            "C:/Windows/Fonts/arialbd.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ):
            if Path(candidate).is_file():
                font = ImageFont.truetype(candidate, font_size)
                break
        if font is None:
            font = ImageFont.load_default()
    finally:
        if ttf_path is not None:
            ttf_path.unlink(missing_ok=True)

    text = "SC"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) / 2 + size * 0.012
    y = (size - text_h) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=(250, 250, 250, 240))

    return img


def write_sc_icon_png(size: int, filename: str) -> None:
    img = render_sc_icon_png(size)
    if img is None:
        return
    img.save(PUBLIC / filename, format="PNG")
    print(f"Wrote {filename}")


def write_favicon_ico() -> None:
    img = render_sc_icon_png(48)
    if img is None:
        return
    img.save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("Wrote favicon.ico")


def write_search_favicons() -> None:
    write_sc_icon_png(48, "favicon-48x48.png")
    write_sc_icon_png(192, "favicon-192x192.png")
    write_favicon_ico()


def favicon_svg(size: int = 32) -> str:
    from brand_mark import favicon_block

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" fill="none">
  {favicon_defs(size)}
  {favicon_block(size)}
</svg>
"""


def logo_svg() -> str:
    tile_y = (LOGO_HEIGHT - LOGO_TILE) / 2
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LOGO_WIDTH} {LOGO_HEIGHT}" fill="none" aria-hidden="true">
  {logo_defs()}
  {logo_mark(LOGO_TILE, tile_y)}
  {wordmark_text(WORDMARK_X, WORDMARK_Y, WORDMARK_SIZE)}
</svg>
"""


def write_brand_assets() -> None:
    ensure_sora_font()
    favicon = favicon_svg(32)
    logo = logo_svg()
    touch = touch_icon_svg(180)

    ASSETS.mkdir(parents=True, exist_ok=True)
    PUBLIC_ASSETS.mkdir(parents=True, exist_ok=True)

    for path in (ASSETS / "favicon.svg", PUBLIC_ASSETS / "favicon.svg"):
        path.write_text(favicon, encoding="utf-8")

    for path in (ASSETS / "logo.svg", PUBLIC_ASSETS / "logo.svg"):
        path.write_text(logo, encoding="utf-8")

    (PUBLIC / "apple-touch-icon.svg").write_text(touch, encoding="utf-8")
    write_apple_touch_png(180)
    write_search_favicons()
    print("Wrote logo.svg, favicon.svg, apple-touch-icon.svg")


if __name__ == "__main__":
    write_brand_assets()
