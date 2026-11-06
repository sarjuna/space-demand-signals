# Space Demand Signals: India and the United States

Open-data dashboards testing whether public attention, online sentiment, stock prices and policy activity track the real build-out of the space economy (launches, satellites, licensed operations and capital) in India and the United States.

**Live site:** https://sarjuna.github.io/space-demand-signals/

Author: Dr Arjuna Sathiaseelan, Space Economy Initiative, Cambridge Judge Business School.

## Pages
- `index.html`: overview and India–US comparison
- `india.html`: India dashboard
- `us.html`: United States dashboard
- `methods.html`: sources, methods, verification and limitations
- `assets/`: shared stylesheet and chart helpers

All data is embedded in the pages; there is no build step to view the site.

## Data and code
- `data/`: raw India series (pulled 5 Nov 2026)
- `data_us/`: raw US series (pulled 6 Nov 2026): GCAT launches and satellites, Google Trends (US), Wikipedia page views, Hacker News titles and VADER scores, Yahoo Finance prices and event study, Congress bills (GovTrack), Federal Register, SEC EDGAR full-text counts
- `analysis/`: India analysis (Python)
- `analysis_us/`: US analysis (Python); `analyse_us.py` writes `us.json`
- `site_src/`: page sources, `build.py` (assembles the pages) and `verify.py` (checks every hard-coded figure in the page text against the data)

Each raw file starts with a header giving its source, query and pull date.

## Reproduce
```
pip install pandas numpy scipy statsmodels
cd analysis && python3 analyse.py && python3 parl.py
cd ../analysis_us && python3 analyse_us.py
```
Note: the scripts use absolute paths from the original workspace (`/home/claude/...`); edit the path constants at the top of `load.py`, `load_us.py` and `build.py` to your checkout.
