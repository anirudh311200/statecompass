"""Copy Feature 1 static data to public/data for runtime fetch."""

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PUBLIC = ROOT / "public" / "data"

FILES = ("founder_match_weights.json", "expansion_readiness_config.json")


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for name in FILES:
        src = DATA / name
        if not src.exists():
            raise SystemExit(f"Missing {src}")
        dst = PUBLIC / name
        shutil.copy2(src, dst)
        json.loads(dst.read_text(encoding="utf-8"))
        print(f"OK: copied {name}")


if __name__ == "__main__":
    main()
