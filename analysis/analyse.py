import json, numpy as np, pandas as pd
from scipy import stats
from statsmodels.tsa.stattools import grangercausalitytests, adfuller
import statsmodels.api as sm
from load import *

w, t, L, P, B = wiki(), trends(), launches(), payloads(), basket()
IDX = pd.period_range("2016-01", "2026-10", freq="M")
tot = w["__TOTAL_ENWIKI_USER"]
wn = w.drop(columns="__TOTAL_ENWIKI_USER").div(tot, axis=0) * 1e6   # views per million en-wiki views

def zlog(s):
    s = np.log1p(s.dropna())
    return (s - s.mean()) / s.std()

def composite(parts, min_n):
    Z = pd.concat([zlog(p).rename(n) for n, p in parts.items()], axis=1).reindex(IDX)
    c = Z.mean(axis=1, skipna=True)
    c[Z.notna().sum(axis=1) < min_n] = np.nan
    return c, Z

# ---- Public (mission/state) attention index
pai_parts = {"GT ISRO": t["ISRO"], "GT Chandrayaan": t["Chandrayaan"], "GT Gaganyaan": t["Gaganyaan"],
             "Wiki ISRO": wn["ISRO_all"], "Wiki PSLV": wn["Polar_Satellite_Launch_Vehicle"], "Wiki Dept of Space": wn["Department_of_Space"]}
PAI, PAIZ = composite(pai_parts, 4)
# ---- Commercial / NewSpace attention index
cai_parts = {"GT Skyroot": t["Skyroot"], "GT Agnikul": t["Agnikul"], "GT IN-SPACe": t["IN-SPACe"], "GT space startup": t["space startup"],
             "Wiki Skyroot": wn["Skyroot_Aerospace"], "Wiki AgniKul": wn["AgniKul_Cosmos"], "Wiki Pixxel": wn["Pixxel"],
             "Wiki IN-SPACe": wn["Indian_National_Space_Promotion_and_Authorisation_Centre"], "Wiki NSIL": wn["NewSpace_India_Limited"]}
CAI, CAIZ = composite(cai_parts, 5)
CAI = CAI[CAI.index >= pd.Period("2020-09", "M")]

# ---- Hard indicators, monthly
L["m"] = L.date.dt.to_period("M")
orb = L[L.orbital]
launch_m = orb.groupby("m").size().reindex(IDX, fill_value=0)
fail_m = orb[~orb.success].groupby("m").size().reindex(IDX, fill_value=0)
P["m"] = P.date.dt.to_period("M")
comm_m = P[P.cls == "C"].groupby("m").size().reindex(IDX, fill_value=0)

res = {}
# A1 annual: does attention scale with launch cadence?
yr = pd.DataFrame({"PAI": PAI.groupby(PAI.index.year).mean(), "launches": launch_m.groupby(launch_m.index.year).sum(),
                   "fails": fail_m.groupby(fail_m.index.year).sum()})
yr = yr.loc[2016:2025]
rho, pv = stats.spearmanr(yr.PAI, yr.launches)
res["annual_PAI_vs_launches"] = dict(rho=round(rho, 3), p=round(pv, 3), n=len(yr))

# A2 monthly: launches vs flagship events as drivers of attention (OLS, HAC SE)
flag = pd.Series(0, index=IDX)
for m in ["2019-07", "2019-08", "2019-09", "2023-07", "2023-08", "2023-09", "2023-10"]:
    flag[pd.Period(m, "M")] = 1
X = pd.DataFrame({"launches": launch_m, "failures": fail_m, "flagship_mission_month": flag})
X = sm.add_constant(X)
yv = PAI.reindex(IDX)
ols = sm.OLS(yv, X, missing="drop").fit(cov_type="HAC", cov_kwds={"maxlags": 3})
ols_l = sm.OLS(yv, X.drop(columns="flagship_mission_month"), missing="drop").fit(cov_type="HAC", cov_kwds={"maxlags": 3})
res["monthly_PAI_ols"] = {k: dict(coef=round(ols.params[k], 3), t=round(ols.tvalues[k], 2)) for k in ols.params.index}
res["monthly_PAI_ols"]["R2_full"] = round(ols.rsquared, 3)
res["monthly_PAI_ols"]["R2_launches_only"] = round(ols_l.rsquared, 3)

# A3 attention ratchet: Wiki ISRO (normalised) baseline 12m pre-Jul-2023 vs months 13-24 after
isro = wn["ISRO_all"]
pre = isro[(isro.index >= pd.Period("2022-07", "M")) & (isro.index <= pd.Period("2023-06", "M"))].median()
post = isro[(isro.index >= pd.Period("2024-08", "M")) & (isro.index <= pd.Period("2025-07", "M"))].median()
post2 = isro[(isro.index >= pd.Period("2025-11", "M")) & (isro.index <= pd.Period("2026-10", "M"))].median()
gt = t["ISRO"]
res["ratchet"] = dict(wiki_isro_pre=round(pre, 3), wiki_isro_post13_24=round(post, 3), wiki_isro_last12=round(post2, 3),
                      gt_isro_pre=float(gt["2022-07":"2023-06"].median()), gt_isro_post13_24=float(gt["2024-08":"2025-07"].median()),
                      gt_isro_last12=float(gt["2025-11":"2026-10"].median()))

# B lead-lag: commercial attention vs investor (basket excess return)
d = pd.DataFrame({"dCAI": CAI.diff(), "CAI": CAI, "exc": B.excess.reindex(CAI.index)}).dropna()
cc = {}
for k in range(-6, 7):
    # corr(dCAI_t, exc_{t+k}) : k>0 means attention leads returns
    a = d.dCAI; bb = d.exc.shift(-k)
    m = pd.concat([a, bb], axis=1).dropna()
    r, p = stats.pearsonr(m.iloc[:, 0], m.iloc[:, 1])
    cc[k] = dict(r=round(r, 3), p=round(p, 3), n=len(m))
res["xcorr_dCAI_excess"] = cc
def granger(y, x, lags=3):
    g = grangercausalitytests(pd.concat([y, x], axis=1).dropna(), maxlag=lags)
    return {int(l): round(float(g[l][0]["ssr_ftest"][1]), 3) for l in g}
res["granger_attention_to_returns_p"] = granger(d.exc, d.dCAI)
res["granger_returns_to_attention_p"] = granger(d.dCAI, d.exc)
res["adf_p"] = dict(dCAI=round(adfuller(d.dCAI)[1], 4), exc=round(adfuller(d.exc)[1], 4))
res["n_months_B"] = len(d)

# B2 public attention vs returns (longer sample, 2016-2026)
d2 = pd.DataFrame({"dPAI": PAI.diff(), "exc": B.excess.reindex(IDX)}).dropna()
res["contemp_corr_dPAI_excess"] = [round(x, 3) for x in stats.pearsonr(d2.dPAI, d2.exc)] + [len(d2)]
res["granger_PAI_to_returns_p"] = granger(d2.exc, d2.dPAI)
res["granger_returns_to_PAI_p"] = granger(d2.dPAI, d2.exc)

# C attention vs launches lead-lag (monthly, 2016-2026)
d3 = pd.DataFrame({"PAI": PAI, "launch": launch_m}).dropna()
res["xcorr_PAI_launch"] = {k: round(d3.PAI.corr(d3.launch.shift(-k)), 3) for k in range(-3, 4)}

# D annual NewSpace: CAI vs commercial payloads & funding vintages
ann = pd.DataFrame({"CAI": CAI.groupby(CAI.index.year).mean(),
                    "comm_payloads": comm_m.groupby(comm_m.index.year).sum(),
                    "orbital_launches": launch_m.groupby(launch_m.index.year).sum()}).loc[2021:2026]
res["annual_newspace"] = ann.round(3).reset_index().rename(columns={"index": "year"}).to_dict("records")

# exports for dashboard
def ser(s, nd=3):
    s = s.dropna()
    return dict(x=[str(i) for i in s.index], y=[round(float(v), nd) for v in s.values])
out = dict(
    PAI=ser(PAI), CAI=ser(CAI),
    PAIZ={c: ser(PAIZ[c]) for c in PAIZ}, CAIZ={c: ser(CAIZ[c]) for c in CAIZ},
    launches=ser(launch_m, 0), fails=ser(fail_m, 0), comm_payloads=ser(comm_m, 0),
    excess=ser(B.excess, 4), basket_n=ser(B.n, 0),
    cum_excess=ser(B.excess.loc["2021-03":].cumsum(), 4),
    gt={c: ser(t[c], 0) for c in t}, wiki_norm={c: ser(wn[c], 3) for c in ["ISRO_all", "Chandrayaan-3", "Skyroot_Aerospace", "AgniKul_Cosmos", "Pixxel"]},
    wiki_total=ser(tot / 1e9, 3),
    launch_table=[dict(date=str(r.date.date()), lv=r.lv, flight=r.flight, mission=r.mission, agency=r.agency, success=bool(r.success))
                  for r in orb.itertuples()],
    payload_table=[dict(date=str(r.date.date()), name=r.name, owner=r.owner, cls=r.cls) for r in P.itertuples()],
    annual=yr.round(3).reset_index().rename(columns={"index": "year"}).to_dict("records"),
    stats=res)
json.dump(json.loads(json.dumps(out, default=str)), open("out.json", "w"))
print(json.dumps(res, indent=1, default=str))
