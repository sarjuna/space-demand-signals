# India Space Demand Signals — replication pack (pulled 5 Nov 2026)

## Raw data (data/)
| File | Source | Notes |
|---|---|---|
| wiki_pageviews.txt | Wikimedia REST pageviews API, en.wikipedia, agent=user, monthly 2015-07..2026-10 | 13 articles + total en-wiki views. Verified against API by sum and index-weighted checksum. |
| gtrends_india.txt | Google Trends explore API, geo=IN, monthly 2016-01..2026-10 | 10 terms, each on its own 0-100 scale. Checksummed against pull. |
| gcat_india_launches.txt | GCAT launch.tsv (planet4589.org), updated 2026-11-02 | Launches from Indian sites / Indian agencies, 2015+. |
| gcat_india_payloads.txt | GCAT satcat.tsv, updated 2026-11-02 | Indian-state payloads; commercial/academic/govt classes. 2026 incomplete. |
| basket_raw.txt | Yahoo Finance chart API (NSE) | Monthly equal-weight log return of 7 space suppliers and Nifty 50. Label month = actual month − 1 (handled in load.py). |
| event_study.txt | Yahoo Finance daily, computed in browser | Market-adjusted CARs for 9 dated events. |
| lok_sabha_space_questions.txt | Digital Sansad API (ministryCode=28) | 602 Department of Space questions, session totals, topic counts, NewSpace titles. |
| funding_vintages.txt | Press reports citing Tracxn; Lok Sabha replies | Annual funding by publication date; IN-SPACe pipeline counts. URLs included. |
| gdelt_isro_tone_3m.txt | GDELT DOC 2.0 API, timelinetone, query "isro" | Rolling 3-month window only. |

## Code (analysis/)
- load.py — parsers
- analyse.py — indices (PAI, NAI), OLS with HAC SEs, Granger tests, cross-correlations → out.json
- parl.py — parliamentary topic aggregation and Fisher test → parl.json
- india-space-demand-signals.html — the dashboard with all data embedded

Run: `pip install pandas scipy statsmodels && cd analysis && python3 analyse.py && python3 parl.py`

## Not collected
X (paid API), Reddit (blocked; Pushshift mirror down), GDELT history (needs BigQuery), Tracxn deal-level data (paywalled), ITU filings (subscription).
