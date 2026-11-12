"""Build data/derived/india/dash.json (the data embedded in india.html): analysis output + parliament + raw event, funding and GDELT tables."""
import json, re
import sys; from pathlib import Path; sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

D = json.load(open(DER_IN / "out.json"))
D["parl"] = json.load(open(DER_IN / "parl.json"))
ev, c3 = [], []
for l in open(RAW_IN / "event_study_india.txt"):
    if l.startswith("# Robustness"): break
    p = l.rstrip("\n").split("|")
    if re.match(r"^\d{4}-\d\d-\d\d\|", l):
        ev.append(dict(date=p[0], t0=p[1], n=int(p[2]), car01=float(p[3]), t01=float(p[4]), car05=float(p[5]), t05=float(p[6]), pre=float(p[7]), sd=float(p[8]), label=p[9]))
    elif re.match(r"^-?\d+ \d{4}-", l):
        k, d, ar = l.split(); c3.append(dict(d=int(k), date=d, ar=float(ar)))
D["events"], D["c3"] = ev, c3
fund = []
for l in open(RAW_IN / "funding_reports_india.txt"):
    if l.startswith("#") or "|" not in l: continue
    p = l.rstrip("\n").split("|")
    fund.append(dict(vintage=p[0], pub=p[1], src=p[2], year=p[3], usd=float(p[4]), rounds=p[5], note=p[6], url=p[7]))
D["funding"] = fund
g = []
for l in open(RAW_IN / "gdelt_tone_india.txt"):
    m = re.match(r"^(\d{4})(\d\d)(\d\d) (-?[\d.]+)", l)
    if m and float(m.group(4)) != 0: g.append(dict(d=f"{m.group(1)}-{m.group(2)}-{m.group(3)}", tone=float(m.group(4))))
D["gdelt"] = g
raw = [l.rstrip("\n") for l in open(RAW_IN / "lok_sabha_questions_india.txt")]
cut = next(i for i, l in enumerate(raw) if l.startswith("# NEWSPACE"))
titles = [l.split("|", 1) for l in raw[cut:] if not l.startswith("#") and "|" in l]
D["parl_titles"] = [[f"{d[:4]}-{d[4:6]}-{d[6:]}", t] for d, t in reversed(titles)]   # newest first
json.dump(D, open(DER_IN / "dash.json", "w"))
print("dash.json:", len(ev), "events,", len(fund), "funding reports,", len(g), "GDELT days")
