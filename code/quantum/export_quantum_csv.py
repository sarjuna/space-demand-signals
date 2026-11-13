"""Export the quantum raw data and indices to data/csv/quantum/ (every raw value, checked by code/site/audit_csv.py)."""
import json, re, sys
from pathlib import Path
import pandas as pd
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *
RAW_Q = ROOT / "data/raw/quantum"; OUT = CSV / "quantum"; OUT.mkdir(parents=True, exist_ok=True)
Q = json.load(open(ROOT / "data/derived/quantum/quantum.json"))
def ser_file(name):
    d = {}
    for l in open(RAW_Q / name):
        if l.startswith("#") or "|" not in l: continue
        a, s, v = l.strip().split("|"); v = v.split(",")
        d[a] = pd.Series(v, index=[str(p) for p in pd.period_range(s[:4] + "-" + s[4:], periods=len(v), freq="M")])
    return pd.DataFrame(d)
T = ser_file("google_trends_quantum.txt").add_prefix("trends_")
W = ser_file("wikipedia_pageviews_quantum.txt").add_prefix("wiki_views_")
hn = [l for l in open(RAW_Q / "hackernews_quantum.txt") if not l.startswith("#")][0].strip().split("|")
H = pd.Series(hn[1].split(","), index=[str(p) for p in pd.period_range(hn[0][:4] + "-" + hn[0][4:], periods=130, freq="M")], name="hn_quantum_stories")
M = pd.concat([T, W, H], axis=1); M.index.name = "month"
M["field_attention_index"] = pd.Series(Q["FAI"]); M["firm_attention_index"] = pd.Series(Q["FIRM"])
M.to_csv(OUT / "quantum_monthly.csv")
rows = [l.split() for l in open(RAW_Q / "markets_quantum.txt") if re.match(r"^\d{4}-\d\d ", l)]
pd.DataFrame(rows, columns=["month", "basket_members", "basket_logret", "basket4_incl_qubt_logret", "sp500_logret", "qtum_logret"]).to_csv(OUT / "quantum_markets_monthly.csv", index=False)
hdr = [l for l in open(RAW_Q / "event_study_quantum.txt") if l.startswith("# label|")][0][2:].strip().split("|")
rows = [l.strip().split("|") for l in open(RAW_Q / "event_study_quantum.txt") if not l.startswith("#") and "|" in l]
ev = pd.DataFrame(rows, columns=[h if hdr.count(h) == 1 else f"{h}_{i}" for i, h in enumerate(hdr)])
ev.to_csv(OUT / "quantum_events.csv", index=False)
rows = [l.strip().split("|") for l in open(RAW_Q / "sec_revenue_quantum.txt") if not l.startswith("#") and "|" in l]
pd.DataFrame(rows, columns=["period_end", "firm", "revenue_usd", "source"]).to_csv(OUT / "quantum_revenue_quarterly.csv", index=False)
rows = [l.strip().split("|") for l in open(RAW_Q / "sec_edgar_quantum.txt") if re.match(r"^\d{4}\|", l)]
pd.DataFrame(rows, columns=["year", "quantum_computing_10k_hits", "quantum_computing_all_forms_hits"]).to_csv(OUT / "quantum_sec_edgar.csv", index=False)
rows = [l.strip().split("|") for l in open(RAW_Q / "usaspending_contracts_quantum.txt") if not l.startswith("#") and "|" in l]
c = pd.DataFrame(rows, columns=["firm", "agency"] + [f"FY{y}" for y in range(2016, 2027)]).melt(id_vars=["firm", "agency"], var_name="fiscal_year", value_name="obligations_usd_m")
c["fiscal_year"] = c.fiscal_year.str[2:]; c.to_csv(OUT / "quantum_federal_contracts.csv", index=False)
print("quantum CSVs:", sorted(p.name for p in OUT.glob("*.csv")))
