"""Generate LinkedIn Featured thumbnail — personal analytics portfolio (non-StateCompass)."""

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
W = 1200
H = 630

# GitHub Octocat — simple-icons/github (24×24, fits viewBox cleanly)
GITHUB_VIEW = 24
GITHUB_MARK = (
    "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 "
    "0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 "
    "1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 "
    "0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 "
    "2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 "
    "0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12c0-6.627-5.373-12-12-12"
)

TITLE = "Analytics &amp; Data Engineering Portfolio"


def portfolio_feature_svg() -> str:
    icon_size = 88
    gap = 36
    font_size = 42
    scale = icon_size / GITHUB_VIEW
    lockup_w = icon_size + gap + 920
    origin_x = (W - lockup_w) / 2
    icon_y = (H - icon_size) / 2
    text_x = origin_x + icon_size + gap
    text_y = H / 2

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" fill="none">
  <defs>
    <radialGradient id="portfolio-vignette" cx="50%" cy="0%" r="75%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{W}" height="{H}" fill="#000000"/>
  <rect width="{W}" height="{H}" fill="url(#portfolio-vignette)"/>
  <g transform="translate({origin_x:.2f},{icon_y:.2f}) scale({scale:.4f})" aria-hidden="true">
    <path fill="#fafafa" d="{GITHUB_MARK}"/>
  </g>
  <text
    x="{text_x:.2f}"
    y="{text_y:.2f}"
    font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
    font-size="{font_size}"
    font-weight="600"
    fill="#fafafa"
    dominant-baseline="central"
    letter-spacing="-0.02em"
  >{TITLE}</text>
</svg>
"""


def render_svg_to_png(svg_path: Path, png_path: Path) -> bool:
    script = ROOT / "scripts" / "render-svg-png.mjs"
    try:
        subprocess.run(
            [
                "node",
                str(script),
                str(svg_path.relative_to(ROOT)),
                str(png_path.relative_to(ROOT)),
                str(W),
            ],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        return True
    except subprocess.CalledProcessError as exc:
        print(f"PNG render failed ({exc.stderr.strip() or exc})")
        return False
    except FileNotFoundError:
        print("PNG render failed (node unavailable)")
        return False


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    svg_path = ASSETS / "analytics-portfolio-feature.svg"
    png_path = ASSETS / "analytics-portfolio-feature.png"

    svg_path.write_text(portfolio_feature_svg(), encoding="utf-8")
    print("Wrote analytics-portfolio-feature.svg")

    if render_svg_to_png(svg_path, png_path):
        print("Wrote analytics-portfolio-feature.png")


if __name__ == "__main__":
    main()
