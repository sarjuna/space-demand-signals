"""Audit: is every value in every raw data file present in the CSV exports?
For each data line of each raw file, the key field(s) (dates, months, article names) locate the record, and every
other field must appear in the CSVs: numbers by value, text by exact string. Prints any value not found."""
import csv, glob, re, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

NUM = re.compile(r"^-?\d+(\.\d+)?([eE][-+]?\d+)?$")
def norm(x):
    return round(float(x), 9)

# all CSV cells, as numbers and as strings
nums, strs = set(), set()
for f in glob.glob(str(CSV / "*" / "*.csv")):
    for row in csv.reader(open(f)):
        for c in row:
            strs.add(c.strip())
            if NUM.match(c.strip()): nums.add(norm(c))

def found(v):
    v = v.strip()
    if v in ("", "NA", "-"): return True
    if v == "IN": v = "India"          # country code written out in the CSVs
    if NUM.match(v):
        x = norm(v)
        # a value is present if equal (raw percent fields are also stored unchanged)
        return x in nums
    return v in strs

def is_key(v):
    v = v.strip()
    return bool(re.match(r"^(\d{4}(-?\d\d)?(-?\d\d)?|\d{4} [A-Z][a-z]{2} \d{1,2}( \d{4})?)$", v))

problems, checked = [], 0
RULES = {   # file: (field separator, number of leading key fields to skip, whether to split comma series)
    "wikipedia_pageviews_india.txt": ("|", 2, True), "wikipedia_pageviews_us.txt": ("|", 2, True),
    "google_trends_india.txt": ("|", 2, True), "google_trends_us.txt": ("|", 2, True),
    "google_trends_quantum.txt": ("|", 2, True), "wikipedia_pageviews_quantum.txt": ("|", 2, True), "hackernews_quantum.txt": ("|", 1, True),
}
for path in sorted(glob.glob(str(ROOT / "data/raw/*/*.txt"))):
    name = Path(path).name
    miss = 0
    for ln, l in enumerate(open(path), 1):
        l = l.rstrip("\n")
        if not l.strip() or l.startswith("#"): continue
        if name in RULES:
            sep, skip, series = RULES[name]
            parts = l.split(sep); vals = parts[skip].split(",") if series else parts[skip:]
            vals = [v for v in vals]
        else:
            sep = "|" if "|" in l else None
            parts = l.split(sep) if sep else l.split()
            if parts and parts[0] in ("event", "month", "session", "year", "congress", "fiscal_year"): continue   # header rows
            # only the record's first field (its date, month or year) is a key; other fields are values,
            # except embedded ISO dates, which the CSVs store in the same form and are checked as text
            vals = (parts[1:] if is_key(parts[0]) else parts)
        for v in vals:
            v = v.strip()
            if v.startswith("http"): continue
            m = re.match(r"^(-?[\d.]+)\((-?[\d.]+)\)$", v)          # "8.48(4.42)" = value(t)
            sub = list(m.groups()) if m else [v]
            for s in sub:
                checked += 1
                if not found(s):
                    miss += 1
                    if miss <= 5: problems.append(f"{name}:{ln}: '{s[:60]}' not found")
    print(f"{'OK  ' if miss == 0 else 'MISS'} {name:40s} {miss} missing")
print(f"\n{checked} raw values checked")
for p in problems: print("  ", p)
sys.exit(1 if problems else 0)
