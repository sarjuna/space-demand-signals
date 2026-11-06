import re, pandas as pd, numpy as np
D = "/home/claude/data_us/"
IDX = pd.period_range("2016-01", "2026-10", freq="M")

def P(s):
    return pd.Period(s, "M")

def launches():
    rows = [l.split() for l in open(D + "gcat_us_launches_monthly.txt") if re.match(r"^\d{4}-\d\d ", l)]
    df = pd.DataFrame(rows, columns=["m", "n", "fail", "spx", "oth", "gov", "rlnz"]).set_index("m")
    df.index = [P(x) for x in df.index]
    return df.astype(int)

def launch_failures():
    out = []
    for l in open(D + "gcat_us_launches_monthly.txt"):
        if re.match(r"^\d{4} [A-Z][a-z]{2} ", l):
            d, lv, fid, mis, ag, code = l.strip().split("|")
            out.append(dict(date=pd.to_datetime(d, format="%Y %b %d").strftime("%Y-%m-%d"), lv=lv, flight=fid, mission=mis, agency=ag))
    return out

def payloads():
    rows = [l.split() for l in open(D + "gcat_us_payloads_monthly.txt") if re.match(r"^\d{4}-\d\d ", l)]
    df = pd.DataFrame(rows, columns=["m", "starlink", "com", "gov", "oth"]).set_index("m")
    df.index = [P(x) for x in df.index]
    return df.astype(int)

def trends():
    out = {}
    for l in open(D + "gtrends_us.txt"):
        if l.startswith("#") or "|" not in l: continue
        a, s, v = l.strip().split("|")
        v = [float(x) for x in v.split(",")]
        out[a] = pd.Series(v, index=pd.period_range(P(s[:4] + "-" + s[4:]), periods=len(v), freq="M"))
    return pd.DataFrame(out)

def markets():
    mon, ev, win = [], [], {}
    cur = None
    for l in open(D + "us_markets.txt"):
        l = l.rstrip("\n")
        if re.match(r"^\d{4}-\d\d \d", l):
            mon.append(l.split())
        elif re.match(r"^\d{4}-\d\d-\d\d\|", l):
            ev.append(l.split("|"))
        elif l.startswith("# IFT-5") or l.startswith("# SPACEX-IPO") or l.startswith("# ARTEMIS-II"):
            cur = l[2:].split()[0]; win[cur] = []
        elif cur and re.match(r"^-?\d+ \d{4}-", l):
            k, d, ar, n = l.split(); win[cur].append(dict(k=int(k), date=d, ar=float(ar), n=int(n)))
    m = pd.DataFrame(mon, columns=["m", "n", "basket", "sp", "ufo", "spcx"]).set_index("m")
    m.index = [P(x) for x in m.index]
    m = m.replace("NA", np.nan).astype(float)
    m["excess"] = m.basket - m.sp
    m["ufo_excess"] = m.ufo - m.sp
    cols = "t0req label excl b_t0 b_n b_c01 b_t01 b_c05 b_t05 b_pre b_sd u_t0 u_n u_c01 u_t01 u_c05 u_t05 u_pre u_sd".split()
    e = pd.DataFrame(ev, columns=cols)
    for c in cols[4:]:
        if c not in ("u_t0",): e[c] = pd.to_numeric(e[c], errors="coerce")
    return m, e, win

def hn():
    rows, ev, tops = [], [], []
    for l in open(D + "hackernews_space.txt"):
        p = l.rstrip("\n").split("|")
        if p[0] in ("US", "IN") and len(p) == 11: rows.append(p)
        elif p[0] in ("US", "IN") and len(p) == 13: ev.append(p)
        elif p[0] in ("US", "IN") and len(p) == 6: tops.append(p)
    df = pd.DataFrame(rows, columns="c m n ns nn mean ms mn neg pos pts".split())
    df = df.replace("NA", np.nan)
    for c in "n ns nn mean ms mn neg pos pts".split(): df[c] = pd.to_numeric(df[c])
    df["m"] = [P(x) for x in df.m]
    e = pd.DataFrame(ev, columns="c date label wn wm wsd wneg bn bm bsd bneg wr br".split()).replace("NA", np.nan)
    for c in "wn wm wsd wneg bn bm bsd bneg wr br".split(): e[c] = pd.to_numeric(e[c])
    t = pd.DataFrame(tops, columns="c event date pts s title".split())
    return df, e, t

def bills():
    tot, rows = {}, []
    for l in open(D + "congress_space_bills.txt"):
        p = l.rstrip("\n").split("|")
        if len(p) == 2 and p[0].isdigit(): tot[int(p[0])] = int(p[1])
        elif len(p) == 5 and p[0].isdigit(): rows.append(dict(c=int(p[0]), bill=p[1], intro=p[2], tags=p[3], title=p[4]))
    return tot, pd.DataFrame(rows)

def fedreg():
    yr, ag, sel = [], [], []
    sect = None
    for l in open(D + "federal_register_space.txt"):
        if l.startswith("# YEAR"): sect = "y"; continue
        if l.startswith("# AGENCY-YEAR"): sect = "a"; continue
        if l.startswith("# SELECTED"): sect = "s"; continue
        if l.startswith("#"): continue
        p = l.rstrip("\n").split("|")
        if sect == "y": yr.append([int(x) for x in p])
        elif sect == "a": ag.append([int(x) for x in p])
        elif sect == "s": sel.append(dict(date=p[0], type=p[1], agency=p[2], title=p[3]))
    y = pd.DataFrame(yr, columns="year n com rule prop notice pres".split()).set_index("year")
    a = pd.DataFrame(ag, columns="year FAA FCC BIS NOAA NASA PHMSA".split()).set_index("year")
    return y, a, sel

def sec():
    rows = [l.strip().split("|") for l in open(D + "sec_edgar_fts.txt") if re.match(r"^\d{4}\|", l)]
    return pd.DataFrame(rows, columns=["year", "leo10k", "spaceecon"]).astype(int).set_index("year")

FAA_OPS = {2015: 14, 2016: 17, 2017: 22, 2018: 35, 2019: 32, 2020: 33, 2021: 64, 2022: 74, 2023: 113, 2024: 148}

def wiki():
    """Monthly en.wikipedia user views per million total views. Months before a title first reaches 1,000 views
    (redirect placeholders or stubs, e.g. United_States_Space_Force before Dec 2018) are treated as missing."""
    out = {}
    for l in open(D + "wiki_pageviews_us.txt"):
        if l.startswith("#"): continue
        a, s, v = l.strip().split("|"); v = [float(x) for x in v.split(",")]
        out[a] = pd.Series(v, index=pd.period_range(P(s[:4] + "-" + s[4:]), periods=len(v), freq="M"))
    tot = out.pop("TOTAL"); W = {}
    for a, x in out.items():
        first = x[x >= 1000].index.min(); x = x[x.index >= first]
        W[a] = x / tot.reindex(x.index) * 1e6
    return pd.DataFrame(W).reindex(IDX), tot
