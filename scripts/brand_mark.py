"""Shared brand SVG fragments for logo, favicon, and OG watermarks."""

NEEDLE_ROT = 40
NEEDLE = "#fafafa"
NEEDLE_SOUTH = "#8a8a8a"
BG = "#000000"
SURFACE = "#0a0a0a"
BORDER = "#1a1a1a"
WHITE_GLOW = 0.38
SC_FONT_RATIO = 0.39

# Soft squircle-ish corners (32px tile baseline)
TILE_RX_RATIO = 10.5 / 32


def dazzle_gradient(grad_id: str = "brand-dazzle") -> str:
    return f"""<linearGradient id="{grad_id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.94"/>
      <stop offset="52%" stop-color="#fafafa" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#525252" stop-opacity="0.38"/>
    </linearGradient>"""


def text_glow_filter(filter_id: str, blur: float, flood_opacity: float) -> str:
    return f"""<filter id="{filter_id}" x="-100%" y="-100%" width="300%" height="300%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="{blur}" result="blur"/>
      <feFlood flood-color="#ffffff" flood-opacity="{flood_opacity}" result="glowColor"/>
      <feComposite in="glowColor" in2="blur" operator="in" result="softGlow"/>
      <feMerge>
        <feMergeNode in="softGlow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>"""


def sc_dazzle_defs(prefix: str = "sc", size: int = 32) -> str:
    """Luminous B&W gradient + glow for favicon / OG SC mark."""
    blur = round(1.35 * size / 32, 2)
    flood_opacity = round(WHITE_GLOW * min(1.15, 32 / max(size, 1)), 2)
    grad_id = f"{prefix}-dazzle"
    return f"""{dazzle_gradient(grad_id)}
    {text_glow_filter(f"{prefix}-glow", blur, flood_opacity)}"""


def logo_dazzle_defs(tile_size: int, wordmark_size: int) -> str:
    """Shared dazzle for header lockup — SC + wordmark."""
    sc_blur = round(1.4 * tile_size / 36, 2)
    sc_flood = round(WHITE_GLOW * min(1.1, 36 / max(tile_size, 1)), 2)
    wm_blur = round(1.65 * wordmark_size / 28, 2)
    wm_flood = 0.3
    return f"""{dazzle_gradient("brand-dazzle")}
    {text_glow_filter("sc-glow", sc_blur, sc_flood)}
    {text_glow_filter("wordmark-glow", wm_blur, wm_flood)}"""


def sc_monogram(
    cx: float,
    cy: float,
    size: int = 32,
    *,
    grad_id: str = "brand-dazzle",
    glow_id: str = "sc-glow",
) -> str:
    """Sora SC monogram — optically centered, luminous B&W dazzle."""
    font_size = round(size * SC_FONT_RATIO, 2)
    ox = round(size * 0.012, 2)
    return f"""<text x="{cx + ox:.2f}" y="{cy:.2f}" font-family="Sora, system-ui, sans-serif" font-size="{font_size}" font-weight="700" text-anchor="middle" dominant-baseline="central" letter-spacing="-0.055em" fill="url(#{grad_id})" filter="url(#{glow_id})">SC</text>"""


def brand_tile(
    size: int = 32,
    *,
    grad_id: str = "brand-dazzle",
    glow_id: str = "sc-glow",
) -> str:
    """Raised dark tile — surface fill + border so mark does not vanish on #000 pages."""
    rx = round(TILE_RX_RATIO * size, 2)
    sw = round(size / 32, 2)
    inset = sw / 2
    dim = size - sw
    inner_rx = max(rx - inset, 0)
    cx = size / 2
    cy = size / 2
    return f"""<rect x="{inset:.2f}" y="{inset:.2f}" width="{dim:.2f}" height="{dim:.2f}" rx="{inner_rx:.2f}" fill="{SURFACE}" stroke="{BORDER}" stroke-width="{sw:.2f}"/>
  {sc_monogram(cx, cy, size, grad_id=grad_id, glow_id=glow_id)}"""


def wordmark_text(
    x: float,
    y: float,
    size: float,
    *,
    grad_id: str = "brand-dazzle",
    glow_id: str = "wordmark-glow",
) -> str:
    return f"""<text x="{x}" y="{y}" font-family="Sora, system-ui, sans-serif" font-size="{size}" font-weight="700" fill="url(#{grad_id})" filter="url(#{glow_id})" letter-spacing="-0.03em">StateCompass</text>"""


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


def favicon_block(size: int = 32, prefix: str = "sc") -> str:
    """Rounded square + SC monogram (favicon / touch icon)."""
    return brand_tile(size, grad_id=f"{prefix}-dazzle", glow_id=f"{prefix}-glow")


def logo_mark(size: int = 32, y_offset: float = 0) -> str:
    """SC tile for the header lockup; y_offset centers tile in the logo height."""
    return f"""<g transform="translate(0,{y_offset:.2f})">
    {brand_tile(size)}
  </g>"""


def og_watermark() -> str:
    """Small B&W mark for OG card corner (48px tile)."""
    prefix = "og-sc"
    return f"""<defs>
    {sc_dazzle_defs(prefix, 48)}
  </defs>
  <g transform="translate(1104, 534)" opacity="0.85">
  <g transform="translate(-56, -56)">
    {favicon_block(48, prefix)}
  </g>
</g>"""
