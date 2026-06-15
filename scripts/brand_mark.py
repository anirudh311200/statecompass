"""Shared compass needle SVG fragments for brand assets and OG watermarks."""

NEEDLE_ROT = 40
NEEDLE = "#fafafa"
BG = "#000000"

HUB_Y = 2
NORTH = 8
SOUTH = 5
HUB_R = 2
STROKE = 2.5


def needle(cx: float, cy: float, scale: float = 1.0) -> str:
    s = scale
    sw = STROKE * s
    hy = HUB_Y * s
    return f"""<g transform="translate({cx:.2f},{cy:.2f}) rotate({NEEDLE_ROT})">
    <line x1="0" y1="{hy:.2f}" x2="0" y2="{-NORTH * s:.2f}" stroke="{NEEDLE}" stroke-width="{sw:.2f}" stroke-linecap="round"/>
    <line x1="0" y1="{hy:.2f}" x2="0" y2="{SOUTH * s:.2f}" stroke="{NEEDLE}" stroke-width="{sw:.2f}" stroke-linecap="round"/>
    <circle cx="0" cy="{hy:.2f}" r="{HUB_R * s:.2f}" fill="{NEEDLE}"/>
  </g>"""


def favicon_block(size: int = 32) -> str:
    """Rounded square + needle (for favicon or scaled touch icon)."""
    rx = round(7 * size / 32, 2)
    cx = size / 2
    cy = size / 2 + size * 0.03
    scale = size / 32
    return f"""<rect width="{size}" height="{size}" rx="{rx}" fill="{BG}"/>
  {needle(cx, cy, scale)}"""


def og_watermark() -> str:
    """Small B&W mark for OG card corner (48px tile)."""
    return f"""<g transform="translate(1104, 534)" opacity="0.85">
  <g transform="translate(-56, -56)">
    {favicon_block(48)}
  </g>
</g>"""
