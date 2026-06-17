"""Generate StateCompass brand assets — wordmark logo + compass favicon."""

from pathlib import Path

from brand_mark import NEEDLE, favicon_block

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
PUBLIC_ASSETS = ROOT / "public" / "assets"
PUBLIC = ROOT / "public"


def favicon_svg(size: int = 32) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" fill="none">
  {favicon_block(size)}
</svg>
"""


def logo_svg() -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 40" fill="none" aria-hidden="true">
  <text x="0" y="27" font-family="Sora, system-ui, sans-serif" font-size="22" font-weight="600" fill="{NEEDLE}" letter-spacing="-0.03em">StateCompass</text>
</svg>
"""


def write_brand_assets() -> None:
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
