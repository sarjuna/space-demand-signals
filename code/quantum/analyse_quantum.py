"""Quantum computing comparison (plan: code/quantum/PLAN.md, written before the data were pulled).
Reads data/raw/quantum/*.txt (+ the total-views row of data/raw/us/wikipedia_pageviews_us.txt) and writes data/derived/quantum/quantum.json."""
import json, re, sys
from pathlib import Path
import numpy as np, pandas as pd
from scipy import stats
import statsmodels.api as sm
from statsmodels.tsa.stattools import grangercausalitytests
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

RAW_Q = ROOT / "data/raw/quantum"; DER_Q = ROOT / "data/derived/quantum"; DER_Q.mkdir(parents=True, exist_ok=True)
IDX = pd.period_range("2016-01", "2026-10", freq="M")
P = lambda s: pd.Period(s[:4] + "-" + s[4:6], "M")

def series_file(path, skip_total=False):
    out = {}
    for l in open(path):
        if l.startswith("#") or "|" not in l: continue
        a, s, v = l.strip().split("|")
        v = [float(x) for x in v.split(",")]
        out[a] = pd.Series(v, index=pd.period_range(P(s), periods=len(v), freq="M"))
    return pd.DataFrame(out)

T = series_file(RAW_Q / "google_trends_quantum.txt")
WV = series_file(RAW_Q / "wikipedia_pageviews_quantum.txt")
TOT = series_file(RAW_US / "wikipedia_pageviews_us.txt")["TOTAL"]
W = WV.div(TOT, axis=0) * 1e6                      # views per million en.wikipedia user views
hn_line = [l for l in open(RAW_Q / "hackernews_quantum.txt") if not l.startswith("#")][0].strip().split("|")
HN = pd.Series([int(x) for x in hn_line[1].split(",")], index=pd.period_range(P(hn_line[0]), periods=130, freq="M"))
for s in (T, W): assert s.index.min() >= IDX[0] and s.index.max() == IDX[-1]
assert len(HN) == 130 and HN.index[-1] == IDX[-1]

def zlog(s):
    s = np.log1p(s.dropna()); return (s - s.mean()) / s.std()
def composite(parts, min_n):
    Z = pd.concat([zlog(p).rename(n) for n, p in parts.items()], axis=1).reindex(IDX)
    c = Z.mean(axis=1, skipna=True); c[Z.notna().sum(axis=1) < min_n] = np.nan
    return c, Z

field_parts = {"GT quantum computing": T["quantum computing"], "GT quantum computer": T["quantum computer"],
               "Wiki Quantum computing": W["Quantum_computing"], "Wiki Quantum supremacy": W["Quantum_supremacy"], "HN quantum stories": HN}
firm_parts = {"GT IonQ": T["IonQ"], "GT Rigetti": T["Rigetti"], "GT D-Wave": T["D-Wave"],
              "Wiki IonQ": W["IonQ"], "Wiki Rigetti": W["Rigetti_Computing"], "Wiki D-Wave": W["D-Wave_Systems"]}
FAI, FAIZ = composite(field_parts, 3)
FIRM, FIRMZ = composite(firm_parts, 3)
res = {}

# ---------- Q1 event salience ----------
EV_M = [pd.Period(m, "M") for m in ("2019-10", "2024-12", "2025-01", "2025-02")]
ev = pd.Series([1.0 if m in EV_M else 0.0 for m in IDX], index=IDX)
trend = pd.Series(np.arange(len(IDX), dtype=float), index=IDX)
def hac(y, X):
    d = pd.concat([y.rename("y"), X], axis=1).dropna()
    return sm.OLS(d.y, sm.add_constant(d.drop(columns="y"))).fit(cov_type="HAC", cov_kwds={"maxlags": 6})
o = hac(FAI, pd.DataFrame({"trend": trend, "event": ev}))
o0 = hac(FAI, pd.DataFrame({"trend": trend}))
res["q1_event"] = dict(coef=round(o.params["event"], 3), t=round(o.tvalues["event"], 2), p=round(o.pvalues["event"], 4),
                       ci=[round(x, 3) for x in o.conf_int().loc["event"]], R2=round(o.rsquared, 3), R2_trend_only=round(o0.rsquared, 3), n=int(o.nobs))
top = FAI.sort_values(ascending=False).head(8)
res["q1_top_months"] = [[str(m), round(v, 2)] for m, v in top.items()]
res["fai_event_months"] = {str(m): round(FAI[m], 2) for m in EV_M}

# ---------- Q2 attention vs build-out ----------
rev = {}
for l in open(RAW_Q / "sec_revenue_quantum.txt"):
    if l.startswith("#") or "|" not in l: continue
    e, f, v, kind = l.strip().split("|")
    rev.setdefault(f, {})[pd.Period(e, "Q")] = float(v)
R = pd.DataFrame(rev).sort_index()
Rall = R.dropna()                                    # quarters with all four firms reported
res["rev_quarters"] = [str(Rall.index[0]), str(Rall.index[-1]), len(Rall)]
qa = FAI.groupby(FAI.index.asfreq("Q")).mean()
qf = FIRM.groupby(FIRM.index.asfreq("Q")).mean()
tot = Rall.sum(axis=1) / 1e6
dq = pd.DataFrame({"fai": qa, "firm": qf, "rev": tot}).dropna()
r1, p1 = stats.spearmanr(dq.fai, dq.rev); r2, p2 = stats.spearmanr(dq.fai.diff().dropna(), np.log(dq.rev).diff().dropna())
r3, p3 = stats.spearmanr(dq.firm, dq.rev); r4, p4 = stats.spearmanr(dq.firm.diff().dropna(), np.log(dq.rev).diff().dropna())
res["q2_revenue"] = dict(n=len(dq), level=dict(rho=round(r1, 3), p=round(p1, 4)), change=dict(rho=round(r2, 3), p=round(p2, 4), n=len(dq) - 1),
                         firm_level=dict(rho=round(r3, 3), p=round(p3, 4)), firm_change=dict(rho=round(r4, 3), p=round(p4, 4)))
res["rev_total_m"] = {str(k): round(v, 2) for k, v in tot.items()}
res["rev_by_firm_m"] = {f: {str(k): round(v / 1e6, 2) for k, v in R[f].dropna().items()} for f in R.columns}
# federal contracts
crow = [l.strip().split("|") for l in open(RAW_Q / "usaspending_contracts_quantum.txt") if not l.startswith("#") and "|" in l]
C = pd.DataFrame(crow, columns=["firm", "agency"] + [f"FY{y}" for y in range(2016, 2027)])
for c in C.columns[2:]: C[c] = C[c].astype(float)
CA = C[C.agency == "All"].set_index("firm").drop(columns="agency")
fed = CA.sum()
res["fed_total_m"] = {k[2:]: round(v, 2) for k, v in fed.items()}
res["fed_by_firm_total_m"] = {f: round(v, 2) for f, v in CA.sum(axis=1).sort_values(ascending=False).items()}
ann = FAI.groupby(FAI.index.year).mean()
yrs = list(range(2016, 2026))
r5, p5 = stats.spearmanr([ann[y] for y in yrs], [fed[f"FY{y}"] for y in yrs])
res["q2_fed"] = dict(rho=round(r5, 3), p=round(p5, 4), n=len(yrs))
sec = pd.DataFrame([l.strip().split("|") for l in open(RAW_Q / "sec_edgar_quantum.txt") if re.match(r"^\d{4}\|", l)],
                   columns=["year", "k10", "all"]).astype(int).set_index("year")
res["sec"] = [dict(year=int(y), k10=int(r.k10), all=int(r["all"])) for y, r in sec.iterrows()]
r6, p6 = stats.spearmanr([ann[y] for y in yrs], [sec.loc[y, "k10"] for y in yrs])
res["q2_sec10k"] = dict(rho=round(r6, 3), p=round(p6, 4), n=len(yrs))

# ---------- Q3 concentration ----------
ry = R.groupby(R.index.year).sum(min_count=1)
res["q3_rev_share_ionq"] = {int(y): round(100 * ry.loc[y, "IonQ"] / ry.loc[y].sum(), 1) for y in range(2022, 2026)}
res["q3_rev_annual_m"] = {int(y): {f: round(ry.loc[y, f] / 1e6, 2) for f in R.columns} for y in range(2022, 2026)}
fv = WV[["IonQ", "Rigetti_Computing", "D-Wave_Systems"]].loc["2022-01":"2026-10"]
fy = fv.groupby(fv.index.year).sum()
res["q3_wiki_share"] = {int(y): {c.split("_")[0]: round(100 * fy.loc[y, c] / fy.loc[y].sum(), 1) for c in fy.columns} for y in fy.index}
fs = res["fed_by_firm_total_m"]; ft = sum(fs.values())
res["q3_fed_top_share"] = [list(fs)[0], round(100 * list(fs.values())[0] / ft, 1), round(ft, 2)]

# ---------- Q4 prices and attention ----------
mk = pd.DataFrame([l.split() for l in open(RAW_Q / "markets_quantum.txt") if re.match(r"^\d{4}-\d\d ", l)],
                  columns=["m", "n", "b", "b4", "sp", "qt"]).set_index("m")
mk.index = [pd.Period(x, "M") for x in mk.index]; mk = mk.astype(float)
mk["exc"] = mk.b - mk.sp
d = pd.DataFrame({"dF": FAI.diff(), "dFirm": FIRM.diff(), "exc": mk.exc}).loc["2021-11":"2026-10"].dropna()
def granger(y, x, lags=(1, 3, 6)):
    g = grangercausalitytests(pd.concat([y, x], axis=1).dropna(), maxlag=max(lags))
    return {int(l): round(float(g[l][0]["ssr_ftest"][1]), 3) for l in lags}
res["q4"] = dict(n=len(d), ret_to_field=granger(d.dF, d.exc), field_to_ret=granger(d.exc, d.dF),
                 ret_to_firm=granger(d.dFirm, d.exc), firm_to_ret=granger(d.exc, d.dFirm))
r7, p7 = stats.pearsonr(d.dF, d.exc); r8, p8 = stats.pearsonr(d.dFirm, d.exc)
res["q4_contemp"] = dict(field=[round(r7, 3), round(p7, 4)], firm=[round(r8, 3), round(p8, 4)])

# ---------- Q5 event studies ----------
evs = []
for l in open(RAW_Q / "event_study_quantum.txt"):
    if l.startswith("#") or "|" not in l: continue
    p = l.strip().split("|")
    v = [float(x) for x in p[3:]]
    evs.append(dict(label=p[0], t0=p[1], members=int(p[2]), beta=v[0], pre=v[1], pre_t=v[2], c01=v[3], t01=v[4], c05=v[5], t05=v[6],
                    c01_ma=v[7], t01_ma=v[8], d0=v[9], t_d0=v[10], q_c01=v[11], q_t01=v[12], q_c05=v[13], q_t05=v[14],
                    loo=dict(IONQ=v[15], RGTI=v[16], QBTS=v[17]), firms=dict(IONQ=[v[18], v[19]], RGTI=[v[20], v[21]], QBTS=[v[22], v[23]]), qubt=[v[24], v[25]]))
main = [e for e in evs if "alt" not in e["label"]]
pv = [2 * (1 - stats.norm.cdf(abs(e["t01"]))) for e in main]
order = np.argsort(pv); m = len(pv); bh = [0.0] * m; prev = 1.0
for rank, i in reversed(list(enumerate(order, 1))):
    prev = min(prev, pv[i] * m / rank); bh[i] = prev
for e, p_, b in zip(main, pv, bh): e["p01"] = round(p_, 5); e["p01_bh"] = round(b, 5)
res["events"] = evs
for e in evs: e["c01_simple"] = round(100 * (np.exp(e["c01"] / 100) - 1), 1)

# ---------- comparison with the US space results (read from the space pipeline outputs) ----------
U = json.load(open(DER_US / "us_page.json")); S = U["stats"]
res["space"] = dict(granger_ret_to_NAI=S.get("granger_ret_to_NAI"), granger_NAI_to_ret=S.get("granger_NAI_to_ret"),
                    annual_spearman=S.get("annual_spearman"))

def ser(s, nd=3): return {str(k): (None if pd.isna(v) else round(float(v), nd)) for k, v in s.items()}
out = dict(stats=res, FAI=ser(FAI), FIRM=ser(FIRM), FAIZ={c: ser(FAIZ[c]) for c in FAIZ}, FIRMZ={c: ser(FIRMZ[c]) for c in FIRMZ},
           market=[dict(m=str(k), n=int(r.n), b=r.b, sp=r.sp, qt=r.qt) for k, r in mk.iterrows()],
           trends={c: ser(T[c], 1) for c in T}, hn=ser(HN, 0))
json.dump(out, open(DER_Q / "quantum.json", "w"), separators=(",", ":"))
print(json.dumps(res, indent=1, default=str)[:6000])
