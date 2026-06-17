"""Generate StateCompass brand assets — SC monogram lockup + favicon."""

import shutil
from pathlib import Path

from brand_mark import logo_dazzle_defs, logo_mark, wordmark_text

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


def sora_font_face() -> str:
    return """<style>
      @font-face {
        font-family: 'Sora';
        font-style: normal;
        font-weight: 700;
        src: url('./fonts/sora-latin-700-normal.woff2') format('woff2');
      }
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
