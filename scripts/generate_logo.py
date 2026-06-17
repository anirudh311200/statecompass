"""Generate StateCompass brand assets — SC monogram lockup + favicon."""

import shutil
from pathlib import Path

from brand_mark import NEEDLE, logo_mark

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PUBLIC_ASSETS = ROOT / "public" / "assets"
PUBLIC = ROOT / "public"
FONTS_DIR = PUBLIC_ASSETS / "fonts"
SORA_SRC = ROOT / "node_modules" / "@fontsource" / "sora" / "files" / "sora-latin-700-normal.woff2"
SORA_DEST = FONTS_DIR / "sora-latin-700-normal.woff2"

LOGO_TILE = 32
LOGO_HEIGHT = 40
LOGO_GAP = 10
WORDMARK_X = LOGO_TILE + LOGO_GAP
WORDMARK_SIZE = 23
WORDMARK_Y = 28.5
LOGO_WIDTH = 200


def ensure_sora_font() -> None:
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    if SORA_SRC.is_file():
        shutil.copy2(SORA_SRC, SORA_DEST)


def sora_font_face() -> str:
    return """<defs>
    <style>
      @font-face {
        font-family: 'Sora';
        font-style: normal;
        font-weight: 700;
        src: url('./fonts/sora-latin-700-normal.woff2') format('woff2');
      }
    </style>
  </defs>"""


def favicon_svg(size: int = 32) -> str:
    from brand_mark import favicon_block

    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" fill="none">
  {favicon_block(size)}
</svg>
"""


def logo_svg() -> str:
    tile_y = (LOGO_HEIGHT - LOGO_TILE) / 2
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LOGO_WIDTH} {LOGO_HEIGHT}" fill="none" aria-hidden="true">
  {sora_font_face()}
  {logo_mark(LOGO_TILE, tile_y)}
  <text x="{WORDMARK_X}" y="{WORDMARK_Y}" font-family="Sora, system-ui, sans-serif" font-size="{WORDMARK_SIZE}" font-weight="700" fill="{NEEDLE}" letter-spacing="-0.025em">StateCompass</text>
</svg>
"""


def write_brand_assets() -> None:
    ensure_sora_font()
    favicon = favicon_svg(32)
    logo = logo_svg()
    touch = favicon_svg(180)

    ASSETS.mkdir(parents=True, exist_ok=True)
    PUBLIC_ASSETS.mkdir(parents=True, exist_ok=True)

    for path in (ASSETS / "favicon.svg", PUBLIC_ASSETS / "favicon.svg"):
        path.write_text(favicon, encoding="utf-8")

    for path in (ASSETS / "logo.svg", PUBLIC_ASSETS / "logo.svg"):
        path.write_text(logo, encoding="utf-8")

    (PUBLIC / "apple-touch-icon.svg").write_text(touch, encoding="utf-8")
    print("Wrote logo.svg, favicon.svg, apple-touch-icon.svg")


if __name__ == "__main__":
    write_brand_assets()
