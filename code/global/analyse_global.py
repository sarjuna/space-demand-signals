"""Global LEO satellite filings at the ITU: aggregates by notifying administration, mapped to countries.
Reads data/raw/global/itu_leo_filings.txt and code/global/itu_iso.json; writes data/derived/global/global.json and data/csv/global/*.csv."""
import json, sys
from pathlib import Path
import pandas as pd
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

RAW = ROOT / "data/raw/global/itu_leo_filings.txt"
DER = ROOT / "data/derived/global"; DER.mkdir(parents=True, exist_ok=True)
OUT = CSV / "global"; OUT.mkdir(parents=True, exist_ok=True)
ISO = json.load(open(ROOT / "code/global/itu_iso.json"))
SHORT = {"KOR": "South Korea", "IRN": "Iran", "RUS": "Russia", "VNM": "Vietnam", "TZA": "Tanzania", "MDA": "Moldova", "VEN": "Venezuela",
         "GBR": "United Kingdom", "CZE": "Czechia", "TUR": "Türkiye", "USA": "United States", "NLD": "Netherlands"}

sect, rows = None, {"ADM": [], "YEAR": [], "TOP": [], "RWANDA_OTHER": []}
for l in open(RAW, encoding="utf-8"):
    l = l.rstrip("\n")
    if l.startswith("#ADM"): sect = "ADM"; continue
    if l.startswith("#YEAR"): sect = "YEAR"; continue
    if l.startswith("#TOP"): sect = "TOP"; continue
    if l.startswith("#RWANDA_OTHER"): sect = "RWANDA_OTHER"; continue
    if l.startswith("#TOTALS"): totals = l; continue
    if l.startswith("#") or not l.strip(): continue
    rows[sect].append(l.split("|"))
A = pd.DataFrame(rows["ADM"], columns="adm itu_name filings A C N other org_filings rcv_le2015 rcv_2016_19 rcv_2020_22 rcv_2023_26 networks satellites nets_ge100 nets_ge1000".split())
for c in A.columns[2:]: A[c] = A[c].astype(int)
A["iso3"] = A.adm.map(lambda a: ISO[a][0]); A["iso_num"] = A.adm.map(lambda a: ISO[a][1])
A["country"] = A.apply(lambda r: SHORT.get(r.iso3, ISO[r.adm][2]), axis=1)
Y = pd.DataFrame(rows["YEAR"], columns=["year", "A", "C", "N", "other"]).astype(int)
T = pd.DataFrame(rows["TOP"], columns=["adm", "network", "org", "stages", "satellites", "first_receipt"]); T["satellites"] = T.satellites.astype(int)
T["country"] = T.adm.map(lambda a: SHORT.get(ISO[a][0], ISO[a][2]))

tot_f, tot_s, tot_n = int(A.filings.sum()), int(A.satellites.sum()), int(A.networks.sum())
assert (tot_f, tot_n, tot_s) == (3023, 2324, 2529091), (tot_f, tot_n, tot_s)
assert int(Y[["A", "C", "N", "other"]].sum().sum()) == tot_f
As = A.sort_values("filings", ascending=False)
share = lambda col, k: round(100 * As.sort_values(col, ascending=False)[col].head(k).sum() / A[col].sum(), 1)
hhi = lambda col: round(float(((A[col] / A[col].sum()) ** 2).sum()), 3)
recent = int(A.rcv_2023_26.sum())
S = dict(filings=tot_f, networks=tot_n, satellites=tot_s, countries=len(A),
         top2_filings_share=share("filings", 2), top5_filings_share=share("filings", 5), hhi_filings=hhi("filings"),
         top3_sat_share=share("satellites", 3), hhi_sats=hhi("satellites"),
         recent_share=round(100 * recent / tot_f, 1), recent=recent,
         stage=dict(A=int(A.A.sum()), C=int(A.C.sum()), N=int(A.N.sum()), other=int(A.other.sum())),
         one_filing=int((A.filings == 1).sum()), ten_plus=int((A.filings >= 10).sum()),
         nets_ge1000=int(A.nets_ge1000.sum()), nets_ge100=int(A.nets_ge100.sum()),
         y2017=int(Y[Y.year == 2017][["A", "C", "N", "other"]].sum(axis=1).iloc[0]), y2025=int(Y[Y.year == 2025][["A", "C", "N", "other"]].sum(axis=1).iloc[0]))
# Rwanda: cautious count. Networks that look like versions of the same constellation (same name stem, or the same satellite
# number and similar orbits) are counted once at their largest filing; the seven numbered shells INGAGI-1 ... INZOVU-7
# (apogees rising from 563 to 641 km) are treated as layers of one system and added. This grouping is a judgement, not ITU data.
rw = {r[1]: int(r[4]) for r in rows["TOP"] if r[0] == "RRW"}; rw.update({r[0]: int(r[1]) for r in rows["RWANDA_OTHER"]})
assert sum(rw.values()) == int(A.loc[A.adm == "RRW", "satellites"].iloc[0]) and len(rw) == int(A.loc[A.adm == "RRW", "networks"].iloc[0])
FAM = {"CINNAMON": ["CINNAMON-937", "CINNAMON-217"], "GUHUZA/ANTON": ["GUHUZA-1", "GUHUZA-2", "GUHUZA-1A", "ANTON-1N0"],
       "UMUTEKANO": ["UMUTEKANO", "UMUTEKANO-2", "UMUTEKANO-3", "UMUTEKANO API-1"], "SKY-G": ["SKY-G1", "SKY-G2", "SKY-G3"], "MARVEL-X": ["MARVEL-X", "MARVEL-X TTC"]}
SHELLS = ["INGAGI-1", "IMBOGO-2", "UMUSAMBI-3", "AGACA-4", "INTARE-5", "INGWE-6", "INZOVU-7"]
assert sorted(sum(FAM.values(), []) + SHELLS) == sorted(rw)
fam = {k: max(rw[n] for n in v) for k, v in FAM.items()}; fam["Seven shells"] = sum(rw[n] for n in SHELLS)
S["rwanda"] = dict(upper=sum(rw.values()), cautious=sum(fam.values()), families=fam, networks=len(rw))

# countries with the largest satellite totals relative to their filings ("paper" constellations)
A["sats_per_network"] = (A.satellites / A.networks).round(1)
S["rank_filings"] = {r.iso3: i + 1 for i, r in enumerate(As.itertuples())}

geo = json.load(open(ROOT / "data/geo/world-atlas-2.0.2-countries-50m.json"))
out = dict(stats=S, countries=A.drop(columns=["itu_name"]).to_dict(orient="records"), years=Y.to_dict(orient="records"),
           top=T.to_dict(orient="records"), geo=geo, pulled="13 Nov 2026", ific="BR IFIC No 3084 (10.11.2026)")
json.dump(out, open(DER / "global.json", "w"), separators=(",", ":"), ensure_ascii=False)
A[["adm", "itu_name", "iso3", "country", "filings", "A", "C", "N", "other", "org_filings", "rcv_le2015", "rcv_2016_19", "rcv_2020_22", "rcv_2023_26",
   "networks", "satellites", "nets_ge100", "nets_ge1000"]].rename(columns={"A": "filings_api", "C": "filings_coordination", "N": "filings_notification", "other": "filings_other"}) \
    .to_csv(OUT / "global_leo_filings_by_country.csv", index=False)
Y.rename(columns={"A": "api", "C": "coordination", "N": "notification"}).to_csv(OUT / "global_leo_filings_by_year.csv", index=False)
T.to_csv(OUT / "global_largest_leo_filings.csv", index=False)
fam_of = {n: k for k, v in FAM.items() for n in v}; fam_of.update({n: "Seven shells" for n in SHELLS})
pd.DataFrame([dict(network=n, satellites=v, family_for_cautious_count=fam_of[n]) for n, v in sorted(rw.items(), key=lambda x: -x[1])]).to_csv(OUT / "global_rwanda_networks.csv", index=False)
print(json.dumps(S, indent=1)[:2500])
