import json, re, numpy as np, pandas as pd
from scipy import stats
from statsmodels.tsa.stattools import grangercausalitytests, adfuller
import statsmodels.api as sm
from load_us import *

L, PL, T = launches(), payloads(), trends()
M, EV, WIN = markets()
H, HEV, HTOP = hn()
TOT, B = bills()
FRY, FRA, FRS = fedreg()
SEC = sec()
res = {}

def zlog(s):
    s = np.log1p(s.dropna()); return (s - s.mean()) / s.std()

def composite(parts, min_n, idx=IDX):
    Z = pd.concat([zlog(p).rename(n) for n, p in parts.items()], axis=1).reindex(idx)
    c = Z.mean(axis=1, skipna=True); c[Z.notna().sum(axis=1) < min_n] = np.nan
    return c, Z

hu = H[H.c == "US"].set_index("m"); hi = H[H.c == "IN"].set_index("m")

# ---------- attention indices (Google Trends US + Hacker News volume) ----------
W, WTOT = wiki()
USE_WIKI = __import__("os").environ.get("NO_WIKI") is None
pai_parts = {"GT NASA": T["NASA"], "GT Artemis": T["Artemis"], "GT Space Force": T["Space Force"], "HN state stories": hu.ns}
nai_parts = {"GT SpaceX": T["SpaceX"], "GT Starlink": T["Starlink"], "GT Blue Origin": T["Blue Origin"], "GT Rocket Lab": T["Rocket Lab"],
             "GT space stocks": T["space stocks"], "HN NewSpace stories": hu.nn}
if USE_WIKI:
    pai_parts.update({"Wiki NASA": W["NASA"], "Wiki Artemis": W["Artemis_program"], "Wiki Space Force": W["United_States_Space_Force"]})
    nai_parts.update({"Wiki SpaceX": W["SpaceX"], "Wiki Starlink": W["Starlink"], "Wiki Blue Origin": W["Blue_Origin"],
                      "Wiki Rocket Lab": W["Rocket_Lab"], "Wiki Starship": W["SpaceX_Starship"]})
PAI, PAIZ = composite(pai_parts, 4 if USE_WIKI else 3)
NAI, NAIZ = composite(nai_parts, 6 if USE_WIKI else 4)

# ---------- hard indicators ----------
Lm = L.reindex(IDX)
launch_m, fail_m = Lm.n, Lm.fail
yr = lambda s: s.groupby(s.index.year)
ann = pd.DataFrame({"launches": yr(launch_m).sum(), "fails": yr(fail_m).sum(), "spacex": yr(Lm.spx).sum(), "other_com": yr(Lm.oth).sum(),
                    "rocketlab_nz": yr(Lm.rlnz).sum(), "PAI": yr(PAI).mean(), "NAI": yr(NAI).mean(),
                    "hn_n": yr(hu.n).sum(), "hn_mean": None})
ann["hn_mean"] = [np.average(hu.loc[[m for m in hu.index if m.year == y], "mean"].dropna(), weights=hu.loc[[m for m in hu.index if m.year == y]].dropna(subset=["mean"]).n) for y in ann.index]
PLy = PL.groupby(PL.index.year).sum()
ann = ann.join(PLy)
a10 = ann.loc[2016:2025]
r1, p1 = stats.spearmanr(a10.PAI, a10.launches); r2, p2 = stats.spearmanr(a10.NAI, a10.launches)
res["annual_spearman"] = dict(PAI=dict(rho=round(r1, 3), p=round(p1, 3)), NAI=dict(rho=round(r2, 3), p=round(p2, 3)), n=len(a10))
res["launch_growth"] = dict(y2016=int(ann.launches[2016]), y2025=int(ann.launches[2025]), y2026_to_oct=int(ann.launches[2026]),
                            spacex_share_2025=round(ann.spacex[2025] / ann.launches[2025], 3))

# flagship months (crewed / lunar national missions) and NewSpace spectacle months
flag = pd.Series(0, index=IDX)
for m in ["2020-05", "2020-06", "2022-11", "2026-04"]: flag[P(m)] = 1
star = pd.Series(0, index=IDX)
for m in ["2023-04", "2023-11", "2024-03", "2024-06", "2024-10", "2024-11", "2025-01", "2025-03", "2025-05", "2025-08", "2025-10", "2026-05", "2026-07", "2026-09"]: star[P(m)] = 1
ipo = pd.Series(0, index=IDX); ipo[P("2026-06")] = 1

def ols(y, X):
    X = sm.add_constant(X); return sm.OLS(y, X, missing="drop").fit(cov_type="HAC", cov_kwds={"maxlags": 3})
o1 = ols(PAI, pd.DataFrame({"launches": launch_m, "failures": fail_m, "flagship": flag}))
o1b = ols(PAI, pd.DataFrame({"launches": launch_m, "failures": fail_m}))
o2 = ols(NAI, pd.DataFrame({"launches": launch_m, "failures": fail_m, "starship_flight": star, "spacex_ipo": ipo}))
o2b = ols(NAI, pd.DataFrame({"launches": launch_m, "failures": fail_m}))
# detrended NAI: does launch count matter beyond a common trend?
trend = pd.Series(np.arange(len(IDX)), index=IDX)
o2c = ols(NAI, pd.DataFrame({"launches": launch_m, "trend": trend}))
fmt = lambda o: {k: dict(coef=round(o.params[k], 3), t=round(o.tvalues[k], 2)) for k in o.params.index}
res["ols_PAI"] = fmt(o1); res["ols_PAI"]["R2"] = round(o1.rsquared, 3); res["ols_PAI"]["R2_launch_only"] = round(o1b.rsquared, 3)
res["ols_NAI"] = fmt(o2); res["ols_NAI"]["R2"] = round(o2.rsquared, 3); res["ols_NAI"]["R2_launch_only"] = round(o2b.rsquared, 3)
res["ols_NAI_trend"] = fmt(o2c); res["ols_NAI_trend"]["R2"] = round(o2c.rsquared, 3)

# ---------- investors ----------
d = pd.DataFrame({"dNAI": NAI.diff(), "dPAI": PAI.diff(), "exc": M.excess.reindex(IDX), "n": M.n.reindex(IDX),
                  "sent": hu["mean"].reindex(IDX), "launch": launch_m}).loc["2021-09":].dropna(subset=["dNAI", "exc"])
def granger(y, x, lags=3):
    g = grangercausalitytests(pd.concat([y, x], axis=1).dropna(), maxlag=lags)
    return {int(l): round(float(g[l][0]["ssr_ftest"][1]), 3) for l in g}
res["n_months_inv"] = len(d)
res["adf"] = dict(dNAI=round(adfuller(d.dNAI)[1], 4), exc=round(adfuller(d.exc)[1], 4), sent=round(adfuller(d.sent)[1], 4))
res["granger_NAI_to_ret"] = granger(d.exc, d.dNAI); res["granger_ret_to_NAI"] = granger(d.dNAI, d.exc)
res["granger_sent_to_ret"] = granger(d.exc, d.sent); res["granger_ret_to_sent"] = granger(d.sent, d.exc)
xc = {}
for k in range(-6, 7):
    m = pd.concat([d.dNAI, d.exc.shift(-k)], axis=1).dropna(); r, p = stats.pearsonr(m.iloc[:, 0], m.iloc[:, 1])
    xc[k] = dict(r=round(r, 3), p=round(p, 3), n=len(m))
res["xcorr_dNAI_exc"] = xc
r0, p0 = stats.pearsonr(d.dNAI, d.exc); res["contemp_dNAI_exc"] = [round(r0, 3), round(p0, 4), len(d)]
rs, ps = stats.pearsonr(d.sent, d.exc); res["contemp_sent_exc"] = [round(rs, 3), round(ps, 3), len(d)]

# ---------- sentiment (HN VADER) ----------
hs = hu.reindex(IDX)
res["hn_us_total"] = int(hu.n.sum()); res["hn_in_total"] = int(hi.n.sum())
s_pre = hs.loc["2016-01":"2019-12"]; s_post = hs.loc["2023-01":"2026-10"]
wm = lambda x: float(np.average(x["mean"].dropna(), weights=x.dropna(subset=["mean"]).n))
res["hn_sent_era"] = dict(pre_2016_19=round(wm(s_pre), 4), post_2023_26=round(wm(s_post), 4),
                          neg_pre=round(float(np.average(s_pre.neg, weights=s_pre.n)), 4), neg_post=round(float(np.average(s_post.neg, weights=s_post.n)), 4))
# trend in monthly mean sentiment
tt = stats.linregress(np.arange(len(hs)), hs["mean"].values)
res["hn_sent_trend_per_year"] = dict(slope=round(tt.slope * 12, 4), p=round(tt.pvalue, 5))
# sentiment vs launches / failures (monthly)
dd = pd.DataFrame({"sent": hs["mean"], "launch": launch_m, "fail": fail_m}).dropna()
o3 = ols(dd.sent, dd[["launch", "fail"]]); res["ols_sent"] = fmt(o3); res["ols_sent"]["R2"] = round(o3.rsquared, 3)
res["granger_sent_to_launch"] = granger(dd.launch.diff().dropna(), dd.sent)
res["granger_launch_to_sent"] = granger(dd.sent, dd.launch.diff())
# event windows: Welch t-test window vs baseline
ev_rows = []
for _, r in HEV[HEV.c == "US"].iterrows():
    if r.wn >= 5 and r.bn >= 5:
        t = (r.wm - r.bm) / np.sqrt(r.wsd ** 2 / r.wn + r.bsd ** 2 / r.bn)
        dof = (r.wsd ** 2 / r.wn + r.bsd ** 2 / r.bn) ** 2 / ((r.wsd ** 2 / r.wn) ** 2 / (r.wn - 1) + (r.bsd ** 2 / r.bn) ** 2 / (r.bn - 1))
        p = 2 * stats.t.sf(abs(t), dof)
    else:
        t, p = np.nan, np.nan
    ev_rows.append(dict(date=r.date, label=r.label, wn=int(r.wn), wm=r.wm, bm=r.bm, diff=round(r.wm - r.bm, 4), t=round(t, 2), p=round(p, 3),
                        vol_ratio=round(r.wr / r.br, 2) if r.br else None, wneg=r.wneg, bneg=r.bneg))
res["hn_events"] = ev_rows

# ---------- policy ----------
def btopic(t):
    if re.search(r"appropriation|continuing|authorization act for fiscal|reconciliation|shutdown|consolidated|lower costs|emergency assistance|making appropriations", t, re.I): return "omnibus"
    if re.search(r"^(a )?resolution|commemorat|honoring|recogniz|celebrat|coin act|gold medal|national .* day|day act|anniversary|designat", t, re.I): return "commemorative"
    if re.search(r"commercial|private|industr|market|econom|enterprise|competitiveness|space commerce|space resource|remote sensing|broadband|connectivity|supplemental coverage|streamlining|licens|investment|start-?up", t, re.I) and not re.search(r"Commerce, Justice|Commerce Spectrum|Bioeconomy|in the Americas|Innovation and Competitiveness", t): return "commercial"
    if re.search(r"debris|ORBITS|SAFE Orbit|situational awareness|space traffic|orbital", t, re.I): return "sustainability"
    if re.search(r"defense|missile|security|space launch policy|space assets|intelligence|space force|space command|national guard|aerospace defense|IRONDOME|UAP|Iran|North Korea|Russia|sanction|timing|positioning|GPS|protection|cyber|telecommunications|Middle East|Israel|Ukraine|Asia-Pacific|Americas|arms control|nuclear|RENACER|global leadership|ballistic|neighbors", t, re.I): return "security"
    if re.search(r"NASA|National Aeronautics|exploration|human spaceflight|moon|lunar|mars|apollo|artemis|space station|telescope|astronaut|science|space grant|hubble|pluto|shuttle|asteroid|weather|research|space center|innovation|engineering biology|bioeconomy|COMPETES|competition|endless frontier|aeronautics|INSPIRE|women|title 51|celestial|space leadership|leadership in space|test facility|PROSWIFT|evapotranspiration|forecasting|renaissance|settlement|MANIFEST|space act|SPACE Act|SOARS|PLUTO|REAL Space|efficient space", t, re.I): return "exploration_science"
    return "other"
B["topic"] = B.title.map(btopic)
ct = B.groupby(["c", "topic"]).size().unstack(fill_value=0)
ct["total"] = ct.sum(axis=1); ct["all_bills"] = pd.Series(TOT)
ct["per_1000"] = (ct.total / ct.all_bills * 1000).round(2)
ct["com_share"] = (ct.commercial / ct.total).round(3)
ct["substantive"] = ct.total - ct.omnibus - ct.commemorative
ct["com_share_subst"] = (ct.commercial / ct.substantive).round(3)
res["bills_by_congress"] = ct.reset_index().to_dict("records")
pre = ct.loc[113:115]; post = ct.loc[117:119]
res["bills_com_share_eras"] = dict(pre_113_115=round(pre.commercial.sum() / pre.total.sum(), 3), post_117_119=round(post.commercial.sum() / post.total.sum(), 3),
                                   pre_n=int(pre.commercial.sum()), pre_tot=int(pre.total.sum()), post_n=int(post.commercial.sum()), post_tot=int(post.total.sum()))
fe = stats.fisher_exact([[pre.commercial.sum(), pre.total.sum() - pre.commercial.sum()], [post.commercial.sum(), post.total.sum() - post.commercial.sum()]])
res["bills_fisher_p"] = round(fe[1], 3)
res["bills_other"] = B[B.topic == "other"].title.tolist()
FRY["com_share"] = (FRY.com / FRY.n).round(3)
fr = FRY.join(FRA).join(ann[["launches"]])
r, p = stats.spearmanr(fr.loc[2016:2025].n, fr.loc[2016:2025].launches); res["fr_vs_launch"] = dict(rho=round(r, 3), p=round(p, 3))
r, p = stats.spearmanr(fr.loc[2016:2025].FCC, fr.loc[2016:2025].launches); res["fcc_vs_launch"] = dict(rho=round(r, 3), p=round(p, 3))
res["fr_era"] = dict(mean_2014_2021=round(FRY.loc[2014:2021].n.mean(), 1), mean_2022_2024=round(FRY.loc[2022:2024].n.mean(), 1))
# capacity
res["payloads"] = dict(starlink_share_2016_2025=round(PLy.loc[2016:2025].starlink.sum() / PLy.loc[2016:2025].sum().sum(), 3),
                       non_starlink_com_2016_19=int(PLy.loc[2016:2019].com.sum()), non_starlink_com_2022_25=int(PLy.loc[2022:2025].com.sum()))
res["faa_ops"] = FAA_OPS
r, p = stats.spearmanr(list(FAA_OPS.values()), [int(L.n[[m for m in L.index if m.year==y]].sum()) for y in FAA_OPS]); res["faa_vs_gcat"] = dict(rho=round(r, 3), p=round(p, 4))
res["sec"] = SEC.reset_index().to_dict("records")
r, p = stats.spearmanr(SEC.loc[2016:2025].spaceecon, ann.loc[2016:2025].launches); res["sec_vs_launch"] = dict(rho=round(r, 3), p=round(p, 3))
r, p = stats.spearmanr(SEC.loc[2016:2025].leo10k, ann.loc[2016:2025].launches); res["leo_vs_launch"] = dict(rho=round(r, 3), p=round(p, 4))

# ---------- export ----------
# ---------- Wikipedia readership and lead-lag by attention source ----------
if USE_WIKI:
    wy = W.groupby(W.index.year).mean(); Ly = launch_m.groupby(launch_m.index.year).sum()
    wiki_rho = {}
    for a_ in ["NASA", "United_States_Space_Force", "SpaceX", "Starlink", "Blue_Origin", "Rocket_Lab", "SpaceX_Starship"]:
        m_ = pd.concat([wy[a_], Ly], axis=1).loc[2016:2025].dropna()
        if len(m_) >= 6: r_, p_ = stats.spearmanr(m_.iloc[:, 0], m_.iloc[:, 1]); wiki_rho[a_] = dict(rho=round(r_, 3), p=round(p_, 4), n=len(m_))
    res["wiki_vs_launch"] = wiki_rho
    res["wiki_per_million"] = {a_: {int(y_): round(float(v_), 2) for y_, v_ in wy[a_].dropna().items()} for a_ in W.columns}
    res["wiki_total_bn"] = {int(y_): round(float(v_) / 1e9, 2) for y_, v_ in WTOT.groupby(WTOT.index.year).mean().items()}
    src_g = {}
    for nm, pre in [("search", "GT"), ("hackernews", "HN"), ("wikipedia", "Wiki")]:
        sub = NAIZ[[c for c in NAIZ if c.startswith(pre)]].mean(axis=1).diff()
        dd = pd.concat([sub.rename("a"), M.excess.reindex(IDX).rename("e")], axis=1).loc["2021-09":].dropna()
        src_g[nm] = dict(ret_to_att=granger(dd.a, dd.e), att_to_ret=granger(dd.e, dd.a))
    res["granger_by_source"] = src_g
    nw = json.load(open("/home/claude/analysis_us/us_noWiki.json"))["stats"]
    res["robust_noWiki"] = {k: nw[k] for k in ["annual_spearman", "granger_ret_to_NAI", "granger_NAI_to_ret", "ols_NAI_trend", "ols_PAI", "ols_NAI"]}

def ser(s, nd=3):
    s = s.dropna(); return dict(x=[str(i) for i in s.index], y=[round(float(v), nd) for v in s.values])
out = dict(PAI=ser(PAI), NAI=ser(NAI), PAIZ={c: ser(PAIZ[c]) for c in PAIZ}, NAIZ={c: ser(NAIZ[c]) for c in NAIZ},
           launches=ser(launch_m, 0), fails=ser(fail_m, 0),
           annual=ann.reset_index().rename(columns={"index": "year"}).round(4).replace({np.nan: None}).to_dict("records"),
           failures=launch_failures(),
           excess=ser(M.excess, 4), n_members=ser(M.n, 0), spcx=ser(M.spcx, 4), ufo_excess=ser(M.ufo_excess, 4),
           cum_excess=ser(M.excess.loc["2021-09":].cumsum(), 4), cum_ufo=ser(M.ufo_excess.loc["2019-05":].cumsum(), 4),
           events=EV.replace({np.nan: None}).to_dict("records"), windows=WIN,
           hn_us=dict(x=[str(i) for i in hs.index], n=[int(v) for v in hs.n.fillna(0)], ns=[int(v) for v in hs.ns.fillna(0)], nn=[int(v) for v in hs.nn.fillna(0)],
                      mean=[None if pd.isna(v) else round(float(v), 4) for v in hs["mean"]], neg=[None if pd.isna(v) else round(float(v), 4) for v in hs.neg]),
           hn_in=dict(x=[str(i) for i in hi.index], n=[int(v) for v in hi.n]),
           hn_tops=HTOP.to_dict("records"),
           bills=B.to_dict("records"), fr=fr.reset_index().rename(columns={"index": "year"}).replace({np.nan: None}).to_dict("records"), fr_sel=FRS,
           gt=ser(T["Starlink"], 0), wiki=({a_: ser(W[a_].dropna(), 3) for a_ in W.columns} if USE_WIKI else {}), stats=res)
json.dump(json.loads(json.dumps(out, default=lambda o: o.item() if hasattr(o, "item") else str(o))), open("/home/claude/analysis_us/" + ("us.json" if USE_WIKI else "us_noWiki.json"), "w"))
print(json.dumps({k: v for k, v in res.items() if k not in ("bills_by_congress", "bills_other", "sec")}, indent=1, default=str))
print(ct)
print("OTHER:", res["bills_other"])
print(ann)
