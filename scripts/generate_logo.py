"""Generate logo.svg and favicon.svg from a unified continental US silhouette."""
import json
import sys
from pathlib import Path

from shapely.geometry import Polygon, shape
from shapely.ops import unary_union
from topojson import Topology

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from generate_map import (  # noqa: E402
    FIPS_TO_ABBR,
    INSET_STATES,
    Bounds,
    project_point,
    walk_geometry,
)

TOPO_PATH = ROOT / "data" / "states-10m.json"
LOGO_SVG = ROOT / "assets" / "logo.svg"
FAVICON_SVG = ROOT / "assets" / "favicon.svg"

MAP_WIDTH = 960
MAP_HEIGHT = 600
MAP_PAD = 12


def load_geometries():
    data = json.loads(TOPO_PATH.read_text(encoding="utf-8"))
    topo = Topology(data, object_name="states", prequantize=False)
    geo = topo.to_geojson()
    if isinstance(geo, str):
        geo = json.loads(geo)

    geometries = {}
    for feature in geo["features"]:
        fips = str(feature["id"]).zfill(2)
        abbr = FIPS_TO_ABBR.get(fips)
        if abbr:
            geometries[abbr] = feature["geometry"]
    return geometries


def conus_bounds(geometries):
    bounds = Bounds()
    for abbr, geom in geometries.items():
        if abbr not in INSET_STATES:
            walk_geometry(geom, bounds)
    return bounds


def continental_silhouette(geometries):
    shapes = [shape(geometries[abbr]) for abbr in geometries if abbr not in INSET_STATES]
    merged = unary_union(shapes)
    simplified = merged.simplify(0.08, preserve_topology=True)
    if simplified.geom_type == "MultiPolygon":
        simplified = max(simplified.geoms, key=lambda g: g.area)
    return Polygon(simplified.exterior)


def projected_path(coords, bounds, width, height, pad):
    parts = []
    for index, (x, y) in enumerate(coords):
        px, py = project_point(x, y, bounds, 0, 0, width, height, pad)
        parts.append(("M" if index == 0 else "L") + f"{px:.2f},{py:.2f}")
    parts.append("Z")
    return "".join(parts)


def build_logo():
    geometries = load_geometries()
    bounds = conus_bounds(geometries)
    silhouette = continental_silhouette(geometries)

    map_aspect = (MAP_WIDTH - 2 * MAP_PAD) / (MAP_HEIGHT - 2 * MAP_PAD)
    icon_h = 36
    icon_w = icon_h * map_aspect
    text_x = icon_w + 14
    total_w = text_x + 148
    total_h = 40
    icon_path = projected_path(
        list(silhouette.exterior.coords),
        bounds,
        icon_w,
        icon_h,
        pad=0.5,
    )

    logo = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total_w:.0f} {total_h}" fill="none" aria-hidden="true">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>
  </defs>
  <g transform="translate(0, {(total_h - icon_h) / 2:.2f})">
    <path d="{icon_path}" fill="url(#logoGrad)"/>
  </g>
  <text x="{text_x:.0f}" y="27" font-family="Sora, system-ui, sans-serif" font-size="22" font-weight="700" fill="#f5f5f5" letter-spacing="-0.03em">StateCompass</text>
</svg>
'''
    LOGO_SVG.write_text(logo, encoding="utf-8")

    fav_pad = 4
    fav_size = 32
    fav_inner = fav_size - fav_pad * 2
    fav_w = fav_inner * map_aspect
    fav_path = projected_path(
        list(silhouette.exterior.coords),
        bounds,
        fav_w,
        fav_inner,
        pad=0.3,
    )
    fav_x = (fav_size - fav_w) / 2
    fav_y = fav_pad

    favicon = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="7" fill="#050505"/>
  <g transform="translate({fav_x:.2f},{fav_y:.2f})">
    <path d="{fav_path}" fill="url(#fg)"/>
  </g>
</svg>
'''
    FAVICON_SVG.write_text(favicon, encoding="utf-8")
    print(f"Wrote {LOGO_SVG.name} and {FAVICON_SVG.name} (aspect {map_aspect:.3f})")


if __name__ == "__main__":
    build_logo()
