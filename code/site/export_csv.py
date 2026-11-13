"""Export analysis-ready CSVs for India and the US into csv/.
Re-runs both analyses in memory so every column is exactly what the dashboards use."""
import contextlib, io, json, os, sys, re
import pandas as pd, numpy as np
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

for _d in ("us", "india", "shared"): (CSV / _d).mkdir(parents=True, exist_ok=True)

def run(path, cwd):
    ns = {"__name__": "export"}
    old = os.getcwd(); os.chdir(cwd); sys.path.insert(0, cwd)
    with contextlib.redirect_stdout(io.StringIO()):
        exec(open(path).read(), ns)
    os.chdir(old); sys.path.pop(0)
    return ns

def mstr(df):
    df = df.copy(); df.index = [str(p) for p in df.index]; df.index.name = "month"; return df

def snake(s):
    return re.sub(r"[^a-z0-9]+", "_", s.lower()).strip("_")

written = []
def save(df, name, index=True):
    df.to_csv(CSV / ("india" if name.startswith("india_") else "shared" if name.startswith("hackernews_") else "us") / name, index=index, float_format="%.12g"); written.append((name, df.shape))

# ======================= United States =======================
U = run(str(ROOT / "code/us/analyse_us.py"), str(ROOT / "code/us"))
IDX = U["IDX"]
Lm = U["L"].reindex(IDX)
PLm = U["PL"].reindex(IDX)
T, W, WTOT, hu, M = U["T"], U["W"], U["WTOT"], U["hu"], U["M"]
us = pd.DataFrame(index=IDX)
us["launches"] = Lm.n; us["launch_failures"] = Lm.fail; us["launches_spacex"] = Lm.spx
us["launches_other_commercial"] = Lm.oth; us["launches_government"] = Lm.gov; us["launches_rocketlab_nz"] = Lm.rlnz
for c in ["starlink", "com", "gov", "oth"]:
    us["sats_" + {"com": "other_commercial", "gov": "government", "oth": "other", "starlink": "starlink"}[c]] = PLm[c]
for c in T.columns: us["gt_" + snake(c)] = T[c].reindex(IDX)
for c in W.columns: us["wiki_" + snake(c) + "_per_m"] = W[c]
us["wiki_enwiki_total_views"] = WTOT.reindex(IDX)
us["hn_stories"] = hu.n.reindex(IDX); us["hn_stories_state"] = hu.ns.reindex(IDX); us["hn_stories_newspace"] = hu.nn.reindex(IDX)
us["hn_vader_mean"] = hu["mean"].reindex(IDX); us["hn_share_negative"] = hu.neg.reindex(IDX); us["hn_share_positive"] = hu.pos.reindex(IDX)
us["PAI"] = U["PAI"].reindex(IDX); us["NAI"] = U["NAI"].reindex(IDX)
Mm = M.reindex(IDX)
us["basket_members"] = Mm.n; us["basket_logret"] = Mm.basket; us["sp500_logret"] = Mm.sp; us["ufo_logret"] = Mm.ufo
us["spcx_logret"] = Mm.spcx; us["basket_excess_logret"] = Mm.excess; us["ufo_excess_logret"] = Mm.ufo_excess
us["d_flagship_month"] = U["flag"]; us["d_starship_flight_month"] = U["star"]; us["d_spacex_ipo_month"] = U["ipo"]
save(mstr(us), "us_monthly.csv")
save(mstr(pd.concat([U["PAIZ"].add_prefix("PAI__"), U["NAIZ"].add_prefix("NAI__")], axis=1).reindex(IDX)), "us_index_components_z.csv")

# markets before 2016 (basket starts Oct 2019 anyway; UFO from 2019)
save(mstr(M[["n", "basket", "sp", "ufo", "spcx", "excess", "ufo_excess"]].rename(columns={"n": "basket_members", "basket": "basket_logret", "sp": "sp500_logret", "ufo": "ufo_logret", "spcx": "spcx_logret", "excess": "basket_excess_logret", "ufo_excess": "ufo_excess_logret"})), "us_markets_monthly_2019_2026.csv")
ev = U["EV"].copy(); ev.columns = ["t0_requested", "label", "excluded_firm", "basket_t0", "basket_members", "basket_car_0_1_pct", "basket_t_0_1", "basket_car_0_5_pct", "basket_t_0_5", "basket_pre_pct", "basket_sd_ar_pct",
                                   "ufo_t0", "ufo_n", "ufo_car_0_1_pct", "ufo_t_0_1", "ufo_car_0_5_pct", "ufo_t_0_5", "ufo_pre_pct", "ufo_sd_ar_pct"]
save(ev, "us_events.csv", index=False)
rows = [dict(event=k, day=r["k"], date=r["date"], basket_ar_pct=r["ar"], members=r["n"]) for k, v in U["WIN"].items() for r in v]
save(pd.DataFrame(rows), "us_event_windows_daily.csv", index=False)
H, HE, HT = U["H"] if "H" in U else None, None, None
from load_us import hn as _hn
H, HE, HT = _hn()
H = H.rename(columns={"c": "country", "m": "month", "n": "stories", "ns": "stories_state", "nn": "stories_newspace", "mean": "vader_mean", "ms": "vader_mean_state", "mn": "vader_mean_newspace", "neg": "share_negative", "pos": "share_positive", "pts": "points_sum"})
H["month"] = H["month"].astype(str); H["country"] = H["country"].replace({"IN": "India"})
save(H, "hackernews_monthly.csv", index=False)
HE = HE.rename(columns={"c": "country", "wn": "window_n", "wm": "window_mean", "wsd": "window_sd", "wneg": "window_share_neg", "bn": "base_n", "bm": "base_mean", "bsd": "base_sd", "bneg": "base_share_neg", "wr": "window_per_day", "br": "base_per_day"}).replace({"country": {"IN": "India"}})
save(HE, "hackernews_event_windows.csv", index=False)
HT = HT.rename(columns={"c": "country", "event": "event_date", "date": "story_date", "pts": "points", "s": "vader"}).replace({"country": {"IN": "India"}})
save(HT, "hackernews_top_stories.csv", index=False)
bills = U["B"].rename(columns={"c": "congress"})
save(bills, "us_congress_space_bills.csv", index=False)
save(pd.DataFrame({"congress": list(U["TOT"]), "all_bills": list(U["TOT"].values())}).merge(bills.groupby("congress").size().rename("space_bills").reset_index()), "us_congress_totals.csv", index=False)
fr = U["FRY"].join(U["FRA"]).rename(columns={"n": "documents", "com": "commercial_mentions", "rule": "rules", "prop": "proposed_rules", "notice": "notices", "pres": "presidential"})
save(fr, "us_federal_register_annual.csv")
save(pd.DataFrame(U["FRS"]), "us_federal_register_selected.csv", index=False)
ann = U["ann"].copy(); ann.index.name = "year"
ann = ann.join(pd.Series(U["FAA_OPS"], name="faa_licensed_ops_fy")).join(U["SEC"].rename(columns={"leo10k": "sec_10k_low_earth_orbit", "spaceecon": "sec_all_space_economy"}))
save(ann, "us_annual.csv")
_lf = pd.DataFrame(U["launch_failures"]())
_lf["code"] = [l.strip().split("|")[5] for l in open(RAW_US / "gcat_launches_us.txt") if re.match(r"^\d{4} [A-Z][a-z]{2} ", l)]
save(_lf, "us_launch_failures.csv", index=False)

# ======================= India =======================
I = run(str(ROOT / "code/india/analyse.py"), str(ROOT / "code/india"))
IDXI = I["IDX"]
t, wn, tot, B = I["t"], I["wn"], I["tot"], I["B"]
ind = pd.DataFrame(index=IDXI)
ind["launches"] = I["launch_m"]; ind["launch_failures"] = I["fail_m"]; ind["sats_commercial"] = I["comm_m"]
for c in t.columns: ind["gt_" + snake(c)] = t[c].reindex(IDXI)
for c in wn.columns: ind["wiki_" + snake(c) + "_per_m"] = wn[c].reindex(IDXI)
ind["wiki_enwiki_total_views"] = tot.reindex(IDXI)
hi = U["hi"]
ind["hn_stories"] = hi.n.reindex(IDXI); ind["hn_vader_mean"] = hi["mean"].reindex(IDXI)
ind["PAI"] = I["PAI"].reindex(IDXI); ind["CAI"] = I["CAI"].reindex(IDXI)
Bi = B.reindex(IDXI)
ind["basket_members"] = Bi.n; ind["basket_logret"] = Bi.rb; ind["nifty50_logret"] = Bi.rn; ind["basket_excess_logret"] = Bi.excess
ind["d_flagship_month"] = I["flag"].reindex(IDXI)
save(mstr(ind), "india_monthly.csv")
save(mstr(pd.concat([I["PAIZ"].add_prefix("PAI__"), I["CAIZ"].add_prefix("CAI__")], axis=1).reindex(IDXI)), "india_index_components_z.csv")
Ld = I["L"].drop(columns="m")
_cat = [l.strip().split("|")[6] for l in open(RAW_IN / "gcat_launches_india.txt") if not l.startswith("#") and "|" in l]
assert len(_cat) == len(Ld); Ld.insert(6, "category", _cat)
save(Ld, "india_launches.csv", index=False)
Pd = I["P"].drop(columns="m")
_tag = [l.strip().split("|")[3] for l in open(RAW_IN / "gcat_satellites_india.txt") if not l.startswith("#") and len(l.strip().split("|")) == 5]
assert len(_tag) == len(Pd); Pd.insert(3, "launch_id", _tag)
save(Pd, "india_nongov_payloads.csv", index=False)
DJ = json.load(open(DER_IN / "dash.json"))
save(pd.DataFrame(DJ["events"]), "india_events.csv", index=False)
save(pd.DataFrame(DJ["funding"]), "india_funding_reports.csv", index=False)
raw = [l.rstrip("\n") for l in open(RAW_IN / "lok_sabha_questions_india.txt")]
cut = next(i for i, l in enumerate(raw) if l.startswith("# NEWSPACE"))
sess = [l.split("|") for l in raw[:cut] if not l.startswith("#") and "|" in l]
save(pd.DataFrame(sess[1:], columns=sess[0]), "india_lok_sabha_sessions.csv", index=False)
nt = [l.split("|", 1) for l in raw[cut:] if not l.startswith("#") and "|" in l]
save(pd.DataFrame(nt, columns=["date", "title"]), "india_lok_sabha_newspace_titles.csv", index=False)
g = [l.split() for l in open(RAW_IN / "gdelt_tone_india.txt") if re.match(r"^\d{8} ", l)]
save(pd.DataFrame(g, columns=["date", "tone"]), "india_gdelt_tone_daily.csv", index=False)

# ---------- complete raw coverage: full date ranges and raw counts ----------
_mk = [l.split() for l in open(RAW_IN / "markets_monthly_india.txt") if re.match(r"^\d{6} ", l)]
_mk = pd.DataFrame(_mk, columns=["label", "basket_members", "basket_logret", "nifty50_logret"])
_mk.insert(0, "month", [str(pd.Period(x[:4] + "-" + x[4:], "M") + 1) for x in _mk.label])   # Yahoo label = actual month - 1
_mk["note"] = ["partial month (1-3 Nov 2026), not used in analysis" if m == "2026-11" else "" for m in _mk.month]
save(_mk.drop(columns="label"), "india_markets_monthly.csv", index=False)
from load_us import launches as _ul, payloads as _up, FAA_OPS as _faa
ul = _ul(); ul.index = [str(p) for p in ul.index]; ul.index.name = "month"
save(ul.rename(columns={"n": "launches", "fail": "launch_failures", "spx": "launches_spacex", "oth": "launches_other_commercial", "gov": "launches_government", "rlnz": "launches_rocketlab_nz"}), "us_launches_monthly.csv")
up = _up(); up.index = [str(p) for p in up.index]; up.index.name = "month"
save(up.rename(columns={"starlink": "sats_starlink", "com": "sats_other_commercial", "gov": "sats_government", "oth": "sats_other"}), "us_satellites_monthly.csv")
save(pd.DataFrame({"fiscal_year": list(_faa), "faa_licensed_operations": list(_faa.values())}), "us_faa_licensed_operations.csv", index=False)
from load_us import contracts as _contracts
_ct = _contracts().melt(id_vars=["firm", "agency"], var_name="fiscal_year", value_name="obligations_usd_m")
_ct["fiscal_year"] = _ct.fiscal_year.str[2:].astype(int)
save(_ct, "us_federal_contracts.csv", index=False)
def wiki_raw(path, name):
    cols = {}
    for l in open(path):
        if l.startswith("#") or "|" not in l: continue
        a, f0, v = l.strip().split("|"); v = [int(x) for x in v.split(",")]
        cols["enwiki_total" if "TOTAL" in a else a] = pd.Series(v, index=pd.period_range(pd.Period(f0[:4] + "-" + f0[4:], "M"), periods=len(v), freq="M"))
    df = pd.DataFrame(cols); df.index = [str(p) for p in df.index]; df.index.name = "month"
    save(df.astype("Int64"), name)
wiki_raw(RAW_US / "wikipedia_pageviews_us.txt", "us_wikipedia_views.csv")
wiki_raw(RAW_IN / "wikipedia_pageviews_india.txt", "india_wikipedia_views.csv")
sa = [l.strip().split("|") for l in open(RAW_IN / "gcat_satellites_india.txt") if re.match(r"^\d{4}\|\d+\|\d+$", l.strip())]
save(pd.DataFrame([[int(a), int(b), int(c)] for a, b, c in sa], columns=["year", "government", "non_government"]), "india_satellites_annual.csv", index=False)
save(pd.DataFrame(DJ["c3"]).rename(columns={"d": "day", "ar": "basket_ar_pct"}), "india_event_window_chandrayaan3_daily.csv", index=False)
rb, on = [], False
for l in open(RAW_IN / "event_study_india.txt"):
    if l.startswith("# Robustness"): on = True; continue
    m = re.match(r"^(\d{4}-\d\d-\d\d)\|(-?[\d.]+)\((-?[\d.]+)\)\|(-?[\d.]+)\((-?[\d.]+)\)", l)
    if on and m: rb.append([m.group(1)] + [float(x) for x in m.groups()[1:]])
ev5 = pd.DataFrame(rb, columns=["event", "car_0_1_pct", "t_0_1", "car_0_5_pct", "t_0_5"]).merge(pd.DataFrame(DJ["events"])[["date", "label"]], left_on="event", right_on="date").drop(columns="date")
save(ev5, "india_events_robustness_5firm.csv", index=False)

for n, s in written: print(f"{n:40s} {s}")
