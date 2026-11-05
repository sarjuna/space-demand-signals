import pandas as pd, json
rows=[l.strip().split("|") for l in open("/home/claude/data/lok_sabha_space_questions.txt") if l[:2] in ("16","17","18") and "/" in l.split("|")[0]]
cols="session|first_date|last_date|all_q|space_q|newspace|policy|sustain_security|international|exploration_hsf|launch_infra|applications|budget_workforce|general".split("|")
df=pd.DataFrame(rows,columns=cols)
for c in cols[3:]: df[c]=df[c].astype(int)
df["date"]=pd.to_datetime(df.first_date)
df["year"]=df.date.dt.year
assert df.space_q.sum()==602, df.space_q.sum()
assert (df[cols[5:]].sum(axis=1)==df.space_q).all()
df["space_per_1000"]=df.space_q/df.all_q*1000
df["ns_share"]=df.newspace/df.space_q
y=df.groupby("year")[cols[3:]].sum()
y["ns_share"]=y.newspace/y.space_q; y["space_per_1000"]=y.space_q/y.all_q*1000
def era(d):
    return "2014–Jun 2020 (pre-reform)" if d<pd.Timestamp("2020-06-24") else ("Sep 2020–2023" if d<pd.Timestamp("2024-01-01") else "2024–2026")
df["era"]=df.date.map(era)
e=df.groupby("era",sort=False)[cols[4:]].sum()
e["ns_share"]=e.newspace/e.space_q
print(y.round(3)); print(e.round(3))
from scipy.stats import fisher_exact
a=e.loc["2014–Jun 2020 (pre-reform)"]; b=e.loc["2024–2026"]
print(fisher_exact([[a.newspace,a.space_q-a.newspace],[b.newspace,b.space_q-b.newspace]]))
json.dump(dict(sessions=df.assign(date=df.date.dt.strftime("%Y-%m-%d")).drop(columns=["first_date","last_date"]).to_dict("records"),
               years=y.reset_index().to_dict("records"), eras=e.reset_index().to_dict("records")), open("parl.json","w"), default=float)
