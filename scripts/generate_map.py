import json
from pathlib import Path
from topojson import Topology

TOPO_PATH = Path(__file__).resolve().parents[1] / "data" / "states-10m.json"
OUT_PATH = Path(__file__).resolve().parents[1] / "public" / "assets" / "us-map.svg"

FIPS_TO_ABBR = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
    "10": "DE", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
    "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA",
    "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV",
    "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN",
    "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
    "56": "WY",
}

INSET_STATES = {"AK", "HI"}
WIDTH, HEIGHT = 960, 600


class Bounds:
    def __init__(self):
        self.minx = self.miny = float("inf")
        self.maxx = self.maxy = float("-inf")

    def extend_point(self, x, y):
        self.minx = min(self.minx, x)
        self.miny = min(self.miny, y)
        self.maxx = max(self.maxx, x)
        self.maxy = max(self.maxy, y)

    def merge(self, other):
        self.minx = min(self.minx, other.minx)
        self.miny = min(self.miny, other.miny)
        self.maxx = max(self.maxx, other.maxx)
        self.maxy = max(self.maxy, other.maxy)


def walk_geometry(geom, bounds):
    geom_type = geom.get("type")
    if geom_type == "Polygon":
        for ring in geom["coordinates"]:
            for x, y in ring:
                bounds.extend_point(x, y)
    elif geom_type == "MultiPolygon":
        for polygon in geom["coordinates"]:
            for ring in polygon:
                for x, y in ring:
                    bounds.extend_point(x, y)


def bounds_for_geometry(geom):
    bounds = Bounds()
    walk_geometry(geom, bounds)
    return bounds


def project_point(x, y, bounds, box_x, box_y, box_w, box_h, pad):
    span_x = bounds.maxx - bounds.minx or 1
    span_y = bounds.maxy - bounds.miny or 1
    px = box_x + pad + (x - bounds.minx) / span_x * (box_w - 2 * pad)
    py = box_y + pad + (bounds.maxy - y) / span_y * (box_h - 2 * pad)
    return px, py


def ring_to_path(ring, bounds, box_x, box_y, box_w, box_h, pad, projected=None):
    parts = []
    for index, (x, y) in enumerate(ring):
        px, py = project_point(x, y, bounds, box_x, box_y, box_w, box_h, pad)
        if projected is not None:
            projected.extend_point(px, py)
        parts.append(("M" if index == 0 else "L") + f"{px:.2f},{py:.2f}")
    parts.append("Z")
    return "".join(parts)


def geom_to_path(geom, bounds, box_x, box_y, box_w, box_h, pad, projected=None):
    geom_type = geom["type"]
    if geom_type == "Polygon":
        return "".join(
            ring_to_path(ring, bounds, box_x, box_y, box_w, box_h, pad, projected)
            for ring in geom["coordinates"]
        )
    if geom_type == "MultiPolygon":
        return "".join(
            "".join(ring_to_path(ring, bounds, box_x, box_y, box_w, box_h, pad, projected) for ring in polygon)
            for polygon in geom["coordinates"]
        )
    return ""


def main():
    data = json.loads(TOPO_PATH.read_text(encoding="utf-8"))
    topo = Topology(data, object_name="states", prequantize=False)
    geo = topo.to_geojson()
    if isinstance(geo, str):
        geo = json.loads(geo)

    features = {}
    for feature in geo["features"]:
        fips = str(feature["id"]).zfill(2)
        abbr = FIPS_TO_ABBR.get(fips)
        if abbr:
            features[abbr] = feature["geometry"]

    conus_bounds = Bounds()
    for abbr, geom in features.items():
        if abbr not in INSET_STATES:
            walk_geometry(geom, conus_bounds)

    ak_bounds = bounds_for_geometry(features["AK"])
    hi_bounds = bounds_for_geometry(features["HI"])

    conus_pad = 12
    projected = Bounds()
    paths = []

    for abbr, geom in features.items():
        if abbr in INSET_STATES:
            continue
        path_data = geom_to_path(
            geom, conus_bounds, 0, 0, WIDTH, HEIGHT, conus_pad, projected
        )
        paths.append(f'  <path id="{abbr}" class="state" d="{path_data}" />')

    paths.append(
        f'  <path id="AK" class="state" d="{geom_to_path(features["AK"], ak_bounds, 24, 430, 190, 155, 6, projected)}" />'
    )
    paths.append(
        f'  <path id="HI" class="state" d="{geom_to_path(features["HI"], hi_bounds, 230, 490, 120, 95, 4, projected)}" />'
    )

    crop_pad = 6
    view_x = projected.minx - crop_pad
    view_y = projected.miny - crop_pad
    view_w = projected.maxx - projected.minx + crop_pad * 2
    view_h = projected.maxy - projected.miny + crop_pad * 2

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view_x:.2f} {view_y:.2f} {view_w:.2f} {view_h:.2f}" '
        f'preserveAspectRatio="xMidYMid meet" '
        f'role="img" aria-label="Map of the United States">\n'
        + "\n".join(paths)
        + "\n</svg>"
    )
    OUT_PATH.write_text(svg, encoding="utf-8")
    print(f"Wrote {OUT_PATH} ({len(paths)} states)")


if __name__ == "__main__":
    main()
