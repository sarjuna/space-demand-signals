"""Assemble the multi-page site. Writes two variants:
   out_gh/       GitHub Pages: every page a full HTML document
   out_art/      Artifact: index.html without the document skeleton (the host adds it), other pages full documents
"""
import json, math, os, re, shutil

B = "/home/claude/site_build/"
IN_SRC = "/home/claude/india-space-demand-signals/index.html"
CHART = '<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>'
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans+Condensed:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">')
LOGO = ('<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.2" fill="var(--accent)"/>'
        '<ellipse cx="10" cy="10" rx="8.6" ry="3.6" fill="none" stroke="var(--ink-2)" stroke-width="1.3" transform="rotate(-28 10 10)"/></svg>')
PAGES = [("index.html", "Overview"), ("india.html", "India"), ("us.html", "United States"), ("methods.html", "Methods &amp; data")]


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
U = json.load(open(B + "us_page.json"))
us_body = open(B + "us_body.html").read()
us_js = open(B + "us_script.js").read()
us_scripts = f'{data_tag(U)}\n{CHART}\n<script src="assets/charts.js"></script>\n<script>\n{us_js}\n</script>'

# ---------- India (ported from the standalone dashboard) ----------
src = open(IN_SRC).read()
in_body = src[src.index('<div class="wrap">'):src.index('<script id="data"')]
in_body = in_body.replace("<h1>India Space Demand Signals</h1>", "<h1>India</h1>")
in_scripts = src[src.index('<script id="data"'):src.rindex("</body>")].strip()
assert "chart.umd.min.js" in in_scripts

# ---------- Overview ----------
IN = json.load(open("/home/claude/analysis/dash.json"))
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
ov_scripts = f'{data_tag(O)}\n{CHART}\n<script src="assets/charts.js"></script>\n<script>\n{open(B + "overview_script.js").read()}\n</script>'

DEF = {
    "index.html": ("Space Demand Signals", "Do attention, sentiment, markets and policy track the real space build-out? India and US compared on public data.",
                   open(B + "overview_body.html").read(), ov_scripts),
    "india.html": ("India · Space Demand Signals", "India: does public, investor and parliamentary discourse track launches, commercial satellites and private capital?", in_body, in_scripts),
    "us.html": ("United States · Space Demand Signals", "United States: do attention, sentiment, NewSpace stock prices and federal policy track launches, satellites and licensed operations?", us_body, us_scripts),
    "methods.html": ("Methods · Space Demand Signals", "Sources, methods, verification and limitations for the India and US space demand-signal dashboards.",
                     open(B + "methods_body.html").read(), ""),
}

for out, art in (("out_gh", False), ("out_art", True)):
    d = B + out + "/"
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d + "assets")
    for f in ("site.css", "charts.js"): shutil.copy(B + "assets/" + f, d + "assets/" + f)
    for fn, (t, ds, body, sc) in DEF.items():
        open(d + fn, "w").write(page(fn, t, ds, body, sc, full=not (art and fn == "index.html")))
print("built", O["in_total"], O["us_total"], O["ipo_c"], O["ipo_t"], [a for a in in_annual if a["year"] >= 2025])
