"""Repository paths. Every script imports these, so the repo runs from wherever it is cloned."""
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
RAW_IN, RAW_US, RAW_SHARED = ROOT / "data/raw/india", ROOT / "data/raw/us", ROOT / "data/raw/shared"
DER_IN, DER_US = ROOT / "data/derived/india", ROOT / "data/derived/us"
CSV = ROOT / "data/csv"
SITE_SRC = ROOT / "code/site/src"
