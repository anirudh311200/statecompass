"""Shared brand SVG fragments for logo, favicon, and OG watermarks."""

NEEDLE_ROT = 40
NEEDLE = "#fafafa"
NEEDLE_SOUTH = "#8a8a8a"
BG = "#000000"
SURFACE = "#0a0a0a"
BORDER = "#1a1a1a"

# Soft squircle-ish corners (32px tile baseline)
TILE_RX_RATIO = 10.5 / 32

# SC glyph box (path coordinates); optical center after kerning tweak
SC_OPTICAL_X = 9.35
SC_OPTICAL_Y = 7.05


def sc_letter_paths() -> str:
    """Bold geometric S and C — filled paths for crisp 16px tab rendering."""
    return f"""<path fill="{NEEDLE}" d="M 5.6 1.1 C 2.1 1.1 0.3 2.9 0.3 5.1 C 0.3 6.6 1.2 7.7 3.1 8.1 L 5.7 8.6 C 7.4 8.9 8.1 9.7 8.1 10.9 C 8.1 12.6 6.5 13.9 4.1 13.9 C 2.1 13.9 0.7 12.9 0.1 11.3 L 2.1 10.5 C 2.5 11.5 3.3 12.1 4.3 12.1 C 5.5 12.1 6.2 11.3 6.2 10.3 C 6.2 9.3 5.5 8.7 3.9 8.3 L 1.5 7.7 C 0.1 7.3 0 6.1 0 5.1 C 0 2.9 2 1.1 5.2 1.1 C 7.2 1.1 8.6 1.9 9.2 3.3 L 7.2 3.7 C 6.8 2.7 6.2 1.1 5.6 1.1 Z"/>
    <path fill="{NEEDLE}" d="M 14.3 1.4 C 10.3 1.4 8.3 3.9 8.3 7.1 C 8.3 10.3 10.3 12.7 14.3 12.7 C 15.8 12.7 17 12.1 17.8 11.1 L 16 10.1 C 15.4 10.7 14.6 11.1 13.8 11.1 C 11.6 11.1 10.6 9.3 10.6 7.1 C 10.6 4.9 11.6 3.1 13.8 3.1 C 14.8 3.1 15.6 3.5 16.2 4.1 L 18 2.7 C 17 1.7 15.6 1.4 14.3 1.4 Z"/>"""


def sc_monogram(cx: float, cy: float, size: int = 32) -> str:
    """Optically centered SC mark for a square tile of the given pixel size."""
    glyph_scale = size / 32
    return f"""<g transform="translate({cx:.2f},{cy:.2f}) scale({glyph_scale:.4f}) translate({-SC_OPTICAL_X:.2f},{-SC_OPTICAL_Y:.2f})">
    {sc_letter_paths()}
  </g>"""


def brand_tile(size: int = 32) -> str:
    """Raised dark tile — surface fill + border so mark does not vanish on #000 pages."""
    rx = round(TILE_RX_RATIO * size, 2)
    sw = round(size / 32, 2)
    inset = sw / 2
    dim = size - sw
    inner_rx = max(rx - inset, 0)
    cx = size / 2
    cy = size / 2
    return f"""<rect x="{inset:.2f}" y="{inset:.2f}" width="{dim:.2f}" height="{dim:.2f}" rx="{inner_rx:.2f}" fill="{SURFACE}" stroke="{BORDER}" stroke-width="{sw:.2f}"/>
  {sc_monogram(cx, cy, size)}"""


def compass(cx: float, cy: float, scale: float = 1.0) -> str:
    """Classic compass rose — kept for future professional mark swap."""
    s = scale
    ring_r = 11.25 * s
    ring_sw = 1.35 * s
    hub_r = 2.75 * s
    pin_r = 1.15 * s

    north = f"M 0,{-9.75 * s:.2f} L {-3.35 * s:.2f},{-1.35 * s:.2f} L 0,{-2.15 * s:.2f} L {3.35 * s:.2f},{-1.35 * s:.2f} Z"
    south = f"M 0,{6.25 * s:.2f} L {-2.35 * s:.2f},{1.05 * s:.2f} L 0,{0.15 * s:.2f} L {2.35 * s:.2f},{1.05 * s:.2f} Z"

    tick = 1.15 * s
    ticks = f"""
    <line x1="0" y1="{-ring_r:.2f}" x2="0" y2="{-ring_r + tick:.2f}" stroke="{NEEDLE}" stroke-width="{0.9 * s:.2f}" stroke-linecap="round" opacity="0.55"/>
    <line x1="{ring_r:.2f}" y1="0" x2="{ring_r - tick:.2f}" y2="0" stroke="{NEEDLE}" stroke-width="{0.75 * s:.2f}" stroke-linecap="round" opacity="0.35"/>
    <line x1="0" y1="{ring_r:.2f}" x2="0" y2="{ring_r - tick:.2f}" stroke="{NEEDLE}" stroke-width="{0.75 * s:.2f}" stroke-linecap="round" opacity="0.35"/>
    <line x1="{-ring_r:.2f}" y1="0" x2="{-ring_r + tick:.2f}" y2="0" stroke="{NEEDLE}" stroke-width="{0.75 * s:.2f}" stroke-linecap="round" opacity="0.35"/>"""

    return f"""<g transform="translate({cx:.2f},{cy:.2f}) rotate({NEEDLE_ROT})">
    <circle cx="0" cy="0" r="{ring_r:.2f}" fill="none" stroke="{NEEDLE}" stroke-width="{ring_sw:.2f}" opacity="0.35"/>
    {ticks}
    <path d="{north}" fill="{NEEDLE}"/>
    <path d="{south}" fill="{NEEDLE_SOUTH}"/>
    <circle cx="0" cy="0" r="{hub_r:.2f}" fill="{NEEDLE}"/>
    <circle cx="0" cy="0" r="{pin_r:.2f}" fill="{BG}"/>
  </g>"""


def needle(cx: float, cy: float, scale: float = 1.0) -> str:
    return compass(cx, cy, scale)


def favicon_block(size: int = 32) -> str:
    """Rounded square + SC monogram (favicon / touch icon)."""
    return brand_tile(size)


def logo_mark(size: int = 32, y_offset: float = 0) -> str:
    """SC tile for the header lockup; y_offset centers 32px tile in a 40px-tall logo."""
    return f"""<g transform="translate(0,{y_offset:.2f})">
    {brand_tile(size)}
  </g>"""


def og_watermark() -> str:
    """Small B&W mark for OG card corner (48px tile)."""
    return f"""<g transform="translate(1104, 534)" opacity="0.85">
  <g transform="translate(-56, -56)">
    {favicon_block(48)}
  </g>
</g>"""
