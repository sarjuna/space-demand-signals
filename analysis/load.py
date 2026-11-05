import re, pandas as pd, numpy as np
D = "/home/claude/data/"

def months(start, n):
    return pd.period_range(pd.Period(f"{start[:4]}-{start[4:]}", "M"), periods=n, freq="M")

def read_series_file(path):
    out = {}
    for l in open(path):
        if l.startswith("#") or "|" not in l: continue
        a, s, v = l.strip().split("|")
        v = [float(x) for x in v.split(",")]
        out[a] = pd.Series(v, index=months(s, len(v)))
    return pd.DataFrame(out)

def wiki():
    w = read_series_file(D + "wiki_pageviews.txt")
    w["ISRO_all"] = w["Indian_Space_Research_Organisation"].fillna(0) + w["ISRO"].fillna(0)  # article moved Jun-2023
    return w

def trends():
    return read_series_file(D + "gtrends_india.txt")

def launches():
    rows = []
    for l in open(D + "gcat_india_launches.txt"):
        if l.startswith("#"): continue
        d, lv, fid, mis, ag, code, cat, site = l.strip().split("|")
        rows.append(dict(date=pd.to_datetime(d, format="%Y %b %d"), lv=lv, flight=fid, mission=mis,
                         agency=ag, code=code, site=site,
                         orbital=code[:1] in "OD" and code[:2] in ("OS", "OF", "DS"),
                         success=code[:2] in ("OS", "DS"),
                         private=ag.startswith("SKYR")))
    return pd.DataFrame(rows)

def payloads():
    rows = []
    for l in open(D + "gcat_india_payloads.txt"):
        if l.startswith("#"): continue
        p = l.strip().split("|")
        if len(p) == 5:
            rows.append(dict(date=pd.to_datetime(re.sub(r"\s+", " ", p[0]), format="%Y %b %d"), name=p[1], owner=p[2], cls=p[4]))
    return pd.DataFrame(rows)

def basket():
    rows = [l.split() for l in open(D + "basket_raw.txt") if re.match(r"^\d{6} ", l)]
    df = pd.DataFrame(rows, columns=["lab", "n", "rb", "rn"])
    # Yahoo label is IST-midnight shown in UTC -> actual month = label + 1
    df["month"] = [pd.Period(f"{x[:4]}-{x[4:]}", "M") + 1 for x in df.lab]
    df = df.set_index("month")[["n", "rb", "rn"]].apply(pd.to_numeric, errors="coerce")
    df = df[df.index <= pd.Period("2026-10", "M")]   # drop partial Nov-2026
    df["excess"] = df.rb - df.rn
    return df
