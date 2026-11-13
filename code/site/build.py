"""Assemble the multi-page site. Writes two variants:
   out_gh/       GitHub Pages: every page a full HTML document
   out_art/      Artifact: index.html without the document skeleton (the host adds it), other pages full documents
"""
import json, math, os, re, shutil, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from paths import *

ART = Path(sys.argv[1]) if len(sys.argv) > 1 else None   # optional: also write a claude.ai artifact variant here
CHART = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>'
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">')
LOGO = ('<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.2" fill="var(--accent)"/>'
        '<ellipse cx="10" cy="10" rx="8.6" ry="3.6" fill="none" stroke="var(--ink-2)" stroke-width="1.3" transform="rotate(-28 10 10)"/></svg>')
PAGES = [("index.html", "Overview"), ("india.html", "India"), ("us.html", "United States"), ("quantum.html", "Quantum (comparison)"), ("methods.html", "Methods &amp; data")]


def nav(cur):
    links = "".join(f'<a href="{h}"{" aria-current=\"page\"" if h == cur else ""}>{t}</a>' for h, t in PAGES)
    return (f'<nav class="sitebar" aria-label="Site"><div class="sitebar-in"><a class="brand" href="index.html">{LOGO}Space Demand Signals</a>'
            f'<div class="sitenav">{links}</div></div></nav>')


def head(title, desc):
    return (f'<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f'<meta name="description" content="{desc}">\n'
            '<style>html{color-scheme:light}body{margin:0;font-size:14px}img{max-width:100%}[hidden]{display:none!important}</style>\n'
            f'<title>{title}</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n{FONTS}\n'
            '<link rel="stylesheet" href="assets/site.css">')


def page(fname, title, desc, body, scripts, full=True):
    inner = f"{nav(fname)}\n{body}\n{scripts}"
    if full:
        return f'<!doctype html>\n<html lang="en">\n<head>\n{head(title, desc)}\n</head>\n<body>\n{inner}\n</body>\n</html>\n'
    return f'{head(title, desc)}\n{inner}\n'


def data_tag(obj):
    return '<script id="data" type="application/json">' + json.dumps(obj, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/") + "</script>"


# ---------- US ----------
U = json.load(open(DER_US / "us_page.json"))
us_body = open(SITE_SRC / "us_body.html").read()
us_js = open(SITE_SRC / "us_script.js").read()
us_scripts = f'{data_tag(U)}\n{CHART}\n<script src="assets/charts.js"></script>\n<script>\n{us_js}\n</script>'

# ---------- India (ported from the standalone dashboard) ----------
IN = json.load(open(DER_IN / "dash.json"))
in_body = open(SITE_SRC / "india_body.html").read()
in_body = in_body.replace("<h1>India Space Demand Signals</h1>", "<h1>India</h1>")
in_body = re.sub(r"<footer>.*?</footer>", "<footer>Dr Arjuna Sathiaseelan · Space Economy Initiative, Centre for India and Global Business, Cambridge Judge Business School · Data pulled on 5 Nov 2026</footer>", in_body, flags=re.S)
in_js = open(SITE_SRC / "india_script.js").read()
in_js = in_js.replace(".concat([['Millennium Post: Financing India\\'s space future','https://www.millenniumpost.in/opinion/financing-indias-space-future-674267']])", "")
assert "millenniumpost" not in in_js
in_scripts = f'{data_tag(IN)}\n{CHART}\n<script>\n{in_js}\n</script>'

# ---------- Overview ----------
lt = IN["launch_table"]
in_annual = []
for y in range(2016, 2027):
    rows = [r for r in lt if r["date"].startswith(str(y))]
    in_annual.append(dict(year=y, launches=len(rows), fails=sum(not r["success"] for r in rows)))
us_annual = [dict(year=a["year"], launches=a["launches"], fails=a["fails"]) for a in U["annual"]]
ipo = next(e for e in U["events"] if e["label"].startswith("SpaceX IPO"))
O = dict(in_annual=in_annual, us_annual=us_annual,
         in_total=sum(a["launches"] for a in in_annual if a["year"] < 2026),
         us_total=sum(a["launches"] for a in us_annual if a["year"] < 2026),
         hn_in=U["stats"]["hn_in_total"], hn_us=U["stats"]["hn_us_total"],
         in_r2=round(IN["stats"]["monthly_PAI_ols"]["R2_launches_only"] * 100),
         ipo_c=f'{math.floor(abs(ipo["b_c01"])*10+0.5)/10:.1f}', ipo_t=f'{ipo["b_t01"]:.2f}'.replace("-", "−"))
O["idx"] = json.load(open(ROOT / "data/derived/index/index_page.json"))
O["pulled"] = "5–6 Nov 2026"
O["var"] = json.load(open(ROOT / "data/derived/var/var_results.json"))
ov_scripts = f'{data_tag(O)}\n{CHART}\n<script src="assets/charts.js"></script>\n<script>\n{open(SITE_SRC / "overview_script.js").read()}\n</script>'

# ---------- Quantum comparison ----------
Qd = json.load(open(ROOT / "data/derived/quantum/quantum.json"))
_ct = U["contracts"]; _sh = [round(100 * s / t) for s, t in zip(_ct["spacex"][:-1], _ct["total"][:-1])]   # complete fiscal years only
_a25 = next(a for a in U["annual"] if a["year"] == 2025)
Qd["space"] = dict(flag=U["stats"]["ols_PAI"]["flagship"], nai_trend=U["stats"]["ols_NAI_trend"]["launches"], granger=U["stats"]["granger_ret_to_NAI"],
                   spacex_2025=_a25["spacex"], launches_2025=_a25["launches"], ct_share_min=min(_sh), ct_share_max=max(_sh),
                   ct_spacex_total=next(v for f, v in _ct["top"] if f == "SpaceX"), ipo_c=ipo["b_c01"], ipo_t=ipo["b_t01"])
q_scripts = f'{data_tag(Qd)}\n{CHART}\n<script src="assets/charts.js"></script>\n<script>\n{open(SITE_SRC / "quantum_script.js").read()}\n</script>'

RB = {c: O["idx"][c]["robustness"] for c in ("india", "us")}
methods_body = open(SITE_SRC / "methods_body.html").read()
for k, v in {"IN_G": f'r = {RB["india"]["r_google"]:.2f}', "US_G": f'r = {RB["us"]["r_google"]:.2f}', "IN_W": f'r = {RB["india"]["r_wiki"]:.2f}',
             "US_W": f'r = {RB["us"]["r_wiki"]:.2f}', "IN_L": f'{RB["india"]["loo_max_abs_diff"]:.1f}', "US_L": f'{RB["us"]["loo_max_abs_diff"]:.1f}'}.items():
    methods_body = methods_body.replace("{{" + k + "}}", v)
assert "{{" not in methods_body
DEF = {
    "index.html": ("Space Demand Signals", "Do attention, sentiment, markets and policy track the real space build-out? India and US compared on public data.",
                   open(SITE_SRC / "overview_body.html").read(), ov_scripts),
    "india.html": ("India · Space Demand Signals", "India: does public, investor and parliamentary discourse track launches, commercial satellites and private capital?", in_body, in_scripts),
    "us.html": ("United States · Space Demand Signals", "United States: do attention, sentiment, NewSpace stock prices and federal policy track launches, satellites and licensed operations?", us_body, us_scripts),
    "quantum.html": ("Quantum computing · Space Demand Signals", "Comparison case: does public attention to quantum computing track its commercial build-out, and do the space-sector patterns recur?",
                     open(SITE_SRC / "quantum_body.html").read(), q_scripts),
    "methods.html": ("Methods · Space Demand Signals", "Sources, methods, verification and limitations for the India and US space demand-signal dashboards.",
                     methods_body, ""),
}

for d, art in ((ROOT, False), (ART, True)):
    if d is None: continue
    d.mkdir(parents=True, exist_ok=True)
    if art:
        (d / "assets").mkdir(exist_ok=True)
        for f in ("site.css", "charts.js"): shutil.copy(ROOT / "assets" / f, d / "assets" / f)
    for fn, (t, ds, body, sc) in DEF.items():
        open(d / fn, "w").write(page(fn, t, ds, body, sc, full=not (art and fn == "index.html")))
print("built", O["in_total"], O["us_total"], O["ipo_c"], O["ipo_t"], [a for a in in_annual if a["year"] >= 2025])
