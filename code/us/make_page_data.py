"""Build data/derived/us/us_page.json (the data embedded in us.html) from us.json plus raw tables."""
import json, re
from load_us import *

U = json.load(open(DER_US / "us.json"))
y, a, sel = fedreg()
# Policy timeline: drop Federal Register items that mention space only incidentally
# (marine-mammal take permits near launch sites, airspace restrictions, proclamations, fee schedules, unrelated delegations).
INCIDENTAL = r"Marine Mammals|Wright Brothers Day|Stonewall|Military Decorations|Restricted Area|Defense Production Act|Flag Day|Small Modular Reactors|Regulatory Fees"
U["fr_sel"] = [r for r in sel if not re.search(INCIDENTAL, r["title"])]
U["bills_com"] = [dict(c=b["c"], bill=b["bill"], title=b["title"]) for b in U["bills"] if b["topic"] == "commercial"]
U["bills_by_congress"] = U["stats"]["bills_by_congress"]
U["faa"] = {str(k): v for k, v in FAA_OPS.items()}
U["sec"] = [dict(year=int(i), leo10k=int(r.leo10k), spaceecon=int(r.spaceecon)) for i, r in sec().iterrows()]
_c = contracts(); _A = _c[_c.agency == "All"].set_index("firm").drop(columns="agency")
_yrs = list(_A.columns)
U["contracts"] = dict(
    fy=[y[2:] for y in _yrs],
    spacex=[int(_A.loc["SpaceX", y]) for y in _yrs],
    blue=[int(_A.loc["Blue Origin", y]) for y in _yrs],
    others=[int(_A.drop(index=["SpaceX", "Blue Origin"])[y].sum()) for y in _yrs],
    total=[int(_A[y].sum()) for y in _yrs],
    nfirms_1m=[int((_A[y] >= 1).sum()) for y in _yrs],
    n=len(_A),
    spacex_nasa={y[2:]: int(_c[(_c.firm == "SpaceX") & (_c.agency == "NASA")][y].iloc[0]) for y in _yrs},
    spacex_dod={y[2:]: int(_c[(_c.firm == "SpaceX") & (_c.agency == "DoD")][y].iloc[0]) for y in _yrs},
    top=[[f, int(v)] for f, v in _A.sum(axis=1).sort_values(ascending=False).head(8).items()])
del U["bills"]
json.dump(U, open(DER_US / "us_page.json", "w"), separators=(",", ":"))
print("us_page.json:", len(U["fr_sel"]), "policy items,", len(U["bills_com"]), "commercial bills")
