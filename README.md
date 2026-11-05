# India Space Demand Signals

Open-data dashboard testing whether public, investor and parliamentary discourse about India's space sector tracks real build-out (launches, commercial satellites, authorisations, private capital).

**Live page:** https://YOUR-USERNAME.github.io/india-space-demand-signals/

Author: Dr Arjuna Sathiaseelan, Space Economy Initiative, Cambridge Judge Business School.

## Contents
- `index.html` — the dashboard (all data embedded; no build step)
- `data/` — raw series as pulled on 5 Nov 2026 (Wikipedia, Google Trends India, GCAT, NSE prices, Lok Sabha questions, funding vintages, GDELT)
- `analysis/` — Python code for the indices, regressions, Granger tests and parliamentary topic counts

## Reproduce
```
pip install pandas scipy statsmodels
cd analysis
python3 analyse.py && python3 parl.py
```
