"""Vector autoregressions (VAR) for the lead-lag questions, India and US.

Models (monthly; attention indices differenced because their levels trend, as on the dashboards):
  US-1  [dNAI, basket excess return]       2021-09..2026-10, exogenous: flagship, Starship-flight and SpaceX-IPO month dummies
  IN-1  [dCAI, basket excess return]       2020-10..2026-10, exogenous: flagship month dummy
  US-2  [dNAI, dlog(1+launches)]           2016-02..2026-10, exogenous: flagship dummy
  IN-2  [dPAI, launches]                   2016-02..2026-10, exogenous: flagship dummy
For each: ADF on every series, lag order by AIC (max 6; BIC and a fixed 3 lags as robustness), stability,
Portmanteau whiteness test, Granger (F) both directions, orthogonalised cumulative impulse responses (12 months,
95% asymptotic bands; the shocked series is ordered second, so responses show leads only), and FEVD at 6 months.
"""
import json, sys, warnings
from pathlib import Path
import numpy as np, pandas as pd
from statsmodels.tsa.api import VAR
from statsmodels.tsa.stattools import adfuller
warnings.filterwarnings("ignore")
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

OUT = ROOT / "data/derived/var"; OUT.mkdir(parents=True, exist_ok=True)
u = pd.read_csv(CSV / "us/us_monthly.csv", index_col="month")
i = pd.read_csv(CSV / "india/india_monthly.csv", index_col="month")

SPECS = [
 dict(id="US-1", country="us", q="attention_prices", a="dNAI", b="ret", a_lab="NewSpace attention (change)", b_lab="NewSpace stocks vs S&P 500 (monthly excess return)",
      df=pd.DataFrame({"dNAI": u.NAI.diff(), "ret": u.basket_excess_logret * 100}).loc["2021-09":"2026-10"],
      ex=u[["d_flagship_month", "d_starship_flight_month", "d_spacex_ipo_month"]].loc["2021-09":"2026-10"], b_unit="% return"),
 dict(id="IN-1", country="india", q="attention_prices", a="dCAI", b="ret", a_lab="NewSpace attention (change)", b_lab="Listed space suppliers vs Nifty 50 (monthly excess return)",
      df=pd.DataFrame({"dCAI": i.CAI.diff(), "ret": i.basket_excess_logret * 100}).loc["2020-10":"2026-10"],
      ex=i[["d_flagship_month"]].loc["2020-10":"2026-10"], b_unit="% return"),
 dict(id="US-2", country="us", q="attention_buildout", a="dNAI", b="dlaunch", a_lab="NewSpace attention (change)", b_lab="Orbital launches (monthly change, log)",
      df=pd.DataFrame({"dNAI": u.NAI.diff(), "dlaunch": np.log1p(u.launches).diff()}).loc["2016-02":"2026-10"],
      ex=u[["d_flagship_month"]].loc["2016-02":"2026-10"], b_unit="log launches"),
 dict(id="IN-2", country="india", q="attention_buildout", a="dPAI", b="launch", a_lab="Public space attention (change)", b_lab="Orbital launches per month",
      df=pd.DataFrame({"dPAI": i.PAI.diff(), "launch": i.launches.astype(float)}).loc["2016-02":"2026-10"],
      ex=i[["d_flagship_month"]].loc["2016-02":"2026-10"], b_unit="launches"),
]

def r(x, d=3): return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), d)

res = []
for s in SPECS:
    df = s["df"].dropna(); ex = s["ex"].loc[df.index].astype(float)
    ex = ex.loc[:, ex.sum() > 0]                      # drop dummies with no events in the sample
    adf = {c: r(adfuller(df[c], autolag="AIC")[1]) for c in df}
    m = VAR(df, exog=ex if ex.shape[1] else None)
    sel = m.select_order(6)
    p_aic, p_bic = max(1, sel.aic), max(1, sel.bic)
    out = dict(id=s["id"], country=s["country"], q=s["q"], a=s["a_lab"], b=s["b_lab"], b_unit=s["b_unit"], n=int(len(df)),
               start=df.index[0], end=df.index[-1], exog=list(ex.columns), adf=adf, lags_aic=int(p_aic), lags_bic=int(p_bic))
    for tag, p in (("aic", p_aic), ("bic", p_bic), ("fixed3", 3)):
        f = m.fit(p)
        g_ab = f.test_causality(s["b"], [s["a"]], kind="f"); g_ba = f.test_causality(s["a"], [s["b"]], kind="f")
        out[tag] = dict(p=int(p), a_to_b=r(g_ab.pvalue), b_to_a=r(g_ba.pvalue), F_ab=r(g_ab.test_statistic, 2), F_ba=r(g_ba.test_statistic, 2),
                        stable=bool(f.is_stable()), white_p=r(f.test_whiteness(nlags=12).pvalue), n_obs=int(f.nobs))
        if tag == "aic":
            for order, key in (([s["a"], s["b"]], "irf"), ([s["b"], s["a"]], "irf_rev")):
                fo = VAR(df[order], exog=ex if ex.shape[1] else None).fit(p)
                ir = fo.irf(12); ce = ir.orth_cum_effects; se = ir.cum_effect_stderr(orth=True)
                ia, ib = order.index(s["a"]), order.index(s["b"])
                out[key] = dict(a_to_b=[r(v) for v in ce[:, ib, ia]], a_to_b_se=[r(v) for v in se[:, ib, ia]],
                                b_to_a=[r(v) for v in ce[:, ia, ib]], b_to_a_se=[r(v) for v in se[:, ia, ib]])
            fe = f.fevd(7).decomp       # [var, horizon, shock]
            ia, ib = list(df.columns).index(s["a"]), list(df.columns).index(s["b"])
            out["fevd6"] = dict(b_from_a=r(fe[ib, 6, ia]), a_from_b=r(fe[ia, 6, ib]))
            out["sd"] = {c: r(df[c].std()) for c in df}
            out["exog_effects"] = {e: dict(on_b=r(f.params.loc[e, s["b"]], 2), t_b=r(f.tvalues.loc[e, s["b"]], 2), p_b=r(f.pvalues.loc[e, s["b"]]),
                                           on_a=r(f.params.loc[e, s["a"]], 3), t_a=r(f.tvalues.loc[e, s["a"]], 2), p_a=r(f.pvalues.loc[e, s["a"]]))
                                   for e in ex.columns}
    # robustness at the main (AIC) lag: no event dummies; sample ending 2026-05 (before the SpaceX IPO and Vikram-1)
    pa = p_aic
    f1 = VAR(df).fit(pa)
    d2 = df.loc[:"2026-05"]; e2 = ex.loc[d2.index]; e2 = e2.loc[:, e2.sum() > 0]
    f2 = VAR(d2, exog=e2 if e2.shape[1] else None).fit(pa)
    out["robust"] = dict(no_dummies=dict(a_to_b=r(f1.test_causality(s["b"], [s["a"]], kind="f").pvalue), b_to_a=r(f1.test_causality(s["a"], [s["b"]], kind="f").pvalue)),
                         to_2026_05=dict(a_to_b=r(f2.test_causality(s["b"], [s["a"]], kind="f").pvalue), b_to_a=r(f2.test_causality(s["a"], [s["b"]], kind="f").pvalue), n=int(len(d2))))
    res.append(out)
    print(s["id"], out["n"], out["start"], "lags aic/bic", p_aic, p_bic, "| A->B", out["aic"]["a_to_b"], out["bic"]["a_to_b"], out["fixed3"]["a_to_b"],
          "| B->A", out["aic"]["b_to_a"], out["bic"]["b_to_a"], out["fixed3"]["b_to_a"], "| stable", out["aic"]["stable"], "white", out["aic"]["white_p"], "fevd", out["fevd6"], "adf", adf)
json.dump(res, open(OUT / "var_results.json", "w"), indent=1)

rows = []
for o in res:
    for tag in ("aic", "bic", "fixed3"):
        t = o[tag]
        rows.append(dict(model=o["id"], country=o["country"], question=o["q"], attention_series=o["a"], other_series=o["b"], sample=f'{o["start"]}..{o["end"]}',
                         n_months=o["n"], exogenous=";".join(o["exog"]), lag_rule=tag, lags=t["p"], p_attention_leads=t["a_to_b"], p_other_leads=t["b_to_a"],
                         F_attention_leads=t["F_ab"], F_other_leads=t["F_ba"], stable=t["stable"], whiteness_p_12=t["white_p"]))
pd.DataFrame(rows).to_csv(CSV / "shared/var_granger_results.csv", index=False)
irf = []
# "lead-only" responses: the shocked series is ordered second, so its surprise cannot move the other series in the same month
for o in res:
    A, B = o["irf_rev"], o["irf"]          # attention->other from (other, attention) order; other->attention from (attention, other) order
    for h in range(13):
        irf.append(dict(model=o["id"], horizon_months=h, attention_surprise_to_other=A["a_to_b"][h], se_attention_surprise=A["a_to_b_se"][h],
                        other_surprise_to_attention=B["b_to_a"][h], se_other_surprise=B["b_to_a_se"][h]))
pd.DataFrame(irf).to_csv(CSV / "shared/var_impulse_responses.csv", index=False)
