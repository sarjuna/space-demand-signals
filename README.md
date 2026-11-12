# Space Demand Signals: India and the United States

Open-data dashboards testing whether public attention, online sentiment, stock prices and policy activity track the real build-out of the space economy (launches, satellites, licensed operations and capital) in India and the United States.

Headline output: the **Space Signals Index**, a quarterly comparison of public attention with the actual build-out (launches and commercial satellites) for each country, with a fixed 2016–2025 baseline.

**Live site:** https://sarjuna.github.io/space-demand-signals/

Author: Dr Arjuna Sathiaseelan, Space Economy Initiative, Cambridge Judge Business School. Data pulled 5–6 Nov 2026.

## Repository layout

```
index.html, india.html, us.html, methods.html   the website (GitHub Pages serves these from the root)
assets/                                         shared stylesheet and chart helpers
data/
  README.md                                     every raw and derived file: source, contents
  raw/india/   raw/us/   raw/shared/            source files exactly as pulled, each with a header (source, query, date)
  derived/india/   derived/us/   derived/index/ analysis outputs; dash.json, us_page.json and index_page.json are embedded in the pages
  csv/india/   csv/us/   csv/shared/            analysis-ready CSV tables (every raw value is in them)
  csv/README.md                                 data dictionary and notes for time-series work
code/
  paths.py                                      repository paths used by every script
  india/                                        load.py, analyse.py, parl.py, make_dash.py
  us/                                           load_us.py, analyse_us.py, make_page_data.py
  index/                                        build_index.py (Space Signals Index)
  site/                                         build.py (pages), export_csv.py (CSVs), audit_csv.py (raw-to-CSV check),
                                                verify.py (figure check), src/ (page sources)
run_all.sh                                      re-runs everything from the raw files
requirements.txt
```

## Reproduce

```
pip install -r requirements.txt
./run_all.sh
```

`run_all.sh` runs both analyses, rebuilds the page data, the four pages and the CSVs, then checks every hard-coded figure in the page text against the data. It works from any clone location.

## Data at a glance

- **India:** GCAT launches and satellites; Google Trends (India); Wikipedia page views; NSE prices for seven listed aerospace and defence suppliers; Lok Sabha questions; reported start-up funding; GDELT news tone.
- **United States:** GCAT launches and satellites; Google Trends (US); Wikipedia page views; prices for ten NewSpace firms, SpaceX, the UFO ETF and the S&P 500; Congress bills; the Federal Register; SEC EDGAR filings; FAA licensed operations.
- **Both:** Hacker News story titles with VADER sentiment.

See `data/README.md` for every file and `data/csv/README.md` for the CSV columns.

## Cite

Sathiaseelan, A. (2026). *Space Demand Signals: Space Signals Index for India and the United States* [Dashboard and dataset]. Space Economy Initiative, Cambridge Judge Business School, University of Cambridge. https://sarjuna.github.io/space-demand-signals/
