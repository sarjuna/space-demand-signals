"""Space Signals Index: attention vs build-out, India and US.

Plain-language definition
- Attention: how much people searched for and read about space (Google Trends + Wikipedia
  components already used on the dashboards), averaged over the past 12 months.
- Build-out: how much actually happened, over the past 12 months: orbital launch attempts and
  commercial satellites launched.
- Each is compared with its own 2016-2025 average and scaled so that 100 = the decade average and
  every 10 points = one standard deviation. Gap = Attention - Build-out.

Method
- Each component x is transformed to log(1+x) (attention: monthly value, then 12-month trailing mean;
  build-out: log(1 + 12-month trailing count)). Each component is standardised against its own
  2016-01..2025-12 baseline (fixed, so later data never revises earlier values). Sub-index = mean of
  available standardised components, re-standardised against the same baseline, then 100 + 10 z.
- Robustness: Google-only and Wikipedia-only attention, and leave-one-component-out ranges.
"""
import json, sys
from pathlib import Path
import numpy as np, pandas as pd
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

B0, B1 = "2016-01", "2025-12"
OUT = ROOT / "data/derived/index"; OUT.mkdir(parents=True, exist_ok=True)


def zb(s):
    b = s[(s.index >= B0) & (s.index <= B1)].dropna()
    return (s - b.mean()) / b.std(ddof=0)


def subindex(parts):
    Z = pd.DataFrame({k: zb(v) for k, v in parts.items()})
    return zb(Z.mean(axis=1, skipna=True).where(Z.notna().any(axis=1))), Z


def attention_parts(country):
    z = pd.read_csv(CSV / country / f"{country}_index_components_z.csv", index_col="month")
    # components are affine transforms of log(1+x); standardising the 12-month mean undoes the affine part
    return {c.split("__", 1)[1]: z[c].rolling(12, min_periods=12).mean() for c in z.columns}


def buildout_parts(country):
    m = pd.read_csv(CSV / country / f"{country}_monthly.csv", index_col="month")
    if country == "us":
        sats = (m.sats_starlink + m.sats_other_commercial).astype(float)
    else:
        sats = m.sats_commercial.astype(float)
    sats[sats.index > "2026-07"] = np.nan              # GCAT satellite catalogue complete only to 2026-07
    lab = "Commercial satellites launched"
    roll = lambda s: np.log1p(s.rolling(12, min_periods=12).sum())
    sat = roll(sats)
    # provisional: hold the satellite component at its last complete month (July 2026) until the catalogue catches up
    sat = sat.ffill()
    return {"Orbital launch attempts": roll(m.launches.astype(float)), lab: sat}


res = {}
for c in ["india", "us"]:
    ap, bp = attention_parts(c), buildout_parts(c)
    A, AZ = subindex(ap); Bx, BZ = subindex(bp)
    gt = {k: v for k, v in ap.items() if k.startswith("GT")}
    wk = {k: v for k, v in ap.items() if k.startswith("Wiki")}
    A_gt, _ = subindex(gt); A_wk, _ = subindex(wk)
    loo = pd.DataFrame({k: subindex({kk: vv for kk, vv in ap.items() if kk != k})[0] for k in ap})
    df = pd.DataFrame({"attention": 100 + 10 * A, "buildout": 100 + 10 * Bx})
    df["gap"] = df.attention - df.buildout
    df["attention_google_only"] = 100 + 10 * A_gt
    df["attention_wikipedia_only"] = 100 + 10 * A_wk
    df["attention_loo_min"] = 100 + 10 * loo.min(axis=1)
    df["attention_loo_max"] = 100 + 10 * loo.max(axis=1)
    df["n_attention_components"] = AZ.notna().sum(axis=1)
    df["n_buildout_components"] = BZ.notna().sum(axis=1)
    df = df[df.attention.notna() & df.buildout.notna()]
    df.index.name = "month"
    res[c] = df
    q = df.copy(); q["quarter"] = pd.PeriodIndex(q.index, freq="M").asfreq("Q").astype(str)
    # quarter value = value in the quarter's last available month (each value already covers 12 months)
    nm = q.groupby("quarter").size()
    qq = q.groupby("quarter").last()[nm == 3]          # complete quarters only
    res[c + "_q"] = qq
    rob = dict(r_google=round(df.attention.corr(df.attention_google_only), 3),
               r_wiki=round(df.attention.corr(df.attention_wikipedia_only.dropna().reindex(df.index)), 3),
               loo_max_abs_diff=round(float(np.nanmax(np.abs(np.c_[df.attention_loo_min - df.attention, df.attention_loo_max - df.attention]))), 1))
    res[c + "_rob"] = rob
    print(c, rob); print(qq[["attention", "buildout", "gap"]].round(1).tail(12).to_string())


def episodes(q):
    """Runs of quarters with gap > 0 (attention ahead of build-out)."""
    out, cur = [], None
    for k, g in q.gap.items():
        if g > 0 and cur is None: cur = [k, k]
        elif g > 0: cur[1] = k
        elif cur is not None: out.append(cur); cur = None
    if cur is not None: out.append(cur + ["open"])
    return out

EV = {"india": [("2019-09", "Chandrayaan-2"), ("2020-06", "Space reforms"), ("2023-08", "Chandrayaan-3"), ("2026-07", "Vikram-1")],
      "us": [("2020-05", "Crew Dragon Demo-2"), ("2022-11", "Artemis I"), ("2026-04", "Artemis II"), ("2026-06", "SpaceX IPO")]}
page = {}
for c in ["india", "us"]:
    m, q = res[c].round(2), res[c + "_q"].round(2)
    m.to_csv(CSV / "shared" / f"space_signals_index_{c}_monthly.csv", float_format="%.2f")
    q.to_csv(CSV / "shared" / f"space_signals_index_{c}_quarterly.csv", float_format="%.2f")
    last, prev = q.iloc[-1], q.iloc[-2]
    page[c] = dict(month=list(m.index), attention=list(m.attention), buildout=list(m.buildout),
                   att_lo=list(m.attention_loo_min), att_hi=list(m.attention_loo_max),
                   quarters=list(q.index), q_att=list(q.attention), q_bo=list(q.buildout), q_gap=list(q.gap),
                   latest=dict(quarter=q.index[-1], attention=round(last.attention, 1), buildout=round(last.buildout, 1), gap=round(last.gap, 1),
                               d_attention=round(last.attention - prev.attention, 1), d_buildout=round(last.buildout - prev.buildout, 1),
                               d_gap=round(last.gap - prev.gap, 1), prev_quarter=q.index[-2]),
                   last_month=m.index[-1], episodes=episodes(q), events=EV[c], robustness=res[c + "_rob"],
                   gap_min=dict(q=q.gap.idxmin(), v=round(q.gap.min(), 1)), gap_max=dict(q=q.gap.idxmax(), v=round(q.gap.max(), 1)),
                   last_negative=[k for k, g in q.gap.items() if g < 0][-1])
    page[c]["robustness"] = {k: float(v) for k, v in res[c + "_rob"].items()}
json.dump(page, open(OUT / "index_page.json", "w"), indent=0, default=float)
for c in page: print(c, page[c]["latest"], page[c]["episodes"], page[c]["last_negative"], page[c]["robustness"])
