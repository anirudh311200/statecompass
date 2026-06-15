"""Shared compass needle SVG fragments for brand assets and OG watermarks."""

NEEDLE_ROT = 40
NEEDLE = "#fafafa"
NEEDLE_SOUTH = "#8a8a8a"
BG = "#000000"
RING_OPACITY = 0.35


def compass(cx: float, cy: float, scale: float = 1.0) -> str:
    """Classic compass rose: ring, diamond needle (long north / short south), pivot hub."""
    s = scale
    ring_r = 11.25 * s
    ring_sw = 1.35 * s
    hub_r = 2.75 * s
    pin_r = 1.15 * s

    # Diamond arms — north longer and bright, south shorter and muted (real compass convention)
    north = f"M 0,{-9.75 * s:.2f} L {-3.35 * s:.2f},{-1.35 * s:.2f} L 0,{-2.15 * s:.2f} L {3.35 * s:.2f},{-1.35 * s:.2f} Z"
    south = f"M 0,{6.25 * s:.2f} L {-2.35 * s:.2f},{1.05 * s:.2f} L 0,{0.15 * s:.2f} L {2.35 * s:.2f},{1.05 * s:.2f} Z"

    # Cardinal ticks on the ring (subtle — helps read as “compass” at small sizes)
    tick = 1.15 * s
    ticks = f"""
    <line x1="0" y1="{-ring_r:.2f}" x2="0" y2="{-ring_r + tick:.2f}" stroke="{NEEDLE}" stroke-width="{0.9 * s:.2f}" stroke-linecap="round" opacity="0.55"/>
    <line x1="{ring_r:.2f}" y1="0" x2="{ring_r - tick:.2f}" y2="0" stroke="{NEEDLE}" stroke-width="{0.75 * s:.2f}" stroke-linecap="round" opacity="0.35"/>
    <line x1="0" y1="{ring_r:.2f}" x2="0" y2="{ring_r - tick:.2f}" stroke="{NEEDLE}" stroke-width="{0.75 * s:.2f}" stroke-linecap="round" opacity="0.35"/>
    <line x1="{-ring_r:.2f}" y1="0" x2="{-ring_r + tick:.2f}" y2="0" stroke="{NEEDLE}" stroke-width="{0.75 * s:.2f}" stroke-linecap="round" opacity="0.35"/>"""

    return f"""<g transform="translate({cx:.2f},{cy:.2f}) rotate({NEEDLE_ROT})">
    <circle cx="0" cy="0" r="{ring_r:.2f}" fill="none" stroke="{NEEDLE}" stroke-width="{ring_sw:.2f}" opacity="{RING_OPACITY}"/>
    {ticks}
    <path d="{north}" fill="{NEEDLE}"/>
    <path d="{south}" fill="{NEEDLE_SOUTH}"/>
    <circle cx="0" cy="0" r="{hub_r:.2f}" fill="{NEEDLE}"/>
    <circle cx="0" cy="0" r="{pin_r:.2f}" fill="{BG}"/>
  </g>"""


# Back-compat alias used by generate_logo.py
def needle(cx: float, cy: float, scale: float = 1.0) -> str:
    return compass(cx, cy, scale)


def favicon_block(size: int = 32) -> str:
    """Rounded square + compass mark (for favicon or scaled touch icon)."""
    rx = round(7 * size / 32, 2)
    cx = size / 2
    cy = size / 2
    scale = size / 32
    return f"""<rect width="{size}" height="{size}" rx="{rx}" fill="{BG}"/>
  {compass(cx, cy, scale)}"""


def og_watermark() -> str:
    """Small B&W mark for OG card corner (48px tile)."""
    return f"""<g transform="translate(1104, 534)" opacity="0.85">
  <g transform="translate(-56, -56)">
    {favicon_block(48)}
  </g>
</g>"""
